<?php

namespace FivePrayer\Core\API\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\API\BruteForceSettings;

/**
 * Trait KeyValidationTrait
 *
 * Handles API key validation including brute-force protection and rate limiting.
 * Extracted from ApiKeyManager for code organization.
 */
trait KeyValidationTrait
{
    /**
     * Validate an API key for the current request.
     *
     * @param string $api_key Raw key presented by the caller.
     * @param string $route   REST route being called, when known. Passing it lets
     *                        endpoint restrictions match the actual route instead
     *                        of a guessed value from REQUEST_URI.
     * @return array{valid: bool, error?: string, key_data?: object}
     */
    public function validate_key(string $api_key, string $route = ''): array
    {
        global $wpdb;

        // ---------------------------------------------------------------
        // 1. Brute force check — track invalid attempts per IP
        // ---------------------------------------------------------------
        $request_ip = SecurityHelper::get_client_ip();

        if (BruteForceSettings::is_enabled() && $request_ip) {
            if (BruteForceSettings::is_ip_blocked($request_ip)) {
                Logger::warning('Brute force blocked — too many failed attempts from IP: ' . $request_ip, 'ApiKeyManager');
                return [
                    'valid' => false,
                    'error' => 'Too many failed attempts. Please try again later.',
                ];
            }
        }

        // ---------------------------------------------------------------
        // 2. Table existence check
        // ---------------------------------------------------------------
        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot validate API key.', 'ApiKeyManager');
            return ['valid' => false, 'error' => 'API keys table does not exist'];
        }

        $api_key = trim($api_key);

        if ('' === $api_key) {
            // decrypt_key() returns '' for rows it cannot read (legacy hashes,
            // rotated salts, damaged data) and hash_equals('', '') is true, so an
            // empty credential must never reach the comparison loop.
            Logger::warning('Empty API key rejected', 'ApiKeyManager');
            BruteForceSettings::track_failed_attempt($request_ip);
            return ['valid' => false, 'error' => 'Invalid API key'];
        }

        Logger::debug('Validating API key: ' . $this->key_fingerprint($api_key), 'ApiKeyManager');

        // ---------------------------------------------------------------
        // 3. Look up the key
        // ---------------------------------------------------------------
        // Key validation runs on every authenticated request and has to decrypt
        // each stored key to compare it, so the row set is cached and dropped
        // whenever a key is written through ApiKeyManager.
        $stored_keys = wp_cache_get(self::AUTH_CACHE_KEY, self::CACHE_GROUP);

        if (!is_array($stored_keys)) {
            $stored_keys = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $wpdb->prepare("SELECT id, api_key, name, description, status, created_at, expires_at, last_used, last_used_ip, last_used_user_agent, last_used_referer, usage_count, allowed_domains, allowed_ips, allowed_endpoints, rate_limit_per_hour, created_by FROM %i", $this->table_name)
            );
            wp_cache_set(self::AUTH_CACHE_KEY, $stored_keys, self::CACHE_GROUP, self::DATA_CACHE_TTL);
        }

        $key_data = null;
        foreach ($stored_keys as $row) {
            $decrypted = $this->decrypt_key($row->api_key);

            // An unreadable row must never match a credential, even an empty one.
            if ('' === $decrypted) {
                continue;
            }

            if (hash_equals($decrypted, $api_key)) {
                $key_data = $row;
                break;
            }
        }

        if (!$key_data) {
            Logger::warning('Invalid API key provided: ' . $this->key_fingerprint($api_key), 'ApiKeyManager');
            BruteForceSettings::track_failed_attempt($request_ip);
            return ['valid' => false, 'error' => 'Invalid API key'];
        }

        if ($key_data->status !== 'active') {
            Logger::warning('Inactive API key attempted: ' . $key_data->name . ' (Status: ' . $key_data->status . ')', 'ApiKeyManager');
            BruteForceSettings::track_failed_attempt($request_ip);
            return ['valid' => false, 'error' => 'API key is ' . $key_data->status];
        }

        if ($key_data->expires_at && strtotime($key_data->expires_at) < time()) {
            Logger::warning('Expired API key attempted: ' . $key_data->name, 'ApiKeyManager');
            BruteForceSettings::track_failed_attempt($request_ip);
            return ['valid' => false, 'error' => 'API key has expired'];
        }

        // ---------------------------------------------------------------
        // 4. Rate limit check — enforce per-key hourly limit
        // ---------------------------------------------------------------
        if (!empty($key_data->rate_limit_per_hour) && $key_data->rate_limit_per_hour > 0) {
            $current_hour = current_time('YmdH');
            $rate_key = 'fp_rate_' . $key_data->id . '_' . $current_hour;
            $hourly_count = get_transient($rate_key);

            if ($hourly_count !== false && $hourly_count >= $key_data->rate_limit_per_hour) {
                Logger::warning('Rate limit exceeded for API key: ' . $key_data->name . ' (' . $hourly_count . '/' . $key_data->rate_limit_per_hour . ')', 'ApiKeyManager');
                return ['valid' => false, 'error' => 'Rate limit exceeded. Try again later.'];
            }
        }

        // ---------------------------------------------------------------
        // 5. Check domain/IP/endpoint permissions
        // ---------------------------------------------------------------
        $permission_granted = $this->check_key_permissions($key_data, $_SERVER, $route);
        if (!$permission_granted) {
            Logger::warning('API key permission denied for: ' . $key_data->name, 'ApiKeyManager');
            return ['valid' => false, 'error' => 'API key not permitted for this request'];
        }

        // ---------------------------------------------------------------
        // 6. Update usage statistics
        // ---------------------------------------------------------------
        $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $this->table_name,
            [
                'last_used' => current_time('mysql'),
                'last_used_ip' => $request_ip,
                'last_used_user_agent' => fiveprayer_get_server_value('HTTP_USER_AGENT'),
                'last_used_referer' => fiveprayer_get_server_value('HTTP_REFERER'),
                'usage_count' => $key_data->usage_count + 1,
            ],
            ['id' => $key_data->id],
            ['%s', '%s', '%s', '%s', '%d']
        );

        // The usage counters are display only: drop the cached copies so the
        // admin list picks the new numbers up, without re-querying on every hit.
        wp_cache_delete(self::AUTH_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::LIST_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete('fiveprayer_api_key_row_' . $key_data->id, self::CACHE_GROUP);

        // Increment hourly rate counter
        if (!empty($key_data->rate_limit_per_hour) && $key_data->rate_limit_per_hour > 0) {
            $current_hour = current_time('YmdH');
            $rate_key = 'fp_rate_' . $key_data->id . '_' . $current_hour;
            $hourly_count = get_transient($rate_key);
            if ($hourly_count === false) {
                set_transient($rate_key, 1, HOUR_IN_SECONDS);
            } else {
                set_transient($rate_key, $hourly_count + 1, HOUR_IN_SECONDS);
            }
        }

        // Reset brute force counter on success
        if ($request_ip) {
            BruteForceSettings::unblock_ip($request_ip);
        }

        Logger::info('Valid API key used: ' . $key_data->name . ' (Usage count: ' . ($key_data->usage_count + 1) . ')', 'ApiKeyManager');

        return [
            'valid' => true,
            'key_data' => $key_data,
        ];
    }

    /**
     * Short fingerprint of a presented key, for log lines.
     *
     * The first eight characters are not a fingerprint: every key this plugin
     * issues starts with the same characters, so they identify no key at all —
     * and they put part of the secret itself into a log file. A truncated hash
     * identifies the same key across log lines without revealing any of it.
     *
     * @param string $api_key Raw key presented by the caller.
     * @return string
     */
    private function key_fingerprint(string $api_key): string
    {
        return substr(hash('sha256', $api_key), 0, 8);
    }

    /**
     * Increment the brute-force counter for an IP address.
     * Blocks the IP after the configured number of failed attempts within the configured window.
     *
     * @deprecated Use BruteForceSettings::track_failed_attempt() instead.
     */
    private function track_failed_attempt(?string $brute_key): void
    {
        if (!$brute_key) {
            return;
        }

        $ip = str_replace('fp_brute_', '', $brute_key);
        BruteForceSettings::track_failed_attempt($ip);
    }
}

<?php

namespace FivePrayer\Core\API\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Trait LegacyMigrationTrait
 *
 * Handles migration of legacy SHA-256 hashed API keys to AES-256-CBC encryption.
 * Extracted from ApiKeyManager for code organization.
 */
trait LegacyMigrationTrait
{
    /**
     * Check if a stored key is in the old SHA-256 hash format.
     */
    public function is_legacy_key(string $stored): bool
    {
        // Try to decrypt – if it fails (empty), check if it looks like a SHA-256 hash
        $decrypted = $this->decrypt_key($stored);
        if ($decrypted !== '') {
            return false; // Successfully decrypted, it's a new-style key
        }

        // AES-256-CBC ciphertext is base64-encoded and will have length > 64
        // SHA-256 hashes are exactly 64 hex characters
        if (strlen($stored) === 64 && preg_match('/^[0-9a-f]{64}$/i', $stored)) {
            return true;
        }

        return false;
    }

    /**
     * Count how many legacy (SHA-256 hashed) keys exist in the database.
     */
    public function has_legacy_keys(): int
    {
        global $wpdb;

        if (!$this->table_exists()) {
            return 0;
        }

        // Same cached list the collision check and key validation use: the stored
        // keys only change through ApiKeyManager, which drops this entry.
        $stored_keys = wp_cache_get(self::STORED_CACHE_KEY, self::CACHE_GROUP);

        if (!is_array($stored_keys)) {
            $stored_keys = $wpdb->get_col($wpdb->prepare("SELECT api_key FROM %i", $this->table_name)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set(self::STORED_CACHE_KEY, $stored_keys, self::CACHE_GROUP, self::DATA_CACHE_TTL);
        }

        $count = 0;

        foreach ($stored_keys as $stored) {
            if ($this->is_legacy_key($stored)) {
                $count++;
            }
        }

        return $count;
    }

    /**
     * Migrate all legacy (SHA-256 hashed) keys by regenerating them with AES encryption.
     * Returns an array of migration results with id, name, and new key info.
     */
    public function migrate_legacy_keys(): array
    {
        global $wpdb;

        if (!$this->table_exists()) {
            return ['success' => false, 'error' => 'API keys table does not exist', 'migrated' => []];
        }

        Logger::info('Starting migration of legacy API keys', 'ApiKeyManager');

        // This runs during scheduled migrations, never per request. It uses its
        // own cache key because the selected columns differ from the cached the
        // request-time key listings, so the two must never share an entry.
        $migration_cache_key = 'fiveprayer_api_keys_migration';
        $keys                = wp_cache_get($migration_cache_key, self::CACHE_GROUP);

        if (!is_array($keys)) {
            $keys = $wpdb->get_results($wpdb->prepare("SELECT id, api_key, name, description, expires_at, created_by FROM %i", $this->table_name)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($migration_cache_key, $keys, self::CACHE_GROUP, self::DATA_CACHE_TTL);
        }

        $migrated = [];
        $errors = [];

        foreach ($keys as $key) {
            if (!$this->is_legacy_key($key->api_key)) {
                continue; // Already migrated
            }

            // Generate a new key with default prefix
            $new_key = $this->generate_unique_key();
            $new_key_encrypted = $this->encrypt_key($new_key);

            $result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $this->table_name,
                ['api_key' => $new_key_encrypted],
                ['id' => $key->id],
                ['%s'],
                ['%d']
            );

            // Replaced secrets invalidate every cached key listing.
            wp_cache_delete($migration_cache_key, self::CACHE_GROUP);
            wp_cache_delete(self::AUTH_CACHE_KEY, self::CACHE_GROUP);
            wp_cache_delete(self::STORED_CACHE_KEY, self::CACHE_GROUP);
            wp_cache_delete(self::LIST_CACHE_KEY, self::CACHE_GROUP);
            wp_cache_delete('fiveprayer_api_key_secret_' . $key->id, self::CACHE_GROUP);

            if ($result === false) {
                Logger::error('Failed to migrate legacy key ID ' . $key->id . ': ' . $wpdb->last_error, 'ApiKeyManager');
                $errors[] = ['id' => $key->id, 'name' => $key->name, 'error' => $wpdb->last_error];
            } else {
                Logger::info('Migrated legacy key ID ' . $key->id . ' (' . $key->name . ')', 'ApiKeyManager');
                $migrated[] = [
                    'id' => $key->id,
                    'name' => $key->name,
                    'new_key' => $new_key,
                ];
            }
        }

        Logger::info('Legacy key migration complete. Migrated: ' . count($migrated) . ', Errors: ' . count($errors), 'ApiKeyManager');

        return [
            'success' => empty($errors),
            'migrated_count' => count($migrated),
            'error_count' => count($errors),
            'migrated' => $migrated,
            'errors' => $errors,
        ];
    }

    /**
     * Alias for backward compatibility – regenerate all keys flagged as legacy.
     */
    public function regenerate_legacy_keys(): array
    {
        return $this->migrate_legacy_keys();
    }
}

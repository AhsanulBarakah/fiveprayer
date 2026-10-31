<?php

namespace FivePrayer\Core\API;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

class ApiKeyManager
{
    use \FivePrayer\Core\API\Traits\EncryptionTrait;
    use \FivePrayer\Core\API\Traits\KeyPermissionTrait;
    use \FivePrayer\Core\API\Traits\LegacyMigrationTrait;
    use \FivePrayer\Core\API\Traits\KeyValidationTrait;
    use \FivePrayer\Core\API\Traits\KeyCrudTrait;

    private const TABLE_NAME = 'fp_api_keys';
    private const KEY_LENGTH = 32;
    private const CIPHER = 'aes-256-cbc';

    /**
     * Object cache group shared by the whole plugin.
     */
    private const CACHE_GROUP = 'fiveprayer';

    /**
     * Short TTL for schema introspection: this class must observe a table it
     * creates itself, so every entry here expires quickly.
     */
    private const SCHEMA_CACHE_TTL = 60;

    /**
     * TTL for cached API key rows. Every write path in this class deletes the
     * entries it touches, so the TTL is only a safety net.
     */
    private const DATA_CACHE_TTL = 300;

    /**
     * Cache keys holding API key data.
     */
    private const TABLE_EXISTS_CACHE_KEY = 'fiveprayer_api_keys_table_exists';
    private const COLUMNS_CACHE_KEY = 'fiveprayer_api_keys_columns';
    private const LIST_CACHE_KEY = 'fiveprayer_api_keys_list';
    private const STORED_CACHE_KEY = 'fiveprayer_api_keys_stored';
    private const AUTH_CACHE_KEY = 'fiveprayer_api_keys_auth';

    private $table_name;
    private $encryption_key;

    public function __construct()
    {
        global $wpdb;
        $this->table_name = $wpdb->prefix . self::TABLE_NAME;
        $this->encryption_key = $this->derive_encryption_key();
    }

    private function table_exists(): bool
    {
        global $wpdb;

        // Only the positive result is cached: a missing table must always be
        // reported so the "run activation" error keeps showing up.
        if (true === wp_cache_get(self::TABLE_EXISTS_CACHE_KEY, self::CACHE_GROUP)) {
            return true;
        }

        $table_name = $wpdb->prefix . self::TABLE_NAME;
        $result = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table_name)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

        if (!is_null($result)) {
            wp_cache_set(self::TABLE_EXISTS_CACHE_KEY, true, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
            return true;
        }

        return false;
    }

    /**
     * Get the column list of the API keys table from cache.
     *
     * The table layout is probed before almost every operation, so the result is
     * cached for a short window instead of running SHOW COLUMNS each time.
     *
     * @return array<string>
     */
    private function table_columns(): array
    {
        global $wpdb;

        $columns = wp_cache_get(self::COLUMNS_CACHE_KEY, self::CACHE_GROUP);

        if (is_array($columns)) {
            return $columns;
        }

        $columns = $wpdb->get_col($wpdb->prepare("SHOW COLUMNS FROM %i", $this->table_name), 0); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        wp_cache_set(self::COLUMNS_CACHE_KEY, $columns, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);

        return is_array($columns) ? $columns : [];
    }

    /**
     * Drop every cached copy of the API key data after a write.
     */
    private function flush_key_caches(?int $key_id = null): void
    {
        wp_cache_delete(self::LIST_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::STORED_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::AUTH_CACHE_KEY, self::CACHE_GROUP);

        if ($key_id !== null) {
            wp_cache_delete('fiveprayer_api_key_row_' . $key_id, self::CACHE_GROUP);
            // Plaintext is no longer cached; the entry is still cleared so an
            // upgrade removes anything an older version left behind.
            wp_cache_delete('fiveprayer_api_key_secret_' . $key_id, self::CACHE_GROUP);
        }
    }

    public function generate_key(string $name, string $description = '', ?string $expires_at = null, array $permissions = [], string $prefix = 'fp_'): array
    {
        global $wpdb;

        // Check if table exists before attempting to use it
        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Please run plugin activation.', 'ApiKeyManager');
            return ['success' => false, 'error' => 'API keys table does not exist'];
        }

        // A keyed hash needs the site's salts. Without them every install would
        // share the same key material, so no key is created at all.
        if (!$this->has_encryption_salts()) {
            Logger::error('Cannot create an API key: AUTH_KEY and SECURE_AUTH_KEY are not set in wp-config.php.', 'ApiKeyManager');
            return ['success' => false, 'error' => 'AUTH_KEY and SECURE_AUTH_KEY must be set in wp-config.php before API keys can be created.'];
        }

        Logger::info('Attempting to generate new API key for: ' . $name, 'ApiKeyManager');

        $api_key = $this->generate_unique_key($prefix);

        // Check which columns exist in the table. A table created by an older
        // version has no key_hash column until the schema upgrade has run.
        $columns = $this->table_columns();
        if (!in_array('key_hash', $columns, true)) {
            Logger::error('API keys table is missing the key_hash column. Please run plugin activation.', 'ApiKeyManager');
            return ['success' => false, 'error' => 'API keys table needs an upgrade'];
        }

        $has_permissions = in_array('allowed_domains', $columns);

        // Build data and format arrays together to keep them in sync. Only the
        // hash is stored: the plain key exists in this response and nowhere else.
        $data = [
            'api_key' => null,
            'key_hash' => $this->hash_key($api_key),
            'name' => sanitize_text_field($name),
            'description' => sanitize_textarea_field($description),
            'created_by' => get_current_user_id(),
        ];
        $format = ['%s', '%s', '%s', '%s', '%d'];

        // Add optional fields only if they exist (append incrementally to keep format in sync)
        if ($has_permissions) {
            $allowed_domains = isset($permissions['domains']) ? implode(',', $permissions['domains']) : null;
            $allowed_ips = isset($permissions['ips']) ? implode(',', $permissions['ips']) : null;
            $allowed_endpoints = isset($permissions['endpoints']) ? implode(',', $permissions['endpoints']) : null;
            $rate_limit = isset($permissions['rate_limit']) ? intval($permissions['rate_limit']) : 1000;
            
            $data['allowed_domains'] = $allowed_domains;
            $data['allowed_ips'] = $allowed_ips;
            $data['allowed_endpoints'] = $allowed_endpoints;
            $data['rate_limit_per_hour'] = $rate_limit;
            $format[] = '%s';
            $format[] = '%s';
            $format[] = '%s';
            $format[] = '%d';
        }

        if ($expires_at) {
            $data['expires_at'] = $expires_at;
        } else {
            $data['expires_at'] = null;
        }
        $format[] = '%s';

        $result = $wpdb->insert($this->table_name, $data, $format); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

        if ($result === false) {
            Logger::error('Failed to generate API key: ' . $wpdb->last_error, 'ApiKeyManager');
            return ['success' => false, 'error' => $wpdb->last_error];
        }

        // A new key changes every cached key listing.
        wp_cache_delete(self::LIST_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::STORED_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::AUTH_CACHE_KEY, self::CACHE_GROUP);

        Logger::info('Successfully generated new API key: ' . $this->key_fingerprint($api_key), 'ApiKeyManager');

        return [
            'success' => true,
            'api_key' => $api_key,
            'id' => $wpdb->insert_id,
        ];
    }

    public function get_keys(): array
    {
        global $wpdb;

        // Check if table exists before attempting to use it
        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot retrieve API keys.', 'ApiKeyManager');
            return [];
        }

        Logger::debug('Retrieving all API keys from database', 'ApiKeyManager');

        // Get all actual columns that exist in the database
        $columns = $this->table_columns();
        
        // Build list of fields to select based on what's actually in the table
        $select_fields = [];
        $always_available = ['id', 'name', 'description', 'status', 'created_at', 'expires_at', 'usage_count'];
        foreach ($always_available as $field) {
            if (in_array($field, $columns)) {
                $select_fields[] = $field;
            }
        }
        
        // Add last_used if available
        if (in_array('last_used', $columns)) {
            $select_fields[] = 'last_used';
        }
        
        // Add usage tracking fields if available
        $usage_fields = ['last_used_ip', 'last_used_user_agent', 'last_used_referer'];
        foreach ($usage_fields as $field) {
            if (in_array($field, $columns)) {
                $select_fields[] = $field;
            }
        }
        
        // Add permission fields if available
        $permission_fields = ['allowed_domains', 'allowed_ips', 'allowed_endpoints', 'permission_level', 'rate_limit_per_hour'];
        foreach ($permission_fields as $field) {
            if (in_array($field, $columns)) {
                $select_fields[] = $field;
            }
        }

        if (empty($select_fields)) {
            Logger::error('No valid columns found in API keys table', 'ApiKeyManager');
            return [];
        }
        
        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- $select_fields is built from a fixed allow-list; the table name uses the %i placeholder.
        $sql = $wpdb->prepare("SELECT " . implode(', ', array_map('esc_sql', $select_fields)) . " FROM %i ORDER BY created_at DESC", $this->table_name);

        $cached_keys = wp_cache_get(self::LIST_CACHE_KEY, self::CACHE_GROUP);

        if (is_array($cached_keys)) {
            return $cached_keys;
        }
        
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared -- $sql was prepared above.
        $keys = $wpdb->get_results($sql);
        wp_cache_set(self::LIST_CACHE_KEY, $keys, self::CACHE_GROUP, self::DATA_CACHE_TTL);

        Logger::info('Retrieved ' . count($keys) . ' API keys from database', 'ApiKeyManager');

        return $keys;
    }

    public function revoke_key(int $key_id): bool
    {
        global $wpdb;

        // Check if table exists before attempting to use it
        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot revoke API key.', 'ApiKeyManager');
            return false;
        }

        Logger::info('Revoking API key with ID: ' . $key_id, 'ApiKeyManager');

        $result = (bool) $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $this->table_name,
            ['status' => 'revoked'],
            ['id' => $key_id],
            ['%s'],
            ['%d']
        );

        wp_cache_delete(self::LIST_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::AUTH_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete('fiveprayer_api_key_row_' . $key_id, self::CACHE_GROUP);

        if ($result) {
            Logger::info('Successfully revoked API key with ID: ' . $key_id, 'ApiKeyManager');
        } else {
            Logger::error('Failed to revoke API key with ID: ' . $key_id . '. Error: ' . $wpdb->last_error, 'ApiKeyManager');
        }

        return $result;
    }

    public function unrevoke_key(int $key_id): bool
    {
        global $wpdb;

        // Check if table exists before attempting to use it
        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot unrevoke API key.', 'ApiKeyManager');
            return false;
        }

        Logger::info('Unrevoking API key with ID: ' . $key_id, 'ApiKeyManager');

        $result = (bool) $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $this->table_name,
            ['status' => 'active'],
            ['id' => $key_id],
            ['%s'],
            ['%d']
        );

        wp_cache_delete(self::LIST_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::AUTH_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete('fiveprayer_api_key_row_' . $key_id, self::CACHE_GROUP);

        if ($result) {
            Logger::info('Successfully unrevoked API key with ID: ' . $key_id, 'ApiKeyManager');
        } else {
            Logger::error('Failed to unrevoke API key with ID: ' . $key_id . '. Error: ' . $wpdb->last_error, 'ApiKeyManager');
        }

        return $result;
    }

    public function delete_key(int $key_id): bool
    {
        global $wpdb;

        // Check if table exists before attempting to use it
        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot delete API key.', 'ApiKeyManager');
            return false;
        }

        Logger::info('Deleting API key with ID: ' . $key_id, 'ApiKeyManager');

        $result = (bool) $wpdb->delete( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $this->table_name,
            ['id' => $key_id],
            ['%d']
        );

        wp_cache_delete(self::LIST_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::STORED_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::AUTH_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete('fiveprayer_api_key_row_' . $key_id, self::CACHE_GROUP);
        wp_cache_delete('fiveprayer_api_key_secret_' . $key_id, self::CACHE_GROUP);

        if ($result) {
            Logger::info('Successfully deleted API key with ID: ' . $key_id, 'ApiKeyManager');
        } else {
            Logger::error('Failed to delete API key with ID: ' . $key_id . '. Error: ' . $wpdb->last_error, 'ApiKeyManager');
        }

        return $result;
    }

    public function get_key(int $key_id): ?object
    {
        global $wpdb;

        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot retrieve API key.', 'ApiKeyManager');
            return null;
        }

        Logger::debug('Retrieving API key with ID: ' . $key_id, 'ApiKeyManager');

        $row_cache_key = 'fiveprayer_api_key_row_' . $key_id;
        $cached_row    = wp_cache_get($row_cache_key, self::CACHE_GROUP);

        if (false !== $cached_row) {
            return $cached_row;
        }

        $columns = $this->table_columns();
        $select_fields = ['id', 'name', 'description', 'status', 'created_at', 'expires_at', 'usage_count'];

        $optional_fields = ['last_used', 'last_used_ip', 'last_used_user_agent', 'last_used_referer',
                           'allowed_domains', 'allowed_ips', 'allowed_endpoints', 'permission_level', 'rate_limit_per_hour'];
        foreach ($optional_fields as $field) {
            if (in_array($field, $columns)) {
                $select_fields[] = $field;
            }
        }

        // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- $select_fields is built from a fixed allow-list; the table name and ID use placeholders.
        $sql = $wpdb->prepare("SELECT " . implode(', ', array_map('esc_sql', $select_fields)) . " FROM %i WHERE id = %d", $this->table_name, $key_id);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared -- $sql was prepared above.
        $row = $wpdb->get_row($sql);
        wp_cache_set($row_cache_key, $row, self::CACHE_GROUP, self::DATA_CACHE_TTL);

        return $row;
    }

    public function update_key(int $key_id, array $data): array
    {
        global $wpdb;

        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot update API key.', 'ApiKeyManager');
            return ['success' => false, 'error' => 'API keys table does not exist'];
        }

        Logger::info('Updating API key with ID: ' . $key_id, 'ApiKeyManager');

        $update_data = [];
        $format = [];

        if (isset($data['name'])) {
            $update_data['name'] = sanitize_text_field($data['name']);
            $format[] = '%s';
        }
        if (isset($data['description'])) {
            $update_data['description'] = sanitize_textarea_field($data['description']);
            $format[] = '%s';
        }
        if (isset($data['expires_at'])) {
            $update_data['expires_at'] = $data['expires_at'] ?: null;
            $format[] = '%s';
        }
        if (isset($data['allowed_domains'])) {
            $update_data['allowed_domains'] = $data['allowed_domains'];
            $format[] = '%s';
        }
        if (isset($data['allowed_ips'])) {
            $update_data['allowed_ips'] = $data['allowed_ips'];
            $format[] = '%s';
        }
        if (isset($data['allowed_endpoints'])) {
            $update_data['allowed_endpoints'] = $data['allowed_endpoints'];
            $format[] = '%s';
        }
        if (isset($data['rate_limit_per_hour'])) {
            $update_data['rate_limit_per_hour'] = intval($data['rate_limit_per_hour']);
            $format[] = '%d';
        }
        if (empty($update_data)) {
            return ['success' => false, 'error' => 'No data provided for update'];
        }

        $result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $this->table_name,
            $update_data,
            ['id' => $key_id],
            $format,
            ['%d']
        );

        wp_cache_delete(self::LIST_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete(self::AUTH_CACHE_KEY, self::CACHE_GROUP);
        wp_cache_delete('fiveprayer_api_key_row_' . $key_id, self::CACHE_GROUP);

        if ($result === false) {
            Logger::error('Failed to update API key: ' . $wpdb->last_error, 'ApiKeyManager');
            return ['success' => false, 'error' => $wpdb->last_error];
        }

        Logger::info('Successfully updated API key with ID: ' . $key_id, 'ApiKeyManager');

        return ['success' => true];
    }

    public function regenerate_key(int $key_id): array
    {
        global $wpdb;

        // Check if table exists before attempting to use it
        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot regenerate API key.', 'ApiKeyManager');
            return ['success' => false, 'error' => 'API keys table does not exist'];
        }

        Logger::info('Regenerating API key with ID: ' . $key_id, 'ApiKeyManager');

        // Get existing key data
        $existing_cache_key = 'fiveprayer_api_key_meta_' . $key_id;
        $existing           = wp_cache_get($existing_cache_key, self::CACHE_GROUP);

        if (false === $existing) {
            $existing = $wpdb->get_row($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                "SELECT name, description, expires_at, created_by FROM %i WHERE id = %d",
                $this->table_name,
                $key_id
            ));
            wp_cache_set($existing_cache_key, $existing, self::CACHE_GROUP, self::DATA_CACHE_TTL);
        }

        if (!$existing) {
            Logger::error('API key not found for regeneration: ' . $key_id, 'ApiKeyManager');
            return ['success' => false, 'error' => 'API key not found'];
        }

        if (!$this->has_encryption_salts()) {
            return ['success' => false, 'error' => 'AUTH_KEY and SECURE_AUTH_KEY must be set in wp-config.php before API keys can be created.'];
        }

        // Generate new key (use existing name as hint for prefix, but default to fp_)
        $new_key = $this->generate_unique_key();

        // Only the hash replaces the old value; the plaintext is returned once.
        $result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $this->table_name,
            ['api_key' => null, 'key_hash' => $this->hash_key($new_key)],
            ['id' => $key_id],
            ['%s', '%s'],
            ['%d']
        );

        // The stored secret changed, so every cached representation is stale.
        $this->flush_key_caches($key_id);
        wp_cache_delete($existing_cache_key, self::CACHE_GROUP);

        if ($result === false) {
            Logger::error('Failed to regenerate API key: ' . $wpdb->last_error, 'ApiKeyManager');
            return ['success' => false, 'error' => $wpdb->last_error];
        }

        Logger::info('Successfully regenerated API key with ID: ' . $key_id, 'ApiKeyManager');

        return [
            'success' => true,
            'api_key' => $new_key,
            'id' => $key_id,
        ];
    }

    /**
     * Legacy accessor for the plaintext key by ID.
     *
     * Keys are stored as a keyed hash, so the plaintext no longer exists on the
     * server after the creation response. This method is kept so older callers
     * fail closed instead of erroring: it always returns null.
     *
     * @deprecated 3.1.0 Keys are shown once, when they are created.
     */
    public function get_full_key(int $key_id): ?string
    {
        return null;
    }

    /**
     * One-time migration from reversible storage to keyed hashes.
     *
     * Reads every row that still carries ciphertext, decrypts it once with the
     * legacy method, writes its hash and clears the ciphertext. Rows whose
     * value cannot be decrypted (legacy SHA-256 hashes, rotated salts) keep
     * their value and no hash: they cannot be used, and has_legacy_keys() keeps
     * reporting them so the admin can regenerate them explicitly.
     *
     * @return int|false Number of rows hashed, or false when the salts are missing.
     */
    public function migrate_existing_keys_to_hashes()
    {
        global $wpdb;

        if (!$this->table_exists()) {
            return 0;
        }

        $columns = $this->table_columns();
        if (!in_array('key_hash', $columns, true) || !in_array('api_key', $columns, true)) {
            return 0;
        }

        if (!$this->has_encryption_salts()) {
            Logger::warning('Skipping API key hash migration: AUTH_KEY and SECURE_AUTH_KEY are not set.', 'ApiKeyManager');
            return false;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- One-time migration; only this run reads the ciphertext.
        $rows = $wpdb->get_results($wpdb->prepare(
            "SELECT id, api_key FROM %i WHERE key_hash IS NULL AND api_key IS NOT NULL AND api_key <> ''",
            $this->table_name
        ));

        $migrated = 0;

        foreach ($rows as $row) {
            $plaintext = $this->decrypt_key((string) $row->api_key);

            if ('' === $plaintext) {
                Logger::warning('API key ID ' . $row->id . ' could not be decrypted and must be regenerated.', 'ApiKeyManager');
                continue;
            }

            $updated = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $this->table_name,
                ['key_hash' => $this->hash_key($plaintext), 'api_key' => null],
                ['id' => (int) $row->id],
                ['%s', '%s'],
                ['%d']
            );

            if (false !== $updated) {
                ++$migrated;
            }
        }

        $this->flush_key_caches();

        Logger::info('API key hash migration hashed ' . $migrated . ' key(s).', 'ApiKeyManager');

        return $migrated;
    }

    private function generate_unique_key(string $prefix = 'fp_'): string
    {
        Logger::debug('Generating unique API key with prefix: ' . $prefix, 'ApiKeyManager');

        // Sanitize prefix: allow alphanumeric, underscores, hyphens – strip anything else
        $prefix = preg_replace('/[^a-zA-Z0-9_-]/', '', $prefix);
        if ($prefix === '') {
            $prefix = 'fp';
        }
        // Limit prefix to 30 chars to ensure the encrypted key fits within the varchar(255) column
        $prefix = substr($prefix, 0, 30);
        // Ensure it ends with _ if it doesn't already (for readability)
        if (substr($prefix, -1) !== '_') {
            $prefix .= '_';
        }

        $attempts = 0;
        do {
            $key = $prefix . bin2hex(random_bytes(self::KEY_LENGTH / 2));
            $attempts++;

            if ($attempts > 1) {
                Logger::debug('Collision detected, regenerating API key (attempt ' . $attempts . ')', 'ApiKeyManager');
            }
        } while ($this->key_exists($key));

        Logger::debug('Successfully generated unique API key after ' . $attempts . ' attempt(s)', 'ApiKeyManager');

        return $key;
    }

    private function key_exists(string $api_key): bool
    {
        global $wpdb;

        // Check if table exists before attempting to use it
        if (!$this->table_exists()) {
            Logger::error('API keys table does not exist. Cannot check for key existence.', 'ApiKeyManager');
            return false;
        }

        // A single indexed lookup against the unique key_hash column replaces
        // decrypting every stored key to compare it.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Collision check on the write path; the unique index makes it cheap.
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM %i WHERE key_hash = %s LIMIT 1",
            $this->table_name,
            $this->hash_key($api_key)
        ));

        if (null !== $existing) {
            Logger::debug('API key collision detected: ' . $this->key_fingerprint($api_key), 'ApiKeyManager');
            return true;
        }

        return false;
    }
}

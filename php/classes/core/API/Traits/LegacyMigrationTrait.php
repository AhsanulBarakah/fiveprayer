<?php

namespace FivePrayer\Core\API\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Trait LegacyMigrationTrait
 *
 * Handles keys written before the keyed-hash storage change: AES-256-CBC
 * ciphertext (decryptable once) and the older SHA-256 hex hashes (not
 * recoverable at all). A row is "legacy" while it has no key_hash.
 */
trait LegacyMigrationTrait
{
    /**
     * Whether a stored value predates the key_hash column.
     *
     * @param string $stored Value of the legacy api_key column.
     * @return bool
     */
    public function is_legacy_key(string $stored): bool
    {
        if ('' === $stored) {
            return true;
        }

        // Ciphertext from the AES era can be decrypted once; a bare 64-char hex
        // string is the even older SHA-256 hash.
        return '' !== $this->decrypt_key($stored)
            || (strlen($stored) === 64 && (bool) preg_match('/^[0-9a-f]{64}$/i', $stored));
    }

    /**
     * Count how many key rows still need a hash.
     */
    public function has_legacy_keys(): int
    {
        global $wpdb;

        if (!$this->table_exists()) {
            return 0;
        }

        $columns = $this->table_columns();
        if (!in_array('key_hash', $columns, true)) {
            return 0;
        }

        // Deliberately uncached: this feeds an admin notice and must reflect a
        // migration that just completed.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Admin notice count; must be live.
        return (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM %i WHERE key_hash IS NULL",
            $this->table_name
        ));
    }

    /**
     * Migrate key rows that still have no hash.
     *
     * Rows whose ciphertext can be decrypted get their hash and lose the
     * ciphertext. Rows that cannot be decrypted (SHA-256 hashes, rotated salts)
     * are regenerated: the old key was already unusable, and the new plaintext
     * is returned so the administrator can copy it once.
     *
     * @return array{success: bool, error?: string, migrated_count: int, error_count: int, migrated: array<int, array<string, mixed>>, errors: array<int, array<string, mixed>>}
     */
    public function migrate_legacy_keys(): array
    {
        global $wpdb;

        if (!$this->table_exists()) {
            return ['success' => false, 'error' => 'API keys table does not exist', 'migrated_count' => 0, 'error_count' => 1, 'migrated' => [], 'errors' => []];
        }

        if (!$this->has_encryption_salts()) {
            return ['success' => false, 'error' => 'AUTH_KEY and SECURE_AUTH_KEY must be set in wp-config.php', 'migrated_count' => 0, 'error_count' => 1, 'migrated' => [], 'errors' => []];
        }

        Logger::info('Starting migration of legacy API keys to keyed hashes', 'ApiKeyManager');

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- One-off admin migration.
        $keys = $wpdb->get_results($wpdb->prepare(
            "SELECT id, api_key, name FROM %i WHERE key_hash IS NULL",
            $this->table_name
        ));

        $migrated = [];
        $errors = [];

        foreach ($keys as $key) {
            $plaintext = !empty($key->api_key) ? $this->decrypt_key((string) $key->api_key) : '';
            $new_key = '';

            if ('' === $plaintext) {
                // Unrecoverable: issue a fresh key so the row can be used again.
                $new_key = $this->generate_unique_key();
                $plaintext = $new_key;
            }

            $result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $this->table_name,
                ['key_hash' => $this->hash_key($plaintext), 'api_key' => null],
                ['id' => (int) $key->id],
                ['%s', '%s'],
                ['%d']
            );

            if ($result === false) {
                Logger::error('Failed to migrate legacy key ID ' . $key->id . ': ' . $wpdb->last_error, 'ApiKeyManager');
                $errors[] = ['id' => $key->id, 'name' => $key->name, 'error' => $wpdb->last_error];
                continue;
            }

            Logger::info('Migrated legacy key ID ' . $key->id . ' (' . $key->name . ')', 'ApiKeyManager');
            $migrated[] = [
                'id' => $key->id,
                'name' => $key->name,
                'new_key' => $new_key,
            ];
        }

        $this->flush_key_caches();

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

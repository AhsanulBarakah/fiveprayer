<?php

namespace FivePrayer\Core\Database;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

class VersionManager
{
    private const MINIMUM_VERSION = '1.0.0';
    private const CURRENT_VERSION = '1.0.2';
    private const VERSION_TABLE_NAME = 'fp_prayer_settings_meta';

    /**
     * Object cache group shared by the whole plugin.
     */
    private const CACHE_GROUP = 'fiveprayer';

    /**
     * Short TTL for schema introspection (SHOW TABLES / SHOW COLUMNS).
     * These run on upgrade paths where the result is expected to change
     * within the same request, so the entries must expire quickly.
     */
    private const SCHEMA_CACHE_TTL = 60;

    /**
     * TTL for cached data rows, e.g. the stored schema version.
     */
    private const DATA_CACHE_TTL = 300;

    /**
     * Option holding a hash of the shipped default data. When the shipped
     * defaults change (new feature settings / translations), the hash differs
     * and the additive seeder runs once — no manual reset required.
     */
    private const DEFAULTS_SYNC_OPTION = 'fiveprayer_defaults_sync_hash';
    
    /**
     * Get translations data from FivePrayer_DatabaseTranslations
     * 
     * @return array
     */
    private function getTranslationsData(): array
    {
        if (class_exists('FivePrayer\\Core\\Database\\FivePrayer_DatabaseTranslations')) {
            return \FivePrayer\Core\Database\FivePrayer_DatabaseTranslations::getTranslations();
        }
        return [];
    }
    
    /**
     * Get meta settings data from FivePrayer_DatabaseMetaSettings
     * 
     * @return array
     */
    private function getMetaSettingsData(): array
    {
        if (class_exists('FivePrayer\\Core\\Database\\FivePrayer_DatabaseMetaSettings')) {
            return \FivePrayer\Core\Database\FivePrayer_DatabaseMetaSettings::getMetaSettings();
        }
        return [];
    }

    /**
     * Check if schema is up-to-date.
     */
    public function isSchemaUpToDate(): bool
    {
        global $wpdb;
        $meta_table_name = $wpdb->prefix . self::VERSION_TABLE_NAME;

        // Check if the table exists
        $table_cache_key = self::table_exists_cache_key($meta_table_name);
        $table_check     = wp_cache_get($table_cache_key, self::CACHE_GROUP);

        if (false === $table_check) {
            $table_check = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $meta_table_name)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($table_cache_key, $table_check, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }

        if ($table_check !== $meta_table_name) {
            Logger::info('Meta table does not exist', 'VersionManager');
            return false;
        }

        // Get the version from the table
        $version_cache_key = self::db_version_cache_key($meta_table_name);
        $current_version   = wp_cache_get($version_cache_key, self::CACHE_GROUP);

        if (false === $current_version) {
            $current_version = $wpdb->get_var($wpdb->prepare("SELECT version FROM %i LIMIT 1", $meta_table_name)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($version_cache_key, $current_version, self::CACHE_GROUP, self::DATA_CACHE_TTL);
        }

        Logger::debug('Current version in database: ' . ($current_version ?: 'null'), 'VersionManager');
        Logger::debug('Minimum version required: ' . self::MINIMUM_VERSION, 'VersionManager');
        Logger::debug('Current plugin version: ' . self::CURRENT_VERSION, 'VersionManager');

        // If no version exists yet, consider it outdated
        if (!$current_version) {
            Logger::debug('No version found in database', 'VersionManager');
            return false;
        }

        // Compare versions
        $is_min_version_met = version_compare($current_version, self::MINIMUM_VERSION, '>=');
        $is_current_version = version_compare($current_version, self::CURRENT_VERSION, '>=');

        Logger::debug('Minimum version met: ' . ($is_min_version_met ? 'Yes' : 'No'), 'VersionManager');
        Logger::debug('Current version met: ' . ($is_current_version ? 'Yes' : 'No'), 'VersionManager');

        // Return true only if we meet minimum version AND we're at current version
        return $is_min_version_met && $is_current_version;
    }

    /**
     * Update the database schema version and ensure default translations exist.
     */
    public function updateSchemaVersion(): void
    {
        global $wpdb;
        $meta_table_name = $wpdb->prefix . self::VERSION_TABLE_NAME;
        
        // Check if the version meta exists
        $meta_cache_key = self::meta_row_cache_key($meta_table_name, 'version');
        $version_meta   = wp_cache_get($meta_cache_key, self::CACHE_GROUP);

        if (false === $version_meta) {
            $version_meta = $wpdb->get_row($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                "SELECT id, value FROM %i WHERE `meta-key` = %s",
                $meta_table_name,
                'version'
            ));
            wp_cache_set($meta_cache_key, $version_meta, self::CACHE_GROUP, self::DATA_CACHE_TTL);
        }
        
        $current_version = $version_meta ? json_decode($version_meta->value, true) : null;
        
        // Only update if version is not set or is less than current version
        if (!$current_version || version_compare($current_version, self::CURRENT_VERSION, '<')) {
            $version_data = json_encode(self::CURRENT_VERSION);
            
            if ($version_meta) {
                // Update existing version
                $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $meta_table_name,
                    ['value' => $version_data],
                    ['id' => $version_meta->id],
                    ['%s'],
                    ['%d']
                );
            } else {
                // Insert new version
                $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $meta_table_name,
                    [
                        'meta-key' => 'version',
                        'value' => $version_data
                    ],
                    ['%s', '%s']
                );
            }

            // The version row and the derived caches are now stale.
            wp_cache_delete($meta_cache_key, self::CACHE_GROUP);
            wp_cache_delete(self::db_version_cache_key($meta_table_name), self::CACHE_GROUP);
            
            Logger::info('Updated schema version to ' . self::CURRENT_VERSION, 'VersionManager');
        }
        
        // Ensure all default data exists
        $this->ensureDefaultData();
    }
    
    /**
     * Ensure all default data exists in the database.
     *
     * Delegates to the SchemaHelper seeders, which add any missing meta and
     * translation rows without overwriting the user's saved values.
     */
    private function ensureDefaultData(): void
    {
        $schema_helper = new SchemaHelper();
        $schema_helper->insertDefaultSettings();
        $schema_helper->insertDefaultTranslations();

        if (class_exists('FivePrayer\\Core\\Helpers\\PrayerDataCache')) {
            \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
        }

        Logger::debug('Ensured default settings and translations exist', 'VersionManager');
    }

    /**
     * Add any newly shipped default data (settings meta + translations) to the
     * database when the code defaults change.
     *
     * The activation hook only runs on activation, and the version-check path
     * only runs when the plugin header version changes. Comparing a content
     * hash of the shipped defaults means replacing the plugin files adds any
     * new/renamed default rows on the next admin request — even without a
     * version bump — so the user never has to reset the data manually.
     */
    public function syncDefaultsIfChanged(): void
    {
        global $wpdb;

        // Only run in admin/cron contexts so frontend requests stay untouched.
        if (!is_admin() && !wp_doing_cron()) {
            return;
        }

        $meta_table = $wpdb->prefix . self::VERSION_TABLE_NAME;
        if (!$this->tableExists($meta_table)) {
            return;
        }

        $defaults = [
            'meta_settings' => $this->getMetaSettingsData(),
            'translations'  => $this->getTranslationsData(),
        ];

        $hash = md5((string) wp_json_encode($defaults));
        if (get_option(self::DEFAULTS_SYNC_OPTION) === $hash) {
            return;
        }

        $schema_helper = new SchemaHelper();
        $schema_helper->insertDefaultSettings();
        $schema_helper->insertDefaultTranslations();

        update_option(self::DEFAULTS_SYNC_OPTION, $hash);

        Logger::info('Applied newly shipped default settings/translations', 'VersionManager');
    }

    /**
     * Whether a table exists, using the shared short-lived schema cache.
     */
    private function tableExists(string $table): bool
    {
        global $wpdb;

        $cache_key = self::table_exists_cache_key($table);
        $exists    = wp_cache_get($cache_key, self::CACHE_GROUP);

        if (false === $exists) {
            $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($cache_key, $exists, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }

        return $exists === $table;
    }


    /**
     * Get the current database version.
     */
    public function getCurrentDatabaseVersion(): ?string
    {
        global $wpdb;
        $meta_table_name = $wpdb->prefix . self::VERSION_TABLE_NAME;

        $version_cache_key = self::db_version_cache_key($meta_table_name);
        $cached_version    = wp_cache_get($version_cache_key, self::CACHE_GROUP);

        if (false !== $cached_version) {
            return $cached_version;
        }

        // Get the version from the table
        $version = $wpdb->get_var($wpdb->prepare("SELECT version FROM %i LIMIT 1", $meta_table_name)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        wp_cache_set($version_cache_key, $version, self::CACHE_GROUP, self::DATA_CACHE_TTL);

        return $version;
    }

    /**
     * Object cache key for the existence check of a table.
     */
    private static function table_exists_cache_key(string $table): string
    {
        return 'fiveprayer_table_exists_' . md5($table);
    }

    /**
     * Object cache key for the schema version stored in the meta table.
     */
    private static function db_version_cache_key(string $table): string
    {
        return 'fiveprayer_db_version_' . md5($table);
    }

    /**
     * Object cache key for a single row of the settings meta table.
     */
    private static function meta_row_cache_key(string $table, string $meta_key): string
    {
        return 'fiveprayer_meta_row_' . md5($table . '|' . $meta_key);
    }

    /**
     * Get the minimum required version.
     */
    public static function getMinimumVersion(): string
    {
        return self::MINIMUM_VERSION;
    }

    /**
     * Get the current plugin version.
     */
    public static function getCurrentPluginVersion(): string
    {
        return self::CURRENT_VERSION;
    }
}

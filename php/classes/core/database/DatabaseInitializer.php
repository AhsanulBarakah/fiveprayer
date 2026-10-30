<?php
namespace FivePrayer\Core\Database;

defined('ABSPATH') || exit;

use FivePrayer\Core\Database\SchemaSetup;
use FivePrayer\Core\Database\VersionManager;
use FivePrayer\Core\Helpers\WarningNotice\DatabaseMissingNotice;

class DatabaseInitializer
{
    /**
     * Object cache group shared by the whole plugin.
     */
    private const CACHE_GROUP = 'fiveprayer';

    /**
     * Short TTL for schema introspection: a table created during this request
     * must become visible quickly.
     */
    private const SCHEMA_CACHE_TTL = 60;

    /**
     * Handle plugin activation and database setup.
     * Note: This is kept for backwards compatibility but the main activation 
     * logic is now in Plugin.php::onActivate() called from FivePrayerMain.php
     * @deprecated Use Plugin::onActivate() instead
     */
    public function onActivate(): void
    {
        // This method is deprecated - activation is handled by Plugin::onActivate()
        // Kept for backwards compatibility with any code that may call this directly
    }

    /**
     * Check if the required tables are missing.
     */
    private function areTablesMissing(): bool
    {
        global $wpdb;

        // The "all tables exist" result is cached, because it is the outcome of
        // every request once setup has run. A missing table is deliberately not
        // cached so the check always reports a broken install.
        $all_present_cache_key = 'fiveprayer_tables_exist';
        if (true === wp_cache_get($all_present_cache_key, self::CACHE_GROUP)) {
            return false;
        }

        // Define required tables
        $requiredTables = [
            $wpdb->prefix . 'fp_prayer_settings_meta',
            $wpdb->prefix . 'fp_timetable',
            $wpdb->prefix . 'fp_api_keys',
        ];

        // Check each table for existence
        foreach ($requiredTables as &$table) {
            if ($wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table)) === null) { // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                return true;  // Missing table found
            }
        }

        wp_cache_set($all_present_cache_key, true, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);

        return false;  // All required tables exist
    }
}

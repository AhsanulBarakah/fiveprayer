<?php

namespace FivePrayer\Core\Database;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

class SchemaSetup
{
    private $version_manager;
    private $schema_helper;

    public function __construct()
    {
        $this->version_manager = new VersionManager();
        $this->schema_helper = new SchemaHelper();
    }

    /**
     * Bring the API key table up to the keyed-hash storage shape.
     *
     * Idempotent and safe to call on every request: each step is guarded by a
     * schema probe or an option flag. Returns false while the table does not
     * exist yet, so a fresh install keeps the migration flag unset until
     * createTables() has made the table.
     *
     * @return bool
     */
    public function ensureApiKeyHashStorage(): bool
    {
        global $wpdb;

        $api_table_name = $wpdb->prefix . 'fp_api_keys';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- One-time schema check guarded by an option flag.
        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $api_table_name)) !== $api_table_name) {
            return false;
        }

        if (!get_option('fiveprayer_api_key_column_nullable')) {
            $this->schema_helper->maybeModifyColumn($api_table_name, 'api_key', "ALTER TABLE $api_table_name MODIFY api_key varchar(255) DEFAULT NULL");
            update_option('fiveprayer_api_key_column_nullable', 1);
        }

        $this->schema_helper->maybeAddColumn($api_table_name, 'key_hash', "ALTER TABLE $api_table_name ADD key_hash char(64) DEFAULT NULL");
        // ApiKeyManager caches its own column probe; drop it so the column just
        // added is visible to this request's migration.
        wp_cache_delete('fiveprayer_api_keys_columns', 'fiveprayer');

        $this->schema_helper->maybeAddIndex(
            $api_table_name,
            'key_hash',
            "ALTER TABLE $api_table_name ADD UNIQUE KEY key_hash (key_hash)"
        );

        // One-time migration from reversible storage: decrypt each legacy row
        // once, store its hash and clear the ciphertext. The flag is only set
        // when the migration actually ran (not while the salts are missing).
        if ('1' !== (string) get_option('fiveprayer_api_keys_hash_migrated')) {
            $api_key_manager = new \FivePrayer\Core\API\ApiKeyManager();
            $hashed_keys     = $api_key_manager->migrate_existing_keys_to_hashes();

            if (false !== $hashed_keys) {
                update_option('fiveprayer_api_keys_hash_migrated', '1');
            }
        }

        return true;
    }

    /**
     * Create necessary database tables only when plugin is activated.
     */
    public function createTables(): void
    {
        global $wpdb;

        // Include the necessary upgrade.php file to load dbDelta function
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        Logger::info('Starting table creation / schema migration', 'SchemaSetup');

        // ====================================================================
        // Always-run migrations (before schema version check)
        // These run on every page load and must be idempotent (no-ops if done)
        // ====================================================================

        // API keys are stored as a keyed hash in key_hash. The old api_key
        // column is cleared and made nullable once, so the unique index on it
        // still accepts many cleared rows.
        $api_table_name = $wpdb->prefix . 'fp_api_keys';

        // Also runs from the one-time init migration, so an existing install
        // gets the key_hash column without needing a reactivation.
        $this->ensureApiKeyHashStorage();

        // Add missing columns to existing tables (migration) - now in always-run
        $this->schema_helper->maybeAddColumn($api_table_name, 'last_used_ip', "ALTER TABLE $api_table_name ADD last_used_ip varchar(45) DEFAULT NULL");
        $this->schema_helper->maybeAddColumn($api_table_name, 'last_used_user_agent', "ALTER TABLE $api_table_name ADD last_used_user_agent text DEFAULT NULL");
        $this->schema_helper->maybeAddColumn($api_table_name, 'last_used_referer', "ALTER TABLE $api_table_name ADD last_used_referer varchar(500) DEFAULT NULL");
        $this->schema_helper->maybeAddColumn($api_table_name, 'allowed_domains', "ALTER TABLE $api_table_name ADD allowed_domains text DEFAULT NULL");
        $this->schema_helper->maybeAddColumn($api_table_name, 'allowed_ips', "ALTER TABLE $api_table_name ADD allowed_ips text DEFAULT NULL");
        $this->schema_helper->maybeAddColumn($api_table_name, 'allowed_endpoints', "ALTER TABLE $api_table_name ADD allowed_endpoints text DEFAULT NULL");
        $this->schema_helper->maybeAddColumn($api_table_name, 'rate_limit_per_hour', "ALTER TABLE $api_table_name ADD rate_limit_per_hour int(11) DEFAULT 1000");
        $this->schema_helper->maybeAddColumn($api_table_name, 'permission_level', "ALTER TABLE $api_table_name ADD permission_level varchar(50) DEFAULT 'basic'");
        $this->schema_helper->maybeAddColumn($api_table_name, 'created_by', "ALTER TABLE $api_table_name ADD created_by bigint(20) unsigned NOT NULL DEFAULT 0");

        // The timetable is only ever queried and sorted by `date`, so an index on
        // that column turns the monthly / yearly reads from full table scans into
        // range scans. Idempotent — the helper skips when the index already exists.
        $fp_timetable_table = $wpdb->prefix . 'fp_timetable';
        $this->schema_helper->maybeAddIndex(
            $fp_timetable_table,
            'fp_timetable_date',
            "ALTER TABLE $fp_timetable_table ADD INDEX fp_timetable_date (`date`)"
        );

        // Optional second 'Asr time (2 Mithl / Hanafi opinion). Imported from
        // published timetables that print both 'Asr times; NULL when unused.
        // Always-run so existing installs get the column without a version bump.
        $this->schema_helper->maybeAddColumn(
            $fp_timetable_table,
            'asr_second_begins',
            "ALTER TABLE $fp_timetable_table ADD asr_second_begins time DEFAULT NULL"
        );

        // ====================================================================
        // Full table creation / schema version check
        // Skipped if the stored DB version is already current
        // ====================================================================

        // Check if the schema is already up to date
        $is_up_to_date = $this->version_manager->isSchemaUpToDate();
        Logger::info('Schema up to date: ' . ($is_up_to_date ? 'Yes' : 'No'), 'SchemaSetup');

        if ($is_up_to_date) {
            Logger::info('Schema is up to date, skipping table creation', 'SchemaSetup');
            return;
        }

        // Table: wp_fp_timetable
        $table_name = $wpdb->prefix . 'fp_timetable';
        Logger::info('Creating timetable table', 'SchemaSetup');
        dbDelta("CREATE TABLE IF NOT EXISTS $table_name (
            `date` date NOT NULL,
            `fajr_begins` time DEFAULT NULL,
            `fajr_iqamah` time DEFAULT NULL,
            `fajr_masjid_jamaah` time DEFAULT NULL,
            `sunrise` time DEFAULT NULL,
            `dhuhr_begins` time DEFAULT NULL,
            `dhuhr_iqamah` time DEFAULT NULL,
            `asr_begins` time DEFAULT NULL,
            `asr_second_begins` time DEFAULT NULL,
            `asr_iqamah` time DEFAULT NULL,
            `maghrib_begins` time DEFAULT NULL,
            `maghrib_iqamah` time DEFAULT NULL,
            `isha_begins` time DEFAULT NULL,
            `isha_iqamah` time DEFAULT NULL,
            `midnight` time DEFAULT NULL,
            `currentDate` tinytext,
            `today` tinyint(4) DEFAULT NULL,
            `className` tinytext,
            KEY fp_timetable_date (`date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8");

        // Add columns if they don't exist
        $this->schema_helper->maybeAddColumn($table_name, 'is_ramadan', "ALTER TABLE $table_name ADD is_ramadan smallint(6) NULL");
        $this->schema_helper->maybeAddColumn($table_name, 'hijri_date', "ALTER TABLE $table_name ADD hijri_date varchar(256) NULL");

        // Table: wp_fp_prayer_settings_meta
        $meta_table_name = $wpdb->prefix . 'fp_prayer_settings_meta';
        Logger::info('Creating meta table', 'SchemaSetup');
        dbDelta("CREATE TABLE IF NOT EXISTS $meta_table_name (
            `id` int(11) NOT NULL AUTO_INCREMENT,
            `meta-key` varchar(255) NOT NULL,
            `value` longtext CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL,
            `version` varchar(10) DEFAULT '1.0.0' NOT NULL,
            PRIMARY KEY (`id`)
        ) ENGINE=InnoDB AUTO_INCREMENT=1743 DEFAULT CHARSET=utf8");

        // Note: insertDefaultSettings() and insertDefaultTranslations() are called 
        // by Plugin::onActivate() after table creation, not here to prevent duplication

        // Table: wp_fp_api_keys (for API key management)
        $api_table_name = $wpdb->prefix . 'fp_api_keys';
        Logger::info('Creating API keys table', 'SchemaSetup');
        dbDelta("CREATE TABLE IF NOT EXISTS $api_table_name (
            id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
            api_key varchar(255) DEFAULT NULL,
            key_hash char(64) DEFAULT NULL,
            name varchar(255) NOT NULL,
            description text DEFAULT NULL,
            status enum('active', 'inactive', 'revoked') DEFAULT 'active',
            created_at datetime DEFAULT CURRENT_TIMESTAMP,
            expires_at datetime DEFAULT NULL,
            last_used datetime DEFAULT NULL,
            last_used_ip varchar(45) DEFAULT NULL,
            last_used_user_agent text DEFAULT NULL,
            last_used_referer varchar(500) DEFAULT NULL,
            usage_count bigint(20) DEFAULT 0,
            allowed_domains text DEFAULT NULL,
            allowed_ips text DEFAULT NULL,
            allowed_endpoints text DEFAULT NULL,
            rate_limit_per_hour int(11) DEFAULT 1000,
            permission_level varchar(50) DEFAULT 'basic',
            created_by bigint(20) unsigned NOT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY api_key (api_key),
            UNIQUE KEY key_hash (key_hash),
            KEY status (status),
            KEY created_by (created_by)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8");

        // Update the database version after schema creation
        Logger::info('Updating database version', 'SchemaSetup');
        $this->version_manager->updateSchemaVersion();

        Logger::info('SchemaSetup completed', 'SchemaSetup');
    }
}
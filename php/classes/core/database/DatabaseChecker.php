<?php

namespace FivePrayer\Core\Database;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\WarningNotice\DatabaseMissingNotice;
use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Security\SecurityHelper;

class DatabaseChecker
{
    /**
     * Object cache group shared by the whole plugin.
     */
    private const CACHE_GROUP = 'fiveprayer';

    /**
     * Results of schema introspection are cached only for a short window so a
     * table created during this request is picked up almost immediately.
     */
    private const SCHEMA_CACHE_TTL = 60;

    /**
     * Object cache key holding the "every required table exists" result.
     */
    private const TABLES_EXIST_CACHE_KEY = 'fiveprayer_tables_exist';

    private array $requiredTables = [
        'fp_prayer_settings_meta',
        'fp_timetable',
        'fp_api_keys',
    ];

    private ?bool $missingTables = null; // Use null to indicate not yet checked

    public function checkMissingTables(): void
    {
        global $wpdb;

        // Only run the check if we haven't checked yet in this request
        if ($this->missingTables !== null) {
            return; // Already checked
        }

        // A previous request already proved that every table exists, which is the
        // common case. Only that positive result is cached: a missing table is
        // never cached so the admin notice cannot be masked by a stale entry.
        $tables_exist = wp_cache_get(self::TABLES_EXIST_CACHE_KEY, self::CACHE_GROUP);

        if (true === $tables_exist) {
            $this->missingTables = false;
            return;
        }

        $this->missingTables = false; // Assume no missing tables initially

        foreach ($this->requiredTables as $table) {
            $tableName = $wpdb->prefix . $table;
            $exists = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $tableName)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

            if (!$exists) {
                $this->missingTables = true;

                // Log missing table information
                Logger::error("Missing table - {$tableName}", 'DatabaseChecker');

                // Add the notice only once if the required tables are missing
                if (!is_admin() || !did_action('admin_notices')) {
                    return;
                }

                $page = sanitize_key(SecurityHelper::get_sanitized_get_input('page'));
                if (!in_array($page, ['fiveprayer', 'fiveprayer-settings', 'fiveprayer-api-settings'])) {
                    return;
                }

                break; // Stop checking once we find a missing table
            }
        }

        if (!$this->missingTables) {
            wp_cache_set(self::TABLES_EXIST_CACHE_KEY, true, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }
    }

    public function hasMissingTables(): bool
    {
        // Only run the check in admin, REST API, or AJAX contexts to avoid frontend overhead
        $shouldCheck = is_admin() || (defined('REST_REQUEST') && REST_REQUEST) || wp_doing_ajax();

        if ($shouldCheck && $this->missingTables === null) {
            $this->checkMissingTables();
        } elseif ($this->missingTables === null) {
            // If we're not in a context where we should check, assume tables exist to avoid frontend queries
            $this->missingTables = false;
        }

        return $this->missingTables;
    }
}

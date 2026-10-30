<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

/**
 * Cache and object-cache purging helpers.
 *
 * The object cache key for the column-name probe below
 * (TABLE_COLUMN_VARIANT_CACHE_KEY) lives on the composing class
 * (PrayerSettingsMetaController), because constants inside traits are only
 * allowed from PHP 8.2 onward and this plugin supports PHP 7.4. The cache group
 * is passed as a literal for the same reason.
 */
trait CachePurgeTrait
{
    protected function fiveprayer_purge_all_caches(): void
    {
        if (function_exists('rocket_clean_domain')) {
            rocket_clean_domain();
        }

        if (function_exists('do_action')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Third-party LiteSpeed Cache hook.
            do_action('litespeed_purge_all');
        }

        if (function_exists('w3tc_flush_all')) {
            w3tc_flush_all();
        }

        if (function_exists('wp_cache_clear_cache')) {
            wp_cache_clear_cache();
        }

        if (function_exists('wpfc_clear_all_cache')) {
            wpfc_clear_all_cache(true);
        }

        wp_cache_flush();
    }

    protected function detectTableColumnUsesNewName(): bool
    {
        global $wpdb;

        // The table layout is probed on every settings write, so the answer is
        // cached for a short window instead of running DESCRIBE each time. The
        // window is short because upgrades change the layout during a request.
        $uses_new_name = wp_cache_get(self::TABLE_COLUMN_VARIANT_CACHE_KEY, 'fiveprayer');

        if (false !== $uses_new_name) {
            return (bool) $uses_new_name;
        }

        $columns = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $wpdb->prepare("DESCRIBE %i", $this->table_name)
        );

        foreach ($columns as &$column) {
            if ($column->Field === 'meta_key') {
                wp_cache_set(self::TABLE_COLUMN_VARIANT_CACHE_KEY, true, 'fiveprayer', 60);
                return true;
            }
        }

        wp_cache_set(self::TABLE_COLUMN_VARIANT_CACHE_KEY, false, 'fiveprayer', 60);
        return false;
    }
}

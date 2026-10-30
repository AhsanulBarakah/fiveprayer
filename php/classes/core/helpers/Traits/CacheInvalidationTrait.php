<?php

namespace FivePrayer\Core\Helpers\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Trait CacheInvalidationTrait
 *
 * Handles cache invalidation for prayer data transients and in-memory caches.
 * Extracted from PrayerDataCache for code organization.
 */
trait CacheInvalidationTrait
{
    /**
     * IMPORTANT: This should be called whenever the underlying data in
     * `fp_prayer_settings_meta` or `fp_timetable` tables changes,
     * for example, after updating settings or importing new timetable data.
     */
    public static function invalidateAll(): void
    {
        // Clear in-memory static caches
        self::$metaData = null;
        self::$timetableData = [];
        self::$processedTimetableCache = [];
        self::$nextPrayerCache = [];
        self::$nextPrayerCacheTime = null;
        self::$transientBatch = [];

        global $wpdb;
        $options_table_name = $wpdb->options;

        // Single query to delete ALL fiveprayer transients (covers fiveprayer_, fp_, fp_month_, fp_vdp_ prefixes)
        // Excludes brute force security transients so blocked IPs survive cache clears
        $sql = $wpdb->prepare(
            "DELETE FROM %i WHERE (option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s OR option_name LIKE %s) AND option_name NOT LIKE %s AND option_name NOT LIKE %s",
            $options_table_name,
            '_transient_fiveprayer_%',
            '_transient_timeout_fiveprayer_%',
            '_transient_fp_%',
            '_transient_timeout_fp_%',
            '_transient_fp_brute_%',
            '_transient_timeout_fp_brute_%'
        );

        // No caching is flagged here on purpose: deleting the plugin's transients
        // is itself cache maintenance, and the object cache group is dropped
        // further down this method.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared -- $sql was prepared above.
        $deleted_count = $wpdb->query($sql);

        if ($deleted_count === false) {
            Logger::error("Error deleting transients from database. Last DB error: " . $wpdb->last_error, 'PrayerDataCache');
        } elseif ($deleted_count > 0) {
            Logger::info("Deleted {$deleted_count} prayer transients.", 'PrayerDataCache');
        }

        // Process any remaining batched transients
        self::processTransientBatch();
    
        // Reset the list of known cache keys for the current request.
        self::$cacheKeys = [];

        // Targeted cache deletes instead of full wp_cache_flush()
        wp_cache_delete('fiveprayer_next_prayer', 'fiveprayer');
        wp_cache_delete('fiveprayer_timetable', 'fiveprayer');
        wp_cache_delete('fiveprayer_hijri_date', 'fiveprayer');
        wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');

        // Drop every remaining key of the plugin's object cache group when the
        // backend supports group flushing (WordPress 6.1+). Keys created with a
        // dynamic suffix (per month, per ID, per table) are only cleared this
        // way, so backends without support fall back to the targeted deletes
        // above plus the TTL of each entry.
        if (function_exists('wp_cache_supports') && wp_cache_supports('flush_group')) {
            wp_cache_flush_group('fiveprayer');
        }

        // Clear shortcode static caches to ensure they reload fresh data
        self::clearShortcodeStaticCaches();
    }

    /**
     * Clear static caches in shortcode classes to ensure they reload fresh data
     */
    private static function clearShortcodeStaticCaches(): void
    {
        // Clear the static caches in ShortCodesSinglePrayers
        if (class_exists('\\FivePrayer\\Core\\ShortCodes\\ShortCodesSinglePrayers')) {
            try {
                \FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers::resetInstance();
            } catch (\Exception $e) {
                Logger::debug('Could not reset ShortCodesSinglePrayers instance: ' . $e->getMessage(), 'PrayerDataCache');
            }
        }

        // Clear today's prayer times cache in the cache class itself
        self::$todayPrayerTimesCache = null;
        self::$todayPrayerTimesDate = null;

        // Clear shortcode fragment caches
        self::clearShortcodeFragmentCaches();

        // Also trigger the shortcode class to clear its fragment caches
        if (class_exists('\\FivePrayer\\Core\\Shortcodes')) {
            try {
                \FivePrayer\Core\Shortcodes::purge_fragment_caches();
            } catch (\Exception $e) {
                Logger::debug('Could not purge shortcode fragment caches: ' . $e->getMessage(), 'PrayerDataCache');
            }
        }

        // Also trigger the action that other parts of the system can hook into
        do_action('fiveprayer_invalidate_all');
    }

    /**
     * Clear shortcode fragment caches that are stored as WordPress transients
     */
    private static function clearShortcodeFragmentCaches(): void
    {
        // Fragment caches (fp_month_, fp_vdp_) are already cleared by the single DELETE in invalidateAll()
        // which covers all _transient_fp_% patterns. No additional queries needed.
    }

    /**
     * Batch delete transients by prefix for better performance
     */
    public static function invalidateByPrefix(string $suffix): void
    {
        // Clear related in-memory caches if needed
        if (strpos($suffix, 'settings_meta') !== false) {
            self::$metaData = null;
        } elseif (strpos($suffix, 'timetable') !== false) {
            $timetable_keys = array_filter(array_keys(self::$timetableData), function($key) use ($suffix) {
                return strpos($key, $suffix) !== false;
            });
            foreach ($timetable_keys as $key) {
                unset(self::$timetableData[$key]);
            }
        }

        global $wpdb;
        $transient_prefix = self::CACHE_KEY_PREFIX . $suffix;
        $options_table_name = $wpdb->options;

        $sql_both = $wpdb->prepare(
            "DELETE FROM %i WHERE option_name LIKE %s OR option_name LIKE %s",
            $options_table_name,
            '_transient_' . $transient_prefix . '%',
            '_transient_timeout_' . $transient_prefix . '%'
        );

        // Deleting transients by prefix is cache maintenance, so there is nothing
        // to cache about it. The matching object cache keys carry a dynamic
        // suffix and are dropped by invalidateAll() instead.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.PreparedSQL.NotPrepared -- $sql_both was prepared above.
        $deleted_count = $wpdb->query($sql_both);

        if ($deleted_count === false) {
            Logger::error("Error deleting transients with suffix '{$suffix}'. Last DB error: " . $wpdb->last_error, 'PrayerDataCache');
        } else {
            Logger::info("Deleted {$deleted_count} transients with suffix '{$suffix}'.", 'PrayerDataCache');
        }

        // Remove from known cache keys if they match the pattern
        self::$cacheKeys = array_filter(self::$cacheKeys, function($key) use ($transient_prefix) {
            return strpos($key, $transient_prefix) === false;
        });
    }
}

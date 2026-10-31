<?php

namespace FivePrayer\Core\ShortCodes\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Security\SecurityHelper;

/**
 * Trait for AJAX handler and cache management functionality.
 */
trait AjaxCacheTrait
{
    public static function maybe_purge_fragment_cache($option, $old_value, $value): void
    {
        $watched = [
            'hijralocale',
            'extra_info',
            'prayer_names',
            'activeLanguage',
            'timetable_prayer',
            'vertical_daily_prayer',
            'skip_iqamah_midnight',
            'hide_printer_button',
            'hide_month_selection',
            'printer_button_url',
            'hide_custom_url_button',
            'extra_prayers',
        ];
        if (in_array($option, $watched, true)) {
            self::purge_fragment_caches();
        }
    }

    public static function purge_fragment_caches(): void
    {
        global $wpdb;
        if (!$wpdb) {
            return;
        }
        $patterns = [
            '_transient_fp_vdp_%',
            '_transient_timeout_fp_vdp_%',
            '_transient_fp_month_%',
            '_transient_timeout_fp_month_%',
            '_transient_fiveprayer_block_single_%',
            '_transient_timeout_fiveprayer_block_single_%',
        ];
        foreach ($patterns as &$like) {
            // Clearing the runtime caches means deleting transients, which cannot
            // itself be cached. This runs from PrayerDataCache::invalidateAll(),
            // which also drops the plugin's object cache group.
            $wpdb->query($wpdb->prepare("DELETE FROM %i WHERE option_name LIKE %s", $wpdb->options, $like)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        }
    }
}

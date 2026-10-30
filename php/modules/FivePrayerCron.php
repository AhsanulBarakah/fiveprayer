<?php
/**
 * FivePrayer Cron Module
 * 
 * This file handles all cron job and scheduling functionality for the FivePrayer plugin.
 * 
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

/**
 * Hook into WordPress cron to clear prayer time caches periodically
 * This ensures that even with aggressive page caching, prayer times update appropriately
 */
function fiveprayer_schedule_cache_refresh() {
    if (!wp_next_scheduled('fiveprayer_hourly_cache_check')) {
        wp_schedule_event(time(), 'hourly', 'fiveprayer_hourly_cache_check');
    }
}
add_action('init', 'fiveprayer_schedule_cache_refresh');

/**
 * Clear prayer time related caches hourly
 */
function fiveprayer_hourly_cache_check() {
    // Clear prayer data cache to ensure fresh times are loaded
    \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();

    // Purge external caches to ensure changes propagate
    fiveprayer_purge_external_caches();
}
add_action('fiveprayer_hourly_cache_check', 'fiveprayer_hourly_cache_check');

/**
 * Schedule a more frequent check for next prayer changes
 * This runs every 5 minutes to detect when the next prayer has changed
 */
function fiveprayer_schedule_next_prayer_check() {
    if (!wp_next_scheduled('fiveprayer_check_next_prayer_change')) {
        wp_schedule_event(time(), 'five_minutes', 'fiveprayer_check_next_prayer_change');
    }
}
add_action('init', 'fiveprayer_schedule_next_prayer_check');

/**
 * Check if the next prayer has changed and clear cache if it has
 */
function fiveprayer_check_next_prayer_change() {
    // Get today's prayer times
    $today_date = current_time('Y-m-d');
    $today_prayer_times = \FivePrayer\Core\Helpers\PrayerDataCache::getTimetableByDateUnfiltered($today_date);

    if (!$today_prayer_times) {
        // Try to get today's prayer times using the cached method
        $today_prayer_times = \FivePrayer\Core\Helpers\PrayerDataCache::getTodaysPrayerTimes($today_date);
    }

    if (!$today_prayer_times) {
        return; // No prayer times available
    }

    // Get other required data for next prayer calculation
    $meta_values = \FivePrayer\Core\Helpers\PrayerDataCache::getMultipleMetaValues([
        'timetable_prayer',
        'prayer_names',
        'activeLanguage'
    ]);

    $timetable_prayer = $meta_values['timetable_prayer'] ? json_decode($meta_values['timetable_prayer'], true) : [];
    $prayer_names = $meta_values['prayer_names'] ? json_decode($meta_values['prayer_names'], true) : [];
    $activeLanguage = $meta_values['activeLanguage'] ? json_decode($meta_values['activeLanguage'], true) : [['language_code' => 'en']];

    // Calculate the current next prayer
    $nextPrayer = new \FivePrayer\Core\Daily\NextPrayer();
    $current_next_prayer = $nextPrayer->getNextPrayer(
        $today_prayer_times,
        $timetable_prayer,
        $prayer_names,
        $activeLanguage
    );

    // Also get the full next prayer data for comparison
    $current_next_prayer_data = $nextPrayer->getNextPrayerData();
    $current_next_prayer_details = [
        'slug' => $current_next_prayer,
        'name' => is_object($current_next_prayer_data) ? ($current_next_prayer_data->name ?? '') : ($current_next_prayer_data['name'] ?? ''),
        'time' => is_object($current_next_prayer_data) ? ($current_next_prayer_data->time ?? '') : ($current_next_prayer_data['time'] ?? '')
    ];

    // Get the previously stored next prayer from WordPress options
    $previous_next_prayer = get_option('fiveprayer_previous_next_prayer', '');
    $previous_next_prayer_details = get_option('fiveprayer_previous_next_prayer_details', []);
    $previous_check_time = get_option('fiveprayer_previous_check_time', 0);

    // Compare both the slug and the full details to detect changes
    $prayer_changed = false;

    if ($current_next_prayer !== $previous_next_prayer) {
        $prayer_changed = true;
    } elseif (!empty($previous_next_prayer_details) &&
              ($current_next_prayer_details['name'] !== (isset($previous_next_prayer_details['name']) ? $previous_next_prayer_details['name'] : '') ||
               $current_next_prayer_details['time'] !== (isset($previous_next_prayer_details['time']) ? $previous_next_prayer_details['time'] : ''))) {
        $prayer_changed = true;
    }

    // If the next prayer has changed, clear the cache
    if ($prayer_changed) {
        // Update the stored next prayer
        update_option('fiveprayer_previous_next_prayer', $current_next_prayer);
        update_option('fiveprayer_previous_next_prayer_details', $current_next_prayer_details);
        update_option('fiveprayer_previous_check_time', time());

        // Log the change
        \FivePrayer\Core\Logging\Logger::info("Next prayer changed from {$previous_next_prayer} (" . (isset($previous_next_prayer_details['name']) ? $previous_next_prayer_details['name'] : '') . " at " . (isset($previous_next_prayer_details['time']) ? $previous_next_prayer_details['time'] : '') . ") to {$current_next_prayer} ({$current_next_prayer_details['name']} at {$current_next_prayer_details['time']}). Clearing cache.", 'FivePrayer');

        // Clear prayer data cache to ensure fresh data is loaded
        \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();

        // Clear shortcode static caches to ensure they reload fresh data
        if (class_exists('\\FivePrayer\\Core\\ShortCodes\\ShortCodesSinglePrayers')) {
            try {
                \FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers::resetInstance();
            } catch (\Exception $e) {
                \FivePrayer\Core\Logging\Logger::debug('Could not reset ShortCodesSinglePrayers instance: ' . $e->getMessage(), 'FivePrayer');
            }
        }

        // Purge external caches to ensure changes propagate to cache plugins
        fiveprayer_purge_external_caches();
    } else {
        // Still update the check time to track when we last checked
        update_option('fiveprayer_previous_check_time', time());
    }
}
add_action('fiveprayer_check_next_prayer_change', 'fiveprayer_check_next_prayer_change');

/**
 * Add custom cron schedule for 5-minute intervals
 */
function fiveprayer_add_custom_cron_schedule($schedules) {
    $schedules['five_minutes'] = array(
        'interval' => 5 * MINUTE_IN_SECONDS,
        'display' => __('Every 5 Minutes', 'fiveprayer')
    );
    return $schedules;
}
add_filter('cron_schedules', 'fiveprayer_add_custom_cron_schedule');

/**
 * Clear prayer time caches twice daily (every 12 hours) at specific times
 * This ensures prayer times update even with aggressive caching
 */
function fiveprayer_schedule_twice_daily_cache_refresh() {
    // Removed: hourly cache check already covers this.
    // Keep the function stub so existing cron schedules don't throw errors.
}
add_action('init', 'fiveprayer_schedule_twice_daily_cache_refresh');

/**
 * Clear prayer time caches twice daily — no-op (covered by hourly check)
 */
function fiveprayer_twice_daily_cache_check() {
    // No-op: fiveprayer_hourly_cache_check() already handles this.
}
add_action('fiveprayer_twice_daily_cache_check', 'fiveprayer_twice_daily_cache_check');
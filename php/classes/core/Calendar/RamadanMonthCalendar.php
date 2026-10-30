<?php
namespace FivePrayer\Core\Calendar;

defined('ABSPATH') || exit;
use FivePrayer\Core\Calendar\Hijra;
use FivePrayer\Core\Helpers\Validator;
use FivePrayer\Core\Security\SecurityHelper;


if (!class_exists(__NAMESPACE__ . '\RamadanMonthCalendar')) {

    /**
     * Class to handle Ramadan calendar functionality
     *
     * @since 1.0.0
     */
    class RamadanMonthCalendar {
        /**
         * Generate Ramadan month calendar data.
         *
         * @param int $monthNumber The month number (13 for Ramadan).
         * @return array Array of days in Ramadan.
         */
        public function getRamadanMonthCalendar($monthNumber) {
            global $wpdb;
            
            // Clear cache if data was lost. Cache clearing is a state change, so
            // it needs a valid admin nonce, not just the capability.
            $ramadan_cache_nonce = SecurityHelper::get_sanitized_get_input('fiveprayer_nonce');
            $ramadan_cache_nonce_valid = $ramadan_cache_nonce !== ''
                && wp_verify_nonce($ramadan_cache_nonce, 'fiveprayer_clear_ramadan_cache');

            if (SecurityHelper::has_query_arg('clear_ramadan_cache') && current_user_can('manage_options') && $ramadan_cache_nonce_valid) {
                $current_year = intval(wp_date('Y', null, wp_timezone()));
                delete_transient('fiveprayer_ramadan_days_' . $current_year);
                delete_transient('fiveprayer_ramadan_state_' . $current_year);
                wp_cache_delete('fiveprayer_ramadan_timetable_' . $current_year, 'fiveprayer');
            }
            
            $hijra = new Hijra();

            // Sanitize table name with proper WordPress prefix
            $table_name = $wpdb->prefix . 'fp_timetable';
            
            // Get current year, properly sanitized
            $current_year = intval(wp_date('Y', null, wp_timezone()));
            
            // Clear cache if Ramadan settings were modified (React-like instant update)
            if (SecurityHelper::has_query_arg('ramadan_updated') && current_user_can('manage_options') && $ramadan_cache_nonce_valid) {
                $current_year = intval(wp_date('Y', null, wp_timezone()));
                delete_transient('fiveprayer_ramadan_days_' . $current_year);
                delete_transient('fiveprayer_ramadan_state_' . $current_year);
                wp_cache_delete('fiveprayer_ramadan_timetable_' . $current_year, 'fiveprayer');
            }
            
            // Check state cache first (like React state)
            $state_key = 'fiveprayer_ramadan_state_' . $current_year;
            $state_cache = get_transient($state_key);
            
            // Check cache first for performance (longer cache for better performance)
            $cache_key = 'fiveprayer_ramadan_days_' . $current_year;
            $cached_days = get_transient($cache_key);
            if ($cached_days !== false && $state_cache !== false) {
                return $cached_days;
            }
            
            // The whole year of timetable rows feeds the Ramadan calculation, so it
            // is kept in the object cache as well as in the transients above. Every
            // path that invalidates the Ramadan transients drops this entry too.
            $timetable_cache_key = 'fiveprayer_ramadan_timetable_' . $current_year;
            $timeTableMonthly    = wp_cache_get($timetable_cache_key, 'fiveprayer');

            if (!is_array($timeTableMonthly)) {
                // Range filter (not YEAR(date)) so the fp_timetable_date index is
                // usable, and prepare() so the year is bound as a value.
                $range_start = sprintf('%04d-01-01', $current_year);
                $range_end   = sprintf('%04d-01-01', $current_year + 1);
                $timeTableMonthly = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare(
                        "SELECT date, fajr_begins, fajr_iqamah, fajr_masjid_jamaah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah, midnight, currentDate, hijri_date FROM %i WHERE date >= %s AND date < %s ORDER BY date ASC",
                        $table_name,
                        $range_start,
                        $range_end
                    )
                );
                wp_cache_set($timetable_cache_key, $timeTableMonthly, 'fiveprayer', 300);
            }
            
            $days = array();

            // Create IntlDateFormatter ONCE and reuse for all dates
            // This is the expensive part — creating it 365 times was the bottleneck
            $locale_data = $hijra->getCachedLocale();
            $formatter = null;
            if (class_exists('IntlDateFormatter') && is_array($locale_data) && isset($locale_data['lan'], $locale_data['calenderType'])) {
                $formatter = new \IntlDateFormatter(
                    "{$locale_data['lan']}@calendar={$locale_data['calenderType']}",
                    \IntlDateFormatter::LONG,
                    \IntlDateFormatter::NONE,
                    null,
                    \IntlDateFormatter::TRADITIONAL
                );
            }

            // Ramadan is Hijri month 9 — use IntlDateFormatter with reused formatter
            foreach ($timeTableMonthly as &$day) {
                $hijri_month = $hijra->getHijriMonth($day->currentDate, $formatter);
                if ($hijri_month === 9) {
                    $days[] = $day;
                }
            }

            // Cache the results for 6 hours for better performance
            set_transient($cache_key, $days, 6 * HOUR_IN_SECONDS);
            // Set state cache for React-like instant updates
            set_transient($state_key, true, 6 * HOUR_IN_SECONDS);
            
            return $days;
        }
        
        /**
         * Clear Ramadan cache manually
         */
        public function clearRamadanCache() {
            $current_year = intval(wp_date('Y', null, wp_timezone()));
            delete_transient('fiveprayer_ramadan_days_' . $current_year);
            delete_transient('fiveprayer_ramadan_state_' . $current_year);
            
            return true;
        }
    }
}
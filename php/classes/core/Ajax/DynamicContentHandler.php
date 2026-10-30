<?php
namespace FivePrayer\Core\Ajax;

use FivePrayer\Core\Helpers\PrayerDataCache;

defined('ABSPATH') || exit;

class DynamicContentHandler {
    
    public function __construct() {
        add_action('wp_ajax_nopriv_fiveprayer_dynamic_content', [$this, 'handle_dynamic_content']);
        add_action('wp_ajax_fiveprayer_dynamic_content', [$this, 'handle_dynamic_content']);

        // Lightweight clock endpoint used to keep time-sensitive widgets
        // accurate when the surrounding page was served from a page cache.
        add_action('wp_ajax_nopriv_fiveprayer_server_time', [$this, 'handle_server_time']);
        add_action('wp_ajax_fiveprayer_server_time', [$this, 'handle_server_time']);
    }

    /**
     * Return the current server time.
     *
     * Deliberately requires no nonce: it exposes no site data, only the
     * current wall-clock time. This lets the frontend re-sync a clock that was
     * embedded in cached HTML, and it keeps working after the browser restores
     * a page from its back-forward cache.
     */
    public function handle_server_time() {
        if (!headers_sent()) {
            header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: Wed, 11 Jan 2023 00:00:00 GMT');
            header('X-LiteSpeed-Cache-Control: no-cache');
        }

        $format    = get_option('time_format', 'h:i:s A');
        $timestamp = current_time('timestamp');

        wp_send_json_success([
            'timestamp' => $timestamp,
            'time'      => date_i18n($format, $timestamp),
            'format'    => $format,
        ]);
    }
    
    public function handle_dynamic_content() {
        // Verify nonce for security
        $nonce = sanitize_text_field(filter_input(INPUT_POST, 'nonce') ?: '');
        if (!$nonce || !wp_verify_nonce($nonce, 'fiveprayer_dynamic_nonce')) {
            wp_die('Security check failed');
        }

        // Send cache-busting headers to prevent server-level caching of AJAX responses
        if (!headers_sent()) {
            header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
            header('Pragma: no-cache');
            header('Expires: Wed, 11 Jan 2023 00:00:00 GMT');
            header('X-LiteSpeed-Cache-Control: no-cache');
        }

        // AJAX responses are dynamic by nature — no need to invalidate all caches.
        // The cache layer already supports short TTLs for time-sensitive data.
        // Removed: PrayerDataCache::invalidateAll() and opcache_reset() that ran
        // on every AJAX call and caused catastrophic performance under load.

        $content_type = sanitize_text_field(filter_input(INPUT_POST, 'content_type') ?: '');
        $field = sanitize_text_field(filter_input(INPUT_POST, 'field') ?: '');

        // Get fresh data based on content type
        switch ($content_type) {
            case 'current_time':
                $response = $this->get_current_time_data();
                break;
            case 'next_prayer':
                $response = $this->get_next_prayer_data();
                break;
            case 'single_prayer':
                $response = $this->get_single_prayer_data($field);
                break;
            case 'hijri_date':
                $hijri = new \FivePrayer\Core\Calendar\Hijra();
                $hijri_date = $hijri->hijra(current_time('Y-m-d'));
                $response = [
                    'html' => $hijri_date,
                    'timestamp' => current_time('timestamp')
                ];
                break;
            default:
                $response = ['error' => 'Invalid content type'];
        }

        wp_send_json_success($response);
    }
    
    private function get_current_time_data() {
        $time_format = get_option('time_format', 'h:i:s A');
        $current_time = date_i18n($time_format, current_time('timestamp'));

        // Apply translations if enabled
        $locale = PrayerDataCache::getSingleMetaValue("hijralocale");
        $gregorian_numbers = PrayerDataCache::getSingleMetaValue("gregorian_numbers");

        if ($locale && !empty($locale['customLan'])) {
            $gregorian_numbers_data = json_decode($gregorian_numbers, true);
            if (is_array($gregorian_numbers_data)) {
                foreach ($gregorian_numbers_data as &$num) {
                    if (isset($num['original_text'], $num['translated_text']) &&
                        $num['language_code'] === $locale['language_code']) {
                        $current_time = str_replace($num['original_text'], $num['translated_text'], $current_time);
                    }
                }
            }
        }

        return [
            'time' => $current_time,
            'timestamp' => current_time('timestamp'),
            'format' => $time_format
        ];
    }
    
    private function get_next_prayer_data() {
        $today_date = current_time('Y-m-d');
        $today_prayer_times = PrayerDataCache::getTodaysPrayerTimes($today_date);
        
        if (!$today_prayer_times) {
            return ['error' => 'No prayer times available'];
        }
        
        // Get other required data for next prayer calculation
        $meta_values = PrayerDataCache::getMultipleMetaValues([
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
        
        // NextPrayer::getNextPrayerData() returns an array (empty until a prayer
        // has been resolved), not an object. Reading it with object syntax warned
        // "Attempt to read property ... on array" on every refresh and sent an
        // empty name, time and timestamp even when the data was there.
        $next_prayer_data = $nextPrayer->getNextPrayerData();
        $next_prayer_data = is_array($next_prayer_data) ? $next_prayer_data : [];

        return [
            'slug' => $current_next_prayer,
            'name' => $next_prayer_data['name'] ?? '',
            'time' => $next_prayer_data['time'] ?? '',
            'timestamp' => $next_prayer_data['timestamp'] ?? 0
        ];
    }
    
    private function get_single_prayer_data($field) {
        $today_date = current_time('Y-m-d');
        $today_prayer_times = PrayerDataCache::getTodaysPrayerTimes($today_date);
        
        if (!$today_prayer_times) {
            return ['error' => 'No prayer times available'];
        }
        
        // Map field to prayer time property
        $field_mapping = [
            'fajr_begins_time' => 'fajr_begins',
            'fajr_iqamah_time' => 'fajr_iqamah',
            'dhuhr_begins_time' => 'dhuhr_begins',
            'dhuhr_iqamah_time' => 'dhuhr_iqamah',
            'asr_begins_time' => 'asr_begins',
            'asr_second_begins_time' => 'asr_second_begins',
            'asr_iqamah_time' => 'asr_iqamah',
            'maghrib_begins_time' => 'maghrib_begins',
            'maghrib_iqamah_time' => 'maghrib_iqamah',
            'isha_begins_time' => 'isha_begins',
            'isha_iqamah_time' => 'isha_iqamah',
            'sunrise_begins_time' => 'sunrise',
            'midnight_begins_time' => 'midnight',
            // Identity aliases emitted by the dynamic-content placeholders
            // (DynamicContent\Traits\PrayerTimeContentTrait).
            'fajr_begins' => 'fajr_begins',
            'fajr_iqamah' => 'fajr_iqamah',
            'dhuhr_begins' => 'dhuhr_begins',
            'dhuhr_iqamah' => 'dhuhr_iqamah',
            'asr_begins' => 'asr_begins',
            'asr_second_begins' => 'asr_second_begins',
            'asr_iqamah' => 'asr_iqamah',
            'maghrib_begins' => 'maghrib_begins',
            'maghrib_iqamah' => 'maghrib_iqamah',
            'isha_begins' => 'isha_begins',
            'isha_iqamah' => 'isha_iqamah',
            'sunrise' => 'sunrise',
            'midnight' => 'midnight',
        ];
        
        // Only the fields this endpoint advertises are accepted. Using the
        // request value as a property name allowed a caller to probe arbitrary
        // (including private) properties of the timetable row.
        if (!isset($field_mapping[$field])) {
            return [
                'field' => $field,
                'time' => '',
                'timestamp' => current_time('timestamp'),
            ];
        }

        $property = $field_mapping[$field];
        $time = $today_prayer_times->$property ?? '';
        
        return [
            'field' => $field,
            'time' => $time,
            'timestamp' => current_time('timestamp')
        ];
    }
}
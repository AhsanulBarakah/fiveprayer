<?php

namespace FivePrayer\Core\Controllers\API\EndPoints;
defined('ABSPATH') || exit;

use WP_REST_Request;
use WP_REST_Server;
use WP_Error;
use FivePrayer\Core\Helpers\Validator;
use FivePrayer\Core\Controllers\API\RestControllerBase;
use FivePrayer\Core\Helpers\PrayerDataCache;

class PrayerTimeTableController extends RestControllerBase
{
    /**
     * Object cache group shared by the whole plugin.
     */
    private const CACHE_GROUP = 'fiveprayer';

    /**
     * TTL for cached timetable rows. Writes truncate the table and then call
     * PrayerDataCache::invalidateAll(), so this is only a safety net.
     */
    private const TIMETABLE_CACHE_TTL = 300;

    private $table_name;

    public function __construct()
    {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'fp_timetable';
        // Routes are registered by ApiControllerRegistrar.
    }

    public function register_routes(): void
    {
        register_rest_route($this->get_namespace(), '/fp_prayertimetable', [
            'methods' => WP_REST_Server::CREATABLE,
            'callback' => [$this, 'insert_timetable'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route($this->get_namespace(), '/fp_prayertimetable', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_timetable'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route($this->get_namespace(), '/fp_prayertimetableyear', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_full_year'],
            'permission_callback' => [$this, 'check_permission'],
        ]);
    }

    public function check_permission()
    {
        return current_user_can('manage_options');
    }

    public function insert_timetable(WP_REST_Request $request)
    {
        global $wpdb;
        $data = $request->get_json_params();
        if (!is_array($data)) {
            return new WP_Error('invalid_json', 'Invalid JSON', ['status' => 400]);
        }

        $wpdb->query($wpdb->prepare("TRUNCATE TABLE %i", $this->table_name)); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared

        foreach ($data as &$prayer) {
            $result = $wpdb->insert($this->table_name, $this->sanitize_data($prayer)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            if ($result === false) {
                return new WP_Error('db_error', $wpdb->last_error, ['status' => 500]);
            }
        }

        // Every cached timetable row is stale now. Dynamic keys are dropped by
        // PrayerDataCache::invalidateAll() below; these are the request-scoped
        // listings that endpoint reads populate.
        // Must match the format-aware key get_full_year() stores under, so a
        // regenerated timetable is not masked by a stale cached response.
        wp_cache_delete('fiveprayer_timetable_year_' . md5($this->table_name . '|' . get_option('time_format')), self::CACHE_GROUP);
        wp_cache_delete('fiveprayer_timetable_all', self::CACHE_GROUP);

        PrayerDataCache::invalidateAll();

        // Also purge external cache plugins to ensure changes are visible
        // immediately. The shared helper deliberately leaves the object cache
        // alone; this controller used to flush it for the whole site.
        if (function_exists('fiveprayer_purge_external_caches')) {
            fiveprayer_purge_external_caches();
        }

        // PrayerDataCache::getProcessedTimeTable();
        return rest_ensure_response(['message' => 'Timetable updated']);
    }


    public function get_timetable(WP_REST_Request $request)
    {
        global $wpdb;
        $month = (int) ($request->get_param('newMonth') ?: wp_date('n'));
        $year  = (int) wp_date('Y');
        if (!Validator::validateMonth($month)) {
            return new WP_Error('invalid_month', 'Invalid month', ['status' => 400]);
        }

        // Half-open date range keeps the query sargable so it can use the
        // fp_timetable_date index instead of scanning the whole table.
        $range_start = sprintf('%04d-%02d-01', $year, $month);
        $range_end   = $month === 12
            ? sprintf('%04d-01-01', $year + 1)
            : sprintf('%04d-%02d-01', $year, $month + 1);

        $query = $wpdb->prepare(
            "SELECT date, fajr_begins, fajr_iqamah, fajr_masjid_jamaah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah, midnight, currentDate, hijri_date FROM %i WHERE date >= %s AND date < %s",
            $this->table_name, $range_start, $range_end
        );

        $cache_key = 'fiveprayer_timetable_month_' . md5($year . '|' . $month);
        $results   = wp_cache_get($cache_key, self::CACHE_GROUP);

        if (!is_array($results)) {
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared -- $query was prepared above.
            $results = $wpdb->get_results($query);
            wp_cache_set($cache_key, $results, self::CACHE_GROUP, self::TIMETABLE_CACHE_TTL);
        }

        return rest_ensure_response($this->format_results($results));
    }

    public function get_full_year() {
        global $wpdb;

        // The full-year response is converted to 12-hour time with the
        // WordPress AM/PM casing, so the time format is part of the cache key:
        // changing Settings → General → Time Format yields a fresh key instead
        // of serving the old casing until the TTL expires.
        $cache_key = 'fiveprayer_timetable_year_' . md5($this->table_name . '|' . get_option('time_format'));
        $results   = wp_cache_get($cache_key, self::CACHE_GROUP);

        if (!is_array($results)) {
            $results = $wpdb->get_results($wpdb->prepare("SELECT date, fajr_begins, fajr_iqamah, fajr_masjid_jamaah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah, midnight, currentDate, hijri_date FROM %i", $this->table_name)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($cache_key, $results, self::CACHE_GROUP, self::TIMETABLE_CACHE_TTL);
        }

        // First format results as before
        $formatted = $this->format_results($results);
        
        // Then convert times
        $formatted = $this->convert_times_to_12h($formatted);
        
        return rest_ensure_response($formatted);
    }

    private function sanitize_data(array $prayer): array
    {
        $time_fields = ['fajr_begins', 'fajr_iqamah', 'fajr_masjid_jamaah', 'dhuhr_begins', 'dhuhr_iqamah',
            'asr_begins', 'asr_second_begins', 'asr_iqamah', 'maghrib_begins', 'maghrib_iqamah', 'isha_begins', 'isha_iqamah',
            'midnight', 'sunrise'];

        // Validate and sanitize the date field
        $date_input = $prayer['date'] ?? '';
        
        // Check if date is valid (YYYY-MM-DD format)
        if (empty($date_input) || $date_input === '0000-00-00' || $date_input === 'NaN-NaN-NaN') {
            // Try to generate a valid date from currentDate if available
            $current_date = $prayer['currentDate'] ?? '';
            if (!empty($current_date)) {
                // Parse "1 January 2026" format
                $parsed = date_parse($current_date);
                if ($parsed['year'] && $parsed['month'] && $parsed['day']) {
                    $date_input = sprintf('%04d-%02d-%02d', $parsed['year'], $parsed['month'], $parsed['day']);
                }
            }
        }
        
        // Final validation - if still invalid, use current date as fallback
        if (empty($date_input) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $date_input)) {
            $date_input = gmdate('Y-m-d'); // Fallback to current date
        }

        $data = [
            'date' => sanitize_text_field($date_input),
            'currentDate' => sanitize_text_field($prayer['currentDate'] ?? ''),
            'className' => sanitize_text_field($prayer['className'] ?? ''),
            'today' => absint($prayer['today'] ?? 0),
        ];

        foreach ($time_fields as &$field) {
            $value = $prayer[$field] ?? '';
            // The second 'Asr time is OPTIONAL — store NULL (not 00:00:00)
            // when the imported timetable did not carry it, so the optional
            // column stays blank instead of showing a bogus 12:00 AM.
            $data[$field] = ($field === 'asr_second_begins' && trim((string) $value) === '')
                ? null
                : $this->format_time($value);
        }

        return $data;
    }

    private function format_time($time)
    {
        $timestamp = strtotime(sanitize_text_field($time));
        return $timestamp ? gmdate('H:i:s', $timestamp) : '00:00:00';
    }

    private function format_results($results)
    {
        return array_map(function ($row) {
            return array_map('sanitize_text_field', (array) $row);
        }, (array) $results);
    }


    protected function convert_times_to_12h(array $data): array {
        $time_fields = [
            'asr_begins', 'asr_second_begins', 'asr_iqamah',
            'dhuhr_begins', 'dhuhr_iqamah',
            'fajr_begins', 'fajr_iqamah',
            'fajr_masjid_jamaah',
            'isha_begins', 'isha_iqamah',
            'maghrib_begins', 'maghrib_iqamah',
            'sunrise', 'midnight'
        ];
    
        foreach ($data as &$row) {
            $row = (array)$row;
            foreach ($time_fields as &$field) {
                if (!empty($row[$field])) {
                    $row[$field] = $this->convert_to_12_hour($row[$field]);
                }
            }
        }
    
        return $data;
    }
    
    protected function convert_to_12_hour(string $time): string {
        // Skip if already in 12-hour format (case-insensitive, because the
        // WordPress time format may already have produced lowercase "am").
        if (preg_match('/[AP]M/i', $time)) {
            return $time;
        }
    
        // Handle empty/invalid times
        if (empty($time) || $time === '00:00:00') {
            return $time;
        }
    
        $parts = explode(':', $time);
        $hour = (int)$parts[0];
        $minute = $parts[1] ?? '00';
        $second = $parts[2] ?? '00';
    
        $period = ($hour < 12) ? 'AM' : 'PM';
        // Follow the WordPress time format's AM/PM casing (`g:i a` → "am",
        // `g:i A` → "AM") so the generated data matches the site setting.
        if ($this->uses_lowercase_meridiem()) {
            $period = strtolower($period);
        }
        $hour_12 = ($hour > 12) ? $hour - 12 : $hour;
        $hour_12 = ($hour_12 == 0) ? 12 : $hour_12;
    
        return ($second === '00') 
            ? sprintf('%02d:%02d %s', $hour_12, $minute, $period)
            : sprintf('%02d:%02d:%02d %s', $hour_12, $minute, $second, $period);
    }

    /**
     * Whether the WordPress time format uses the lowercase meridiem token.
     *
     * `g:i a` (and `h:i:s a`, etc.) means the site shows "am"/"pm"; any other
     * format (e.g. `g:i A`) keeps the uppercase "AM"/"PM".
     */
    private function uses_lowercase_meridiem(): bool
    {
        $format = (string) get_option('time_format', 'g:i a');

        return strpos($format, 'a') !== false;
    }
}

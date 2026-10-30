<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use WP_REST_Request;
use WP_REST_Server;
use WP_Error;
use FivePrayer\Core\Helpers\Validator;

/** Prayer time API endpoints for External API. */
trait PrayerTimeEndpointTrait
{
    /** Get prayer times for a specific date. */
    public function get_prayer_times(WP_REST_Request $request)
    {
        try {
            global $wpdb;
            $date = $request->get_param('date');
            $time_format = $request->get_param('time_format');

            $resolved = $this->resolve_language_params($request);
            if (is_wp_error($resolved)) {
                return $resolved;
            }
            [$language, $selected_languages] = $resolved;

            if (!$date) {
                return new WP_Error(
                    'missing_date',
                    'Date parameter is required. Use Y-m-d format.',
                    ['status' => 400]
                );
            }

            if (!Validator::validateDate($date)) {
                return new WP_Error(
                    'invalid_date',
                    'Invalid date format. Use Y-m-d format.',
                    ['status' => 400]
                );
            }

            $ramadan_start_date = $request->get_param('ramadan_start_date');
            if ($ramadan_start_date) {
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $ramadan_start_date)) {
                    return new WP_Error('invalid_date', 'Invalid Ramadan start date format. Use Y-m-d format.', ['status' => 400]);
                }
                $date_parts = explode('-', $ramadan_start_date);
                if (!checkdate((int) $date_parts[1], (int) $date_parts[2], (int) $date_parts[0])) {
                    return new WP_Error('invalid_date', 'Invalid Ramadan start date.', ['status' => 400]);
                }
            }

            $table_name = $wpdb->prefix . 'fp_timetable';

            // Shared with the response builder, which reads the same row for the
            // same date. Timetable writes call PrayerDataCache::invalidateAll().
            $cache_key = 'fiveprayer_timetable_date_' . md5($date);
            $result    = wp_cache_get($cache_key, 'fiveprayer');

            if (false === $result) {
                $result = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare(
                        "SELECT date, fajr_begins, fajr_iqamah, fajr_masjid_jamaah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah, midnight, currentDate, hijri_date FROM %i WHERE date = %s",
                        $table_name,
                        $date
                    )
                );
                wp_cache_set($cache_key, $result, 'fiveprayer', 300);
            }

            if (!$result) {
                return new WP_Error(
                    'no_data',
                    'No prayer times found for the specified date. Ensure the date exists in the timetable.',
                    ['status' => 404, 'date' => $date]
                );
            }

            $timezone = get_option('timezone_string') ?: 'UTC';

            if ($selected_languages && count($selected_languages) > 1) {
                $prayer_times = $this->format_prayer_times_multilingual($result, $selected_languages, $time_format);
            } else {
                $target_lang = $selected_languages ? $selected_languages[0] : $language;
                $prayer_times = $this->format_prayer_times($result, $timezone, $target_lang, $time_format);
            }

            $translated_dates = $this->translate_date($date, $language, $selected_languages);
            $hijri_info = $this->get_hijri_date_info($date, $language, $selected_languages, $ramadan_start_date);

            $response = [
                'date' => $date,
                'gregorian_date' => $translated_dates,
                'hijri_info' => $hijri_info,
                'timezone' => $timezone,
                'language' => $language ?: '',
                'time_format' => $time_format ?: '12h',
                'prayer_times' => $prayer_times,
                'mosque_info' => $this->get_mosque_info_data($language, $selected_languages),
                'timestamp' => time(),
            ];

            if ($selected_languages) {
                $response['languages'] = $selected_languages;
            }

            return rest_ensure_response($response);
        } catch (\Throwable $e) {
            return new WP_Error(
                'server_error',
                'An unexpected error occurred while fetching prayer times.',
                ['status' => 500, 'debug' => defined('WP_DEBUG') && WP_DEBUG ? $e->getMessage() : null]
            );
        }
    }

    /** Get today's prayer times. */
    public function get_today_prayer_times(WP_REST_Request $request)
    {
        try {
            $timezone = get_option('timezone_string') ?: 'UTC';
            $time_format = $request->get_param('time_format');
            $today = wp_date('Y-m-d');

            $resolved = $this->resolve_language_params($request);
            if (is_wp_error($resolved)) {
                return $resolved;
            }
            [$language, $selected_languages] = $resolved;

            return $this->get_prayer_times_by_date($today, $timezone, $language, $selected_languages, $time_format);
        } catch (\Throwable $e) {
            return new WP_Error(
                'server_error',
                'An unexpected error occurred while fetching today\'s prayer times.',
                ['status' => 500, 'debug' => defined('WP_DEBUG') && WP_DEBUG ? $e->getMessage() : null]
            );
        }
    }

    /** Get prayer times for a month. */
    public function get_month_prayer_times(WP_REST_Request $request)
    {
        try {
            global $wpdb;

            $allowed_params = ['month', 'year', 'lang', 'langs', 'ramadan_only', 'ramadan_start_date', 'hijri_format', 'clear_cache', 'time_format', 'include_extras'];
            $provided_params = $request->get_params();
            $invalid_params = array_diff(array_keys($provided_params), $allowed_params);
            if (!empty($invalid_params)) {
                return new WP_Error('invalid_params', '', ['status' => 400, 'invalid_params' => array_values($invalid_params)]);
            }

            $month = $request->get_param('month') ?? wp_date('n');
            if (!is_numeric($month) || $month < 1 || $month > 12) {
                return new WP_Error('invalid_month', '', ['status' => 400]);
            }
            $year = $request->get_param('year') ?? wp_date('Y');
            if (!is_numeric($year) || $year < 2020 || $year > 2030) {
                return new WP_Error('invalid_year', '', ['status' => 400]);
            }
            $resolved = $this->resolve_language_params($request);
            if (is_wp_error($resolved)) {
                return $resolved;
            }
            [$language, $selected_languages] = $resolved;

            $ramadan_only = $request->get_param('ramadan_only') ?? false;
            $ramadan_start_date = $request->get_param('ramadan_start_date');
            if ($ramadan_start_date) {
                if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $ramadan_start_date)) {
                    return new WP_Error('invalid_date', '', ['status' => 400]);
                }
                $date_parts = explode('-', $ramadan_start_date);
                if (!checkdate((int) $date_parts[1], (int) $date_parts[2], (int) $date_parts[0])) {
                    return new WP_Error('invalid_date', '', ['status' => 400]);
                }
            }

            $time_format = $request->get_param('time_format');
            // `include_extras` is still accepted so existing clients keep
            // working, but it no longer changes the payload: the second ‘Asr
            // (asr2) is a standard field now, returned whenever the day has one.
            $table_name = $wpdb->prefix . 'fp_timetable';

            // The month listing is the heaviest read on this endpoint, so it is
            // cached per year/month and dropped by the timetable import.
            $cache_key = 'fiveprayer_timetable_month_' . md5($year . '|' . $month . '|' . ($ramadan_only ? 'ramadan' : 'all'));
            $results   = wp_cache_get($cache_key, 'fiveprayer');

            if (!is_array($results)) {
                // Half-open date ranges keep these reads sargable so they can use
                // the fp_timetable_date index instead of a full table scan.
                if ($ramadan_only) {
                    $range_start = sprintf('%04d-01-01', (int) $year);
                    $range_end   = sprintf('%04d-01-01', (int) $year + 1);
                    $results = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                        $wpdb->prepare(
                            "SELECT date, fajr_begins, fajr_iqamah, fajr_masjid_jamaah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah, midnight, currentDate, hijri_date FROM %i WHERE date >= %s AND date < %s ORDER BY date",
                            $table_name,
                            $range_start,
                            $range_end
                        )
                    );
                } else {
                    $range_start = sprintf('%04d-%02d-01', (int) $year, (int) $month);
                    $range_end   = (int) $month === 12
                        ? sprintf('%04d-01-01', (int) $year + 1)
                        : sprintf('%04d-%02d-01', (int) $year, (int) $month + 1);
                    $results = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                        $wpdb->prepare(
                            "SELECT date, fajr_begins, fajr_iqamah, fajr_masjid_jamaah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah, midnight, currentDate, hijri_date FROM %i WHERE date >= %s AND date < %s ORDER BY date",
                            $table_name,
                            $range_start,
                            $range_end
                        )
                    );
                }

                wp_cache_set($cache_key, $results, 'fiveprayer', 300);
            }

            if (empty($results)) {
                return new WP_Error('no_data', '', ['status' => 404]);
            }

            $month_data = [];
            foreach ($results as &$result) {
                $hijri_info = $this->get_hijri_date_info($result->date, $language, $selected_languages, $ramadan_start_date);
                if ($ramadan_only && !$hijri_info['is_ramadan']) {
                    continue;
                }

                $translated_dates = $this->translate_date($result->date, $language, $selected_languages);

                if ($selected_languages && count($selected_languages) > 1) {
                    $prayer_times = $this->build_multilingual_prayer_times($result, $selected_languages, $time_format);
                } else {
                    $target_lang = $selected_languages ? $selected_languages[0] : $language;
                    $translationManager = $this->get_translation_manager($target_lang);
                    $prayer_times = $this->build_single_language_prayer_times($result, $translationManager, $target_lang, $time_format);
                }

                $month_data[] = [
                    'date' => $result->date,
                    'gregorian_date' => $translated_dates,
                    'hijri_info' => $hijri_info,
                    'prayer_times' => $prayer_times,
                ];
            }

            if (empty($month_data)) {
                if ($ramadan_only) {
                    return new WP_Error('no_ramadan_data', '', ['status' => 404]);
                }
                return new WP_Error('no_data', '', ['status' => 404]);
            }
            $actual_month = (int) $month;
            $actual_year = (int) $year;
            if ($ramadan_only && !empty($month_data)) {
                $first_date = reset($month_data)['date'];
                $actual_month = (int) gmdate('n', strtotime($first_date));
                $actual_year = (int) gmdate('Y', strtotime($first_date));
            }

            return rest_ensure_response([
                'month' => $actual_month,
                'year' => $actual_year,
                'timezone' => get_option('timezone_string') ?: 'UTC',
                'language' => $language ?: 'default',
                'languages' => $selected_languages,
                'time_format' => $time_format ?: '12h',
                'ramadan_only' => $ramadan_only,
                'data' => $month_data,
                'mosque_info' => $this->get_mosque_info_data($language, $selected_languages),
                'timestamp' => time(),
            ]);
        } catch (\Throwable $e) {
            return new WP_Error(
                'server_error',
                'An unexpected error occurred while fetching monthly prayer times.',
                ['status' => 500, 'debug' => defined('WP_DEBUG') && WP_DEBUG ? $e->getMessage() : null]
            );
        }
    }

    /** Get the next prayer time. */
    public function get_next_prayer(WP_REST_Request $request)
    {
        try {
            $time_format = $request->get_param('time_format');

            $resolved = $this->resolve_language_params($request);
            if (is_wp_error($resolved)) {
                return $resolved;
            }
            [$language, $selected_languages] = $resolved;

            $wp_timezone = get_option('timezone_string') ?: 'UTC';
            $today = current_time('Y-m-d');

            global $wpdb;
            $table_name = $wpdb->prefix . 'fp_timetable';

            // Own cache key: this row carries a subset of the timetable columns,
            // so it must not share an entry with the full-row reads above.
            $cache_key = 'fiveprayer_next_prayer_row_' . md5($today);
            $result    = wp_cache_get($cache_key, 'fiveprayer');

            if (false === $result) {
                $result = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare(
                        "SELECT fajr_begins, fajr_iqamah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah FROM %i WHERE date = %s",
                        $table_name,
                        $today
                    )
                );
                wp_cache_set($cache_key, $result, 'fiveprayer', 300);
            }

            if (!$result) {
                return new WP_Error('no_data', '', ['status' => 404]);
            }

            $current_time = current_time('H:i:s');

            $prayers = [
                'fajr' => $result->fajr_iqamah,
                'dhuhr' => $result->dhuhr_iqamah,
                'asr' => $result->asr_iqamah,
                'maghrib' => $result->maghrib_iqamah,
                'isha' => $result->isha_iqamah,
            ];

            $next_prayer = null;
            $next_time = null;

            foreach ($prayers as $prayer_name => $prayer_time) {
                if (!empty($prayer_time) && $prayer_time > $current_time) {
                    $next_prayer = $prayer_name;
                    $next_time = $prayer_time;
                    break;
                }
            }

            if (!$next_prayer) {
                $tomorrow = gmdate('Y-m-d', strtotime('+1 day'));
                $tomorrow_cache_key = 'fiveprayer_next_prayer_tomorrow_' . md5($tomorrow);
                $tomorrow_result    = wp_cache_get($tomorrow_cache_key, 'fiveprayer');

                if (false === $tomorrow_result) {
                    $tomorrow_result = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                        $wpdb->prepare(
                            "SELECT fajr_iqamah FROM %i WHERE date = %s",
                            $table_name,
                            $tomorrow
                        )
                    );
                    wp_cache_set($tomorrow_cache_key, $tomorrow_result, 'fiveprayer', 300);
                }

                if ($tomorrow_result) {
                    $next_prayer = 'fajr';
                    $next_time = $tomorrow_result->fajr_iqamah;
                } else {
                    return new WP_Error('no_data', '', ['status' => 404]);
                }
            }

            if (!$next_prayer || !$next_time) {
                return new WP_Error('no_next_prayer', '', ['status' => 500]);
            }

            $current_time_format = ($time_format === '24h') ? 'H:i:s' : 'g:i:s A';
            $next_prayer_timestamp = strtotime($today . ' ' . $next_time);
            $date_translated = $this->translate_date($today, $language, $selected_languages);
            $hijri_info = $this->get_hijri_date_info($today, $language, $selected_languages);

            $prayer_schedule = $this->build_prayer_schedule_array($result);

            if ($selected_languages && count($selected_languages) > 1) {
                return $this->build_next_prayer_multilingual_response($prayer_schedule, $next_prayer, $next_time, $current_time, $current_time_format, $next_prayer_timestamp, $today, $date_translated, $hijri_info, $selected_languages, $wp_timezone, $time_format, $language);
            }

            $target_lang = $selected_languages ? $selected_languages[0] : $language;
            return $this->build_next_prayer_single_response($prayer_schedule, $next_prayer, $next_time, $current_time, $current_time_format, $next_prayer_timestamp, $today, $date_translated, $hijri_info, $target_lang, $wp_timezone, $time_format);
        } catch (\Exception $e) {
            return new WP_Error('server_error', '', ['status' => 500, 'debug' => defined('WP_DEBUG') && WP_DEBUG ? $e->getMessage() : null]);
        }
    }

}

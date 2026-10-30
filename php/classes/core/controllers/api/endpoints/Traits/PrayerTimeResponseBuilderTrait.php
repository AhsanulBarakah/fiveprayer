<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use WP_Error;

/**
 * Response builder for prayer time endpoints.
 *
 * Consistent structure for all prayer entries:
 *   - Prayers with begins/iqamah: { name, begins_label, begins_time, iqamah_label, iqamah_time }
 *   - Sunrise/Midnight: { name, label, begins_time }
 *
 * All label fields contain translated strings from the database.
 * All *_time fields contain formatted time strings.
 */
trait PrayerTimeResponseBuilderTrait
{
    /** Format prayer times for response (single language). */
    private function format_prayer_times($result, string $timezone, ?string $language_code = null, ?string $time_format = null): array
    {
        $translationManager = $this->get_translation_manager($language_code);
        $begins_label = $translationManager->getTranslatedLabel('Begins');
        $iqamah_label = $translationManager->getTranslatedLabel('Iqamah');

        $prayer_times = [
            'fajr' => [
                'name' => $translationManager->getTranslatedPrayerName('Fajr'),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time($result->fajr_begins, $timezone, $language_code, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time($result->fajr_iqamah, $timezone, $language_code, $time_format),
            ],
            'dhuhr' => [
                'name' => $translationManager->getTranslatedPrayerName('Dhuhr'),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time($result->dhuhr_begins, $timezone, $language_code, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time($result->dhuhr_iqamah, $timezone, $language_code, $time_format),
            ],
            'asr' => [
                'name' => $translationManager->getTranslatedPrayerName('Asr'),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time($result->asr_begins, $timezone, $language_code, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time($result->asr_iqamah, $timezone, $language_code, $time_format),
            ],
            'maghrib' => [
                'name' => $translationManager->getTranslatedPrayerName('Maghrib'),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time($result->maghrib_begins, $timezone, $language_code, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time($result->maghrib_iqamah, $timezone, $language_code, $time_format),
            ],
            'isha' => [
                'name' => $translationManager->getTranslatedPrayerName('Isha'),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time($result->isha_begins, $timezone, $language_code, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time($result->isha_iqamah, $timezone, $language_code, $time_format),
            ],
            'sunrise' => [
                'name' => $translationManager->getTranslatedPrayerName('Sunrise'),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time($result->sunrise, $timezone, $language_code, $time_format),
            ],
            'midnight' => [
                'name' => $translationManager->getTranslatedLabel('Midnight'),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time($result->midnight, $timezone, $language_code, $time_format),
            ],
        ];

        // Second ‘Asr (2 Mithl / Hanafi) is a standard field now, so clients no
        // longer need ?include_extras=true. Days whose row has no stored second
        // ‘Asr simply omit the key, exactly as before.
        return $this->insert_after_asr(
            $prayer_times,
            $this->asr_second_entry(
                $result,
                $translationManager->getTranslatedPrayerName('Hanafi'),
                $begins_label,
                function ($time) use ($timezone, $language_code, $time_format) {
                    return $this->convert_time($time, $timezone, $language_code, $time_format);
                }
            )
        );
    }

    /** Format prayer times for response (multilingual). */
    private function format_prayer_times_multilingual($result, array $selected_languages, ?string $time_format): array
    {
        $begins_label = $this->get_label_multilingual('Begins', $selected_languages);
        $iqamah_label = $this->get_label_multilingual('Iqamah', $selected_languages);

        $prayer_times = [
            'fajr' => [
                'name' => $this->get_prayer_name_multilingual('Fajr', $selected_languages),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time_multilingual($result->fajr_begins, $selected_languages, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time_multilingual($result->fajr_iqamah, $selected_languages, $time_format),
            ],
            'dhuhr' => [
                'name' => $this->get_prayer_name_multilingual('Dhuhr', $selected_languages),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time_multilingual($result->dhuhr_begins, $selected_languages, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time_multilingual($result->dhuhr_iqamah, $selected_languages, $time_format),
            ],
            'asr' => [
                'name' => $this->get_prayer_name_multilingual('Asr', $selected_languages),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time_multilingual($result->asr_begins, $selected_languages, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time_multilingual($result->asr_iqamah, $selected_languages, $time_format),
            ],
            'maghrib' => [
                'name' => $this->get_prayer_name_multilingual('Maghrib', $selected_languages),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time_multilingual($result->maghrib_begins, $selected_languages, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time_multilingual($result->maghrib_iqamah, $selected_languages, $time_format),
            ],
            'isha' => [
                'name' => $this->get_prayer_name_multilingual('Isha', $selected_languages),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time_multilingual($result->isha_begins, $selected_languages, $time_format),
                'iqamah_label' => $iqamah_label,
                'iqamah_time' => $this->convert_time_multilingual($result->isha_iqamah, $selected_languages, $time_format),
            ],
            'sunrise' => [
                'name' => $this->get_prayer_name_multilingual('Sunrise', $selected_languages),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time_multilingual($result->sunrise, $selected_languages, $time_format),
            ],
            'midnight' => [
                'name' => $this->get_label_multilingual('Midnight', $selected_languages),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time_multilingual($result->midnight, $selected_languages, $time_format),
            ],
        ];

        // Second ‘Asr (2 Mithl / Hanafi) is a standard field — see
        // format_prayer_times() for the same rule.
        return $this->insert_after_asr(
            $prayer_times,
            $this->asr_second_entry(
                $result,
                $this->get_prayer_name_multilingual('Hanafi', $selected_languages),
                $begins_label,
                function ($time) use ($selected_languages, $time_format) {
                    return $this->convert_time_multilingual($time, $selected_languages, $time_format);
                }
            )
        );
    }

    /**
     * The optional second ‘Asr (2 Mithl / Hanafi) entry for one day.
     *
     * Returns an empty array when the row carries no stored second ‘Asr, so a
     * timetable generated before the column existed keeps its exact old shape.
     *
     * @param object   $result       Timetable row.
     * @param string   $name         Translated “Hanafi” prayer name.
     * @param string   $begins_label Translated “Begins” label.
     * @param callable $format_time  Formats one stored 'HH:MM:SS' for the response.
     * @return array
     */
    private function asr_second_entry($result, string $name, string $begins_label, callable $format_time): array
    {
        if (empty($result->asr_second_begins)) {
            return [];
        }

        return [
            'name' => $name,
            'begins_label' => $begins_label,
            'begins_time' => $format_time($result->asr_second_begins),
        ];
    }

    /**
     * Insert an entry directly after `asr`, leaving every other key in place.
     *
     * Keeps `asr2` next to `asr` in the JSON (the position it already had when
     * it was an opt-in extra) without unpacking string keys, which PHP 8.1 only.
     *
     * @param array $prayer_times Ordered prayer entries.
     * @param array $entry        Entry to insert, or an empty array to skip.
     * @return array
     */
    private function insert_after_asr(array $prayer_times, array $entry): array
    {
        if ([] === $entry) {
            return $prayer_times;
        }

        $with_asr2 = [];
        foreach ($prayer_times as $key => $value) {
            $with_asr2[$key] = $value;
            if ('asr' === $key) {
                $with_asr2['asr2'] = $entry;
            }
        }

        return $with_asr2;
    }

    /** Get prayer times by date (daily endpoint shared logic). */
    private function get_prayer_times_by_date(string $date, string $timezone, ?string $language_code = null, ?array $selected_languages = null, ?string $time_format = null)
    {
        global $wpdb;
        $table_name = $wpdb->prefix . 'fp_timetable';

        // Shared with the daily endpoint, which reads the same row for the same
        // date. Timetable writes call PrayerDataCache::invalidateAll().
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
            return new WP_Error('no_data', '', ['status' => 404]);
        }

        if ($selected_languages && count($selected_languages) > 1) {
            $prayer_times = $this->format_prayer_times_multilingual($result, $selected_languages, $time_format);
        } else {
            $target_lang = $selected_languages ? $selected_languages[0] : $language_code;
            $prayer_times = $this->format_prayer_times($result, $timezone, $target_lang, $time_format);
        }

        $translated_dates = $this->translate_date($date, $language_code, $selected_languages);
        $hijri_info = $this->get_hijri_date_info($date, $language_code, $selected_languages);

        $response = [
            'date' => $date,
            'gregorian_date' => $translated_dates,
            'hijri_info' => $hijri_info,
            'timezone' => $timezone,
            'language' => $language_code ?: '',
            'time_format' => $time_format ?: '12h',
            'prayer_times' => $prayer_times,
            'mosque_info' => $this->get_mosque_info_data($language_code, $selected_languages),
            'timestamp' => time(),
        ];

        if ($selected_languages) {
            $response['languages'] = $selected_languages;
        }

        return rest_ensure_response($response);
    }

    /** Build prayer schedule array for next prayer response. */
    private function build_prayer_schedule_array($result): array
    {
        return [
            'fajr' => ['begins' => $result->fajr_begins, 'iqamah' => $result->fajr_iqamah],
            'sunrise' => ['time' => $result->sunrise],
            'dhuhr' => ['begins' => $result->dhuhr_begins, 'iqamah' => $result->dhuhr_iqamah],
            'asr' => ['begins' => $result->asr_begins, 'iqamah' => $result->asr_iqamah],
            'maghrib' => ['begins' => $result->maghrib_begins, 'iqamah' => $result->maghrib_iqamah],
            'isha' => ['begins' => $result->isha_begins, 'iqamah' => $result->isha_iqamah],
        ];
    }

    /** Build multilingual prayer times for monthly data. Same structure as daily. */
    private function build_multilingual_prayer_times($result, array $selected_languages, ?string $time_format): array
    {
        $begins_label = $this->get_label_multilingual('Begins', $selected_languages);
        $iqamah_label = $this->get_label_multilingual('Iqamah', $selected_languages);

        $prayer_times = [
            'fajr' => ['name' => $this->get_prayer_name_multilingual('Fajr', $selected_languages), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time_multilingual($result->fajr_begins, $selected_languages, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time_multilingual($result->fajr_iqamah, $selected_languages, $time_format)],
            'sunrise' => ['name' => $this->get_prayer_name_multilingual('Sunrise', $selected_languages), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time_multilingual($result->sunrise, $selected_languages, $time_format)],
            'dhuhr' => ['name' => $this->get_prayer_name_multilingual('Dhuhr', $selected_languages), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time_multilingual($result->dhuhr_begins, $selected_languages, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time_multilingual($result->dhuhr_iqamah, $selected_languages, $time_format)],
            'asr' => ['name' => $this->get_prayer_name_multilingual('Asr', $selected_languages), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time_multilingual($result->asr_begins, $selected_languages, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time_multilingual($result->asr_iqamah, $selected_languages, $time_format)],
        ];

        // Second ‘Asr (2 Mithl / Hanafi) — always included when the day carries
        // a stored time, the same standard field the daily endpoints return.
        // Days without one omit the key, so their shape is unchanged.
        if (!empty($result->asr_second_begins)) {
            $prayer_times['asr2'] = [
                'name' => $this->get_prayer_name_multilingual('Hanafi', $selected_languages),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time_multilingual($result->asr_second_begins, $selected_languages, $time_format),
            ];
        }

        $prayer_times += [
            'maghrib' => ['name' => $this->get_prayer_name_multilingual('Maghrib', $selected_languages), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time_multilingual($result->maghrib_begins, $selected_languages, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time_multilingual($result->maghrib_iqamah, $selected_languages, $time_format)],
            'isha' => ['name' => $this->get_prayer_name_multilingual('Isha', $selected_languages), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time_multilingual($result->isha_begins, $selected_languages, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time_multilingual($result->isha_iqamah, $selected_languages, $time_format)],
            'midnight' => ['name' => $this->get_prayer_name_multilingual('Midnight', $selected_languages), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time_multilingual($result->midnight, $selected_languages, $time_format)],
        ];

        return $prayer_times;
    }

    /** Build single language prayer times for monthly data. Same structure as daily. */
    private function build_single_language_prayer_times($result, $translationManager, string $target_lang, ?string $time_format): array
    {
        $begins_label = $translationManager->getTranslatedLabel('Begins');
        $iqamah_label = $translationManager->getTranslatedLabel('Iqamah');

        $prayer_times = [
            'fajr' => ['name' => $translationManager->getTranslatedPrayerName('Fajr'), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time($result->fajr_begins, '', $target_lang, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time($result->fajr_iqamah, '', $target_lang, $time_format)],
            'sunrise' => ['name' => $translationManager->getTranslatedPrayerName('Sunrise'), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time($result->sunrise, '', $target_lang, $time_format)],
            'dhuhr' => ['name' => $translationManager->getTranslatedPrayerName('Dhuhr'), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time($result->dhuhr_begins, '', $target_lang, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time($result->dhuhr_iqamah, '', $target_lang, $time_format)],
            'asr' => ['name' => $translationManager->getTranslatedPrayerName('Asr'), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time($result->asr_begins, '', $target_lang, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time($result->asr_iqamah, '', $target_lang, $time_format)],
        ];

        // Second ‘Asr (2 Mithl / Hanafi) — always included when the day carries
        // a stored time, the same standard field the daily endpoints return.
        // Days without one omit the key, so their shape is unchanged.
        if (!empty($result->asr_second_begins)) {
            $prayer_times['asr2'] = [
                'name' => $translationManager->getTranslatedPrayerName('Hanafi'),
                'begins_label' => $begins_label,
                'begins_time' => $this->convert_time($result->asr_second_begins, '', $target_lang, $time_format),
            ];
        }

        $prayer_times += [
            'maghrib' => ['name' => $translationManager->getTranslatedPrayerName('Maghrib'), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time($result->maghrib_begins, '', $target_lang, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time($result->maghrib_iqamah, '', $target_lang, $time_format)],
            'isha' => ['name' => $translationManager->getTranslatedPrayerName('Isha'), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time($result->isha_begins, '', $target_lang, $time_format), 'iqamah_label' => $iqamah_label, 'iqamah_time' => $this->convert_time($result->isha_iqamah, '', $target_lang, $time_format)],
            'midnight' => ['name' => $translationManager->getTranslatedLabel('Midnight'), 'begins_label' => $begins_label, 'begins_time' => $this->convert_time($result->midnight, '', $target_lang, $time_format)],
        ];

        return $prayer_times;
    }

    /** Build next prayer response with multilingual support. */
    private function build_next_prayer_multilingual_response(
        array $prayer_schedule,
        string $next_prayer,
        string $next_time,
        string $current_time,
        string $current_time_format,
        int $next_prayer_timestamp,
        string $today,
        array $date_translated,
        array $hijri_info,
        array $selected_languages,
        string $wp_timezone,
        ?string $time_format,
        ?string $language = null
    ) {
        $prayer_name_multilingual = $this->get_prayer_name_multilingual(ucfirst($next_prayer), $selected_languages);
        $time_multilingual = $this->convert_time_multilingual($next_time, $selected_languages, $time_format);

        $current_time_multilingual = [];
        foreach ($selected_languages as $lang) {
            $timestamp = strtotime($current_time);
            $formatted = gmdate($current_time_format, $timestamp);
            $current_time_multilingual[$lang] = $this->translate_numbers_in_time($formatted, $lang, $time_format);
        }
        $schedule_multilingual = [];
        $begins_label = $this->get_label_multilingual('Begins', $selected_languages);
        $iqamah_label = $this->get_label_multilingual('Iqamah', $selected_languages);

        foreach ($prayer_schedule as $prayer_key => $times) {
            $prayer_name_mult = $this->get_prayer_name_multilingual(ucfirst($prayer_key), $selected_languages);
            $schedule_multilingual[$prayer_key] = ['name' => $prayer_name_mult];
            if (isset($times['begins'])) {
                $schedule_multilingual[$prayer_key]['begins_label'] = $begins_label;
                $schedule_multilingual[$prayer_key]['begins_time'] = $this->convert_time_multilingual($times['begins'], $selected_languages, $time_format);
            }
            if (isset($times['iqamah'])) {
                $schedule_multilingual[$prayer_key]['iqamah_label'] = $iqamah_label;
                $schedule_multilingual[$prayer_key]['iqamah_time'] = $this->convert_time_multilingual($times['iqamah'], $selected_languages, $time_format);
            }
            if (isset($times['time'])) {
                $schedule_multilingual[$prayer_key]['begins_label'] = $begins_label;
                $schedule_multilingual[$prayer_key]['begins_time'] = $this->convert_time_multilingual($times['time'], $selected_languages, $time_format);
            }
        }
        return rest_ensure_response([
            'date' => $today,
            'gregorian_date' => $date_translated,
            'hijri_info' => $hijri_info,
            'next_prayer_label' => $this->get_label_multilingual('Next Prayer', $selected_languages),
            'current_prayer_label' => $this->get_label_multilingual('The Current Prayer', $selected_languages),
            'next_prayer_dynamic' => $prayer_name_multilingual,
            'next_time_dynamic' => $time_multilingual,
            'current_local_time_label' => $this->get_label_multilingual('Current Local Time', $selected_languages),
            'current_time' => $current_time_multilingual,
            'begins_label' => $begins_label,
            'iqamah_label' => $iqamah_label,
            'prayer_schedule' => $schedule_multilingual,
            'prayer_times_for_today_label' => $this->get_label_multilingual('Prayer Times For Today', $selected_languages),
            'mosque_info' => $this->get_mosque_info_data($language, $selected_languages),
            'timezone' => $wp_timezone,
            'language' => $language ?: '',
            'languages' => $selected_languages,
            'time_format' => $time_format ?: '12h',
            'timestamp' => $next_prayer_timestamp,
        ]);
    }

    /** Build next prayer response for single language. */
    private function build_next_prayer_single_response(
        array $prayer_schedule,
        string $next_prayer,
        string $next_time,
        string $current_time,
        string $current_time_format,
        int $next_prayer_timestamp,
        string $today,
        array $date_translated,
        array $hijri_info,
        ?string $target_lang,
        string $wp_timezone,
        ?string $time_format
    ) {
        $translationManager = $this->get_translation_manager($target_lang);
        $prayer_name = $translationManager->getTranslatedPrayerName(ucfirst($next_prayer));
        $formatted_time = $this->convert_time($next_time, '', $target_lang, $time_format);

        $timestamp = strtotime($current_time);
        $formatted_current_time = gmdate($current_time_format, $timestamp);
        $formatted_current_time = $this->translate_numbers_in_time($formatted_current_time, $target_lang, $time_format);

        $schedule_single = [];
        $begins_label = $translationManager->getTranslatedLabel('Begins');
        $iqamah_label = $translationManager->getTranslatedLabel('Iqamah');

        foreach ($prayer_schedule as $prayer_key => $times) {
            $schedule_single[$prayer_key] = ['name' => $translationManager->getTranslatedPrayerName(ucfirst($prayer_key))];
            if (isset($times['begins'])) {
                $schedule_single[$prayer_key]['begins_label'] = $begins_label;
                $schedule_single[$prayer_key]['begins_time'] = $this->convert_time($times['begins'], '', $target_lang, $time_format);
            }
            if (isset($times['iqamah'])) {
                $schedule_single[$prayer_key]['iqamah_label'] = $iqamah_label;
                $schedule_single[$prayer_key]['iqamah_time'] = $this->convert_time($times['iqamah'], '', $target_lang, $time_format);
            }
            if (isset($times['time'])) {
                $schedule_single[$prayer_key]['begins_label'] = $begins_label;
                $schedule_single[$prayer_key]['begins_time'] = $this->convert_time($times['time'], '', $target_lang, $time_format);
            }
        }
        return rest_ensure_response([
            'date' => $today,
            'gregorian_date' => $date_translated,
            'hijri_info' => $hijri_info,
            'next_prayer_label' => $translationManager->getTranslatedLabel('Next Prayer'),
            'current_prayer_label' => $translationManager->getTranslatedLabel('The Current Prayer'),
            'next_prayer_dynamic' => $prayer_name,
            'next_time_dynamic' => $formatted_time,
            'current_local_time_label' => $translationManager->getTranslatedLabel('Current Local Time'),
            'current_time' => $formatted_current_time,
            'begins_label' => $begins_label,
            'iqamah_label' => $iqamah_label,
            'prayer_schedule' => $schedule_single,
            'prayer_times_for_today_label' => $translationManager->getTranslatedLabel('Prayer Times For Today'),
            'mosque_info' => $this->get_mosque_info_data($target_lang),
            'timezone' => $wp_timezone,
            'language' => $target_lang ?: '',
            'time_format' => $time_format ?: '12h',
            'timestamp' => $next_prayer_timestamp,
        ]);
    }
}

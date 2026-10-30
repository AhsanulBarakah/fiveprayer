<?php

namespace FivePrayer\Core\DynamicContent\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers;

trait PrayerTimeContentTrait
{
    /**
     * Get current time as dynamic content
     */
    public static function get_current_time(): string
    {
        $time_format = get_option('time_format', 'h:i:s A');
        $current_time = date_i18n($time_format, current_time('timestamp'));

        $current_time = preg_replace_callback('/\b(am|pm)\b/i', function ($matches) {
            $original = $matches[0];
            if (strtolower($original) === 'am') {
                return 'AM';
            } elseif (strtolower($original) === 'pm') {
                return 'PM';
            }
            return $original;
        }, $current_time);

        return '<span class="fiveprayer-dynamic-content fiveprayer-single-current_time"
                 data-content-type="current_time"
                 data-field="current_time"
                 data-cache-buster="' . time() . '">' . esc_html($current_time) . '</span>';
    }

    /**
     * Get next prayer as dynamic content
     */
    public static function get_next_prayer(): string
    {
        $today_date = current_time('Y-m-d');
        $today_prayer_times = PrayerDataCache::getTodaysPrayerTimes($today_date);

        if (!$today_prayer_times) {
            return '<span class="fiveprayer-dynamic-content fiveprayer-single-next_prayer">Data unavailable</span>';
        }

        $meta_values = PrayerDataCache::getMultipleMetaValues([
            'timetable_prayer',
            'prayer_names',
            'activeLanguage'
        ]);

        $timetable_prayer = $meta_values['timetable_prayer'] ? json_decode($meta_values['timetable_prayer'], true) : [];
        $prayer_names = $meta_values['prayer_names'] ? json_decode($meta_values['prayer_names'], true) : [];
        $activeLanguage = $meta_values['activeLanguage'] ? json_decode($meta_values['activeLanguage'], true) : [['language_code' => 'en']];

        $nextPrayer = new \FivePrayer\Core\Daily\NextPrayer();
        $current_next_prayer = $nextPrayer->getNextPrayer(
            $today_prayer_times,
            $timetable_prayer,
            $prayer_names,
            $activeLanguage
        );

        // NextPrayer::getNextPrayerData() returns an array, not an object —
        // object reads here warned "Attempt to read property ... on array" and
        // rendered the placeholder empty. (The ESI renderer already reads it as
        // an array; the cron path accepts both shapes.)
        $next_prayer_data = $nextPrayer->getNextPrayerData();
        $next_prayer_data = is_array($next_prayer_data) ? $next_prayer_data : [];
        $next_prayer_text = !empty($next_prayer_data)
            ? ($next_prayer_data['name'] ?? '') . ' ' . ($next_prayer_data['time'] ?? '')
            : 'Calculating...';

        return '<span class="fiveprayer-dynamic-content fiveprayer-single-next_prayer"
                 data-content-type="next_prayer"
                 data-field="next_prayer"
                 data-cache-buster="' . time() . '">' . esc_html($next_prayer_text) . '</span>';
    }

    /**
     * Get specific prayer time as dynamic content
     */
    public static function get_prayer_time(string $prayer_type): string
    {
        $today_date = current_time('Y-m-d');
        $today_prayer_times = PrayerDataCache::getTodaysPrayerTimes($today_date);

        if (!$today_prayer_times) {
            return 'Time unavailable';
        }

        $field_mapping = [
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

        $property = $field_mapping[$prayer_type] ?? $prayer_type;
        $time = $today_prayer_times->$property ?? 'Time unavailable';

        return '<span class="fiveprayer-dynamic-content fiveprayer-single-' . esc_attr($prayer_type) . '"
                 data-content-type="single_prayer"
                 data-field="' . esc_attr($prayer_type) . '"
                 data-cache-buster="' . time() . '">' . esc_html($time) . '</span>';
    }

    /**
     * Get today's prayer times as dynamic content (vertical format)
     */
    public static function get_daily_prayer_times(): string
    {
        $shortcode_instance = ShortCodesSinglePrayers::getInstance();
        return $shortcode_instance->renderVerticalDailyPrayer([]);
    }

    /**
     * Get monthly prayer timetable as dynamic content
     */
    public static function get_monthly_prayer_timetable(): string
    {
        $timetable_month = new \FivePrayer\Core\ShortCodes\ShortCodeTimetableMonth();
        return $timetable_month->fpTimetableMonth([]);
    }

    /**
     * Get current date as dynamic content
     */
    public static function get_current_date(): string
    {
        $date_format = get_option('date_format', 'F j, Y');
        $current_date = date_i18n($date_format, current_time('timestamp'));

        $locale = PrayerDataCache::getSingleMetaValue("hijralocale");
        $gregorian_months = PrayerDataCache::getSingleMetaValue("gregorian_months");

        if ($locale && !empty($locale['customLan'])) {
            $gregorian_months_data = json_decode($gregorian_months, true);
            if (is_array($gregorian_months_data)) {
                foreach ($gregorian_months_data as &$month) {
                    if (isset($month['original_text'], $month['translated_text']) &&
                        $month['language_code'] === $locale['language_code']) {
                        $current_date = str_replace($month['original_text'], $month['translated_text'], $current_date);
                    }
                }
            }
        }

        return '<span class="fiveprayer-dynamic-content fiveprayer-single-current_date"
                 data-content-type="single_prayer"
                 data-field="current_date"
                 data-cache-buster="' . time() . '">' . esc_html($current_date) . '</span>';
    }

    /**
     * Get Fajr prayer time as dynamic content
     */
    public static function get_fajr_prayer(): string
    {
        return self::get_prayer_time('fajr_begins');
    }

    /**
     * Get Sunrise time as dynamic content
     */
    public static function get_sunrise_time(): string
    {
        return self::get_prayer_time('sunrise');
    }

    /**
     * Get Dhuhr prayer time as dynamic content
     */
    public static function get_dhuhr_prayer(): string
    {
        return self::get_prayer_time('dhuhr_begins');
    }

    /**
     * Get Asr prayer time as dynamic content
     */
    public static function get_asr_prayer(): string
    {
        return self::get_prayer_time('asr_begins');
    }

    /**
     * Get Maghrib prayer time as dynamic content
     */
    public static function get_maghrib_prayer(): string
    {
        return self::get_prayer_time('maghrib_begins');
    }

    /**
     * Get Isha prayer time as dynamic content
     */
    public static function get_isha_prayer(): string
    {
        return self::get_prayer_time('isha_begins');
    }

    /**
     * Get prayer widget content as dynamic content
     */
    public static function get_prayer_widget(): string
    {
        return '<div class="fiveprayer-widget">' . esc_html__('Prayer times will be displayed here.', 'fiveprayer') . '</div>';
    }

    /**
     * Get daily prayer times as dynamic content (vertical format)
     */
    public static function get_vertical_daily_prayer(): string
    {
        $shortcode_instance = new \FivePrayer\Core\ShortCodes\ShortCodeVerticalDailyPrayer();
        return $shortcode_instance->renderPrayerTable([]);
    }

    /**
     * Get Fajr prayer iqamah time as dynamic content
     */
    public static function get_fajr_iqamah(): string
    {
        return self::get_prayer_time('fajr_iqamah');
    }

    /**
     * Get Dhuhr prayer iqamah time as dynamic content
     */
    public static function get_dhuhr_iqamah(): string
    {
        return self::get_prayer_time('dhuhr_iqamah');
    }

    /**
     * Get Asr prayer iqamah time as dynamic content
     */
    public static function get_asr_iqamah(): string
    {
        return self::get_prayer_time('asr_iqamah');
    }

    /**
     * Get Maghrib prayer iqamah time as dynamic content
     */
    public static function get_maghrib_iqamah(): string
    {
        return self::get_prayer_time('maghrib_iqamah');
    }

    /**
     * Get Isha prayer iqamah time as dynamic content
     */
    public static function get_isha_iqamah(): string
    {
        return self::get_prayer_time('isha_iqamah');
    }

    /**
     * Get Midnight time as dynamic content
     */
    public static function get_midnight_time(): string
    {
        return self::get_prayer_time('midnight');
    }

    /**
     * Get next prayer begins time as dynamic content
     */
    public static function get_next_prayer_begins_time(): string
    {
        return self::get_prayer_time('next_prayer_begins_time');
    }

    /**
     * Get next prayer iqamah time as dynamic content
     */
    public static function get_next_prayer_iqamah_time(): string
    {
        return self::get_prayer_time('next_prayer_iqamah_time');
    }

    /**
     * Get Hijra date as dynamic content
     */
    public static function get_hijra_date(): string
    {
        return self::get_prayer_time('hijra_date');
    }

    /**
     * Get prayer title as dynamic content
     */
    public static function get_prayer_title(): string
    {
        return self::get_prayer_time('prayer_title');
    }

    /**
     * Get masjid name as dynamic content
     */
    public static function get_masjid_name(): string
    {
        return self::get_prayer_time('masjid_name');
    }

    /**
     * Get current location as dynamic content
     */
    public static function get_current_location(): string
    {
        return self::get_prayer_time('current_location');
    }

    /**
     * Get prayer times for today as dynamic content
     */
    public static function get_prayer_times_for_today(): string
    {
        return self::get_prayer_time('prayer_times_for_today');
    }

    /**
     * Get prayer begins title as dynamic content
     */
    public static function get_prayer_begins_title(): string
    {
        return self::get_prayer_time('single_prayer_begins_title');
    }

    /**
     * Get prayer iqamah title as dynamic content
     */
    public static function get_prayer_iqamah_title(): string
    {
        return self::get_prayer_time('single_prayer_iqamah_title');
    }

    /**
     * Get next prayer title as dynamic content
     */
    public static function get_next_prayer_title(): string
    {
        return self::get_prayer_time('next_prayer_title');
    }

    /**
     * Get next prayer begins title as dynamic content
     */
    public static function get_next_prayer_begins_title(): string
    {
        return self::get_prayer_time('next_prayer_begins_title');
    }

    /**
     * Get next prayer iqamah title as dynamic content
     */
    public static function get_next_prayer_iqamah_title(): string
    {
        return self::get_prayer_time('next_prayer_iqamah_title');
    }

    /**
     * Get prayer name by type (fajr_name, dhuhr_name, etc.)
     */
    public static function get_prayer_name(string $prayer_name_type): string
    {
        $names = \FivePrayer\Core\ShortCodes\Data\ShortCodeMap::PRAYER_NAMES;
        $name = $names[$prayer_name_type] ?? ucfirst(str_replace(['_name', '_'], ['', ' '], $prayer_name_type));

        return '<span class="fiveprayer-dynamic-content fiveprayer-single-' . esc_attr($prayer_name_type) . '"
                 data-content-type="single_prayer"
                 data-field="' . esc_attr($prayer_name_type) . '"
                 data-cache-buster="' . time() . '">' . esc_html($name) . '</span>';
    }

    /**
     * Get Fajr name as dynamic content
     */
    public static function get_fajr_name(): string
    {
        return self::get_prayer_name('fajr_name');
    }

    /**
     * Get Dhuhr name as dynamic content
     */
    public static function get_dhuhr_name(): string
    {
        return self::get_prayer_name('dhuhr_name');
    }

    /**
     * Get Asr name as dynamic content
     */
    public static function get_asr_name(): string
    {
        return self::get_prayer_name('asr_name');
    }

    /**
     * Get Maghrib name as dynamic content
     */
    public static function get_maghrib_name(): string
    {
        return self::get_prayer_name('maghrib_name');
    }

    /**
     * Get Isha name as dynamic content
     */
    public static function get_isha_name(): string
    {
        return self::get_prayer_name('isha_name');
    }

    /**
     * Get Sunrise name as dynamic content
     */
    public static function get_sunrise_name(): string
    {
        return self::get_prayer_name('sunrise_name');
    }

    /**
     * Get Midnight name as dynamic content
     */
    public static function get_midnight_name(): string
    {
        return self::get_prayer_name('midnight_name');
    }
}

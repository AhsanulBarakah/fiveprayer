<?php

namespace FivePrayer\Core\Assets\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Security\SecurityHelper;

trait ESIContentGeneratorTrait
{
    /**
     * Handle ESI requests
     */
    public function handleESIRequest()
    {
        if (!SecurityHelper::has_query_arg('fiveprayer_esi') || !SecurityHelper::has_query_arg('type') || !SecurityHelper::has_query_arg('id')) {
            return false;
        }

        $esi_id = SecurityHelper::get_sanitized_get_input('id');
        $nonce  = SecurityHelper::get_sanitized_get_input('nonce');

        if (!wp_verify_nonce($nonce, 'fiveprayer_esi_' . $esi_id)) {
            wp_die('ESI Security check failed', 'Security Error', ['response' => 403]);
            return true;
        }

        $type = SecurityHelper::get_sanitized_get_input('type');
        $atts = [];

        if (SecurityHelper::has_query_arg('atts')) {
            $decoded_atts = json_decode(base64_decode(SecurityHelper::get_sanitized_get_input('atts')), true);
            if ($decoded_atts !== null) {
                $atts = $decoded_atts;
            }
        }

        $content = $this->generateDynamicContent($type, $atts);

        header('Content-Type: text/html; charset=' . get_bloginfo('charset'));
        header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0, private, s-maxage=0, proxy-revalidate, no-transform');
        header('Pragma: no-cache');
        header('Expires: Wed, 11 Jan 2023 00:00:00 GMT');
        header('Surrogate-Control: no-store');
        header('X-Accel-Expires: 0');
        header('X-Proxy-Cache: BYPASS');

        echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        exit;
    }

    /**
     * Generate dynamic content based on type
     */
    private function generateDynamicContent($type, $atts)
    {
        switch ($type) {
            case 'current_time':
                return $this->generateCurrentTimeContent();
            case 'next_prayer':
                return $this->generateNextPrayerContent();
            case 'single_prayer':
                $field = $atts['field'] ?? '';
                return $this->generateSinglePrayerContent($field);
            case 'daily_prayer_table':
                return $this->generateDailyPrayerTableContent($atts);
            case 'monthly_prayer_table':
                return $this->generateMonthlyPrayerTableContent($atts);
            default:
                return 'Invalid ESI content type';
        }
    }

    /**
     * Generate current time content
     */
    private function generateCurrentTimeContent()
    {
        $timeFormat = get_option('time_format', 'h:i:s A');
        $currentTime = date_i18n($timeFormat, current_time('timestamp'));

        $js_script = '
               <script>
                   (function() {
                       if (typeof FivePrayerLiveTimeUpdater === "undefined") {
                           window.FivePrayerLiveTimeUpdater = true;

                           function updateLiveTime() {
                               var elements = document.querySelectorAll(".fiveprayer-live-time-esi");
                               var now = new Date();
                               var timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                               var timeFormat = elements[0] ? elements[0].dataset.timeFormat : "h:i:s A";
                               if (timeFormat && !timeFormat.includes("s")) {
                                   timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                               }

                               for (var i = 0; i < elements.length; i++) {
                                   elements[i].textContent = timeStr;
                               }
                           }

                           setInterval(updateLiveTime, 1000);
                           updateLiveTime();
                       }
                   })();
               </script>';

        return '<span class="fiveprayer-live-time-esi" data-time-format="' . esc_attr($timeFormat) . '">' .
               esc_html($currentTime) .
               '</span>' . $js_script;
    }

    /**
     * Generate next prayer content
     */
    private function generateNextPrayerContent()
    {
        $today_date = current_time('Y-m-d');
        $today_prayer_times = \FivePrayer\Core\Helpers\PrayerDataCache::getTodaysPrayerTimes($today_date);

        if (!$today_prayer_times) {
            return 'Data unavailable';
        }

        $meta_values = \FivePrayer\Core\Helpers\PrayerDataCache::getMultipleMetaValues([
            'timetable_prayer',
            'prayer_names',
            'activeLanguage'
        ]);

        $timetable_prayer = $meta_values['timetable_prayer'] ? json_decode($meta_values['timetable_prayer'], true) : [];
        $prayer_names = $meta_values['prayer_names'] ? json_decode($meta_values['prayer_names'], true) : [];
        $activeLanguage = $meta_values['activeLanguage'] ? json_decode($meta_values['activeLanguage'], true) : [['language_code' => 'en']];

        $nextPrayer = new \FivePrayer\Core\Daily\NextPrayer();
        $nextPrayer->getNextPrayer(
            $today_prayer_times,
            $timetable_prayer,
            $prayer_names,
            $activeLanguage
        );

        $next_prayer_data = $nextPrayer->getNextPrayerData();
        $next_prayer_text = $next_prayer_data ? $next_prayer_data['name'] . ' ' . $next_prayer_data['time'] : 'Calculating...';

        return '<span class="fiveprayer-next-prayer-esi">' . esc_html($next_prayer_text) . '</span>';
    }

    /**
     * Generate single prayer content
     */
    private function generateSinglePrayerContent($field)
    {
        if (empty($field)) {
            return 'Field not specified';
        }

        $today_date = current_time('Y-m-d');
        $today_prayer_times = \FivePrayer\Core\Helpers\PrayerDataCache::getTodaysPrayerTimes($today_date);

        if (!$today_prayer_times) {
            return 'Time unavailable';
        }

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
        ];

        $property = $field_mapping[$field] ?? $field;
        $time = $today_prayer_times->$property ?? 'Time unavailable';

        return '<span class="fiveprayer-single-prayer-esi" data-field="' . esc_attr($field) . '">' . esc_html($time) . '</span>';
    }

    /**
     * Generate daily prayer table content
     */
    private function generateDailyPrayerTableContent($atts)
    {
        $shortcode_instance = new \FivePrayer\Core\ShortCodes\ShortCodeVerticalDailyPrayer();
        return $shortcode_instance->renderPrayerTable($atts);
    }

    /**
     * Generate monthly prayer table content
     */
    private function generateMonthlyPrayerTableContent($atts)
    {
        $shortcode_instance = new \FivePrayer\Core\ShortCodes\ShortCodeTimetableMonth();
        return $shortcode_instance->fpTimetableMonth($atts);
    }
}

<?php

namespace FivePrayer\Core\Assets\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrayerFieldMap;
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

        $esi_id       = SecurityHelper::get_sanitized_get_input('id');
        $type         = (string) SecurityHelper::get_sanitized_get_input('type');
        $signature    = (string) SecurityHelper::get_sanitized_get_input('sig');
        $atts_encoded = SecurityHelper::has_query_arg('atts')
            ? (string) SecurityHelper::get_sanitized_get_input('atts')
            : '';

        // The signature covers the type and the attributes as well as the id,
        // so editing a URL copied from a public page is refused even though the
        // page it came from is genuine.
        if (!hash_equals($this->generateESISignature($type, $atts_encoded, $esi_id), $signature)) {
            wp_die('ESI Security check failed', 'Security Error', ['response' => 403]);
            return true;
        }

        if (!in_array($type, $this->getESIAllowedTypes(), true)) {
            wp_die('ESI content type not allowed', 'Security Error', ['response' => 400]);
            return true;
        }

        $atts = [];

        if ('' !== $atts_encoded) {
            // base64_decode(..., true) returns false for anything that is not
            // base64, and only a decoded array is kept: json_decode() can also
            // return a scalar or null, which must not reach shortcode_atts().
            $decoded_atts = json_decode((string) base64_decode($atts_encoded, true), true);
            if (is_array($decoded_atts)) {
                $atts = $decoded_atts;
            }
        }

        $atts = $this->sanitizeESIAtts($type, $atts);

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
     * Drop every attribute the matching shortcode does not accept.
     *
     * The ESI fragment runs the same renderer as the shortcode, so it has to run
     * the same attribute filter: an argument the shortcode would ignore must not
     * reach the renderer through the fragment instead.
     *
     * @param string $type Content type requested.
     * @param array  $atts Decoded attributes from the request.
     * @return array
     */
    private function sanitizeESIAtts($type, array $atts)
    {
        switch ($type) {
            case 'single_prayer':
                $atts            = shortcode_atts(['field' => ''], $atts);
                $atts['field']   = sanitize_key((string) $atts['field']);
                return $atts;
            case 'daily_prayer_table':
            case 'monthly_prayer_table':
                // ShortCodeVerticalDailyPrayer::renderPrayerTable() reads no
                // attributes, and ShortCodeTimetableMonth::fpTimetableMonth()
                // runs exactly this call with the same empty defaults — so the
                // fragment drops everything here as well.
                return shortcode_atts([], $atts);
            default:
                return [];
        }
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

        // Shared allowlist with DynamicContentHandler: an unknown field is
        // answered without reading any property of the timetable row.
        $property = PrayerFieldMap::getProperty($field);

        if (null === $property) {
            return 'Time unavailable';
        }

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

<?php

namespace FivePrayer\Core\ShortCodes\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\GetMeta;

/**
 * Trait for single prayer shortcode rendering.
 */
trait SinglePrayerRendererTrait
{
    public function single_prayer_shortcode($atts, $content = '', $tag = ''): string
    {
        $field = str_replace(['Fp_Single_', 'Fp_'], ['', ''], $tag);
        $field = strtolower($field);

        if ($field === 'currenttime') {
            $field = 'current_time';
        } elseif ($field === 'currentdate') {
            $field = 'current_date';
        } elseif ($field === 'nextprayer') {
            $field = 'next_prayer';
        }

        // Name/title/label fields that don't need prayer time data
        $name_fields = ['fajr_name', 'dhuhr_name', 'asr_name', 'maghrib_name', 'isha_name', 'sunrise_name', 'midnight_name',
                        'prayer_times_for_today', 'current_title', 'prayer_title', 'masjid_name', 'current_location',
                        'single_prayer_begins_title', 'single_prayer_iqamah_title',
                        'next_prayer_iqamah_title', 'next_prayer_begins_title', 'next_prayer_title'];

        // Delegate to ShortCodesSinglePrayers singleton for name/label fields and next prayer
        if (in_array($field, $name_fields) || $field === 'next_prayer' || $field === 'next_prayer_iqamah_time' || $field === 'next_prayer_begins_time' || $field === 'next_prayer_remaining') {
            try {
                $shortcode_instance = \FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers::getInstance();
                return $shortcode_instance->renderShortCode($field, false, '');
            } catch (\Throwable $e) {
                return '';
            }
        }

        if ($field === 'current_time') {
            if (fiveprayer_is_esi_enabled()) {
                return fiveprayer_wrap_dynamic_content_with_esi('', 'current_time', $atts);
            }

            $getMetaFromDB = new GetMeta();
            $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage", [['language_code' => 'en']]);
            $customLan = $getMetaFromDB->get_meta_key("hijralocale", []);
            $numbers = $getMetaFromDB->get_meta_key("gregorian_numbers", []);

            $isCustomLan = isset($customLan['customLan']) && $customLan['customLan'] === true;

            if (!$isCustomLan) {
                $activeLanguage = [['language_code' => 'en']];
            }

            $translations = [];

            if (is_array($numbers) && !empty($activeLanguage[0]['language_code'])) {
                $targetLang = $activeLanguage[0]['language_code'];

                foreach ($numbers as &$num) {
                    if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                        $num['language_code'] === $targetLang) {

                        $original = $num['original_text'];
                        $translated = $num['translated_text'];

                        if (strlen($original) === 1 && strlen($translated) >= 1) {
                            $translations[$original] = $translated;
                        } elseif (in_array(strtoupper($original), ['AM', 'PM']) && !empty($translated)) {
                            $translations[strtoupper($original)] = $translated;
                            $translations[strtolower($original)] = strtolower($translated);
                        }
                    }
                }
            }

            if (!isset($translations['AM'])) $translations['AM'] = 'AM';
            if (!isset($translations['PM'])) $translations['PM'] = 'PM';
            if (!isset($translations['am'])) $translations['am'] = 'am';
            if (!isset($translations['pm'])) $translations['pm'] = 'pm';

            if (function_exists('fiveprayer_enqueue_combined_scripts')) {
                fiveprayer_enqueue_combined_scripts();
            } else {
                $live_time_path    = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'php/classes/core/ShortCodes/JS/live-time.js';
                $live_time_version = file_exists($live_time_path) ? filemtime($live_time_path) : (function_exists('fiveprayer_get_asset_version') ? fiveprayer_get_asset_version() : '1.0.0');

                wp_enqueue_script(
                    'fiveprayer-live-time',
                    plugins_url('php/classes/core/ShortCodes/JS/live-time.js', FIVEPRAYER_PLUGIN_FILE),
                    [],
                    $live_time_version,
                    true
                );
            }

            if (function_exists('fiveprayer_track_live_time_enqueue')) {
                fiveprayer_track_live_time_enqueue();
            }

            $timeFormat = get_option('time_format', 'h:i A');

            $currentTimeRaw = date_i18n($timeFormat, current_time('timestamp'));
            $initialTime = $currentTimeRaw;

            if (isset($customLan['customLan']) && $customLan['customLan'] === true && !empty($translations)) {
                $initialTime = strtr($currentTimeRaw, $translations);
            }

            $timeData = [
                'numbers' => $translations,
                'ampm' => [
                    'AM' => $translations['AM'] ?? 'AM',
                    'PM' => $translations['PM'] ?? 'PM',
                    'am' => $translations['am'] ?? 'am',
                    'pm' => $translations['pm'] ?? 'pm'
                ],
                'initialTime' => $initialTime,
                'timeFormat' => $timeFormat,
                'timeSelector' => '.fiveprayer-live-time',
                'activeLanguage' => $activeLanguage[0]['language_code'] ?? 'en',
                'customLan' => $customLan['customLan'] ?? false,
            ];

            if (class_exists('\\FivePrayer\\Core\\Assets\\ScriptLocalizationManager')) {
                $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
                $localization_manager->localizeScript(
                    'fiveprayer-live-time',
                    'fiveprayerTimeData',
                    $timeData
                );
            } else {
                wp_localize_script(
                    'fiveprayer-live-time',
                    'fiveprayerTimeData',
                    $timeData
                );
            }

            $context_param = \FivePrayer\Core\Security\SecurityHelper::get_sanitized_get_input('context');
            $is_page_builder = is_admin() || (!empty($context_param) && $context_param === 'edit');

            $timeFormat = get_option('time_format', 'h:i A');

            if ($is_page_builder) {
                $current_time = date_i18n($timeFormat, current_time('timestamp'));

                if (isset($customLan['customLan']) && $customLan['customLan'] === true) {
                    if (!empty($translations)) {
                        $current_time = strtr($current_time, $translations);
                    }
                }

                $initial_content = esc_html($current_time);
            } else {
                $initial_content = '&nbsp;';
            }

            $cache_buster = time() . wp_rand(1000, 9999);

            return '<span class="fiveprayer-live-time fiveprayer-dynamic-content fiveprayer-single-' . esc_attr($field) . '"
                     data-shortcode-type="single_prayer"
                     data-field="' . esc_attr($field) . '"
                     data-shortcode-attrs="' . esc_attr(json_encode($atts)) . '"
                     data-servertime="' . esc_attr(current_time('timestamp')) . '"
                     data-timeformat="' . esc_attr($timeFormat) . '"
                     data-pagebuilder="' . ($is_page_builder ? 'true' : 'false') . '"
                     data-cache-buster="' . esc_attr($cache_buster) . '">' .
                     $initial_content . '</span>';
        }

        $content_type = 'single_prayer';
        $ajax_field = $field;

        if ($field === 'current_time') {
            $content_type = 'current_time';
        } elseif ($field === 'next_prayer') {
            $content_type = 'next_prayer';
        } else {
            $field_mapping = [
                'fajr' => 'fajr_begins_time',
                'sunrise' => 'sunrise_begins_time',
                'dhuhr' => 'dhuhr_begins_time',
                'asr' => 'asr_begins_time',
                'asr_second' => 'asr_second_begins_time',
                'maghrib' => 'maghrib_begins_time',
                'isha' => 'isha_begins_time',
                'fajr_begins_time' => 'fajr_begins_time',
                'fajr_iqamah_time' => 'fajr_iqamah_time',
                'dhuhr_begins_time' => 'dhuhr_begins_time',
                'dhuhr_iqamah_time' => 'dhuhr_iqamah_time',
                'asr_begins_time' => 'asr_begins_time',
                'asr_second_begins_time' => 'asr_second_begins_time',
                'asr_iqamah_time' => 'asr_iqamah_time',
                'maghrib_begins_time' => 'maghrib_begins_time',
                'maghrib_iqamah_time' => 'maghrib_iqamah_time',
                'isha_begins_time' => 'isha_begins_time',
                'isha_iqamah_time' => 'isha_iqamah_time',
                'sunrise_begins_time' => 'sunrise_begins_time',
                'midnight_begins_time' => 'midnight_begins_time',
            ];

            $ajax_field = $field_mapping[$field] ?? $field;
        }

        $cache_buster = time() . wp_rand(1000, 9999);

        if ($field === 'current_time') {
            $current_time = date_i18n(get_option('time_format', 'h:i:s A'), current_time('timestamp'));
            $result = '<span class="fiveprayer-dynamic-content fiveprayer-single-' . esc_attr($field) . '"
                       data-content-type="' . esc_attr($content_type) . '"
                       data-field="' . esc_attr($ajax_field) . '"
                       data-shortcode-attrs="' . esc_attr(json_encode($atts)) . '"
                       data-cache-buster="' . esc_attr($cache_buster) . '">' . esc_html($current_time) . '</span>';
        } elseif ($field === 'next_prayer') {
            $today_date = current_time('Y-m-d');
            $today_prayer_times = \FivePrayer\Core\Helpers\PrayerDataCache::getTodaysPrayerTimes($today_date);

            if ($today_prayer_times) {
                $meta_values = \FivePrayer\Core\Helpers\PrayerDataCache::getMultipleMetaValues([
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

                $next_prayer_data = $nextPrayer->getNextPrayerData();
                $next_prayer_text = $next_prayer_data ? $next_prayer_data['name'] . ' ' . $next_prayer_data['time'] : 'Calculating...';
            } else {
                $next_prayer_text = 'Data unavailable';
            }

            $result = '<span class="fiveprayer-dynamic-content fiveprayer-single-' . esc_attr($field) . '"
                       data-content-type="' . esc_attr($content_type) . '"
                       data-field="' . esc_attr($ajax_field) . '"
                       data-shortcode-attrs="' . esc_attr(json_encode($atts)) . '"
                       data-cache-buster="' . esc_attr($cache_buster) . '">' . esc_html($next_prayer_text) . '</span>';
        } else {
            $today_date = current_time('Y-m-d');
            $today_prayer_times = \FivePrayer\Core\Helpers\PrayerDataCache::getTodaysPrayerTimes($today_date);

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

            $property = $field_mapping[$ajax_field] ?? $ajax_field;
            $time = $today_prayer_times->$property ?? 'Time unavailable';

            $result = '<span class="fiveprayer-dynamic-content fiveprayer-single-' . esc_attr($field) . '"
                       data-content-type="' . esc_attr($content_type) . '"
                       data-field="' . esc_attr($ajax_field) . '"
                       data-shortcode-attrs="' . esc_attr(json_encode($atts)) . '"
                       data-cache-buster="' . esc_attr($cache_buster) . '">' . esc_html($time) . '</span>';
        }

        $this->enqueue_dynamic_content_loader();

        return $result;
    }

    private function enqueue_dynamic_content_loader(): void
    {
        $script_path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'php/classes/core/Assets/JS/dynamic-content-loader.js';
        $script_url = plugins_url('php/classes/core/Assets/JS/dynamic-content-loader.js', FIVEPRAYER_PLUGIN_FILE);

        if (!wp_script_is('fiveprayer-dynamic-content-loader', 'registered')) {
            $version = file_exists($script_path) ? filemtime($script_path) : (function_exists('fiveprayer_get_asset_version') ? fiveprayer_get_asset_version() : '1.0.0');
            wp_register_script(
                'fiveprayer-dynamic-content-loader',
                $script_url,
                [],
                $version,
                true
            );
        }

        fiveprayer_enqueue_combined_scripts();
    }
}

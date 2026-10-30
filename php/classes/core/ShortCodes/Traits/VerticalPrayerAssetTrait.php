<?php

namespace FivePrayer\Core\ShortCodes\Traits;

use FivePrayer\Core\Helpers\PrayerDataCache;

defined('ABSPATH') || exit('Direct script access denied.');

trait VerticalPrayerAssetTrait
{
    protected function enqueueVerticalPrayerAssets(): void
    {
        global $post;

        // Builder-aware: the shortcode may live in a page builder's layout meta
        // rather than in post_content (see fiveprayer_post_has_shortcode()).
        $is_prayer_page = is_a($post, 'WP_Post') && (function_exists('fiveprayer_post_has_shortcode')
            ? fiveprayer_post_has_shortcode($post)
            : has_shortcode((string) $post->post_content, 'Fp_Vertical_Daily_Prayer'));

        if ($is_prayer_page) {
            $monthstyle = new \FivePrayer\Core\Daily\Styles\DailyStyleDynamic();
            $monthstyle->dailyStyleDynamic();

            fiveprayer_enqueue_combined_scripts();

            if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
                $this->localizeCombinedScript();
            } else {
                $this->enqueueAndLocalizeIndividualScript();
            }

            $translations = $this->getTranslationData();
            $timeFormat = get_option('time_format', 'h:i A');
            $timeData = [
                'numbers' => $translations,
                'ampm' => [
                    'AM' => $translations['AM'] ?? 'AM',
                    'PM' => $translations['PM'] ?? 'PM'
                ],
                'initialTime' => date_i18n($timeFormat),
                'timeFormat' => $timeFormat,
                'timeSelector' => '.fiveprayer-live-time',
                'activeLanguage' => $this->activeLanguage[0]['language_code'] ?? 'en',
                'customLan' => $this->locale['customLan'] ?? false,
            ];

            if (class_exists('\\FivePrayer\\Core\\Assets\\ScriptLocalizationManager')) {
                $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
                $script = function_exists('fiveprayer_enqueue_combined_scripts') ? 'fiveprayer-combined-js' : 'fiveprayer-live-time';
                $localization_manager->localizeScript($script, 'fiveprayerTimeData', $timeData);
            } else {
                $script = function_exists('fiveprayer_enqueue_combined_scripts') ? 'fiveprayer-combined-js' : 'fiveprayer-live-time';
                wp_localize_script($script, 'fiveprayerTimeData', $timeData);
            }
        }
    }

    private function localizeCombinedScript(): void
    {
        $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
        $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage", [['language_code' => 'en']]);
        $customLan = $getMetaFromDB->get_meta_key("hijralocale", []);
        $numbers = $getMetaFromDB->get_meta_key("gregorian_numbers", []);

        $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;
        if (!$hijraIsActive) {
            $activeLanguage = [['language_code' => 'en']];
        }

        $translations = array_merge(
            array_fill_keys(array_map('strval', range(0, 9)), array_map('strval', range(0, 9))),
            ['AM' => 'AM', 'PM' => 'PM']
        );

        if (is_array($numbers) && !empty($activeLanguage[0]['language_code'])) {
            $targetLang = $activeLanguage[0]['language_code'];
            $foundAM = false;
            $foundPM = false;
            foreach ($numbers as &$num) {
                if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                    $num['language_code'] === $targetLang) {
                    $original = strtoupper($num['original_text']);
                    $translated = $num['translated_text'];
                    $translations[$original] = $translated;
                    $translations[strtolower($original)] = strtolower($translated);
                    if ($original === 'AM') $foundAM = true;
                    if ($original === 'PM') $foundPM = true;
                }
            }
            if (!$foundAM || !$foundPM) {
                foreach ($numbers as &$num) {
                    if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                        $num['language_code'] === 'en') {
                        $original = strtoupper($num['original_text']);
                        $translated = $num['translated_text'];
                        if (($original === 'AM' && !$foundAM) || ($original === 'PM' && !$foundPM)) {
                            $translations[$original] = $translated;
                            $translations[strtolower($original)] = strtolower($translated);
                        }
                    }
                }
            }
        }

        wp_localize_script('fiveprayer-combined-js', 'fiveprayer_translations', $translations);
    }

    private function enqueueAndLocalizeIndividualScript(): void
    {
        $live_time_path = $this->path_service->getFileFullPath('php/classes/core/ShortCodes/JS/live-time.js');
        $live_time_url = $this->path_service->getFileUrl('php/classes/core/ShortCodes/JS/live-time.js');

        if (file_exists($live_time_path)) {
            wp_enqueue_script('fiveprayer-live-time', $live_time_url, [], filemtime($live_time_path), true);

            $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
            $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage", [['language_code' => 'en']]);
            $customLan = $getMetaFromDB->get_meta_key("hijralocale", []);
            $numbers = $getMetaFromDB->get_meta_key("gregorian_numbers", []);

            $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;
            if (!$hijraIsActive) {
                $activeLanguage = [['language_code' => 'en']];
            }

            $translations = array_merge(
                array_fill_keys(array_map('strval', range(0, 9)), array_map('strval', range(0, 9))),
                ['AM' => 'AM', 'PM' => 'PM']
            );

            if (is_array($numbers) && !empty($activeLanguage[0]['language_code'])) {
                $targetLang = $activeLanguage[0]['language_code'];
                $foundAM = false;
                $foundPM = false;
                foreach ($numbers as &$num) {
                    if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                        $num['language_code'] === $targetLang) {
                        $original = strtoupper($num['original_text']);
                        $translated = $num['translated_text'];
                        $translations[$original] = $translated;
                        $translations[strtolower($original)] = strtolower($translated);
                        if ($original === 'AM') $foundAM = true;
                        if ($original === 'PM') $foundPM = true;
                    }
                }
                if (!$foundAM || !$foundPM) {
                    foreach ($numbers as &$num) {
                        if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                            $num['language_code'] === 'en') {
                            $original = strtoupper($num['original_text']);
                            $translated = $num['translated_text'];
                            if (($original === 'AM' && !$foundAM) || ($original === 'PM' && !$foundPM)) {
                                $translations[$original] = $translated;
                                $translations[strtolower($original)] = strtolower($translated);
                            }
                        }
                    }
                }
            }

            wp_localize_script('fiveprayer-live-time', 'fiveprayer_translations', $translations);
        }
    }
}

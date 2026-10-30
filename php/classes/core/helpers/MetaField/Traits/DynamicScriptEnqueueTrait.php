<?php

namespace FivePrayer\Core\Helpers\MetaField\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Logging\Logger;

trait DynamicScriptEnqueueTrait
{
    /**
     * Enqueue live time script with security
     */
    protected function enqueue_secure_live_time_script(): void
    {
        try {
            fiveprayer_enqueue_combined_scripts();
            $this->enqueue_secure_live_time_translations();
        } catch (\Exception $e) {
            Logger::error('Error enqueuing live time script: ' . $e->getMessage(), 'DynamicTextHandler');
        }
    }

    /**
     * Enqueue secure live time translations
     */
    protected function enqueue_secure_live_time_translations(): void
    {
        try {
            if (!class_exists('\FivePrayer\Core\Helpers\GetMeta')) {
                $this->enqueue_fallback_translations();
                return;
            }
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
                $targetLang = SecurityHelper::sanitize_input($activeLanguage[0]['language_code']);
                $foundAM = false;
                $foundPM = false;

                foreach ($numbers as &$num) {
                    if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                        $num['language_code'] === $targetLang) {

                        $original = SecurityHelper::sanitize_input(strtoupper($num['original_text']));
                        $translated = SecurityHelper::sanitize_text($num['translated_text']);

                        if (in_array($original, ['0','1','2','3','4','5','6','7','8','9','AM','PM'])) {
                            $translations[$original] = $translated;
                            $translations[strtolower($original)] = strtolower($translated);

                            if ($original === 'AM') $foundAM = true;
                            if ($original === 'PM') $foundPM = true;
                        }
                    }
                }

                if (!$foundAM || !$foundPM) {
                    foreach ($numbers as &$num) {
                        if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                            $num['language_code'] === 'en') {

                            $original = SecurityHelper::sanitize_input(strtoupper($num['original_text']));
                            $translated = SecurityHelper::sanitize_text($num['translated_text']);

                            if (($original === 'AM' && !$foundAM) || ($original === 'PM' && !$foundPM)) {
                                $translations[$original] = $translated;
                                $translations[strtolower($original)] = strtolower($translated);
                            }
                        }
                    }
                }
            }

            $timeFormat = get_option('time_format', 'h:i A');
            $timeData = [
                'numbers' => SecurityHelper::sanitize_input($translations),
                'ampm' => [
                    'AM' => $translations['AM'] ?? 'AM',
                    'PM' => $translations['PM'] ?? 'PM'
                ],
                'initialTime' => date_i18n($timeFormat),
                'timeFormat' => SecurityHelper::sanitize_input($timeFormat),
                'timeSelector' => '.fiveprayer-live-time',
                'activeLanguage' => SecurityHelper::sanitize_input($activeLanguage[0]['language_code'] ?? 'en'),
                'customLan' => SecurityHelper::sanitize_input($customLan['customLan'] ?? false),
            ];

            if (class_exists('\FivePrayer\Core\Assets\ScriptLocalizationManager')) {
                $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
                $localization_manager->localizeScript('fiveprayer-live-time', 'fiveprayerTimeData', $timeData);
            } else {
                if (class_exists('\FivePrayer\Core\Assets\ScriptLocalizationManager')) {
                    $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
                    $localization_manager->localizeScript('fiveprayer-live-time', 'fiveprayerTimeData', $timeData);
                } else {
                    wp_localize_script('fiveprayer-live-time', 'fiveprayerTimeData', $timeData);
                }
            }
        } catch (\Exception $e) {
            Logger::error('Error enqueuing live time translations: ' . $e->getMessage(), 'DynamicTextHandler');
        }
    }

    /**
     * Fallback translations when GetMeta is not available
     */
    protected function enqueue_fallback_translations(): void
    {
        $translations = array_merge(
            array_fill_keys(array_map('strval', range(0, 9)), array_map('strval', range(0, 9))),
            ['AM' => 'AM', 'PM' => 'PM']
        );

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
            'activeLanguage' => 'en',
            'customLan' => false,
        ];

        wp_localize_script('fiveprayer-live-time', 'fiveprayerTimeData', $timeData);
    }

    /**
     * Enqueue dynamic content loader script with security
     */
    protected function enqueue_secure_dynamic_content_loader(): void
    {
        try {
            fiveprayer_enqueue_combined_scripts();
        } catch (\Exception $e) {
            Logger::error('Error enqueuing dynamic content loader: ' . $e->getMessage(), 'DynamicTextHandler');
        }
    }
}

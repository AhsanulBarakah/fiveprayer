<?php

namespace FivePrayer\Core\Helpers\LiveTimeFormatted\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Helpers\GetMeta;

trait ScriptRegistrarTrait
{
    private $pluginRootPath;

    public function enqueueScripts()
    {
        Logger::debug('LiveTime Frontend: enqueueScripts() called', 'LiveTimeFormatted');

        try {
            $getMetaFromDB = new GetMeta();
            $customLan = $this->getCachedMeta($getMetaFromDB, "hijralocale", []);

            Logger::debug('LiveTime Frontend: Custom language setting: ' . json_encode($customLan), 'LiveTimeFormatted');

            if (!isset($customLan['customLan']) || $customLan['customLan'] !== true) {
                Logger::debug('LiveTime Frontend: Custom language not enabled, skipping translation', 'LiveTimeFormatted');
                return;
            }

            $activeLanguage = $this->getCachedMeta($getMetaFromDB, "activeLanguage", [['language_code' => 'en']]);

            Logger::debug('LiveTime Frontend: Active language: ' . json_encode($activeLanguage), 'LiveTimeFormatted');

            $this->translations = $this->loadTranslations(
                $this->getCachedMeta($getMetaFromDB, "gregorian_numbers", []),
                $activeLanguage
            );

            Logger::debug('LiveTime Frontend: Loaded translations count: ' . count($this->translations), 'LiveTimeFormatted');

            $this->registerTimeScript();

        } catch (\Exception $e) {
            Logger::error('LiveTime Frontend ERROR: ' . $e->getMessage(), 'LiveTimeFormatted');
            $this->fallbackTimeDisplay();
        }
    }

    public function enqueueBlockEditorAssets()
    {
        try {
            if (!is_admin()) {
                return;
            }

            $getMetaFromDB = new GetMeta();
            $customLan = $this->getCachedMeta($getMetaFromDB, "hijralocale", []);

            Logger::debug('LiveTime Block Editor: Custom language setting: ' . json_encode($customLan), 'LiveTimeFormatted');

            if (!isset($customLan['customLan']) || $customLan['customLan'] !== true) {
                Logger::debug('LiveTime Block Editor: Custom language not enabled, skipping translation', 'LiveTimeFormatted');
                return;
            }

            $activeLanguage = $this->getCachedMeta($getMetaFromDB, "activeLanguage", [['language_code' => 'en']]);

            Logger::debug('LiveTime Block Editor: Active language: ' . json_encode($activeLanguage), 'LiveTimeFormatted');

            $this->translations = $this->loadTranslations(
                $this->getCachedMeta($getMetaFromDB, "gregorian_numbers", []),
                $activeLanguage
            );

            Logger::debug('LiveTime Block Editor: Loaded translations count: ' . count($this->translations), 'LiveTimeFormatted');

            $this->registerTimeScript();

            Logger::debug('LiveTime Block Editor: Live time script enqueued', 'LiveTimeFormatted');

        } catch (\Exception $e) {
            Logger::error('LiveTime Block Editor ERROR: ' . $e->getMessage(), 'LiveTimeFormatted');
        }
    }

    private function registerTimeScript()
    {
        $scriptPath = $this->pluginRootPath . '/php/classes/core/ShortCodes/JS/live-time.js';

        if (!file_exists($scriptPath)) {
            throw new \Exception('Script not found: ' . $scriptPath); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped
        }

        $getMetaFromDB = new GetMeta();
        $activeLanguage = $this->getCachedMeta($getMetaFromDB, "activeLanguage", [['language_code' => 'en']]);
        $customLan = $this->getCachedMeta($getMetaFromDB, "hijralocale", []);

        fiveprayer_enqueue_combined_scripts();

        $timeFormat = get_option('time_format', 'h:i A');
        if (!strpos($timeFormat, 's')) {
            $timeFormat = str_replace(['h:i', 'g:i'], ['h:i:s', 'g:i:s'], $timeFormat);
        }

        $timezone_data = [
            'gmt_offset' => get_option('gmt_offset', 0),
            'timezone_string' => get_option('timezone_string', ''),
            'current_time' => current_time('Y-m-d H:i:s'),
            'current_timestamp' => current_time('timestamp'),
        ];

        $timeData = [
            'numbers' => $this->translations,
            'ampm' => [
                'AM' => $this->translations['AM'] ?? 'AM',
                'PM' => $this->translations['PM'] ?? 'PM'
            ],
            'initialTime' => $this->getTranslatedTime(),
            'timeFormat' => $timeFormat,
            'timeSelector' => '.fiveprayer-live-time',
            'activeLanguage' => $activeLanguage[0]['language_code'] ?? 'en',
            'customLan' => $customLan['customLan'] ?? false,
        ];

        wp_add_inline_script('fiveprayer-live-time',
            'window.FivePrayerData = window.FivePrayerData || {}; ' .
            'window.FivePrayerData.wordpress_timezone = ' . wp_json_encode($timezone_data) . ';'
        );

        if (class_exists('\\FivePrayer\\Core\\Assets\\ScriptLocalizationManager')) {
            $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
            $localization_manager->localizeScript(
                'fiveprayer-live-time',
                'fiveprayerTimeData',
                $timeData,
                JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
            );
        } else {
            wp_localize_script(
                'fiveprayer-live-time',
                'fiveprayerTimeData',
                $timeData,
                JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
            );
        }
    }
}

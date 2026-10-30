<?php
namespace FivePrayer\Core\ShortCodes\Renderers;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

use FivePrayer\Core\Daily\NextPrayer;
use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Calendar\Hijra;
use FivePrayer\Core\Helpers\GetMeta;

use FivePrayer\Core\ShortCodes\Renderers\Traits\PageBuilderTrait;
use FivePrayer\Core\ShortCodes\Renderers\Traits\TimeFormattingTrait;
use FivePrayer\Core\ShortCodes\Renderers\Traits\HijriDateTrait;

class PrayerTimeRenderer {
    use PageBuilderTrait;
    use TimeFormattingTrait;
    use HijriDateTrait;

    private $translationManager;
    private $prayer_times;
    private $timetable_prayer;
    private $vertical_daily_prayer;
    private $extra_info;
    private $hijra;

    public function __construct($translationManager, $prayer_times, $timetable_prayer, $vertical_daily_prayer, $extra_info) {
        $this->translationManager = $translationManager;
        $this->prayer_times = $prayer_times;
        $this->timetable_prayer = $timetable_prayer;
        $this->vertical_daily_prayer = $vertical_daily_prayer;
        $this->extra_info = $extra_info;
        $this->hijra = new Hijra();
    }

    public function renderShortCode(string $field, bool $removeNextWord = false, string $removeSpecificWord = ''): string {
        if ($field === 'prayer_times_for_today') {
            return $this->translationManager->getTranslatedLabel('Prayer Times For Today');
        }
        if ($field === 'current_title') {
            return $this->translationManager->getTranslatedLabel('The Current Prayer');
        }
        if ($field === 'prayer_title') {
            return $this->translationManager->getTranslatedLabel('Prayer');
        }
        if ($field === 'masjid_name') {
            return $this->translationManager->getTranslatedLabel('Masjid Name');
        }
        if ($field === 'midnight_name') {
            return $this->translationManager->getTranslatedLabel('Midnight');
        }
        
        if ($field === 'current_location') {
            return $this->translationManager->getTranslatedLabel('Current Location');
        }

        if ($field === 'current_time') {
            return $this->renderCurrentTime();
        }

        if ($field === 'currentDate') {
            return $this->renderCurrentDate();
        }

        if ($field === 'hijra_date') {
            return $this->renderHijriDate();
        }

        if (in_array($field, ['single_prayer_begins_title', 'single_prayer_iqamah_title'])) {
            return $this->renderTitleField($field, $removeNextWord, $removeSpecificWord);
        }

        if (in_array($field, ['next_prayer_iqamah_title', 'next_prayer_begins_title', 'next_prayer_title'])) {
            return $this->renderNextPrayerTitle($field, $removeNextWord, $removeSpecificWord);
        }

        if (array_key_exists($field, ShortCodeMap::PRAYER_NAMES)) {
            return $this->renderPrayerName($field, $removeNextWord, $removeSpecificWord);
        }

        if (in_array($field, ['next_prayer_iqamah_time', 'next_prayer_begins_time'])) {
            return $this->renderNextPrayerTime($field);
        }

        if ($field === 'next_prayer_remaining') {
            return $this->renderNextPrayerRemaining();
        }

        return $this->renderActualPrayerTime($field, $removeNextWord, $removeSpecificWord);
    }

    public function getNextPrayerData(): array {
        $default_data = [
            'slug' => '',
            'name' => '',
            'time' => '',
            'timestamp' => 0,
            'iqamah_time' => '',
            'iqamah_title' => $this->translationManager->getTranslatedLabel('Next Prayer'),
            'begins_time' => '',
            'begins_title' => $this->translationManager->getTranslatedLabel('Next Prayer'),
            'single_prayer_begins_title' => $this->translationManager->getTranslatedLabel('Begins'),
            'single_prayer_iqamah_title' => $this->translationManager->getTranslatedLabel('Iqamah')
        ];

        if (!$this->prayer_times) {
            return $default_data;
        }

        try {
            $next_prayer = new NextPrayer();
            $next_prayer_slug = $next_prayer->getNextPrayer(
                $this->prayer_times,
                $this->timetable_prayer,
                [], // prayer_names not needed here
                [] // activeLanguage not needed here
            );

            if (empty($next_prayer_slug)) {
                return $default_data;
            }

            $next_prayer_data = $next_prayer->getNextPrayerData();

            $iqamah_field = $next_prayer_slug . '_iqamah';
            $begins_field = $next_prayer_slug . '_begins';

            $iqamah_time = isset($next_prayer_data['time']) ? $next_prayer_data['time'] :
                          (isset($this->prayer_times->$iqamah_field) ? $this->prayer_times->$iqamah_field : '');

            $begins_time = isset($next_prayer_data['begins_time']) ? $next_prayer_data['begins_time'] :
                         (isset($this->prayer_times->$begins_field) ? $this->prayer_times->$begins_field : '');

            return [
                'slug' => $next_prayer_slug,
                'name' => $next_prayer_data['name'] ?? '',
                'time' => $next_prayer_data['time'] ?? '',
                'timestamp' => isset($next_prayer_data['timestamp']) ? (int) $next_prayer_data['timestamp'] : 0,
                'iqamah_time' => esc_html($iqamah_time),
                'iqamah_title' => $this->translationManager->getTranslatedPrayerName($next_prayer_slug) . ' ' .
                                 $this->translationManager->getTranslatedLabel('Iqamah'),
                'begins_time' => esc_html($begins_time),
                'begins_title' => $this->translationManager->getTranslatedPrayerName($next_prayer_slug) . ' ' .
                                $this->translationManager->getTranslatedLabel('Begins'),
                'single_prayer_begins_title' => $this->translationManager->getTranslatedLabel('Begins'),
                'single_prayer_iqamah_title' => $this->translationManager->getTranslatedLabel('Iqamah')
            ];
        } catch (\Exception $e) {
            Logger::error('Error getting next prayer data: ' . $e->getMessage(), 'PrayerTimeRenderer');
            return $default_data;
        }
    }

    private function renderCurrentTime(): string {
        // Check if we're in a page builder editor
        $is_page_builder = $this->isPageBuilderEditor();
        
        // Get current time for display
        $current_time = current_time(get_option('time_format', 'g:i A'));
        
        // Always try to translate the time for display
        $current_time = $this->translateTimeString($current_time);
        
        ob_start(); ?>
        <span class="fiveprayer-live-time" 
            data-servertime="<?php echo esc_attr(current_time('timestamp')); ?>" 
            data-timeformat="<?php echo esc_attr(get_option('time_format')); ?>"
            data-pagebuilder="<?php echo $is_page_builder ? 'true' : 'false'; ?>"
            style="font-family: auto; font-weight: inherit">
            <?php 
            // Always show static time in page builders and as fallback for frontend
            echo esc_html($current_time); 
            ?>
        </span>
        <?php
        
        // Enqueue live time script for frontend updates
        if (!$is_page_builder) {
            // Use the central function to enqueue combined scripts
            fiveprayer_enqueue_combined_scripts();

            // Load translations and localize script
            $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
            $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage", [['language_code' => 'en']]);
            $customLan = $getMetaFromDB->get_meta_key("hijralocale", []);
            $numbers = $getMetaFromDB->get_meta_key("gregorian_numbers", []);
            
            // Check if Hijra Calendar is active - if NOT active, ALWAYS force English
            $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;
            if (!$hijraIsActive) {
                $activeLanguage = [['language_code' => 'en']];  // Force English regardless of stored value
            }

            // Build translation array with English fallback
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

                // If AM/PM not found, try English fallback
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
            
            // Localize script with translation data
            $timeFormat = get_option('time_format', 'h:i A');
            // Don't force seconds - use the actual WordPress time format
            $timeData = [
                'numbers' => $translations,
                'ampm' => [
                    'AM' => $translations['AM'] ?? 'AM',
                    'PM' => $translations['PM'] ?? 'PM'
                ],
                'initialTime' => date_i18n($timeFormat),
                'timeFormat' => $timeFormat,
                'timeSelector' => '.fiveprayer-live-time',
                'activeLanguage' => $activeLanguage[0]['language_code'] ?? 'en',
                'customLan' => $customLan['customLan'] ?? false,
            ];
            
            // Add WordPress timezone data to the global window object
            $timezone_data = [
                'gmt_offset' => get_option('gmt_offset', 0),
                'timezone_string' => get_option('timezone_string', ''),
                'current_time' => current_time('Y-m-d H:i:s'),
                'current_timestamp' => current_time('timestamp'),
            ];

            wp_add_inline_script('fiveprayer-live-time',
                'window.FivePrayerData = window.FivePrayerData || {}; ' .
                'window.FivePrayerData.wordpress_timezone = ' . wp_json_encode($timezone_data) . ';'
            );

            // Localize script with translation data for the combined script
            if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
                wp_localize_script(
                    'fiveprayer-combined-js',
                    'fiveprayerTimeData',
                    $timeData,
                    JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
                );
            } else {
                // Fallback to individual file if asset manager is not available
                wp_localize_script(
                    'fiveprayer-live-time',
                    'fiveprayerTimeData',
                    $timeData,
                    JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
                );
            }
        }
        
        return ob_get_clean();
    }


    /**
     * The current Gregorian date, optionally carrying the Day display.
     *
     * When the Day_Display feature is on and at least one part is enabled, the
     * translated date gains the weekday name and — when the Number part is on —
     * its day number becomes the ordinal. The weekday name is placed *inline at
     * the day position* (never appended), following the configured order:
     *
     *   name_first   → "Wed 14th October 2026"
     *   number_first → "14th Wed October 2026"
     *
     * With the feature off (the default) the plain translated date is returned
     * unchanged, so this stays fully optional. The weekday/ordinal words come
     * from the Translate system (day_names); the month, digits and layout of the
     * date stay exactly as Translate already produced them.
     */
    private function renderCurrentDate(): string {
        $base = $this->prayer_times && isset($this->prayer_times->currentDate)
            ? (string) $this->prayer_times->currentDate
            : '';

        if ($base === '') {
            return esc_html__('Date not available', 'fiveprayer');
        }

        $getMeta = new GetMeta();
        $config  = \FivePrayer\Core\Helpers\DayNameFormatter::resolve(
            $getMeta->get_meta_key('day_display'),
            $getMeta->get_meta_key('feature_toggles')
        );

        $showFull   = $config['showFull'];
        $showShort  = $config['showShort'];
        $showNumber = $config['showNumber'];

        // Off (or nothing selected): the date is untouched — fully optional.
        if (!$showFull && !$showShort && !$showNumber) {
            return esc_html($base);
        }

        $date = isset($this->prayer_times->date) ? (string) $this->prayer_times->date : '';
        if ($date === '') {
            return esc_html($base);
        }

        $locale         = $getMeta->get_meta_key('hijralocale');
        $activeLanguage = $getMeta->get_meta_key('activeLanguage');
        $customLan      = is_array($locale) && !empty($locale['isActive']) && !empty($locale['customLan']);
        $lang           = is_array($activeLanguage) && !empty($activeLanguage[0]['language_code'])
            ? (string) $activeLanguage[0]['language_code']
            : 'en';

        $dayNames         = $getMeta->get_meta_key('day_names');
        $gregorianNumbers = $getMeta->get_meta_key('gregorian_numbers');

        // Fold the day parts into the translated date *inline at the day
        // position* (the day number becomes the ordinal and the weekday name
        // sits beside it), never appended:
        //
        //   name_first   → "Wed 14th October 2026"
        //   number_first → "14th Wed October 2026"
        $base = \FivePrayer\Core\Helpers\DayNameFormatter::placeInDate(
            $base,
            $date,
            is_array($dayNames) ? $dayNames : [],
            is_array($gregorianNumbers) ? $gregorianNumbers : [],
            $lang,
            $customLan,
            $showFull,
            $showShort,
            $showNumber,
            $config['order']
        );

        return esc_html($base);
    }


        private function renderTitleField(string $field, bool $removeNextWord, string $removeSpecificWord): string {
        $title = '';
        
        if ($field === 'single_prayer_begins_title') {
            $title = $this->translationManager->getTranslatedLabel('Begins');
        } elseif ($field === 'single_prayer_iqamah_title') {
            $title = $this->translationManager->getTranslatedLabel('Iqamah');
        }
        
        $title = $removeNextWord ? $this->removeSecondWord($title) : $title;
        return $removeSpecificWord ? $this->removeSpecificWord($title, $removeSpecificWord) : $title;
    }

    private function renderNextPrayerTitle(string $field, bool $removeNextWord, string $removeSpecificWord): string {
        $next_prayer_data = $this->getNextPrayerData();
        
        if ($field === 'next_prayer_title') {
            $title = $this->translationManager->getTranslatedLabel('Next Prayer');
        } else {
            $title = $field === 'next_prayer_iqamah_title'
                ? $next_prayer_data['iqamah_title']
                : $next_prayer_data['begins_title'];
        }
        
        $title = $removeNextWord ? $this->removeSecondWord($title) : $title;
        return $removeSpecificWord ? $this->removeSpecificWord($title, $removeSpecificWord) : $title;
    }

    private function renderPrayerName(string $field, bool $removeNextWord, string $removeSpecificWord): string {
        if (!array_key_exists($field, ShortCodeMap::PRAYER_NAMES)) {
            return '';
        }
        
        $name = $this->translationManager->getTranslatedPrayerName(ShortCodeMap::PRAYER_NAMES[$field]);
        $name = $removeNextWord ? $this->removeSecondWord($name) : $name;
        return $removeSpecificWord ? $this->removeSpecificWord($name, $removeSpecificWord) : $name;
    }    private function renderNextPrayerTime(string $field): string
    {
        $next_prayer_data = $this->getNextPrayerData();
        $time = $field === 'next_prayer_iqamah_time'
            ? $next_prayer_data['iqamah_time'] 
            : $next_prayer_data['begins_time'];
            
        return $this->formatTime($time);
    }

    /**
     * Renders the live countdown to the next prayer. Honours the
     * "Next Prayer Countdown" feature switch and the customization saved on
     * the Configure Settings page.
     */
    private function renderNextPrayerRemaining(): string
    {
        if (!\FivePrayer\Core\Daily\NextPrayerCountdown::isEnabled()) {
            return '';
        }

        $next_prayer_data = $this->getNextPrayerData();
        if (empty($next_prayer_data['timestamp'])) {
            return '';
        }

        // The countdown ticks client-side, so make sure the combined bundle
        // (which contains the ticker) is present even when shortcode detection
        // cannot see the page content (blocks / page builders).
        if (function_exists('fiveprayer_enqueue_combined_scripts')) {
            fiveprayer_enqueue_combined_scripts();
        }

        return \FivePrayer\Core\Daily\NextPrayerCountdown::render($next_prayer_data);
    }

    private function renderActualPrayerTime(string $field, bool $removeNextWord, string $removeSpecificWord): string {
        if (!$this->prayer_times || !isset($this->prayer_times->$field)) {
            return sprintf(
                '<span class="prayer-time-error">%s</span>',
                esc_html__('Prayer time not available', 'fiveprayer')
            );
        }
        
        $time = esc_html($this->formatTime($this->prayer_times->$field));
        $time = $removeNextWord ? $this->removeSecondWord($time) : $time;
        return $removeSpecificWord ? $this->removeSpecificWord($time, $removeSpecificWord) : $time;
    }

}
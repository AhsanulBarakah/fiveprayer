<?php
namespace FivePrayer\Core\Shortcodes;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit('Direct script access denied.');

use FivePrayer\Core\Daily\NextPrayer;
use FivePrayer\Core\Daily\Styles\DailyStyleDynamic;
use FivePrayer\Core\ShortCodes\JS;
use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\PathService;

use FivePrayer\Core\ShortCodes\Traits\VerticalPrayerAssetTrait;
use FivePrayer\Core\ShortCodes\Traits\VerticalPrayerDataTrait;
use FivePrayer\Core\ShortCodes\Traits\VerticalPrayerRendererTrait;

if (!class_exists(__NAMESPACE__ . '\\ShortCodeVerticalDailyPrayer')) {
    class ShortCodeVerticalDailyPrayer
    {
        use VerticalPrayerAssetTrait;
        use VerticalPrayerDataTrait;
        use VerticalPrayerRendererTrait;

        private $highlight;
        private $next_prayer_data;
        private $vertical_daily_prayer;
        private $prayer_names;
        private $activeLanguage;
        private $timetable_prayer;
        private $locale = [];
        private $skip_iqamah_midnight = false;

        /** Optional second ‘Asr (2 Mithl / Hanafi) row — Timetable Layout switch. */
        private $show_asr2 = false;
        private $debug = false;
        private $path_service;

        /**
         * How many tables this request has rendered.
         *
         * Used to give each table's sub-header row its own id: the row used to
         * carry the fixed id `fiveprayer-tbmonth-second`, so two timetables on
         * one page produced duplicate ids and the `#fiveprayer-tbmonth-second`
         * styling and hover rules restyled the other table's row as well.
         */
        private static $rendered_tables = 0;

        public function __construct()
        {
            add_action('init', [$this, 'registerShortcodes']);
            add_action('wp_enqueue_scripts', [$this, 'loadAssets']);

            $hijraLocale = PrayerDataCache::getSingleMetaValue("hijralocale");
            $this->locale = !empty($hijraLocale) ? json_decode($hijraLocale, true) : [];

            $hijraIsActive = isset($this->locale['isActive']) && $this->locale['isActive'] === true;
            if (!$hijraIsActive) {
                $this->locale = ['isActive' => false, 'customLan' => false];
            }

            $skipIqamahMidnight = PrayerDataCache::getSingleMetaValue("skip_iqamah_midnight");
            $this->skip_iqamah_midnight = $skipIqamahMidnight === '1';

            $this->debug = \FivePrayer\Core\Logging\Logger::isDebugEnabled();
            $this->path_service = new PathService();
        }

        private function log($message)
        {
            if ($this->debug) {
                Logger::debug($message, 'ShortCodeVerticalDailyPrayer');
            }
        }

        /**
         * Id for the sub-header row of one rendered table.
         *
         * The styling hook is the `.fiveprayer__tbmonthsecond` class, so the id
         * is only a convenience for custom CSS; the first table on a page keeps
         * the historical value so existing user stylesheets keep working, and
         * every further table gets a suffix instead of a duplicate id.
         */
        private function nextSubheaderRowId(): string
        {
            self::$rendered_tables++;

            return self::$rendered_tables === 1
                ? 'fiveprayer-tbmonth-second'
                : 'fiveprayer-tbmonth-second-' . self::$rendered_tables;
        }

        /**
         * Decoded `vertical_today_layout` options (empty array when unset).
         *
         * @return array
         */
        private function getVerticalLayoutOptions(): array
        {
            $layout = (new \FivePrayer\Core\Helpers\GetMeta())->get_meta_key('vertical_today_layout', []);

            return is_array($layout) ? $layout : [];
        }

        public function registerShortcodes()
        {
            add_shortcode('Fp_Vertical_Daily_Prayer', [$this, 'renderPrayerTable']);
        }

        public function loadAssets()
        {
            $this->enqueueVerticalPrayerAssets();
        }

        public function renderPrayerTable($atts)
        {
            $live_time_path = $this->path_service->getFileFullPath('php/classes/core/ShortCodes/JS/live-time.js');
            $live_time_url = $this->path_service->getFileUrl('php/classes/core/ShortCodes/JS/live-time.js');

            if (function_exists('fiveprayer_enqueue_combined_scripts')) {
                fiveprayer_enqueue_combined_scripts();
            } elseif (file_exists($live_time_path)) {
                wp_enqueue_script('fiveprayer-live-time', $live_time_url, [], fiveprayer_get_asset_version(), true);
            }

            $prayer = $this->getTodayPrayerTimes();
            $this->log("ShortCodeVerticalDailyPrayer: Rendering with prayer data: " . json_encode($prayer));

            if (empty($prayer)) {
                $this->log("ShortCodeVerticalDailyPrayer: No prayer data available for rendering!");
                return 'No prayer times available';
            }

            // Reuse decoded settings from ShortCodesSinglePrayers instead of re-loading
            $shared = ShortCodesSinglePrayers::getInstance();
            $settings = $shared->getSettings();

            $this->vertical_daily_prayer = $settings['vertical_daily_prayer'] ?? [];
            $this->prayer_names = $settings['prayer_names'] ?? [];
            $this->activeLanguage = $settings['activeLanguage'] ?? [];

            $hijraIsActive = isset($this->locale['isActive']) && $this->locale['isActive'] === true;
            if (!$hijraIsActive) {
                $this->activeLanguage = [['language_code' => 'en']];
            }

            $this->timetable_prayer = $settings['timetable_prayer'] ?? [];

            // Layout switch for the optional second ‘Asr row. Read here (not in
            // the constructor) so a page cached before the switch was saved
            // still picks up the current value on the next render.
            $layout = $this->getVerticalLayoutOptions();
            $this->show_asr2 = $this->layoutFlag($layout, 'showAsr2', false);

            $this->log("ShortCodeVerticalDailyPrayer: Selected prayer data: " . json_encode($prayer));

            $next_prayer = new NextPrayer();
            $this->highlight = $next_prayer->getNextPrayer($prayer, $this->timetable_prayer, $this->prayer_names, $this->activeLanguage);
            $this->next_prayer_data = $next_prayer->getNextPrayerData();

            ob_start();
            // The one styling entry point: enqueues the combined stylesheet and
            // attaches the dynamic colour/border variables. Called from the
            // renderer as well as from the head so the table is styled even when
            // a page builder is what put this shortcode on the page and nothing
            // discovered it earlier.
            \FivePrayer\Core\ShortCodes\Managers\StyleManager::getInstance()->enqueueStyles();
            $this->renderVerticalTableHoverStyles();
            $this->renderVerticalTableRadiusStyles();
            ?>
            <div class="fiveprayer-container fiveprayer__iqamah_next">
                <table class="fiveprayer-table fiveprayer__DairyPrayer_">
                    <thead>
                        <tr>
                            <th colspan="<?php echo $this->skip_iqamah_midnight ? '2' : '3'; ?>" class="prayer-header">
                                <?php $this->renderNextPrayerNotice(); ?>
                                <?php $this->renderHeader($prayer); ?>
                            </th>
                        </tr>
                        <tr id="<?php echo esc_attr($this->nextSubheaderRowId()); ?>" class="fiveprayer__tbmonthsecond">
                            <th><?php echo esc_html($this->getTranslatedNameVDP('Prayer')); ?></th>
                            <th><?php echo esc_html($this->getTranslatedNameVDP('Begins')); ?></th>
                            <?php if (!$this->skip_iqamah_midnight): ?>
                                <th><?php echo esc_html($this->getTranslatedNameVDP('Iqamah')); ?></th>
                            <?php endif; ?>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $this->renderPrayerRow('fajr', $this->getTranslatedName('Fajr', $this->prayer_names, $this->activeLanguage), $prayer->fajr_begins, $this->skip_iqamah_midnight ? null : $prayer->fajr_iqamah);
                        $this->renderPrayerRow('sunrise', $this->getTranslatedName('Sunrise', $this->prayer_names, $this->activeLanguage), $prayer->sunrise, null, true);
                        $this->renderPrayerRow('dhuhr', $this->getTranslatedName('Dhuhr', $this->prayer_names, $this->activeLanguage), $prayer->dhuhr_begins, $this->skip_iqamah_midnight ? null : $prayer->dhuhr_iqamah);
                        $this->renderPrayerRow('asr', $this->getTranslatedName('Asr', $this->prayer_names, $this->activeLanguage), $prayer->asr_begins, $this->skip_iqamah_midnight ? null : $prayer->asr_iqamah);
                        // Second ‘Asr (2 Mithl / Hanafi) — its own Begins-only row,
                        // right under ‘Asr, and only when the day has a stored
                        // time (it is generated for 1-Mithl schools, and blank
                        // when the main ‘Asr already uses 2 Mithl).
                        if ($this->show_asr2 && !empty($prayer->asr_second_begins)) {
                            // The label is “Hanafi” (the 2 Mithl time) and comes from
                            // the prayer-names collection like every other row, so
                            // renaming it in More → Translate → Prayer Names renames
                            // this row too.
                            $this->renderPrayerRow('asr2', $this->getTranslatedName('Hanafi', $this->prayer_names, $this->activeLanguage), $prayer->asr_second_begins, null, true);
                        }
                        $this->renderPrayerRow('maghrib', $this->getTranslatedName('Maghrib', $this->prayer_names, $this->activeLanguage), $prayer->maghrib_begins, $this->skip_iqamah_midnight ? null : $prayer->maghrib_iqamah);
                        $this->renderPrayerRow('isha', $this->getTranslatedName('Isha', $this->prayer_names, $this->activeLanguage), $prayer->isha_begins, $this->skip_iqamah_midnight ? null : $prayer->isha_iqamah);
                        ?>
                    </tbody>
                </table>
            </div>
            <?php
            return ob_get_clean();
        }
    }
}

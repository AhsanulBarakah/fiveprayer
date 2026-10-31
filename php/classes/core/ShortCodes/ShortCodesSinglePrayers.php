<?php
namespace FivePrayer\Core\ShortCodes;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\PathService;
use FivePrayer\Core\ShortCodes\Managers\ShortCodeManager;
use FivePrayer\Core\ShortCodes\Managers\TranslationManager;
use FivePrayer\Core\ShortCodes\Managers\StyleManager;
use FivePrayer\Core\ShortCodes\Renderers\PrayerTimeRenderer;

class ShortCodesSinglePrayers {
    private static $instance = null;
    private static $prayer_times_cache = null;
    private static $prayer_times_cache_date = null;
    private static $settings_loaded = false;
    private static $settings = [
        'locale' => [],
        'extra_info' => [],
        'prayer_names' => [],
        'activeLanguage' => [],
        'timetable_prayer' => [],
        'vertical_daily_prayer' => []
    ];

    private $shortcodeManager;
    private $translationManager;
    private $renderer;
    private $styleManager;
    private $path_service;

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Reset the singleton instance to force a fresh initialization
     */
    public static function resetInstance(): void {
        self::$instance = null;
        self::$prayer_times_cache = null;
        self::$prayer_times_cache_date = null;
        self::$settings_loaded = false;
        self::$settings = [
            'locale' => [],
            'extra_info' => [],
            'prayer_names' => [],
            'activeLanguage' => [],
            'timetable_prayer' => [],
            'vertical_daily_prayer' => []
        ];
    }

    private function __construct() {
        $this->path_service = new PathService();
        $this->loadSettings();
        $this->initializeComponents();
        $this->registerHooks();
    }

    public function renderShortCode(string $field, bool $removeNextWord = false, string $removeSpecificWord = ''): string {
        // Always return the actual content for AJAX requests or direct calls
        // The main shortcode handler manages the dynamic loading process
        return $this->renderer->renderShortCode($field, $removeNextWord, $removeSpecificWord);
    }

    /**
     * Enqueue the dynamic loader script
     */
    public function enqueueDynamicLoaderScript(): void
    {
        // Only enqueue once
        if (!wp_script_is('fiveprayer-dynamic-loader', 'registered')) {
            $script_path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'php/classes/core/Assets/JS/dynamic-prayer-loader.js';
            $style_path  = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'utils/dynamic-loader-styles.css';

            $script_version = file_exists($script_path) ? filemtime($script_path) : (function_exists('fiveprayer_get_asset_version') ? fiveprayer_get_asset_version() : '1.0.0');
            $style_version  = file_exists($style_path) ? filemtime($style_path) : $script_version;

            wp_register_script(
                'fiveprayer-dynamic-loader',
                plugins_url('php/classes/core/Assets/JS/dynamic-prayer-loader.js', FIVEPRAYER_PLUGIN_FILE),
                ['jquery'],
                $script_version,
                true
            );

            // Register the CSS as well. The path is relative to the plugin
            // root; the old ../../../../../ form pointed outside the plugin.
            wp_register_style(
                'fiveprayer-dynamic-styles',
                plugins_url('utils/dynamic-loader-styles.css', FIVEPRAYER_PLUGIN_FILE),
                [],
                $style_version
            );
        }

        // Use the central function to enqueue combined scripts
        fiveprayer_enqueue_combined_scripts();

        // Also ensure dynamic styles are loaded
        if (!wp_style_is('fiveprayer-dynamic-styles', 'enqueued')) {
            wp_enqueue_style('fiveprayer-dynamic-styles');
        }
    }

    public function getNextPrayerData(): array {
        // Cache is already invalidated in loadSettings()
        return $this->renderer->getNextPrayerData();
    }

    /**
     * Get decoded settings array for reuse by other shortcode classes.
     * Avoids re-loading and re-decoding the same JSON values.
     */
    public function getSettings(): array {
        if (!self::$settings_loaded) {
            $this->loadSettings();
        }
        return self::$settings;
    }

    private function loadSettings(): void {
        // Always check Hijra Calendar status - if NOT active, force English
        $hijraLocale = PrayerDataCache::getSingleMetaValue("hijralocale");
        $hijraLocaleDecoded = !empty($hijraLocale) ? json_decode($hijraLocale, true) : [];
        $hijraIsActive = isset($hijraLocaleDecoded['isActive']) && $hijraLocaleDecoded['isActive'] === true;
        
        // If Hijra Calendar is NOT active, reset the singleton to force fresh English data
        if (!$hijraIsActive && self::$settings_loaded) {
            $currentLang = isset(self::$settings['activeLanguage']) ? json_decode(self::$settings['activeLanguage'], true) : [['language_code' => 'en']];
            if (isset($currentLang[0]['language_code']) && $currentLang[0]['language_code'] !== 'en') {
                // Language is not English but Hijra Calendar is inactive - reset
                self::resetInstance();
            }
        }
        
        if (self::$settings_loaded) {
            return;
        }

        // Load settings from PrayerDataCache
        self::$settings['locale'] = PrayerDataCache::getSingleMetaValue("hijralocale");
        self::$settings['extra_info'] = PrayerDataCache::getSingleMetaValue("extra_info");
        self::$settings['prayer_names'] = PrayerDataCache::getSingleMetaValue("prayer_names");
        self::$settings['activeLanguage'] = PrayerDataCache::getSingleMetaValue("activeLanguage");
        self::$settings['timetable_prayer'] = PrayerDataCache::getSingleMetaValue("timetable_prayer");
        self::$settings['vertical_daily_prayer'] = PrayerDataCache::getSingleMetaValue("vertical_daily_prayer");

        // Decode JSON strings with null checks to prevent deprecated warnings
        foreach (self::$settings as $key => $value) {
            if ($value !== null && $value !== false) {
                self::$settings[$key] = json_decode($value, true);
                // If json_decode fails, set to empty array
                if (self::$settings[$key] === null) {
                    self::$settings[$key] = [];
                }
            } else {
                self::$settings[$key] = [];
            }
        }
        
        // FORCE ENGLISH if Hijra Calendar is NOT active
        $hijraIsActive = isset(self::$settings['locale']['isActive']) && self::$settings['locale']['isActive'] === true;
        if (!$hijraIsActive) {
            self::$settings['activeLanguage'] = [['language_code' => 'en']];
            self::$settings['locale']['customLan'] = false;
        }

        self::$settings_loaded = true;
    }

    private function initializeComponents(): void {
        $this->translationManager = new TranslationManager(
            self::$settings['prayer_names'],
            self::$settings['activeLanguage'],
            self::$settings['locale'],
            self::$settings['vertical_daily_prayer'],
            self::$settings['extra_info']
        );

        $this->renderer = new PrayerTimeRenderer(
            $this->translationManager,
            $this->getTodayPrayerTimes(),
            self::$settings['timetable_prayer'],
            self::$settings['vertical_daily_prayer'],
            self::$settings['extra_info']
        );

        // Instantiate ShortCodeManager directly since it doesn't use singleton pattern
        $this->shortcodeManager = new ShortCodeManager($this->renderer);
        $this->styleManager = StyleManager::getInstance();
    }

    private function registerHooks(): void {
        static $hooks_registered = false;
        if (!$hooks_registered) {
            add_action('init', [$this->shortcodeManager, 'registerShortcodes']);
            add_action('wp_enqueue_scripts', [$this, 'loadAssets']);
            add_action('wp_enqueue_scripts', [$this, 'addInlineStyles']);
            $hooks_registered = true;
        }
    }

    public function getTodayPrayerTimes() {
        $current_date = current_time('Y-m-d');

        // Check if we have cached data for a different date
        if (self::$prayer_times_cache === null || self::$prayer_times_cache_date !== $current_date) {
            self::$prayer_times_cache = PrayerDataCache::getTodaysPrayerTimes($current_date);
            self::$prayer_times_cache_date = $current_date;
        }
        return self::$prayer_times_cache;
    }

    public function loadAssets(): void {
        static $assets_loaded = false;
        // Remove the isTriggered() check to allow manual triggering
        if (!$assets_loaded) {
            // Use the central function to enqueue combined scripts
            fiveprayer_enqueue_combined_scripts();
            $assets_loaded = true;
        }
    }

    public function addInlineStyles(): void {
        static $styles_loaded = false;
        if ($styles_loaded) {
            return;
        }
        $styles_loaded = true;

        // StyleManager owns the single handle and the single stylesheet (the
        // combined bundle). Enqueuing `prayer-styles.css` here under that same
        // handle replaced the bundle with the one file and printed the plugin's
        // CSS twice on every prayer page.
        $this->styleManager->enqueueStyles();
    }

    private function isBuilderEditing(): bool {
        static $is_builder = null;
        if ($is_builder !== null) {
            return $is_builder;
        }

        $builder_params = [
            'ct_builder' => true,
            'oxy_action' => true,
            'elementor-preview' => true,
            'bricks' => true,
            'vc_editable' => 'true',
            'et_fb' => true,
            'thrive-architect' => true,
            'oxygen' => true
        ];

        foreach ($builder_params as $param => $value) {
            $get_param = filter_input(INPUT_GET, $param) ?: '';
            if ($get_param &&
                (is_bool($value) || sanitize_text_field($get_param) === $value)) {
                return $is_builder = true;
            }
        }


        if ((class_exists('FLBuilderModel') && \FLBuilderModel::is_builder_active()) ||
            (is_admin() && filter_input(INPUT_GET, 'post') && get_post_type(absint(filter_input(INPUT_GET, 'post'))) === 'page')) {
            return $is_builder = true;
        }

        return $is_builder = false;
    }

}
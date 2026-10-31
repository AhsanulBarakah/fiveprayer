<?php

namespace FivePrayer\Core\ShortCodes\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\ShortCodeTimetableMonth;
use FivePrayer\Core\ShortCodes\ShortCodeVerticalDailyPrayer;
use FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers;
use FivePrayer\Core\ShortCodes\ShortCodePrinterButton;
use FivePrayer\Core\ShortCodes\ShortCodeExtraPrayers;
use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;

/**
 * Trait for shortcode registration functionality.
 */
trait ShortcodeRegistrationTrait
{
    public function register(): void
    {
        add_action('init', [$this, 'register_shortcodes']);
        ShortCodesSinglePrayers::getInstance();

        new ShortCodePrinterButton();

        // Six optional custom-prayer slots: [Fp_Extra_Prayer_1] … [Fp_Extra_Prayer_6].
        new ShortCodeExtraPrayers();

        add_action('updated_option', [self::class, 'maybe_purge_fragment_cache'], 10, 3);
        add_action('fiveprayer_invalidate_all', [self::class, 'purge_fragment_caches']);

        // `fiveprayer_dynamic_content` is answered by DynamicContentHandler
        // only. It used to be registered here as well, so two callbacks sat on
        // one action and whichever ran first exited before the other could.
    }

    public function register_shortcodes(): void
    {
        add_shortcode('fiveprayer_widget', [$this, 'render_prayer_times']);

        add_shortcode('Fp_TimeTable_Monthly', [$this, 'timetable_month']);
        add_shortcode('Fp_Vertical_Daily_Prayer', [$this, 'timetable_daily']);

        add_shortcode('Fp_Single_Fajr', [$this, 'single_prayer_shortcode']);
        add_shortcode('Fp_Single_Sunrise', [$this, 'single_prayer_shortcode']);
        add_shortcode('Fp_Single_Dhuhr', [$this, 'single_prayer_shortcode']);
        add_shortcode('Fp_Single_Asr', [$this, 'single_prayer_shortcode']);
        add_shortcode('Fp_Single_Maghrib', [$this, 'single_prayer_shortcode']);
        add_shortcode('Fp_Single_Isha', [$this, 'single_prayer_shortcode']);
        add_shortcode('Fp_Single_CurrentTime', [$this, 'single_prayer_shortcode']);
        add_shortcode('Fp_Single_CurrentDate', [$this, 'single_prayer_shortcode']);
        add_shortcode('Fp_Single_NextPrayer', [$this, 'single_prayer_shortcode']);

        // Register ALL ShortCodeMap shortcodes as fallback
        // Ensures they work in page builders even if ShortCodesSinglePrayers singleton isn't ready
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field) {
            if (!shortcode_exists($shortcode)) {
                add_shortcode($shortcode, [$this, 'single_prayer_shortcode']);
            }
        }
        foreach (ShortCodeMap::DEPRECATED_SHORTCODES as $shortcode => $field) {
            if (!shortcode_exists($shortcode)) {
                add_shortcode($shortcode, [$this, 'single_prayer_shortcode']);
            }
        }
    }

    public function render_prayer_times(): string
    {
        return '<div>' . esc_html__('Prayer times will be displayed here.', 'fiveprayer') . '</div>';
    }
}

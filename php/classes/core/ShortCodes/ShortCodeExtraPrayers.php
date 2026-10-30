<?php

namespace FivePrayer\Core\ShortCodes;

use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\ShortCodes\Managers\TranslationManager;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

/**
 * ShortCodeExtraPrayers
 *
 * Registers six optional "extra prayer" shortcodes:
 *
 *   [Fp_Extra_Prayer_1] … [Fp_Extra_Prayer_6]
 *
 * These are meant for the prayers a mosque prays on top of the five daily
 * prayers — e.g. two Jumu'ah (Friday) congregations, or the extra Eid prayers.
 * The name, time and an optional note for each slot are configured in
 * FivePrayer → Customizing → Configure Settings → Extra Prayers.
 *
 * Each shortcode accepts the same three values as attributes so it can be
 * overridden per placement:
 *
 *   [Fp_Extra_Prayer_1 name="Jumu'ah 2" time="13:30" note="Khutbah"]
 *
 * The name and note run through the site's Translate system (More → Translate →
 * Extra Info), so they are shown in the visitor's language. The time is shown
 * in the site's time format with translated digits / AM-PM.
 *
 * The whole feature ships OFF and is gated by the `Extra_Prayers` feature
 * switch; while it is off every slot renders nothing.
 *
 * @package FivePrayer\Core\ShortCodes
 */
class ShortCodeExtraPrayers
{
    /** Number of configurable slots / shortcodes. */
    public const SLOT_COUNT = 6;

    /** Meta key holding the configured slots. */
    public const META_KEY = 'extra_prayers';

    /** Feature-switch key (Feature Switches page / Configure Settings). */
    public const FEATURE_KEY = 'Extra_Prayers';

    public function __construct()
    {
        add_action('init', [$this, 'register_shortcodes']);
    }

    public function register_shortcodes(): void
    {
        for ($slot = 1; $slot <= self::SLOT_COUNT; $slot++) {
            add_shortcode('Fp_Extra_Prayer_' . $slot, [$this, 'render_shortcode']);
        }
    }

    /**
     * Render one extra-prayer slot.
     *
     * @param array|string $atts Shortcode attributes.
     * @param string|null  $content
     * @param string       $tag Shortcode tag, used to resolve the slot number.
     */
    public function render_shortcode($atts, $content = null, $tag = ''): string
    {
        if (!$this->is_feature_enabled()) {
            return '';
        }

        $slot = (int) preg_replace('/\D/', '', (string) $tag);
        if ($slot < 1 || $slot > self::SLOT_COUNT) {
            return '';
        }

        $atts = shortcode_atts(
            [
                'name' => '',
                'time' => '',
                'note' => '',
                'separator' => '',
            ],
            $atts,
            $tag
        );

        $entry = $this->get_slot($slot);

        $name = $atts['name'] !== '' ? (string) $atts['name'] : $entry['name'];
        $note = $atts['note'] !== '' ? (string) $atts['note'] : $entry['note'];
        $time = $atts['time'] !== '' ? (string) $atts['time'] : $entry['time'];

        if ($name === '' && $note === '' && $time === '') {
            return '';
        }

        $translation_manager = $this->get_translation_manager();

        $parts = [];
        if ($name !== '') {
            // getTranslatedLabel() escapes its return value.
            $parts[] = '<span class="fiveprayer-extra-prayer-name">'
                . $translation_manager->getTranslatedLabel($name) . '</span>';
        }
        if ($time !== '') {
            $parts[] = '<span class="fiveprayer-extra-prayer-time">'
                . $this->format_time($time) . '</span>';
        }
        if ($note !== '') {
            $parts[] = '<span class="fiveprayer-extra-prayer-note">'
                . $translation_manager->getTranslatedLabel($note) . '</span>';
        }

        if (empty($parts)) {
            return '';
        }

        $separator = $atts['separator'] !== '' ? ' ' . esc_html((string) $atts['separator']) . ' ' : ' ';

        return '<span class="fiveprayer-extra-prayer fiveprayer-extra-prayer-' . (int) $slot . '">'
            . implode($separator, $parts)
            . '</span>';
    }

    /**
     * Read one stored slot (1-based) with a safe, predictable shape.
     *
     * @return array{name: string, time: string, note: string}
     */
    private function get_slot(int $slot): array
    {
        $raw = json_decode(PrayerDataCache::getSingleMetaValue(self::META_KEY) ?: '[]', true);
        $entries = is_array($raw) ? array_values($raw) : [];

        $entry = $entries[$slot - 1] ?? [];
        if (!is_array($entry)) {
            $entry = [];
        }

        return [
            'name' => isset($entry['name']) ? (string) $entry['name'] : '',
            'time' => isset($entry['time']) ? (string) $entry['time'] : '',
            'note' => isset($entry['note']) ? (string) $entry['note'] : '',
        ];
    }

    /** Whether the Extra Prayers feature switch is on. */
    private function is_feature_enabled(): bool
    {
        $toggles = json_decode(PrayerDataCache::getSingleMetaValue('feature_toggles') ?: '[]', true);
        if (!is_array($toggles)) {
            return false;
        }

        return isset($toggles[self::FEATURE_KEY]) && $toggles[self::FEATURE_KEY] === true;
    }

    /**
     * Build a translation manager from the stored translation collections.
     * Mirrors the API-side resolver so a slot's name/note is looked up in the
     * `extra_info` collection for the active language.
     */
    private function get_translation_manager(): TranslationManager
    {
        $prayer_names = json_decode(PrayerDataCache::getSingleMetaValue('prayer_names') ?: '[]', true) ?: [];
        $activeLanguage = json_decode(PrayerDataCache::getSingleMetaValue('activeLanguage') ?: '[]', true) ?: [];
        $locale = json_decode(PrayerDataCache::getSingleMetaValue('hijralocale') ?: '[]', true) ?: [];
        $vertical_daily_prayer = json_decode(PrayerDataCache::getSingleMetaValue('vertical_daily_prayer') ?: '[]', true) ?: [];
        $extra_info = json_decode(PrayerDataCache::getSingleMetaValue('extra_info') ?: '[]', true) ?: [];

        if (!isset($locale['customLan']) || $locale['customLan'] !== true) {
            // Custom Language off → English, matching the rest of the plugin.
            $activeLanguage = [['language_code' => 'en']];
            $locale['customLan'] = false;
        }

        return new TranslationManager(
            $prayer_names,
            $activeLanguage,
            $locale,
            $vertical_daily_prayer,
            $extra_info
        );
    }

    /**
     * Format a stored time (HH:MM) with the site's time format, then translate
     * its digits / AM-PM through the Gregorian-numbers translations.
     */
    private function format_time(string $time): string
    {
        $time = trim($time);
        if ($time === '') {
            return '';
        }

        $timestamp = strtotime($time);
        if ($timestamp === false) {
            // Not a parseable time — show exactly what was typed.
            return esc_html($time);
        }

        // Follow the site's WordPress time format (Settings → General → Time
        // Format) but drop the seconds part, the same way the other FivePrayer
        // shortcodes do — a site configured with "g:i:s a" shows "7:35 pm"
        // rather than "7:35:00 pm".
        $format = str_replace(':s', '', (string) get_option('time_format', 'g:i A'));

        $formatted = date_i18n($format, $timestamp);

        return esc_html($this->translate_time_string($formatted));
    }

    /**
     * Replace digits and AM/PM with the active language's Gregorian number
     * translations. Mirrors the renderer's translateTimeString helper.
     */
    private function translate_time_string(string $time): string
    {
        $locale = json_decode(PrayerDataCache::getSingleMetaValue('hijralocale') ?: '[]', true) ?: [];
        $hijra_is_active = isset($locale['isActive']) && $locale['isActive'] === true;
        if (!$hijra_is_active || !isset($locale['customLan']) || $locale['customLan'] !== true) {
            return $time;
        }

        $activeLanguage = json_decode(PrayerDataCache::getSingleMetaValue('activeLanguage') ?: '[]', true) ?: [];
        $gregorian_numbers = json_decode(PrayerDataCache::getSingleMetaValue('gregorian_numbers') ?: '[]', true) ?: [];

        if (empty($activeLanguage[0]['language_code']) || empty($gregorian_numbers)) {
            return $time;
        }

        $target_lang = $activeLanguage[0]['language_code'];
        $translations = [];

        foreach ($gregorian_numbers as $num) {
            if (!isset($num['original_text'], $num['translated_text'], $num['language_code'])) {
                continue;
            }
            if ($num['language_code'] !== $target_lang) {
                continue;
            }

            $original = (string) $num['original_text'];
            $translated = (string) $num['translated_text'];

            if (strlen($original) === 1) {
                $translations[strtoupper($original)] = $translated;
                $translations[strtolower($original)] = strtolower($translated);
            } elseif (in_array(strtoupper($original), ['AM', 'PM'], true) && $translated !== '') {
                $translations[strtoupper($original)] = $translated;
                $translations[strtolower($original)] = strtolower($translated);
            }
        }

        return preg_replace_callback('/[0-9]|AM|PM/i', function ($matches) use ($translations) {
            $match = $matches[0];
            $upper = strtoupper($match);
            if (isset($translations[$upper])) {
                return $translations[$upper];
            }
            if (isset($translations[strtolower($upper)])) {
                return $translations[strtolower($upper)];
            }
            return $match;
        }, $time);
    }
}

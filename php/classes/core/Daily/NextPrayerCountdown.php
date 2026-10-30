<?php
namespace FivePrayer\Core\Daily;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

use FivePrayer\Core\Helpers\PrayerDataCache;

if (!class_exists(__NAMESPACE__ . '\\NextPrayerCountdown')) {

    /**
     * Countdown to the next prayer.
     *
     * Produces the human readable "time remaining" until the next prayer and
     * renders it as a live-updating span. The value is simply the time left
     * between now and the next prayer begins time — there is no rounding step,
     * so what you see is the real remaining time (ticking down once a minute,
     * or once a second when "Show seconds" is on).
     *
     * The only customization is presentation: the output format
     * (long / short / clock), whether the connector words are shown ("in"
     * before the time, "remaining" after it, "Now" once the prayer has
     * arrived), and whether seconds are shown. These live in the
     * `next_prayer_countdown` meta and are editable from the Calculation
     * Settings admin page.
     *
     * The connector words are NOT free text: they are fixed phrases
     * ("in" / "remaining" / "Now") resolved through the Translate system
     * (`vertical_daily_prayer`), so the wording and language are edited in one
     * place (More → Translate) and the settings card only switches them on or
     * off.
     *
     * The master on/off switch lives in the `feature_toggles` meta (key
     * `Next_Prayer_Countdown`) so it shares the Feature Switches behaviour of
     * every other feature. This keeps a single source of truth: the feature
     * switch turns the countdown off everywhere. It ships OFF — nothing is
     * rendered until the switch is explicitly turned on.
     *
     * @since 3.0.0
     */
    class NextPrayerCountdown
    {
        /** Meta key holding the countdown customization. */
        public const META_KEY = 'next_prayer_countdown';

        /** Feature Switches key that turns the countdown on/off. */
        public const FEATURE_KEY = 'Next_Prayer_Countdown';

        /** Ensures the countdown stylesheet is printed once per request. */
        private static bool $styles_printed = false;

        /** Ensures the Vertical Daily Prayer notice stylesheet is printed once per request. */
        private static bool $notice_styles_printed = false;

        /** Translation map (lowercased original_text => translated) for the active language. */
        private static array $translation_map = [];
        private static bool $translation_map_loaded = false;

        /** Digit translation map ("0".."9" => translated digit) for the active language. */
        private static array $number_map = [];
        private static bool $number_map_loaded = false;

        /**
         * Default customization values.
         *
         * @return array<string, mixed>
         */
        public static function defaults(): array
        {
            return [
                // long | short | clock
                'format' => 'long',
                // Connector words, switched on/off independently. The words
                // themselves come from the Translate system, so there is no
                // text to type here. All off by default.
                'show_prefix' => false,
                'show_suffix' => false,
                'show_now' => false,
                // Whether the seconds part is shown (updates every second).
                // Off by default: the countdown ticks down once per minute.
                'show_seconds' => false,
            ];
        }

        /**
         * Read and sanitize the stored countdown customization.
         *
         * Older installs stored `unit` (a rounding step) and `rounding`
         * (direction) keys. Those options were removed because the countdown
         * just reports the real remaining time; any such keys are simply
         * ignored so the stored map keeps working without a migration.
         *
         * @return array<string, mixed>
         */
        public static function getConfig(): array
        {
            $raw = PrayerDataCache::getSingleMetaValue(self::META_KEY);
            $stored = [];
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    $stored = $decoded;
                }
            }

            $config = array_merge(self::defaults(), $stored);

            // Drop options that were removed: the rounding step, and the free
            // text Prefix/Suffix/"Now" (which now come from the Translate
            // system and are switched on/off with the booleans below).
            unset($config['unit'], $config['rounding'], $config['prefix'], $config['suffix'], $config['now_text']);

            $config['format'] = in_array($config['format'] ?? '', ['long', 'short', 'clock'], true)
                ? $config['format']
                : 'long';

            $config['show_prefix'] = !empty($config['show_prefix']);
            $config['show_suffix'] = !empty($config['show_suffix']);
            $config['show_now'] = !empty($config['show_now']);
            $config['show_seconds'] = !empty($config['show_seconds']);

            return $config;
        }

        /**
         * Whether the countdown is enabled in the Feature Switches.
         *
         * Defaults to enabled when the toggle has never been stored.
         */
        public static function isEnabled(): bool
        {
            $raw = PrayerDataCache::getSingleMetaValue('feature_toggles');
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded) && array_key_exists(self::FEATURE_KEY, $decoded)) {
                    return !empty($decoded[self::FEATURE_KEY]);
                }
            }

            // Ships OFF: the countdown only appears once the "Enable
            // next-prayer countdown" switch is turned on (Configure Settings
            // → Next Prayer Countdown, or the Feature Switches page). Installs
            // that stored the key are unaffected by this fallback.
            return false;
        }

        /**
         * Remaining seconds until the next prayer.
         *
         * Both the target timestamp (from NextPrayer) and `now` use WordPress'
         * local-time-as-UTC scale, so the subtraction is timezone consistent.
         *
         * @param array<string, mixed> $next_prayer_data NextPrayer data (needs `timestamp`).
         * @param int|null             $now             Override "now" (tests).
         */
        public static function remainingSeconds(array $next_prayer_data, ?int $now = null): int
        {
            $now = $now ?? (int) current_time('timestamp');
            $target = isset($next_prayer_data['timestamp']) ? (int) $next_prayer_data['timestamp'] : 0;

            return max(0, $target - $now);
        }

        /**
         * Format the remaining time with the configured presentation.
         *
         * @param int                  $seconds Remaining seconds.
         * @param array<string, mixed> $config  Customization config.
         */
        public static function format(int $seconds, array $config): string
        {
            $config = array_merge(self::defaults(), $config);

            $seconds = max(0, $seconds);

            // When seconds are hidden the value floors to the whole minute (and
            // never below "1 minute" while time remains), so the countdown
            // ticks down visibly once per minute instead of looking frozen.
            if (empty($config['show_seconds']) && $seconds > 0) {
                $seconds = max(60, (int) (floor($seconds / 60) * 60));
            }

            // A finished countdown ("Now") is not wrapped in the connectors,
            // and it is shown only when the "Now" text is switched on —
            // otherwise the countdown renders nothing once the prayer arrives.
            if ($seconds <= 0) {
                if (empty($config['show_now'])) {
                    return '';
                }

                return '<span class="fiveprayer-cd-now">' . esc_html(self::word('Now')) . '</span>';
            }

            $value = self::formatValue($seconds, (string) $config['format'], !empty($config['show_seconds']));

            // A single space is always placed between the connectors and the
            // time. The words come from the Translate system ("in" /
            // "remaining") and are shown only when their toggle is on.
            $phrases = self::phrases($config);

            $result = ($phrases['prefix'] !== '' ? esc_html($phrases['prefix']) . ' ' : '')
                . $value
                . ($phrases['suffix'] !== '' ? ' ' . esc_html($phrases['suffix']) : '');

            // Translate the digits through the same gregorian_numbers mapping
            // the Current Local Time uses, so the countdown follows the
            // selected language. The markup holds no other digits.
            return self::translateNumbers($result);
        }

        /**
         * The translated connector words, or an empty string when the matching
         * toggle is off.
         *
         * The words are resolved through the same `vertical_daily_prayer`
         * translate collection as the unit words, so they follow the selected
         * language ("in" / "remaining" in English, "بعد" / "المتبقي" in
         * Arabic, and so on).
         *
         * @param array<string, mixed> $config Customization config.
         * @return array{prefix: string, suffix: string}
         */
        private static function phrases(array $config): array
        {
            return [
                'prefix' => !empty($config['show_prefix']) ? self::word('in') : '',
                'suffix' => !empty($config['show_suffix']) ? self::word('remaining') : '',
            ];
        }

        /**
         * The fixed phrases the countdown uses, so they are always offered for
         * translation in the admin (More → Translate → Vertical Daily Prayer)
         * whether or not their toggle is currently on.
         *
         * @return string[]
         */
        public static function translatablePhrases(): array
        {
            return ['in', 'remaining'];
        }

        /**
         * Render the countdown span with the data the frontend needs to tick.
         *
         * @param array<string, mixed>      $next_prayer_data NextPrayer data.
         * @param array<string, mixed>|null $config           Optional config override.
         */
        public static function render(array $next_prayer_data, ?array $config = null): string
        {
            $config = $config ?? self::getConfig();
            $now = (int) current_time('timestamp');
            $target = isset($next_prayer_data['timestamp']) ? (int) $next_prayer_data['timestamp'] : 0;
            $text = self::format(max(0, $target - $now), $config);

            // The rendered data attributes must carry the *translated* text,
            // otherwise the live ticker (which rebuilds the value every second
            // from these attributes) would replace it with the untranslated
            // original.
            $phrases = self::phrases($config);

            $words = [
                'hour' => self::word('hour'),
                'hours' => self::word('hours'),
                'minute' => self::word('minute'),
                'minutes' => self::word('minutes'),
                'second' => self::word('second'),
                'seconds' => self::word('seconds'),
            ];
            $now_text = self::word('Now');

            // The plugin's screen stylesheet is not printed on every request
            // (once output has started, the dynamic styles are skipped), which
            // left the notice completely unstyled and the countdown looking
            // like stray text. Ship a small, self-contained stylesheet with the
            // markup instead, the same way the table hover styles are embedded.
            $style = self::renderStyles();

            return $style . sprintf(
                '<span class="fiveprayer-next-prayer-countdown"'
                . ' data-target="%1$d" data-now="%2$d"'
                . ' data-format="%3$s" data-prefix="%4$s" data-suffix="%5$s"'
                . ' data-now-text="%6$s" data-word-hour="%7$s" data-word-hours="%8$s"'
                . ' data-word-minute="%9$s" data-word-minutes="%10$s"'
                . ' data-word-second="%11$s" data-word-seconds="%12$s"'
                . ' data-unit-hour="%16$s" data-unit-minute="%17$s" data-unit-second="%18$s"'
                . ' data-numbers="%15$s" data-show-seconds="%14$s" data-show-now="%19$s">%13$s</span>',
                $target,
                $now,
                esc_attr($config['format']),
                esc_attr($phrases['prefix']),
                esc_attr($phrases['suffix']),
                esc_attr($now_text),
                esc_attr($words['hour']),
                esc_attr($words['hours']),
                esc_attr($words['minute']),
                esc_attr($words['minutes']),
                esc_attr($words['second']),
                esc_attr($words['seconds']),
                $text, // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside format().
                !empty($config['show_seconds']) ? '1' : '0',
                esc_attr(wp_json_encode(self::numberMap())),
                esc_attr(self::unitSuffix('hours')),
                esc_attr(self::unitSuffix('minutes')),
                esc_attr(self::unitSuffix('seconds')),
                !empty($config['show_now']) ? '1' : '0'
            );
        }

        /**
         * Structural styles for the countdown itself. Printed once per
         * request, and only when the countdown is actually rendered.
         *
         * The countdown is intentionally UNSTYLED — no background, border,
         * padding or colour — so the site owner designs it. The CSS below only
         * keeps the layout from shifting as the value changes (fixed-width
         * figures + a stable, centred, non-wrapping box); the
         * `.fiveprayer-next-prayer-countdown` class is left available so a
         * theme can add colour/background by overriding it.
         *
         * The Vertical Daily Prayer notice layout lives in noticeStyles()
         * instead, so it survives with the feature switched off.
         */
        private static function renderStyles(): string
        {
            if (self::$styles_printed) {
                return '';
            }
            self::$styles_printed = true;

            return "<style class=\"fiveprayer-countdown-styles\">
/* Countdown: no background/border/padding by design.
   To skin it, override .fiveprayer-next-prayer-countdown in your theme
   (or Additional CSS), e.g.
   .fiveprayer-next-prayer-countdown{background:#0a7c46;color:#fff;padding:2px 10px;border-radius:999px;}
   The rules here just stop the numbers from shifting as they change. */
.fiveprayer-next-prayer-countdown{
    display:inline-block;
    text-align:center;
    white-space:nowrap;
    font-variant-numeric:tabular-nums;
    font-feature-settings:'tnum' 1;
}
.fiveprayer-next-prayer-countdown .fiveprayer-cd-unit{
    display:inline-grid;
    justify-items:start;
}
.fiveprayer-next-prayer-countdown .fiveprayer-cd-unit>*{
    grid-area:1/1;
}
.fiveprayer-next-prayer-countdown .fiveprayer-cd-unit-size{
    visibility:hidden;
}
</style>";
        }

        /**
         * Structural styles for the Vertical Daily Prayer notice, the big
         * prayer name/time and the date line under the table.
         *
         * Deliberately NOT part of the countdown stylesheet: the countdown
         * ships switched OFF, and the notice still needs its layout (centred
         * head, the divider that reuses the timetable border, the date line
         * size) in that state. The Vertical Daily Prayer renderer prints this
         * once per request whether or not the countdown is on.
         */
        public static function noticeStyles(): string
        {
            if (self::$notice_styles_printed) {
                return '';
            }
            self::$notice_styles_printed = true;

            return "<style class=\"fiveprayer-notice-styles\">
.fiveprayer-container .next-prayer-notice{
    display:flex;
    flex-direction:column;
    align-items:center;
    gap:7px;
    margin:0 0 8px;
    padding-bottom:8px;
    /* Divider under the next-prayer block. It reuses the timetable's own
       border settings (Customizing → Border: style / size / colour) so the rule
       matches the table instead of being a fixed grey line. Those variables are
       published on the plugin's own containers by StyleManager; each falls back
       on its own when the dynamic stylesheet is not printed on a page. */
    border-bottom-width: var(--fiveprayer-border-size, 1px);
    border-bottom-style: var(--fiveprayer-border-style, solid);
    border-bottom-color: var(--fiveprayer-clr-border, rgba(127,127,127,.25));
    text-align:center;
    line-height:1.2;
}
.fiveprayer-container .prayer-date{
    /* The date + \"Current Local Time\" line sits under the big prayer name, so it
       is sized a little larger to stay readable next to it. */
    font-size:14.5px;
    line-height:1.7;
    opacity:.85;
}
.fiveprayer-container .prayer-date-time{
    display:flex;
    gap:6px;
    align-items:baseline;
    justify-content:center;
}
.fiveprayer-container .next-prayer-head{
    display:flex;
    flex-wrap:wrap;
    align-items:baseline;
    justify-content:center;
    gap:3px 10px;
}
.fiveprayer-container .next-prayer-title{
    font-size:12.5px;
    font-weight:700;
    letter-spacing:.14em;
    text-transform:uppercase;
    opacity:.65;
}
.fiveprayer-container .next-prayer-name,
.fiveprayer-container .next-prayer-time{
    font-size:1.45em;
    font-weight:700;
    line-height:1.15;
}
.fiveprayer-container .next-prayer-time{
    font-variant-numeric:tabular-nums;
}
.fiveprayer-container .next-prayer-countdown{
    display:flex;
    justify-content:center;
}
.fiveprayer-container .next-prayer-countdown:empty{
    display:none;
}
</style>";
        }

        /**
         * Whether the plugin's custom language / translation system is active.
         */
        private static function isCustomLanguageActive(): bool
        {
            $locale = self::decodeMeta('hijralocale');

            return is_array($locale)
                && !empty($locale['isActive'])
                && !empty($locale['customLan']);
        }

        /**
         * The currently selected translation language code (empty when none).
         */
        private static function activeLanguageCode(): string
        {
            $active = self::decodeMeta('activeLanguage');
            if (is_array($active) && !empty($active[0]['language_code'])) {
                return (string) $active[0]['language_code'];
            }

            return '';
        }

        /**
         * Decode a JSON meta value into an array (accepts array values too).
         *
         * @return array<mixed>
         */
        private static function decodeMeta(string $key): array
        {
            $raw = PrayerDataCache::getSingleMetaValue($key);
            if (is_array($raw)) {
                return $raw;
            }
            if (is_string($raw) && $raw !== '') {
                $decoded = json_decode($raw, true);
                if (is_array($decoded)) {
                    return $decoded;
                }
            }

            return [];
        }

        /**
         * Map of translatable label => translated text for the active language.
         *
         * Uses the same `vertical_daily_prayer` translate entries that the
         * Current Local Time / Vertical Daily Prayer labels use, so the
         * countdown follows the site's language automatically.
         *
         * @return array<string, string>
         */
        private static function translationMap(): array
        {
            if (self::$translation_map_loaded) {
                return self::$translation_map;
            }
            self::$translation_map_loaded = true;
            self::$translation_map = [];

            if (!self::isCustomLanguageActive()) {
                return self::$translation_map;
            }

            $language = self::activeLanguageCode();
            if ($language === '') {
                return self::$translation_map;
            }

            foreach (self::decodeMeta('vertical_daily_prayer') as $item) {
                if (
                    !isset($item['original_text'], $item['translated_text'], $item['language_code'])
                    || (string) $item['language_code'] !== $language
                ) {
                    continue;
                }
                self::$translation_map[strtolower((string) $item['original_text'])] = (string) $item['translated_text'];
            }

            return self::$translation_map;
        }

        /**
         * Digit translation map for the active language (gregorian_numbers).
         *
         * @return array<string, string>
         */
        private static function numberMap(): array
        {
            if (self::$number_map_loaded) {
                return self::$number_map;
            }
            self::$number_map_loaded = true;
            self::$number_map = [];

            if (!self::isCustomLanguageActive()) {
                return self::$number_map;
            }

            $language = self::activeLanguageCode();
            if ($language === '') {
                return self::$number_map;
            }

            foreach (self::decodeMeta('gregorian_numbers') as $item) {
                if (!isset($item['original_text'], $item['translated_text'])) {
                    continue;
                }
                if (isset($item['language_code']) && (string) $item['language_code'] !== $language) {
                    continue;
                }
                self::$number_map[(string) $item['original_text']] = (string) $item['translated_text'];
            }

            return self::$number_map;
        }

        /**
         * Resolve a countdown word through the translate system.
         *
         * Falls back to the bundled gettext string when no custom language is
         * active or the entry is missing.
         */
        private static function word(string $key): string
        {
            $map = self::translationMap();
            $lookup = strtolower($key);
            if (isset($map[$lookup])) {
                return $map[$lookup];
            }

            // Literal strings so the gettext extractor can pick them up; a
            // variable passed to __() would never be translatable.
            $strings = array(
                'in'        => __('in', 'fiveprayer'),
                'remaining' => __('remaining', 'fiveprayer'),
                'now'       => __('Now', 'fiveprayer'),
                'hour'      => __('hour', 'fiveprayer'),
                'hours'     => __('hours', 'fiveprayer'),
                'minute'    => __('minute', 'fiveprayer'),
                'minutes'   => __('minutes', 'fiveprayer'),
                'second'    => __('second', 'fiveprayer'),
                'seconds'   => __('seconds', 'fiveprayer'),
            );

            return $strings[$lookup] ?? $key;
        }

        /**
         * Single-character unit suffix for the compact "short" format.
         *
         * Derived from the translated unit word so it is language-aware
         * (e.g. "hours" => "h", "ساعات" => "س") without extra translate entries.
         */
        private static function unitSuffix(string $key): string
        {
            $word = self::word($key);
            if ($word === '') {
                return '';
            }

            return function_exists('mb_substr') ? mb_substr($word, 0, 1, 'UTF-8') : substr($word, 0, 1);
        }

        /**
         * Translate the digits in a string through gregorian_numbers, the same
         * mapping the Current Local Time uses.
         */
        private static function translateNumbers(string $text): string
        {
            $map = self::numberMap();
            if (empty($map)) {
                return $text;
            }

            return strtr($text, $map);
        }

        /**
         * Build the fixed-width value markup for a positive remaining time.
         *
         * Every number is zero-padded to two digits and every unit is always
         * rendered, so the width of the value never changes while it counts
         * down: "10" and "9" occupy the same space, and a unit reaching zero
         * stays on screen (shown as "00") instead of disappearing and pulling
         * the rest of the line sideways.
         *
         * @param int    $seconds      Seconds (>= 0, already floored).
         * @param string $format       long | short | clock.
         * @param bool   $show_seconds Whether the seconds part is shown.
         */
        private static function formatValue(int $seconds, string $format, bool $show_seconds): string
        {
            $hours = intdiv($seconds, 3600);
            $minutes = intdiv($seconds % 3600, 60);
            $secs = $seconds % 60;

            if ($format === 'clock') {
                // Zero-padded and always includes the hours slot, so it is a
                // constant width (HH:MM:SS or HH:MM).
                return $show_seconds
                    ? sprintf('%02d:%02d:%02d', $hours, $minutes, $secs)
                    : sprintf('%02d:%02d', $hours, $minutes);
            }

            if ($format === 'short') {
                $parts = [
                    sprintf('%02d', $hours) . self::unitSuffix('hours'),
                    sprintf('%02d', $minutes) . self::unitSuffix('minutes'),
                ];
                if ($show_seconds) {
                    $parts[] = sprintf('%02d', $secs) . self::unitSuffix('seconds');
                }

                return implode(' ', $parts);
            }

            // long
            $parts = [
                sprintf('%02d', $hours) . ' ' . self::unitWord($hours, 'hours'),
                sprintf('%02d', $minutes) . ' ' . self::unitWord($minutes, 'minutes'),
            ];
            if ($show_seconds) {
                $parts[] = sprintf('%02d', $secs) . ' ' . self::unitWord($secs, 'seconds');
            }

            return implode(' ', $parts);
        }

        /**
         * A single localized unit word, wrapped so its slot keeps the width of
         * the longer (plural) form. Without this, "1 hour" would be narrower
         * than "2 hours" and nudge the rest of the line.
         */
        private static function unitWord(int $value, string $key): string
        {
            $singular = self::word(rtrim($key, 's'));
            $plural = self::word($key);
            $word = $value === 1 ? $singular : $plural;

            // Both forms are real elements stacked in the same grid cell so
            // the selector can position them; a bare text node would be an
            // anonymous item that cannot be placed.
            $html = '<span class="fiveprayer-cd-unit"><span>' . esc_html($word) . '</span>';
            if ($plural !== $word) {
                $html .= '<span class="fiveprayer-cd-unit-size" aria-hidden="true">' . esc_html($plural) . '</span>';
            }
            $html .= '</span>';

            return $html;
        }
    }
}

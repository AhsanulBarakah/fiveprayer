<?php

namespace FivePrayer\Core\ShortCodes\Traits;

use FivePrayer\Core\Daily\NextPrayer;
use FivePrayer\Core\Helpers\PrayerDataCache;

defined('ABSPATH') || exit('Direct script access denied.');

trait VerticalPrayerRendererTrait
{
    /**
     * Emits the customizable row hover effect for the vertical daily prayer
     * table directly with the table markup.
     *
     * The global dynamic stylesheet (DailyStyleDynamic -> wp_head) is not
     * always printed (it is skipped once output has started, and this page
     * relies on StyleManager for its colour variables), so the hover rule is
     * embedded here the same way the calendar templates embed theirs. The
     * declarations target the row and then clear the cells, so the tint shows
     * over the odd/even and sub-header backgrounds across the whole row in both
     * Blend and Replace modes.
     */
    protected function renderVerticalTableHoverStyles(): void
    {
        $styleDynamicDB = new \FivePrayer\Core\Database\FivePrayer_StyleDynamicDB();

        $hoverEnabled = ($styleDynamicDB->StyleDynamic('hover_enabled') ?: '0') !== '0';
        if (!$hoverEnabled) {
            return;
        }

        $parseRgba = static function ($json, array $default): array {
            if (empty($json)) {
                return $default;
            }
            $decoded = is_string($json) ? json_decode($json, true) : $json;
            if (!is_array($decoded) || !isset($decoded['r'], $decoded['g'], $decoded['b'])) {
                return $default;
            }
            return [
                'r' => (int) $decoded['r'],
                'g' => (int) $decoded['g'],
                'b' => (int) $decoded['b'],
                'a' => isset($decoded['a']) ? (float) $decoded['a'] : 1,
            ];
        };

        $rgba = static function (array $c): string {
            return sprintf('rgba(%d,%d,%d,%s)', $c['r'], $c['g'], $c['b'], $c['a']);
        };

        $hoverbg   = $parseRgba($styleDynamicDB->StyleDynamic('hoverbg'), ['r' => 0, 'g' => 0, 'b' => 0, 'a' => 0.08]);
        $hoverclr  = $parseRgba($styleDynamicDB->StyleDynamic('hoverclr'), ['r' => 0, 'g' => 0, 'b' => 0, 'a' => 0]);
        $hoverMode = $styleDynamicDB->StyleDynamic('hover_mode') ?: 'blend';

        $hoverBg  = $rgba($hoverbg);
        $hoverCss = ($hoverMode === 'replace')
            ? "background-color: {$hoverBg} !important;"
            : "background-image: linear-gradient({$hoverBg}, {$hoverBg});";
        // Only set the hover text colour when the user actually picked one
        // (alpha > 0) so a light Replace hover background stays readable.
        if (((float) ($hoverclr['a'] ?? 0)) > 0) {
            $hoverCss .= ' color: ' . $rgba($hoverclr) . ' !important;';
        }

        ?>
        <style class="fiveprayer-vertical-hover-styles">
        /* Applied to the row itself so Blend layers the hover colour over the
           row's own colour and Replace genuinely overwrites it. Applying it to
           the cells instead made a semi-transparent Replace colour composite
           over the row colour, so both modes looked identical.

           The sub-header row (Prayer / Begins / Iqamah) is covered by the
           `thead tr:hover` selectors: it is styled through the
           `.fiveprayer__tbmonthsecond` class, which these selectors outrank, so
           it responds in both modes without a rule of its own. */
        html body .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):hover,
        html body .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ thead tr:hover,
        html body .fiveprayer-container .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):hover,
        html body .fiveprayer-container .fiveprayer__DairyPrayer_ thead tr:hover {
            <?php echo esc_attr($hoverCss); ?>
        }

        /* Keep the cells transparent on hover so the row colour we just set
           is what shows (the vertical table paints its odd/even and subheader
           colours on the <tr>, not on the cells).

           `!important` is required: the global dynamic sheet gives the body
           rows' <th> cells `background-color: inherit !important`, so a plain
           declaration lost to it and those cells kept painting the row's own
           opaque colour over the hover tint — which is why Blend tinted only
           the Begins/Iqamah columns and left the Prayer column behind (and why
           the sub-header row, whose cells carry the sub-header colour, never
           tinted at all). An important declaration beats that important
           inherit, exactly like the admin preview already did.

           `color: inherit` is for the Hover Text colour: that same sheet also
           gives the cells their own text colour (`td` gets the odd/even colour,
           the sub-header cells the sub-header colour), and a cell with a colour
           of its own never inherits the one the row rule above just set. So the
           hover background changed while the text stayed the row's colour, on
           every column but the Prayer one — which carries `inherit` already.
           Handing the cells back to the row makes the whole hovered row use the
           Hover Text colour, and is a no-op when that colour is left unset
           (the row then keeps its own colour and the cells inherit that). */
        html body .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):hover th,
        html body .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):hover td,
        html body .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ thead tr:hover th,
        html body .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ thead tr:hover td,
        html body .fiveprayer-container .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):hover th,
        html body .fiveprayer-container .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):hover td,
        html body .fiveprayer-container .fiveprayer__DairyPrayer_ thead tr:hover th,
        html body .fiveprayer-container .fiveprayer__DairyPrayer_ thead tr:hover td {
            background-color: transparent !important;
            color: inherit !important;
        }
        </style>
        <?php
    }

    /**
     * Emits the corner rounding of the vertical daily prayer table together
     * with the table markup.
     *
     * Same reason as renderVerticalTableHoverStyles(): the global dynamic
     * stylesheet is not always printed, so the radius has to travel with the
     * table. The value is the same "Border radius" setting the monthly
     * timetable uses (also declared on the plugin's containers by StyleManager),
     * so both designs match whatever the user picks.
     *
     * Rounding needs `overflow: hidden` (the row colours are painted on the
     * <tr>, which cannot itself be rounded), and that clip runs on the padding
     * box, which the table's own border would push inwards — that is what had
     * been slicing the table's left and right lines off. The same clip also cuts
     * the cells' collapsed border where the corners curve, which left the four
     * corner lines unconnected, so the outer line is drawn as an `outline`
     * instead: an outline bends with the radius, so the corners join up, and a
     * transparent border of the same width keeps the clip exactly where the
     * outline is drawn.
     */
    protected function renderVerticalTableRadiusStyles(): void
    {
        $styleDynamicDB = new \FivePrayer\Core\Database\FivePrayer_StyleDynamicDB();
        $radius = \FivePrayer\Core\ShortCodes\Managers\StyleManager::getBorderRadius(
            $styleDynamicDB->StyleDynamic('borderradius')
        );

        // 0 is the square-corner default: print nothing at all, so an install
        // that never touches the setting keeps the markup and look it had.
        if ($radius <= 0) {
            return;
        }

        ?>
        <style class="fiveprayer-vertical-radius-styles">
        /* var(--fiveprayer-clr-radius) keeps this in step with the rest of the timetable;
           the literal value is the fallback if that variable is ever absent. */
        html body table.fiveprayer__DairyPrayer_ {
            border-radius: var(--fiveprayer-clr-radius, <?php echo esc_attr($radius); ?>px) !important;
            overflow: hidden !important;
            /* The invisible border of the same width keeps the clip (and so the
               cells' outer edge) exactly where the outline is drawn, so the
               two do not overlap into a heavier line. */
            border: var(--fiveprayer-border-size, 1px) solid transparent !important;
            /* Same size, style and colour as the cells' borders, but drawn by
               the table itself, which is what lets it follow the radius. Each
               var carries its own fallback: a page builder is free to use these
               generic names on its own containers, and an inherited *invalid*
               value would otherwise drop this whole declaration (and with it the
               line around the table). */
            outline: var(--fiveprayer-border-size, 1px) var(--fiveprayer-border-style, solid) var(--fiveprayer-clr-border, rgba(0, 0, 0, 0.1)) !important;
            outline-offset: calc(-1 * var(--fiveprayer-border-size, 1px)) !important;
        }

        /* The rounding lives on the table only: the cells keep square corners.
           The collapsed border of a rounded cell is clipped by the same
           `overflow: hidden` wherever it curves, which is what used to leave the
           four corners unconnected; the table's outline above draws the outer
           ring instead, so no cell needs a radius of its own. */

        /* Rounded corners are a screen nicety, and the clip that draws them
           would cost the printed sheet its table outline, so print stays
           square and unclipped, with the table carrying the border again (the
           transparent one above would otherwise print as a gap). */
        @media print {
            html body table.fiveprayer__DairyPrayer_ {
                border: var(--fiveprayer-border-size, 1px) var(--fiveprayer-border-style, solid) var(--fiveprayer-clr-border, rgba(0, 0, 0, 0.1)) !important;
                border-radius: 0 !important;
                overflow: visible !important;
                outline: none !important;
            }
        }
        </style>
        <?php
    }

    protected function renderNextPrayerNotice(): void
    {
        $timeFormat = str_replace(':s', '', get_option('time_format', 'h:i A'));
        $timeFormat = str_replace('s', '', $timeFormat);
        $timeFormat = trim($timeFormat, ': ');

        // The notice layout (centred head, the divider that reuses the
        // timetable border, the name/time sizes) must be printed even when the
        // countdown feature is switched off — it ships off — so it is emitted
        // from here rather than from the countdown renderer. Printed once.
        echo \FivePrayer\Core\Daily\NextPrayerCountdown::noticeStyles(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static markup.

        if ($this->next_prayer_data): ?>
            <div class="next-prayer-notice">
                <div class="next-prayer-head">
                    <?php if ($this->highlight !== 'sunrise'): ?>
                        <span class="next-prayer-title"><?php echo esc_html($this->getTranslatedNameVDP('Next Prayer')); ?></span>
                    <?php endif; ?>
                    <span class="next-prayer-name"><?php echo esc_html($this->next_prayer_data['name']); ?></span>
                    <span class="next-prayer-time"><?php echo esc_html(!empty($this->locale['customLan']) ? $this->next_prayer_data['time'] : date_i18n($timeFormat, strtotime($this->next_prayer_data['time']))); ?></span>
                </div>
                <?php if (\FivePrayer\Core\Daily\NextPrayerCountdown::isEnabled() && !empty($this->next_prayer_data['timestamp'])): ?>
                    <div class="next-prayer-countdown">
                        <?php echo \FivePrayer\Core\Daily\NextPrayerCountdown::render($this->next_prayer_data); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- escaped inside the renderer. ?>
                    </div>
                <?php endif; ?>
            </div>
        <?php endif;
    }

    protected function renderHeader($prayer): void
    {
        $this->enqueueHeaderScripts();

        $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
        $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage", [['language_code' => 'en']]);
        $customLan = $getMetaFromDB->get_meta_key("hijralocale", []);

        $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;
        if (!$hijraIsActive) {
            $activeLanguage = [['language_code' => 'en']];
        }

        $numbers = $getMetaFromDB->get_meta_key("gregorian_numbers", []);
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

        $timeFormat = get_option('time_format', 'h:i A');
        $timeData = [
            'numbers' => $translations,
            'ampm' => ['AM' => $translations['AM'] ?? 'AM', 'PM' => $translations['PM'] ?? 'PM'],
            'initialTime' => date_i18n($timeFormat),
            'timeFormat' => $timeFormat,
            'timeSelector' => '.fiveprayer-live-time',
            'activeLanguage' => $activeLanguage[0]['language_code'] ?? 'en',
            'customLan' => $customLan['customLan'] ?? false,
        ];

        wp_localize_script('fiveprayer-live-time', 'fiveprayerTimeData', $timeData);

        $currentTime = date_i18n($timeFormat);
        if (!empty($this->locale['customLan']) && $this->locale['customLan'] == true) {
            $currentTime = $this->translateTimeString($currentTime);
        }

        // Same notice stylesheet as the next-prayer block; printing it here
        // keeps the date line styled even on a page with no next-prayer data.
        echo \FivePrayer\Core\Daily\NextPrayerCountdown::noticeStyles(); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- static markup.

        // Layout options for the Vertical Today design (Customizing → Layout).
        // Default to showing every line so an install that never saved the meta
        // keeps its previous behaviour. The Hijri date is only rendered while
        // the Hijra Calendar is active — otherwise Hijra::hijra() falls back to
        // the Gregorian date and would duplicate the line above.
        $layout = $getMetaFromDB->get_meta_key("vertical_today_layout", []);
        $showTime = $this->layoutFlag($layout, 'showTime', true);
        $showDate = $this->layoutFlag($layout, 'showDate', true);
        $showHijriDate = $this->layoutFlag($layout, 'showHijriDate', true);
        $effectiveShowHijriDate = $showHijriDate && $hijraIsActive;

        // The optional Day parts are NOT rendered as their own line here: they
        // are folded into the Gregorian date line below (which is the
        // [Fp_Single_CurrentDate] shortcode), so the date reads e.g.
        // "Wed 14th October 2026" instead of duplicating the day.

        ?>
        <div class="prayer-date">
            <?php // The whole "Current Local Time" row (label + live clock) is
                  // toggled as one unit; the flex gap on .prayer-date-time would
                  // otherwise leave an empty row behind. ?>
            <?php if ($showTime): ?>
                <div class="prayer-date-time">
                    <?php echo esc_html($this->getTranslatedNameVDP('Current Local Time')); ?>
                    <?php echo do_shortcode('[Fp_Single_CurrentTime]'); ?>
                </div>
            <?php endif; ?>
            <?php if ($showDate): ?>
                <?php echo do_shortcode('[Fp_Single_CurrentDate]'); ?>
            <?php endif; ?>
            <?php if ($effectiveShowHijriDate): ?>
                <div class="prayer-date-hijri"><?php echo do_shortcode('[Fp_Single_Hijra_Date]'); ?></div>
            <?php endif; ?>
        </div>
        <?php
    }

    private function enqueueHeaderScripts(): void
    {
        $live_time_path = $this->path_service->getFileFullPath('php/classes/core/ShortCodes/JS/live-time.js');
        $live_time_url = $this->path_service->getFileUrl('php/classes/core/ShortCodes/JS/live-time.js');

        if (function_exists('fiveprayer_enqueue_combined_scripts')) {
            fiveprayer_enqueue_combined_scripts();
        } elseif (file_exists($live_time_path)) {
            wp_enqueue_script('fiveprayer-live-time', $live_time_url, [], filemtime($live_time_path), true);
        }
    }

    /**
     * Read a boolean flag from a decoded layout options array.
     *
     * Accepts real booleans plus the `'1'` / `'0'` / `'true'` strings the
     * settings table can carry, so a legacy or hand-edited value is handled the
     * same way as the React store does.
     */
    private function layoutFlag($layout, string $key, bool $default): bool
    {
        if (!is_array($layout) || !array_key_exists($key, $layout)) {
            return $default;
        }

        $value = $layout[$key];
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value)) {
            return $value === 1;
        }

        return in_array(strtolower((string) $value), ['1', 'true', 'yes', 'on'], true);
    }

    private function translateTimeString($time): string
    {
        $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
        $customLan = $getMetaFromDB->get_meta_key("hijralocale");
        if (!isset($customLan['customLan']) || $customLan['customLan'] !== true) {
            return $time;
        }

        $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage");
        $gregorian_numbers = $getMetaFromDB->get_meta_key("gregorian_numbers");

        if (empty($activeLanguage[0]['language_code']) || empty($gregorian_numbers)) {
            return $time;
        }

        $targetLang = $activeLanguage[0]['language_code'];
        $translations = [];

        foreach ($gregorian_numbers as &$num) {
            if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                $num['language_code'] === $targetLang) {
                $original = $num['original_text'];
                $translated = $num['translated_text'];
                if (strlen($original) === 1 && strlen($translated) >= 1) {
                    $translations[strtoupper($original)] = $translated;
                    $translations[strtolower($original)] = strtolower($translated);
                } elseif (in_array(strtoupper($original), ['AM', 'PM']) && !empty($translated)) {
                    $translations[strtoupper($original)] = $translated;
                    $translations[strtolower($original)] = strtolower($translated);
                }
            }
        }

        return preg_replace_callback('/[0-9]|AM|PM/i', function($matches) use ($translations) {
            $match = $matches[0];
            $upperMatch = strtoupper($match);
            if (isset($translations[$upperMatch])) return $translations[$upperMatch];
            if (isset($translations[strtolower($upperMatch)])) return $translations[strtolower($upperMatch)];
            return $match;
        }, $time);
    }

    protected function renderPrayerRow($slug, $name, $begins, $iqamah, $full_width = false): void
    {
        $is_highlighted = $this->highlight === $slug;
        $show_iqamah = !$this->skip_iqamah_midnight && $iqamah !== null;

        $timeFormat = str_replace(':s', '', get_option('time_format', 'h:i A'));
        $timeFormat = str_replace('s', '', $timeFormat);
        $timeFormat = trim($timeFormat, ': ');
        ?>
        <tr class="<?php echo esc_attr($is_highlighted ? 'fiveprayer__today_row' : ''); ?>">
            <th><?php echo esc_html($name); ?></th>
            <?php if ($full_width || !$show_iqamah): ?>
                <td colspan="<?php echo $show_iqamah ? '1' : '2'; ?>"><?php echo esc_html(!empty($this->locale['customLan']) ? $begins : date_i18n($timeFormat, strtotime($begins))); ?></td>
            <?php else: ?>
                <td><?php echo esc_html(!empty($this->locale['customLan']) ? $begins : date_i18n($timeFormat, strtotime($begins))); ?></td>
                <td><?php echo $iqamah ? esc_html(!empty($this->locale['customLan']) ? $iqamah : date_i18n($timeFormat, strtotime($iqamah))) : '&nbsp;'; ?></td>
            <?php endif; ?>
        </tr>
        <?php
    }
}

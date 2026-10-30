<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Template file: included inside a function, so these are local variables, not globals.
/**
 * Hijri Layout Calendar Template
 * Same styling as CalendarTemplateDefault but with separate Date / Hijri columns.
 * Matches the React ColumnLayoutCalendar (layoutType === 'hijri') exactly.
 *
 * Available variables from CalendarGenerator:
 * - $timeTableMonthly, $hijra, $printerInfo, $url_image_printer
 * - $month, $layout_options, $skip_iqamah_midnight
 * - $activeLanguage, $prayer_names, $timetable_prayer, $locale
 * - $ramadan_props, $gregorian_months, $gregorian_numbers
 */

if (!defined('ABSPATH')) exit;

// ── Layout flags (all default to true) ──
$show_date     = $layout_options['showDate'] ?? true;
$show_hijri    = $layout_options['showHijriDate'] ?? true;
$show_sunrise  = $layout_options['showSunrise'] ?? true;
$show_begins   = $layout_options['showBegins'] ?? true;
$show_iqamah   = $layout_options['showIqamah'] ?? true;
$show_midnight = $layout_options['showMidnight'] ?? true;
// Optional second 'Asr (2 Mithl / Hanafi) column — off unless enabled in
// Timetable Layout AND the imported timetable actually prints a second time.
$show_asr2     = $layout_options['showAsr2'] ?? false;
// Optional "Day" column — driven by the global day_display config (Configure
// Settings → Day Display) and gated by the Day_Display master switch in Feature
// Switches. The enabled parts combine and follow the configured order.
$day_config      = \FivePrayer\Core\Helpers\DayNameFormatter::resolve($day_display ?? [], $feature_toggles ?? []);
$show_full_day   = $day_config['showFull'];
$show_short_day  = $day_config['showShort'];
$show_day_number = $day_config['showNumber'];
$day_order       = $day_config['order'];
$show_day        = $show_full_day || $show_short_day || $show_day_number;

// Backward compatibility: the legacy skip_iqamah_midnight flag only applies
// when the new timetable_layout meta does not explicitly define the Iqamah /
// Midnight columns. Otherwise the layout options are the source of truth — a
// stale skip_iqamah_midnight value (e.g. saved by an older UI) must not hide
// columns the user has enabled in the Timetable Layout page.
$layoutDefinesColumns = !empty($layout_options)
    && (isset($layout_options['showIqamah']) || isset($layout_options['showMidnight']));
if (!$layoutDefinesColumns && ($skip_iqamah_midnight ?? false)) {
    $show_iqamah   = false;
    $show_midnight = false;
}

$effectiveSkipBegins   = !$show_begins;
$effectiveSkipIqamah   = !$show_iqamah;
$effectiveSkipMidnight = !$show_midnight;

// Only render the Hijri date when the Hijri calendar is actually active — when
// inactive, Hijra::hijra() falls back to the Gregorian date and would duplicate
// the date column (matches the React ColumnLayoutCalendar fix).
$hijriIsActive      = ($locale['isActive'] ?? false) === true;
$effectiveShowHijri = $show_hijri && $hijriIsActive;

// ── Month selection (needed before translation helpers for $isRamadan) ──
// The month actually being rendered, resolved and validated once by
// CalendarGenerator::dynamic_generate_calendar() — from the AJAX month
// switch's `month` argument, the no-JS form's `newMonth` POST value, or
// today's month — and available here as the local `$monthNumber` this include
// runs inside. It must not be derived a second time from $_POST: the switch
// sends its month as an argument, so a second derivation found no `newMonth`
// and fell back to the current month, which repainted the same month for every
// choice in the list.
$month = isset($monthNumber) ? (int) $monthNumber : (int) wp_date('n');
$isRamadan = ($month == 13);

// ── Translation helpers (match React exactly) ──
$customLan = ($locale['isActive'] ?? false) && ($locale['customLan'] ?? false);
$lang      = $activeLanguage[0]['language_code'] ?? 'en';

if (!function_exists('fiveprayer_hijri_translate_prayer_name')) {
function fiveprayer_hijri_translate_prayer_name($original, $prayer_names, $lang, $customLan) {
    if (!$customLan) return $original;
    foreach ($prayer_names as $pn) {
        if ($pn['original_text'] === $original && $pn['language_code'] === $lang) {
            return $pn['translated_text'];
        }
    }
    return $original;
}
}

if (!function_exists('fiveprayer_hijri_translate_subheader')) {
function fiveprayer_hijri_translate_subheader($original, $timetable_prayer, $lang, $customLan) {
    if (!$customLan) {
        return preg_replace('/^(Fajr|Dhuhr|Asr|Maghrib|Isha|Midnight)\s/', '', $original);
    }
    foreach ($timetable_prayer as $tp) {
        if ($tp['original_text'] === $original && $tp['language_code'] === $lang) {
            return $tp['translated_text'];
        }
    }
    return preg_replace('/^(Fajr|Dhuhr|Asr|Maghrib|Isha|Midnight)\s/', '', $original);
}
}

$fajrLabel     = fiveprayer_hijri_translate_prayer_name('Fajr', $prayer_names, $lang, $customLan);
$dhuhrLabel    = fiveprayer_hijri_translate_prayer_name('Dhuhr', $prayer_names, $lang, $customLan);
$asrLabel      = fiveprayer_hijri_translate_prayer_name('Asr', $prayer_names, $lang, $customLan);
// The optional second ‘Asr column prints “Hanafi” — it is the 2 Mithl (Hanafi)
// time. It is a prayer name, so it follows the same collection the other group
// headers use (More → Translate → Prayer Names).
$asr2Label     = fiveprayer_hijri_translate_prayer_name('Hanafi', $prayer_names, $lang, $customLan);
$maghribLabel  = fiveprayer_hijri_translate_prayer_name('Maghrib', $prayer_names, $lang, $customLan);
$ishaLabel     = fiveprayer_hijri_translate_prayer_name('Isha', $prayer_names, $lang, $customLan);
$midnightLabel = fiveprayer_hijri_translate_prayer_name('Midnight', $prayer_names, $lang, $customLan);

$subDateLabel      = fiveprayer_hijri_translate_subheader('Date', $timetable_prayer, $lang, $customLan);
$subHijriDateLabel = fiveprayer_hijri_translate_subheader('Hijri Date', $timetable_prayer, $lang, $customLan);
$subFajrBegins     = fiveprayer_hijri_translate_subheader($isRamadan ? 'Suhoor End' : 'Fajr Begins', $timetable_prayer, $lang, $customLan);
$subFajrIqamah     = fiveprayer_hijri_translate_subheader('Fajr Iqamah', $timetable_prayer, $lang, $customLan);
$subSunrise        = fiveprayer_hijri_translate_subheader('Sunrise', $timetable_prayer, $lang, $customLan);
$subDhuhrBegins    = fiveprayer_hijri_translate_subheader($isRamadan ? 'Iftar End' : 'Dhuhr Begins', $timetable_prayer, $lang, $customLan);
$subDhuhrIqamah    = fiveprayer_hijri_translate_subheader('Dhuhr Iqamah', $timetable_prayer, $lang, $customLan);
$subAsrBegins      = fiveprayer_hijri_translate_subheader($isRamadan ? 'Iftar End' : 'Asr Begins', $timetable_prayer, $lang, $customLan);
$subAsrIqamah      = fiveprayer_hijri_translate_subheader('Asr Iqamah', $timetable_prayer, $lang, $customLan);
$subMaghribBegins  = fiveprayer_hijri_translate_subheader($isRamadan ? 'Iftar Start' : 'Maghrib Begins', $timetable_prayer, $lang, $customLan);
$subMaghribIqamah  = fiveprayer_hijri_translate_subheader('Maghrib Iqamah', $timetable_prayer, $lang, $customLan);
$subIshaBegins     = fiveprayer_hijri_translate_subheader('Isha Begins', $timetable_prayer, $lang, $customLan);
$subIshaIqamah     = fiveprayer_hijri_translate_subheader('Isha Iqamah', $timetable_prayer, $lang, $customLan);
$subMidnight       = fiveprayer_hijri_translate_subheader('Midnight', $timetable_prayer, $lang, $customLan);
$subDay            = fiveprayer_hijri_translate_subheader('Day', $timetable_prayer, $lang, $customLan);

// ── Colors ──
if (!function_exists('fiveprayer_hijri_parse_rgba')) {
function fiveprayer_hijri_parse_rgba($json, $default = []) {
    if (empty($json)) return $default;
    $data = is_string($json) ? json_decode($json, true) : (array) $json;
    if (!isset($data['r'])) return $default;
    return $data;
}
}

$styleDynamicDB = new \FivePrayer\Core\Database\FivePrayer_StyleDynamicDB();
$firstbg   = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('firstbg'), ['r'=>0,'g'=>184,'b'=>29,'a'=>1]);
$firstclr  = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('firstclr'), ['r'=>255,'g'=>255,'b'=>255,'a'=>1]);
$secondbg  = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('secondbg'), ['r'=>80,'g'=>228,'b'=>19,'a'=>1]);
$secondclr = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('secondclr'), ['r'=>30,'g'=>0,'b'=>0,'a'=>1]);
$evenbg    = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('evenbg'), ['r'=>255,'g'=>255,'b'=>255,'a'=>1]);
$evenclr   = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('evenclr'), ['r'=>3,'g'=>6,'b'=>20,'a'=>1]);
$oddbg     = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('oddbg'), ['r'=>0,'g'=>138,'b'=>14,'a'=>1]);
$oddclr    = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('oddclr'), ['r'=>255,'g'=>255,'b'=>255,'a'=>1]);
$lightbg   = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('highlightbg'), ['r'=>242,'g'=>255,'b'=>0,'a'=>1]);
$lightclr  = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('highlightclr'), ['r'=>201,'g'=>9,'b'=>9,'a'=>1]);
$borderclr = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('borderclr'), ['r'=>33,'g'=>76,'b'=>10,'a'=>1]);
$hoverbg   = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('hoverbg'), ['r'=>0,'g'=>0,'b'=>0,'a'=>0.08]);
$hoverclr  = fiveprayer_hijri_parse_rgba($styleDynamicDB->StyleDynamic('hoverclr'), ['r'=>0,'g'=>0,'b'=>0,'a'=>0]);
$hovermode = $styleDynamicDB->StyleDynamic('hover_mode') ?: 'blend';
$hoverEnabled = ($styleDynamicDB->StyleDynamic('hover_enabled') ?: '0') !== '0';
$borderstyle = $styleDynamicDB->StyleDynamic('borderstyle') ?: 'solid';
// 0 is a valid border size (it removes the border); only a genuinely missing
// value falls back to the 1px default.
$bordersize  = $styleDynamicDB->StyleDynamic('bordersize');
$bordersize  = ($bordersize === null || $bordersize === '') ? '1' : $bordersize;
// Corner rounding of the table, in whole pixels, from the same "Border radius"
// setting the admin preview uses (Customizing → Timetable → Border). 0 — the
// default — means square corners, and then no radius rule is printed at all.
$borderradius = \FivePrayer\Core\ShortCodes\Managers\StyleManager::getBorderRadius(
    $styleDynamicDB->StyleDynamic('borderradius')
);

if (!function_exists('fiveprayer_hijri_rgba')) {
function fiveprayer_hijri_rgba($c) {
    return "rgba({$c['r']},{$c['g']},{$c['b']},{$c['a']})";
}
}

$groupHeaderBg    = fiveprayer_hijri_rgba($firstbg);
$groupHeaderText  = fiveprayer_hijri_rgba($firstclr);
$subHeaderBg      = fiveprayer_hijri_rgba($secondbg);
$subHeaderText    = fiveprayer_hijri_rgba($secondclr);
$highlightBg      = fiveprayer_hijri_rgba($lightbg);
$highlightText    = fiveprayer_hijri_rgba($lightclr);
$hoverBg          = fiveprayer_hijri_rgba($hoverbg);
$hoverCss         = ($hovermode === 'replace')
    ? "background-color: {$hoverBg} !important;"
    : "background-image: linear-gradient({$hoverBg}, {$hoverBg});";
// Only set the hover text colour when the user actually picked one (alpha > 0),
// so white row text stays readable on a light Replace hover background.
if (((float) ($hoverclr['a'] ?? 0)) > 0) {
    $hoverCss .= ' color: ' . fiveprayer_hijri_rgba($hoverclr) . ' !important;';
}
$borderCss        = "{$borderstyle} {$bordersize}px " . fiveprayer_hijri_rgba($borderclr);

// ── Extract headers from first day (matches React exactly) ──
$firstDay = $timeTableMonthly[0] ?? null;
$gregorianHeader = '';
$hijriHeader = '';
if ($firstDay && !empty($firstDay->currentDate)) {
    $parts = preg_split('/\s+/', trim($firstDay->currentDate));
    $gregorianHeader = count($parts) >= 3 ? end($parts) : '';
}
if ($hijriIsActive && $firstDay && isset($firstDay->date) && isset($hijra) && method_exists($hijra, 'hijra')) {
    $hijriStr = $hijra->hijra($firstDay->date);
    $parts = preg_split('/\s+/', trim($hijriStr));
    $hijriHeader = count($parts) >= 3 ? implode(' ', array_slice($parts, -2)) : (count($parts) >= 2 ? end($parts) : '');
}

$nonce = wp_create_nonce('fiveprayer_month_select_nonce');

// ── Printer settings ──
$hide_printer_button    = \FivePrayer\Core\Helpers\PrinterHelper::shouldHidePrinterButton();
$printer_button_text    = \FivePrayer\Core\Helpers\PrinterHelper::getPrinterButtonText();
$hide_month_selection   = \FivePrayer\Core\Helpers\PrinterHelper::shouldHideMonthSelection();
$custom_printer_url     = \FivePrayer\Core\Helpers\PrinterHelper::getPrinterButtonUrl();
$hide_custom_url_button = \FivePrayer\Core\Helpers\PrinterHelper::shouldHideCustomUrlButton();
$has_custom_url         = !empty($custom_printer_url);
$show_custom_url_button = $has_custom_url && !$hide_custom_url_button;
$show_print_button      = !$hide_printer_button && (!$has_custom_url || $hide_custom_url_button);
$calendar_button_id     = 'fiveprayer-calendar-custom-url-btn';
$printerInfo            = $printerInfo ?? (object)['printer_boolean' => false];
?>

<style>
/* The line around the timetable is drawn with an `outline`, not the table's own
   border. The rounded corners need `overflow: hidden`, and that clip runs on the
   padding box, so it discarded a border sitting on the border box edge — which
   is why the line around this table was invisible. An outline is not clipped by
   it and bends with the radius, so all four sides and all four corners stay
   drawn. The transparent border of the same width keeps the clip exactly where
   the outline is drawn. Mirrors the vertical daily prayer table. */
/* Separate borders, not collapsed ones — same reason and same measurement as
   the default layout: a collapsed-border table cannot be repainted row by row,
   so every hover change repainted the whole month. Each cell draws only its
   right and bottom edge so the lines stay single, and the ring around the table
   is still the outline above. The cell rule is anchored on the table's id
   because the global dynamic sheet paints a full border on every
   `.fiveprayer__printer` cell from code later in the document; only an id
   outranks it. */
/* The month table follows the width of the column it was placed in — same
   rules and same reasoning as the default layout: the wrapper is a query
   container, so `cqi` is a share of the wrapper's width rather than of the
   viewport, and the type, the padding and the header wrapping scale with it so
   thirteen columns stay inside the container. Below 560px the table keeps its
   readable minimum and is scrolled inside the wrapper instead — see the
   narrow-container rule next to the date floor. */
.fiveprayer__printer { container-type: inline-size; overflow-x: auto; }
.fiveprayer-hijri-layout table { border-collapse: separate; border-spacing: 0; width: 100%; max-width: 100%; border: <?php echo esc_attr($bordersize); ?>px solid transparent; outline: <?php echo esc_attr($borderCss); ?>; outline-offset: -<?php echo esc_attr($bordersize); ?>px; }
.fiveprayer-hijri-layout thead tr th, .fiveprayer-hijri-layout thead tr td { padding-block: 6px; padding-block: clamp(2px, 0.9cqi, 6px); white-space: normal; }
#fiveprayer-div-to-print { font-size: 1em; font-size: clamp(11px, 1.85cqi, 16px); }
#fiveprayer-div-to-print th, #fiveprayer-div-to-print td { border: 0; border-right: <?php echo esc_attr($borderCss); ?>; border-bottom: <?php echo esc_attr($borderCss); ?>; text-align: center; font-size: inherit; padding: 4px 8px; padding: 4px clamp(1px, 0.45cqi, 8px); }
/* Date floor, same reason as the default layout: the date columns hold a long
   month name, and without a floor auto layout squeezes them into five-line
   cells that make every row tall. Only on a wrapper wide enough to afford it. */
@container (min-width: 560px) {
    #fiveprayer-div-to-print .fiveprayer__cell-date { min-width: 11em; }
}
/* Too narrow to fit thirteen columns legibly: natural width plus a scroll inside
   the wrapper, so the month table is not squeezed into tall wrapped rows. */
@container (max-width: 559.98px) {
    #fiveprayer-div-to-print { width: max-content; max-width: none; min-width: 100%; }
}
/* Row colours anchored on the table's id and limited to tbody, for the same
   reason as the default layout: a theme's own table striping outranks a
   layout-class rule and repainted the odd rows white. */
#fiveprayer-div-to-print tbody tr:nth-child(odd) { background-color: <?php echo esc_attr(fiveprayer_hijri_rgba($oddbg)); ?>; color: <?php echo esc_attr(fiveprayer_hijri_rgba($oddclr)); ?>; }
#fiveprayer-div-to-print tbody tr:nth-child(even) { background-color: <?php echo esc_attr(fiveprayer_hijri_rgba($evenbg)); ?>; color: <?php echo esc_attr(fiveprayer_hijri_rgba($evenclr)); ?>; }
#fiveprayer-div-to-print tbody tr.fiveprayer__today_row { background-color: <?php echo esc_attr($highlightBg); ?> !important; color: <?php echo esc_attr($highlightText); ?> !important; }
<?php if ($hoverEnabled) : ?>.fiveprayer-hijri-layout tr:not(.fiveprayer__today_row):hover { <?php echo esc_attr($hoverCss); ?> }
/* The hover colour needs a clear view of the row: the global dynamic sheet also
   paints the body rows' odd/even colour on the cells themselves, and a cell's
   own background is drawn on top of the row's, so the tint stayed hidden under
   it. Emptying the cells on hover leaves the row colour (Blend) or the
   replaced colour (Replace) showing, which is what the customization preview
   shows. `!important` is required because that sheet declares the cell colour
   with the same weight and no hover state to outrank it here.

   `color: inherit` does the same job for the Hover Text colour: the sheet also
   gives the cells their own text colour, and a cell with a colour of its own
   never inherits the hover colour set on the row, so the background changed and
   the text did not. With the cells inheriting again the whole row uses the
   Hover Text colour — and when that colour is left unset the row keeps its own
   colour, so nothing changes. */
.fiveprayer-hijri-layout tr:not(.fiveprayer__today_row):hover th,
.fiveprayer-hijri-layout tr:not(.fiveprayer__today_row):hover td { background-color: transparent !important; color: inherit !important; }
<?php endif; ?><?php if ($borderradius > 0) : ?>
/* Rounded corners, from Customizing → Timetable → Border → Border radius. The
   rounding stays on the table and is never put on the corner cells, so the
   outline above remains one continuous ring; `overflow: hidden` is what makes
   the row colours respect the radius.

   The wrapper and the table's own class are part of the selector on purpose: a
   theme's generic table rule (`table:not(.variations):not(.shop_table)`, two
   classes and an element) outranks a two-part `.fiveprayer-hijri-layout table`
   and reset the radius to 0, so the setting looked ignored. Naming our own
   container and the table class reaches three classes and wins. */
.fiveprayer__printer.fiveprayer-hijri-layout table.fiveprayer__TablePrayer_ { border-radius: <?php echo esc_attr($borderradius); ?>px; overflow: hidden; }
<?php endif; ?>
@media print {
    /* Paper keeps its table outline: print stays square and unclipped, with the
       table carrying the visible border again (the transparent one above would
       otherwise print as a gap). */
    .fiveprayer-hijri-layout table { border: <?php echo esc_attr($borderCss); ?> !important; border-radius: 0 !important; overflow: visible !important; outline: none !important; }
}
</style>

<div class="fiveprayer__printer fiveprayer-hijri-layout" id="fiveprayer-div-to">
    <?php if ($printerInfo && ($printerInfo->printer_boolean ?? false)) : ?>
        <div class="printer-page-container" id="printerdisplay">
            <div class="left-printer">
                <?php for ($i = 1; $i <= 7; $i++) :
                    $pl = 'printer_left' . $i;
                    if (!empty($printerInfo->{$pl})) : ?>
                        <p id="<?php echo esc_attr($pl); ?>" class="printer_line"><?php echo esc_html($printerInfo->{$pl}); ?></p>
                    <?php endif;
                endfor; ?>
                <p id="space" class="space"></p>
            </div>
            <div class="med-printer">
                <img id="printer_logo" src="<?php echo esc_url($url_image_printer); ?>" alt="logo" />
            </div>
            <div class="right-printer">
                <?php for ($i = 1; $i <= 7; $i++) :
                    $pr = 'printer_right' . $i;
                    if (!empty($printerInfo->{$pr})) : ?>
                        <p id="<?php echo esc_attr($pr); ?>" class="printer_line"><?php echo esc_html($printerInfo->{$pr}); ?></p>
                    <?php endif;
                endfor; ?>
                <p class="space"></p>
            </div>
        </div>
    <?php endif; ?>

    <div class="fiveprayer__printer_option">
        <form id="fiveprayer-no-print" method="post">
            <input type="hidden" name="fiveprayer_nonce" value="<?php echo esc_attr($nonce); ?>">
            <div class="fiveprayer_top">
                <?php if (!$hide_month_selection) : ?>
                <select class="fiveprayer__select" name="newMonth">
                    <option value="" disabled><?php echo esc_html__('--Select Months--', 'fiveprayer'); ?></option>
                    <?php for ($i = 1; $i <= 12; $i++) : ?>
                        <option value="<?php echo esc_attr($i); ?>" <?php selected($month, $i); ?>>
                            <?php echo esc_html(date_i18n('F', mktime(0, 0, 0, $i, 10))); ?>
                        </option>
                    <?php endfor; ?>
                    <?php if ($ramadan_props && $ramadan_props->ramadan) : ?>
                        <option value="13" <?php selected($month, 13); ?>><?php echo esc_html__('Ramadan', 'fiveprayer'); ?></option>
                    <?php endif; ?>
                </select>
                <?php endif; ?>
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <?php if ($show_custom_url_button) : ?>
                        <button id="<?php echo esc_attr($calendar_button_id); ?>" type="button" class="wp-element-button wp-block-button__link fiveprayer-custom-url-btn" data-base-url="<?php echo esc_url($custom_printer_url); ?>">
                            <?php echo esc_html($printer_button_text); ?>
                        </button>
                    <?php endif; ?>
                    <?php if ($show_print_button) : ?>
                        <button type="button" class="wp-element-button wp-block-button__link"
                                onclick="if(typeof FP_printTimetable==='function'){FP_printTimetable();}return false;">
                            <?php echo esc_html($printer_button_text); ?>
                        </button>
                    <?php endif; ?>
                </div>
            </div>
        </form>
    </div>

    <?php if (!$timeTableMonthly) return; ?>

    <table id="fiveprayer-div-to-print" class="fiveprayer__TablePrayer_">
        <thead>
            <!-- Row 1: Group headers — Hijri layout: separate Date / Hijri cells -->
            <tr style="background-color: <?php echo esc_attr($groupHeaderBg); ?>; color: <?php echo esc_attr($groupHeaderText); ?>;">
                <?php if ($show_date || $effectiveShowHijri) : ?>
                    <?php if ($show_date) : ?><th><?php echo esc_html($gregorianHeader); ?></th><?php endif; ?>
                    <?php if ($effectiveShowHijri) : ?><th><?php echo esc_html($hijriHeader); ?></th><?php endif; ?>
                <?php else : ?>
                    <th></th>
                <?php endif; ?>
                <?php if ($show_day) : ?>
                    <th></th>
                <?php endif; ?>

                <?php
                // Group header colspans based on visible columns
                $fajrCols = (!$effectiveSkipBegins ? 1 : 0) + (!$effectiveSkipIqamah ? 1 : 0) + ($show_sunrise ? 1 : 0);
                $prayerCols = (!$effectiveSkipBegins ? 1 : 0) + (!$effectiveSkipIqamah ? 1 : 0);
                // The optional 'Asr 2 column sits inside the Asr group.
                $asrCols = $prayerCols + ($show_asr2 ? 1 : 0);
                ?>
                <?php if ($fajrCols > 0) : ?>
                    <th colspan="<?php echo esc_attr($fajrCols); ?>"><?php echo esc_html($fajrLabel); ?></th>
                <?php endif; ?>
                <?php if ($prayerCols > 0) : ?>
                    <th colspan="<?php echo esc_attr($prayerCols); ?>"><?php echo esc_html($dhuhrLabel); ?></th>
                <?php endif; ?>
                <?php if ($asrCols > 0) : ?>
                    <th colspan="<?php echo esc_attr($asrCols); ?>"><?php echo esc_html($asrLabel); ?></th>
                <?php endif; ?>
                <?php if ($prayerCols > 0) : ?>
                    <th colspan="<?php echo esc_attr($prayerCols); ?>"><?php echo esc_html($maghribLabel); ?></th>
                <?php endif; ?>
                <?php if ($prayerCols > 0) : ?>
                    <th colspan="<?php echo esc_attr($prayerCols); ?>"><?php echo esc_html($ishaLabel); ?></th>
                <?php endif; ?>
                <?php if (!$effectiveSkipMidnight) : ?>
                    <th><?php echo esc_html($midnightLabel); ?></th>
                <?php endif; ?>
            </tr>

            <!-- Row 2: Sub headers — Hijri layout: separate Date / Hijri cells -->
            <tr style="background-color: <?php echo esc_attr($subHeaderBg); ?>; color: <?php echo esc_attr($subHeaderText); ?>;">
                <?php if ($show_date || $effectiveShowHijri) : ?>
                    <?php if ($show_date) : ?><th><?php echo esc_html($subDateLabel); ?></th><?php endif; ?>
                    <?php if ($effectiveShowHijri) : ?><th><?php echo esc_html($subHijriDateLabel); ?></th><?php endif; ?>
                <?php else : ?>
                    <th></th>
                <?php endif; ?>
                <?php if ($show_day) : ?><th><?php echo esc_html($subDay); ?></th><?php endif; ?>

                <?php if (!$effectiveSkipBegins) : ?><th><?php echo esc_html($subFajrBegins); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipIqamah) : ?><th><?php echo esc_html($subFajrIqamah); ?></th><?php endif; ?>
                <?php if ($show_sunrise) : ?><th><?php echo esc_html($subSunrise); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipBegins) : ?><th><?php echo esc_html($subDhuhrBegins); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipIqamah) : ?><th><?php echo esc_html($subDhuhrIqamah); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipBegins) : ?><th><?php echo esc_html($subAsrBegins); ?></th><?php endif; ?>
                <?php if ($show_asr2) : ?><th><?php echo esc_html($asr2Label); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipIqamah) : ?><th><?php echo esc_html($subAsrIqamah); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipBegins) : ?><th><?php echo esc_html($subMaghribBegins); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipIqamah) : ?><th><?php echo esc_html($subMaghribIqamah); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipBegins) : ?><th><?php echo esc_html($subIshaBegins); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipIqamah) : ?><th><?php echo esc_html($subIshaIqamah); ?></th><?php endif; ?>
                <?php if (!$effectiveSkipMidnight) : ?><th><?php echo esc_html($subMidnight); ?></th><?php endif; ?>
            </tr>
        </thead>
        <tbody>
            <?php
            $currentDate = wp_date('Y-m-d');
            $fmt = str_replace(':s', '', get_option('time_format'));
            foreach ($timeTableMonthly as $day) :
                $dayDate = gmdate('Y-m-d', strtotime($day->date ?? ''));
                $isToday = ($dayDate === $currentDate);
                $rowStyle = $isToday ? ' background-color:' . $highlightBg . ';color:' . $highlightText . ';' : '';
            ?>
                <tr<?php if ($isToday) echo ' class="fiveprayer__today_row"'; ?> data-date="<?php echo esc_attr($dayDate); ?>"<?php if ($rowStyle) echo ' style="' . esc_attr($rowStyle) . '"'; ?>>
                    <?php if ($show_date || $effectiveShowHijri) : ?>
                        <?php if ($show_date) : ?><td class="fiveprayer__cell-date"><?php echo esc_html($day->currentDate ?? ''); ?></td><?php endif; ?>
                        <?php if ($effectiveShowHijri) : ?><td class="fiveprayer__cell-date"><?php echo esc_html(isset($hijra) && method_exists($hijra, 'hijra') ? $hijra->hijra($day->date ?? '') : ''); ?></td><?php endif; ?>
                    <?php else : ?>
                        <td class="fiveprayer__cell-date"><?php echo esc_html($day->currentDate ?? ''); ?></td>
                    <?php endif; ?>
                    <?php if ($show_day) : ?>
                    <td><?php echo esc_html(\FivePrayer\Core\Helpers\DayNameFormatter::format($day->date ?? '', $day_names ?? [], $lang, $customLan, $show_full_day, $show_short_day, $show_day_number, $day_order)); ?></td>
                    <?php endif; ?>

                    <?php
                    $fmtTime = function($field) use ($day, $customLan, $fmt) {
                        $val = $day->$field ?? '';
                        if (empty($val)) return '';
                        return $customLan ? $val : @date_i18n($fmt, strtotime($val));
                    };
                    ?>
                    <?php if (!$effectiveSkipBegins) : ?><td><?php echo esc_html($fmtTime('fajr_begins')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipIqamah) : ?><td><?php echo esc_html($fmtTime('fajr_iqamah')); ?></td><?php endif; ?>
                    <?php if ($show_sunrise) : ?><td><?php echo esc_html($fmtTime('sunrise')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipBegins) : ?><td><?php echo esc_html($fmtTime('dhuhr_begins')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipIqamah) : ?><td><?php echo esc_html($fmtTime('dhuhr_iqamah')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipBegins) : ?><td><?php echo esc_html($fmtTime('asr_begins')); ?></td><?php endif; ?>
                    <?php if ($show_asr2) : ?><td><?php echo esc_html($fmtTime('asr_second_begins')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipIqamah) : ?><td><?php echo esc_html($fmtTime('asr_iqamah')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipBegins) : ?><td><?php echo esc_html($fmtTime('maghrib_begins')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipIqamah) : ?><td><?php echo esc_html($fmtTime('maghrib_iqamah')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipBegins) : ?><td><?php echo esc_html($fmtTime('isha_begins')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipIqamah) : ?><td><?php echo esc_html($fmtTime('isha_iqamah')); ?></td><?php endif; ?>
                    <?php if (!$effectiveSkipMidnight) : ?><td><?php echo esc_html($fmtTime('midnight')); ?></td><?php endif; ?>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
</div>

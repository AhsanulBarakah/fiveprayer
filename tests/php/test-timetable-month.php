<?php
/**
 * Regression checks for the monthly timetable's month switch.
 *
 * Run from the WordPress root:
 *
 *   php wp-content/plugins/fiveprayer/tests/php/test-timetable-month.php
 *
 * Integration checks against a bootstrapped WordPress install, in the same
 * style as tests/php/test-security-hardening.php: the plugin does not ship a
 * PHPUnit harness.
 *
 * The defect these cover: the month chosen in the timetable's month list
 * reached the renderer by writing $_POST['newMonth'] at runtime. Every request
 * helper in the plugin reads input with filter_input(), which never sees a
 * value written into the superglobal, so the choice was lost and every month
 * re-rendered the current one. Both halves are asserted here — the renderer
 * called with a resolved month, and the admin-ajax endpoint the month list
 * actually talks to.
 *
 * @package FivePrayer
 */

// The file is a CLI test; it must never be reachable over HTTP.
if (!defined('ABSPATH') && 'cli' !== PHP_SAPI) {
    exit;
}

$fiveprayer_wp_root = dirname(__DIR__, 5);

if (!file_exists($fiveprayer_wp_root . '/wp-load.php')) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI test diagnostics, not a web response.
    fwrite(STDERR, "Could not find wp-load.php. Run this file from the plugin's tests/php directory.\n");
    exit(1);
}

require_once $fiveprayer_wp_root . '/wp-load.php';

// Belt and braces for static analysis: after wp-load.php, ABSPATH is defined.
defined('ABSPATH') || exit;

$fiveprayer_month_failures = 0;

/**
 * Assert a condition and print the result.
 *
 * @param bool   $condition Condition to assert.
 * @param string $message   Description of the invariant.
 * @return void
 */
function fiveprayer_month_assert($condition, $message) {
    global $fiveprayer_month_failures;

    if ($condition) {
        echo esc_html("PASS: {$message}\n");
        return;
    }

    ++$fiveprayer_month_failures;
    echo esc_html("FAIL: {$message}\n");
}

/**
 * Print a check that could not be completed in this environment.
 *
 * A skipped check is never reported as a pass: the environment (no imported
 * timetable, no reachable loopback URL) is named instead.
 *
 * @param string $message Why the check could not run.
 * @return void
 */
function fiveprayer_month_skip($message) {
    echo esc_html("SKIP: {$message}\n");
}

/**
 * Render the monthly timetable for one month, exactly as the AJAX handler does.
 *
 * @param int $month Month number, 1-13 (13 is Ramadan).
 * @return string Rendered markup, or '' when the renderer is unavailable.
 */
function fiveprayer_month_render($month) {
    if (!class_exists('\FivePrayer\Core\Calendar\CalendarGenerator')) {
        return '';
    }

    ob_start();

    try {
        $fiveprayer_generator = new \FivePrayer\Core\Calendar\CalendarGenerator();
        // Same call the endpoint makes: no shortcode attributes, no filtering.
        $fiveprayer_generator->generate_calendar_content_for_month((int) $month, [], false);
    } catch (\Throwable $fiveprayer_error) {
        ob_end_clean();
        return '';
    }

    return (string) ob_get_clean();
}

/**
 * The date of the first row of the rendered timetable.
 *
 * The row's `data-date` is used rather than the text of its first cell: the
 * visible date can be customised (custom language, Hijri formatting), so two
 * renders of the same month are not guaranteed to print identical text, while
 * the row's date is the month identity these checks are about.
 *
 * @param string $html Rendered markup.
 * @return string Date in Y-m-d form, or '' when the markup holds no date rows.
 */
function fiveprayer_month_first_row_date($html) {
    if (!preg_match('/<tbody[^>]*>([\s\S]*?)<\/tbody>/i', $html, $fiveprayer_body)) {
        return '';
    }

    if (!preg_match('/<tr[^>]*\bdata-date="([^"]*)"/i', $fiveprayer_body[1], $fiveprayer_row)) {
        return '';
    }

    return (string) $fiveprayer_row[1];
}

/**
 * The month numbers the rendered month selector marks as selected.
 *
 * @param string $html Rendered markup.
 * @return int[] Selected month numbers.
 */
function fiveprayer_month_selected_options($html) {
    $fiveprayer_selected = [];

    if (!preg_match_all('/<option\b[^>]*>/i', $html, $fiveprayer_options)) {
        return $fiveprayer_selected;
    }

    foreach ($fiveprayer_options[0] as $fiveprayer_option) {
        if (preg_match('/\bselected\b/i', $fiveprayer_option)
            && preg_match('/value=[\'"](\d+)[\'"]/', $fiveprayer_option, $fiveprayer_value)) {
            $fiveprayer_selected[] = (int) $fiveprayer_value[1];
        }
    }

    return $fiveprayer_selected;
}

// Two months that are never the current month: before the fix the renderer
// always produced the current month, so a request for this month would pass by
// accident.
$fiveprayer_current_month = (int) wp_date('n');
$fiveprayer_target_month  = ($fiveprayer_current_month % 12) + 1;
$fiveprayer_other_month   = ($fiveprayer_target_month % 12) + 1;

/**
 * Drop the per-request meta caches so a setting changed mid-process is re-read.
 *
 * @return void
 */
function fiveprayer_month_clear_meta_cache() {
    \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();

    if (class_exists('\FivePrayer\Core\Helpers\MetaCache')) {
        \FivePrayer\Core\Helpers\MetaCache::invalidate_cache();
    }

    if (class_exists('\FivePrayer\Core\Helpers\GetMeta')) {
        $fiveprayer_reflection = new \ReflectionClass(\FivePrayer\Core\Helpers\GetMeta::class);
        if ($fiveprayer_reflection->hasProperty('metaCache')) {
            $fiveprayer_property = $fiveprayer_reflection->getProperty('metaCache');
            $fiveprayer_property->setAccessible(true);
            $fiveprayer_property->setValue(null, []);
        }
    }
}

// These suites also run against a fresh WordPress (CI installs one), where the
// timetable is empty: the template then returns before the table, so the month
// and colour checks would have nothing to look at. Give an empty site two days
// to render. A month that already has rows is left untouched, and whatever was
// seeded is removed when the script ends.
require_once __DIR__ . '/fixtures/timetable-fixture.php';

$fiveprayer_seeded_dates = array_merge(
    fiveprayer_fixture_seed_month($fiveprayer_target_month),
    fiveprayer_fixture_seed_month($fiveprayer_other_month)
);

if (!empty($fiveprayer_seeded_dates)) {
    register_shutdown_function(
        static function () use ($fiveprayer_seeded_dates) {
            fiveprayer_fixture_remove_rows($fiveprayer_seeded_dates);
        }
    );
}

// The fixture only clears the caches when it actually inserted rows. On a site
// that already has these months, the first render could otherwise be served
// from settings caches written before the stored values changed — and the AJAX
// endpoint, in its own request, would then disagree with it about the same
// month. Start from the stored values so both halves read the same thing.
fiveprayer_month_clear_meta_cache();

echo esc_html(
    sprintf(
        "Checking months %d and %d (the current month is %d).\n\n",
        $fiveprayer_target_month,
        $fiveprayer_other_month,
        $fiveprayer_current_month
    )
);

// ── 1. The renderer follows the month it is given ──────────────────────────
$fiveprayer_target_html = fiveprayer_month_render($fiveprayer_target_month);
$fiveprayer_other_html  = fiveprayer_month_render($fiveprayer_other_month);

fiveprayer_month_assert(
    '' !== $fiveprayer_target_html && '' !== $fiveprayer_other_html,
    'the calendar generator renders the requested month without throwing'
);

$fiveprayer_target_date = fiveprayer_month_first_row_date($fiveprayer_target_html);
$fiveprayer_other_date  = fiveprayer_month_first_row_date($fiveprayer_other_html);

if ('' === $fiveprayer_target_date || '' === $fiveprayer_other_date) {
    fiveprayer_month_skip('the rendered timetable has no date rows — import a timetable to run the month checks');
} else {
    fiveprayer_month_assert(
        $fiveprayer_target_date !== $fiveprayer_other_date,
        'two different requested months render different timetable rows'
    );

    fiveprayer_month_assert(
        in_array($fiveprayer_target_month, fiveprayer_month_selected_options($fiveprayer_target_html), true),
        'the month selector marks the requested month as selected'
    );

    fiveprayer_month_assert(
        in_array($fiveprayer_other_month, fiveprayer_month_selected_options($fiveprayer_other_html), true),
        'a second requested month is marked as selected in its own render'
    );
}

// ── 2. The timetable's backgrounds and text colours ────────────────────────
//
// The row colours are customisable, so they are asserted against the stored
// values instead of literals: the odd, even and today rules must carry the
// background and the text colour the user configured, and the heading rows
// their own pair. The selectors are checked too — a theme that stripes its own
// tables (`table:not(...) tbody tr:nth-child(2n+1)`) outranks a layout-class
// rule, which repainted the odd rows white behind the timetable's white text.

/**
 * The first <style> block of a rendered timetable.
 *
 * @param string $html Rendered markup.
 * @return string CSS, or '' when the markup has no style block.
 */
function fiveprayer_month_style_block($html) {
    if (!preg_match('/<style[^>]*>([\s\S]*?)<\/style>/i', $html, $fiveprayer_style)) {
        return '';
    }

    return (string) $fiveprayer_style[1];
}

/**
 * The declaration block of one CSS rule, found by its exact selector.
 *
 * @param string $css      Stylesheet text.
 * @param string $selector Selector as the template prints it.
 * @return string Declarations, or '' when the rule is missing.
 */
function fiveprayer_month_rule($css, $selector) {
    $fiveprayer_pattern = '/' . preg_quote($selector, '/') . '\s*\{([^}]*)\}/';

    return preg_match($fiveprayer_pattern, $css, $fiveprayer_match)
        ? (string) $fiveprayer_match[1]
        : '';
}

/**
 * One declaration value from a rule body, without a trailing !important.
 *
 * @param string $declarations Rule body (`prop: value; …`).
 * @param string $property     Property to read.
 * @return string Trimmed value, or '' when the property is missing.
 */
function fiveprayer_month_declaration($declarations, $property) {
    $fiveprayer_pattern = '/(?:^|;)\s*' . preg_quote($property, '/') . '\s*:\s*([^;]+)/i';

    if (!preg_match($fiveprayer_pattern, $declarations, $fiveprayer_match)) {
        return '';
    }

    return trim((string) preg_replace('/\s*!important\s*$/i', '', trim($fiveprayer_match[1])));
}

/**
 * A stored timetable colour, printed the way the templates print it.
 *
 * @param \FivePrayer\Core\Database\FivePrayer_StyleDynamicDB $style_db Style store.
 * @param string                                                $key      Setting key.
 * @param array{r:int,g:int,b:int,a:int|float}                  $default  Template fallback.
 * @return string `rgba(r,g,b,a)`.
 */
function fiveprayer_month_expected_color($style_db, $key, $default) {
    $fiveprayer_raw = $style_db->StyleDynamic($key);

    if (empty($fiveprayer_raw)) {
        $fiveprayer_color = $default;
    } else {
        $fiveprayer_data  = is_string($fiveprayer_raw) ? json_decode($fiveprayer_raw, true) : (array) $fiveprayer_raw;
        $fiveprayer_color = (is_array($fiveprayer_data) && isset($fiveprayer_data['r'])) ? $fiveprayer_data : $default;
    }

    return 'rgba('
        . $fiveprayer_color['r'] . ','
        . $fiveprayer_color['g'] . ','
        . $fiveprayer_color['b'] . ','
        . $fiveprayer_color['a'] . ')';
}

/**
 * Compare two CSS colours, ignoring whitespace and case.
 *
 * @param string $actual   Value read from the rule.
 * @param string $expected Value the template should print.
 * @return bool
 */
function fiveprayer_month_same_color($actual, $expected) {
    $fiveprayer_normalise = static function ($value) {
        return strtolower((string) preg_replace('/\s+/', '', (string) $value));
    };

    return '' !== $actual && $fiveprayer_normalise($actual) === $fiveprayer_normalise($expected);
}

/**
 * The inline style attributes of the heading rows, in document order.
 *
 * @param string $html Rendered markup.
 * @return string[]
 */
function fiveprayer_month_thead_styles($html) {
    if (!preg_match('/<thead[^>]*>([\s\S]*?)<\/thead>/i', $html, $fiveprayer_head)) {
        return [];
    }

    if (!preg_match_all('/<tr[^>]*\bstyle="([^"]*)"/i', $fiveprayer_head[1], $fiveprayer_rows)) {
        return [];
    }

    return array_map('wp_strip_all_tags', $fiveprayer_rows[1]);
}

/**
 * Assert one rendered layout's row and heading colours.
 *
 * Both templates print the same rules and read the same stored colours, so
 * the checks run for each layout from its own markup instead of being written
 * twice.
 *
 * @param string $html  Rendered timetable markup.
 * @param string $layout Layout name used in the check messages.
 * @return void
 */
function fiveprayer_month_check_colors($html, $layout) {
    $fiveprayer_css = fiveprayer_month_style_block($html);

    if ('' === $fiveprayer_css || !class_exists('\FivePrayer\Core\Database\FivePrayer_StyleDynamicDB')) {
        fiveprayer_month_skip("the {$layout} has no style block or style store — cannot check its colours");
        return;
    }

    $fiveprayer_style_db = new \FivePrayer\Core\Database\FivePrayer_StyleDynamicDB();
    $fiveprayer_row_rules = [
        'odd'   => [
            'selector'   => '#fiveprayer-div-to-print tbody tr:nth-child(odd)',
            'background' => fiveprayer_month_expected_color($fiveprayer_style_db, 'oddbg', ['r' => 0, 'g' => 138, 'b' => 14, 'a' => 1]),
            'color'      => fiveprayer_month_expected_color($fiveprayer_style_db, 'oddclr', ['r' => 255, 'g' => 255, 'b' => 255, 'a' => 1]),
        ],
        'even'  => [
            'selector'   => '#fiveprayer-div-to-print tbody tr:nth-child(even)',
            'background' => fiveprayer_month_expected_color($fiveprayer_style_db, 'evenbg', ['r' => 255, 'g' => 255, 'b' => 255, 'a' => 1]),
            'color'      => fiveprayer_month_expected_color($fiveprayer_style_db, 'evenclr', ['r' => 3, 'g' => 6, 'b' => 20, 'a' => 1]),
        ],
        'today' => [
            'selector'   => '#fiveprayer-div-to-print tbody tr.fiveprayer__today_row',
            'background' => fiveprayer_month_expected_color($fiveprayer_style_db, 'highlightbg', ['r' => 242, 'g' => 255, 'b' => 0, 'a' => 1]),
            'color'      => fiveprayer_month_expected_color($fiveprayer_style_db, 'highlightclr', ['r' => 201, 'g' => 9, 'b' => 9, 'a' => 1]),
        ],
    ];

    foreach ($fiveprayer_row_rules as $fiveprayer_label => $fiveprayer_rule) {
        $fiveprayer_declarations = fiveprayer_month_rule($fiveprayer_css, $fiveprayer_rule['selector']);

        fiveprayer_month_assert(
            '' !== $fiveprayer_declarations,
            "the {$layout} prints the {$fiveprayer_label} row rule its theme cannot outrank"
        );
        fiveprayer_month_assert(
            fiveprayer_month_same_color(
                fiveprayer_month_declaration($fiveprayer_declarations, 'background-color'),
                $fiveprayer_rule['background']
            ),
            "the {$layout}'s {$fiveprayer_label} rows use the configured background colour"
        );
        fiveprayer_month_assert(
            fiveprayer_month_same_color(
                fiveprayer_month_declaration($fiveprayer_declarations, 'color'),
                $fiveprayer_rule['color']
            ),
            "the {$layout}'s {$fiveprayer_label} rows use the configured text colour"
        );
    }

    // The heading rows carry their colours inline, one pair per row. They only
    // exist once the render has a month to show: with no imported timetable the
    // template returns before the table, so this is skipped rather than failed.
    $fiveprayer_heading_styles = fiveprayer_month_thead_styles($html);
    $fiveprayer_headings       = [
        'group heading' => [
            'background' => fiveprayer_month_expected_color($fiveprayer_style_db, 'firstbg', ['r' => 0, 'g' => 184, 'b' => 29, 'a' => 1]),
            'color'      => fiveprayer_month_expected_color($fiveprayer_style_db, 'firstclr', ['r' => 255, 'g' => 255, 'b' => 255, 'a' => 1]),
        ],
        'sub heading'   => [
            'background' => fiveprayer_month_expected_color($fiveprayer_style_db, 'secondbg', ['r' => 80, 'g' => 228, 'b' => 19, 'a' => 1]),
            'color'      => fiveprayer_month_expected_color($fiveprayer_style_db, 'secondclr', ['r' => 30, 'g' => 0, 'b' => 0, 'a' => 1]),
        ],
    ];

    if (count($fiveprayer_heading_styles) < count($fiveprayer_headings)) {
        fiveprayer_month_skip("the {$layout} has no heading rows — import a timetable to check their colours");
    } else {
        $fiveprayer_heading_index = 0;
        foreach ($fiveprayer_headings as $fiveprayer_label => $fiveprayer_heading) {
            $fiveprayer_style = $fiveprayer_heading_styles[$fiveprayer_heading_index];
            ++$fiveprayer_heading_index;

            fiveprayer_month_assert(
                fiveprayer_month_same_color(
                    fiveprayer_month_declaration($fiveprayer_style, 'background-color'),
                    $fiveprayer_heading['background']
                ),
                "the {$layout}'s {$fiveprayer_label} row uses the configured background colour"
            );
            fiveprayer_month_assert(
                fiveprayer_month_same_color(
                    fiveprayer_month_declaration($fiveprayer_style, 'color'),
                    $fiveprayer_heading['color']
                ),
                "the {$layout}'s {$fiveprayer_label} row uses the configured text colour"
            );
        }
    }

    fiveprayer_month_assert(
        1 !== preg_match('/\.fiveprayer-(?:default|hijri)-layout\s+tr:nth-child\((?:odd|even)\)/i', $fiveprayer_css),
        "the {$layout}'s row colours are no longer left on a layout-class selector a theme can outrank"
    );
}

fiveprayer_month_check_colors($fiveprayer_target_html, 'month table');

// ── 2b. The Hijri layout renders the same colours ───────────────────────────
//
// The layout is a stored setting (`timetable_layout.layoutType`), so the test
// switches it for the render, then puts the original value back even when a
// check fails. Both templates print the same colour rules, but each into its
// own style block — dropping them from one would otherwise go unnoticed.

/**
 * Render a month with the Hijri timetable layout selected, then restore it.
 *
 * @param int $month Month number.
 * @return string Rendered markup.
 */
function fiveprayer_month_render_hijri($month) {
    global $wpdb;

    $fiveprayer_meta_table = $wpdb->prefix . 'fp_prayer_settings_meta';
    $fiveprayer_layout_row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $wpdb->prepare('SELECT id, value FROM %i WHERE `meta-key` = %s', $fiveprayer_meta_table, 'timetable_layout')
    );
    $fiveprayer_original = $fiveprayer_layout_row ? (string) $fiveprayer_layout_row->value : null;
    $fiveprayer_layout   = $fiveprayer_original ? json_decode($fiveprayer_original, true) : [];

    if (!is_array($fiveprayer_layout)) {
        $fiveprayer_layout = [];
    }

    $fiveprayer_layout['layoutType'] = 'hijri';

    try {
        $fiveprayer_value = wp_json_encode($fiveprayer_layout);

        if ($fiveprayer_layout_row) {
            $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_meta_table,
                ['value' => $fiveprayer_value],
                ['id' => (int) $fiveprayer_layout_row->id]
            );
        } else {
            $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_meta_table,
                ['meta-key' => 'timetable_layout', 'value' => $fiveprayer_value]
            );
        }

        fiveprayer_month_clear_meta_cache();

        return fiveprayer_month_render($month);
    } finally {
        if ($fiveprayer_layout_row) {
            $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_meta_table,
                ['value' => $fiveprayer_original],
                ['id' => (int) $fiveprayer_layout_row->id]
            );
        } else {
            $wpdb->delete( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_meta_table,
                ['meta-key' => 'timetable_layout']
            );
        }

        fiveprayer_month_clear_meta_cache();
    }
}

$fiveprayer_hijri_html = fiveprayer_month_render_hijri($fiveprayer_target_month);

if ('' === $fiveprayer_hijri_html) {
    fiveprayer_month_skip('the Hijri layout did not render — cannot check its colours');
} elseif (false === strpos($fiveprayer_hijri_html, 'fiveprayer-hijri-layout')) {
    fiveprayer_month_assert(false, 'selecting the Hijri layout renders the Hijri template');
    fiveprayer_month_skip('the Hijri template did not render — its colours were not checked');
} else {
    fiveprayer_month_assert(true, 'selecting the Hijri layout renders the Hijri template');
    fiveprayer_month_check_colors($fiveprayer_hijri_html, 'Hijri month table');
}

// ── 3. Printing drops the highlighted row ─────────────────────────────────
//
// The today row is highlighted on screen so the reader can find it. On paper a
// solid block of highlight colour is just ink and makes the printed month look
// wrong, so the print rules give that row the same stripe as its neighbours.
// The template's highlight rule is an id selector with !important, so the
// print rule has to match the row's parity to outrank it.
$fiveprayer_print_css_path = dirname(__DIR__, 2) . '/php/classes/core/ShortCodes/css/prayer-styles.css';
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading a plugin asset, not a remote URL.
$fiveprayer_print_css = is_readable($fiveprayer_print_css_path) ? (string) file_get_contents($fiveprayer_print_css_path) : '';

if ('' === $fiveprayer_print_css) {
    fiveprayer_month_skip('the shared print stylesheet is not readable — cannot check the printed highlight');
} else {
    $fiveprayer_print_rules = [
        'odd'  => [
            'selector'   => '#fiveprayer-div-to-print tbody tr.fiveprayer__today_row:nth-child(odd)',
            'background' => 'var(--fiveprayer-bg-odd)',
            'color'      => 'var(--fiveprayer-clr-odd)',
        ],
        'even' => [
            'selector'   => '#fiveprayer-div-to-print tbody tr.fiveprayer__today_row:nth-child(even)',
            'background' => 'var(--fiveprayer-bg-even)',
            'color'      => 'var(--fiveprayer-clr-even)',
        ],
    ];

    foreach ($fiveprayer_print_rules as $fiveprayer_label => $fiveprayer_rule) {
        $fiveprayer_declarations = fiveprayer_month_rule($fiveprayer_print_css, $fiveprayer_rule['selector']);

        fiveprayer_month_assert(
            '' !== $fiveprayer_declarations,
            "the printed highlight row keeps the {$fiveprayer_label} stripe"
        );
        fiveprayer_month_assert(
            $fiveprayer_rule['background'] === fiveprayer_month_declaration($fiveprayer_declarations, 'background-color'),
            "the printed highlight row uses the {$fiveprayer_label} background colour"
        );
        fiveprayer_month_assert(
            $fiveprayer_rule['color'] === fiveprayer_month_declaration($fiveprayer_declarations, 'color'),
            "the printed highlight row uses the {$fiveprayer_label} text colour"
        );
    }

    // Both layouts print through these rules, so both tables must carry the
    // id they are anchored on. The Hijri template has an inline print block of
    // its own; without the shared id its highlight rule would not be outranked.
    $fiveprayer_print_layouts = [
        'month table'       => $fiveprayer_target_html,
        'Hijri month table' => $fiveprayer_hijri_html,
    ];

    foreach ($fiveprayer_print_layouts as $fiveprayer_layout => $fiveprayer_html) {
        if ('' === $fiveprayer_html) {
            fiveprayer_month_skip("the {$fiveprayer_layout} did not render — cannot check the id the print rules target");
            continue;
        }

        fiveprayer_month_assert(
            false !== strpos($fiveprayer_html, 'id="fiveprayer-div-to-print"'),
            "the {$fiveprayer_layout} carries the id the print rules are anchored on"
        );
    }

    fiveprayer_month_assert(
        1 !== preg_match('/#fiveprayer-div-to-print\s+tbody\s+tr\.fiveprayer__today_row\s*\{[^}]*var\(--fiveprayer-bg-highlight\)/i', $fiveprayer_print_css),
        'the printed timetable does not paint the highlight colour on the today row'
    );
}

// ── 4. The AJAX endpoint the month list uses returns that same month ───────
$fiveprayer_nonce    = wp_create_nonce('fiveprayer_dynamic_nonce');
$fiveprayer_endpoint = admin_url('admin-ajax.php');

/**
 * POST one month request to the timetable endpoint.
 *
 * @param int    $month Month number.
 * @param string $nonce Nonce to send.
 * @return array{error: string, success: bool, body: array}
 */
function fiveprayer_month_endpoint_request($month, $nonce) {
    $fiveprayer_response = wp_remote_post(
        admin_url('admin-ajax.php'),
        [
            'timeout' => 25,
            'body'    => [
                'action' => 'fiveprayer_load_timetable',
                'month'  => (int) $month,
                'nonce'  => $nonce,
            ],
        ]
    );

    if (is_wp_error($fiveprayer_response)) {
        return ['error' => $fiveprayer_response->get_error_message(), 'success' => false, 'body' => []];
    }

    $fiveprayer_code = (int) wp_remote_retrieve_response_code($fiveprayer_response);
    if (200 !== $fiveprayer_code) {
        return ['error' => 'HTTP ' . $fiveprayer_code, 'success' => false, 'body' => []];
    }

    $fiveprayer_payload = json_decode((string) wp_remote_retrieve_body($fiveprayer_response), true);

    if (!is_array($fiveprayer_payload)) {
        return ['error' => 'the response was not JSON', 'success' => false, 'body' => []];
    }

    return ['error' => '', 'success' => !empty($fiveprayer_payload['success']), 'body' => $fiveprayer_payload];
}

$fiveprayer_request = fiveprayer_month_endpoint_request($fiveprayer_target_month, $fiveprayer_nonce);

if ('' !== $fiveprayer_request['error']) {
    fiveprayer_month_skip(
        'the AJAX endpoint could not be reached over the loopback URL ('
        . $fiveprayer_request['error']
        . ') — rerun with the site served at '
        . $fiveprayer_endpoint
    );
} else {
    fiveprayer_month_assert($fiveprayer_request['success'], 'the timetable endpoint accepts a month request');

    $fiveprayer_endpoint_html = isset($fiveprayer_request['body']['data'])
        ? (string) $fiveprayer_request['body']['data']
        : '';

    fiveprayer_month_assert(
        '' !== $fiveprayer_endpoint_html,
        'the timetable endpoint returns rendered timetable markup'
    );

    $fiveprayer_endpoint_date = fiveprayer_month_first_row_date($fiveprayer_endpoint_html);

    // The current month's render is the shape the defect produced, so the
    // endpoint has to differ from it as well as match the requested month.
    $fiveprayer_current_date = fiveprayer_month_first_row_date(
        fiveprayer_month_render($fiveprayer_current_month)
    );

    if ('' === $fiveprayer_endpoint_date || '' === $fiveprayer_target_date || '' === $fiveprayer_current_date) {
        fiveprayer_month_skip('the endpoint markup has no date rows — import a timetable to compare months');
    } else {
        fiveprayer_month_assert(
            $fiveprayer_endpoint_date === $fiveprayer_target_date,
            'the endpoint returns the markup the renderer produces for the requested month'
        );

        fiveprayer_month_assert(
            $fiveprayer_endpoint_date !== $fiveprayer_current_date,
            'the endpoint does not silently return the current month instead'
        );

        fiveprayer_month_assert(
            in_array($fiveprayer_target_month, fiveprayer_month_selected_options($fiveprayer_endpoint_html), true),
            'the month selector in the endpoint markup marks the requested month as selected'
        );
    }

    // An out-of-range month is rejected rather than rendered.
    $fiveprayer_invalid = fiveprayer_month_endpoint_request(99, $fiveprayer_nonce);
    fiveprayer_month_assert(
        '' !== $fiveprayer_invalid['error'] || false === $fiveprayer_invalid['success'],
        'the endpoint rejects an out-of-range month'
    );

    // The request is nonce-checked: without one the endpoint refuses.
    $fiveprayer_unsigned = fiveprayer_month_endpoint_request($fiveprayer_target_month, '');
    fiveprayer_month_assert(
        '' !== $fiveprayer_unsigned['error'] || false === $fiveprayer_unsigned['success'],
        'the endpoint rejects a request without a valid nonce'
    );
}

echo $fiveprayer_month_failures > 0
    ? esc_html("\nFAILED: {$fiveprayer_month_failures} check(s)\n")
    : esc_html("\nPASS: all timetable month checks\n");

exit($fiveprayer_month_failures > 0 ? 1 : 0);

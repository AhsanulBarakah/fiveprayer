<?php
/**
 * Regression checks for fp_* dynamic text parsing.
 *
 * Run from the WordPress root:
 *
 *   php wp-content/plugins/fiveprayer/tests/php/test-dynamic-text.php
 *
 * The parser used to run its regex over the whole post content, tag
 * attributes, URLs and scripts included: `class="fp_timetable_monthly"` matched
 * and the rendered timetable HTML was inserted into the attribute. These
 * checks pin the parser to text nodes only.
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

$fiveprayer_text_failures = 0;

/**
 * Assert a condition and print the result.
 *
 * @param bool   $condition Condition to assert.
 * @param string $message   Description of the invariant.
 * @return void
 */
function fiveprayer_text_assert($condition, $message) {
    global $fiveprayer_text_failures;

    if ($condition) {
        echo esc_html("PASS: {$message}\n");
        return;
    }

    ++$fiveprayer_text_failures;
    echo esc_html("FAIL: {$message}\n");
}

$fiveprayer_parser = new \FivePrayer\Core\DynamicTextParser();

// Plain text is the one place a pattern should be replaced.
$fiveprayer_plain = $fiveprayer_parser->parse_dynamic_text('The next prayer is fp_fajr_begins today.');
fiveprayer_text_assert(
    false === strpos($fiveprayer_plain, 'fp_fajr_begins'),
    'plain text fp_fajr_begins is replaced'
);

// A class name that happens to look like a shortcode must survive untouched.
$fiveprayer_attribute = '<div class="fp_timetable_monthly">Timetable</div>';
fiveprayer_text_assert(
    $fiveprayer_attribute === $fiveprayer_parser->parse_dynamic_text($fiveprayer_attribute),
    'a class name that looks like a pattern is unchanged'
);

// Query strings in a URL are not text either.
$fiveprayer_url = '<a href="/x?fp_currenttime">Current time</a>';
fiveprayer_text_assert(
    $fiveprayer_url === $fiveprayer_parser->parse_dynamic_text($fiveprayer_url),
    'a URL that contains a pattern is unchanged'
);

// Script contents are skipped, even when they contain the pattern.
$fiveprayer_script = '<script>var pattern = "fp_fajr_begins";</script>';
fiveprayer_text_assert(
    $fiveprayer_script === $fiveprayer_parser->parse_dynamic_text($fiveprayer_script),
    'text inside a script element is unchanged'
);

$fiveprayer_style = '<style>.fp_timetable_monthly { color: red; }</style>';
fiveprayer_text_assert(
    $fiveprayer_style === $fiveprayer_parser->parse_dynamic_text($fiveprayer_style),
    'text inside a style element is unchanged'
);

$fiveprayer_pre = '<pre>fp_fajr_begins</pre>';
fiveprayer_text_assert(
    $fiveprayer_pre === $fiveprayer_parser->parse_dynamic_text($fiveprayer_pre),
    'text inside a pre element is unchanged'
);

$fiveprayer_code = '<code>fp_fajr_begins</code>';
fiveprayer_text_assert(
    $fiveprayer_code === $fiveprayer_parser->parse_dynamic_text($fiveprayer_code),
    'text inside a code element is unchanged'
);

// A text node next to a skipped element is still parsed, and the element that
// closes it does not leave the parser stuck in "skip" mode.
$fiveprayer_mixed = '<div class="fp_timetable_monthly"><script>var a = "fp_fajr_begins";</script>fp_fajr_begins</div>';
$fiveprayer_mixed_result = $fiveprayer_parser->parse_dynamic_text($fiveprayer_mixed);

fiveprayer_text_assert(
    false !== strpos($fiveprayer_mixed_result, 'class="fp_timetable_monthly"'),
    'the attribute survives when a text node beside it is parsed'
);
fiveprayer_text_assert(
    false === strpos($fiveprayer_mixed_result, '>fp_fajr_begins<'),
    'a text node after a closed script is parsed'
);

echo $fiveprayer_text_failures > 0
    ? esc_html("\nFAILED: {$fiveprayer_text_failures} check(s)\n")
    : esc_html("\nPASS: all dynamic text checks\n");

exit($fiveprayer_text_failures > 0 ? 1 : 0);

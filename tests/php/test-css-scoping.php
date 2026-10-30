<?php
/**
 * Regression checks for the plugin's CSS namespace.
 *
 * Run from the WordPress root:
 *
 *   php wp-content/plugins/fiveprayer/tests/php/test-css-scoping.php
 *
 * The plugin renders into pages it shares with a theme, other plugins and page
 * builders, so its styles have to belong to it in both directions: nothing it
 * writes may match outside its own markup, and nothing it writes may depend on
 * a name another stylesheet could also use. These checks pin the two rules that
 * make that hold:
 *
 *   - custom properties are `--fiveprayer-*` and are declared on the plugin's own
 *     containers, never on `:root`;
 *   - every selector in the shared front-end stylesheet is namespaced, and the
 *     page-wide print reset that used to restyle whole pages is gone.
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
    fwrite(STDERR, "Could not find wp-load.php. Run this file from a WordPress install.\n");
    exit(1);
}

require_once $fiveprayer_wp_root . '/wp-load.php';

defined('ABSPATH') || exit;

$fiveprayer_css_failures = 0;

/**
 * Assert a condition and print the result.
 *
 * @param bool   $condition Condition to assert.
 * @param string $message   Description of the invariant.
 * @return void
 */
function fiveprayer_css_assert($condition, $message) {
    global $fiveprayer_css_failures;

    if ($condition) {
        echo esc_html("PASS: {$message}\n");
        return;
    }

    ++$fiveprayer_css_failures;
    echo esc_html("FAIL: {$message}\n");
}

/**
 * Print a check that could not run in this environment.
 *
 * @param string $message Why the check was skipped.
 * @return void
 */
function fiveprayer_css_skip($message) {
    echo esc_html("SKIP: {$message}\n");
}

/**
 * Remove comments so a name mentioned in prose is not read as a declaration.
 *
 * @param string $css Stylesheet text.
 * @return string
 */
function fiveprayer_css_without_comments($css) {
    return (string) preg_replace('~/\\*[\\s\\S]*?\\*/~', '', $css);
}

/**
 * Every custom property the CSS declares.
 *
 * @param string $css Stylesheet text.
 * @return string[]
 */
function fiveprayer_css_declared_properties($css) {
    if (!preg_match_all('/(^|[;{\\s])(--[a-zA-Z0-9-]+)\\s*:/', $css, $fiveprayer_matches)) {
        return [];
    }

    return array_values(array_unique($fiveprayer_matches[2]));
}

/**
 * Every custom property the CSS reads.
 *
 * @param string $css Stylesheet text.
 * @return string[]
 */
function fiveprayer_css_used_properties($css) {
    if (!preg_match_all('/var\\(\\s*(--[a-zA-Z0-9-]+)/', $css, $fiveprayer_matches)) {
        return [];
    }

    return array_values(array_unique($fiveprayer_matches[1]));
}

/**
 * The selectors of the rules in a stylesheet, without at-rule preludes.
 *
 * @param string $css Stylesheet text.
 * @return string[]
 */
function fiveprayer_css_selectors($css) {
    $fiveprayer_selectors = [];
    $fiveprayer_buffer     = '';
    $fiveprayer_stack      = [];
    $fiveprayer_length     = strlen($css);

    for ($fiveprayer_index = 0; $fiveprayer_index < $fiveprayer_length; $fiveprayer_index++) {
        $fiveprayer_char = $css[$fiveprayer_index];

        if ('{' === $fiveprayer_char) {
            $fiveprayer_selector = trim($fiveprayer_buffer);
            $fiveprayer_buffer   = '';
            $fiveprayer_stack[]  = $fiveprayer_selector;

            if ('' !== $fiveprayer_selector && !str_starts_with($fiveprayer_selector, '@')) {
                $fiveprayer_selectors[] = $fiveprayer_selector;
            }
            continue;
        }

        if ('}' === $fiveprayer_char) {
            $fiveprayer_buffer = '';
            array_pop($fiveprayer_stack);
            continue;
        }

        if (';' === $fiveprayer_char && [] === $fiveprayer_stack) {
            $fiveprayer_buffer = '';
            continue;
        }

        $fiveprayer_buffer .= $fiveprayer_char;
    }

    return $fiveprayer_selectors;
}

// ── 1. The dynamic variables live on the plugin's containers ───────────────
if (!class_exists('\FivePrayer\Core\ShortCodes\Managers\StyleManager')) {
    fiveprayer_css_skip('StyleManager is unavailable — cannot check the dynamic variables');
} else {
    $fiveprayer_manager = \FivePrayer\Core\ShortCodes\Managers\StyleManager::getInstance();
    $fiveprayer_dynamic = fiveprayer_css_without_comments($fiveprayer_manager->generateDynamicCSS());

    fiveprayer_css_assert(
        !preg_match('/(^|\\})[^{}]*:root[^{}]*\\{/i', $fiveprayer_dynamic),
        'the dynamic colours are not published on :root'
    );

    fiveprayer_css_assert(
        str_contains($fiveprayer_dynamic, \FivePrayer\Core\ShortCodes\Managers\StyleManager::CONTAINER_SCOPE),
        'the dynamic colours are declared on the plugin’s own containers'
    );

    $fiveprayer_dynamic_used = fiveprayer_css_used_properties($fiveprayer_dynamic);

    fiveprayer_css_assert(
        [] === array_values(array_filter($fiveprayer_dynamic_used, static fn ($name) => !str_starts_with($name, '--fiveprayer-'))),
        'every custom property the dynamic styles read carries the --fiveprayer- prefix'
    );
}

// ── 2. The rendered markup declares no page-wide variables ─────────────────
$fiveprayer_pages = [
    'the vertical table' => '[Fp_Vertical_Daily_Prayer]',
    'the month timetable' => '[Fp_TimeTable_Monthly]',
];

foreach ($fiveprayer_pages as $fiveprayer_label => $fiveprayer_shortcode) {
    $fiveprayer_html   = do_shortcode($fiveprayer_shortcode);
    $fiveprayer_styles = '';

    if (preg_match_all('/<style[^>]*>([\\s\\S]*?)<\\/style>/i', $fiveprayer_html, $fiveprayer_blocks)) {
        $fiveprayer_styles = implode("\n", $fiveprayer_blocks[1]);
    }

    if ('' === trim($fiveprayer_styles)) {
        fiveprayer_css_skip("{$fiveprayer_label} renders no inline style in this environment");
        continue;
    }

    $fiveprayer_styles = fiveprayer_css_without_comments($fiveprayer_styles);

    fiveprayer_css_assert(
        !preg_match('/(^|\\})[^{}]*:root[^{}]*\\{/i', $fiveprayer_styles),
        "{$fiveprayer_label} declares no variables on :root"
    );

    $fiveprayer_declared = fiveprayer_css_declared_properties($fiveprayer_styles);

    fiveprayer_css_assert(
        [] === array_values(array_filter($fiveprayer_declared, static fn ($name) => !str_starts_with($name, '--fiveprayer-'))),
        "{$fiveprayer_label} only declares --fiveprayer- custom properties"
    );

    $fiveprayer_used = fiveprayer_css_used_properties($fiveprayer_styles);

    fiveprayer_css_assert(
        [] === array_values(array_filter($fiveprayer_used, static fn ($name) => !str_starts_with($name, '--fiveprayer-'))),
        "{$fiveprayer_label} only reads --fiveprayer- custom properties"
    );
}

// ── 3. The shared stylesheet is namespaced ─────────────────────────────────
$fiveprayer_css_path = dirname(__DIR__, 2) . '/php/classes/core/ShortCodes/css/prayer-styles.css';
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- Reading a plugin asset, not a remote URL.
$fiveprayer_css = is_readable($fiveprayer_css_path) ? (string) file_get_contents($fiveprayer_css_path) : '';

if ('' === $fiveprayer_css) {
    fiveprayer_css_skip('the shared front-end stylesheet is not readable');
} else {
    $fiveprayer_flat = fiveprayer_css_without_comments($fiveprayer_css);
    $fiveprayer_re   = '/fiveprayer|FP_|#fiveprayer/i';

    $fiveprayer_unscoped = [];
    foreach (fiveprayer_css_selectors($fiveprayer_flat) as $fiveprayer_selector) {
        foreach (explode(',', $fiveprayer_selector) as $fiveprayer_part) {
            if ('' !== trim($fiveprayer_part) && !preg_match($fiveprayer_re, $fiveprayer_part)) {
                $fiveprayer_unscoped[] = trim($fiveprayer_part);
            }
        }
    }

    fiveprayer_css_assert(
        [] === $fiveprayer_unscoped,
        'every selector in the shared stylesheet belongs to the plugin (' . implode(', ', array_slice($fiveprayer_unscoped, 0, 3)) . ')'
    );

    $fiveprayer_used = fiveprayer_css_used_properties($fiveprayer_flat);

    fiveprayer_css_assert(
        [] === array_values(array_filter($fiveprayer_used, static fn ($name) => !str_starts_with($name, '--fiveprayer-'))),
        'every custom property the shared stylesheet reads carries the --fiveprayer- prefix'
    );

    // The old print reset hid the whole document whenever a page containing a
    // shortcode was printed. None of those selectors may come back.
    $fiveprayer_page_wide = ['body *', '.entry-content', '.wp-block-image', '.wp-site-blocks', '.main'];
    $fiveprayer_found     = [];

    foreach ($fiveprayer_page_wide as $fiveprayer_pattern) {
        if (preg_match('/(^|[},])\\s*' . preg_quote($fiveprayer_pattern, '/') . '(\\s|[,{])/i', $fiveprayer_flat)) {
            $fiveprayer_found[] = $fiveprayer_pattern;
        }
    }

    fiveprayer_css_assert(
        [] === $fiveprayer_found,
        'the stylesheet carries no page-wide print reset (' . implode(', ', $fiveprayer_found) . ')'
    );
}

echo $fiveprayer_css_failures > 0
    ? esc_html("\nFAILED: {$fiveprayer_css_failures} check(s)\n")
    : esc_html("\nPASS: all CSS scoping checks\n");

exit($fiveprayer_css_failures > 0 ? 1 : 0);

<?php
/**
 * Smoke test for an *installed package* — the zip users download.
 *
 * Unlike tests/php/test-*.php, this does not run against the source tree: it
 * expects a WordPress install whose wp-content/plugins/fiveprayer was extracted
 * from the release bundle. It checks that the plugin activates, ships the files
 * it needs and renders, and that the bundle does not leak development files.
 *
 *   php tests/php/smoke-installed.php /path/to/wordpress
 *
 * The WordPress root can also come from FIVEPRAYER_WP_ROOT.
 *
 * @package FivePrayer
 */

$fiveprayer_wp_root = $argv[1] ?? getenv('FIVEPRAYER_WP_ROOT');

if (!$fiveprayer_wp_root || !file_exists($fiveprayer_wp_root . '/wp-load.php')) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI diagnostics.
    fwrite(STDERR, "Give the WordPress root as the first argument or FIVEPRAYER_WP_ROOT.\n");
    exit(1);
}

require_once rtrim($fiveprayer_wp_root, '/\\') . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

$fiveprayer_failures = 0;

/**
 * Record one check.
 *
 * @param string $label What is being checked.
 * @param bool   $ok    Whether it passed.
 * @param string $detail Extra context shown either way.
 */
function fiveprayer_check(string $label, bool $ok, string $detail = ''): void
{
    global $fiveprayer_failures;
    if (!$ok) {
        $fiveprayer_failures++;
    }
    printf("%s %s%s\n", $ok ? 'PASS' : 'FAIL', $label, $detail === '' ? '' : " — {$detail}");
}

$fiveprayer_plugin_file = 'fiveprayer/Fiveprayer.php';
$fiveprayer_dir         = WP_PLUGIN_DIR . '/fiveprayer';

fiveprayer_check('the bundle is installed', is_dir($fiveprayer_dir), $fiveprayer_dir);
fiveprayer_check('the plugin activates', is_plugin_active($fiveprayer_plugin_file), $fiveprayer_plugin_file);

// Files the shipped plugin needs at runtime.
foreach (['build-admin/index.js', 'build-admin/index.css', 'vendor/autoload.php', 'changelog.txt'] as $file) {
    fiveprayer_check("ships {$file}", file_exists($fiveprayer_dir . '/' . $file));
}

// Development files must not be inside the download. npm packing always adds
// the manifest, so package.json is called out here too — it is build metadata,
// not something WordPress reads.
foreach (['src', 'blocks', 'tests', 'node_modules', 'docs', 'package.json'] as $unwanted) {
    fiveprayer_check("bundle excludes {$unwanted}", !file_exists($fiveprayer_dir . '/' . $unwanted));
}

// It actually renders: the shortcodes come from the plugin, not the theme.
$fiveprayer_time = do_shortcode('[Fp_Single_CurrentTime]');
fiveprayer_check(
    'renders [Fp_Single_CurrentTime]',
    trim(wp_strip_all_tags($fiveprayer_time)) !== '',
    trim(wp_strip_all_tags($fiveprayer_time))
);

$fiveprayer_date = do_shortcode('[Fp_Single_CurrentDate]');
fiveprayer_check(
    'renders [Fp_Single_CurrentDate]',
    trim(wp_strip_all_tags($fiveprayer_date)) !== '',
    trim(wp_strip_all_tags($fiveprayer_date))
);

// WordPress writes fatals and warnings here when WP_DEBUG_LOG is on.
$fiveprayer_log = WP_CONTENT_DIR . '/debug.log';
$fiveprayer_log_contents = file_exists($fiveprayer_log) ? trim((string) file_get_contents($fiveprayer_log)) : '';
fiveprayer_check('no PHP errors logged', $fiveprayer_log_contents === '', $fiveprayer_log_contents);

if ($fiveprayer_failures > 0) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI diagnostics.
    fwrite(STDERR, "\n{$fiveprayer_failures} check(s) failed.\n");
    exit(1);
}

echo "\nInstalled bundle is healthy.\n";

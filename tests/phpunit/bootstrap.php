<?php
/**
 * PHPUnit bootstrap.
 *
 * The suites in tests/php/ are plain scripts that bootstrap WordPress
 * themselves. PHPUnit needs the same environment for every test, so this loads
 * the installed WordPress once and lets the tests use its hooks, REST server and
 * database directly.
 *
 * FIVEPRAYER_WP_DIR must point at a WordPress root where this plugin is
 * installed as wp-content/plugins/fiveprayer and active — that is what the CI
 * job sets up before running PHPUnit.
 *
 * @package FivePrayer
 */

$fiveprayer_wp_root = getenv('FIVEPRAYER_WP_DIR');

if (!$fiveprayer_wp_root || !file_exists(rtrim($fiveprayer_wp_root, '/\\') . '/wp-load.php')) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI diagnostics.
    fwrite(STDERR, "Set FIVEPRAYER_WP_DIR to a WordPress root with FivePrayer installed.\n");
    exit(1);
}

$fiveprayer_wp_root = rtrim($fiveprayer_wp_root, '/\\');

require_once $fiveprayer_wp_root . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

if (!function_exists('fiveprayer_is_active')) {
    /**
     * The tests are meaningless if the plugin is not the code under test.
     */
    function fiveprayer_is_active(): bool
    {
        return is_plugin_active('fiveprayer/Fiveprayer.php');
    }
}

if (!fiveprayer_is_active()) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI diagnostics.
    fwrite(STDERR, "FivePrayer is installed but not active in {$fiveprayer_wp_root}.\n");
    exit(1);
}

require_once __DIR__ . '/includes/FivePrayerTestCase.php';

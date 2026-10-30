<?php
/**
 * Installs WordPress for the PHP test runner — the wp-cli-free path.
 *
 * `tools/php-suite.sh` copies this file into the WordPress root and runs it with
 * plain PHP. It is a no-op once the site is installed, so it is safe to re-run.
 *
 * @package FivePrayer
 */

define('WP_INSTALLING', true);

$fiveprayer_root = __DIR__;

if (!file_exists($fiveprayer_root . '/wp-load.php') || !file_exists($fiveprayer_root . '/wp-config.php')) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI diagnostics.
    fwrite(STDERR, "Run this file from a WordPress root that has wp-config.php.\n");
    exit(1);
}

require_once $fiveprayer_root . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/upgrade.php';

if (is_blog_installed()) {
    echo "WordPress is already installed.\n";
    exit(0);
}

$fiveprayer_result = wp_install('FivePrayer Tests', 'admin', 'dev@example.test', true, '', 'admin');

if (empty($fiveprayer_result['user_id'])) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI diagnostics.
    fwrite(STDERR, "wp_install() did not create the admin user.\n");
    exit(1);
}

echo 'WordPress installed; admin user #' . (int) $fiveprayer_result['user_id'] . ".\n";

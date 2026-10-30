<?php
/**
 * Activates FivePrayer in a test WordPress — the wp-cli-free replacement for
 * `wp plugin activate fiveprayer`.
 *
 * @package FivePrayer
 */

$fiveprayer_root = __DIR__;

require_once $fiveprayer_root . '/wp-load.php';
require_once ABSPATH . 'wp-admin/includes/plugin.php';

$fiveprayer_plugin = 'fiveprayer/Fiveprayer.php';

if (!file_exists(WP_PLUGIN_DIR . '/' . $fiveprayer_plugin)) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI diagnostics.
    fwrite(STDERR, "Plugin not found at wp-content/plugins/{$fiveprayer_plugin}.\n");
    exit(1);
}

if (is_plugin_active($fiveprayer_plugin)) {
    echo "FivePrayer is already active.\n";
    exit(0);
}

$fiveprayer_result = activate_plugin($fiveprayer_plugin);

if (is_wp_error($fiveprayer_result)) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI diagnostics.
    fwrite(STDERR, 'Activation failed: ' . $fiveprayer_result->get_error_message() . "\n");
    exit(1);
}

echo "FivePrayer activated.\n";

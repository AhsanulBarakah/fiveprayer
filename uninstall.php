<?php
/**
 * Uninstall cleanup for FivePrayer.
 *
 * WordPress deletes the plugin's files before it runs a
 * `register_uninstall_hook()` callback, so that callback cannot be relied on
 * to exist. This file is loaded by `uninstall_plugin()` from the plugin's own
 * directory and is therefore where the cleanup lives.
 *
 * Nothing is removed unless an administrator turned on "Delete all data on
 * uninstall" (Customizing → Configure Settings, off by default): a mosque that
 * deletes and reinstalls the plugin gets its settings, locations and generated
 * timetable back.
 *
 * @package FivePrayer
 */

defined('WP_UNINSTALL_PLUGIN') || exit;

$fiveprayer_delete_on_uninstall = (int) get_option('fiveprayer_delete_data_on_uninstall', 0);

if (1 !== $fiveprayer_delete_on_uninstall) {
    return;
}

global $wpdb;

// 1. The plugin's own tables.
$fiveprayer_tables = [
    $wpdb->prefix . 'fp_prayer_settings_meta',
    $wpdb->prefix . 'fp_timetable',
    $wpdb->prefix . 'fp_api_keys',
];

foreach ($fiveprayer_tables as $fiveprayer_table) {
    // phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,WordPress.DB.DirectDatabaseQuery.SchemaChange,WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Uninstall cleanup; the name is built from $wpdb->prefix, never from request data.
    $wpdb->query("DROP TABLE IF EXISTS `{$fiveprayer_table}`");
    // phpcs:enable
}

// 2. The default placeholder image this plugin uploaded to the Media Library.
//    Its id is only kept in a transient, which step 3 deletes, so it has to be
//    read before then.
$fiveprayer_default_image_id = (int) get_transient('fiveprayer_default_image_id');

if ($fiveprayer_default_image_id > 0 && 'attachment' === get_post_type($fiveprayer_default_image_id)) {
    wp_delete_attachment($fiveprayer_default_image_id, true);
}

// 3. Options and transients. The `fiveprayer_` prefix covers every setting,
//    migration flag, dismissed notice and hourly rate-limit counter the plugin
//    writes, so a setting added later is cleaned up without touching this file.
//    The `fp_` names below predate that convention and are listed explicitly.
$fiveprayer_option_names = [
    // Brute-force protection settings and escalation state.
    'fp_brute_force_settings',
    'fp_brute_cooldown_level',
    'fp_brute_stopped_at',
    // Mosque contact details read by the external API.
    'fp_mosque_address',
    'fp_mosque_phone',
    'fp_mosque_website',
];

foreach ($fiveprayer_option_names as $fiveprayer_option_name) {
    delete_option($fiveprayer_option_name);
}

// Transients need delete_transient(): delete_option() on the bare name would
// leave both the `_transient_` value and its timeout row behind.
$fiveprayer_transient_names = [
    'fp_notice_dismissed_until',
    'fp_brute_email_cooldown',
];

foreach ($fiveprayer_transient_names as $fiveprayer_transient_name) {
    delete_transient($fiveprayer_transient_name);
}

$fiveprayer_option_patterns = [
    $wpdb->esc_like('fiveprayer_') . '%',
    // Leftovers of the telemetry SDK that used to be bundled, for a site that
    // opted in before it was removed.
    $wpdb->esc_like('ifiiri_fiveprayer_') . '%',
    $wpdb->esc_like('_transient_fiveprayer_') . '%',
    $wpdb->esc_like('_transient_timeout_fiveprayer_') . '%',
    // Per-IP failed-attempt counters (one transient plus its timeout row).
    $wpdb->esc_like('_transient_fp_brute_') . '%',
    $wpdb->esc_like('_transient_timeout_fp_brute_') . '%',
    // Per-key hourly rate-limit counters.
    $wpdb->esc_like('_transient_fp_rate_') . '%',
    $wpdb->esc_like('_transient_timeout_fp_rate_') . '%',
];

foreach ($fiveprayer_option_patterns as $fiveprayer_pattern) {
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Uninstall cleanup, and LIKE patterns have no option API.
    $wpdb->query($wpdb->prepare("DELETE FROM {$wpdb->options} WHERE option_name LIKE %s", $fiveprayer_pattern));
}

// 4. Scheduled events.
$fiveprayer_crons = [
    'fiveprayer_hourly_cache_check',
    'fiveprayer_twice_daily_cache_check',
    'fiveprayer_check_next_prayer_change',
    // The removed telemetry SDK's shared heartbeat.
    'ifiiri_sdk_heartbeat',
];

foreach ($fiveprayer_crons as $fiveprayer_cron) {
    wp_clear_scheduled_hook($fiveprayer_cron);
}

// 5. The generated combined stylesheet/script.
if (!function_exists('fiveprayer_uninstall_remove_directory')) {
    /**
     * Remove a directory and everything in it.
     *
     * @param string $directory Absolute path.
     * @return void
     */
    function fiveprayer_uninstall_remove_directory($directory)
    {
        if (!is_dir($directory)) {
            return;
        }

        $entries = scandir($directory);

        if (false === $entries) {
            return;
        }

        foreach ($entries as $entry) {
            if ('.' === $entry || '..' === $entry) {
                continue;
            }

            $path = $directory . '/' . $entry;

            if (is_dir($path)) {
                fiveprayer_uninstall_remove_directory($path);
                continue;
            }

            wp_delete_file($path);
        }

        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- Removing the plugin's own now-empty cache directory.
        @rmdir($directory);
    }
}

$fiveprayer_uploads   = wp_upload_dir();
$fiveprayer_cache_dir = trailingslashit($fiveprayer_uploads['basedir']) . 'fiveprayer-cache';

fiveprayer_uninstall_remove_directory($fiveprayer_cache_dir);

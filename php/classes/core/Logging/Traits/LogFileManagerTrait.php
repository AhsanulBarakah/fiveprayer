<?php

namespace FivePrayer\Core\Logging\Traits;

defined('ABSPATH') || exit;

/**
 * Trait for managing log file paths, sizes, and clearing
 */
trait LogFileManagerTrait
{
    public static function get_log_file_path(): string
    {
        $upload_dir = wp_upload_dir();
        $log_dir = $upload_dir['basedir'] . '/fiveprayer-logs/';

        if (!file_exists($log_dir)) {
            wp_mkdir_p($log_dir);
        }

        self::protect_log_directory($log_dir);

        return $log_dir . 'fiveprayer-debug.log';
    }

    /**
     * Stop the web server from serving the log directory.
     *
     * Logs live under wp-content/uploads, which is public by default. The file
     * name is predictable, so without these guards anyone could fetch the log
     * (which contains file paths, request IDs, caller names and error text) by
     * visiting /wp-content/uploads/fiveprayer-logs/fiveprayer-debug.log.
     *
     * One file per server family: .htaccess for Apache, web.config for IIS, and
     * index.php to stop directory listing everywhere else.
     *
     * @param string $log_dir Absolute log directory, with trailing slash.
     * @return void
     */
    private static function protect_log_directory(string $log_dir): void
    {
        $htaccess = $log_dir . '.htaccess';

        if (!file_exists($htaccess)) {
            // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Small static guard file written next to the log; WP_Filesystem is not initialised on the front end.
            @file_put_contents(
                $htaccess,
                "# Deny direct access to FivePrayer logs.\n"
                . "<IfModule mod_authz_core.c>\nRequire all denied\n</IfModule>\n"
                . "<IfModule !mod_authz_core.c>\nOrder deny,allow\nDeny from all\n</IfModule>\n"
            );
        }

        $index = $log_dir . 'index.php';

        if (!file_exists($index)) {
            // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Same guard file as above.
            @file_put_contents($index, "<?php\n// Silence is golden.\n");
        }

        $web_config = $log_dir . 'web.config';

        if (!file_exists($web_config)) {
            // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents -- Same guard file as above, for IIS.
            @file_put_contents(
                $web_config,
                '<?xml version="1.0" encoding="UTF-8"?>'
                . '<configuration><system.webServer><authorization>'
                . '<deny users="*" />'
                . '</authorization></system.webServer></configuration>'
            );
        }
    }

    public static function get_log_file_url(): string
    {
        $upload_dir = wp_upload_dir();
        return $upload_dir['baseurl'] . '/fiveprayer-logs/fiveprayer-debug.log';
    }

    public static function clear_log_file(): void
    {
        $log_file = self::get_log_file_path();
        if (file_exists($log_file)) {
            wp_delete_file($log_file);
        }
    }

    public static function get_log_file_size(): int
    {
        $log_file = self::get_log_file_path();
        return file_exists($log_file) ? filesize($log_file) : 0;
    }

    public static function set_log_level(string $level): void
    {
        $valid_levels = ['none', 'error', 'warning', 'info', 'debug'];
        if (in_array($level, $valid_levels)) {
            update_option('fiveprayer_log_level', $level);
        }
    }
}

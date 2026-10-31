<?php

namespace FivePrayer\Core\Admin\Logging\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

trait LogActionHandlerTrait
{
    public function register(): void
    {
        add_action('admin_menu', [$this, 'add_logging_submenu']);
        add_action('admin_post_fiveprayer_save_logging_settings', [$this, 'handle_save_settings']);
        add_action('admin_post_fiveprayer_clear_logs', [$this, 'handle_clear_logs']);
        add_action('admin_post_fiveprayer_download_log_file', [$this, 'handle_download_log_file']);
        add_action('wp_ajax_fiveprayer_get_logs', [$this, 'handle_ajax_get_logs']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_logging_styles']);
    }

    public function enqueue_logging_styles($hook): void
    {
        if ($hook === 'toplevel_page_fiveprayer' || strpos($hook, 'fiveprayer-settings') !== false) {
            $css_url = $this->paths->getFileUrl('php/classes/core/Assets/CSS/logging-styles.css');
            wp_enqueue_style('fiveprayer-logging-styles', $css_url, [], '1.0.0');
        }
    }

    public function add_logging_submenu(): void
    {
        // Integrated into existing settings page
    }

    public function handle_save_settings(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        
        check_admin_referer('fiveprayer_save_logging_settings');

        $log_level = sanitize_text_field(filter_input(INPUT_POST, 'log_level') ?: 'none');
        
        $valid_levels = ['none', 'error', 'warning', 'info', 'debug'];
        if (!in_array($log_level, $valid_levels)) {
            $log_level = 'none';
        }

        update_option('fiveprayer_log_level', $log_level);

        Logger::info('Logging level changed to: ' . $log_level, 'LoggingAdmin');

        if (class_exists('\\FivePrayer\\Core\\Helpers\\PrayerDataCache')) {
            try {
                \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
            } catch (\Throwable $e) {
                Logger::warning('Could not clear cache: ' . $e->getMessage(), 'LoggingAdmin');
            }
        }

        $this->purge_external_caches();

        $this->redirect_with_notice('fiveprayer-settings', 'updated', 'logging_saved', 'translations');
    }

    public function handle_clear_logs(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        
        check_admin_referer('fiveprayer_clear_logs');

        Logger::clear_log_file();
        Logger::info('Custom log file cleared via admin interface', 'LoggingAdmin');

        $this->redirect_with_notice('fiveprayer-settings', 'updated', 'log_cleared', 'translations');
    }

    public function handle_download_log_file(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        
        check_admin_referer('fiveprayer_download_log_file');

        $log_file_path = Logger::get_log_file_path();
        
        if (!file_exists($log_file_path)) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', 'log_missing', 'translations');
            return;
        }

        header('Content-Type: text/plain');
        header('Content-Disposition: attachment; filename="fiveprayer-debug-' . gmdate('Y-m-d') . '.log"');
        header('Content-Length: ' . filesize($log_file_path));
        
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_readfile -- Streams the log download without buffering the whole file in memory.
        readfile($log_file_path);
        exit;
    }

    private function redirect_with_notice(string $page, string $type, string $message_code, string $tab = ''): void
    {
        $args = [
            'page'   => $page,
            $type    => '1',
            // SettingsAdmin renders only known codes, never free text.
            'fp_msg' => sanitize_key($message_code),
        ];
        if ($tab) { $args['tab'] = $tab; }
        $url = add_query_arg($args, admin_url('admin.php'));
        wp_safe_redirect($url);
        exit;
    }

    private function purge_external_caches(): void {
        if (function_exists('rocket_clean_domain')) {
            \rocket_clean_domain();
        }

        if (function_exists('do_action')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Third-party LiteSpeed Cache hook.
            do_action('litespeed_purge_all');
        }

        if (function_exists('w3tc_flush_all')) {
            \w3tc_flush_all();
        }

        if (function_exists('wp_cache_clear_cache')) {
            \wp_cache_clear_cache();
        }

        if (function_exists('wpfc_clear_all_cache')) {
            \wpfc_clear_all_cache(true);
        }

        \wp_cache_flush();
    }
}

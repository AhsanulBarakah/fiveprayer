<?php

namespace FivePrayer\Core\Helpers\WarningNotice;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\WarningNotice\DeprecatedShortcodeScanner;
use FivePrayer\Core\Helpers\WarningNotice\NoticeRenderer;
use FivePrayer\Core\Helpers\WarningNotice\NoticeScriptEnqueuer;
use FivePrayer\Core\Security\SecurityHelper;

class WarningNotice {
    private DeprecatedShortcodeScanner $scanner;
    private NoticeRenderer $renderer;
    private NoticeScriptEnqueuer $scriptEnqueuer;
    private static ?WarningNotice $instance = null;
    
    public function __construct() {
        $this->scanner = new DeprecatedShortcodeScanner();
        $this->renderer = new NoticeRenderer();
        $this->scriptEnqueuer = new NoticeScriptEnqueuer();
        
        self::$instance = $this;

        add_action('wp_ajax_fp_dismiss_notice', [$this, 'dismiss_notice']);
        
        if (defined('FP_TEST_MODE') && FP_TEST_MODE) {
            add_action('admin_notices', [$this, 'debug_notice_status'], 9999);
        }
    }

    public static function getInstance(): ?WarningNotice {
        return self::$instance;
    }

    public function init(): void
    {
        // Only run on admin pages and only for our specific pages
        if (!is_admin()) {
            return;
        }
        
        $page = sanitize_key(SecurityHelper::get_sanitized_get_input('page'));
        $target_pages = ['fiveprayer', 'fiveprayer-settings', 'fiveprayer-api-settings'];
        
        if (in_array($page, $target_pages, true)) {
            // Remove ALL existing admin_notices handlers
            // This must be done on admin_init which fires before admin_notices
            remove_all_actions('admin_notices');
            
            // Re-add our notice handler with high priority
            add_action('admin_notices', [$this, 'maybe_show_notice'], 999);
        }
    }
    
    public function maybe_show_notice(): void
    {
        $deprecated = $this->scanner->find();
        
        if (!empty($deprecated)) {
            $dismissed_until = get_transient('fp_notice_dismissed_until');
            $current_time = current_time('timestamp');
            
            if (!$dismissed_until || $current_time > $dismissed_until) {
                $this->renderer->render_deprecation_notice($deprecated, $dismissed_until);
            } elseif (sanitize_text_field(filter_input(INPUT_GET, 'dismissed') ?: '') === '1') {
                $remaining = $dismissed_until - $current_time;
                $this->renderer->render_success_notice(
                    sprintf('Notice dismissed. Will reappear in %s. Click X to Dismiss or Refresh it', 
                    human_time_diff($current_time, $dismissed_until)),
                    $remaining
                );
            }
        }
    }

    public function dismiss_notice(): void
    {
        // The notice is only shown on FivePrayer admin screens, but the AJAX
        // action itself is global. Require the capability the screens require
        // so a nonce alone is never enough to change a site-wide setting.
        if (!current_user_can('manage_options')) {
            wp_send_json_error(['message' => __('You do not have sufficient permissions.', 'fiveprayer')], 403);
        }

        check_ajax_referer('fp_dismiss_notice', 'nonce');
        
        $dismiss_duration = (defined('FP_TEST_MODE') && FP_TEST_MODE) 
            ? 1 * MINUTE_IN_SECONDS 
            : 14 * DAY_IN_SECONDS;
        
        $expiration = current_time('timestamp') + $dismiss_duration;
        set_transient('fp_notice_dismissed_until', $expiration, $dismiss_duration);
        
        wp_send_json_success([
            'expires_at' => $expiration,
            'expires_human' => date_i18n('Y-m-d H:i:s', $expiration),
            'remaining' => $dismiss_duration,
            'redirect_url' => add_query_arg('dismissed', '1', wp_get_referer())
        ]);
    }
    
    public function debug_notice_status(): void
    {
        $screen = get_current_screen();
        if (!$screen || $screen->id !== 'toplevel_page_fiveprayer') return;
        
        $dismissed_until = get_transient('fp_notice_dismissed_until');
        $current_time = current_time('timestamp');
        
        echo '<div class="notice notice-info fiveprayer-debug-panel">';
        echo '<h3>FivePrayer Notice Debug</h3>';
        echo '<p><strong>Current time:</strong> <span class="fiveprayer-current-time">' . esc_html(date_i18n('Y-m-d H:i:s')) . '</span></p>';
        echo '<p><strong>Status:</strong> ' . ($dismissed_until && $current_time < $dismissed_until ? 'Dismissed' : 'Active') . '</p>';
        
        if ($dismissed_until) {
            $remaining = $dismissed_until - $current_time;
            echo '<p><strong>Dismissed until:</strong> ' . esc_html(date_i18n('Y-m-d H:i:s', $dismissed_until)) . '</p>';
            echo '<p><strong>Time remaining:</strong> <span class="fiveprayer-countdown" data-remaining="' . esc_attr($remaining) . '">' . esc_html(human_time_diff($current_time, $dismissed_until)) . '</span></p>';
        }
        
        echo '<p><strong>Test mode:</strong> ' . (defined('FP_TEST_MODE') && FP_TEST_MODE ? 'ON (5 min duration)' : 'OFF (14 day duration)') . '</p>';
        echo '</div>';

        
    }
}
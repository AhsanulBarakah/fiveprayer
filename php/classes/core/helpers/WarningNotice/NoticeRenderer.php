<?php

namespace FivePrayer\Core\Helpers\WarningNotice;

defined('ABSPATH') || exit;

class NoticeRenderer {
    public function render_deprecation_notice(array $deprecated): void {
        wp_enqueue_style('fiveprayer-deprecation-notice', plugin_dir_url(__FILE__) . 'css/deprecation-notice.css', [], (string) filemtime(plugin_dir_path(__FILE__) . 'css/deprecation-notice.css'));
        include __DIR__ . '/Views/deprecation-notice.php';
    }


    public function render_success_notice($message, $remaining_seconds) {
        ?>
        <div class="notice notice-success is-dismissible fiveprayer-success-notice">
            <p>
                <?php echo esc_html($message); ?>
                <span class="fiveprayer-countdown" data-remaining="<?php echo esc_attr($remaining_seconds); ?>">
                    (<?php echo esc_html(human_time_diff(time(), time() + $remaining_seconds)); ?>)
                </span>
            </p>
        </div>
        
        <?php
    }
}

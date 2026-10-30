<?php
namespace FivePrayer\Core\Helpers\WarningNotice;

defined('ABSPATH') || exit;

class NoticeScriptEnqueuer {
    public function enqueue() {
        wp_enqueue_style(
            'fiveprayer-deprecation-notice',
            plugins_url('css/deprecation-notice.css', __FILE__),
            [],
            filemtime(plugin_dir_path(__FILE__) . 'css/deprecation-notice.css')
        );

        wp_enqueue_script(
            'fiveprayer-admin-notices',
            plugins_url('js/admin-notices.js', __FILE__),
            [],
            filemtime(plugin_dir_path(__FILE__) . 'js/admin-notices.js'),
            true
        );
        
        // Add inline script to hide external notices on all FivePrayer pages
        wp_add_inline_script('fiveprayer-admin-notices', "
            document.addEventListener('DOMContentLoaded', function() {
                // Hide external admin notices on FivePrayer pages
                var pageParam = new URLSearchParams(window.location.search).get('page');
                if (pageParam && pageParam.indexOf('fiveprayer') === 0) {
                    // Remove any external notices that might have slipped through
                    var externalNotices = document.querySelectorAll('.wrap > .notice');
                    externalNotices.forEach(function(notice) {
                        if (!notice.classList.contains('fiveprayer-deprecation-manager') && 
                            !notice.classList.contains('fiveprayer-debug-panel') && 
                            !notice.classList.contains('fiveprayer-notice') &&
                            !notice.closest('.fiveprayer-deprecation-manager')) {
                            notice.style.display = 'none';
                        }
                    });
                    
                    // Also hide notices in other common locations
                    var allNotices = document.querySelectorAll('.notice');
                    allNotices.forEach(function(notice) {
                        if (!notice.classList.contains('fiveprayer-deprecation-manager') && 
                            !notice.classList.contains('fiveprayer-debug-panel') &&
                            !notice.classList.contains('fiveprayer-notice') &&
                            !notice.closest('.fiveprayer-deprecation-manager')) {
                            notice.style.display = 'none';
                        }
                    });
                }
            });
        ");
        
        wp_localize_script('fiveprayer-admin-notices', 'fpNoticeData', [
            'ajaxurl' => admin_url('admin-ajax.php')
        ]);
    }
}
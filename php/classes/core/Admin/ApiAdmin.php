<?php

namespace FivePrayer\Core\Admin;

defined('ABSPATH') || exit;

use FivePrayer\Core\API\ApiKeyManager;
use FivePrayer\Core\Admin\Traits\ApiAdminRendererTrait;
use FivePrayer\Core\Admin\Traits\ApiAdminAjaxHandlerTrait;

class ApiAdmin
{
    use ApiAdminRendererTrait;
    use ApiAdminAjaxHandlerTrait;

    private $api_key_manager;
    private $page_slug = 'fiveprayer-api-settings';
    private $security_page_slug = 'fiveprayer-api-security';

    public function __construct()
    {
        $this->api_key_manager = new ApiKeyManager();
        $this->register_hooks();
    }

    private function register_hooks(): void
    {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_action('wp_ajax_fp_api_create_key', [$this, 'handle_create_key']);
        add_action('wp_ajax_fp_api_revoke_key', [$this, 'handle_revoke_key']);
        add_action('wp_ajax_fp_api_unrevoke_key', [$this, 'handle_unrevoke_key']);
        add_action('wp_ajax_fp_api_delete_key', [$this, 'handle_delete_key']);
        add_action('wp_ajax_fp_api_regenerate_key', [$this, 'handle_regenerate_key']);
        add_action('wp_ajax_fp_api_get_key', [$this, 'handle_get_key']);
        add_action('wp_ajax_fp_api_update_key', [$this, 'handle_update_key']);
        add_action('wp_ajax_fp_api_copy_key', [$this, 'handle_copy_key']);
        add_action('wp_ajax_fp_api_migrate_legacy_keys', [$this, 'handle_migrate_legacy_keys']);
        add_action('wp_ajax_fp_api_save_brute_force_settings', [$this, 'handle_save_brute_force_settings']);
        add_action('wp_ajax_fp_api_send_test_email', [$this, 'handle_send_test_email']);
        add_action('wp_ajax_fp_api_reset_email_cooldown', [$this, 'handle_reset_email_cooldown']);
        add_action('wp_ajax_fp_api_expire_email_cooldown', [$this, 'handle_expire_email_cooldown']);
        add_action('wp_ajax_fp_api_unblock_ip', [$this, 'handle_unblock_ip']);
        add_action('admin_notices', [$this, 'maybe_show_legacy_keys_notice']);
    }


    /**
     * Show an admin notice if legacy (SHA-256 hashed) API keys exist.
     */
    public function maybe_show_legacy_keys_notice()
    {
        $screen = get_current_screen();
        if (!$screen || strpos($screen->id, $this->page_slug) === false) {
            return;
        }

        $legacy_count = $this->api_key_manager->has_legacy_keys();

        if ($legacy_count === 0) {
            return;
        }

        ?>
        <div class="notice notice-warning is-dismissible fiveprayer-legacy-keys-notice">
            <p>
                <strong><?php esc_html_e('FivePrayer API Keys Upgrade Required:', 'fiveprayer'); ?></strong>
                <?php echo esc_html(sprintf(
                    /* translators: %d: number of legacy API keys detected. */
                    _n(
                        'We found %d API key stored in the old SHA-256 hash format. ',
                        'We found %d API keys stored in the old SHA-256 hash format. ',
                        $legacy_count,
                        'fiveprayer'
                    ),
                    $legacy_count
                )); ?>
                <?php esc_html_e('The plugin now uses AES-256-CBC encryption, and these keys need to be regenerated to remain usable.', 'fiveprayer'); ?>
            </p>
            <p>
                <button type="button" class="button button-primary" id="fiveprayer-migrate-legacy-keys">
                    <?php esc_html_e('Regenerate Legacy Keys Now', 'fiveprayer'); ?>
                </button>
                <span id="fiveprayer-migrate-status" style="margin-left: 10px; display: none;"></span>
            </p>
            <p class="description">
                <?php esc_html_e('This will generate new API keys for all legacy entries. The old keys will stop working. New keys will be shown after migration.', 'fiveprayer'); ?>
            </p>
        </div>
        <?php
    }
}

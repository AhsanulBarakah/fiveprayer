<?php
namespace FivePrayer\Core\Admin;

defined('ABSPATH') || exit;

use FivePrayer\Core\PathService;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Admin\Traits\CacheHandlerTrait;
use FivePrayer\Core\Admin\Traits\TranslationImportExportTrait;
use FivePrayer\Core\Admin\Traits\SettingsDataManagementTrait;
use FivePrayer\Core\Admin\Traits\UiRendererTrait;

class SettingsAdmin
{
    use CacheHandlerTrait;
    use TranslationImportExportTrait;
    use SettingsDataManagementTrait;
    use UiRendererTrait;

    private PathService $paths;

    public function __construct()
    {
        $this->paths = new PathService();
    }

    public function register(): void
    {
        add_action('admin_menu', [$this, 'add_submenu']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_assets']);
        add_action('admin_post_fiveprayer_import_translations', [$this, 'handle_import']);
        add_action('admin_post_fiveprayer_reset_defaults_soft', [$this, 'handle_soft_reset']);
        add_action('admin_post_fiveprayer_reset_defaults_hard', [$this, 'handle_hard_reset']);
        add_action('admin_post_fiveprayer_export_translations', [$this, 'handle_export']);
        add_action('admin_post_fiveprayer_force_clear_caches', [$this, 'handle_force_clear_caches']);
        add_action('admin_post_fiveprayer_import_settings', [$this, 'handle_import_settings']);
        add_action('admin_post_fiveprayer_export_settings', [$this, 'handle_export_settings']);
        add_action('admin_post_fiveprayer_reset_settings_defaults', [$this, 'handle_reset_settings_defaults']);
        add_action('admin_post_fiveprayer_reset_settings_defaults_soft', [$this, 'handle_reset_settings_defaults_soft']);
        add_action('admin_notices', [$this, 'maybe_render_notice'], 999);

        $logging_admin = new LoggingAdmin();
        $logging_admin->register();
    }

    public function add_submenu(): void
    {
        add_submenu_page(
            'fiveprayer',
            __('Settings', 'fiveprayer'),
            __('Settings', 'fiveprayer'),
            'manage_options',
            'fiveprayer-settings',
            [$this, 'render_page'],
            20
        );
    }

    /**
     * Load the settings screen stylesheet only on the Settings page.
     *
     * @param string $hook Current admin page hook.
     */
    public function enqueue_admin_assets($hook): void
    {
        if (strpos((string) $hook, 'fiveprayer-settings') === false) {
            return;
        }

        $relative = 'php/classes/core/Assets/CSS/settings-admin.css';
        $path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . $relative;
        $url = plugin_dir_url(FIVEPRAYER_PLUGIN_FILE) . $relative;
        $version = file_exists($path) ? (string) filemtime($path) : '1.0.0';

        wp_enqueue_style('fiveprayer-settings-admin', $url, [], $version);
    }

    public function render_page(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'fiveprayer'));
        }

        echo '<div class="wrap fiveprayer-settings-admin">';
        echo '<div class="fiveprayer-settings-hero">';
        echo '<div class="fiveprayer-settings-hero-icon"><span class="dashicons dashicons-admin-generic"></span></div>';
        echo '<div>';
        echo '<h1>' . esc_html__('FivePrayer Settings', 'fiveprayer') . '</h1>';
        echo '<p>' . esc_html__('Manage your prayer data, translations, and defaults.', 'fiveprayer') . '</p>';
        echo '</div>';
        echo '</div>';
        $this->render_tabs();

        $tab = $this->get_current_tab();
        switch ($tab) {
            case 'data_management':
                $this->render_data_management_tab();
                break;
            case 'translations':
                $this->render_translations_tab();
                break;
            default:
                echo '<p>' . esc_html__('Select a section from the tabs above.', 'fiveprayer') . '</p>';
                break;
        }

        echo '</div>';
    }

    public function maybe_render_notice(): void
    {
        $export_notice = get_transient('fiveprayer_export_notice');
        if ($export_notice) {
            delete_transient('fiveprayer_export_notice');
            printf('<div class="notice notice-success is-dismissible fiveprayer-notice"><p>%s</p></div>', esc_html($export_notice));
        }

        $page   = sanitize_key(SecurityHelper::get_sanitized_get_input('page'));
        $fp_msg = SecurityHelper::get_sanitized_get_input('fp_msg');

        if (in_array($page, ['fiveprayer', 'fiveprayer-settings', 'fiveprayer-api-settings']) && !empty($fp_msg)) {
            $updated = SecurityHelper::has_query_arg('updated');
            $error   = SecurityHelper::has_query_arg('error');
            $class = $updated ? 'success' : ($error ? 'error' : 'success');
            printf('<div class="notice notice-%1$s is-dismissible fiveprayer-notice"><p>%2$s</p></div>', esc_attr($class), esc_html($fp_msg));
        }
    }

    private function redirect_with_notice(string $page, string $type, string $message, string $tab = ''): void
    {
        $args = [
            'page'   => $page,
            $type    => '1',
            'fp_msg' => $message,
        ];
        if ($tab) {
            $args['tab'] = $tab;
        }
        $url = add_query_arg($args, admin_url('admin.php'));
        wp_safe_redirect($url);
        exit;
    }
}

<?php
/**
 * Delete all data on uninstall — the opt-in that gates uninstall.php.
 *
 * Uninstalling a WordPress plugin deletes its files but not the rows it wrote,
 * which is the right default: deleting and reinstalling FivePrayer should not
 * throw away the timetable and every setting. A site that is finished with the
 * plugin needs the opposite, so the choice is explicit here and off by default.
 *
 * The switch is rendered at the bottom of Customizing → Configure Settings. It
 * is saved through admin-ajax (`fp_save_uninstall_data`) with a nonce, and the
 * handler re-checks `manage_options`; the option itself is only read by
 * uninstall.php.
 *
 * @package FivePrayer\Core\Admin
 * @since   3.0.0
 */

namespace FivePrayer\Core\Admin;

defined('ABSPATH') || exit;

/**
 * Class UninstallSettings
 *
 * @since 3.0.0
 */
class UninstallSettings
{
    /**
     * Option holding the opt-in (1 = delete on uninstall, 0 = keep the data).
     *
     * @var string
     */
    public const OPTION_NAME = 'fiveprayer_delete_data_on_uninstall';

    /**
     * Nonce action used when saving the switch.
     *
     * @var string
     */
    public const NONCE_ACTION = 'fiveprayer_uninstall_data_save';

    /**
     * Request field carrying the nonce.
     *
     * @var string
     */
    public const NONCE_NAME = 'nonce';

    /**
     * `wp_ajax_*` action used to persist the switch.
     *
     * @var string
     */
    public const AJAX_ACTION = 'fp_save_uninstall_data';

    /**
     * Register the AJAX handler.
     *
     * @return void
     */
    public function register(): void
    {
        add_action('wp_ajax_' . self::AJAX_ACTION, [$this, 'handle_ajax_save']);
    }

    /**
     * Whether data is removed when the plugin is uninstalled.
     *
     * @return bool
     */
    public static function is_enabled(): bool
    {
        return 1 === (int) get_option(self::OPTION_NAME, 0);
    }

    /**
     * State handed to the admin JavaScript bundle.
     *
     * @return array<string, mixed>
     */
    public static function get_admin_state(): array
    {
        return [
            'enabled'    => self::is_enabled(),
            'nonce'      => wp_create_nonce(self::NONCE_ACTION),
            'ajaxAction' => self::AJAX_ACTION,
            'optionName' => self::OPTION_NAME,
        ];
    }

    /**
     * Persist the switch.
     *
     * @return void
     */
    public function handle_ajax_save(): void
    {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(
                ['message' => __('You do not have sufficient permissions to change this setting.', 'fiveprayer')],
                403
            );
        }

        check_ajax_referer(self::NONCE_ACTION, self::NONCE_NAME);

        $raw = isset($_POST['enabled']) ? sanitize_text_field(wp_unslash($_POST['enabled'])) : '0';

        // Only an explicit yes deletes anything; every other value keeps the
        // data, which is the safe default.
        $enabled = in_array($raw, ['1', 'true', 'on', 'yes'], true) ? 1 : 0;

        update_option(self::OPTION_NAME, $enabled);

        wp_send_json_success([
            'enabled' => 1 === $enabled,
            'message' => $enabled
                ? __('Data will be deleted when the plugin is uninstalled.', 'fiveprayer')
                : __('Data is kept when the plugin is uninstalled.', 'fiveprayer'),
        ]);
    }
}

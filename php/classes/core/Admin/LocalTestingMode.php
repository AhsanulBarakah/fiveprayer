<?php
/**
 * Share on Local Network — admin side.
 *
 * Owns the on/off switch for {@see \FivePrayer\Core\LocalNetworkRouter}, which
 * overrides the WordPress home/site URL in memory so the mosque's own site can
 * be opened on the TV, a phone or a tablet over the same network.
 *
 * Not a testing or developer helper: a site that runs on a local machine
 * (LocalWP, Flywheel, MAMP, Docker, `wp server`, a mini PC in the prayer hall)
 * is expected to serve the display to the other devices on that network, and
 * the switch is meant to stay on for that. The one technical guard that remains
 * is that it does nothing on a public domain.
 *
 * The switch is NOT a separate admin page. It is rendered as the third switch
 * of the TV Display Mode page
 * (FivePrayer → Customizing → Configure Settings → TV Display Mode), directly
 * below the Pages and Posts switches, so the three switches that belong
 * together are chosen in one place and a normal user can see its name and what
 * it does — a dedicated "Developer Tools" page hid it from exactly the people
 * who need it (anyone setting up TV Display Mode).
 *
 * The stored option (`fiveprayer_local_testing_mode`, 0 or 1) is read early by
 * the router. It defaults to 0, so nothing is rewritten until an administrator
 * deliberately turns the switch on. It is written only through
 * {@see self::handle_ajax_save()}, which requires the `manage_options`
 * capability and a valid nonce.
 *
 * @package FivePrayer\Core\Admin
 * @since   3.0.0
 */

namespace FivePrayer\Core\Admin;

defined('ABSPATH') || exit;

use FivePrayer\Core\LocalNetworkRouter;

/**
 * Class LocalTestingMode
 *
 * Persists the Share on Local Network setting and describes its state to the admin
 * single-page app.
 *
 * @since 3.0.0
 */
class LocalTestingMode
{
    /**
     * Option name holding the on/off state (1 = enabled, 0 = disabled).
     *
     * @var string
     */
    public const OPTION_NAME = LocalNetworkRouter::OPTION_NAME;

    /**
     * Nonce action used when saving the toggle.
     *
     * @var string
     */
    public const NONCE_ACTION = 'fiveprayer_local_testing_mode_save';

    /**
     * Ajax request field carrying the nonce.
     *
     * @var string
     */
    public const NONCE_NAME = 'nonce';

    /**
     * Shortcut to the settings screen that hosts the switch.
     *
     * Kept as a constant so every user-facing description points at the same
     * place: Customizing → Configure Settings (the TV Display Mode page).
     *
     * @var string
     */
    public const SETTINGS_HASH = '/customizing/settings';

    /**
     * `wp_ajax_*` action used to persist the setting.
     *
     * @var string
     */
    public const AJAX_ACTION = 'fp_save_local_testing_mode';

    /**
     * Register every WordPress hook owned by this class.
     *
     * @return void
     */
    public function register(): void
    {
        add_action('wp_ajax_' . self::AJAX_ACTION, [$this, 'handle_ajax_save']);
    }

    /**
     * State handed to the admin JavaScript bundle.
     *
     * Never exposes anything a viewer of the settings screen could not read
     * already: the option state, the request host and a save nonce.
     *
     * @return array<string, mixed>
     */
    public static function get_admin_state(): array
    {
        $host          = LocalNetworkRouter::get_request_host();
        $request_local = (null !== $host) && LocalNetworkRouter::is_local_host($host);

        return [
            'enabled'         => LocalNetworkRouter::is_enabled(),
            'active'          => LocalNetworkRouter::is_active(),
            'host'            => null !== $host ? $host : '',
            'requestIsLocal'  => $request_local,
            'savedHosts'      => implode(', ', LocalNetworkRouter::get_saved_hosts()),
            'serverAddresses' => implode(', ', LocalNetworkRouter::get_server_addresses()),
            'nonce'           => wp_create_nonce(self::NONCE_ACTION),
            'ajaxAction'      => self::AJAX_ACTION,
            'optionName'      => self::OPTION_NAME,
            'settingsHash'    => self::SETTINGS_HASH,
        ];
    }

    /**
     * Persist the toggle.
     *
     * Runs the full security gauntlet before touching the database: capability
     * check, nonce verification and strict sanitisation. Only the exact value
     * `1` (or its string equivalents) enables the feature; everything else
     * turns it off.
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

        $raw     = isset($_POST['enabled']) ? sanitize_text_field(wp_unslash($_POST['enabled'])) : '0';
        $enabled = in_array($raw, ['1', 'true', 'on', 'yes'], true) ? 1 : 0;

        // This switch is the third one of the TV Display Mode page, so the
        // master switch of that feature governs it too: while TV Display Mode is
        // off in Feature Switches, an old tab must not turn the network
        // rewrite back on. Turning it off is always allowed.
        if (1 === $enabled && !TVDisplayMode::is_feature_enabled()) {
            wp_send_json_error(
                ['message' => __('TV Display Mode is switched off in Feature Switches. Turn it on there first.', 'fiveprayer')],
                400
            );
        }

        update_option(self::OPTION_NAME, $enabled);

        // Optional list of host names / addresses this server may answer on.
        // The router also always accepts the server's own addresses; this list
        // covers hostnames (LocalWP, a .local name) and a fixed LAN address.
        if (array_key_exists('hosts', $_POST)) {
            $raw_hosts = sanitize_textarea_field(wp_unslash((string) $_POST['hosts']));
            $parts     = preg_split('/[\r\n,]+/', $raw_hosts);
            $hosts     = [];

            foreach (is_array($parts) ? $parts : [] as $part) {
                $part = strtolower(trim((string) $part));
                if ('' !== $part && preg_match('/^[a-z0-9\[\]\-\.:_]+$/', $part)) {
                    $hosts[] = $part;
                }
            }

            update_option(LocalNetworkRouter::HOSTS_OPTION, implode(',', array_values(array_unique($hosts))));
        }

        wp_send_json_success([
            'enabled'    => 1 === $enabled,
            'savedHosts' => implode(', ', LocalNetworkRouter::get_saved_hosts()),
            'message'    => $enabled
                ? __('Share on Local Network enabled. The TV, phone or tablet on your network can open this site with this computer’s network address.', 'fiveprayer')
                : __('Share on Local Network disabled. Only this computer can open the site now.', 'fiveprayer'),
        ]);
    }
}

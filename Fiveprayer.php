<?php
/**
 * Plugin Name:       FivePrayer
 * Plugin URI:        https://fiveprayer.com
 * Description:       FivePrayer – A plugin for displaying Muslim prayer times.
 * Version:           3.0.0
 * Author:            AhsanulBarakah
 * Author URI:        https://profiles.wordpress.org/jamaaldev/
 * Text Domain:       fiveprayer
 * Domain Path:       /languages
 * License:           GPL v3 or later
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.txt
 * Requires at least: 6.7
 * Requires PHP:      7.4
 *
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

// Include the main plugin functionality and all modular components
require_once __DIR__ . '/php/FivePrayerMain.php';

/*
 * iFiiri client SDK - anonymous usage telemetry.
 *
 * Registers this plugin with the iFiiri dashboard so activations,
 * deactivations and daily heartbeats can be reported. Nothing is ever
 * transmitted until a site administrator explicitly clicks "Opt in" on the
 * notice shown at activation; until then the SDK only registers hooks and the
 * WordPress privacy tools. No personal data is collected.
 *
 * The guard keeps a bad build from turning a missing SDK folder into a fatal
 * error: without the file, telemetry is simply never loaded.
 */
$fiveprayer_ifiiri_sdk = __DIR__ . '/client-sdk/ifiiri-client.php';

if (file_exists($fiveprayer_ifiiri_sdk)) {
    require_once $fiveprayer_ifiiri_sdk;
}

if (class_exists('\iFiiri\SDK\Client')) {
    /*
     * The iFiiri master endpoint is resolved LAZILY at send/display time, so
     * the same plugin build works in every environment without edits - even
     * when the iFiiri master plugin loads AFTER this one (plugin load order is
     * alphabetical, "fiveprayer" loads first, and a load-time check for
     * the master would never see it):
     *
     *   1. FIVEPRAYER_IFIIRI_ENDPOINT in wp-config.php - explicit, always wins:
     *          define( 'FIVEPRAYER_IFIIRI_ENDPOINT', 'https://master-domain.com/wp-json/ifiiri/v1/' );
     *   2. The iFiiri master plugin active on this very site (Local dev setup,
     *      or a hosting install that bundles both plugins) - report to this
     *      site's own REST API, http or https automatically.
     *   3. Default: the production master at ahsanulbarakah.com - where every
     *      customer installation reports unless overridden above.
     *
     * FIVEPRAYER_IFIIRI_CLIENT_ID / FIVEPRAYER_IFIIRI_SECRET can still override
     * the credentials below (wp-config.php); the defaults are the local dev key.
     */
    if (!function_exists('fiveprayer_ifiiri_endpoint')) {
        /**
         * Resolve the iFiiri master endpoint for the current environment.
         *
         * @return string|null Endpoint base URL, or null when no master is known.
         */
        function fiveprayer_ifiiri_endpoint() {
            if (defined('FIVEPRAYER_IFIIRI_ENDPOINT') && '' !== trim((string) FIVEPRAYER_IFIIRI_ENDPOINT)) {
                return trim((string) FIVEPRAYER_IFIIRI_ENDPOINT);
            }

            // The iFiiri master plugin is active on this site - report here.
            if (defined('IFI_VERSION')) {
                return rest_url('ifiiri/v1/');
            }

            // Production master: every customer installation reports here.
            return 'https://ahsanulbarakah.com/wp-json/ifiiri/v1/';
        }
    }

    // The callable is resolved by the SDK at send/display time, when every
    // plugin has loaded and IFI_VERSION (if the master is present) is defined.
    \iFiiri\SDK\Client::register(
        'fiveprayer',
        array(
            'endpoint'    => 'fiveprayer_ifiiri_endpoint',
                'client_id'   => defined('FIVEPRAYER_IFIIRI_CLIENT_ID') ? FIVEPRAYER_IFIIRI_CLIENT_ID : 'fiv_bef4e7864b2a96d864d2',
                'secret'      => defined('FIVEPRAYER_IFIIRI_SECRET') ? FIVEPRAYER_IFIIRI_SECRET : '2eca4b4985d32e29dcd7ca88eb5f0ab1d0ef4055ac1a7fa9',
                'version'     => function_exists('fiveprayer_get_plugin_version') ? fiveprayer_get_plugin_version() : '3.0.0',
                'plugin_file' => __FILE__,
                'plugin_name' => 'FivePrayer',
                'text_domain' => 'fiveprayer',
            )
        );
    }

// Activation and deactivation hooks are registered in php/FivePrayerMain.php,
// which owns the functions they call. Registering them here as well meant both
// copies were attached to the same action.
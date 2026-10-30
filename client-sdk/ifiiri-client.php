<?php
/**
 * iFiiri Client SDK - drop-in opt-in telemetry for premium plugins.
 *
 * This folder is meant to be copied into a plugin (for example
 * fiveprayer/client-sdk/) and then loaded from that plugin's main file:
 *
 *     require_once __DIR__ . '/client-sdk/ifiiri-client.php';
 *
 *     \iFiiri\SDK\Client::register(
 *         'fiveprayer',
 *         array(
 *             'endpoint'    => 'https://your-master-site.com/wp-json/ifiiri/v1/',
 *             'client_id'   => 'fiv_xxxxxxxxxxxx',
 *             'secret'      => 'your-secret-from-the-iFiiri-dashboard',
 *             'version'     => FIVEPRAYER_VERSION,
 *             'plugin_file' => __FILE__,
 *             'text_domain' => 'fiveprayer',
 *         )
 *     );
 *
 * That single call wires up everything: the opt-in notice, the deactivation
 * modal, the daily heartbeat, a retry queue for reports that could not be
 * delivered, and the WordPress privacy tools. Nothing is ever transmitted until
 * the site administrator explicitly clicks "Opt in".
 *
 * Multiple iFiiri-enabled plugins can coexist on one site: each call to
 * Client::register() adds a product, and one SDK instance serves them all.
 * Whichever copy of the SDK loads first wins; keep bundled copies in sync.
 *
 * @package iFiiri\SDK
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$fiveprayer_ifiiri_sdk_version = '1.2.6';

/*
 * Several premium plugins may each bundle this SDK. PHP cannot redeclare the
 * classes in this request, so the first copy that loads wins and later copies
 * stand down - but their Client::register() calls still work, because they
 * resolve to the already-loaded class.
 */
if ( defined( 'IFI_SDK_VERSION' ) ) {
	return;
}

define( 'IFI_SDK_VERSION', $fiveprayer_ifiiri_sdk_version );
define( 'IFI_SDK_FILE', __FILE__ );
define( 'IFI_SDK_DIR', trailingslashit( dirname( __FILE__ ) ) );
define( 'IFI_SDK_URL', trailingslashit( plugins_url( '', __FILE__ ) ) );

require_once IFI_SDK_DIR . 'includes/class-product.php';
require_once IFI_SDK_DIR . 'includes/class-transport.php';
require_once IFI_SDK_DIR . 'includes/class-delivery.php';
require_once IFI_SDK_DIR . 'includes/class-consent.php';
require_once IFI_SDK_DIR . 'includes/class-deactivation.php';
require_once IFI_SDK_DIR . 'includes/class-privacy.php';
require_once IFI_SDK_DIR . 'includes/class-queue.php';
require_once IFI_SDK_DIR . 'includes/class-client.php';

// Registers hooks. Safe to call twice; Client::register() calls it implicitly.
iFiiri\SDK\Client::boot();

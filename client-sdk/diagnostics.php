<?php
/**
 * iFiiri SDK - one-page connectivity diagnostics.
 *
 * TEMPORARY TOOL. Copy this file into the same folder as the plugin that loads
 * the SDK (or anywhere in the plugin), visit it once from the browser while
 * logged in as an administrator, read the report, then DELETE THE FILE.
 *
 * What it does, in order:
 *
 *   1. loads WordPress,
 *   2. finds the registered iFiiri product,
 *   3. checks the local consent state,
 *   4. performs an outbound HTTP GET against the master's REST root,
 *   5. performs a real signed POST against the heartbeat route (one that has
 *      already been used, so the replay check cannot be confused),
 *   6. prints everything the transport normally swallows: the transport error,
 *      the HTTP status, the exact JSON body the master answered with, and the
 *      signature inputs used.
 *
 * Everything is rendered on the page - nothing is stored or sent anywhere else.
 *
 * @package iFiiri\SDK
 */

if ( ! defined( 'ABSPATH' ) ) {
	// Locate wp-load.php four levels up, as for wp-content/plugins/plugin/sdk/.
	$fiveprayer_ifiiri_candidates = array(
		dirname( __DIR__, 4 ) . '/wp-load.php',
		dirname( __DIR__, 3 ) . '/wp-load.php',
		dirname( __DIR__, 2 ) . '/wp-load.php',
	);

	$fiveprayer_ifiiri_loaded = false;

	foreach ( $fiveprayer_ifiiri_candidates as $fiveprayer_ifiiri_candidate ) {
		if ( file_exists( $fiveprayer_ifiiri_candidate ) ) {
			require_once $fiveprayer_ifiiri_candidate;
			$fiveprayer_ifiiri_loaded = true;
			break;
		}
	}

	if ( ! $fiveprayer_ifiiri_loaded ) {
		http_response_code( 500 );
		exit( 'Could not locate wp-load.php. Move this file deeper into the plugin folder and try again.' );
	}
}

if ( ! current_user_can( 'manage_options' ) ) {
	wp_die( esc_html__( 'Administrators only.', 'fiveprayer' ) );
}

?><!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<title>iFiiri diagnostics</title>
	<style>
		body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 2rem auto; max-width: 60rem; color: #1e1e1e; }
		h1 { font-size: 1.4rem; } h2 { font-size: 1.1rem; margin-top: 2rem; }
		table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
		th, td { border: 1px solid #dcdcde; padding: .5rem .75rem; text-align: left; vertical-align: top; font-size: .9rem; }
		th { background: #f6f7f7; width: 16rem; }
		code { background: #f0f0f1; padding: .1rem .35rem; border-radius: 3px; word-break: break-all; }
		pre { background: #f0f0f1; padding: 1rem; overflow-x: auto; font-size: .85rem; }
		.ok { color: #007017; font-weight: 600; } .bad { color: #b32d2e; font-weight: 600; } .warn { color: #996800; font-weight: 600; }
	</style>
</head>
<body>
<h1>iFiiri diagnostics</h1>
<p>Run on <code><?php echo esc_html( home_url() ); ?></code> at <code><?php echo esc_html( gmdate( 'c' ) ); ?></code> (server UTC).</p>

<?php
$fiveprayer_ifiiri_products = \iFiiri\SDK\Client::products();

if ( empty( $fiveprayer_ifiiri_products ) ) {
	echo '<p class="bad">No iFiiri product is registered. Client::register() has not run - check that the plugin loading the SDK is active on THIS site.</p>';
	echo '</body></html>';
	return;
}

foreach ( $fiveprayer_ifiiri_products as $fiveprayer_ifiiri_slug => $fiveprayer_ifiiri_product ) :
	?>
	<h2>Product: <?php echo esc_html( $fiveprayer_ifiiri_slug ); ?></h2>
	<table>
		<tr><th>Consent</th><td><?php echo esc_html( $fiveprayer_ifiiri_product->consent() ); ?>

			<?php if ( \iFiiri\SDK\Product::CONSENT_YES !== $fiveprayer_ifiiri_product->consent() ) : ?>
				&mdash; <span class="bad">not opted in on this site; nothing will ever be sent from here.</span>
			<?php else : ?>
				&mdash; <span class="ok">opted in</span>
			<?php endif; ?>
		</td></tr>
		<tr><th>Configured</th><td><?php echo $fiveprayer_ifiiri_product->is_configured() ? '<span class="ok">yes</span>' : '<span class="bad">no - endpoint, client id, secret or version is empty</span>'; ?></td></tr>
		<tr><th>Endpoint</th><td><code><?php echo esc_html( $fiveprayer_ifiiri_product->endpoint() ); ?></code></td></tr>
		<tr><th>Client id</th><td><code><?php echo esc_html( $fiveprayer_ifiiri_product->client_id() ); ?></code></td></tr>
		<tr><th>Secret (length)</th><td><?php echo esc_html( (string) strlen( $fiveprayer_ifiiri_product->secret() ) ); ?> characters</td></tr>
		<tr><th>Auth mode</th><td><?php echo esc_html( $fiveprayer_ifiiri_product->auth_mode() ); ?></td></tr>
		<?php $fiveprayer_ifiiri_delivery_obj = \iFiiri\SDK\Delivery::status( $fiveprayer_ifiiri_product ); ?>
		<tr><th>Delivery state</th><td>
			<?php echo esc_html( (string) ( $fiveprayer_ifiiri_delivery_obj['state'] ?? 'no attempts recorded yet' ) ); ?>
			<?php if ( ! empty( $fiveprayer_ifiiri_delivery_obj['reason'] ) ) : ?>
				&mdash; reason: <code><?php echo esc_html( (string) $fiveprayer_ifiiri_delivery_obj['reason'] ); ?></code>
				<?php echo esc_html( (string) ( $fiveprayer_ifiiri_delivery_obj['message'] ?? '' ) ); ?>
			<?php endif; ?>
			<?php if ( \iFiiri\SDK\Delivery::STATE_DISABLED === (string) ( $fiveprayer_ifiiri_delivery_obj['state'] ?? '' ) ) : ?>
				&mdash; <span class="warn">delivery is switched off; after fixing the cause, reset it in wp-admin or via Delivery::reset() before expecting reports again.</span>
			<?php endif; ?>
		</td></tr>
		<tr><th>Last successful sync</th><td><?php echo esc_html( '' !== $fiveprayer_ifiiri_product->last_sync() ? $fiveprayer_ifiiri_product->last_sync() : 'never' ); ?></td></tr>
		<tr><th>Reports waiting in retry queue</th><td><?php echo esc_html( (string) \iFiiri\SDK\Queue::count( $fiveprayer_ifiiri_product ) ); ?>

			<?php if ( \iFiiri\SDK\Queue::count( $fiveprayer_ifiiri_product ) > 0 ) : ?>
				&mdash; <span class="warn">delivery has been failing; the queue drops items after 5 attempts or 7 days.</span>
				<pre><?php echo esc_html( (string) wp_json_encode( \iFiiri\SDK\Queue::all( $fiveprayer_ifiiri_product ), JSON_PRETTY_PRINT ) ); ?></pre>
			<?php endif; ?>
		</td></tr>
	</table>

	<?php if ( ! $fiveprayer_ifiiri_product->is_configured() ) {
		continue;
	} ?>

	<h2>Outbound connectivity from this server</h2>
	<?php
	$fiveprayer_ifiiri_root = (string) wp_parse_url( $fiveprayer_ifiiri_product->endpoint(), PHP_URL_SCHEME ) . '://' . (string) wp_parse_url( $fiveprayer_ifiiri_product->endpoint(), PHP_URL_HOST );

	$fiveprayer_ifiiri_check = wp_remote_get(
		$fiveprayer_ifiiri_root . '/wp-json/',
		array(
			'timeout' => 10,
			'headers' => array( 'User-Agent' => 'iFiiri-SDK-diagnostics/' . IFI_SDK_VERSION ),
		)
	);

	if ( is_wp_error( $fiveprayer_ifiiri_check ) ) {
		echo '<p><span class="bad">FAILED:</span> <code>' . esc_html( $fiveprayer_ifiiri_check->get_error_message() ) . '</code><br>';
		echo 'This server could not even reach the master site. Usual causes: outbound HTTP blocked by the host firewall, DNS failure, or an SSL verification problem (cURL error 60). Ask the host to allow outbound requests to <code>' . esc_html( $fiveprayer_ifiiri_root ) . '</code>.</p>';
	} else {
		$fiveprayer_ifiiri_code = (int) wp_remote_retrieve_response_code( $fiveprayer_ifiiri_check );
		echo '<p><span class="ok">Reachable</span> (HTTP ' . esc_html( (string) $fiveprayer_ifiiri_code ) . ' on GET /wp-json/)</p>';
	}
	?>

	<h2>Signed test report (the real thing the SDK sends)</h2>
	<?php
	// Send the heartbeat payload for real. The transport reports every failure
	// through this action - here we surface it on the page instead of a log.
	$fiveprayer_ifiiri_capture = static function ( $fiveprayer_ifiiri_product, $fiveprayer_ifiiri_code, $fiveprayer_ifiiri_body_or_error ) {
		$GLOBALS['fiveprayer_ifiiri_diag_last'] = array( $fiveprayer_ifiiri_code, $fiveprayer_ifiiri_body_or_error );
	};
	add_action( 'ifiiri_sdk_request_failed', $fiveprayer_ifiiri_capture, 10, 3 );

	$fiveprayer_ifiiri_result = \iFiiri\SDK\Client::send( $fiveprayer_ifiiri_product, 'heartbeat' );
	remove_action( 'ifiiri_sdk_request_failed', $fiveprayer_ifiiri_capture, 10 );

	if ( is_wp_error( $fiveprayer_ifiiri_result ) ) {
		echo '<p><span class="bad">FAILED:</span> <code>' . esc_html( $fiveprayer_ifiiri_result->get_error_code() ) . '</code> &mdash; ' . esc_html( $fiveprayer_ifiiri_result->get_error_message() ) . '</p>';

		$fiveprayer_ifiiri_data = $fiveprayer_ifiiri_result->get_error_data();

		if ( is_array( $fiveprayer_ifiiri_data ) && ! empty( $fiveprayer_ifiiri_data ) ) {
			echo '<p>Master response body:</p><pre>' . esc_html( (string) wp_json_encode( $fiveprayer_ifiiri_data, JSON_PRETTY_PRINT ) ) . '</pre>';
		}

		if ( ! empty( $GLOBALS['fiveprayer_ifiiri_diag_last'] ) ) {
			list( $fiveprayer_ifiiri_code, $fiveprayer_ifiiri_body_or_error ) = $GLOBALS['fiveprayer_ifiiri_diag_last'];

			if ( 0 === (int) $fiveprayer_ifiiri_code && $fiveprayer_ifiiri_body_or_error instanceof \WP_Error ) {
				echo '<p>The request never reached the master. Transport error: <code>' . esc_html( $fiveprayer_ifiiri_body_or_error->get_error_message() ) . '</code></p>';
			}
		}
		?>
		<h2>How to read the failure</h2>
		<table>
			<tr><th>ifiiri_sdk_no_consent</th><td>The local opt-in was never stored. Re-run the opt-in on this site.</td></tr>
			<tr><th>ifiiri_sdk_not_configured</th><td>The endpoint/client id/secret/version settings on this site are empty or wrong.</td></tr>
			<tr><th>ifiiri_missing_credentials (in the master body)</th><td>The master did not see the X-iFiiri-* headers. Your host strips custom headers; the SDK should auto-switch to query-string auth - if it does not, ask the host to stop filtering unknown X- headers.</td></tr>
			<tr><th>ifiiri_unauthorized</th><td>The signature, timestamp or nonce was rejected. Check the secret against the dashboard (rotate it if unsure), and compare the server clocks (the master allows 300s skew by default; fiveprayer and the master must agree within it).</td></tr>
			<tr><th>ifiiri_rate_limited</th><td>Master rate limiting. Settings &rarr; Request security.</td></tr>
			<tr><th>ifiiri_invalid_install_id</th><td>The installation id stored on this site is corrupt; erase the product's options and opt in again.</td></tr>
			<tr><th>cURL error / code 0</th><td>The request never left this server: outbound HTTP is blocked, DNS fails, or SSL verification fails. The host must allow outbound connections to the master.</td></tr>
			<tr><th>403 / HTML instead of JSON</th><td>A WAF, CDN or security plugin blocked the request before WordPress saw it.</td></tr>
		</table>
		<?php
	} else {
		echo '<p><span class="ok">SUCCESS.</span> The master answered:</p><pre>' . esc_html( (string) wp_json_encode( $fiveprayer_ifiiri_result, JSON_PRETTY_PRINT ) ) . '</pre>';
		echo '<p>The installation should now appear in the master dashboard (refresh iFiiri &rarr; Installations). You can also verify the "last seen" column under iFiiri &rarr; Clients.</p>';
	}

	echo '<p><em>Note: this test report is a real heartbeat. On success the master stores the installation row - which is exactly what we want to confirm.</em></p>';

endforeach;
?>
<p style="margin-top:3rem"><strong>Delete this file after use.</strong></p>
</body>
</html>

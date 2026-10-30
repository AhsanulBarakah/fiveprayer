<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound -- Bundled iFiiri SDK: the namespace is part of its public API.
/**
 * Deactivation feedback (client side).
 *
 * WordPress.org guidelines and basic decency both require that feedback is
 * optional: the modal always offers "Skip & Deactivate", which sends nothing and
 * deactivates immediately. This class only provides the server half of that
 * flow - the modal itself is assets/js/ifiiri-client.js.
 *
 * Flow, and why it is shaped this way:
 *   browser -> admin-ajax.php (local, nonce protected) -> signed request to the
 *   master server. The request is fire-and-forget from the browser's point of
 *   view, so deactivation is never blocked by a slow or unreachable server.
 *
 * @package iFiiri\SDK
 */

namespace iFiiri\SDK;

defined( 'ABSPATH' ) || exit;

/**
 * Stores deactivation reasons and forwards them.
 */
final class Deactivation {

	/**
	 * Longest feedback string forwarded.
	 */
	private const MAX_FEEDBACK = 1000;

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'wp_ajax_ifiiri_sdk_deactivate', array( __CLASS__, 'handle_ajax' ) );
	}

	/**
	 * Reason slugs and labels.
	 *
	 * Mirrors iFiiri\Reasons on the server, which validates incoming slugs.
	 *
	 * @return array<string, string>
	 */
	public static function reasons(): array {
		return array(
			'better_plugin' => __( 'Found a better plugin', 'fiveprayer' ),
			'temporary'     => __( 'Temporary deactivation', 'fiveprayer' ),
			'not_working'   => __( "Plugin didn't work", 'fiveprayer' ),
			'broke_site'    => __( 'It broke my site', 'fiveprayer' ),
			'setup_issues'  => __( 'Too hard to set up', 'fiveprayer' ),
			'no_need'       => __( 'No longer need it', 'fiveprayer' ),
			'other'         => __( 'Other', 'fiveprayer' ),
		);
	}

	/**
	 * AJAX: record the reason/feedback for the product being deactivated.
	 *
	 * Always answers success for a well-formed request, even when nothing was
	 * sent, because the browser is about to navigate away either way.
	 */
	public static function handle_ajax(): void {
		if ( ! current_user_can( 'activate_plugins' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'fiveprayer' ) ), 403 );
		}

		check_ajax_referer( 'ifiiri_sdk_deactivate', 'nonce' );

		$slug     = isset( $_POST['product'] ) ? sanitize_key( wp_unslash( $_POST['product'] ) ) : '';
		$reason   = isset( $_POST['reason'] ) ? sanitize_key( wp_unslash( $_POST['reason'] ) ) : '';
		$feedback = isset( $_POST['feedback'] ) ? sanitize_textarea_field( wp_unslash( $_POST['feedback'] ) ) : '';
		$product  = Client::product( $slug );

		if ( ! $product instanceof Product ) {
			wp_send_json_error( array( 'message' => __( 'Unknown product.', 'fiveprayer' ) ), 400 );
		}

		$reasons = self::reasons();
		$reason  = array_key_exists( $reason, $reasons ) ? $reason : 'other';

		$feedback = trim( (string) preg_replace( '/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $feedback ) );
		$feedback = mb_substr( $feedback, 0, self::MAX_FEEDBACK );

		$extra = array(
			'reason'   => $reason,
			'feedback' => $feedback,
		);

		$allowed = $product->is_tracking_allowed();

		/*
		 * Transmit from a shutdown callback, not before responding.
		 *
		 * The browser navigates to the deactivate URL as soon as this response
		 * lands (or after 1.5s, whichever comes first). On CGI/FastCGI a closed
		 * connection aborts the script at its next output, which used to kill the
		 * outgoing request mid-flight and lose the report entirely. Deferring the
		 * send past the response - with the connection abort ignored - means
		 * navigating away can no longer cost us the feedback.
		 *
		 * Measured on a Local (cgi-fcgi) install: the synchronous send failed
		 * whenever the client went away first, the deferred one completed.
		 */
		if ( $allowed ) {
			ignore_user_abort( true );

			add_action(
				'shutdown',
				static function () use ( $product, $extra ) {
					Client::send( $product, 'deactivate', $extra );
				},
				1
			);
		}

		wp_send_json_success(
			array(
				'sent' => $allowed,
			)
		);
	}
}

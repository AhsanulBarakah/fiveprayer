<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound -- Bundled iFiiri SDK: the namespace is part of its public API.
/**
 * WordPress Privacy Tools integration (client side).
 *
 * Hooks the native "Export Personal Data" and "Erase Personal Data" tools so an
 * iFiiri-enabled plugin behaves like a good citizen:
 *
 *  - Export: lists everything the SDK stores locally about the installation
 *    (consent state, anonymous installation id, last report time, licence
 *    status). There is no personal data in it, and saying so in the export is
 *    more useful than returning an empty result.
 *
 *  - Erase: deletes those options, and stops the heartbeat job when no product
 *    is still opted in.
 *
 * Server-side erasure is a separate matter: the master server stores no personal
 * data at all, but an installation record can be deleted there too - see
 * iFiiri\Privacy::erase_install() on the server plugin, exposed as the "Erase"
 * row action on the Installations screen.
 *
 * @package iFiiri\SDK
 */

namespace iFiiri\SDK;

defined( 'ABSPATH' ) || exit;

/**
 * Registers exporters and erasers.
 */
final class Privacy {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_filter( 'wp_privacy_personal_data_exporters', array( __CLASS__, 'register_exporters' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( __CLASS__, 'register_erasers' ) );
	}

	/**
	 * Exporter key, e.g. ifiiri-fiveprayer.
	 *
	 * @param Product $product Product.
	 * @return string
	 */
	public static function key( Product $product ): string {
		return 'ifiiri-' . $product->slug();
	}

	/**
	 * Register one exporter per configured product.
	 *
	 * @param array<string, array<string, mixed>> $exporters Existing exporters.
	 * @return array<string, array<string, mixed>>
	 */
	public static function register_exporters( $exporters ): array {
		$exporters = is_array( $exporters ) ? $exporters : array();

		foreach ( Client::products() as $product ) {
			if ( ! $product->is_configured() ) {
				continue;
			}

			$slug                          = $product->slug();
			$exporters[ self::key( $product ) ] = array(
				'exporter_friendly_name' => sprintf(
					/* translators: %s: plugin name */
					__( '%s usage data (iFiiri)', 'fiveprayer' ),
					$product->name()
				),
				'callback'               => static function ( $email_address, $page = 1 ) use ( $slug ) {
					return self::export( $slug, $page );
				},
			);
		}

		return $exporters;
	}

	/**
	 * Register one eraser per configured product.
	 *
	 * @param array<string, array<string, mixed>> $erasers Existing erasers.
	 * @return array<string, array<string, mixed>>
	 */
	public static function register_erasers( $erasers ): array {
		$erasers = is_array( $erasers ) ? $erasers : array();

		foreach ( Client::products() as $product ) {
			if ( ! $product->is_configured() ) {
				continue;
			}

			$slug                        = $product->slug();
			$erasers[ self::key( $product ) ] = array(
				'eraser_friendly_name' => sprintf(
					/* translators: %s: plugin name */
					__( '%s usage data (iFiiri)', 'fiveprayer' ),
					$product->name()
				),
				'callback'             => static function ( $email_address, $page = 1 ) use ( $slug ) {
					return self::erase( $slug );
				},
			);
		}

		return $erasers;
	}

	/**
	 * Export callback.
	 *
	 * @param string $slug Product slug.
	 * @param int    $page Page number (the data is tiny; always one page).
	 * @return array{data: array<int, array<string, mixed>>, done: bool}
	 */
	public static function export( string $slug, int $page = 1 ): array {
		$product = Client::product( $slug );
		$data    = array();

		if ( $product instanceof Product ) {
			foreach ( $product->exportable() as $label => $value ) {
				$data[] = array(
					'name'  => $label,
					'value' => (string) $value,
				);
			}

			$data[] = array(
				'name'  => __( 'Sent to server', 'fiveprayer' ),
				'value' => $product->is_tracking_allowed()
					? __( 'Yes - anonymous technical data only', 'fiveprayer' )
					: __( 'No - telemetry is disabled', 'fiveprayer' ),
			);
		}

		return array(
			'data' => $data,
			'done' => true,
		);
	}

	/**
	 * Erase callback: drop the local record and stop the cron when it is unused.
	 *
	 * @param string $slug Product slug.
	 * @return array<string, mixed>
	 */
	public static function erase( string $slug ): array {
		$product = Client::product( $slug );

		if ( ! $product instanceof Product ) {
			return array(
				'items_removed'  => false,
				'items_retained' => false,
				'messages'       => array(),
				'done'           => true,
			);
		}

		$product->forget();

		$still_opted_in = false;

		foreach ( Client::products() as $other ) {
			if ( $other->is_tracking_allowed() ) {
				$still_opted_in = true;
				break;
			}
		}

		if ( ! $still_opted_in ) {
			Client::unschedule_cron();
		}

		return array(
			'items_removed'  => true,
			'items_retained' => false,
			'messages'       => array(
				sprintf(
					/* translators: %s: plugin name */
					esc_html__( 'iFiiri data for %s was removed. To also delete the installation record from the telemetry server, open the Installations screen on your master site and use the Erase action.', 'fiveprayer' ),
					$product->name()
				),
			),
			'done'           => true,
		);
	}
}

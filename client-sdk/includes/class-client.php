<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound -- Bundled iFiiri SDK: the namespace is part of its public API.
/**
 * SDK entry point and product registry.
 *
 * One SDK instance serves every iFiiri-enabled plugin on the site: each calls
 * Client::register() with its own slug and credentials, and this class drives the
 * shared machinery (consent prompts, deactivation modal, heartbeat cron, privacy
 * tools) for all of them.
 *
 * @package iFiiri\SDK
 */

namespace iFiiri\SDK;

defined( 'ABSPATH' ) || exit;

/**
 * Registry, activation hooks and event sending.
 */
final class Client {

	/**
	 * Cron hook for the scheduled heartbeat.
	 */
	public const CRON_HOOK = 'ifiiri_sdk_heartbeat';

	/**
	 * Registered products, keyed by slug.
	 *
	 * @var array<string, Product>
	 */
	private static $products = array();

	/**
	 * Whether hooks are already registered.
	 *
	 * @var bool
	 */
	private static $booted = false;

	/**
	 * Register a product. Call this from the plugin's main file.
	 *
	 * @param string               $slug   Unique slug, e.g. the text domain.
	 * @param array<string, mixed> $config Configuration; see the SDK readme.
	 * @return Product
	 */
	public static function register( string $slug, array $config = array() ): Product {
		self::boot();

		$product = new Product( $slug, $config );

		self::$products[ $product->slug() ] = $product;

		self::register_activation_hook( $product );

		return $product;
	}

	/**
	 * A registered product by slug.
	 *
	 * @param string $slug Product slug.
	 * @return Product|null
	 */
	public static function product( string $slug ): ?Product {
		$slug = sanitize_key( $slug );

		return self::$products[ $slug ] ?? null;
	}

	/**
	 * Every registered product.
	 *
	 * @return array<string, Product>
	 */
	public static function products(): array {
		return self::$products;
	}

	/**
	 * Register shared hooks once.
	 */
	public static function boot(): void {
		if ( self::$booted ) {
			return;
		}

		self::$booted = true;

		Consent::register();
		Deactivation::register();
		Privacy::register();
		Queue::register();
		Delivery::register();

		add_action( 'init', array( __CLASS__, 'maybe_schedule_cron' ) );
		add_action( self::CRON_HOOK, array( __CLASS__, 'run_heartbeat' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'enqueue_assets' ) );
	}

	/**
	 * Ask a product to report an event.
	 *
	 * Returns a WP_Error when consent has not been granted - that is the strict
	 * gate: with no consent, nothing is transmitted, ever.
	 *
	 * @param Product              $product Product.
	 * @param string               $event   activate, deactivate or heartbeat.
	 * @param array<string, mixed> $extra   Extra payload fields (reason, feedback).
	 * @return array<string, mixed>|\WP_Error
	 */
	public static function send( Product $product, string $event, array $extra = array() ) {
		if ( ! $product->is_tracking_allowed() ) {
			return new \WP_Error(
				'ifiiri_sdk_no_consent',
				__( 'iFiiri: telemetry is disabled because the site administrator has not opted in.', 'fiveprayer' )
			);
		}

		// Delivery was switched off after the server kept rejecting for an
		// unfixable reason; sending (and queueing) stops until it is reset.
		if ( Delivery::is_disabled( $product ) ) {
			return new \WP_Error(
				'ifiiri_sdk_delivery_disabled',
				__( 'iFiiri: delivery is switched off - see the dashboard notice.', 'fiveprayer' )
			);
		}

		$payload = array_merge( $product->payload( $event ), $extra );
		$result  = Transport::send( $product, $event, $payload );

		// Unreachable or rejected: keep the report and try again on the next
		// request instead of losing it. A policy refusal (no consent) never gets
		// this far - it returns above, so nothing is ever queued without consent.
		if ( is_wp_error( $result ) ) {
			// A mid-flight disable (the master rejected the query fallback with a
			// policy answer) must not leave a dead report in the queue: the
			// disable inside Transport::send() already cleared it.
			if ( ! Delivery::is_disabled( $product ) ) {
				Queue::add( $product, $event, $payload );

				// Recorded after the queue add so degraded vs broken reflects
				// whether a copy of this report is actually still waiting.
				Delivery::record_failure(
					$product,
					(string) $result->get_error_code(),
					(string) $result->get_error_message(),
					0
				);
			}
		}

		return $result;
	}

	/**
	 * Report the activation of a product when consent is already granted.
	 *
	 * @param Product $product Product.
	 * @return array<string, mixed>|\WP_Error|null Null when there is nothing to send.
	 */
	public static function maybe_send_activate( Product $product ) {
		if ( ! $product->is_tracking_allowed() ) {
			return null;
		}

		return self::send( $product, 'activate' );
	}

	/**
	 * Schedule the heartbeat job.
	 */
	public static function maybe_schedule_cron(): void {
		if ( empty( self::$products ) ) {
			return;
		}

		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time() + HOUR_IN_SECONDS, 'daily', self::CRON_HOOK );
		}
	}

	/**
	 * Cron callback: sends a heartbeat for each opted-in product.
	 */
	public static function run_heartbeat(): void {
		foreach ( self::$products as $product ) {
			if ( ! $product->is_configured() || ! $product->is_tracking_allowed() ) {
				continue;
			}

			if ( Delivery::is_disabled( $product ) ) {
				continue; // Dead transport: do not burn attempts daily.
			}

			self::send( $product, 'heartbeat' );
		}
	}

	/**
	 * Drop the shared cron job (used after a full erasure).
	 */
	public static function unschedule_cron(): void {
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	/**
	 * Hook the product's activation so consent is requested at the right moment.
	 *
	 * @param Product $product Product.
	 */
	private static function register_activation_hook( Product $product ): void {
		$file = $product->plugin_file();

		if ( '' === $file ) {
			return;
		}

		$slug = $product->slug();

		register_activation_hook(
			$file,
			static function () use ( $slug ) {
				$product = self::product( $slug );

				if ( ! $product instanceof Product ) {
					return;
				}

				// Fresh activation with no decision yet: prompt with the modal.
				if ( Product::CONSENT_PENDING === $product->consent() && $product->asks_for_consent() ) {
					$product->set( 'notice', 'modal' );
				}

				self::maybe_schedule_cron();

				// Never resets a previous "no" and never sends without consent.
				self::maybe_send_activate( $product );
			}
		);
	}

	/**
	 * Enqueue the SDK's CSS/JS on admin screens and hand the browser its config.
	 *
	 * The secret is deliberately absent from the localized data.
	 */
	public static function enqueue_assets(): void {
		if ( empty( self::$products ) ) {
			return;
		}

		$current = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		$screen  = $current ? (string) $current->id : '';
		$needs   = ( 'plugins' === $screen || 'plugins-network' === $screen );

		foreach ( self::$products as $product ) {
			if ( Product::CONSENT_PENDING === $product->consent() && $product->asks_for_consent() ) {
				$needs = true;
				break;
			}
		}

		if ( ! $needs ) {
			return;
		}

		wp_enqueue_style( 'ifiiri-client', IFI_SDK_URL . 'assets/css/ifiiri-client.css', array(), IFI_SDK_VERSION );
		wp_enqueue_script( 'ifiiri-client', IFI_SDK_URL . 'assets/js/ifiiri-client.js', array(), IFI_SDK_VERSION, true );

		wp_localize_script(
			'ifiiri-client',
			'ifiiriSDK',
			array(
				'ajaxUrl'   => admin_url( 'admin-ajax.php' ),
				'consentNonce' => wp_create_nonce( 'ifiiri_sdk_consent' ),
				'deactivateNonce' => wp_create_nonce( 'ifiiri_sdk_deactivate' ),
				'products'  => self::localized_products(),
				'reasons'   => Deactivation::reasons(),
				'i18n'      => array(
					'noThanks'        => __( 'No thanks', 'fiveprayer' ),
					'error'           => __( 'Something went wrong. Your choice was not saved.', 'fiveprayer' ),
					'noConsent'       => __( 'Anonymous usage reporting is switched off on this site, so this comment will not be sent. Opt in on the iFiiri notice first if you want it delivered.', 'fiveprayer' ),
				),
			)
		);
	}

	/**
	 * Product data for the browser: slugs, basenames and prompt state only.
	 *
	 * @return array<int, array<string, mixed>>
	 */
	private static function localized_products(): array {
		$out = array();

		foreach ( self::$products as $product ) {
			$out[] = array(
				'slug'        => $product->slug(),
				'name'        => $product->name(),
				'basename'    => $product->plugin_basename(),
				'prompt'      => ( Product::CONSENT_PENDING === $product->consent() && $product->asks_for_consent() ),
				'notice'      => (string) $product->get( 'notice', '' ),
				'tracking'    => $product->is_tracking_allowed(),
				'configured'  => $product->is_configured(),
				'host'        => (string) wp_parse_url( $product->endpoint(), PHP_URL_HOST ),
			);
		}

		return $out;
	}
}

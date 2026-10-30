<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound -- Bundled iFiiri SDK: the namespace is part of its public API.
/**
 * Strict opt-in consent, client side.
 *
 * The rules this class implements:
 *  - telemetry is OFF until the administrator explicitly clicks "Opt in",
 *  - the prompt appears after activation and explains, in plain language, exactly
 *    what would be sent and what never leaves the site,
 *  - declining is a first-class choice: no nagging, no re-asking, nothing sent,
 *  - the decision can be changed later (see the SDK readme) and is stored per
 *    product, not per site.
 *
 * Nothing here transmits on its own. It only records the decision; the first
 * report (the "activate" event) is sent after an opt-in, which is what makes the
 * consent record auditable.
 *
 * @package iFiiri\SDK
 */

namespace iFiiri\SDK;

defined( 'ABSPATH' ) || exit;

/**
 * The opt-in modal / notice and its handlers.
 */
final class Consent {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'admin_notices', array( __CLASS__, 'render' ) );
		add_action( 'wp_ajax_ifiiri_sdk_consent', array( __CLASS__, 'handle_ajax' ) );
		add_action( 'admin_init', array( __CLASS__, 'register_policy_content' ) );
	}

	/**
	 * Should this user be shown any consent UI at all?
	 *
	 * @return bool
	 */
	private static function should_render(): bool {
		if ( ! current_user_can( 'manage_options' ) ) {
			return false;
		}

		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		foreach ( Client::products() as $product ) {
			if ( Product::CONSENT_PENDING === $product->consent() && $product->asks_for_consent() && $product->is_configured() ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Output the prompt: a modal on first activation, a slim notice afterwards.
	 */
	public static function render(): void {
		if ( ! self::should_render() ) {
			return;
		}

		$current = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		$screen  = $current ? (string) $current->id : '';

		foreach ( Client::products() as $product ) {
			if ( Product::CONSENT_PENDING !== $product->consent() || ! $product->asks_for_consent() || ! $product->is_configured() ) {
				continue;
			}

			$notice = (string) $product->get( 'notice', '' );

			// A modal on the first pages after activation, then a slim notice.
			if ( 'modal' === $notice && ! self::is_settings_screen( $screen, $product ) ) {
				self::render_modal( $product );
				continue;
			}

			self::render_slim_notice( $product );
		}
	}

	/**
	 * Whether the current screen belongs to the product (its own settings page).
	 *
	 * @param string  $screen  Current screen id.
	 * @param Product $product Product.
	 * @return bool
	 */
	private static function is_settings_screen( string $screen, Product $product ): bool {
		return false !== strpos( $screen, $product->slug() );
	}

	/**
	 * The full consent modal.
	 *
	 * @param Product $product Product.
	 */
	private static function render_modal( Product $product ): void {
		$host    = (string) wp_parse_url( $product->endpoint(), PHP_URL_HOST );
		$slug    = $product->slug();
		?>
		<div class="ifiiri-modal" id="ifiiri-consent-modal-<?php echo esc_attr( $slug ); ?>" role="dialog" aria-modal="true" aria-labelledby="ifiiri-consent-title-<?php echo esc_attr( $slug ); ?>">
			<div class="ifiiri-modal__panel">
				<h2 class="ifiiri-modal__title" id="ifiiri-consent-title-<?php echo esc_attr( $slug ); ?>">
					<?php
					printf(
						/* translators: %s: plugin name */
						esc_html__( 'Help improve %s', 'fiveprayer' ),
						esc_html( $product->name() )
					);
					?>
				</h2>

				<p class="ifiiri-modal__lede">
					<?php
					printf(
						/* translators: 1: plugin name, 2: server host */
						esc_html__( 'May %1$s send a few anonymous details about this site to %2$s? It helps us decide which WordPress and PHP versions to keep supporting, and shows us why people switch the plugin off.', 'fiveprayer' ),
						esc_html( $product->name() ),
						esc_html( '' !== $host ? $host : __( 'our server', 'fiveprayer' ) )
					);
					?>
				</p>

				<div class="ifiiri-modal__columns">						<div class="ifiiri-modal__column ifiiri-modal__column--sent">
							<h3><?php esc_html_e( 'What we\'d receive', 'fiveprayer' ); ?></h3>
							<ul>
								<li><?php esc_html_e( 'Which plugin, WordPress and PHP versions you run', 'fiveprayer' ); ?></li>
								<li><?php esc_html_e( 'Your site\'s URL and language', 'fiveprayer' ); ?></li>
								<li><?php esc_html_e( 'Whether it is a multisite network', 'fiveprayer' ); ?></li>
								<li><?php esc_html_e( 'Your reason for deactivating, only if you tell us', 'fiveprayer' ); ?></li>
							</ul>
						</div>
						<div class="ifiiri-modal__column ifiiri-modal__column--never">
							<h3><?php esc_html_e( 'What we never receive', 'fiveprayer' ); ?></h3>
							<ul>
								<li><?php esc_html_e( 'Email addresses or user names', 'fiveprayer' ); ?></li>
								<li><?php esc_html_e( 'Passwords, orders or customer data', 'fiveprayer' ); ?></li>
								<li><?php esc_html_e( 'Your posts, pages or content of any kind', 'fiveprayer' ); ?></li>
								<li><?php esc_html_e( 'Your IP address (only a one-way hash, for rate limiting)', 'fiveprayer' ); ?></li>
							</ul>
						</div>
				</div>

				<p class="ifiiri-modal__note">
					<?php esc_html_e( 'Your choice is entirely up to you. Nothing leaves this site until you opt in, and if you change your mind later, opting out stops everything immediately.', 'fiveprayer' ); ?>
				</p>

				<div class="ifiiri-modal__actions">
					<button type="button" class="button button-primary button-hero" data-ifiiri-consent="yes" data-ifiiri-product="<?php echo esc_attr( $slug ); ?>">
						<?php esc_html_e( 'Yes, share anonymous data', 'fiveprayer' ); ?>
					</button>
					<button type="button" class="button button-hero" data-ifiiri-consent="no" data-ifiiri-product="<?php echo esc_attr( $slug ); ?>">
						<?php esc_html_e( 'No thanks', 'fiveprayer' ); ?>
					</button>
					<button type="button" class="button-link" data-ifiiri-consent="later" data-ifiiri-product="<?php echo esc_attr( $slug ); ?>">
						<?php esc_html_e( 'Not now', 'fiveprayer' ); ?>
					</button>
				</div>

				<p class="ifiiri-modal__state" role="status" aria-live="polite" data-ifiiri-state="<?php echo esc_attr( $slug ); ?>"></p>
			</div>
		</div>
		<?php
	}

	/**
	 * The slim, persistent notice shown on later page loads.
	 *
	 * @param Product $product Product.
	 */
	private static function render_slim_notice( Product $product ): void {
		$slug   = $product->slug();
		?>
		<div class="notice notice-info ifiiri-notice" id="ifiiri-consent-notice-<?php echo esc_attr( $slug ); ?>">
			<p>
				<strong>
					<?php
					printf(
						/* translators: %s: plugin name */
						esc_html__( 'Help improve %s - share anonymous usage data?', 'fiveprayer' ),
						esc_html( $product->name() )
					);
					?>
				</strong>
				<?php esc_html_e( 'Just versions, site URL and language - never your content, users or emails. Nothing is sent while this stays undecided.', 'fiveprayer' ); ?>
			</p>
			<p>
				<button type="button" class="button button-primary" data-ifiiri-consent="yes" data-ifiiri-product="<?php echo esc_attr( $slug ); ?>"><?php esc_html_e( 'Share anonymous data', 'fiveprayer' ); ?></button>
				<button type="button" class="button" data-ifiiri-consent="no" data-ifiiri-product="<?php echo esc_attr( $slug ); ?>"><?php esc_html_e( 'No thanks', 'fiveprayer' ); ?></button>
				<button type="button" class="button-link" data-ifiiri-consent="later" data-ifiiri-product="<?php echo esc_attr( $slug ); ?>"><?php esc_html_e( 'Not now', 'fiveprayer' ); ?></button>
				<span class="ifiiri-modal__state" role="status" aria-live="polite" data-ifiiri-state="<?php echo esc_attr( $slug ); ?>"></span>
			</p>
		</div>
		<?php
	}

	/**
	 * AJAX: store the decision, and report the activation when opting in.
	 */
	public static function handle_ajax(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_send_json_error( array( 'message' => __( 'Permission denied.', 'fiveprayer' ) ), 403 );
		}

		check_ajax_referer( 'ifiiri_sdk_consent', 'nonce' );

		$slug     = isset( $_POST['product'] ) ? sanitize_key( wp_unslash( $_POST['product'] ) ) : '';
		$decision = isset( $_POST['decision'] ) ? sanitize_key( wp_unslash( $_POST['decision'] ) ) : '';
		$product  = Client::product( $slug );

		if ( ! $product instanceof Product ) {
			wp_send_json_error( array( 'message' => __( 'Unknown product.', 'fiveprayer' ) ), 400 );
		}

		if ( 'later' === $decision ) {
			$product->set( 'notice', 'slim' );

			wp_send_json_success(
				array(
					'state'   => Product::CONSENT_PENDING,
					'message' => __( 'No data will be sent until you decide.', 'fiveprayer' ),
				)
			);
		}

		if ( 'yes' === $decision ) {
			$product->set_consent( Product::CONSENT_YES );
			$product->set( 'notice', '' );
			$product->install_id();

			// First report, so the consent decision is on record server-side.
			$result = Client::send( $product, 'activate' );

			wp_send_json_success(
				array(
					'state'   => Product::CONSENT_YES,
					'message' => is_wp_error( $result )
						? (string) $result->get_error_message() // e.g. the delivery-disabled reason - the admin needs it now.
						: __( 'Thanks! Anonymous usage data is now enabled.', 'fiveprayer' ),
				)
			);
		}

		if ( 'no' === $decision ) {
			$product->set_consent( Product::CONSENT_NO );
			$product->set( 'notice', '' );

			// Withdrawing consent must also discard anything already waiting to be
			// sent, otherwise a queued report would outlive the permission.
			Queue::clear( $product );

			wp_send_json_success(
				array(
					'state'   => Product::CONSENT_NO,
					'message' => __( 'Understood - nothing will be sent.', 'fiveprayer' ),
				)
			);
		}

		wp_send_json_error( array( 'message' => __( 'Unrecognised decision.', 'fiveprayer' ) ), 400 );
	}

	/**
	 * Suggested privacy policy text for the client site.
	 */
	public static function register_policy_content(): void {
		if ( ! function_exists( 'wp_add_privacy_policy_content' ) ) {
			return;
		}

		$names = array();

		foreach ( Client::products() as $product ) {
			$names[] = $product->name();
		}

		if ( empty( $names ) ) {
			return;
		}

		$content  = '<p>' . esc_html__( 'Some plugins on this site can send anonymous usage data to the plugin author. Sharing is opt-in and off by default.', 'fiveprayer' ) . '</p>';
		$content .= '<p>' . sprintf(
			/* translators: %s: comma separated plugin names */
			esc_html__( 'Plugins that support it: %s.', 'fiveprayer' ),
			esc_html( implode( ', ', $names ) )
		) . '</p>';
		$content .= '<ul>';
		$content .= '<li>' . esc_html__( 'What is shared: plugin, WordPress and PHP versions, site URL, locale, multisite flag, and deactivation feedback if you submit it.', 'fiveprayer' ) . '</li>';
		$content .= '<li>' . esc_html__( 'What is never shared: email addresses, user names, passwords, content, orders, database details or your IP address.', 'fiveprayer' ) . '</li>';
		$content .= '<li>' . esc_html__( 'Withdrawing consent stops all further reports immediately; you can also use the Erase Personal Data tool to clear the local record.', 'fiveprayer' ) . '</li>';
		$content .= '</ul>';

		wp_add_privacy_policy_content(
			__( 'Anonymous usage data', 'fiveprayer' ),
			wp_kses_post( wpautop( $content, false ) )
		);
	}
}

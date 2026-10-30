<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound -- Bundled iFiiri SDK: the namespace is part of its public API.
/**
 * Local, privacy-safe record of delivery outcomes.
 *
 * The transport fails soft by design, and the retry queue keeps every failure
 * invisible: an admin whose host blocks outbound HTTP or strips the signed
 * headers sees nothing but an empty dashboard on the master site. This class
 * closes that gap without changing the fail-soft contract.
 *
 * What is recorded, per product, in one option (never autoloaded):
 *
 *  - state: ok | degraded | broken | disabled
 *    ok        last signed request succeeded,
 *    degraded  it failed, but the retry queue still holds a copy,
 *    broken    it failed and the queue is empty (the report was dropped),
 *    disabled  delivery is switched off entirely (see below),
 *  - a short machine-readable reason plus a human message,
 *  - when it last failed and when it last succeeded.
 *
 * What is deliberately never recorded: URLs, payloads, secrets or raw server
 * responses - nothing that could leak site data through an admin notice.
 *
 * The admin notice appears only for administrators, only in wp-admin, and only
 * while the state is not ok. It deliberately has no mute or dismiss control:
 * a silent dashboard is how undelivered reports went unnoticed historically,
 * so the notice stays until the underlying problem is actually fixed.
 *
 * Option names: ifiiri_{slug}_delivery.
 *
 * @package iFiiri\SDK
 */

namespace iFiiri\SDK;

defined( 'ABSPATH' ) || exit;

/**
 * Records and surfaces delivery failures in the admin.
 */
final class Delivery {

	/**
	 * State key used on the product.
	 */
	private const KEY_STATE = 'delivery';

	/**
	 * Delivery states.
	 */
	public const STATE_OK       = 'ok';
	public const STATE_DEGRADED = 'degraded';
	public const STATE_BROKEN   = 'broken';
	public const STATE_DISABLED = 'disabled';

	/**
	 * How long a "delivery disabled" state blocks sending before the transport
	 * is allowed to probe the master again. Self-healing: if the server has
	 * since been fixed, the next report goes through; if not, the state is
	 * simply re-recorded.
	 */
	private const DISABLED_TTL = WEEK_IN_SECONDS;

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		self::clear_legacy_mutes();
		add_action( 'admin_notices', array( __CLASS__, 'render_notice' ) );
	}

	/**
	 * Record a successful delivery.
	 *
	 * @param Product $product Product whose report was delivered.
	 */
	public static function record_success( Product $product ): void {
		$stored = self::read( $product );

		if ( self::STATE_OK === (string) ( $stored['state'] ?? '' ) ) {
			return; // Nothing new to record.
		}

		self::save(
			$product,
			array(
				'state'        => self::STATE_OK,
				'reason'       => '',
				'message'      => '',
				'code'         => 0,
				'failed_at'    => 0,
				'succeeded_at' => time(),
				'updated_at'   => time(),
			)
		);
	}

	/**
	 * Record a failed delivery attempt.
	 *
	 * @param Product $product Product whose report failed.
	 * @param string  $reason  Machine-readable failure reason (error code or http status slug).
	 * @param string  $message Human-readable summary shown in the admin notice.
	 * @param int     $code    HTTP status, or 0 when the request never left the site.
	 */
	public static function record_failure( Product $product, string $reason, string $message, int $code = 0 ): void {
		// Disabled is final: the master kept rejecting for a reason no retry can
		// fix, so a later failure must not quietly resurrect the notice state.
		if ( self::is_disabled( $product ) ) {
			return;
		}

		$state = Queue::count( $product ) > 0 ? self::STATE_DEGRADED : self::STATE_BROKEN;

		self::save(
			$product,
			array(
				'state'        => $state,
				'reason'       => substr( $reason, 0, 64 ),
				'message'      => substr( $message, 0, 191 ),
				'code'         => max( 0, $code ),
				'failed_at'    => time(),
				'succeeded_at' => 0,
				'updated_at'   => time(),
			)
		);
	}

	/**
	 * Switch delivery off for a product until the site owner acts.
	 *
	 * Used when the master explicitly rejects the transport because the query
	 * fallback it needs is disabled server-side: retrying cannot succeed and
	 * would only burn the retry budget, so the queue is drained instead.
	 *
	 * @param Product $product Product.
	 * @param string  $reason  Machine-readable reason.
	 * @param string  $message Human-readable summary shown in the admin notice.
	 */
	public static function record_disabled( Product $product, string $reason, string $message ): void {
		Queue::clear( $product );

		self::save(
			$product,
			array(
				'state'        => self::STATE_DISABLED,
				'reason'       => substr( $reason, 0, 64 ),
				'message'      => substr( $message, 0, 191 ),
				'code'         => 401,
				'failed_at'    => time(),
				'succeeded_at' => 0,
				'updated_at'   => time(),
			)
		);
	}

	/**
	 * Whether sending is currently blocked by a recorded disabled state.
	 *
	 * @param Product $product Product.
	 * @return bool
	 */
	public static function is_disabled( Product $product ): bool {
		$stored = self::read( $product );

		if ( self::STATE_DISABLED !== (string) ( $stored['state'] ?? '' ) ) {
			return false;
		}

		// Expire: give the transport a probe every DISABLED_TTL so a fixed
		// master is picked up without anyone having to remember a reset.
		$updated = (int) ( $stored['updated_at'] ?? 0 );

		return $updated > 0 && $updated + self::DISABLED_TTL >= time();
	}

	/**
	 * Clear the delivery record so sending resumes immediately.
	 *
	 * Call after fixing the cause of a failure (host firewall, rotated secret,
	 * disabled query auth on the master) instead of waiting for the TTL.
	 *
	 * @param Product $product Product.
	 */
	public static function reset( Product $product ): void {
		$product->forget_key( self::KEY_STATE );
	}

	/**
	 * Full delivery state for one product.
	 *
	 * @param Product $product Product.
	 * @return array<string, mixed>
	 */
	public static function status( Product $product ): array {
		return self::read( $product );
	}

	/**
	 * Admin notice while delivery is not healthy.
	 */
	public static function render_notice(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		$problem = null;

		foreach ( Client::products() as $product ) {
			$stored = self::read( $product );
			$state  = (string) ( $stored['state'] ?? '' );

			// Only real failures surface; "ok" and "no news yet" stay quiet.
			if ( '' === $state || self::STATE_OK === $state ) {
				continue;
			}

			$problem = array( $product, $stored );
			break;
		}

		if ( null === $problem ) {
			return;
		}

		list( $product, $stored ) = $problem;

		$failed_at = (int) ( $stored['failed_at'] ?? 0 );
		?>
		<div class="notice notice-warning ifiiri-delivery-notice">
			<p>
				<strong><?php echo esc_html( sprintf( /* translators: %s: plugin name */ __( 'iFiiri telemetry (%s) cannot reach its reporting server.', 'fiveprayer' ), $product->name() ) ); ?></strong>
				<?php echo esc_html( (string) ( $stored['message'] ?? '' ) ); ?>
			</p>
			<p class="ifiiri-delivery-notice__meta">
				<?php
				printf(
					/* translators: 1: machine reason, 2: date and time */
					esc_html__( 'Reason: %1$s. Last failure: %2$s.', 'fiveprayer' ),
					'<code>' . esc_html( (string) ( $stored['reason'] ?? '' ) ) . '</code>',
					esc_html( $failed_at > 0 ? date_i18n( 'j M Y, H:i', $failed_at ) : __( 'unknown', 'fiveprayer' ) )
				);
				?>
				&middot;
				<?php esc_html_e( 'This notice stays until delivery works again. It cannot be muted.', 'fiveprayer' ); ?>
			</p>
		</div>
		<?php
	}

	/**
	 * Clear any stale mute flags left by earlier SDK versions.
	 *
	 * The notice no longer supports muting; the per-user options it used are
	 * dead weight, so they are removed wherever the notice logic runs.
	 */
	public static function clear_legacy_mutes(): void {
		global $wpdb;

		$like = $wpdb->esc_like( 'ifiiri_delivery_notice_muted_' ) . '%';

		// phpcs:ignore WordPress.DB.DirectDatabaseQuery -- One-time cleanup of removed options.
		$keys = $wpdb->get_col(
			$wpdb->prepare( "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s", $like )
		);

		foreach ( (array) $keys as $key ) {
			delete_option( (string) $key );
		}
	}

	/**
	 * Read a product's delivery record.
	 *
	 * @param Product $product Product.
	 * @return array<string, mixed>
	 */
	private static function read( Product $product ): array {
		$stored = $product->get( self::KEY_STATE, array() );

		return is_array( $stored ) ? $stored : array();
	}

	/**
	 * Persist a delivery record.
	 *
	 * @param Product              $product Product.
	 * @param array<string, mixed> $record  Record to store.
	 */
	private static function save( Product $product, array $record ): void {
		$product->set( self::KEY_STATE, $record );
	}
}

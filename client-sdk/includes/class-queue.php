<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound -- Bundled iFiiri SDK: the namespace is part of its public API.
/**
 * Retry queue for reports that could not be delivered.
 *
 * A premium plugin must never depend on the master server being reachable at the
 * exact moment something happens. Every report that fails is therefore kept in a
 * small per-product queue and tried again on the next admin page load, with the
 * daily heartbeat as the backstop for sites nobody logs into.
 *
 * Rules, all of them deliberate:
 *
 *  - nothing is queued while consent is pending or denied. The consent gate lives
 *    in {@see Client::send()} and is checked again here before every attempt, so a
 *    queued report can never outlive the permission that produced it.
 *  - at most {@see Queue::MAX_ITEMS} events per product; the oldest is dropped,
 *    so an unreachable server cannot fill the options table.
 *  - an item is attempted at most {@see Queue::MAX_ATTEMPTS} times and expires
 *    after {@see Queue::MAX_AGE}, after which it is discarded silently.
 *  - a failed attempt stops the flush, in order, because the usual cause is that
 *    the whole network is down; hammering it only slows the site down.
 *
 * Option name: ifiiri_{slug}_queue (never autoloaded).
 *
 * @package iFiiri\SDK
 */

namespace iFiiri\SDK;

defined( 'ABSPATH' ) || exit;

/**
 * Stores and replays undelivered reports.
 */
final class Queue {

	/**
	 * State key used on the product.
	 */
	private const KEY = 'queue';

	/**
	 * Most events kept per product.
	 */
	private const MAX_ITEMS = 5;

	/**
	 * Attempts allowed per event before it is abandoned.
	 */
	private const MAX_ATTEMPTS = 5;

	/**
	 * How long a queued event stays worth sending.
	 */
	private const MAX_AGE = WEEK_IN_SECONDS;

	/**
	 * Register the flush hooks.
	 */
	public static function register(): void {
		// The next admin page load is the earliest opportunity; the heartbeat is
		// the backstop. Front-end requests are deliberately left alone: a visitor
		// should never wait on someone else's telemetry.
		add_action( 'admin_init', array( __CLASS__, 'flush_all' ) );
		add_action( Client::CRON_HOOK, array( __CLASS__, 'flush_all' ), 5 );
	}

	/**
	 * Queue a report that could not be sent.
	 *
	 * @param Product              $product Product.
	 * @param string               $route   Route base: activate, deactivate or heartbeat.
	 * @param array<string, mixed> $payload Payload exactly as it was attempted.
	 */
	public static function add( Product $product, string $route, array $payload ): void {
		$items   = self::load( $product );
		$items[] = array(
			'route'     => sanitize_key( $route ),
			'payload'   => $payload,
			'attempts'  => 0,
			'queued_at' => time(),
		);

		if ( count( $items ) > self::MAX_ITEMS ) {
			$items = array_slice( $items, -self::MAX_ITEMS );
		}

		self::save( $product, $items );
	}

	/**
	 * Everything currently waiting for this product.
	 *
	 * @param Product $product Product.
	 * @return array<int, array<string, mixed>>
	 */
	public static function all( Product $product ): array {
		return self::load( $product );
	}

	/**
	 * How many reports are waiting.
	 *
	 * @param Product $product Product.
	 * @return int
	 */
	public static function count( Product $product ): int {
		return count( self::load( $product ) );
	}

	/**
	 * Drop everything queued for a product (used when consent is withdrawn).
	 *
	 * @param Product $product Product.
	 */
	public static function clear( Product $product ): void {
		self::save( $product, array() );
	}

	/**
	 * Flush every registered product.
	 */
	public static function flush_all(): void {
		foreach ( Client::products() as $product ) {
			self::flush( $product );
		}
	}

	/**
	 * Try to deliver this product's queued reports, oldest first.
	 *
	 * @param Product $product Product.
	 */
	public static function flush( Product $product ): void {
		$items = self::load( $product );

		if ( empty( $items ) ) {
			return;
		}

		// Consent is the gate that matters: a queued report is never sent if the
		// site has since withdrawn (or never given) permission.
		if ( ! $product->is_tracking_allowed() || ! $product->is_configured() ) {
			return;
		}

		// Delivery was switched off after the server kept rejecting for a reason
		// no retry can fix: stop burning the attempts budget on dead reports.
		if ( Delivery::is_disabled( $product ) ) {
			return;
		}

		$now   = time();
		$total = count( $items );

		for ( $index = 0; $index < $total; $index++ ) {
			$item = $items[ $index ];

			// Too old, or tried too often: give up on this one for good.
			if ( (int) $item['queued_at'] + self::MAX_AGE < $now || (int) $item['attempts'] >= self::MAX_ATTEMPTS ) {
				continue;
			}

			$result = Transport::send( $product, (string) $item['route'], (array) $item['payload'] );

			if ( ! is_wp_error( $result ) ) {
				continue; // Delivered - drop it.
			}

			// Still unreachable. Keep this event and everything behind it, in
			// order, and stop: the connection is probably down entirely.
			$items[ $index ]['attempts'] = (int) $item['attempts'] + 1;

			self::save( $product, array_slice( $items, $index ) );

			return;
		}

		self::save( $product, array() );
	}

	/**
	 * Read and validate the stored queue.
	 *
	 * @param Product $product Product.
	 * @return array<int, array<string, mixed>>
	 */
	private static function load( Product $product ): array {
		$stored = $product->get( self::KEY, array() );

		if ( ! is_array( $stored ) ) {
			return array();
		}

		$items = array();

		foreach ( $stored as $item ) {
			if ( ! is_array( $item ) || empty( $item['route'] ) || empty( $item['payload'] ) || ! is_array( $item['payload'] ) ) {
				continue;
			}

			$items[] = array(
				'route'     => sanitize_key( (string) $item['route'] ),
				'payload'   => (array) $item['payload'],
				'attempts'  => isset( $item['attempts'] ) ? max( 0, (int) $item['attempts'] ) : 0,
				'queued_at' => isset( $item['queued_at'] ) ? (int) $item['queued_at'] : 0,
			);
		}

		return $items;
	}

	/**
	 * Persist the queue.
	 *
	 * @param Product                         $product Product.
	 * @param array<int, array<string, mixed>> $items  Items to store.
	 */
	private static function save( Product $product, array $items ): void {
		if ( empty( $items ) ) {
			$product->forget_key( self::KEY );

			return;
		}

		$product->set( self::KEY, array_values( $items ) );
	}
}

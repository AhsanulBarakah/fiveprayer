<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound -- Bundled iFiiri SDK: the namespace is part of its public API.
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Bundled iFiiri SDK: hook name is part of its public API.
/**
 * Signed HTTP transport (client -> master server).
 *
 * The SDK mirrors the server's signing scheme exactly:
 *
 *   canonical = METHOD \n route \n timestamp \n nonce \n sha256(raw body)
 *   signature = hash_hmac('sha256', canonical, secret)
 *
 * The secret never leaves PHP: JavaScript talks to admin-ajax.php on the local
 * site, and the signed request is made here instead. A legitimate reason to keep
 * it that way - anything the browser holds can be read by anyone who opens dev
 * tools or a plugin file.
 *
 * Requests fail soft by design. A premium plugin must keep working perfectly
 * when the master site is unreachable, so every error is returned as WP_Error and
 * broadcast through the `ifiiri_sdk_request_failed` action instead of throwing.
 * Every failure is also recorded by {@see Delivery}, which surfaces it as an
 * admin notice instead of leaving the retry queue as the only witness.
 *
 * @package iFiiri\SDK
 */

namespace iFiiri\SDK;

defined( 'ABSPATH' ) || exit;

/**
 * Builds and sends signed requests.
 */
final class Transport {

	/**
	 * Request timeout in seconds. Short on purpose: this runs during admin requests.
	 */
	private const TIMEOUT = 10;

	/**
	 * REST namespace of the master API, used to build fallback URLs from a
	 * plain site URL.
	 */
	private const REST_NAMESPACE = 'ifiiri/v1';

	/**
	 * Build the canonical string exactly like the server does.
	 *
	 * @param string $method    HTTP method.
	 * @param string $route     REST route without a leading slash.
	 * @param string $timestamp Unix timestamp.
	 * @param string $nonce     Per-request nonce.
	 * @param string $body      Raw JSON body.
	 * @return string
	 */
	public static function canonical( string $method, string $route, string $timestamp, string $nonce, string $body ): string {
		return implode(
			"\n",
			array(
				strtoupper( $method ),
				ltrim( $route, '/' ),
				$timestamp,
				$nonce,
				hash( 'sha256', $body ),
			)
		);
	}

	/**
	 * Send an event to the master server.
	 *
	 * @param Product              $product Product configuration.
	 * @param string               $route   Route base: activate, deactivate or heartbeat.
	 * @param array<string, mixed> $payload Payload built by the product.
	 * @return array<string, mixed>|\WP_Error Decoded response body or error.
	 */
	public static function send( Product $product, string $route, array $payload ) {
		// A disabled delivery (the master kept rejecting because its query fallback
		// is off) is final: stop early instead of retrying every admin page load.
		if ( Delivery::is_disabled( $product ) ) {
			return new \WP_Error(
				'ifiiri_sdk_delivery_disabled',
			__( 'iFiiri: delivery was switched off after the server kept rejecting the signed requests. See the dashboard notice for the reason.', 'fiveprayer' )
			);
		}

		if ( ! $product->is_configured() ) {
			return new \WP_Error(
				'ifiiri_sdk_not_configured',
				__( 'iFiiri: endpoint, client id, secret and version are all required.', 'fiveprayer' )
			);
		}

		$override = $product->endpoint_override();
		$url      = self::endpoint_url( $product, $route, $override );
		$body     = (string) wp_json_encode( $payload );
		$sent     = self::request( $product, $url, $body );

		// A loopback endpoint (localhost / 127.0.0.1 / *.local / *.test) that
		// cannot be connected to at all usually means the PHP process is isolated
		// from the web server that publishes the master site - typical for
		// containerised local dev stacks such as Local (LocalWP), where PHP cannot
		// reach the host's published port and "localhost" inside the container is
		// not the master. The site's own REST URL resolves inside that network,
		// so retry against it (plus any configured fallback endpoints) before
		// giving up.
		if ( is_wp_error( $sent ) && self::is_connect_failure( $sent ) ) {
			// A remembered override that no longer answers is dropped so the
			// normal endpoint gets another chance on the next request.
			if ( '' !== $override ) {
				$product->forget_key( 'endpoint_override' );
			}

			foreach ( self::fallback_urls( $product, $route ) as $fallback ) {
				if ( self::same_url( $fallback['url'], $url ) ) {
					continue;
				}

				$sent = self::request( $product, $fallback['url'], $body );

				if ( ! is_wp_error( $sent ) ) {
					// Remember the working base so future requests skip the dead
					// primary attempt entirely.
					$product->use_endpoint_override( $fallback['base'] );

					break;
				}

				if ( ! self::is_connect_failure( $sent ) ) {
					break;
				}
			}
		}

		if ( is_wp_error( $sent ) ) {
			return $sent;
		}

		$code = (int) wp_remote_retrieve_response_code( $sent );

		// Hosts that strip custom headers answer "missing credentials". Detect it
		// once and fall back to query-string signing for this product from then on.
		if ( 401 === $code && 'headers' === $product->auth_mode() && self::is_missing_credentials( $sent ) ) {
			$product->use_query_auth();
			$sent = self::request( $product, $url, $body );

			if ( ! is_wp_error( $sent ) ) {
				$code = (int) wp_remote_retrieve_response_code( $sent );
			}

			// Still "missing credentials" in query mode: the master has its
			// query-string fallback disabled, so no retry can ever succeed.
			// Disable delivery for this product and stop queueing dead reports.
			if ( ! is_wp_error( $sent ) && 401 === $code && self::is_missing_credentials( $sent ) ) {
				$error = new \WP_Error(
					'ifiiri_sdk_query_auth_disabled',
					__( 'iFiiri: the reporting server is not accepting query-string credentials. Enable "Allow signed credentials in the query string" on the server\'s iFiiri Settings screen, or ask the client host to stop stripping X- headers.', 'fiveprayer' )
				);

				Delivery::record_disabled( $product, 'ifiiri_query_auth_disabled', $error->get_error_message() );

				do_action( 'ifiiri_sdk_request_failed', $product, 401, array( 'message' => $error->get_error_message() ) );

				return $error;
			}
		}

		if ( is_wp_error( $sent ) ) {
			self::record( $product, $sent );

			return $sent;
		}

		$decoded = json_decode( (string) wp_remote_retrieve_body( $sent ), true );
		$decoded = is_array( $decoded ) ? $decoded : array();

		if ( $code < 200 || $code >= 300 ) {
			// A 404 without an iFiiri JSON body means the URL exists but is not an
			// iFiiri master: a wrong endpoint (often the site's own domain), a
			// master without the plugin, or a WAF/permalink issue. Say so instead
			// of showing a bare "not found".
			if ( 404 === $code && empty( $decoded['code'] ) ) {
				$error = new \WP_Error(
					'ifiiri_sdk_http_404',
					__( 'The reporting URL answered "not found" - it is not an iFiiri master. Check the configured endpoint: it must point at the site where the iFiiri (master) plugin is installed, not at this site itself.', 'fiveprayer' )
				);

				self::record( $product, $error );

				do_action( 'ifiiri_sdk_request_failed', $product, $code, $decoded );

				return $error;
			}

			$error = new \WP_Error(
				'ifiiri_sdk_http_' . $code,
				isset( $decoded['message'] ) ? (string) $decoded['message'] : __( 'The telemetry server rejected the request.', 'fiveprayer' ),
				$decoded
			);

			self::record( $product, $error );

			/**
			 * Fires when the server answered with a non-2xx status.
			 *
			 * @param Product    $product Product.
			 * @param int        $code    HTTP status.
			 * @param array|null $body    Decoded body.
			 */
			do_action( 'ifiiri_sdk_request_failed', $product, $code, $decoded );

			return $error;
		}

		$product->mark_synced();
		Delivery::record_success( $product );

		if ( isset( $decoded['license'] ) && is_array( $decoded['license'] ) ) {
			$product->store_license_status( (array) $decoded['license'] );
		}

		return $decoded;
	}

	/**
	 * Perform the signed request.
	 *
	 * @param Product $product Product.
	 * @param string  $url     Absolute endpoint URL.
	 * @param string  $body    Raw JSON body.
	 * @return array<string, mixed>|\WP_Error Raw wp_remote_post() response.
	 */
	private static function request( Product $product, string $url, string $body ) {
		$timestamp = (string) time();
		$nonce     = self::nonce();
		$route     = self::route_from_url( $url );
		$signature = hash_hmac(
			'sha256',
			self::canonical( 'POST', $route, $timestamp, $nonce, $body ),
			$product->secret()
		);

		$request_url = $url;

		if ( 'query' === $product->auth_mode() ) {
			$request_url = add_query_arg(
				array(
					'ifiiri_client'    => rawurlencode( $product->client_id() ),
					'ifiiri_timestamp' => rawurlencode( $timestamp ),
					'ifiiri_nonce'     => rawurlencode( $nonce ),
					'ifiiri_signature' => rawurlencode( $signature ),
				),
				$url
			);
		}

		$response = wp_remote_post(
			$request_url,
			array(
				'timeout'     => self::TIMEOUT,
				'redirection' => 2,
				'blocking'    => true,
				'headers'     => array(
					'Content-Type'        => 'application/json; charset=utf-8',
					'Accept'              => 'application/json',
					'User-Agent'          => 'iFiiri-SDK/' . IFI_SDK_VERSION . '; ' . $product->slug(),
					'X-iFiiri-Client'     => $product->client_id(),
					'X-iFiiri-Timestamp'  => $timestamp,
					'X-iFiiri-Nonce'      => $nonce,
					'X-iFiiri-Signature'  => $signature,
				),
				'body'        => $body,
			)
		);

		if ( is_wp_error( $response ) ) {
			self::record( $product, $response );

			/**
			 * Fires when the request never reached the server.
			 *
			 * @param Product   $product Product.
			 * @param int       $code    Always 0: the request never left the site.
			 * @param \WP_Error $error   Transport error.
			 */
			do_action( 'ifiiri_sdk_request_failed', $product, 0, $response );

			return $response;
		}

		return $response;
	}

	/**
	 * Whether the error is a TCP connect failure (never reached the server).
	 *
	 * Covers cURL error 6 (could not resolve host), 7 (could not connect) and
	 * 28 (connection timed out), the shapes an unreachable endpoint produces.
	 *
	 * @param \WP_Error $error Transport error.
	 * @return bool
	 */
	private static function is_connect_failure( \WP_Error $error ): bool {
		$code = strtolower( (string) $error->get_error_code() );

		return (bool) preg_match( '/http_request_failed/', $code )
			|| in_array( $code, array( '6', '7', '28' ), true );
	}

	/**
	 * Whether a base URL points at the local machine itself.
	 *
	 * Only loopback targets qualify for the site-URL fallback: if a real master
	 * domain is briefly unreachable, reporting the true connect error is more
	 * useful than a 404 from the client's own site.
	 *
	 * @param string $base Endpoint base URL.
	 * @return bool
	 */
	private static function is_loopback_base( string $base ): bool {
		$host = strtolower( (string) ( wp_parse_url( $base, PHP_URL_HOST ) ?? '' ) );

		return '' !== $host
			&& ( 'localhost' === $host
				|| '127.0.0.1' === $host
				|| 0 === strpos( $host, '127.' )
				|| '::1' === $host
				|| '[::1]' === $host
				|| '.local' === substr( $host, -6 )
				|| '.test' === substr( $host, -5 ) );
	}

	/**
	 * Candidate URLs to retry against after a connect failure.
	 *
	 * Configured fallback endpoints always apply. The site's own REST URL
	 * (which resolves inside container networks such as Local) is only added
	 * for loopback or *.local / *.test endpoints, so a genuinely unreachable
	 * production master still reports its true error.
	 *
	 * @param Product $product Product.
	 * @param string  $route   REST route base, e.g. "activate".
	 * @return array<int, string> Absolute route URLs.
	 */
	private static function fallback_urls( Product $product, string $route ): array {
		$bases = array();

		if ( self::is_loopback_base( $product->endpoint() ) ) {
			$bases[] = rest_url( self::REST_NAMESPACE . '/' );
		}

		foreach ( $product->fallback_endpoints() as $candidate ) {
			if ( ! is_string( $candidate ) || '' === $candidate ) {
				continue;
			}

			$bases[] = self::rest_base( $candidate );
		}

		$urls = array();

		foreach ( $bases as $base ) {
			$urls[] = array(
				'base' => $base,
				'url'  => self::endpoint_url_for_base( $base, $route ),
			);
		}

		return $urls;
	}

	/**
	 * Normalise a fallback base to a full REST base URL.
	 *
	 * Accepts either a plain site URL (gets /wp-json/{namespace} appended) or
	 * a base that already points at the REST API (/wp-json/ or rest_route=).
	 *
	 * @param string $candidate Site URL or REST base URL.
	 * @return string
	 */
	private static function rest_base( string $candidate ): string {
		$candidate = trim( $candidate );

		if ( false !== strpos( $candidate, '/wp-json/' ) || false !== strpos( $candidate, 'rest_route=' ) ) {
			return $candidate;
		}

		return untrailingslashit( $candidate ) . '/wp-json/' . self::REST_NAMESPACE . '/';
	}

	/**
	 * Build the absolute URL for a route from an arbitrary base URL.
	 *
	 * Mirrors endpoint_url() but takes the base explicitly, so the fallback can
	 * build route URLs from the site URL or a configured alternative endpoint.
	 *
	 * @param string $base  Base URL (site URL or an alternative endpoint).
	 * @param string $route Route base.
	 * @return string
	 */
	private static function endpoint_url_for_base( string $base, string $route ): string {
		$base  = trim( $base );
		$route = ltrim( $route, '/' );

		if ( false !== strpos( $base, 'rest_route=' ) ) {
			return rtrim( $base, '/' ) . '/' . $route;
		}

		return trailingslashit( $base ) . $route;
	}

	/**
	 * Whether two absolute URLs point at the same host + path, ignoring scheme,
	 * port, query string and trailing slashes.
	 *
	 * @param string $a First URL.
	 * @param string $b Second URL.
	 * @return bool
	 */
	private static function same_url( string $a, string $b ): bool {
		$key = static function ( string $url ): string {
			$parts = wp_parse_url( $url );

			return strtolower( (string) ( $parts['host'] ?? '' ) ) . '/' . trim( (string) ( $parts['path'] ?? '' ), '/' );
		};

		return $key( $a ) === $key( $b );
	}

	/**
	 * Build the absolute URL for a route.
	 *
	 * Handles both permalink styles because the configured base URL decides it:
	 *  - pretty permalinks: https://site.com/wp-json/ifiiri/v1/activate
	 *  - plain permalinks:  https://site.com/?rest_route=/ifiiri/v1/activate
	 *
	 * @param Product $product Product.
	 * @param string  $route   Route base.
	 * @param string  $base    Optional base override (a remembered working REST base).
	 * @return string
	 */
	private static function endpoint_url( Product $product, string $route, string $base = '' ): string {
		$base  = '' !== trim( $base ) ? trim( $base ) : trim( $product->endpoint() );
		$route = ltrim( $route, '/' );

		// Plain permalinks: the route lives inside the rest_route query arg.
		if ( false !== strpos( $base, 'rest_route=' ) ) {
			return rtrim( $base, '/' ) . '/' . $route;
		}

		return trailingslashit( $base ) . $route;
	}

	/**
	 * Extract the REST route a URL points at.
	 *
	 * This is the string the signature covers, so it must match what the server
	 * sees from $request->get_route() - e.g. "ifiiri/v1/heartbeat" - regardless of
	 * how the URL is shaped.
	 *
	 * @param string $url Request URL.
	 * @return string
	 */
	public static function route_from_url( string $url ): string {
		$parts = wp_parse_url( $url );
		$path  = isset( $parts['path'] ) ? (string) $parts['path'] : '';
		$query = isset( $parts['query'] ) ? (string) $parts['query'] : '';

		if ( '' !== $query ) {
			parse_str( $query, $args );

			if ( ! empty( $args['rest_route'] ) ) {
				return trim( (string) $args['rest_route'], '/' );
			}
		}

		$rest = '';

		if ( false !== strpos( $path, '/wp-json/' ) ) {
			$rest = substr( $path, strpos( $path, '/wp-json/' ) + strlen( '/wp-json/' ) );
		} else {
			// Custom REST prefix, or a subdirectory install without wp-json in the path.
			$rest = ltrim( $path, '/' );
		}

		$rest = preg_replace( '#^index\.php/#', '', $rest );

		return trim( (string) $rest, '/' );
	}

	/**
	 * Random per-request nonce.
	 *
	 * @return string
	 */
	private static function nonce(): string {
		try {
			return bin2hex( random_bytes( 16 ) );
		} catch ( \Exception $e ) {
			unset( $e );

			return substr( md5( uniqid( (string) wp_rand(), true ) . microtime() ), 0, 32 );
		}
	}

	/**
	 * Store a delivery outcome for the admin notice.
	 *
	 * Recording is best-effort and stateless: the HTTP status, when there was
	 * one, is recovered from the error code itself.
	 *
	 * @param Product  $product Product.
		 * @param \WP_Error $error  The failure.
	 */
	private static function record( Product $product, \WP_Error $error ): void {
		$code    = 0;
		$matches = array();

		if ( preg_match( '/_(\d{3})$/', $error->get_error_code(), $matches ) ) {
			$code = (int) $matches[1];
		}

		Delivery::record_failure(
			$product,
			$error->get_error_code(),
			$error->get_error_message(),
			$code
		);
	}

	/**
	 * Whether the response complains about missing credentials.
	 *
	 * @param array<string, mixed> $response Raw response.
	 * @return bool
	 */
	private static function is_missing_credentials( array $response ): bool {
		$body = (string) wp_remote_retrieve_body( $response );

		return false !== strpos( $body, 'ifiiri_missing_credentials' );
	}
}

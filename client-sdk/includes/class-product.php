<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedNamespaceFound -- Bundled iFiiri SDK: the namespace is part of its public API.
/**
 * One iFiiri-enabled plugin, as configured by its main file.
 *
 * Holds the credentials, the consent state and the environment payload. All
 * per-product state is stored in individual options (autoload off) so a site with
 * several iFiiri plugins keeps each one's decisions separate.
 *
 * Option names: ifiiri_{slug}_consent, ifiiri_{slug}_install_id,
 * ifiiri_{slug}_last_sync, ifiiri_{slug}_license_status, ifiiri_{slug}_notice,
 * ifiiri_{slug}_auth_mode.
 *
 * @package iFiiri\SDK
 */

namespace iFiiri\SDK;

defined( 'ABSPATH' ) || exit;

/**
 * A registered product (plugin) and its local state.
 */
final class Product {

	/**
	 * Consent states.
	 */
	public const CONSENT_PENDING = 'pending';
	public const CONSENT_YES     = 'yes';
	public const CONSENT_NO      = 'no';

	/**
	 * Option prefix shared by every product key.
	 */
	private const PREFIX = 'ifiiri_';

	/**
	 * Sanitised slug.
	 *
	 * @var string
	 */
	private $slug;

	/**
	 * Merged configuration.
	 *
	 * @var array<string, mixed>
	 */
	private $config;

	/**
	 * Set up the product.
	 *
	 * @param string               $slug   Unique slug, e.g. the plugin text domain.
	 * @param array<string, mixed> $config Configuration; see the SDK readme.
	 */
	public function __construct( string $slug, array $config ) {
		$slug            = sanitize_key( $slug );
		$this->slug      = '' !== $slug ? $slug : 'plugin';
		$this->config    = wp_parse_args(
			$config,
			array(
				'endpoint'        => '',
				'client_id'       => '',
				'secret'          => '',
				'version'         => '',
				'plugin_file'     => '',
				'plugin_name'     => '',
				'text_domain'     => 'default',
				'license_key'     => '',
				'fallback_endpoints' => array(),
				'heartbeat'       => DAY_IN_SECONDS,
				'ask_for_consent' => true,
			)
		);
	}

	/**
	 * Product slug.
	 *
	 * @return string
	 */
	public function slug(): string {
		return $this->slug;
	}

	/**
	 * Human readable product name, falling back to the slug.
	 *
	 * @return string
	 */
	public function name(): string {
		$name = trim( (string) $this->config['plugin_name'] );

		return '' !== $name ? $name : $this->slug;
	}

	/**
	 * Text domain configured for this product.
	 *
	 * The SDK's own strings are bound to the bundled plugin's literal text
	 * domain rather than to this value, so that the WordPress i18n tooling can
	 * extract them and the domain stays a string literal as the coding
	 * standards require. The configured value is still exposed here.
	 *
	 * @return string
	 */
	public function text_domain(): string {
		$domain = (string) $this->config['text_domain'];

		return '' !== $domain ? $domain : 'default';
	}

	/**
	 * REST namespace base URL on the master server.
	 *
	 * The configuration value may be a callable (resolved on every read), which
	 * lets a plugin decide the endpoint at send time instead of load time -
	 * useful when the endpoint depends on other plugins that may load later.
	 * An empty result means "no master known": the product idles unconfigured.
	 *
	 * @return string
	 */
	public function endpoint(): string {
		$endpoint = $this->config['endpoint'];

		if ( is_callable( $endpoint ) ) {
			$endpoint = call_user_func( $endpoint );
		}

		return is_string( $endpoint ) ? trim( $endpoint ) : '';
	}

	/**
	 * Public client identifier.
	 *
	 * @return string
	 */
	public function client_id(): string {
		return (string) $this->config['client_id'];
	}

	/**
	 * Client secret. Only ever used server-side in PHP - never sent to the browser.
	 *
	 * @return string
	 */
	public function secret(): string {
		return (string) $this->config['secret'];
	}

	/**
	 * Extra endpoint URLs the transport may try when the main one cannot be
	 * connected to at all (connection refused / DNS failure).
	 *
	 * @return array<int, string>
	 */
	public function fallback_endpoints(): array {
		$extra = isset( $this->config['fallback_endpoints'] ) ? (array) $this->config['fallback_endpoints'] : array();

		return array_values( array_filter( array_map( 'trim', $extra ) ) );
	}

	/**
	 * Version of the plugin being tracked.
	 *
	 * @return string
	 */
	public function version(): string {
		return (string) $this->config['version'];
	}

	/**
	 * Absolute path of the plugin's main file (used for activation hooks).
	 *
	 * @return string
	 */
	public function plugin_file(): string {
		return (string) $this->config['plugin_file'];
	}

	/**
	 * Plugin basename, e.g. fiveprayer/fiveprayer.php.
	 *
	 * @return string
	 */
	public function plugin_basename(): string {
		$file = $this->plugin_file();

		return '' !== $file ? plugin_basename( $file ) : '';
	}

	/**
	 * Whether the admin wants the opt-in prompt at all.
	 *
	 * @return bool
	 */
	public function asks_for_consent(): bool {
		return (bool) $this->config['ask_for_consent'];
	}

	/**
	 * Heartbeat interval in seconds.
	 *
	 * @return int
	 */
	public function heartbeat_interval(): int {
		return max( HOUR_IN_SECONDS, (int) $this->config['heartbeat'] );
	}

	/**
	 * Whether every required credential is present.
	 *
	 * @return bool
	 */
	public function is_configured(): bool {
		return '' !== $this->endpoint() && '' !== $this->client_id() && '' !== $this->secret() && '' !== $this->version();
	}

	/**
	 * Licnce key, resolved from a string or callable in the configuration.
	 *
	 * @return string
	 */
	public function license_key(): string {
		$key = $this->config['license_key'];

		if ( is_callable( $key ) ) {
			$key = call_user_func( $key );
		}

		return is_string( $key ) ? trim( $key ) : '';
	}

	/**
	 * Full option name for one state key.
	 *
	 * @param string $key State key.
	 * @return string
	 */
	public function option_name( string $key ): string {
		return self::PREFIX . $this->slug . '_' . $key;
	}

	/**
	 * Read a state value.
	 *
	 * @param string $key     State key.
	 * @param mixed  $default Fallback.
	 * @return mixed
	 */
	public function get( string $key, $default = '' ) {
		return get_option( $this->option_name( $key ), $default );
	}

	/**
	 * Write a state value (never autoloaded).
	 *
	 * @param string $key   State key.
	 * @param mixed  $value Value.
	 */
	public function set( string $key, $value ): void {
		update_option( $this->option_name( $key ), $value, false );
	}

	/**
	 * Consent state, defaulting to pending.
	 *
	 * @return string One of the CONSENT_* constants.
	 */
	public function consent(): string {
		$state = (string) $this->get( 'consent', self::CONSENT_PENDING );

		return in_array( $state, array( self::CONSENT_YES, self::CONSENT_NO, self::CONSENT_PENDING ), true )
			? $state
			: self::CONSENT_PENDING;
	}

	/**
	 * Whether telemetry may be transmitted. This is the only gate that matters.
	 *
	 * @return bool
	 */
	public function is_tracking_allowed(): bool {
		return self::CONSENT_YES === $this->consent();
	}

	/**
	 * Store a consent decision.
	 *
	 * @param string $state One of the CONSENT_* constants.
	 */
	public function set_consent( string $state ): void {
		$allowed = array( self::CONSENT_YES, self::CONSENT_NO, self::CONSENT_PENDING );

		$this->set( 'consent', in_array( $state, $allowed, true ) ? $state : self::CONSENT_PENDING );
	}

	/**
	 * Anonymous installation id, generated on first use.
	 *
	 * A UUID with no relation to the site: it survives domain changes, which a
	 * hashed URL would not.
	 *
	 * @return string
	 */
	public function install_id(): string {
		$id = (string) $this->get( 'install_id', '' );
		$id = preg_replace( '/[^A-Za-z0-9_-]/', '', $id );
		$id = is_string( $id ) ? $id : '';

		if ( strlen( $id ) >= 8 ) {
			return $id;
		}

		$id = function_exists( 'wp_generate_uuid4' ) ? wp_generate_uuid4() : bin2hex( random_bytes( 16 ) );
		$id = preg_replace( '/[^A-Za-z0-9_-]/', '', (string) $id );

		$this->set( 'install_id', $id );

		return $id;
	}

	/**
	 * Endpoint base remembered after the configured one could not be reached.
	 *
	 * Loopback endpoints (Local-style dev stacks) often cannot be connected to
	 * from PHP at all; once a fallback base has answered, it is stored here so
	 * later requests skip the dead attempt entirely. The record is bound to the
	 * configured endpoint's hash, so changing the endpoint (e.g. in wp-config)
	 * invalidates it automatically - important when a database is copied between
	 * environments.
	 *
	 * @return string Empty when no valid override exists.
	 */
	public function endpoint_override(): string {
		$stored = $this->get( 'endpoint_override', array() );

		if ( ! is_array( $stored ) ) {
			return '';
		}

		$base = (string) ( $stored['base'] ?? '' );
		$for  = (string) ( $stored['for'] ?? '' );

		if ( '' === $base || ! hash_equals( md5( $this->endpoint() ), $for ) ) {
			return '';
		}

		return $base;
	}

	/**
	 * Remember a reachable endpoint base for future requests.
	 *
	 * @param string $base Normalised REST base URL that answered.
	 */
	public function use_endpoint_override( string $base ): void {
		$this->set(
			'endpoint_override',
			array(
				'base' => $base,
				'for'  => md5( $this->endpoint() ),
			)
		);
	}

	/**
	 * How credentials are attached to outgoing requests.
	 *
	 * 'headers' by default. Some hosts strip unknown X- headers; the transport
	 * detects that and flips this to 'query' permanently for this product.
	 *
	 * @return string headers|query
	 */
	public function auth_mode(): string {
		return 'query' === $this->get( 'auth_mode', 'headers' ) ? 'query' : 'headers';
	}

	/**
	 * Remember that credentials must travel in the query string.
	 */
	public function use_query_auth(): void {
		$this->set( 'auth_mode', 'query' );
	}

	/**
	 * Record a successful sync.
	 */
	public function mark_synced(): void {
		$this->set( 'last_sync', current_time( 'mysql', true ) );
	}

	/**
	 * Last successful sync (UTC), or an empty string.
	 *
	 * @return string
	 */
	public function last_sync(): string {
		return (string) $this->get( 'last_sync', '' );
	}

	/**
	 * Store the licence decision returned by the server.
	 *
	 * @param array<string, mixed> $license Licence object from the API response.
	 */
	public function store_license_status( array $license ): void {
		if ( empty( $license['status'] ) ) {
			return;
		}

		$this->set(
			'license_status',
			array(
				'status'     => sanitize_key( (string) $license['status'] ),
				'enforce'    => ! empty( $license['enforce'] ),
				'expires_at' => isset( $license['expires_at'] ) ? sanitize_text_field( (string) $license['expires_at'] ) : '',
				'checked_at' => current_time( 'mysql', true ),
			)
		);
	}

	/**
	 * Cached licence decision.
	 *
	 * @return array<string, mixed>
	 */
	public function license_status(): array {
		$status = $this->get( 'license_status', array() );

		return is_array( $status ) ? $status : array();
	}

	/**
	 * Whether the licence is enforced AND valid. Fail-open while licensing is off.
	 *
	 * @return bool
	 */
	public function is_license_active(): bool {
		$status = $this->license_status();

		if ( empty( $status['enforce'] ) ) {
			return true;
		}

		return isset( $status['status'] ) && 'active' === $status['status'];
	}

	/**
	 * Site URL sent with each report.
	 *
	 * The server stores only a keyed hash unless consent is granted.
	 *
	 * @return string
	 */
	public function site_url(): string {
		return untrailingslashit( (string) home_url() );
	}

	/**
	 * Build the payload for one event.
	 *
	 * Deliberately contains no personal data: no admin email, no user names, no
	 * database details, no IP address. See the SDK readme for the full list.
	 *
	 * @param string $event Event name.
	 * @return array<string, mixed>
	 */
	public function payload( string $event ): array {
		return array(
			'event'          => $event,
			'install_id'     => $this->install_id(),
			'consent'        => $this->is_tracking_allowed(),
			'plugin_version' => $this->version(),
			'wp_version'     => (string) get_bloginfo( 'version' ),
			'php_version'    => PHP_VERSION,
			'locale'         => (string) get_locale(),
			'is_multisite'   => is_multisite(),
			'site_url'       => $this->site_url(),
			'license_key'    => $this->license_key(),
		);
	}

	/**
	 * Everything this product stores locally, for the privacy exporter.
	 *
	 * @return array<string, string>
	 */
	public function exportable(): array {
		$status = $this->license_status();

		return array(
			'Plugin'                => $this->name(),
			'Installation ID'       => $this->install_id(),
			'Telemetry consent'     => $this->consent(),
			'Last report sent (UTC)' => '' !== $this->last_sync() ? $this->last_sync() : 'never',
			'Reports waiting to be sent' => (string) Queue::count( $this ),
			'Delivery state'             => (string) ( Delivery::status( $this )['state'] ?? '' ),
			'Licence status'        => isset( $status['status'] ) ? sanitize_key( (string) $status['status'] ) : 'unknown',
			'Note'                  => __( 'No personal data is stored by iFiiri; the installation ID above is the only identifier.', 'fiveprayer' ),
		);
	}

	/**
	 * Delete one state value.
	 *
	 * @param string $key State key.
	 */
	public function forget_key( string $key ): void {
		delete_option( $this->option_name( $key ) );
	}

	/**
	 * Delete every option this product stored (privacy erasure).
	 */
	public function forget(): void {
		// The queue is included on purpose: it can hold free text the user typed
		// into the deactivation form, so an erasure request must clear it too.
		// Delivery is included so an erasure also clears the failure record.
		foreach ( array( 'consent', 'install_id', 'last_sync', 'license_status', 'notice', 'auth_mode', 'queue', 'delivery', 'endpoint_override' ) as $key ) {
			$this->forget_key( $key );
		}
	}
}

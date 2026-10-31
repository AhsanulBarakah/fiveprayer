<?php
/**
 * Share on Local Network (local network sharing) — runtime in-memory URL router.
 *
 * Lets a site that runs on a local or LAN-only machine (LocalWP, Flywheel,
 * MAMP, Docker, WP-CLI `wp server`, a mini PC or Raspberry Pi in the prayer
 * hall, …) be opened from the mosque's TV, a phone or a tablet on the same
 * network (for example {@see http://192.168.1.104:10010}) without broken links,
 * redirect loops or database changes. This is how a mosque shares its prayer
 * times and display design with the screen — it is a feature, not a test.
 *
 * The implementation is deliberately isolated and fail-safe:
 *
 * - It never calls update_option() for `siteurl` or `home`; the database is
 *   never touched. The correct host is injected in memory for the current
 *   request only.
 * - It only ever activates when the request host is itself a loopback or
 *   private-network address. On a production domain the address check fails,
 *   so the router is a no-op even if the option is somehow left enabled.
 * - The Host header is chosen by the visitor, so the host check on its own
 *   proved nothing: a request from the internet carrying `Host: 192.168.x.x`
 *   rewrote home and site URL for that request, and a page cache could store
 *   the result (any email sent during it then carried the wrong host). The
 *   client address the connection actually came from must be loopback or
 *   private too — read straight from REMOTE_ADDR, never from a forwarded
 *   header. A TV, phone or tablet on the same network passes; a visitor on
 *   the internet does not.
 * - A rewritten page is kept out of every shared cache: `nocache_headers()` is
 *   sent and DONOTCACHEPAGE is defined, so the network address can never be
 *   handed to someone who asked for the site's real one.
 * - It only ever activates when an administrator turned the switch on. The
 *   option (`fiveprayer_local_testing_mode`, the third switch of the TV Display
 *   Mode settings page) defaults to 0, so a fresh install rewrites nothing and
 *   a site is never reachable from another device until someone opts in.
 * - Asset URLs are rewritten too. WordPress derives `WP_CONTENT_URL` (and the
 *   plugin/upload URLs built from it) from the stored `siteurl` option *before*
 *   plugins load, so `plugins_url()` and `wp_upload_dir()` kept pointing at the
 *   original host (e.g. http://localhost:10010/wp-content/...) even though
 *   `home_url()` already resolved to the network address. A phone cannot
 *   resolve `localhost`, so without this the plugin's stylesheet, script and
 *   generated bundles all failed to load on the other device — no colours and
 *   no TV Display Mode.
 * - WP_HOME / WP_SITEURL are defined with `! defined()` guards so a value set
 *   in wp-config.php always wins.
 *
 * @package FivePrayer\Core
 * @since   3.0.0
 */

namespace FivePrayer\Core;

defined('ABSPATH') || exit;

/**
 * Class LocalNetworkRouter
 *
 * Overrides the WordPress home/site URL in memory so the network address a
 * request actually arrived on is the one used to generate every link.
 *
 * @since 3.0.0
 */
class LocalNetworkRouter
{
    /**
     * Option that enables the feature (0 or 1).
     *
     * @var string
     */
    public const OPTION_NAME = 'fiveprayer_local_testing_mode';

    /**
     * Address ranges a local network device is allowed to connect from.
     *
     * Loopback plus the private IPv4 ranges and the IPv6 unique-local and
     * link-local ranges. Anything else is the public internet.
     *
     * @var string[]
     */
    private const LOCAL_CLIENT_RANGES = [
        '127.0.0.0/8',
        '10.0.0.0/8',
        '172.16.0.0/12',
        '192.168.0.0/16',
        '::1/128',
        'fc00::/7',
        'fe80::/10',
    ];

    /**
     * Whether {@see self::bootstrap()} has already run this request.
     *
     * @var bool
     */
    private static $bootstrapped = false;

    /**
     * Whether the override is active for this request.
     *
     * @var bool
     */
    private static $active = false;

    /**
     * The base URL ("scheme://host[:port]") injected for this request.
     *
     * @var string
     */
    private static $base_url = '';

    /**
     * Register the runtime hooks.
     *
     * Called as early as possible from the main plugin file. Both
     * `muplugins_loaded` and `plugins_loaded` are registered at priority 1 so
     * the router works whether this plugin is installed normally or as a
     * must-use plugin. On a normal install `muplugins_loaded` has already fired
     * by the time plugin files load, so `plugins_loaded`:1 is the listener that
     * actually runs — still before every other plugin on the site.
     *
     * @return void
     */
    public static function register(): void
    {
        add_action('muplugins_loaded', [self::class, 'bootstrap'], 1);
        add_action('plugins_loaded', [self::class, 'bootstrap'], 1);

        // Guarantee home_url()/site_url() resolve to the injected host even if
        // a later plugin re-reads the option straight from the database.
        add_filter('option_home', [self::class, 'filter_option_home'], 99);
        add_filter('option_siteurl', [self::class, 'filter_option_siteurl'], 99);

        // Rewrite asset URLs as well. `plugins_url()` and `wp_upload_dir()`
        // build their URLs from the WP_CONTENT_URL / upload base URL, which
        // WordPress freezes from the stored `siteurl` option before any plugin
        // can run. On a request that arrived on the network address those URLs
        // would still say `localhost`, which the other device cannot resolve —
        // so the front-end stylesheet, script and combined bundles would 404
        // on the phone (no colours, no TV Display Mode scaling).
        add_filter('plugins_url', [self::class, 'filter_plugins_url'], 99, 3);
        add_filter('upload_dir', [self::class, 'filter_upload_dir'], 99);

        // Theme assets are built from the same frozen content URL (the active
        // theme's fonts and stylesheet), so rewrite those as well.
        add_filter('theme_root_uri', [self::class, 'filter_theme_root_uri'], 99, 3);
    }

    /**
     * Evaluate the guard conditions and, when they all pass, define the URL
     * constants for this single execution lifecycle.
     *
     * Idempotent: safe to run from both registered hooks.
     *
     * @return void
     */
    public static function bootstrap(): void
    {
        if (self::$bootstrapped) {
            return;
        }
        self::$bootstrapped = true;

        // Cheap, database-free guard first: only ever rewrite when the request
        // is arriving on a loopback or private-network address. This is the
        // fail-safe that keeps the feature inert on a live domain.
        $host = self::get_request_host();
        if (null === $host || !self::is_local_host($host)) {
            return;
        }

        // Second guard: the connection itself must come from the local network.
        if (!self::is_local_client()) {
            return;
        }

        // Third guard: the administrator must have opted in.
        if (!self::is_enabled()) {
            return;
        }

        // Fourth guard: the site must look like a local environment. A public
        // host never reaches this point, so this is an extra safety net rather
        // than the primary gate.
        if (!self::is_local_environment()) {
            return;
        }

        self::$active   = true;
        self::$base_url = self::build_base_url($host);

        // The rewritten page must never reach a shared cache: it was rendered
        // for a host that is not the site's address.
        add_action('send_headers', [self::class, 'send_nocache_headers']);

        if (!defined('DONOTCACHEPAGE')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- WordPress core cache constant.
            define('DONOTCACHEPAGE', true);
        }

        // Never clobber a value the site owner set explicitly in wp-config.php.
        if (!defined('WP_HOME')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- WordPress core constant.
            define('WP_HOME', self::$base_url);
        }
        if (!defined('WP_SITEURL')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- WordPress core constant.
            define('WP_SITEURL', self::$base_url);
        }
    }

    /**
     * Whether the feature option is turned on.
     *
     * @return bool
     */
    public static function is_enabled(): bool
    {
        $value = get_option(self::OPTION_NAME, 0);

        return 1 === (int) $value;
    }

    /**
     * Whether the in-memory override is active for the current request.
     *
     * @return bool
     */
    public static function is_active(): bool
    {
        return self::$active;
    }

    /**
     * The base URL injected for the current request, empty when inactive.
     *
     * @return string
     */
    public static function get_base_url(): string
    {
        return self::$base_url;
    }

    /**
     * Read the request host from the server superglobal, safely.
     *
     * @return string|null Host (with optional port), or null when unavailable.
     */
    public static function get_request_host(): ?string
    {
        if (empty($_SERVER['HTTP_HOST']) || !is_string($_SERVER['HTTP_HOST'])) {
            return null;
        }

        $host = fiveprayer_get_server_value('HTTP_HOST');
        if ('' === $host) {
            return null;
        }

        // Defensive: allow only characters that are valid in a host header.
        if (!preg_match('/^[a-z0-9\[\]\-\.:_]+$/i', $host)) {
            return null;
        }

        return $host;
    }

    /**
     * Whether the client that made this request is on the local network.
     *
     * The Host header is visitor-controlled, so it cannot be the only evidence
     * that a request came from the LAN. REMOTE_ADDR is the address the
     * connection actually arrived on and is read directly, never from a
     * forwarding header: a real LAN device passes, an internet visitor does
     * not, whatever Host it sends.
     *
     * @return bool
     */
    public static function is_local_client(): bool
    {
        return self::is_local_address(fiveprayer_get_server_value('REMOTE_ADDR'));
    }

    /**
     * Whether an address is loopback or in a private network range.
     *
     * @param string $address IPv4 or IPv6 address.
     * @return bool
     */
    public static function is_local_address(string $address): bool
    {
        if ('' === $address || false === filter_var($address, FILTER_VALIDATE_IP)) {
            return false;
        }

        foreach (self::LOCAL_CLIENT_RANGES as $range) {
            if (self::address_matches_range($address, $range)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Whether an address falls inside a CIDR block.
     *
     * Both values are compared as packed bytes, so IPv4 and IPv6 are handled by
     * the same code and a family mismatch is simply not a match.
     *
     * @param string $address IP address to test.
     * @param string $range   CIDR block, e.g. `192.168.0.0/16`.
     * @return bool
     */
    private static function address_matches_range(string $address, string $range): bool
    {
        $parts = explode('/', $range, 2);
        if (2 !== count($parts)) {
            return false;
        }

        [$network, $bits] = $parts;

        $packed_address = inet_pton($address);
        $packed_network = inet_pton($network);

        if (false === $packed_address || false === $packed_network
            || strlen($packed_address) !== strlen($packed_network)) {
            return false;
        }

        $bits      = (int) $bits;
        $whole     = intdiv($bits, 8);
        $remainder = $bits % 8;

        if ($whole > 0 && 0 !== strncmp($packed_address, $packed_network, $whole)) {
            return false;
        }

        if (0 === $remainder) {
            return true;
        }

        $mask = (0xFF << (8 - $remainder)) & 0xFF;

        return (ord($packed_address[$whole]) & $mask) === (ord($packed_network[$whole]) & $mask);
    }

    /**
     * Keep the rewritten request out of every page cache.
     *
     * Hooked on `send_headers` only while the router is active.
     *
     * @return void
     */
    public static function send_nocache_headers(): void
    {
        if (!self::$active || headers_sent()) {
            return;
        }

        nocache_headers();
    }

    /**
     * Whether the given host is a loopback or private-network address.
     *
     * @param string $host Host (optionally with a port) to test.
     * @return bool
     */
    public static function is_local_host(string $host): bool
    {
        $host = strtolower($host);

        /**
         * Filter the regular expressions used to recognise a local host.
         *
         * Add a pattern here if your local environment uses a host that is not
         * covered by the defaults (for example a custom `.lan` TLD).
         *
         * @since 3.0.0
         *
         * @param string[] $patterns PCRE patterns, matched against the host.
         */
        $patterns = (array) apply_filters(
            'fiveprayer_local_testing_allowed_hosts',
            self::default_host_patterns()
        );

        foreach ($patterns as $pattern) {
            if (is_string($pattern) && preg_match($pattern, $host)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Default loopback / private-network host patterns.
     *
     * Each pattern tolerates an optional `:port` suffix so LocalWP-style URLs
     * such as `192.168.1.104:10010` are recognised.
     *
     * @return string[]
     */
    private static function default_host_patterns(): array
    {
        return [
            '/^localhost(?::\d+)?$/',                              // localhost and localhost:8080
            '/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?$/',         // IPv4 loopback
            '/^\[::1\](?::\d+)?$/',                                // IPv6 loopback, [::1]:8080
            '/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?$/',          // 10.0.0.0/8
            '/^192\.168\.\d{1,3}\.\d{1,3}(?::\d+)?$/',             // 192.168.0.0/16
            '/^172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}(?::\d+)?$/', // 172.16.0.0/12
            '/^[a-z0-9.\-]+\.(?:local|localhost|test|invalid|example)(?::\d+)?$/', // mysite.local, mysite.test
        ];
    }

    /**
     * Whether the site looks like a local development environment.
     *
     * The caller has already proven the request arrived on a loopback/private
     * address, so this is a secondary safety net:
     *
     * - A site that explicitly declares `WP_ENVIRONMENT_TYPE = 'production'`
     *   is never rewritten, even when it happens to be reachable on a private
     *   address.
     * - Everything else is accepted, so installs running with WP_DEBUG off on
     *   a local host still work.
     *
     * @return bool
     */
    private static function is_local_environment(): bool
    {
        if (defined('WP_ENVIRONMENT_TYPE') && 'production' === strtolower((string) WP_ENVIRONMENT_TYPE)) {
            return false;
        }

        return true;
    }

    /**
     * Build the "scheme://host" base URL for the current request.
     *
     * @param string $host Validated request host (may include a port).
     * @return string
     */
    private static function build_base_url(string $host): string
    {
        $is_https = false;

        if (function_exists('is_ssl')) {
            $is_https = (bool) is_ssl();
        } else {
            $https = fiveprayer_get_server_value('HTTPS');
            if ('' !== $https && 'off' !== strtolower($https)) {
                $is_https = true;
            }
        }

        $scheme = $is_https ? 'https' : 'http';

        return $scheme . '://' . $host;
    }

    /**
     * Filter callback for `option_home`.
     *
     * @param mixed $value Stored value.
     * @return mixed Overridden URL when active, otherwise the stored value.
     */
    public static function filter_option_home($value)
    {
        return self::$active ? self::$base_url : $value;
    }

    /**
     * Filter callback for `option_siteurl`.
     *
     * @param mixed $value Stored value.
     * @return mixed Overridden URL when active, otherwise the stored value.
     */
    public static function filter_option_siteurl($value)
    {
        return self::$active ? self::$base_url : $value;
    }

    /**
     * Filter callback for `plugins_url`.
     *
     * Covers every asset resolved through `plugin_dir_url()` / `plugins_url()`
     * — including the TV Display Mode stylesheet and script.
     *
     * @param string $url    Full URL to the plugin asset.
     * @param string $path   Path relative to the plugins directory.
     * @param string $plugin The plugin file the URL refers to.
     * @return string Rewritten URL when active, otherwise the original value.
     */
    public static function filter_plugins_url($url, $path = '', $plugin = '')
    {
        if (!self::$active || !is_string($url)) {
            return $url;
        }

        return self::rewrite_local_url($url);
    }

    /**
     * Filter callback for `upload_dir`.
     *
     * Covers the generated combined stylesheet/script, which the asset manager
     * writes to the uploads directory (`wp-content/uploads/fiveprayer-cache`).
     *
     * @param array $uploads Upload directory information.
     * @return array Uploads with `url` / `baseurl` rewritten when active.
     */
    public static function filter_upload_dir($uploads)
    {
        if (!self::$active || !is_array($uploads)) {
            return $uploads;
        }

        foreach (['url', 'baseurl'] as $key) {
            if (!empty($uploads[$key]) && is_string($uploads[$key])) {
                $uploads[$key] = self::rewrite_local_url($uploads[$key]);
            }
        }

        return $uploads;
    }

    /**
     * Filter callback for `theme_root_uri`.
     *
     * Covers the active theme's stylesheet and its fonts, which are resolved
     * through `get_theme_root_uri()`.
     *
     * @param string $theme_root_uri Theme root URL.
     * @param string $siteurl        Stored site URL.
     * @param string $stylesheet_or_template Stylesheet or template slug.
     * @return string Rewritten URL when active, otherwise the original value.
     */
    public static function filter_theme_root_uri($theme_root_uri, $siteurl = '', $stylesheet_or_template = '')
    {
        if (!self::$active || !is_string($theme_root_uri)) {
            return $theme_root_uri;
        }

        return self::rewrite_local_url($theme_root_uri);
    }

    /**
     * Swap the scheme and host of a URL that points at a loopback/private
     * address for the address this request actually arrived on.
     *
     * Only local targets are rewritten, so a CDN or an external asset URL is
     * never touched. An already-correct URL is returned unchanged.
     *
     * @param string $url Absolute URL to inspect.
     * @return string Rewritten URL, or the original when no rewrite is needed.
     */
    private static function rewrite_local_url(string $url): string
    {
        $parts = wp_parse_url($url);
        if (empty($parts['host']) || !is_string($parts['host'])) {
            return $url;
        }

        $host = $parts['host'];
        if (!empty($parts['port'])) {
            $host .= ':' . $parts['port'];
        }

        if (!self::is_local_host($host)) {
            return $url;
        }

        $rebuilt = self::$base_url . (isset($parts['path']) ? $parts['path'] : '');
        if (isset($parts['query'])) {
            $rebuilt .= '?' . $parts['query'];
        }
        if (isset($parts['fragment'])) {
            $rebuilt .= '#' . $parts['fragment'];
        }

        return $rebuilt;
    }
}

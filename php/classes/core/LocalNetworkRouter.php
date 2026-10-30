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

        // Second guard: the administrator must have opted in.
        if (!self::is_enabled()) {
            return;
        }

        // Third guard: the site must look like a local environment. A public
        // host never reaches this point, so this is an extra safety net rather
        // than the primary gate.
        if (!self::is_local_environment()) {
            return;
        }

        self::$active   = true;
        self::$base_url = self::build_base_url($host);

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

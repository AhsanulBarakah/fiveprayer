<?php
/**
 * FivePrayer Utilities Module
 * 
 * This file handles various utility functions for the FivePrayer plugin.
 * 
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

if (!function_exists('fiveprayer_get_server_value')) {
    /**
     * Read and sanitize a $_SERVER value for display or diagnostics.
     *
     * $_SERVER is not form input (it is not slashed and carries no nonce), but
     * it is still request-controlled, so every value is unslashed and sanitized
     * before use.
     *
     * @param string $key     Server variable name.
     * @param string $default Value returned when the variable is not set.
     * @return string
     */
    function fiveprayer_get_server_value($key, $default = '') {
        if (!isset($_SERVER[$key])) {
            return $default;
        }

        return sanitize_text_field(wp_unslash($_SERVER[$key]));
    }
}

/**
 * Extract all shortcode names from post content.
 *
 * @param string $content Post content to scan.
 * @return array Unique shortcode names found in the content.
 */
function fiveprayer_extract_shortcodes_from_content($content) {
    if (empty($content)) {
        return [];
    }
    $matches = [];
    if (preg_match_all('/\[([a-zA-Z0-9_-]+)/', $content, $matches)) {
        return array_unique($matches[1]);
    }
    return [];
}

/**
 * Time-sensitive shortcode slugs used for cache-prevention and script enqueuing.
 */
function fiveprayer_get_time_sensitive_shortcodes() {
    return [
        'Fp_Single_CurrentTime',
        'Fp_Single_NextPrayer',
        'Fp_Single_Next_Prayer_Remaining',
        'Fp_Vertical_Daily_Prayer',
        'Fp_TimeTable_Monthly',
        'Fp_Single_Fajr',
        'Fp_Single_Sunrise',
        'Fp_Single_Dhuhr',
        'Fp_Single_Asr',
        'Fp_Single_Maghrib',
        'Fp_Single_Isha',
    ];
}

/**
 * Check whether post content contains any time-sensitive prayer shortcodes.
 *
 * @param string $content            Post content to scan.
 * @param array  $shortcode_whitelist Optional subset of shortcodes to check.
 *                                    Defaults to all time-sensitive shortcodes.
 * @return bool True if a match is found.
 */
function fiveprayer_content_has_time_sensitive_shortcodes($content, array $shortcode_whitelist = []) {
    if (empty($content)) {
        return false;
    }
    $found = fiveprayer_extract_shortcodes_from_content($content);
    if (empty($found)) {
        return false;
    }
    $targets = !empty($shortcode_whitelist) ? $shortcode_whitelist : fiveprayer_get_time_sensitive_shortcodes();
    foreach ($targets as $shortcode) {
        if (in_array($shortcode, $found, true)) {
            return true;
        }
    }
    return false;
}

/**
 * Dynamic text patterns (fp_*) that indicate time-sensitive content.
 */
function fiveprayer_get_dynamic_text_patterns() {
    return [
        '\bfp_currenttime\b',
        '\bfp_currentdate\b',
        '\bfp_nextprayer\b',
        '\bfp_fajrbegins\b',
        '\bfp_sunrisebegins\b',
        '\bfp_dhuhrbegins\b',
        '\bfp_asrbegins\b',
        '\bfp_maghribbegins\b',
        '\bfp_ishabegins\b',
    ];
}

/**
 * Check whether post content contains dynamic text patterns that need live updates.
 *
 * @param string $content Post content to scan.
 * @return bool True if a dynamic text pattern is found.
 */
function fiveprayer_content_has_dynamic_text_patterns($content) {
    if (empty($content)) {
        return false;
    }
    $patterns    = fiveprayer_get_dynamic_text_patterns();
    $combined    = implode('|', $patterns);
    return (bool) preg_match("/($combined)/i", $content);
}

/**
 * Does this text contain one of the plugin's shortcodes?
 *
 * Every FivePrayer shortcode is registered as `Fp_…` (plus the legacy
 * `[fiveprayer_widget]`), so a prefix test recognises all of them — including
 * the ones added later — without keeping a list in step with the registrations.
 *
 * @param string $text Text to scan, e.g. post content or a builder's layout.
 * @return bool
 */
function fiveprayer_text_has_shortcode($text) {
    if (!is_string($text) || $text === '') {
        return false;
    }

    return (bool) preg_match('/\[\s*(Fp_|fiveprayer)/i', $text);
}

/**
 * Does this post render FivePrayer output — in its content or in a builder?
 *
 * Page builders do not keep the shortcode in `post_content`: Elementor stores
 * its layout in `_elementor_data`, Breakdance in its own meta, Divi in the
 * `_et_pb_*` rows, WPBakery in `_wpb_vc_js_status`/content, Bricks and Oxygen
 * likewise. Testing only `post_content` therefore missed those pages, and the
 * plugin's stylesheet/scripts were never loaded on them — a builder page is
 * exactly where the prayers are dropped in as a widget. The post's own meta is
 * scanned as well, which covers every builder that stores its layout per post.
 *
 * @param WP_Post|int|null $post Post to inspect; defaults to the global post.
 * @return bool
 */
function fiveprayer_post_has_shortcode($post = null) {
    $post = get_post($post);
    if (!$post instanceof WP_Post) {
        return false;
    }

    if (fiveprayer_text_has_shortcode((string) $post->post_content)) {
        return true;
    }

    foreach (get_post_meta($post->ID) as $values) {
        foreach ((array) $values as $value) {
            if (fiveprayer_text_has_shortcode($value)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Does this text contain the next-prayer highlight marker?
 *
 * The highlighter only needs its script and stylesheet on a page that actually
 * holds a `.fiveprayer_highlight` container, so this is used to decide whether
 * to load them. Unlike a shortcode the marker can be dropped in by a page
 * builder's HTML/Code element, so it is not tied to `post_content` alone.
 *
 * @param string $text Text to scan, e.g. post content or a builder's layout.
 * @return bool
 */
function fiveprayer_text_has_highlight($text) {
    if (!is_string($text) || $text === '') {
        return false;
    }

    return (bool) preg_match('/fiveprayer_highlight\b/', $text);
}

/**
 * Does this post use the next-prayer highlight — in its content or a builder?
 *
 * Builder-aware, mirroring fiveprayer_post_has_shortcode(): the marker may be
 * saved in the post content or in a builder's own per-post meta, and both are
 * scanned so the highlighter's assets load on any builder page.
 *
 * @param WP_Post|int|null $post Post to inspect; defaults to the global post.
 * @return bool
 */
function fiveprayer_post_has_highlight($post = null) {
    $post = get_post($post);
    if (!$post instanceof WP_Post) {
        return false;
    }

    if (fiveprayer_text_has_highlight((string) $post->post_content)) {
        return true;
    }

    foreach (get_post_meta($post->ID) as $values) {
        foreach ((array) $values as $value) {
            if (fiveprayer_text_has_highlight($value)) {
                return true;
            }
        }
    }

    return false;
}

/**
 * Check whether the current frontend page has any FivePrayer shortcodes.
 * Result is cached per-request in a static variable so all consumers
 * share a single detection pass instead of repeating regex + array work.
 * Only caches after the main query is ready (after 'wp' action fires).
 *
 * Builder-aware: see fiveprayer_post_has_shortcode().
 *
 * @return bool
 */
function fiveprayer_has_shortcode_on_page() {
    static $result = null;
    if ($result !== null) {
        return $result;
    }

    if (is_admin() || wp_doing_ajax()) {
        return false;
    }

    global $post;
    if (!is_a($post, 'WP_Post')) {
        return false;
    }

    $result = fiveprayer_post_has_shortcode($post)
           || fiveprayer_content_has_time_sensitive_shortcodes($post->post_content)
           || fiveprayer_content_has_dynamic_text_patterns($post->post_content);

    return $result;
}

/**
 * Merge newly added default translations into an existing install.
 *
 * New translate entries (e.g. the next-prayer countdown unit words) ship in
 * FivePrayer_DatabaseTranslations; insertDefaultTranslations() only ADDS
 * missing entries, so user customizations are preserved. It normally runs on
 * activation, but this keeps existing installs in sync once per plugin version
 * without requiring a re-activation. Admins only, and guarded by an option so
 * it does at most one merge per release.
 */
function fiveprayer_maybe_merge_default_translations() {
    if (!is_admin() || !current_user_can('manage_options')) {
        return;
    }

    $stamp = function_exists('fiveprayer_get_plugin_version')
        ? fiveprayer_get_plugin_version()
        : '0.0.0';

    // Derive the stamp from the shipped defaults too, so installing a release
    // that adds new translate entries re-runs the (additive, edit-preserving)
    // merge without needing a plugin version bump. The retired-key list is part
    // of the stamp as well: a release that drops a renamed entry has to run the
    // merge once to remove the stored row.
    if (class_exists('\FivePrayer\Core\Database\FivePrayer_DatabaseTranslations')) {
        $defaults = \FivePrayer\Core\Database\FivePrayer_DatabaseTranslations::getTranslations();
        $retired  = \FivePrayer\Core\Database\FivePrayer_DatabaseTranslations::getRetiredPrayerNames();
        $stamp   .= ':' . md5((string) wp_json_encode($defaults) . '|' . implode(',', $retired));
    }

    if (get_option('fiveprayer_translations_merged_version') === $stamp) {
        return;
    }

    if (class_exists('\\FivePrayer\\Core\\Database\\SchemaHelper')) {
        (new \FivePrayer\Core\Database\SchemaHelper())->insertDefaultTranslations();
    }

    update_option('fiveprayer_translations_merged_version', $stamp);
}
add_action('admin_init', 'fiveprayer_maybe_merge_default_translations', 20);

/**
 * @deprecated Use fiveprayer_has_shortcode_on_page() for per-request caching.
 */

/**
 * Cache frequently accessed options to reduce database queries
 */
function fiveprayer_cache_frequently_used_options() {
    // Pre-cache commonly used options to reduce database queries
    $options_to_cache = [
        'fiveprayer_log_level',
        'fiveprayer_version',
        'time_format',
        'date_format',
        'timezone_string',
        'gmt_offset'
    ];

    foreach ($options_to_cache as $option_name) {
        get_option($option_name);
    }
}

/**
 * Get server information and diagnostic data for FivePrayer plugin
 */
function fiveprayer_get_server_info($post_id = null) {
    // Determine if we're checking a specific post or just getting general info
    $current_post = null;
    if ($post_id) {
        $current_post = get_post($post_id);
    } elseif (is_admin() && \FivePrayer\Core\Security\SecurityHelper::has_query_arg('post')) {
        // In admin context, might be checking a specific post
        $current_post = get_post(absint(\FivePrayer\Core\Security\SecurityHelper::get_sanitized_get_input('post')));
    } else {
        // For the server info tab, we'll just set these to false since we can't determine the context
        $current_time_shortcode_present = false;
        $next_prayer_shortcode_present = false;
    }

    // If we have a post, check for shortcodes
    if ($current_post && $current_post->post_content) {
        $current_time_shortcode_present = has_shortcode($current_post->post_content, 'Fp_Single_CurrentTime');
        $next_prayer_shortcode_present = has_shortcode($current_post->post_content, 'Fp_Single_NextPrayer');
    } else {
        $current_time_shortcode_present = false;
        $next_prayer_shortcode_present = false;
    }

    $server_info = array(
        'server_software' => fiveprayer_get_server_value('SERVER_SOFTWARE', 'Unknown'),
        'server_signature' => fiveprayer_get_server_value('SERVER_SIGNATURE', 'Not provided'),
        'server_name' => fiveprayer_get_server_value('SERVER_NAME', 'Unknown'),
        'server_addr' => fiveprayer_get_server_value('SERVER_ADDR', 'Unknown'),
        'server_protocol' => fiveprayer_get_server_value('SERVER_PROTOCOL', 'HTTP/1.1'),
        'php_version' => phpversion(),
        'php_sapi' => php_sapi_name(),
        'php_os' => PHP_OS,
        'php_architecture' => PHP_INT_SIZE === 4 ? '32-bit' : '64-bit',
        'wordpress_version' => get_bloginfo('version'),
        'plugin_version' => fiveprayer_get_plugin_version(),
        'memory_limit' => ini_get('memory_limit'),
        'max_execution_time' => ini_get('max_execution_time'),
        'max_input_time' => ini_get('max_input_time'),
        'upload_max_filesize' => ini_get('upload_max_filesize'),
        'post_max_size' => ini_get('post_max_size'),
        'max_input_vars' => ini_get('max_input_vars'),
        'allow_url_fopen' => ini_get('allow_url_fopen'),
        'allow_url_include' => ini_get('allow_url_include'),
        'display_errors' => ini_get('display_errors'),
        'log_errors' => ini_get('log_errors'),
        // The current error_reporting level is intentionally not reported: plugin
        // code must not call error_reporting(), and PHP exposes the level through
        // no other function.
        'timezone' => date_default_timezone_get(),
        'locale' => get_locale(),
        'wp_debug' => defined('WP_DEBUG') ? WP_DEBUG : false,
        'wp_debug_log' => defined('WP_DEBUG_LOG') ? WP_DEBUG_LOG : false,
        'wp_debug_display' => defined('WP_DEBUG_DISPLAY') ? WP_DEBUG_DISPLAY : false,
        'script_filename' => fiveprayer_get_server_value('SCRIPT_FILENAME', 'Unknown'),
        'document_root' => fiveprayer_get_server_value('DOCUMENT_ROOT', 'Unknown'),
        'https' => fiveprayer_get_server_value('HTTPS', 'off'),
        'remote_addr' => fiveprayer_get_server_value('REMOTE_ADDR', 'Unknown'),
        'http_host' => fiveprayer_get_server_value('HTTP_HOST', 'Unknown'),
        'opcache_enabled' => extension_loaded('Zend OPcache') && ini_get('opcache.enable'),
        'apcu_available' => extension_loaded('apcu'),
        'redis_available' => extension_loaded('redis'),
        'memcached_available' => extension_loaded('memcached'),
        'curl_available' => function_exists('curl_init'),
        'wp_cron_status' => array(
            'next_prayer_check' => wp_next_scheduled('fiveprayer_check_next_prayer_change'),
            'hourly_cache_check' => wp_next_scheduled('fiveprayer_hourly_cache_check'),
            'twice_daily_cache_check' => wp_next_scheduled('fiveprayer_twice_daily_cache_check'),
        ),
        'cache_plugins_active' => array(
            'wp_rocket' => defined('WP_ROCKET_VERSION'),
            'w3_total_cache' => defined('W3TC_VERSION'),
            'wp_super_cache' => class_exists('WP_Super_Cache') || function_exists('wp_cache_is_enabled'),
            'litespeed_cache' => defined('LSCWP_V'),
            'wp_fastest_cache' => class_exists('WpFastestCache'),
            'sg_optimizer' => function_exists('sg_cachepress_purge_cache'),
            'hummingbird' => class_exists('WP_Hummingbird'),
            'cache_enabler' => defined('CE_VERSION'),
            'comet_cache' => class_exists('comet_cache'),
            'wp_optimize' => class_exists('WP_Optimize'),
        ),
        'server_cache_info' => array(
            'wp_cache_constant' => defined('WP_CACHE') ? constant('WP_CACHE') : false,
            'wp_cache_setting' => get_option('permalink_structure') ? 'Enabled' : 'Not Set',
            'object_cache_enabled' => wp_using_ext_object_cache(),
            'opcache_enabled' => extension_loaded('Zend OPcache') && ini_get('opcache.enable'),
            'opcache_memory' => extension_loaded('Zend OPcache') && ini_get('opcache.enable') ? ini_get('opcache.memory_consumption') . 'MB' : 'N/A',
            'opcache_max_accelerated_files' => extension_loaded('Zend OPcache') && ini_get('opcache.enable') ? ini_get('opcache.max_accelerated_files') : 'N/A',
            'apcu_enabled' => extension_loaded('apcu') && ini_get('apcu.enabled'),
            'apcu_memory' => extension_loaded('apcu') && ini_get('apcu.enabled') ? ini_get('apc.shm_size') . 'MB' : 'N/A',
            'redis_extension' => extension_loaded('redis'),
            'redis_enabled' => fiveprayer_is_redis_enabled(),
            'memcached_extension' => extension_loaded('memcached'),
            'memcached_enabled' => fiveprayer_is_memcached_enabled(),
            'varnish_detected' => isset($_SERVER['HTTP_X_VARNISH']) || isset($_SERVER['HTTP_X_VARNISH_IP']),
            'cloudflare_detected' => isset($_SERVER['HTTP_CF_CONNECTING_IP']),
            'server_software' => fiveprayer_get_server_value('SERVER_SOFTWARE', 'Unknown'),
            'php_accelerator' => fiveprayer_detect_php_accelerator(),
            'eaccelerator' => extension_loaded('eaccelerator'),
            'xcache' => extension_loaded('xcache'),
            'wincache' => extension_loaded('wincache'),
            // Lower-case on purpose: extension_loaded() is case-insensitive and
            // the mixed-case spelling trips Plugin Check's obfuscation detector.
            'ioncube_loader' => extension_loaded('ioncube loader'),
            'suhosin' => extension_loaded('suhosin'),
            'imagick' => extension_loaded('imagick'),
            'gd_library' => extension_loaded('gd'),
            'exif' => extension_loaded('exif'),
            'zip' => extension_loaded('zip'),
            'mysqli' => extension_loaded('mysqli'),
            'pdo_mysql' => extension_loaded('pdo_mysql'),
            'curl' => extension_loaded('curl'),
            'openssl' => extension_loaded('openssl'),
            'mbstring' => extension_loaded('mbstring'),
            'xml' => extension_loaded('xml'),
            'json' => extension_loaded('json'),
            'zlib' => extension_loaded('zlib'),
            'bcmath' => extension_loaded('bcmath'),
            'intl' => extension_loaded('intl'),
            'tokenizer' => extension_loaded('tokenizer'),
            'xmlreader' => extension_loaded('XMLReader'),
            'simplexml' => extension_loaded('SimpleXML'),
            'dom' => extension_loaded('dom'),
            'filter' => extension_loaded('filter'),
            'hash' => extension_loaded('hash'),
        ),
        'fiveprayer_cron_jobs' => array(
            'next_prayer_check' => wp_next_scheduled('fiveprayer_check_next_prayer_change'),
            'hourly_cache_check' => wp_next_scheduled('fiveprayer_hourly_cache_check'),
            'twice_daily_cache_check' => wp_next_scheduled('fiveprayer_twice_daily_cache_check'),
        ),
        'fiveprayer_cache_status' => array(
            'transients_exist' => count(get_option('_transient_timeout', array())),
            'last_next_prayer_check' => get_option('fiveprayer_previous_check_time', 'Never'),
            'current_next_prayer' => get_option('fiveprayer_previous_next_prayer', 'Not set'),
        ),
        'javascript_status' => array(
            'dynamic_loader_enqueued' => fiveprayer_get_global_script_status()['dynamic_loader_enqueued'],
            'live_time_enqueued' => fiveprayer_get_global_script_status()['live_time_enqueued'],
        ),
        'current_page_javascript_status' => array(
            'dynamic_loader_enqueued' => fiveprayer_get_global_script_status()['dynamic_loader_enqueued'],
            'live_time_enqueued' => fiveprayer_get_global_script_status()['live_time_enqueued'],
        ),
        'global_javascript_usage' => array(
            'dynamic_loader_used_globally' => fiveprayer_get_global_script_status()['dynamic_loader_used_globally'],
            'live_time_used_globally' => fiveprayer_get_global_script_status()['live_time_used_globally'],
        ),
        'shortcode_detection' => array(
            'current_time_shortcode_present' => $current_time_shortcode_present,
            'next_prayer_shortcode_present' => $next_prayer_shortcode_present,
        )
    );

    return $server_info;
}

/**
 * Detect active PHP accelerator
 */
function fiveprayer_detect_php_accelerator() {
    if (extension_loaded('Zend OPcache')) {
        return 'OPcache';
    } elseif (extension_loaded('apcu')) {
        return 'APCu';
    } elseif (extension_loaded('ZendAccelerator')) {
        return 'Zend Accelerator';
    } else {
        return 'None';
    }
}

/**
 * Detect which persistent object-cache backend WordPress is actually using.
 *
 * Backend-agnostic and safe on any host: it inspects the live cache instance
 * first (PhpRedis, Predis, Memcached or a custom drop-in), then falls back to
 * configuration constants, and finally the drop-in file. It never assumes a
 * particular server layout, so the result is correct for every user's install.
 *
 * @return string One of 'redis', 'memcached', 'other', 'none'.
 */
function fiveprayer_detect_object_cache_backend() {
    if (!function_exists('wp_using_ext_object_cache') || !wp_using_ext_object_cache()) {
        return 'none';
    }

    // 1) Inspect the live object-cache instance. This works no matter how the
    //    cache was configured, and whether it uses a PHP extension or a
    //    pure-PHP client (e.g. Predis).
    $signals = '';
    if (isset($GLOBALS['wp_object_cache']) && is_object($GLOBALS['wp_object_cache'])) {
        $cache    = $GLOBALS['wp_object_cache'];
        $signals .= ' ' . get_class($cache);
        foreach ((array) $cache as $key => $value) {
            $signals .= ' ' . $key;
            if (is_object($value)) {
                $signals .= ' ' . get_class($value);
            }
        }
    }
    $signals = strtolower($signals);
    if ($signals !== '') {
        if (strpos($signals, 'redis') !== false || strpos($signals, 'predis') !== false) {
            return 'redis';
        }
        if (strpos($signals, 'memcache') !== false) {
            return 'memcached';
        }
    }

    // 2) Configuration constants (defined before the cache object exists).
    if (defined('WP_REDIS_HOST') || defined('WP_REDIS_PATH') || defined('WP_REDIS_SERVERS') || defined('WP_REDIS_PORT')) {
        return 'redis';
    }
    if (defined('WP_MEMCACHED_HOST') || defined('WP_MEMCACHED_SERVERS')) {
        return 'memcached';
    }

    // 3) The drop-in file itself.
    if (defined('WP_CONTENT_DIR') && file_exists(WP_CONTENT_DIR . '/object-cache.php')) {
        $dropin = (string) file_get_contents(WP_CONTENT_DIR . '/object-cache.php');
        if (stripos($dropin, 'redis') !== false || stripos($dropin, 'predis') !== false) {
            return 'redis';
        }
        if (stripos($dropin, 'memcach') !== false) {
            return 'memcached';
        }
    }

    return 'other';
}

/**
 * Whether Redis is the active WordPress object cache.
 */
function fiveprayer_is_redis_enabled() {
    return fiveprayer_detect_object_cache_backend() === 'redis';
}

/**
 * Whether Memcached is the active WordPress object cache.
 */
function fiveprayer_is_memcached_enabled() {
    return fiveprayer_detect_object_cache_backend() === 'memcached';
}

/**
 * Whether the PHP Redis/Memcached client extensions are available on this host.
 *
 * @return array{redis: bool, memcached: bool}
 */
function fiveprayer_get_object_cache_extensions() {
    return array(
        'redis'     => extension_loaded('redis'),
        'memcached' => extension_loaded('memcached') || extension_loaded('memcache'),
    );
}

/**
 * Names of active plugins on this site that can also provide a persistent
 * object cache (Redis/Memcached). Used to tell users they do not need to
 * install a separate object-cache plugin when one of these is already present.
 *
 * @return string[] Human-readable plugin names.
 */
function fiveprayer_get_object_cache_capable_plugins() {
    $candidates = array(
        'litespeed-cache/litespeed-cache.php'   => 'LiteSpeed Cache',
        'w3-total-cache/w3-total-cache.php'     => 'W3 Total Cache',
        'redis-cache/redis-cache.php'           => 'Redis Object Cache',
        'wp-redis/wp-redis.php'                 => 'WP Redis',
        'memcached/memcached.php'               => 'Memcached Object Cache',
        'object-cache-pro/object-cache-pro.php' => 'Object Cache Pro',
    );

    $active = array();
    if (function_exists('is_plugin_active')) {
        foreach ($candidates as $file => $name) {
            if (is_plugin_active($file)) {
                $active[] = $name;
            }
        }
        return $active;
    }

    // Fallback when is_plugin_active() is unavailable.
    if (defined('LSCWP_V')) {
        $active[] = 'LiteSpeed Cache';
    }
    if (defined('W3TC')) {
        $active[] = 'W3 Total Cache';
    }
    return $active;
}

/**
 * Test whether the configured Redis/Memcached server is reachable from this site.
 *
 * Runs a short, bounded connection test (never longer than the timeout) so the
 * admin can tell the difference between "no server reachable" and "no drop-in".
 * Safe on any host: returns a plain array and never throws.
 *
 * @return array{results: array<int, array{backend: string, target: string, extension: bool, reachable: bool, detail: string}>}
 */
function fiveprayer_test_object_cache_connection() {
    $extensions = fiveprayer_get_object_cache_extensions();

    // Nothing to test if no client library is available at all.
    if (empty($extensions['redis']) && empty($extensions['memcached'])) {
        return array(
            'results'       => array(),
            'reachable'     => array(),
            'any_reachable' => false,
            'checked'       => 0,
            'extensions'    => $extensions,
        );
    }

    $results   = array();
    $reachable = array();

    foreach (fiveprayer_get_object_cache_targets() as $target) {
        $result           = fiveprayer_probe_object_cache_backend(
            $target['backend'],
            $target['host'],
            $target['port'],
            $target['socket'],
            0.6
        );
        $result['source'] = $target['source'];
        $results[]        = $result;

        if ($result['reachable']) {
            $reachable[] = $result;
        }
    }

    return array(
        'results'       => $results,
        'reachable'     => $reachable,
        'any_reachable' => !empty($reachable),
        'checked'       => count($results),
        'extensions'    => $extensions,
    );
}

/**
 * Read the object-cache server address saved by the caching plugins that can
 * provide a persistent object cache (LiteSpeed Cache and W3 Total Cache).
 *
 * These are the exact host/port (or unix socket) values the user can see in
 * their cache plugin's settings, so testing them tells the user whether the
 * address they already configured actually works.
 *
 * @return array<int, array{backend: string, host: string, port: int, socket: bool, source: string}>
 */
function fiveprayer_get_plugin_configured_cache_targets() {
    $targets = array();

    // --- LiteSpeed Cache --------------------------------------------------
    // Stored as individual options: litespeed.conf.object-host / -port / -kind.
    if (function_exists('get_option')) {
        $ls_host = get_option('litespeed.conf.object-host', '');
        if (is_string($ls_host) && $ls_host !== '') {
            // object-kind truthy => Redis, otherwise Memcached.
            $is_redis  = (bool) get_option('litespeed.conf.object-kind', false);
            $backend   = $is_redis ? 'redis' : 'memcached';
            $port      = (int) get_option('litespeed.conf.object-port', $is_redis ? 6379 : 11211);
            $socket    = strpos($ls_host, '/') !== false;
            $targets[] = array(
                'backend' => $backend,
                'host'    => $ls_host,
                'port'    => $socket ? 0 : $port,
                'socket'  => $socket,
                'source'  => 'LiteSpeed Cache',
            );
        }
    }

    // --- W3 Total Cache ---------------------------------------------------
    $w3tc = fiveprayer_read_w3tc_config();
    if (!empty($w3tc)) {
        $engine  = isset($w3tc['objectcache.engine']) ? strtolower((string) $w3tc['objectcache.engine']) : '';
        $servers = array();
        if ($engine === 'redis') {
            $servers = isset($w3tc['objectcache.redis.servers']) ? (array) $w3tc['objectcache.redis.servers'] : array();
        } elseif ($engine === 'memcached') {
            $servers = isset($w3tc['objectcache.memcached.servers']) ? (array) $w3tc['objectcache.memcached.servers'] : array();
        } elseif (!empty($w3tc['objectcache.redis.servers'])) {
            // Engine not set: fall back to whichever server list exists.
            $engine  = 'redis';
            $servers = (array) $w3tc['objectcache.redis.servers'];
        } elseif (!empty($w3tc['objectcache.memcached.servers'])) {
            $engine  = 'memcached';
            $servers = (array) $w3tc['objectcache.memcached.servers'];
        }

        $default_port = ($engine === 'memcached') ? 11211 : 6379;
        foreach ($servers as $server) {
            $parsed = fiveprayer_parse_cache_server((string) $server, $default_port);
            if ($parsed) {
                $parsed['backend'] = ($engine === 'memcached') ? 'memcached' : 'redis';
                $parsed['source']  = 'W3 Total Cache';
                $targets[]         = $parsed;
            }
        }
    }

    return $targets;
}

/**
 * Load the W3 Total Cache configuration as a flat array.
 *
 * W3TC keeps its settings either in the database (option "w3tc_config_<blog id>"
 * when W3TC_CONFIG_DATABASE is set) or in a file under wp-content/w3tc-config.
 * Both are tried and neither is fatal when missing.
 *
 * @return array<string, mixed>
 */
function fiveprayer_read_w3tc_config() {
    $config = array();

    // Database storage.
    if (function_exists('get_option')) {
        $blog_id = function_exists('get_current_blog_id') ? (int) get_current_blog_id() : 1;
        foreach (array($blog_id, 0) as $id) {
            $raw     = get_option('w3tc_config_' . $id, '');
            $decoded = is_string($raw) ? json_decode($raw, true) : null;
            if (is_array($decoded)) {
                $config = array_merge($config, $decoded);
            }
        }
    }

    // File storage: master config then blog-specific config (blog overrides).
    $dirs = array();
    if (defined('W3TC_CONFIG_DIR')) {
        $dirs[] = rtrim(W3TC_CONFIG_DIR, '/');
    }
    if (defined('WP_CONTENT_DIR')) {
        $dirs[] = rtrim(WP_CONTENT_DIR, '/') . '/w3tc-config';
        $dirs[] = rtrim(WP_CONTENT_DIR, '/') . '/uploads/w3tc-config';
    }
    $blog_id = function_exists('get_current_blog_id') ? (int) get_current_blog_id() : 1;
    $files   = array('master.php');
    if ($blog_id > 0) {
        $files[] = sprintf('%06d.php', $blog_id);
    }
    foreach ($dirs as $dir) {
        foreach ($files as $file) {
            $path = $dir . '/' . $file;
            if (is_readable($path)) {
                $decoded = fiveprayer_parse_w3tc_config_file($path);
                if (is_array($decoded)) {
                    $config = array_merge($config, $decoded);
                }
            }
        }
    }

    return $config;
}

/**
 * Decode a W3 Total Cache config file: a PHP guard header followed by JSON.
 *
 * @param string $path Absolute path to the config file.
 *
 * @return array<string, mixed>|null
 */
function fiveprayer_parse_w3tc_config_file($path) {
    $content = @file_get_contents($path);
    if (!is_string($content) || $content === '') {
        return null;
    }
    // Skip the PHP exit-guard header: decode from the first JSON brace.
    $start = strpos($content, '{');
    if ($start === false) {
        return null;
    }
    $decoded = json_decode(substr($content, $start), true);
    return is_array($decoded) ? $decoded : null;
}

/**
 * Parse a "host:port", "[ipv6]:port", or unix socket path into a candidate.
 *
 * @param string $server       Server string from a cache plugin.
 * @param int    $default_port Port to use when none is present.
 *
 * @return array{host: string, port: int, socket: bool}|null
 */
function fiveprayer_parse_cache_server($server, $default_port = 6379) {
    $server = trim((string) $server);
    if ($server === '') {
        return null;
    }

    // Unix socket path, optionally prefixed with unix:// or redis://.
    if (strpos($server, '/') !== false) {
        $path = preg_replace('#^[a-z0-9+.\-]+://#i', '', $server);
        return array('host' => $path, 'port' => 0, 'socket' => true);
    }

    // IPv6 in brackets: [::1]:6379
    if (preg_match('#^\[(.+)\](?::(\d+))?$#', $server, $m)) {
        return array(
            'host'   => $m[1],
            'port'   => isset($m[2]) ? (int) $m[2] : (int) $default_port,
            'socket' => false,
        );
    }

    // Plain host[:port].
    if (substr_count($server, ':') === 1) {
        $pos = strrpos($server, ':');
        return array(
            'host'   => substr($server, 0, $pos),
            'port'   => (int) substr($server, $pos + 1),
            'socket' => false,
        );
    }

    return array('host' => $server, 'port' => (int) $default_port, 'socket' => false);
}

/**
 * Build the list of places a Redis/Memcached server might be, without the user
 * having to know anything about it.
 *
 * Looks at WordPress constants, environment variables (many managed hosts set
 * these), the site's own home directory, common unix socket paths, and the
 * usual TCP defaults. Returns de-duplicated, ordered candidates.
 *
 * @return array<int, array{backend: string, host: string, port: int, socket: bool, source: string}>
 */
function fiveprayer_get_object_cache_targets() {
    $targets = array();
    $seen    = array();

    $add = function ($backend, $host, $port, $socket, $source) use (&$targets, &$seen) {
        $host = trim((string) $host);
        if ($host === '') {
            return;
        }
        $socket = $socket || strpos($host, '/') !== false;
        $port   = $socket ? 0 : (int) $port;
        $key    = $backend . '|' . ($socket ? ('unix:' . $host) : ($host . ':' . $port));
        if (isset($seen[$key])) {
            return;
        }
        $seen[$key] = true;
        $targets[]  = array(
            'backend' => $backend,
            'host'    => $host,
            'port'    => $port,
            'socket'  => $socket,
            'source'  => $source,
        );
    };

    // --- Redis: explicit configuration first ------------------------------
    if (defined('WP_REDIS_PATH') && WP_REDIS_PATH) {
        $add('redis', WP_REDIS_PATH, 0, true, 'constant');
    }
    if (defined('WP_REDIS_HOST') && WP_REDIS_HOST) {
        $add('redis', WP_REDIS_HOST, defined('WP_REDIS_PORT') ? (int) WP_REDIS_PORT : 6379, false, 'constant');
    }

    // --- Addresses already saved by a caching plugin (LiteSpeed, W3TC) ----
    // Test exactly what the user configured so we can confirm it works.
    foreach (fiveprayer_get_plugin_configured_cache_targets() as $plugin_target) {
        $add(
            $plugin_target['backend'],
            $plugin_target['host'],
            $plugin_target['port'],
            $plugin_target['socket'],
            $plugin_target['source']
        );
    }

    // --- Redis: environment variables (common on managed hosts) -----------
    $env_url = getenv('REDIS_URL') ?: getenv('REDIS_TLS_URL');
    if ($env_url) {
        $parts = wp_parse_url($env_url);
        if (is_array($parts) && !empty($parts['host'])) {
            $add('redis', $parts['host'], isset($parts['port']) ? (int) $parts['port'] : 6379, false, 'environment');
        }
    }
    foreach (array('WP_REDIS_HOST', 'REDIS_HOST', 'REDIS_HOSTNAME') as $var) {
        $value = getenv($var);
        if ($value) {
            $add('redis', $value, (int) (getenv('WP_REDIS_PORT') ?: getenv('REDIS_PORT') ?: 6379), false, 'environment');
        }
    }
    foreach (array('WP_REDIS_PATH', 'REDIS_SOCKET', 'REDIS_PATH') as $var) {
        $value = getenv($var);
        if ($value) {
            $add('redis', $value, 0, true, 'environment');
        }
    }

    // --- Memcached: explicit configuration, then environment -------------- 
    if (defined('WP_MEMCACHED_HOST') && WP_MEMCACHED_HOST) {
        $add('memcached', WP_MEMCACHED_HOST, defined('WP_MEMCACHED_PORT') ? (int) WP_MEMCACHED_PORT : 11211, false, 'constant');
    }
    foreach (array('WP_MEMCACHED_HOST', 'MEMCACHED_HOST', 'MEMCACHED_SERVER') as $var) {
        $value = getenv($var);
        if ($value) {
            $add('memcached', $value, (int) (getenv('WP_MEMCACHED_PORT') ?: getenv('MEMCACHED_PORT') ?: 11211), false, 'environment');
        }
    }

    // --- Derived home directory (for per-account sockets) -----------------
    $homes = array();
    foreach (array(getenv('HOME'), fiveprayer_get_server_value('HOME')) as $home) {
        if (is_string($home) && $home !== '') {
            $homes[] = rtrim($home, '/');
        }
    }
    if (defined('ABSPATH') && preg_match('#^(/[^/]+/[^/]+)/#', ABSPATH, $m)) {
        $homes[] = $m[1];
    }
    $homes = array_values(array_unique($homes));

    // --- Common Redis sockets --------------------------------------------
    $redis_sockets = array(
        '/run/redis/redis.sock',
        '/var/run/redis/redis.sock',
        '/run/redis-server.sock',
        '/var/run/redis.sock',
        '/tmp/redis.sock',
        '/var/lib/redis/redis.sock',
    );
    foreach ($homes as $home) {
        $redis_sockets[] = $home . '/.redis/redis.sock';
        $redis_sockets[] = $home . '/redis/redis.sock';
    }
    foreach (array_unique($redis_sockets) as $path) {
        $add('redis', $path, 0, true, 'common');
    }

    // --- Common Memcached sockets ----------------------------------------
    $memcached_sockets = array(
        '/var/run/memcached.sock',
        '/run/memcached.sock',
        '/tmp/memcached.sock',
    );
    foreach ($homes as $home) {
        $memcached_sockets[] = $home . '/.memcached/memcached.sock';
    }
    foreach (array_unique($memcached_sockets) as $path) {
        $add('memcached', $path, 0, true, 'common');
    }

    // --- TCP defaults -----------------------------------------------------
    foreach (array('127.0.0.1', 'localhost', '::1') as $host) {
        $add('redis', $host, 6379, false, 'default');
    }
    foreach (array('127.0.0.1', 'localhost') as $host) {
        $add('memcached', $host, 11211, false, 'default');
    }

    return $targets;
}

/**
 * Probe a single object-cache backend with a bounded connection test.
 *
 * @param string $backend 'redis' or 'memcached'.
 * @param string $host    Host, IP, or unix socket path.
 * @param int    $port    Port (ignored for sockets).
 * @param bool   $socket  Whether $host is a unix socket path.
 * @param float  $timeout Connection timeout in seconds.
 *
 * @return array{backend: string, target: string, extension: bool, reachable: bool, detail: string}
 */
function fiveprayer_probe_object_cache_backend($backend, $host, $port, $socket = false, $timeout = 1.0) {
    $extensions = fiveprayer_get_object_cache_extensions();
    $extension  = !empty($extensions[$backend]);

    // Treat a path-like host as a unix socket even if the caller did not say so.
    $socket = $socket || strpos((string) $host, '/') !== false;
    $target = $socket ? $host : ($host . ':' . $port);

    $result = array(
        'backend'   => $backend,
        'target'    => $target,
        'extension' => $extension,
        'reachable' => false,
        'detail'    => '',
    );

    // Port 0 is only meaningful with a unix socket; there is no TCP port 0.
    if (!$socket && (int) $port === 0) {
        $result['detail'] = __('Port 0 is only used with a unix socket. Provide the socket path (WP_REDIS_PATH, or a path in the host) instead of a port.', 'fiveprayer');
        return $result;
    }

    if (!$extension) {
        $result['detail'] = __('PHP extension is not installed on this server.', 'fiveprayer');
        return $result;
    }

    $errno    = 0;
    $errstr   = '';
    // Bracket bare IPv6 addresses so tcp://[::1]:6379 is valid.
    $tcp_host = (strpos($host, ':') !== false && strpos($host, '[') === false) ? ('[' . $host . ']') : $host;
    $address  = $socket ? ('unix://' . $host) : ('tcp://' . $tcp_host . ':' . $port);
    $timeout  = ((float) $timeout) > 0 ? (float) $timeout : 1.0;

    $connection = @stream_socket_client($address, $errno, $errstr, $timeout);
    if ($connection) {
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- Closing a network stream, not a file.
        fclose($connection);
        $result['reachable'] = true;
        $result['detail']    = $socket
            ? __('Unix socket is reachable from this site.', 'fiveprayer')
            : __('Server is reachable from this site.', 'fiveprayer');
        return $result;
    }

    if ($errstr !== '') {
        /* translators: %s: error message returned by the connection attempt. */
        $result['detail'] = sprintf(__('Connection failed: %s', 'fiveprayer'), $errstr);
    } else {
        $result['detail'] = __('Connection refused — nothing is listening on this address.', 'fiveprayer');
    }

    return $result;
}

/**
 * Utility function to specifically test FivePrayer plugin database tables
 */
if (!function_exists('fiveprayer_test_plugin_tables')) {
    function fiveprayer_test_plugin_tables() {
        global $wpdb;

        // Enable monitoring if not already enabled
        if (!defined('FIVEPRAYER_DB_MONITOR')) {
            define('FIVEPRAYER_DB_MONITOR', true);
        }

        if (!defined('SAVEQUERIES')) {
            define('SAVEQUERIES', true); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- SAVEQUERIES is a WordPress core constant, not one this plugin introduces.
        }

        // Load the monitoring system if not already loaded
        $monitor_file = FIVEPRAYER_ABSPATH . 'dev-tools/db-query-monitor/QueryMonitorLoader.php';
        if (file_exists($monitor_file) && !class_exists('\\FivePrayer\\DevTools\\QueryMonitor\\QueryMonitor')) {
            require_once $monitor_file;
        }

        // Initialize the query monitor
        $query_monitor = \FivePrayer\DevTools\QueryMonitor\QueryMonitor::getInstance();
        $query_monitor->enableMonitoring();

        // Run specific queries against FivePrayer plugin tables that are actually used in the plugin
        $fp_tables = [
            $wpdb->prefix . 'fp_prayer_settings_meta',  // Used for settings and meta data
            $wpdb->prefix . 'fp_timetable',             // Used for prayer time tables
            $wpdb->prefix . 'fp_api_keys'               // Used for API key management
        ];

        $results = [];

        // Every query in this routine is intentionally uncached: it exists to
        // profile real query performance against the plugin tables, so serving
        // the results from a cache would make the timings meaningless.
        foreach ($fp_tables as $table) {
            // Check if table exists
            $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching

            if ($table_exists) {
                echo "Testing queries on FivePrayer table: {$table}\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped

                // Test SELECT query
                $start_time = microtime(true);
                $select_results = $wpdb->get_results($wpdb->prepare("SELECT id, prayer_date, fajr, sunrise, dhuhr, asr, maghrib, isha, location FROM %i LIMIT 5", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
                $select_time = microtime(true) - $start_time;

                $results[] = [
                    'table' => $table,
                    'query_type' => 'SELECT',
                    'execution_time' => $select_time,
                    'rows_returned' => count($select_results),
                    'query' => "SELECT id, prayer_date, fajr, sunrise, dhuhr, asr, maghrib, isha, location FROM {$table} LIMIT 5"
                ];

                // Test COUNT query
                $start_time = microtime(true);
                $count_result = $wpdb->get_var($wpdb->prepare("SELECT COUNT(*) FROM %i", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
                $count_time = microtime(true) - $start_time;

                $results[] = [
                    'table' => $table,
                    'query_type' => 'COUNT',
                    'execution_time' => $count_time,
                    'rows_returned' => $count_result,
                    'query' => "SELECT COUNT(*) FROM {$table}"
                ];

                // If it's the timetable table, test a date-specific query
                if (strpos($table, 'fp_timetable') !== false) {
                    $start_time = microtime(true);
                    $date_query_results = $wpdb->get_results($wpdb->prepare("SELECT id, prayer_date, fajr, sunrise, dhuhr, asr, maghrib, isha, location FROM %i WHERE date >= CURDATE() LIMIT 3", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
                    $date_query_time = microtime(true) - $start_time;

                    $results[] = [
                        'table' => $table,
                        'query_type' => 'DATE_SELECT',
                        'execution_time' => $date_query_time,
                        'rows_returned' => count($date_query_results),
                        'query' => "SELECT id, prayer_date, fajr, sunrise, dhuhr, asr, maghrib, isha, location FROM {$table} WHERE date >= CURDATE() LIMIT 3"
                    ];
                }

                echo "  - SELECT query: " . number_format($select_time, 4) . "s (" . count($select_results) . " rows)\n";
                echo "  - COUNT query: " . number_format($count_time, 4) . "s (count: {$count_result})\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
                if (strpos($table, 'fp_timetable') !== false) {
                    echo "  - Date query: " . number_format($date_query_time, 4) . "s (" . count($date_query_results) . " rows)\n";
                }
            } else {
                echo "FivePrayer table does not exist: {$table}\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            }
        }

        // Process all queries that were just executed
        $query_monitor->processAllQueries();

        // Generate and print the report
        $analyzer = new \FivePrayer\DevTools\QueryMonitor\QueryAnalyzer($query_monitor);
        $reporter = new \FivePrayer\DevTools\QueryMonitor\QueryReporter($query_monitor, $analyzer);

        echo "\nGenerating report with FivePrayer plugin table queries...\n\n";
        $reporter->printFullReport();

        return $results;
    }
}

/**
 * Filter to control whether FivePrayer elements should be available in Oxygen Builder
 * By default, this returns false to hide FivePrayer elements from Oxygen
 */
add_filter('fiveprayer_enable_oxygen_integration', function($enabled) {
    // Oxygen integration is disabled by default
    // Set to true to enable FivePrayer elements in Oxygen Builder
    return false; // Disable Oxygen integration to hide FivePrayer category
});

/**
 * Filter to control whether FivePrayer elements should be available in Breakdance
 * By default, this returns false to hide FivePrayer elements from Breakdance
 */
add_filter('fiveprayer_enable_breakdance_integration', function($enabled) {
    // Breakdance integration is disabled by default
    // Set to true to enable FivePrayer elements in Breakdance
    return false; // Disable Breakdance integration to hide FivePrayer category
});

/**
 * Timetable query source files inspected by the sargable-query regression check.
 *
 * @return string[] Paths relative to the plugin root.
 */
function fiveprayer_get_timetable_query_files() {
    return [
        'php/classes/core/helpers/Traits/TimetableDataTrait.php',
        'php/classes/core/Calendar/RamadanMonthCalendar.php',
        'php/classes/core/controllers/api/endpoints/PrayerTimeTableController.php',
        'php/classes/core/controllers/api/endpoints/Traits/PrayerTimeEndpointTrait.php',
        'php/classes/core/controllers/api/endpoints/Traits/PrayerTimeResponseBuilderTrait.php',
    ];
}

/**
 * Strip PHP comments from a source string.
 *
 * The timetable code documents why YEAR(date) must not be used, so the check
 * has to match real code only and ignore those explanatory comments.
 */
function fiveprayer_strip_php_comments($source) {
    if (!function_exists('token_get_all')) {
        return $source;
    }

    $stripped = '';
    foreach (token_get_all($source) as $token) {
        if (is_array($token)) {
            if ($token[0] === T_COMMENT || $token[0] === T_DOC_COMMENT) {
                continue;
            }
            $stripped .= $token[1];
        } else {
            $stripped .= $token;
        }
    }

    return $stripped;
}

/**
 * Regression check for the timetable query path.
 *
 * Verifies that the fp_timetable_date index exists and that the timetable
 * queries stay sargable: no YEAR(date)/MONTH(date) predicates remain and an
 * indexed date-range predicate is present.
 *
 * @return array{passed: bool, checks: array<int, array{key:string,label:string,passed:bool,detail:string}>}
 */
function fiveprayer_run_timetable_query_regression_check() {
    global $wpdb;

    $table      = $wpdb->prefix . 'fp_timetable';
    $index_name = 'fp_timetable_date';
    $checks     = [];

    // 1. The date index exists.
    $index_exists = false;
    if (class_exists('\FivePrayer\Core\Database\SchemaHelper')) {
        $schema       = new \FivePrayer\Core\Database\SchemaHelper();
        $index_exists = $schema->indexExists($table, $index_name);
    }

    $checks[] = [
        'key'    => 'index_exists',
        'label'  => sprintf(
            /* translators: 1: index name, 2: database table name. */
            __('Index %1$s exists on %2$s', 'fiveprayer'),
            $index_name,
            $table
        ),
        'passed' => $index_exists,
        'detail' => $index_exists
            ? __('The timetable date index is present.', 'fiveprayer')
            : __('The timetable date index is missing. Re-activate the plugin to run the index migration.', 'fiveprayer'),
    ];

    // 2. The queries are sargable.
    $non_sargable = [];
    $has_range    = false;

    foreach (fiveprayer_get_timetable_query_files() as $relative_file) {
        $file = FIVEPRAYER_ABSPATH . $relative_file;
        if (!file_exists($file)) {
            continue;
        }

        $source = fiveprayer_strip_php_comments((string) file_get_contents($file));

        if (preg_match('/YEAR\s*\(\s*[`"\']?date[`"\']?\s*\)/i', $source)
            || preg_match('/MONTH\s*\(\s*[`"\']?date[`"\']?\s*\)/i', $source)) {
            $non_sargable[] = $relative_file;
        }

        if (preg_match('/date\s*>=\s*(%s|CURDATE)/i', $source)
            && preg_match('/date\s*<\s*(%s|CURDATE)/i', $source)) {
            $has_range = true;
        }
    }

    $sargable = empty($non_sargable) && $has_range;

    $checks[] = [
        'key'    => 'sargable_queries',
        'label'  => __('Timetable queries use an indexed date range', 'fiveprayer'),
        'passed' => $sargable,
        'detail' => $sargable
            ? __('No YEAR(date)/MONTH(date) predicates found and a date-range predicate is present.', 'fiveprayer')
            : sprintf(
                /* translators: 1: offending files, 2: yes/no. */
                __('Non-sargable predicates found in: %1$s. Range predicate present: %2$s.', 'fiveprayer'),
                $non_sargable ? implode(', ', $non_sargable) : __('none', 'fiveprayer'),
                $has_range ? __('yes', 'fiveprayer') : __('no', 'fiveprayer')
            ),
    ];

    $passed = true;
    foreach ($checks as $check) {
        if (!$check['passed']) {
            $passed = false;
            break;
        }
    }

    return ['passed' => $passed, 'checks' => $checks];
}

/**
 * Persistent object-cache status for the admin health panel.
 *
 * @return array{enabled: bool, backend: string, backend_key: string, redis: bool, memcached: bool, extensions: array{redis: bool, memcached: bool}}
 */
function fiveprayer_get_object_cache_status() {
    $enabled = function_exists('wp_using_ext_object_cache') && wp_using_ext_object_cache();

    $backend_key = $enabled ? fiveprayer_detect_object_cache_backend() : 'none';
    if ($enabled && $backend_key === 'none') {
        $backend_key = 'other';
    }

    $labels = array(
        'redis'     => __('Redis', 'fiveprayer'),
        'memcached' => __('Memcached', 'fiveprayer'),
        'other'     => __('Persistent drop-in (unrecognised backend)', 'fiveprayer'),
        'none'      => __('None', 'fiveprayer'),
    );

    return array(
        'enabled'     => $enabled,
        'backend'     => $labels[$backend_key],
        'backend_key' => $backend_key,
        'redis'       => $backend_key === 'redis',
        'memcached'   => $backend_key === 'memcached',
        'extensions'  => fiveprayer_get_object_cache_extensions(),
    );
}
<?php
/**
 * Security regression checks for the FivePrayer hardening changes.
 *
 * Run from the WordPress root:
 *
 *   php wp-content/plugins/fiveprayer/tests/php/test-security-hardening.php
 *
 * These are integration checks against a bootstrapped WordPress install, not
 * PHPUnit tests: the plugin does not ship a PHPUnit harness, and these
 * invariants must hold against the real REST server and the real capability
 * system.
 *
 * @package FivePrayer
 */

// The file is a CLI test; it must never be reachable over HTTP.
if (!defined('ABSPATH') && 'cli' !== PHP_SAPI) {
    exit;
}

$fiveprayer_wp_root = dirname(__DIR__, 5);

if (!file_exists($fiveprayer_wp_root . '/wp-load.php')) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI test diagnostics, not a web response.
    fwrite(STDERR, "Could not find wp-load.php. Run this file from the plugin's tests/php directory.\n");
    exit(1);
}

require_once $fiveprayer_wp_root . '/wp-load.php';

// Belt and braces for static analysis: after wp-load.php, ABSPATH is defined.
defined('ABSPATH') || exit;

use FivePrayer\Core\API\ApiKeyManager;
use FivePrayer\Core\Controllers\API\EndPoints\TranslateController;
use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Security\SecurityHelper;

$fiveprayer_failures = 0;

/**
 * Assert a condition and print the result.
 *
 * @param bool   $condition Condition to assert.
 * @param string $message   Description of the invariant.
 * @return void
 */
function fiveprayer_assert($condition, $message) {
    global $fiveprayer_failures;

    if ($condition) {
        echo esc_html("PASS: {$message}\n");
        return;
    }

    ++$fiveprayer_failures;
    echo esc_html("FAIL: {$message}\n");
}

/**
 * Fetch the permission callback registered for a route.
 *
 * @param string $route Route regex, e.g. /fiveprayer/v1/translations.
 * @param string $method HTTP method.
 * @return callable|null
 */
function fiveprayer_route_permission_callback($route, $method) {
    $fiveprayer_routes = rest_get_server()->get_routes();

    // register_rest_route() normalises a trailing slash away.
    $fiveprayer_candidates = [$route, rtrim($route, '/') . '/', rtrim($route, '/')];

    foreach ($fiveprayer_candidates as $fiveprayer_candidate) {
        if (!isset($fiveprayer_routes[$fiveprayer_candidate])) {
            continue;
        }

        foreach ($fiveprayer_routes[$fiveprayer_candidate] as $fiveprayer_handler) {
            if (isset($fiveprayer_handler['methods'][$method]) && !empty($fiveprayer_handler['permission_callback'])) {
                return $fiveprayer_handler['permission_callback'];
            }
        }
    }

    return null;
}

// Register every REST controller the plugin registers.
// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- WordPress core hook.
do_action('rest_api_init');

$fiveprayer_permission = fiveprayer_route_permission_callback('/fiveprayer/v1/translations', 'POST');
fiveprayer_assert(is_callable($fiveprayer_permission), 'the translations POST route is registered');

if (!is_callable($fiveprayer_permission)) {
    echo esc_html("\nFAILED: cannot continue without the route permission callback\n");
    exit(1);
}

// Administrators may save translations.
wp_set_current_user(1);
fiveprayer_assert(true === (bool) call_user_func($fiveprayer_permission), 'an administrator passes the translations permission check');

// A Contributor must not. Create one only for this check and remove it again.
$fiveprayer_contributor_id = wp_create_user(
    'fp_audit_contrib_' . wp_generate_password(8, false),
    wp_generate_password(24),
    'fiveprayer-audit-' . wp_generate_password(8, false) . '@example.invalid'
);

if (is_wp_error($fiveprayer_contributor_id)) {
    fiveprayer_assert(false, 'could not create a temporary Contributor for the permission check');
} else {
    $fiveprayer_contributor = new WP_User($fiveprayer_contributor_id);
    $fiveprayer_contributor->set_role('contributor');

    wp_set_current_user($fiveprayer_contributor_id);

    fiveprayer_assert(false === (bool) call_user_func($fiveprayer_permission), 'a Contributor is denied the translations write endpoint');

    require_once ABSPATH . 'wp-admin/includes/user.php';
    wp_delete_user($fiveprayer_contributor_id);
}

wp_set_current_user(0);

// Translation payloads are normalised before they reach the database.
$fiveprayer_controller = new TranslateController();
$fiveprayer_sanitize   = new ReflectionMethod(TranslateController::class, 'sanitize_translation_entries');
$fiveprayer_sanitize->setAccessible(true);

$fiveprayer_clean = $fiveprayer_sanitize->invoke(
    $fiveprayer_controller,
    [
        [
            'original_text'   => 'Fajr',
            'translated_text' => '<script>alert(1)</script>Fajr',
            'language_code'   => 'en',
            'language_name'   => 'English',
            'unexpected'      => 'value',
        ],
        'not-an-entry',
        ['unexpected_only' => 'value'],
    ]
);

fiveprayer_assert(is_array($fiveprayer_clean) && 1 === count($fiveprayer_clean), 'malformed translation entries are dropped');
fiveprayer_assert(isset($fiveprayer_clean[0]) && false === strpos($fiveprayer_clean[0]['translated_text'], '<'), 'translation text is sanitised before storage');
fiveprayer_assert(isset($fiveprayer_clean[0]) && !array_key_exists('unexpected', $fiveprayer_clean[0]), 'unknown entry fields are discarded');

$fiveprayer_malformed = $fiveprayer_sanitize->invoke($fiveprayer_controller, [['unexpected_only' => 'value']]);
fiveprayer_assert(null === $fiveprayer_malformed, 'a non-empty collection with no valid entries is not written');

$fiveprayer_empty = $fiveprayer_sanitize->invoke($fiveprayer_controller, []);
fiveprayer_assert([] === $fiveprayer_empty, 'an explicitly empty collection can still be cleared');

// `activeLanguage` keeps only its language code, which is enough to select a language.
$fiveprayer_active = $fiveprayer_sanitize->invoke($fiveprayer_controller, [['language_code' => 'ar', 'junk' => '<b>x</b>']]);
fiveprayer_assert(isset($fiveprayer_active[0]['language_code']) && 'ar' === $fiveprayer_active[0]['language_code'] && !isset($fiveprayer_active[0]['junk']), 'activeLanguage entries keep only the language code');

// `hijralocale` is an object, not a list, and must keep its booleans.
$fiveprayer_locale = $fiveprayer_sanitize->invoke(
    $fiveprayer_controller,
    [
        'isActive'     => true,
        'language'     => 'ar',
        'calendarType' => 'hijri',
        'custom'       => false,
        'customLan'    => '1',
    ]
);
fiveprayer_assert(true === $fiveprayer_locale['isActive'] && true === $fiveprayer_locale['customLan'] && 'ar' === $fiveprayer_locale['language'], 'hijralocale keeps its boolean and text fields');

// The log directory is not web-readable.
$fiveprayer_log_path = Logger::get_log_file_path();
$fiveprayer_log_dir  = dirname($fiveprayer_log_path) . '/';

fiveprayer_assert(file_exists($fiveprayer_log_dir . '.htaccess'), 'the log directory has an Apache deny rule');
fiveprayer_assert(file_exists($fiveprayer_log_dir . 'index.php'), 'the log directory has an index.php guard');
fiveprayer_assert(file_exists($fiveprayer_log_dir . 'web.config'), 'the log directory has an IIS deny rule');

if (file_exists($fiveprayer_log_dir . '.htaccess')) {
    $fiveprayer_rules = file_get_contents($fiveprayer_log_dir . '.htaccess');
    fiveprayer_assert(false !== strpos($fiveprayer_rules, 'Require all denied'), 'the Apache rule denies direct access');
}

// ---------------------------------------------------------------------------
// API key lifecycle
// ---------------------------------------------------------------------------

// Forwarded headers are client-controlled. They must only be honoured when the
// direct peer is a proxy the site explicitly listed; otherwise an unauthenticated
// caller chooses the address used for brute-force lockouts and audit columns.
$fiveprayer_original_server = $_SERVER;

$_SERVER['REMOTE_ADDR']          = '203.0.113.10';
$_SERVER['HTTP_X_FORWARDED_FOR'] = '8.8.8.8';
$_SERVER['HTTP_CF_CONNECTING_IP'] = '8.8.4.4';
$_SERVER['HTTP_X_REAL_IP']        = '1.1.1.1';

fiveprayer_assert('203.0.113.10' === SecurityHelper::get_client_ip(), 'spoofed forwarding headers are ignored by default');

$fiveprayer_trust_proxy = static function () {
    return ['203.0.113.10'];
};
add_filter('fiveprayer_trusted_proxy_ips', $fiveprayer_trust_proxy);
fiveprayer_assert('8.8.4.4' === SecurityHelper::get_client_ip(), 'forwarded address is used when the peer is a trusted proxy');
remove_filter('fiveprayer_trusted_proxy_ips', $fiveprayer_trust_proxy);

$fiveprayer_trust_range = static function () {
    return ['203.0.113.0/24'];
};
add_filter('fiveprayer_trusted_proxy_ips', $fiveprayer_trust_range);
fiveprayer_assert('8.8.4.4' === SecurityHelper::get_client_ip(), 'a trusted proxy range is accepted');
remove_filter('fiveprayer_trusted_proxy_ips', $fiveprayer_trust_range);

$fiveprayer_trust_other = static function () {
    return ['10.9.9.9'];
};
add_filter('fiveprayer_trusted_proxy_ips', $fiveprayer_trust_other);
fiveprayer_assert('203.0.113.10' === SecurityHelper::get_client_ip(), 'a forwarded address from an untrusted peer is rejected');
remove_filter('fiveprayer_trusted_proxy_ips', $fiveprayer_trust_other);

// A site behind the Cloudflare proxy must need no configuration at all: the
// edge address in REMOTE_ADDR is recognised and the visitor address is used.
$_SERVER['REMOTE_ADDR']           = '173.245.48.10';
$_SERVER['HTTP_CF_CONNECTING_IP'] = '8.8.4.4';
$_SERVER['HTTP_X_FORWARDED_FOR']  = '';
$_SERVER['HTTP_X_REAL_IP']        = '';

fiveprayer_assert(
    '8.8.4.4' === SecurityHelper::get_client_ip(),
    'a Cloudflare edge peer is recognised without any configuration'
);

$fiveprayer_disable_cf = static function () {
    return false;
};
add_filter('fiveprayer_trust_cloudflare_proxies', $fiveprayer_disable_cf);
fiveprayer_assert(
    '173.245.48.10' === SecurityHelper::get_client_ip(),
    'Cloudflare auto-detection can be switched off'
);
remove_filter('fiveprayer_trust_cloudflare_proxies', $fiveprayer_disable_cf);

// A proxy appends to X-Forwarded-For, so a client-supplied prefix must not be
// used: the right-most real hop is the address the site can verify.
$_SERVER['HTTP_CF_CONNECTING_IP'] = '';
$_SERVER['HTTP_X_FORWARDED_FOR']  = '9.9.9.9, 8.8.8.8';

fiveprayer_assert(
    '8.8.8.8' === SecurityHelper::get_client_ip(),
    'the right-most forwarded hop is used instead of a spoofed prefix'
);

// Private or loopback values in a forwarding header are never returned.
$_SERVER['HTTP_X_FORWARDED_FOR']  = '127.0.0.1, 10.0.0.5';

fiveprayer_assert(
    '173.245.48.10' === SecurityHelper::get_client_ip(),
    'a forwarded private address falls back to the direct peer'
);

// Cloudflare's IPv6 edge ranges are recognised as well.
$_SERVER['REMOTE_ADDR']           = '2606:4700:10::1';
$_SERVER['HTTP_CF_CONNECTING_IP'] = '1.1.1.1';
$_SERVER['HTTP_X_FORWARDED_FOR']  = '';

fiveprayer_assert(
    '1.1.1.1' === SecurityHelper::get_client_ip(),
    'Cloudflare IPv6 edge ranges are recognised'
);

$_SERVER = $fiveprayer_original_server;

// Managed API key admin actions must never be reachable without authentication.
$fiveprayer_api_ajax_actions = [
    'fp_api_create_key',
    'fp_api_revoke_key',
    'fp_api_delete_key',
    'fp_api_regenerate_key',
    'fp_api_copy_key',
    'fp_api_migrate_legacy_keys',
    'fp_api_update_key',
];

foreach ($fiveprayer_api_ajax_actions as $fiveprayer_action) {
    fiveprayer_assert(false === has_action('wp_ajax_nopriv_' . $fiveprayer_action), $fiveprayer_action . ' has no unauthenticated AJAX handler');
}

// Permission/CIDR logic is private: exercise it directly.
$fiveprayer_manager    = new ApiKeyManager();
$fiveprayer_ip_in_cidr = new ReflectionMethod(ApiKeyManager::class, 'ip_in_range');
$fiveprayer_ip_in_cidr->setAccessible(true);

fiveprayer_assert(true === $fiveprayer_ip_in_cidr->invoke($fiveprayer_manager, '10.1.2.3', '10.0.0.0/8'), 'an address inside an IPv4 CIDR range is accepted');
fiveprayer_assert(false === $fiveprayer_ip_in_cidr->invoke($fiveprayer_manager, '11.1.2.3', '10.0.0.0/8'), 'an address outside an IPv4 CIDR range is rejected');
fiveprayer_assert(true === $fiveprayer_ip_in_cidr->invoke($fiveprayer_manager, '192.168.4.9', '192.168.4.0/24'), 'a /24 boundary match is accepted');
fiveprayer_assert(true === $fiveprayer_ip_in_cidr->invoke($fiveprayer_manager, '2001:db8::1', '2001:db8::/32'), 'IPv6 CIDR ranges are evaluated');
fiveprayer_assert(false === $fiveprayer_ip_in_cidr->invoke($fiveprayer_manager, '2001:db9::1', '2001:db8::/32'), 'an address outside an IPv6 CIDR range is rejected');
fiveprayer_assert(false === $fiveprayer_ip_in_cidr->invoke($fiveprayer_manager, '10.1.2.3', '10.0.0.0/33'), 'an out-of-range mask is rejected instead of crashing');
fiveprayer_assert(false === $fiveprayer_ip_in_cidr->invoke($fiveprayer_manager, '10.1.2.3', 'not-a-cidr'), 'a malformed CIDR value is rejected');

$fiveprayer_extract_endpoint = new ReflectionMethod(ApiKeyManager::class, 'extract_endpoint');
$fiveprayer_extract_endpoint->setAccessible(true);

fiveprayer_assert('prayer-times' === $fiveprayer_extract_endpoint->invoke($fiveprayer_manager, '/wp-json/fiveprayer/v1/external/prayer-times'), 'pretty permalink endpoints are recognised');
fiveprayer_assert('prayer-times' === $fiveprayer_extract_endpoint->invoke($fiveprayer_manager, '/?rest_route=/fiveprayer/v1/external/prayer-times'), 'plain permalink endpoints are recognised');
fiveprayer_assert('prayer-times/today' === $fiveprayer_extract_endpoint->invoke($fiveprayer_manager, '/sub/wp-json/fiveprayer/v1/external/prayer-times/today'), 'subdirectory installs are recognised');
fiveprayer_assert('' === $fiveprayer_extract_endpoint->invoke($fiveprayer_manager, '/wp-json/wp/v2/posts'), 'unrelated routes yield no endpoint');

$fiveprayer_extract_route = new ReflectionMethod(ApiKeyManager::class, 'extract_route_endpoint');
$fiveprayer_extract_route->setAccessible(true);

fiveprayer_assert('prayer-times/today' === $fiveprayer_extract_route->invoke($fiveprayer_manager, '/fiveprayer/v1/external/prayer-times/today'), 'the REST route yields its endpoint name');
fiveprayer_assert('' === $fiveprayer_extract_route->invoke($fiveprayer_manager, '/wp/v2/posts'), 'a route outside the external namespace yields no endpoint');

// A key that cannot be decrypted must never authenticate. decrypt_key() returns
// '' for those rows and hash_equals('', '') is true, so an empty credential was
// able to match a legacy or damaged row.
$fiveprayer_empty_result = $fiveprayer_manager->validate_key('');
fiveprayer_assert(false === $fiveprayer_empty_result['valid'], 'an empty API key is rejected');

// End-to-end lifecycle against the real table.
global $wpdb;

$fiveprayer_keys_table = $wpdb->prefix . 'fp_api_keys';

/*
 * The direct queries below are test-harness bookkeeping against a scratch
 * table. SHOW TABLES has no cache API, and the deletes must reach the real row
 * so that a stale object-cache entry cannot hide a failed cleanup; caching
 * either one would make this suite report a state the database is not in.
 */
// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- schema probe; no cache equivalent exists.
$fiveprayer_keys_ready = $wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $fiveprayer_keys_table)) === $fiveprayer_keys_table;

if (!$fiveprayer_keys_ready) {
    echo esc_html("SKIP: API key lifecycle checks (the API keys table does not exist in this install)\n");
} else {
    $fiveprayer_created = $fiveprayer_manager->generate_key('fp audit temporary key', 'created by the security regression suite');

    if (empty($fiveprayer_created['success'])) {
        fiveprayer_assert(false, 'a temporary API key could be generated for the lifecycle check');
    } else {
        $fiveprayer_key_id  = (int) $fiveprayer_created['id'];
        $fiveprayer_raw_key = (string) $fiveprayer_created['api_key'];

        // KEY_LENGTH is the number of random bytes requested, and half of it is
        // passed to random_bytes(), so a key carries 128 bits of entropy.
        fiveprayer_assert(1 === preg_match('/^fp_[0-9a-f]{32}$/', $fiveprayer_raw_key), 'a generated API key is 128 random bits in hex');
        fiveprayer_assert($fiveprayer_raw_key === $fiveprayer_manager->get_full_key($fiveprayer_key_id), 'the stored key decrypts back to the generated value');
        fiveprayer_assert(
            false === wp_cache_get('fiveprayer_api_key_secret_' . $fiveprayer_key_id, 'fiveprayer'),
            'the plaintext key is not written to the object cache'
        );

        $fiveprayer_valid = $fiveprayer_manager->validate_key($fiveprayer_raw_key);
        fiveprayer_assert(true === $fiveprayer_valid['valid'], 'a freshly generated key authenticates');

        fiveprayer_assert(false === $fiveprayer_manager->validate_key($fiveprayer_raw_key . 'x')['valid'], 'a modified key does not authenticate');

        fiveprayer_assert(true === $fiveprayer_manager->revoke_key($fiveprayer_key_id), 'a key can be revoked');
        fiveprayer_assert(false === $fiveprayer_manager->validate_key($fiveprayer_raw_key)['valid'], 'a revoked key stops authenticating immediately');

        fiveprayer_assert(true === $fiveprayer_manager->delete_key($fiveprayer_key_id), 'a key can be deleted');
        fiveprayer_assert(null === $fiveprayer_manager->get_key($fiveprayer_key_id), 'a deleted key is gone from the cache and the table');

        // Per-key endpoint and address restrictions are enforced against the
        // route actually being served, not a value re-derived from REQUEST_URI.
        $fiveprayer_scoped = $fiveprayer_manager->generate_key(
            'fp audit scoped key',
            '',
            null,
            ['endpoints' => ['prayer-times*'], 'ips' => ['203.0.113.0/24']]
        );

        if (empty($fiveprayer_scoped['success'])) {
            fiveprayer_assert(false, 'a scoped API key could be generated');
        } else {
            $fiveprayer_scoped_id  = (int) $fiveprayer_scoped['id'];
            $fiveprayer_scoped_key = (string) $fiveprayer_scoped['api_key'];
            // Saved only so it can be put back below; an address is unaffected by
            // the sanitizer, so the restored value is identical to the original.
            $fiveprayer_saved_addr = isset($_SERVER['REMOTE_ADDR'])
                ? sanitize_text_field(wp_unslash($_SERVER['REMOTE_ADDR']))
                : null;

            $_SERVER['REMOTE_ADDR'] = '203.0.113.42';

            fiveprayer_assert(
                true === $fiveprayer_manager->validate_key($fiveprayer_scoped_key, '/fiveprayer/v1/external/prayer-times/today')['valid'],
                'a key restricted to its route and address authenticates'
            );

            fiveprayer_assert(
                false === $fiveprayer_manager->validate_key($fiveprayer_scoped_key, '/fiveprayer/v1/external/next-prayer')['valid'],
                'a key is refused on a route outside its endpoint allowlist'
            );

            $_SERVER['REMOTE_ADDR'] = '198.51.100.5';

            fiveprayer_assert(
                false === $fiveprayer_manager->validate_key($fiveprayer_scoped_key, '/fiveprayer/v1/external/prayer-times/today')['valid'],
                'a key is refused from an address outside its address allowlist'
            );

            if (null === $fiveprayer_saved_addr) {
                unset($_SERVER['REMOTE_ADDR']);
            } else {
                $_SERVER['REMOTE_ADDR'] = $fiveprayer_saved_addr;
            }

            $fiveprayer_manager->delete_key($fiveprayer_scoped_id);
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- test cleanup must delete the real row.
            $wpdb->delete($fiveprayer_keys_table, ['id' => $fiveprayer_scoped_id], ['%d']);

            // A blank allowlist entry (trailing comma) must not allow everything.
            $fiveprayer_blank = $fiveprayer_manager->generate_key('fp audit blank allowlist', '', null, ['endpoints' => [',']]);

            if (empty($fiveprayer_blank['success'])) {
                fiveprayer_assert(false, 'a blank-allowlist key could be generated');
            } else {
                fiveprayer_assert(
                    false === $fiveprayer_manager->validate_key((string) $fiveprayer_blank['api_key'], '/wp/v2/posts')['valid'],
                    'an undeterminable route is denied even when the allowlist contains blank entries'
                );

                $fiveprayer_manager->delete_key((int) $fiveprayer_blank['id']);
                // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- test cleanup must delete the real row.
                $wpdb->delete($fiveprayer_keys_table, ['id' => (int) $fiveprayer_blank['id']], ['%d']);
            }
        }

        // Cleanup: the revoked row is removed above; make sure nothing lingers.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- test cleanup must delete the real row.
        $wpdb->delete($fiveprayer_keys_table, ['id' => $fiveprayer_key_id], ['%d']);
    }
}

echo $fiveprayer_failures > 0
    ? esc_html("\nFAILED: {$fiveprayer_failures} check(s)\n")
    : esc_html("\nPASS: all security regression checks\n");

exit($fiveprayer_failures > 0 ? 1 : 0);

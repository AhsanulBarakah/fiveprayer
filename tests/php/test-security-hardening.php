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
use FivePrayer\Core\Assets\ESIDynamicContentHandler;
use FivePrayer\Core\Controllers\API\EndPoints\PrayerSettingsMetaController;
use FivePrayer\Core\Controllers\API\EndPoints\TranslateController;
use FivePrayer\Core\Helpers\PrayerFieldMap;
use FivePrayer\Core\LocalNetworkRouter;
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

// Log lines must not carry e-mail addresses or API keys.
$fiveprayer_redact = new ReflectionMethod(Logger::class, 'redact');
$fiveprayer_redact->setAccessible(true);
$fiveprayer_log_line = $fiveprayer_redact->invoke(
    null,
    'Test email to mosque@example.com with key fp_0123456789abcdef0123456789abcdef failed'
);
fiveprayer_assert(false === strpos($fiveprayer_log_line, 'mosque@example.com'), 'an e-mail address is redacted from log lines');
fiveprayer_assert(false === strpos($fiveprayer_log_line, 'fp_0123456789abcdef0123456789abcdef'), 'an API key is redacted from log lines');
fiveprayer_assert(false !== strpos($fiveprayer_log_line, '[redacted-email]'), 'the e-mail redaction marker is present');

// ---------------------------------------------------------------------------
// Uninstall cleanup coverage
// ---------------------------------------------------------------------------

// Every option / transient the plugin writes has to be removed when
// "Delete all data on uninstall" is on. This walks the code and checks each
// literal name against the cleanup list in uninstall.php.
$fiveprayer_plugin_root      = dirname(__DIR__, 2);
$fiveprayer_uninstall_source = (string) file_get_contents($fiveprayer_plugin_root . '/uninstall.php');

preg_match_all("/esc_like\\('([^']+)'\\)/", $fiveprayer_uninstall_source, $fiveprayer_pattern_matches);
$fiveprayer_uninstall_prefixes = $fiveprayer_pattern_matches[1] ?? [];

preg_match_all("/'(fp_[a-z0-9_]+)'/", $fiveprayer_uninstall_source, $fiveprayer_exact_matches);
$fiveprayer_uninstall_exact = array_values(array_unique($fiveprayer_exact_matches[1] ?? []));

$fiveprayer_is_covered = static function (string $name) use ($fiveprayer_uninstall_prefixes, $fiveprayer_uninstall_exact): bool {
    if (in_array($name, $fiveprayer_uninstall_exact, true)) {
        return true;
    }

    foreach ($fiveprayer_uninstall_prefixes as $fiveprayer_prefix) {
        if (0 === strpos($name, $fiveprayer_prefix)) {
            return true;
        }
    }

    return false;
};

foreach (['fp_brute_force_settings', 'fp_brute_cooldown_level', 'fp_brute_email_cooldown', 'fp_mosque_address', 'fp_mosque_phone', 'fp_mosque_website', 'fp_notice_dismissed_until'] as $fiveprayer_required) {
    fiveprayer_assert($fiveprayer_is_covered($fiveprayer_required), 'uninstall cleanup covers ' . $fiveprayer_required);
}

fiveprayer_assert(
    in_array('_transient_fp_brute_', $fiveprayer_uninstall_prefixes, true),
    'uninstall cleanup deletes every per-address brute-force transient'
);
fiveprayer_assert(
    in_array('_transient_timeout_fp_brute_', $fiveprayer_uninstall_prefixes, true),
    'uninstall cleanup deletes every brute-force transient timeout row'
);

// Options owned by WordPress or another plugin must never be deleted.
$fiveprayer_foreign_options = [
    'time_format', 'date_format', 'timezone_string', 'gmt_offset', 'admin_email',
    'permalink_structure', '_transient_timeout',
];

$fiveprayer_option_calls = [];
$fiveprayer_php_files    = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($fiveprayer_plugin_root . '/php', FilesystemIterator::SKIP_DOTS)
);

foreach ($fiveprayer_php_files as $fiveprayer_php_file) {
    if ('php' !== strtolower($fiveprayer_php_file->getExtension())) {
        continue;
    }

    $fiveprayer_php_source = (string) file_get_contents($fiveprayer_php_file->getPathname());
    preg_match_all(
        "/(?:get_option|update_option|add_option|delete_option|get_transient|set_transient|delete_transient)\\s*\\(\\s*'([^']+)'/",
        $fiveprayer_php_source,
        $fiveprayer_call_matches
    );

    foreach ($fiveprayer_call_matches[1] ?? [] as $fiveprayer_call_name) {
        $fiveprayer_option_calls[$fiveprayer_call_name] = true;
    }
}

$fiveprayer_uncovered = [];

foreach (array_keys($fiveprayer_option_calls) as $fiveprayer_call_name) {
    if (in_array($fiveprayer_call_name, $fiveprayer_foreign_options, true)
        || 0 === strpos($fiveprayer_call_name, 'litespeed.')
        || 0 === strpos($fiveprayer_call_name, 'w3tc_config_')) {
        continue;
    }

    $fiveprayer_owned = 0 === strpos($fiveprayer_call_name, 'fiveprayer_')
        || 0 === strpos($fiveprayer_call_name, 'ifiiri_fiveprayer_')
        || 0 === strpos($fiveprayer_call_name, 'fp_')
        || 0 === strpos($fiveprayer_call_name, '_transient_fp_')
        || 0 === strpos($fiveprayer_call_name, '_transient_timeout_fp_');

    if ($fiveprayer_owned && !$fiveprayer_is_covered($fiveprayer_call_name)) {
        $fiveprayer_uncovered[] = $fiveprayer_call_name;
    }
}

fiveprayer_assert(
    [] === $fiveprayer_uncovered,
    'every plugin option and transient literal in php/ is covered by uninstall cleanup'
        . ($fiveprayer_uncovered ? ' (missing: ' . implode(', ', $fiveprayer_uncovered) . ')' : '')
);

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

// A missing or empty key is not a failed guess. Counting it let any website
// lock out a shared IP (mosque Wi-Fi, carrier NAT) by making its visitors'
// browsers send keyless requests to the wildcard-CORS external API.
$fiveprayer_keyless_ip           = '198.51.100.44';
$fiveprayer_previous_remote_addr = isset($_SERVER['REMOTE_ADDR']) ? $_SERVER['REMOTE_ADDR'] : null;

$_SERVER['REMOTE_ADDR'] = $fiveprayer_keyless_ip;

$fiveprayer_brute_option = get_option(\FivePrayer\Core\API\BruteForceSettings::OPTION_NAME, []);
update_option(\FivePrayer\Core\API\BruteForceSettings::OPTION_NAME, array_merge(
    is_array($fiveprayer_brute_option) ? $fiveprayer_brute_option : [],
    ['enabled' => true]
));
\FivePrayer\Core\API\BruteForceSettings::clear_settings_cache();

$fiveprayer_keyless_transient = \FivePrayer\Core\API\BruteForceSettings::get_transient_key($fiveprayer_keyless_ip);
delete_transient($fiveprayer_keyless_transient);

$fiveprayer_manager->validate_key('');
fiveprayer_assert(false === get_transient($fiveprayer_keyless_transient), 'an empty API key does not count as a failed attempt');

$fiveprayer_keyless_controller = new \FivePrayer\Core\Controllers\API\EndPoints\ExternalApiController();
$fiveprayer_keyless_result     = $fiveprayer_keyless_controller->check_api_key(
    new WP_REST_Request('GET', '/fiveprayer/v1/external/prayer-times/today')
);

$fiveprayer_keyless_status = $fiveprayer_keyless_result instanceof WP_Error
    ? (int) ($fiveprayer_keyless_result->get_error_data()['status'] ?? 0)
    : 0;

fiveprayer_assert(401 === $fiveprayer_keyless_status, 'a request without an API key still answers 401');
fiveprayer_assert(false === get_transient($fiveprayer_keyless_transient), 'a request without an API key does not count as a failed attempt');

// A wrong key must still count, or the protection would stop working.
$fiveprayer_manager->validate_key('fiveprayer_this_key_does_not_exist');
fiveprayer_assert(false !== get_transient($fiveprayer_keyless_transient), 'a wrong API key still counts as a failed attempt');

delete_transient($fiveprayer_keyless_transient);
update_option(\FivePrayer\Core\API\BruteForceSettings::OPTION_NAME, $fiveprayer_brute_option);
\FivePrayer\Core\API\BruteForceSettings::clear_settings_cache();

if (null === $fiveprayer_previous_remote_addr) {
    unset($_SERVER['REMOTE_ADDR']);
} else {
    $_SERVER['REMOTE_ADDR'] = $fiveprayer_previous_remote_addr;
}

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
        // Only a keyed hash is stored: the plaintext must not be readable back.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- test reads the real row.
        $fiveprayer_row = $wpdb->get_row($wpdb->prepare(
            "SELECT api_key, key_hash FROM %i WHERE id = %d",
            $fiveprayer_keys_table,
            $fiveprayer_key_id
        ));

        fiveprayer_assert(null === $fiveprayer_manager->get_full_key($fiveprayer_key_id), 'the plaintext key cannot be read back from storage');
        fiveprayer_assert(
            $fiveprayer_row && hash_equals(hash_hmac('sha256', $fiveprayer_raw_key, wp_salt('auth')), (string) $fiveprayer_row->key_hash),
            'the stored value is the keyed hash of the generated key'
        );
        fiveprayer_assert(
            $fiveprayer_row && (null === $fiveprayer_row->api_key || '' === $fiveprayer_row->api_key),
            'the reversible api_key column is cleared'
        );
        fiveprayer_assert(
            false === wp_cache_get('fiveprayer_api_key_secret_' . $fiveprayer_key_id, 'fiveprayer'),
            'the plaintext key is not written to the object cache'
        );

        $fiveprayer_valid = $fiveprayer_manager->validate_key($fiveprayer_raw_key);
        fiveprayer_assert(true === $fiveprayer_valid['valid'], 'a freshly generated key authenticates');

        $fiveprayer_modified = $fiveprayer_manager->validate_key($fiveprayer_raw_key . 'x');
        fiveprayer_assert(false === $fiveprayer_modified['valid'], 'a modified key does not authenticate');
        fiveprayer_assert('Invalid API key' === $fiveprayer_modified['error'], 'an unknown key answers with the generic message');

        fiveprayer_assert(true === $fiveprayer_manager->revoke_key($fiveprayer_key_id), 'a key can be revoked');

        $fiveprayer_revoked = $fiveprayer_manager->validate_key($fiveprayer_raw_key);
        fiveprayer_assert(false === $fiveprayer_revoked['valid'], 'a revoked key stops authenticating immediately');
        fiveprayer_assert('Invalid API key' === $fiveprayer_revoked['error'], 'a revoked key answers with the same generic message as an unknown key');

        // Expired keys must be indistinguishable from unknown and revoked ones.
        $fiveprayer_expired = $fiveprayer_manager->generate_key('fp audit expired key', '', '2000-01-01 00:00:00');
        if (empty($fiveprayer_expired['success'])) {
            fiveprayer_assert(false, 'an expiring key could be generated');
        } else {
            $fiveprayer_expired_result = $fiveprayer_manager->validate_key((string) $fiveprayer_expired['api_key']);
            fiveprayer_assert(false === $fiveprayer_expired_result['valid'], 'an expired key does not authenticate');
            fiveprayer_assert('Invalid API key' === $fiveprayer_expired_result['error'], 'an expired key answers with the same generic message');
            $fiveprayer_manager->delete_key((int) $fiveprayer_expired['id']);
        }

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

        // The one-time migration reads AES rows written by an older version,
        // writes their hash and clears the ciphertext.
        $fiveprayer_legacy_plain = 'fp_' . bin2hex(random_bytes(16));
        $fiveprayer_legacy_aes   = hash('sha256', AUTH_KEY . SECURE_AUTH_KEY . 'fiveprayer-api-key-encryption', true);
        $fiveprayer_legacy_iv    = random_bytes((int) openssl_cipher_iv_length('aes-256-cbc'));
        $fiveprayer_legacy_blob  = base64_encode(
            $fiveprayer_legacy_iv
            . openssl_encrypt($fiveprayer_legacy_plain, 'aes-256-cbc', $fiveprayer_legacy_aes, OPENSSL_RAW_DATA, $fiveprayer_legacy_iv)
        );

        $wpdb->insert($fiveprayer_keys_table, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            'api_key'    => $fiveprayer_legacy_blob,
            'key_hash'   => null,
            'name'       => 'fp audit legacy key',
            'created_by' => 0,
        ]);
        $fiveprayer_legacy_id = (int) $wpdb->insert_id;

        $fiveprayer_migrated = $fiveprayer_manager->migrate_existing_keys_to_hashes();

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- test reads the real row.
        $fiveprayer_legacy_row = $wpdb->get_row($wpdb->prepare(
            "SELECT api_key, key_hash FROM %i WHERE id = %d",
            $fiveprayer_keys_table,
            $fiveprayer_legacy_id
        ));

        fiveprayer_assert(false !== $fiveprayer_migrated, 'the legacy migration runs when the salts are present');
        fiveprayer_assert(
            $fiveprayer_legacy_row && hash_equals(hash_hmac('sha256', $fiveprayer_legacy_plain, wp_salt('auth')), (string) $fiveprayer_legacy_row->key_hash),
            'a legacy encrypted row is migrated to its keyed hash'
        );
        fiveprayer_assert(
            $fiveprayer_legacy_row && (null === $fiveprayer_legacy_row->api_key || '' === $fiveprayer_legacy_row->api_key),
            'the legacy ciphertext is cleared after migration'
        );
        fiveprayer_assert(
            true === $fiveprayer_manager->validate_key($fiveprayer_legacy_plain)['valid'],
            'a migrated legacy key still authenticates with its original value'
        );

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- test cleanup must delete the real row.
        $wpdb->delete($fiveprayer_keys_table, ['id' => $fiveprayer_legacy_id], ['%d']);

        // Cleanup: the revoked row is removed above; make sure nothing lingers.
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- test cleanup must delete the real row.
        $wpdb->delete($fiveprayer_keys_table, ['id' => $fiveprayer_key_id], ['%d']);
    }
}

// ---------------------------------------------------------------------------
// ESI fragments
// ---------------------------------------------------------------------------

// An ESI URL is handed to a page cache, so it cannot carry a credential that
// expires: the nonce it used to hold covered only the fragment id, which left
// `type` and `atts` free for anyone who copied one URL from a public page.
$fiveprayer_esi       = ESIDynamicContentHandler::getInstance();
$fiveprayer_esi_sig   = new ReflectionMethod(ESIDynamicContentHandler::class, 'generateESISignature');
$fiveprayer_esi_types = new ReflectionMethod(ESIDynamicContentHandler::class, 'getESIAllowedTypes');
$fiveprayer_esi_url   = new ReflectionMethod(ESIDynamicContentHandler::class, 'generateESIURL');
$fiveprayer_esi_types->setAccessible(true);
$fiveprayer_esi_url->setAccessible(true);

$fiveprayer_atts      = base64_encode((string) wp_json_encode(['field' => 'fajr_begins_time']));
$fiveprayer_other     = base64_encode((string) wp_json_encode(['field' => 'isha_begins_time']));
$fiveprayer_signature = $fiveprayer_esi_sig->invoke($fiveprayer_esi, 'single_prayer', $fiveprayer_atts, 'abc123');

fiveprayer_assert('' !== $fiveprayer_signature, 'an ESI request is signed');
fiveprayer_assert(
    $fiveprayer_signature === $fiveprayer_esi_sig->invoke($fiveprayer_esi, 'single_prayer', $fiveprayer_atts, 'abc123'),
    'the same ESI request always yields the same signature'
);
fiveprayer_assert(
    $fiveprayer_signature !== $fiveprayer_esi_sig->invoke($fiveprayer_esi, 'next_prayer', $fiveprayer_atts, 'abc123'),
    'an ESI request with a changed type is rejected'
);
fiveprayer_assert(
    $fiveprayer_signature !== $fiveprayer_esi_sig->invoke($fiveprayer_esi, 'single_prayer', $fiveprayer_other, 'abc123'),
    'an ESI request with changed attributes is rejected'
);
fiveprayer_assert(
    $fiveprayer_signature !== $fiveprayer_esi_sig->invoke($fiveprayer_esi, 'single_prayer', $fiveprayer_atts, 'other-id'),
    'an ESI request with a changed id is rejected'
);

fiveprayer_assert(
    ['current_time', 'next_prayer', 'single_prayer', 'daily_prayer_table', 'monthly_prayer_table'] === $fiveprayer_esi_types->invoke($fiveprayer_esi),
    'the ESI type allowlist is exactly the five supported content types'
);
fiveprayer_assert(
    !in_array('arbitrary_content', $fiveprayer_esi_types->invoke($fiveprayer_esi), true),
    'an unknown ESI content type is not allowed'
);

$fiveprayer_generated = $fiveprayer_esi_url->invoke($fiveprayer_esi, 'single_prayer', ['field' => 'fajr_begins_time'], 'abc123');
$fiveprayer_query     = [];
wp_parse_str((string) wp_parse_url($fiveprayer_generated, PHP_URL_QUERY), $fiveprayer_query);

fiveprayer_assert(false === strpos($fiveprayer_generated, 'nonce='), 'the public ESI URL no longer carries a nonce');
fiveprayer_assert(isset($fiveprayer_query['sig']) && '' !== $fiveprayer_query['sig'], 'the public ESI URL carries a signature');
fiveprayer_assert(
    isset($fiveprayer_query['sig'], $fiveprayer_query['atts']) && $fiveprayer_signature === $fiveprayer_query['sig'],
    'the signature covers the attributes the URL actually carries'
);

// The signature has no lifetime: the same URL must still verify a week later.
$fiveprayer_time_kept = false;
if (isset($fiveprayer_query['type'], $fiveprayer_query['atts'], $fiveprayer_query['sig'], $fiveprayer_query['id'])) {
    $fiveprayer_time_kept = hash_equals(
        $fiveprayer_esi_sig->invoke($fiveprayer_esi, (string) $fiveprayer_query['type'], (string) $fiveprayer_query['atts'], (string) $fiveprayer_query['id']),
        (string) $fiveprayer_query['sig']
    );
}
fiveprayer_assert($fiveprayer_time_kept, 'a cached ESI URL still verifies because the signature does not expire');

// Only the renderers' own attributes survive, exactly as for the shortcode.
$fiveprayer_esi_atts = new ReflectionMethod(ESIDynamicContentHandler::class, 'sanitizeESIAtts');
$fiveprayer_esi_atts->setAccessible(true);
fiveprayer_assert(
    ['field' => 'fajr_begins_time'] === $fiveprayer_esi_atts->invoke($fiveprayer_esi, 'single_prayer', ['field' => 'fajr_begins_time', 'unknown' => 'x']),
    'unknown ESI attributes are dropped'
);
fiveprayer_assert(
    [] === $fiveprayer_esi_atts->invoke($fiveprayer_esi, 'monthly_prayer_table', ['whatever' => 'x']),
    'the monthly table fragment accepts no attributes, like its shortcode'
);

// The fragment is served from init:1 only; a second registration meant the
// handler ran twice on every fragment request.
fiveprayer_assert(
    !has_action('plugins_loaded', [$fiveprayer_esi, 'handleESIRequest']),
    'the ESI handler is not registered on plugins_loaded as well as init'
);

fiveprayer_assert(1 === has_action('init', [$fiveprayer_esi, 'handleESIRequest']), 'the ESI handler is registered on init');

// ---------------------------------------------------------------------------
// Dynamic content
// ---------------------------------------------------------------------------

// One action, one callback. The action used to be registered by two handlers,
// so the first one to run answered and the second could never execute.
global $wp_filter;

$fiveprayer_count_callbacks = static function ($hook) use (&$wp_filter) {
    if (!isset($wp_filter[$hook])) {
        return 0;
    }

    $count = 0;

    foreach ($wp_filter[$hook]->callbacks as $callbacks) {
        $count += count($callbacks);
    }

    return $count;
};

fiveprayer_assert(
    1 === $fiveprayer_count_callbacks('wp_ajax_nopriv_fiveprayer_dynamic_content'),
    'exactly one callback answers the public dynamic-content action'
);
fiveprayer_assert(
    1 === $fiveprayer_count_callbacks('wp_ajax_fiveprayer_dynamic_content'),
    'exactly one callback answers the logged-in dynamic-content action'
);

// A field that is not advertised renders nothing.
$fiveprayer_dynamic  = new \FivePrayer\Core\Ajax\DynamicContentHandler();
$fiveprayer_single_t = new ReflectionMethod(\FivePrayer\Core\Ajax\DynamicContentHandler::class, 'get_single_prayer_data');
$fiveprayer_single_t->setAccessible(true);

$fiveprayer_probe = $fiveprayer_single_t->invoke($fiveprayer_dynamic, 'some_private_property');

fiveprayer_assert(
    is_array($fiveprayer_probe) && (!isset($fiveprayer_probe['time']) || '' === $fiveprayer_probe['time']),
    'an unknown single-prayer field returns no data'
);

// ---------------------------------------------------------------------------
// Settings sanitisation
// ---------------------------------------------------------------------------

// Both link settings are printed as a link target, so a scheme that runs script
// must never be stored — and both save routes must sanitise identically.
$fiveprayer_settings_controller = new PrayerSettingsMetaController();
$fiveprayer_settings_sanitize   = new ReflectionMethod(PrayerSettingsMetaController::class, 'sanitizeSettingValue');
$fiveprayer_settings_sanitize->setAccessible(true);

fiveprayer_assert(
    '' === $fiveprayer_settings_sanitize->invoke($fiveprayer_settings_controller, 'printer_button_url', 'javascript:alert(1)'),
    'a javascript: printer button URL is stored as an empty string'
);
fiveprayer_assert(
    '' === $fiveprayer_settings_sanitize->invoke($fiveprayer_settings_controller, 'auto_print_page_url', 'javascript:alert(1)'),
    'a javascript: auto-print URL is stored as an empty string'
);
fiveprayer_assert(
    '' === $fiveprayer_settings_sanitize->invoke($fiveprayer_settings_controller, 'printer_button_url', ''),
    'the printer button URL can still be cleared'
);
fiveprayer_assert(
    'https://example.com/print' === $fiveprayer_settings_sanitize->invoke($fiveprayer_settings_controller, 'printer_button_url', 'https://example.com/print'),
    'a normal printer button URL is kept as sent'
);
fiveprayer_assert(
    '' === $fiveprayer_settings_sanitize->invoke($fiveprayer_settings_controller, 'printer_button_url', ['https://example.com']),
    'a non-string printer button URL is not stored'
);

$fiveprayer_clean_setting = $fiveprayer_settings_sanitize->invoke($fiveprayer_settings_controller, 'some_array_setting', [
    'label'   => '<script>alert(1)</script>Fajr',
    'count'   => 5,
    'enabled' => true,
    'nested'  => ['label' => '<b>Isha</b>'],
]);

fiveprayer_assert(false === strpos((string) $fiveprayer_clean_setting['label'], '<'), 'an array setting is sanitised recursively');
fiveprayer_assert(5 === $fiveprayer_clean_setting['count'] && true === $fiveprayer_clean_setting['enabled'], 'numbers and booleans in an array setting are kept');
fiveprayer_assert('Isha' === $fiveprayer_clean_setting['nested']['label'], 'nested array values are sanitised too');
fiveprayer_assert(['label', 'count', 'enabled', 'nested'] === array_keys($fiveprayer_clean_setting), 'array keys are kept');

// ---------------------------------------------------------------------------
// Public settings response
// ---------------------------------------------------------------------------

// The GET route is public for page builders, but an anonymous caller must not
// receive the full editor settings set.
$fiveprayer_meta_table   = $wpdb->prefix . 'fp_prayer_settings_meta';
$fiveprayer_printer_row  = $wpdb->get_var($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- test probes the real row.
    "SELECT id FROM %i WHERE `meta-key` = %s LIMIT 1",
    $fiveprayer_meta_table,
    'printer'
));
$fiveprayer_inserted_printer = false;

if (null === $fiveprayer_printer_row) {
    $wpdb->insert($fiveprayer_meta_table, ['meta-key' => 'printer', 'value' => '{}', 'version' => 'test']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    $fiveprayer_inserted_printer = true;
}

$fiveprayer_settings_controller = new PrayerSettingsMetaController();
$fiveprayer_admins = get_users(['role' => 'administrator', 'number' => 1, 'fields' => 'ID']);
$fiveprayer_admin_id = !empty($fiveprayer_admins) ? (int) $fiveprayer_admins[0] : 0;

// The meta list is cached; drop it so the row inserted above is visible.
\FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();

wp_set_current_user(0);
$fiveprayer_public_settings = $fiveprayer_settings_controller->get_meta()->get_data();
$fiveprayer_public_keys     = array_column((array) $fiveprayer_public_settings, 'meta_key');

fiveprayer_assert(!in_array('printer', $fiveprayer_public_keys, true), 'an anonymous settings response excludes editor-only keys');
fiveprayer_assert(
    [] === array_diff($fiveprayer_public_keys, PrayerSettingsMetaController::PUBLIC_META_KEYS),
    'an anonymous settings response contains only the display allowlist'
);

wp_set_current_user($fiveprayer_admin_id);
\FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
$fiveprayer_admin_settings = $fiveprayer_settings_controller->get_meta()->get_data();
$fiveprayer_admin_keys     = array_column((array) $fiveprayer_admin_settings, 'meta_key');

fiveprayer_assert($fiveprayer_admin_id > 0 && in_array('printer', $fiveprayer_admin_keys, true), 'an administrator still receives the full settings set');

wp_set_current_user(0);

if ($fiveprayer_inserted_printer) {
    $wpdb->delete($fiveprayer_meta_table, ['meta-key' => 'printer'], ['%s']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
}

// ---------------------------------------------------------------------------
// External test endpoint
// ---------------------------------------------------------------------------

// The unauthenticated health route used to expose mosque contact details.
$fiveprayer_external_test = new \FivePrayer\Core\Controllers\API\EndPoints\ExternalApiController();
$fiveprayer_test_response = $fiveprayer_external_test->test_endpoint(
    new WP_REST_Request('GET', '/fiveprayer/v1/external/test')
);
$fiveprayer_test_data = $fiveprayer_test_response->get_data();

fiveprayer_assert(isset($fiveprayer_test_data['status']) && 'ok' === $fiveprayer_test_data['status'], 'the unauthenticated test endpoint returns a health status');
fiveprayer_assert(!isset($fiveprayer_test_data['mosque_info']), 'the unauthenticated test endpoint does not return mosque contact details');

// ---------------------------------------------------------------------------
// Settings reset encoding
// ---------------------------------------------------------------------------

// The soft reset used to run sanitize_text_field() over the JSON string, which
// stripped percent sequences and tags out of the payload.
$fiveprayer_shared_trait = new class {
    use \FivePrayer\Core\Admin\Traits\SettingsDataManagementTrait;
};

$fiveprayer_settings_encoder = new ReflectionMethod($fiveprayer_shared_trait, 'encode_settings_value');
$fiveprayer_settings_encoder->setAccessible(true);

$fiveprayer_encoded = $fiveprayer_settings_encoder->invoke(
    $fiveprayer_shared_trait,
    [['id' => 1, 'label' => '50%20 <b>off</b>']]
);
$fiveprayer_decoded = json_decode($fiveprayer_encoded, true);

fiveprayer_assert(JSON_ERROR_NONE === json_last_error(), 'a settings value with %20 and < is stored as valid JSON');
fiveprayer_assert(is_array($fiveprayer_decoded) && isset($fiveprayer_decoded[0]['label']), 'the encoded settings value keeps its shape');
fiveprayer_assert(false !== strpos($fiveprayer_encoded, '%20'), 'a percent sequence survives settings encoding');
fiveprayer_assert(false !== strpos($fiveprayer_encoded, '<'), 'an angle bracket does not corrupt the encoded JSON');

// ---------------------------------------------------------------------------
// Admin notice allowlist
// ---------------------------------------------------------------------------

fiveprayer_assert('' !== \FivePrayer\Core\Admin\SettingsAdmin::get_notice_message('upload_failed'), 'a known notice code resolves to text');
fiveprayer_assert('' === \FivePrayer\Core\Admin\SettingsAdmin::get_notice_message('arbitrary_message'), 'an unknown notice code renders nothing');

// ---------------------------------------------------------------------------
// Brute-force address scope and escalation reset
// ---------------------------------------------------------------------------

$fiveprayer_brute = \FivePrayer\Core\API\BruteForceSettings::class;

fiveprayer_assert(
    '2001:db8:1:2::' === $fiveprayer_brute::get_tracked_address('2001:db8:1:2:aaaa:bbbb:cccc:dddd'),
    'an IPv6 address is tracked by its /64 network'
);
fiveprayer_assert(
    $fiveprayer_brute::get_transient_key('2001:db8:1:2:1::1') === $fiveprayer_brute::get_transient_key('2001:db8:1:2:2::2'),
    'two addresses in the same IPv6 /64 share one counter'
);
fiveprayer_assert(
    $fiveprayer_brute::get_transient_key('203.0.113.7') === 'fp_brute_203.0.113.7',
    'an IPv4 address is still tracked individually'
);

update_option($fiveprayer_brute::COOLDOWN_LEVEL_OPTION, 'stopped');
update_option($fiveprayer_brute::STOPPED_OPTION, time() - (2 * DAY_IN_SECONDS));
$fiveprayer_brute::maybe_reset_stopped_level();
fiveprayer_assert(false === get_option($fiveprayer_brute::COOLDOWN_LEVEL_OPTION), 'a stopped escalation resets itself after 24 hours');

update_option($fiveprayer_brute::COOLDOWN_LEVEL_OPTION, 'stopped');
update_option($fiveprayer_brute::STOPPED_OPTION, time());
$fiveprayer_brute::maybe_reset_stopped_level();
fiveprayer_assert('stopped' === get_option($fiveprayer_brute::COOLDOWN_LEVEL_OPTION), 'a recent stopped escalation is left in place');

delete_option($fiveprayer_brute::COOLDOWN_LEVEL_OPTION);
delete_option($fiveprayer_brute::STOPPED_OPTION);

// ---------------------------------------------------------------------------
// Share on Local Network
// ---------------------------------------------------------------------------

// The Host header is visitor-controlled, so it cannot be the only evidence a
// request came from the LAN: REMOTE_ADDR is what decides.
fiveprayer_assert(true === LocalNetworkRouter::is_local_address('127.0.0.1'), 'IPv4 loopback is a local client address');
fiveprayer_assert(true === LocalNetworkRouter::is_local_address('::1'), 'IPv6 loopback is a local client address');
fiveprayer_assert(true === LocalNetworkRouter::is_local_address('10.1.2.3'), 'a 10/8 address is a local client address');
fiveprayer_assert(true === LocalNetworkRouter::is_local_address('172.20.0.5'), 'a 172.16/12 address is a local client address');
fiveprayer_assert(true === LocalNetworkRouter::is_local_address('192.168.1.20'), 'a 192.168/16 address is a local client address');
fiveprayer_assert(false === LocalNetworkRouter::is_local_address('172.32.0.5'), 'an address outside 172.16/12 is not a local client address');
fiveprayer_assert(true === LocalNetworkRouter::is_local_address('fd00::1'), 'a unique-local IPv6 address is a local client address');
fiveprayer_assert(true === LocalNetworkRouter::is_local_address('fe80::1'), 'an IPv6 link-local address is a local client address');
fiveprayer_assert(false === LocalNetworkRouter::is_local_address('8.8.8.8'), 'a public address is not a local client address');
fiveprayer_assert(false === LocalNetworkRouter::is_local_address(''), 'an empty address is not a local client address');
fiveprayer_assert(false === LocalNetworkRouter::is_local_address('not-an-ip'), 'a malformed address is not a local client address');

$fiveprayer_router_server = $_SERVER;
$fiveprayer_router_option = get_option(LocalNetworkRouter::OPTION_NAME, 0);
$fiveprayer_router_class  = new ReflectionClass(LocalNetworkRouter::class);

/** Reset the router's per-request state so bootstrap() can run again. */
$fiveprayer_reset_router = static function () use ($fiveprayer_router_class) {
    foreach (['bootstrapped' => false, 'active' => false, 'base_url' => ''] as $name => $value) {
        $property = $fiveprayer_router_class->getProperty($name);
        $property->setAccessible(true);
        $property->setValue(null, $value);
    }
};

update_option(LocalNetworkRouter::OPTION_NAME, 1);
update_option(LocalNetworkRouter::HOSTS_OPTION, '192.168.1.104:10010');

$fiveprayer_server_ips = static function () {
    return ['10.0.0.2'];
};
add_filter('fiveprayer_local_testing_server_ips', $fiveprayer_server_ips);

// The Host header is visitor-controlled. Only the saved host and the server's
// own addresses may activate the router; any other host is refused.
fiveprayer_assert(true === LocalNetworkRouter::is_allowed_host('192.168.1.104:10010'), 'a host saved by the administrator is accepted');
fiveprayer_assert(true === LocalNetworkRouter::is_allowed_host('10.0.0.2'), 'the server’s own address is accepted without saving it');
fiveprayer_assert(false === LocalNetworkRouter::is_allowed_host('192.168.1.99:10010'), 'a private host the administrator did not save is refused');
fiveprayer_assert(false === LocalNetworkRouter::is_allowed_host('evil.example.com'), 'a public host is refused');

$_SERVER['HTTP_HOST']   = '192.168.1.104:10010';
$_SERVER['REMOTE_ADDR'] = '203.0.113.10';
$fiveprayer_reset_router();
LocalNetworkRouter::bootstrap();
fiveprayer_assert(false === LocalNetworkRouter::is_active(), 'a private Host from a public client does not activate the router');

$_SERVER['HTTP_HOST']   = '192.168.1.99:10010';
$_SERVER['REMOTE_ADDR'] = '192.168.1.20';
$fiveprayer_reset_router();
LocalNetworkRouter::bootstrap();
fiveprayer_assert(false === LocalNetworkRouter::is_active(), 'an unsaved private Host from a local client does not activate the router');

$_SERVER['HTTP_HOST']   = '192.168.1.104:10010';
$_SERVER['REMOTE_ADDR'] = '192.168.1.20';
$fiveprayer_reset_router();
LocalNetworkRouter::bootstrap();

if ('production' === strtolower((string) wp_get_environment_type())) {
    echo esc_html("SKIP: the router stays inert in a production environment by design\n");
} else {
    fiveprayer_assert(true === LocalNetworkRouter::is_active(), 'a saved private Host from a local client with the option on activates the router');
    fiveprayer_assert('http://192.168.1.104:10010' === LocalNetworkRouter::get_base_url(), 'the router rewrites the URL to the request host');
    fiveprayer_assert(defined('DONOTCACHEPAGE') && true === DONOTCACHEPAGE, 'the rewritten request is kept out of every page cache');
    fiveprayer_assert(false !== has_action('send_headers', [LocalNetworkRouter::class, 'send_nocache_headers']), 'the rewritten request sends no-cache headers');
}

remove_filter('fiveprayer_local_testing_server_ips', $fiveprayer_server_ips);
update_option(LocalNetworkRouter::OPTION_NAME, $fiveprayer_router_option);
delete_option(LocalNetworkRouter::HOSTS_OPTION);
$_SERVER = $fiveprayer_router_server;

// ---------------------------------------------------------------------------
// ESI enablement
// ---------------------------------------------------------------------------

// ESI support is decided from server-side signals only. A visitor controls both
// the headers and `?esi=1`, so honouring them let one request get a page cached
// with <esi:include> tags on a site that is not on LiteSpeed.
$fiveprayer_esi_server = $_SERVER;
$fiveprayer_esi_get    = $_GET;

$_SERVER['HTTP_X_LITESPEED_CACHE_CONTROL'] = 'no-cache';
$_SERVER['HTTP_X_LSCACHE']                 = '1';
$_SERVER['HTTP_X_LIVESPEED_ESI']           = '1';
$_SERVER['HTTP_X_LITESPEED_ESI']           = '1';
unset($_SERVER['SERVER_SOFTWARE']);
$_GET['esi'] = '1';

fiveprayer_assert(false === $fiveprayer_esi->isESIEnabled(), 'request headers and ?esi=1 do not switch ESI on');
fiveprayer_assert(
    false === strpos((string) $fiveprayer_esi->wrapDynamicContent('content', 'current_time', []), '<esi:include'),
    'a crafted request does not get the content wrapped in an ESI include'
);

// A site owner can still force the decision either way.
$fiveprayer_force_esi = static function () {
    return true;
};
add_filter('fiveprayer_esi_enabled', $fiveprayer_force_esi);
fiveprayer_assert(true === $fiveprayer_esi->isESIEnabled(), 'the fiveprayer_esi_enabled filter can switch ESI on');
fiveprayer_assert(
    false !== strpos((string) $fiveprayer_esi->wrapDynamicContent('content', 'current_time', []), '<esi:include'),
    'a forced-on ESI wraps the content'
);
remove_filter('fiveprayer_esi_enabled', $fiveprayer_force_esi);

$fiveprayer_force_no_esi = static function () {
    return false;
};
add_filter('fiveprayer_esi_enabled', $fiveprayer_force_no_esi);
fiveprayer_assert(false === $fiveprayer_esi->isESIEnabled(), 'the fiveprayer_esi_enabled filter can switch ESI off');
remove_filter('fiveprayer_esi_enabled', $fiveprayer_force_no_esi);

$_SERVER = $fiveprayer_esi_server;
$_GET    = $fiveprayer_esi_get;

// ---------------------------------------------------------------------------
// Single-prayer field allowlist
// ---------------------------------------------------------------------------

// One allowlist, used by both the AJAX handler and the ESI renderer, so a
// caller cannot name a property of the timetable row and read it back.
$fiveprayer_esi_single = new ReflectionMethod(ESIDynamicContentHandler::class, 'generateSinglePrayerContent');
$fiveprayer_esi_single->setAccessible(true);

fiveprayer_assert(null === PrayerFieldMap::getProperty('some_private_property'), 'a property name that is not an advertised field is refused');
fiveprayer_assert(null === PrayerFieldMap::getProperty(''), 'an empty field name is refused');
fiveprayer_assert(null === PrayerFieldMap::getProperty(null), 'a missing field name is refused');
fiveprayer_assert('fajr_begins' === PrayerFieldMap::getProperty('fajr_begins_time'), 'the advertised field spelling maps to its column');
fiveprayer_assert('fajr_begins' === PrayerFieldMap::getProperty('fajr_begins'), 'the identity alias maps to the same column');
fiveprayer_assert('asr_second_begins' === PrayerFieldMap::getProperty('asr_second_begins_time'), 'the second ‘Asr field maps to its column');
fiveprayer_assert(in_array('midnight', PrayerFieldMap::getFields(), true), 'every advertised field is listed');

$fiveprayer_unknown_field = $fiveprayer_esi_single->invoke($fiveprayer_esi, 'some_private_property');
fiveprayer_assert('Time unavailable' === $fiveprayer_unknown_field, 'the ESI fragment returns no data for an unknown field');

// ---------------------------------------------------------------------------
// Settings import
// ---------------------------------------------------------------------------

// The importer is reached through an admin form and answers with a redirect, so
// the test drives its key list and its write path directly. Only the trait is
// pulled in: none of the admin screen around it is needed here.
$fiveprayer_settings_importer = new class {
    use \FivePrayer\Core\Admin\Traits\SettingsDataManagementTrait;
};

$fiveprayer_export_keys = new ReflectionMethod($fiveprayer_settings_importer, 'getExportableSettingKeys');
$fiveprayer_export_keys->setAccessible(true);
$fiveprayer_run_import = new ReflectionMethod($fiveprayer_settings_importer, 'import_settings_data');
$fiveprayer_run_import->setAccessible(true);

fiveprayer_assert(
    !in_array('printer_button_url', $fiveprayer_export_keys->invoke($fiveprayer_settings_importer), true),
    'a settings file cannot name a key the export never writes'
);

$fiveprayer_import_meta_table = $wpdb->prefix . 'fp_prayer_settings_meta';

// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- the test reads and restores real rows.
$fiveprayer_read_meta = static function (string $key) use ($wpdb, $fiveprayer_import_meta_table) {
    return $wpdb->get_var($wpdb->prepare("SELECT value FROM %i WHERE `meta-key` = %s", $fiveprayer_import_meta_table, $key));
};

$fiveprayer_url_before     = $fiveprayer_read_meta('printer_button_url');
$fiveprayer_methods_before = $fiveprayer_read_meta('Methods_For_Calculation');

$fiveprayer_run_import->invoke($fiveprayer_settings_importer, [
    'printer_button_url'      => 'javascript:alert(1)',
    'Methods_For_Calculation' => [
        ['id' => 987654, 'name' => '<script>imported</script>', 'method' => 'mw l'],
    ],
]);

$fiveprayer_methods_after = (string) $fiveprayer_read_meta('Methods_For_Calculation');

fiveprayer_assert(
    $fiveprayer_url_before === $fiveprayer_read_meta('printer_button_url'),
    'a settings file cannot overwrite a key the export never writes'
);
fiveprayer_assert(
    false !== strpos($fiveprayer_methods_after, '987654'),
    'the settings import still writes a key the export carries'
);
fiveprayer_assert(
    false === strpos($fiveprayer_methods_after, '<script>'),
    'an imported calculation method is stored without its tags'
);

// Put the row back the way it was found.
// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- the test restores a real row.
if (null === $fiveprayer_methods_before) {
    $wpdb->delete($fiveprayer_import_meta_table, ['meta-key' => 'Methods_For_Calculation'], ['%s']);
} else {
    $wpdb->update(
        $fiveprayer_import_meta_table,
        ['value' => $fiveprayer_methods_before],
        ['meta-key' => 'Methods_For_Calculation'],
        ['%s'],
        ['%s']
    );
}

// ---------------------------------------------------------------------------
// Translation import
// ---------------------------------------------------------------------------

// Like the settings importer this one answers with a redirect, so the test
// drives the key list and the sanitizer directly.
$fiveprayer_translation_importer = new class {
    use \FivePrayer\Core\Admin\Traits\TranslationImportExportTrait;
};

$fiveprayer_translation_keys = new ReflectionMethod($fiveprayer_translation_importer, 'getTranslationFileKeys');
$fiveprayer_translation_keys->setAccessible(true);
$fiveprayer_sanitize_translation = new ReflectionMethod($fiveprayer_translation_importer, 'sanitizeTranslationValue');
$fiveprayer_sanitize_translation->setAccessible(true);

$fiveprayer_file_keys = $fiveprayer_translation_keys->invoke($fiveprayer_translation_importer);

fiveprayer_assert(
    !in_array('printer_button_url', $fiveprayer_file_keys, true),
    'a translation file cannot name a key the export never writes'
);
fiveprayer_assert(
    !in_array('location_list', $fiveprayer_file_keys, true),
    'a translation file cannot name a settings key'
);
fiveprayer_assert(
    in_array('prayer_names', $fiveprayer_file_keys, true),
    'a translation file still carries the keys the export writes'
);

$fiveprayer_sanitized = $fiveprayer_sanitize_translation->invoke(
    $fiveprayer_translation_importer,
    [
        'translated_text' => '<script>x</script>',
        'nested'          => ['label' => '<b>bold</b>'],
        'count'           => 3,
    ]
);

fiveprayer_assert(
    false === strpos((string) $fiveprayer_sanitized['translated_text'], '<'),
    'a translated string is stored without its tags'
);
fiveprayer_assert(
    false === strpos((string) $fiveprayer_sanitized['nested']['label'], '<'),
    'a translated string nested in a list is stored without its tags'
);
fiveprayer_assert(3 === $fiveprayer_sanitized['count'], 'a number in a translation file stays a number');

// ---------------------------------------------------------------------------
// PNG URL route permission
// ---------------------------------------------------------------------------

// The route can create a Media Library attachment from a GET, so it must never
// be reachable by a subscriber.
$fiveprayer_png = new \FivePrayer\Core\Controllers\API\EndPoints\PngUrlController();

wp_set_current_user(0);
fiveprayer_assert(false === (bool) $fiveprayer_png->check_permission(null), 'an anonymous request is denied the PNG URL route');

$fiveprayer_png_admins = get_users(['role' => 'administrator', 'number' => 1, 'fields' => 'ID']);
$fiveprayer_png_admin  = !empty($fiveprayer_png_admins) ? (int) $fiveprayer_png_admins[0] : 0;

wp_set_current_user($fiveprayer_png_admin);
fiveprayer_assert($fiveprayer_png_admin > 0 && true === (bool) $fiveprayer_png->check_permission(null), 'an administrator may use the PNG URL route');

wp_set_current_user(0);

// ---------------------------------------------------------------------------
// Release tooling
// ---------------------------------------------------------------------------

// Third-party actions are pinned to a full commit SHA; a floating major tag can
// be moved to new code without any change in this repository.
$fiveprayer_workflows = glob($fiveprayer_plugin_root . '/.github/workflows/*.yml');

if (is_array($fiveprayer_workflows) && [] !== $fiveprayer_workflows) {
    $fiveprayer_floating = [];

    foreach ($fiveprayer_workflows as $fiveprayer_workflow) {
        $fiveprayer_workflow_source = (string) file_get_contents($fiveprayer_workflow);
        preg_match_all('/uses:\s*([^\s#]+)@([^\s#]+)/', $fiveprayer_workflow_source, $fiveprayer_uses);

        foreach ($fiveprayer_uses[2] as $fiveprayer_ref) {
            if (!preg_match('/^[0-9a-f]{40}$/', $fiveprayer_ref)) {
                $fiveprayer_floating[] = basename($fiveprayer_workflow) . ':' . $fiveprayer_ref;
            }
        }
    }

    fiveprayer_assert([] === $fiveprayer_floating, 'every workflow action is pinned to a full commit SHA');

    $fiveprayer_release_source = (string) file_get_contents($fiveprayer_plugin_root . '/.github/workflows/release.yml');
    fiveprayer_assert(false !== strpos($fiveprayer_release_source, 'allow_clobber'), 'the release workflow has an explicit clobber opt-in');
    fiveprayer_assert(false !== strpos($fiveprayer_release_source, 'contents: write'), 'the publish job declares contents: write');
}

// The Allowed Domains limitation is documented where administrators will see it.
$fiveprayer_api_doc_path = $fiveprayer_plugin_root . '/docs/API-Security.md';

if (file_exists($fiveprayer_api_doc_path)) {
    $fiveprayer_api_doc = (string) file_get_contents($fiveprayer_api_doc_path);
    fiveprayer_assert(false !== strpos($fiveprayer_api_doc, 'not a security control'), 'the API security docs state that Allowed Domains is not a security control');
}

wp_set_current_user(0);

echo $fiveprayer_failures > 0
    ? esc_html("\nFAILED: {$fiveprayer_failures} check(s)\n")
    : esc_html("\nPASS: all security regression checks\n");

exit($fiveprayer_failures > 0 ? 1 : 0);

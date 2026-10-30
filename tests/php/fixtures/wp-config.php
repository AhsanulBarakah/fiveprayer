<?php
/**
 * wp-config.php fixture for the wp-cli-free PHP test runner.
 *
 * `tools/php-suite.sh` copies this file into the WordPress root it is about to
 * install. Credentials come from the environment so the same fixture works on a
 * laptop (Local, MAMP, …) and on a CI runner:
 *
 *   FIVEPRAYER_DB_NAME      default fiveprayer_test
 *   FIVEPRAYER_DB_USER      default root
 *   FIVEPRAYER_DB_PASSWORD  default root
 *   FIVEPRAYER_DB_HOST      default 127.0.0.1
 *
 * This is test scaffolding, not production configuration — the salts below are
 * deliberately fixed and worthless.
 *
 * @package FivePrayer
 */

define('DB_NAME', getenv('FIVEPRAYER_DB_NAME') ?: 'fiveprayer_test');
define('DB_USER', getenv('FIVEPRAYER_DB_USER') ?: 'root');
define('DB_PASSWORD', getenv('FIVEPRAYER_DB_PASSWORD') ?: 'root');
define('DB_HOST', getenv('FIVEPRAYER_DB_HOST') ?: '127.0.0.1');
define('DB_CHARSET', 'utf8mb4');
define('DB_COLLATE', '');

define('AUTH_KEY', 'fiveprayer-test-auth-key');
define('SECURE_AUTH_KEY', 'fiveprayer-test-secure-auth-key');
define('LOGGED_IN_KEY', 'fiveprayer-test-logged-in-key');
define('NONCE_KEY', 'fiveprayer-test-nonce-key');
define('AUTH_SALT', 'fiveprayer-test-auth-salt');
define('SECURE_AUTH_SALT', 'fiveprayer-test-secure-auth-salt');
define('LOGGED_IN_SALT', 'fiveprayer-test-logged-in-salt');
define('NONCE_SALT', 'fiveprayer-test-nonce-salt');

$table_prefix = 'wp_';

define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
define('WP_HOME', 'http://example.test');
define('WP_SITEURL', 'http://example.test');
define('AUTOMATIC_UPDATER_DISABLED', true);
define('DISALLOW_FILE_MODS', true);

if (!defined('ABSPATH')) {
    define('ABSPATH', __DIR__ . '/');
}

require_once ABSPATH . 'wp-settings.php';

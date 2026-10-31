<?php
/**
 * Main Plugin Entry Point
 *
 * This file contains the core plugin initialization and setup.
 * It includes all the modular components of the FivePrayer plugin.
 *
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

// Global constants for internal path helpers
if (!defined('FIVEPRAYER_PLUGIN_FILE')) {
    define('FIVEPRAYER_PLUGIN_FILE', dirname(dirname(__FILE__)) . '/Fiveprayer.php');
    define('FIVEPRAYER_FILE', dirname(dirname(__FILE__)) . '/Fiveprayer.php'); // Alias for backward compatibility
}

define('FIVEPRAYER_ABSPATH', dirname(FIVEPRAYER_PLUGIN_FILE) . '/');
define('FIVEPRAYER_PLUGIN_BASENAME', plugin_basename(FIVEPRAYER_PLUGIN_FILE));

require_once __DIR__ . '/../vendor/autoload.php';

use FivePrayer\Core\Plugin;
use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\Database\VersionManager;
use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Ajax\DynamicContentHandler;
use FivePrayer\Core\DynamicContent;
use FivePrayer\Core\DynamicTextParser;
use FivePrayer\Core\LocalNetworkRouter;
use FivePrayer\Core\Security\SecurityHelper;

// Share on Local Network (network sharing): register the in-memory URL router as
// early as a normal plugin can run, so a request arriving on a private-network
// address (e.g. http://192.168.1.104:10010) — the mosque's TV, phone or tablet —
// resolves its links correctly. The router is a strict no-op unless the
// administrator opted in AND the request host is a loopback/private address, so
// it can never affect a production domain.
LocalNetworkRouter::register();

// Include the ESI Dynamic Content Handler if it exists
$fiveprayer_esi_handler_path = __DIR__ . '/classes/core/Assets/ESIDynamicContentHandler.php';
if (file_exists($fiveprayer_esi_handler_path)) {
    require_once $fiveprayer_esi_handler_path;

    // Initialize ESI handler early in the WordPress lifecycle. init:1 is the
    // only place that serves a fragment request: the same callback used to be
    // hooked on plugins_loaded:1 as well, so a fragment request was handled
    // twice (and the second copy could never run, since the first exits).
    add_action('init', function() {
        $esi_handler = \FivePrayer\Core\Assets\ESIDynamicContentHandler::getInstance();
        $esi_handler->init();
    }, 1); // Run as early as possible in the init process
}

/**
 * Helper function to wrap dynamic content with ESI when available
 */
function fiveprayer_wrap_dynamic_content_with_esi($content, $content_type, $atts = []) {
    if (class_exists('\\FivePrayer\\Core\\Assets\\ESIDynamicContentHandler')) {
        $esi_handler = \FivePrayer\Core\Assets\ESIDynamicContentHandler::getInstance();
        if ($esi_handler->isESIEnabled()) {
            return $esi_handler->wrapDynamicContent($content, $content_type, $atts);
        }
    }
    // Fallback to regular content when ESI is not available
    return $content;
}

/**
 * Helper function to check if ESI is enabled
 */
function fiveprayer_is_esi_enabled() {
    if (class_exists('\\FivePrayer\\Core\\Assets\\ESIDynamicContentHandler')) {
        $esi_handler = \FivePrayer\Core\Assets\ESIDynamicContentHandler::getInstance();
        return $esi_handler->isESIEnabled();
    }
    return false;
}

/**
 * Initialize the plugin.
 */
function fiveprayer_start_plugin() {
    // Initialize logging system
    fiveprayer_initialize_logging();

    // Initialize database query monitoring (development only)
    fiveprayer_initialize_db_monitoring();

    // Initialize AJAX handler for dynamic content
    new DynamicContentHandler();

    $plugin = new Plugin();
    $plugin->init();

    // Initialize Dynamic Content for page builder compatibility
    $dynamic_content = new DynamicContent();
    $dynamic_content->register();

    // Initialize Dynamic Text Parser for fp_* pattern support
    $dynamic_text_parser = new DynamicTextParser();
    $dynamic_text_parser->register();
}
add_action('plugins_loaded', 'fiveprayer_start_plugin');

/**
 * One-time migration: ensure the fp_timetable(date) index exists.
 *
 * SchemaSetup creates it on activation/upgrade, but a site running the same
 * plugin version would never re-run that path. This makes the index land for
 * existing installs exactly once, without bumping the version (a version bump
 * would also reset the user's calculation settings).
 */
function fiveprayer_maybe_add_timetable_index() {
    // Autoloaded flag: once the index has been handled, this is a no-op and
    // costs no extra query.
    if (get_option('fiveprayer_timetable_date_index_added')) {
        return;
    }

    global $wpdb;
    $table = $wpdb->prefix . 'fp_timetable';

    // If the table does not exist yet, leave the flag unset so this retries
    // (Plugin::onActivate() sets up the schema on activation anyway).
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- One-time schema check guarded by an autoloaded option.
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
        return;
    }

    if (class_exists('\\FivePrayer\\Core\\Database\\SchemaHelper')) {
        $schema_helper = new \FivePrayer\Core\Database\SchemaHelper();
        $schema_helper->maybeAddIndex(
            $table,
            'fp_timetable_date',
            "ALTER TABLE $table ADD INDEX fp_timetable_date (`date`)"
        );
    }

    update_option('fiveprayer_timetable_date_index_added', 1);
}
add_action('init', 'fiveprayer_maybe_add_timetable_index', 20);

/**
 * One-time migration: ensure the optional second 'Asr column exists.
 *
 * SchemaSetup adds `asr_second_begins` on activation and on a version-bump
 * upgrade, but a site running the SAME plugin version (files replaced without
 * a version change) would never re-run that path. This makes the column land
 * on the first request exactly once, without bumping the version (a version
 * bump would also reset the user's calculation settings).
 */
function fiveprayer_maybe_add_asr_second_begins_column() {
    // Autoloaded flag: once handled, this is a no-op and costs no query.
    if (get_option('fiveprayer_asr_second_begins_column_added')) {
        return;
    }

    global $wpdb;
    $table = $wpdb->prefix . 'fp_timetable';

    // If the table does not exist yet, leave the flag unset so this retries
    // (Plugin::onActivate() sets up the schema on activation anyway).
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- One-time schema check guarded by an autoloaded option.
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
        return;
    }

    if (class_exists('\\FivePrayer\\Core\\Database\\SchemaHelper')) {
        $schema_helper = new \FivePrayer\Core\Database\SchemaHelper();
        $schema_helper->maybeAddColumn(
            $table,
            'asr_second_begins',
            "ALTER TABLE $table ADD asr_second_begins time DEFAULT NULL"
        );
    }

    update_option('fiveprayer_asr_second_begins_column_added', 1);
}
add_action('init', 'fiveprayer_maybe_add_asr_second_begins_column', 20);

/**
 * Get the current plugin version.
 */
function fiveprayer_get_plugin_version() {
    static $version = null;

    if (null === $version) {
        // Read the version from the plugin file header. get_file_data() only
        // reads the first 8 KB and needs no wp-admin includes, so this stays a
        // fast path without direct filesystem access.
        $plugin_file = FIVEPRAYER_PLUGIN_FILE;
        if (file_exists($plugin_file) && is_readable($plugin_file)) {
            $header_data = get_file_data($plugin_file, array('Version' => 'Version'));
            if (!empty($header_data['Version'])) {
                $version = trim($header_data['Version']);
            }
        }

        if (empty($version)) {
            $version = '0.0.0';
        }
    }

    return $version;
}

/**
 * Triggered when the plugin is activated or updated.
 */
function fiveprayer_plugin_activate() {
    $current_version = fiveprayer_get_plugin_version();
    $stored_version = get_option('fiveprayer_version', '0.0.0');

    // Initialize the plugin
    $plugin = new Plugin();
    $plugin->onActivate();

    // Handle version-specific updates
    if (version_compare($stored_version, $current_version, '<')) {
        // This is either a new installation or an update
        $version_manager = new VersionManager();

        // Ensure database schema is up to date
        if (!$version_manager->isSchemaUpToDate()) {
            $version_manager->updateSchemaVersion();
        }

        // Update the stored version
        update_option('fiveprayer_version', $current_version);

        // Schedule a rewrite flush on the next page load so REST API
        // routes are guaranteed to be in the rewrite index after upgrade.
        update_option('fiveprayer_flush_rewrite', true);

        \FivePrayer\Core\Logging\Logger::info(sprintf(
            'Plugin %s from version %s to %s',
            empty($stored_version) ? 'installed' : 'updated',
            $stored_version,
            $current_version
        ), 'FivePrayer');
    }
}
register_activation_hook(FIVEPRAYER_PLUGIN_FILE, 'fiveprayer_plugin_activate');

/**
 * Handle plugin updates by checking version on admin init.
 */
function fiveprayer_check_for_updates() {
    $current_version = fiveprayer_get_plugin_version();
    $stored_version = get_option('fiveprayer_version', '0.0.0');

    // Only run activation if there's an actual version difference
    if (version_compare($stored_version, $current_version, '<')) {
        fiveprayer_plugin_activate();
    }
}
add_action('plugins_loaded', 'fiveprayer_check_for_updates');

/**
 * Sync newly shipped default data after the plugin files are replaced.
 *
 * The activation hook only fires on activation and the version check only
 * fires when the plugin header version changes. This compares a content hash
 * of the shipped defaults so new/renamed settings and translation rows are
 * added on the next admin request even when the version was not bumped —
 * no manual "reset settings" step required.
 */
function fiveprayer_sync_defaults_if_changed() {
    if (class_exists('\\FivePrayer\\Core\\Database\\VersionManager')) {
        (new VersionManager())->syncDefaultsIfChanged();
    }
}
add_action('admin_init', 'fiveprayer_sync_defaults_if_changed', 20);

/**
 * Reset calculation settings on plugin upgrade.
 * Only runs on admin or cron to avoid DB queries on frontend.
 */
function fiveprayer_reset_calculation_settings_on_upgrade() {
    if (!is_admin() && !wp_doing_ajax() && !wp_doing_cron()) {
        return;
    }

    $current_version = fiveprayer_get_plugin_version();
    $stored_version = get_option('fiveprayer_version', '0.0.0');
    $reset_flag_option = 'fiveprayer_calc_settings_reset';
    $already_reset = get_option($reset_flag_option, []);

    // Only reset if version changed and haven't already reset for this version
    if (version_compare($stored_version, $current_version, '<') && !in_array($current_version, $already_reset)) {
        global $wpdb;
        $meta_table = $wpdb->prefix . 'fp_prayer_settings_meta';

        // Check if table exists. The same cache key is used by the schema helpers,
        // so a table created elsewhere in the request is seen here too.
        $table_cache_key = 'fiveprayer_table_exists_' . md5($meta_table);
        $table_exists    = wp_cache_get($table_cache_key, 'fiveprayer');

        if (false === $table_exists) {
            $table_exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $meta_table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($table_cache_key, $table_exists, 'fiveprayer', 60);
        }
        if ($table_exists) {
            // Meta keys for calculation settings
            $calc_meta_keys = [
                'Methods_For_Calculation',
                'Only_affects_Asr_calculation',
                'midnight_calculation_mode',
                'Higher_Latitudes_Methods'
            ];

            // Delete old calculation settings
            $placeholders = implode(',', array_fill(0, count($calc_meta_keys), '%s'));
            // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $placeholders is a generated list of %s placeholders.
            $wpdb->query($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                "DELETE FROM %i WHERE `meta-key` IN ($placeholders)",
                array_merge([$meta_table], $calc_meta_keys)
            ));
            // phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared

            // The deleted rows are served from the cached settings meta blob.
            wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');

            // Re-insert default settings using SchemaHelper
            if (class_exists('\\FivePrayer\\Core\\Database\\SchemaHelper')) {
                $schema_helper = new \FivePrayer\Core\Database\SchemaHelper();
                $schema_helper->insertDefaultSettings();
            }

            // Clear related caches
            if (class_exists('\\FivePrayer\\Core\\Helpers\\PrayerDataCache')) {
                \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
            }

            \FivePrayer\Core\Logging\Logger::info(
                'Calculation settings reset during upgrade to version ' . $current_version,
                'FivePrayer'
            );
        }

        // Mark this version as reset
        $already_reset[] = $current_version;
        update_option($reset_flag_option, $already_reset);
    }
}
add_action('plugins_loaded', 'fiveprayer_reset_calculation_settings_on_upgrade', 20);

/**
 * Show admin notice if calculation settings were reset during upgrade.
 */
function fiveprayer_show_reset_notice() {
    $page = sanitize_key(SecurityHelper::get_sanitized_get_input('page'));
    
    // Only show on fiveprayer pages
    if (!in_array($page, ['fiveprayer', 'fiveprayer-settings', 'fiveprayer-api-settings'])) {
        return;
    }
    
    $current_version = fiveprayer_get_plugin_version();
    $reset_flag_option = 'fiveprayer_calc_settings_reset';
    $already_reset = get_option($reset_flag_option, []);

    if (in_array($current_version, $already_reset)) {
        $notice_dismissed = get_option('fiveprayer_reset_notice_dismissed_' . $current_version, false);
        
        if (!$notice_dismissed && current_user_can('manage_options')) {
            ?>
            <div class="notice notice-warning is-dismissible" id="fiveprayer-reset-notice">
                <p>
                    <strong>Five Prayer Plugin:</strong> Calculation settings have been reset for version <?php echo esc_html($current_version); ?>. 
                    Please go to <a href="<?php echo esc_url(admin_url('admin.php?page=fiveprayer#/customizing/settings')); ?>">Customizing > Configure Settings</a> to reconfigure your prayer calculation methods.
                </p>
            </div>
            <script>
                jQuery(document).ready(function($) {
                    $('#fiveprayer-reset-notice').on('click', '.notice-dismiss', function() {
                        $.ajax({
                            url: ajaxurl,
                            data: {
                                action: 'fiveprayer_dismiss_reset_notice',
                                nonce: '<?php echo esc_js(wp_create_nonce('fiveprayer_dismiss_reset_notice')); ?>',
                                version: '<?php echo esc_js($current_version); ?>'
                            }
                        });
                    });
                });
            </script>
            <?php
        }
    }
}
add_action('admin_notices', 'fiveprayer_show_reset_notice');

/**
 * AJAX handler for dismissing the reset notice.
 */
function fiveprayer_dismiss_reset_notice() {
    if (!current_user_can('manage_options')) {
        wp_die('Unauthorized');
    }

    check_ajax_referer('fiveprayer_dismiss_reset_notice', 'nonce');

    $version = sanitize_text_field(wp_unslash($_POST['version'] ?? ''));
    if ($version === '') {
        wp_die('Missing version');
    }

    update_option('fiveprayer_reset_notice_dismissed_' . $version, true);
    wp_die();
}
add_action('wp_ajax_fiveprayer_dismiss_reset_notice', 'fiveprayer_dismiss_reset_notice');

/**
 * Clear scheduled events on plugin deactivation
 */
function fiveprayer_deactivation() {
    $timestamp = wp_next_scheduled('fiveprayer_hourly_cache_check');
    if ($timestamp) {
        wp_unschedule_event($timestamp, 'fiveprayer_hourly_cache_check');
    }

    $timestamp2 = wp_next_scheduled('fiveprayer_twice_daily_cache_check');
    if ($timestamp2) {
        wp_unschedule_event($timestamp2, 'fiveprayer_twice_daily_cache_check');
    }
}
register_deactivation_hook(FIVEPRAYER_PLUGIN_FILE, 'fiveprayer_deactivation');

/**
 * Triggered when the plugin is deactivated.
 * Cleans up transients and cached data.
 */
function fiveprayer_plugin_deactivate() {
    // Clean up all plugin transients
    try {
        \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();

        // Clear asset cache
        if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
            $asset_manager = \FivePrayer\Core\Assets\AssetManager::getInstance();
            $asset_manager->clearCache();
        }

        \FivePrayer\Core\Logging\Logger::info('Successfully cleared all plugin transients on deactivation', 'FivePrayer');
    } catch (Exception $e) {
        \FivePrayer\Core\Logging\Logger::error('Error clearing transients on deactivation: ' . $e->getMessage(), 'FivePrayer');
    }
}
register_deactivation_hook(FIVEPRAYER_PLUGIN_FILE, 'fiveprayer_plugin_deactivate');

// Include all modular components
require_once __DIR__ . '/modules/FivePrayerUtilities.php';
require_once __DIR__ . '/modules/FivePrayerCaching.php';
require_once __DIR__ . '/modules/FivePrayerScripts.php';
require_once __DIR__ . '/modules/FivePrayerShortcodes.php';
require_once __DIR__ . '/modules/FivePrayerCron.php';
require_once __DIR__ . '/modules/FivePrayerLogging.php';
require_once __DIR__ . '/modules/FivePrayerDatabase.php';
require_once __DIR__ . '/modules/FivePrayerBreakdance.php';
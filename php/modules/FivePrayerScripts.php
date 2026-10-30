<?php
/**
 * FivePrayer Scripts Module
 * 
 * This file handles all JavaScript enqueueing and script-related functionality for the FivePrayer plugin.
 * 
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

/**
 * Get a stable cache-busting version string for enqueued assets.
 *
 * Uses the plugin version so browser caches are busted on plugin updates
 * rather than on every page load (as time() would do).
 */
function fiveprayer_get_asset_version() {
    static $version = null;
    if ($version === null) {
        $version = function_exists('fiveprayer_get_plugin_version')
            ? fiveprayer_get_plugin_version()
            : '1.0.0';
    }
    return $version;
}

/**
 * Enqueue script for block support modifications
 */
function fiveprayer_enqueue_block_editor_assets() {
    $path_service = new \FivePrayer\Core\PathService();

    // Helper function for file version with fallback
    $get_file_version = function($relative_path) use ($path_service) {
        $file_path = $path_service->getFileFullPath($relative_path);
        return file_exists($file_path) ? (string)filemtime($file_path) : \FivePrayer\Core\Database\VersionManager::getCurrentPluginVersion();
    };

    wp_enqueue_script(
        'fiveprayer-modify-block-supports',
        $path_service->getFileUrl('php/classes/core/Assets/JS/modify-block-supports.js'),
        array('wp-hooks'),
        $get_file_version('php/classes/core/Assets/JS/modify-block-supports.js'),
        true
    );
}
add_action('enqueue_block_editor_assets', 'fiveprayer_enqueue_block_editor_assets');

/**
 * Enqueue FivePrayer JavaScript/CSS only on pages that contain prayer shortcodes.
 * Skips non-prayer pages entirely to avoid unnecessary HTTP requests.
 */
function fiveprayer_always_enqueue_scripts() {
    // Skip during AJAX, admin, or non-prayer pages
    if (wp_doing_ajax() || is_admin()) {
        return;
    }

    // Only load assets when prayer shortcodes are detected on this page
    if (!fiveprayer_has_shortcode_on_page()) {
        return;
    }

    // Enqueue dynamic content loader script
    $script_path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'php/classes/core/Assets/JS/dynamic-content-loader.js';
    $script_url = plugins_url('php/classes/core/Assets/JS/dynamic-content-loader.js', FIVEPRAYER_PLUGIN_FILE);

    if (!wp_script_is('fiveprayer-dynamic-content-loader', 'registered')) {
        $version = file_exists($script_path) ? filemtime($script_path) : fiveprayer_get_asset_version();
        wp_register_script(
            'fiveprayer-dynamic-content-loader',
            $script_url,
            [],
            $version,
            true
        );
    }

    // Use combined JS file instead of individual file to reduce HTTP requests
    if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
        $asset_manager = \FivePrayer\Core\Assets\AssetManager::getInstance();
        $combined_js_url = $asset_manager->getCombinedJsUrl();

        if ($combined_js_url && !wp_script_is('fiveprayer-combined-js', 'enqueued')) {
            wp_enqueue_script(
                'fiveprayer-combined-js',
                $combined_js_url,
                ['jquery'],
                fiveprayer_get_asset_version(),
                true
            );

            // Localize script with AJAX URL and nonce for the combined script
            wp_localize_script('fiveprayer-combined-js', 'fiveprayer_dynamic', [
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce')
            ]);
        }
    } else {
        // Use the central function to enqueue combined scripts
        fiveprayer_enqueue_combined_scripts();
    }

    // Only enqueue live time script if we detect prayer time content on the page
    if (fiveprayer_has_prayer_time_content()) {
        $live_script_path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'php/classes/core/ShortCodes/JS/live-time.js';
        $live_script_url = plugins_url('php/classes/core/ShortCodes/JS/live-time.js', FIVEPRAYER_PLUGIN_FILE);

        if (!wp_script_is('fiveprayer-live-time', 'registered')) {
            $version = file_exists($live_script_path) ? filemtime($live_script_path) : fiveprayer_get_asset_version();
            wp_register_script(
                'fiveprayer-live-time',
                $live_script_url,
                [],
                $version,
                true
            );
        }

        // Use combined JS file instead of individual file to reduce HTTP requests
        if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
            $asset_manager = \FivePrayer\Core\Assets\AssetManager::getInstance();
            $combined_js_url = $asset_manager->getCombinedJsUrl();

            if ($combined_js_url && !wp_script_is('fiveprayer-combined-js', 'enqueued')) {
                wp_enqueue_script(
                    'fiveprayer-combined-js',
                    $combined_js_url,
                    ['jquery'],
                    fiveprayer_get_asset_version(),
                    true
                );
            }
        } else {
            // Use the central function to enqueue combined scripts
            fiveprayer_enqueue_combined_scripts();
        }
    }
}

/**
 * Check if current page has prayer time content that needs live time script
 */
function fiveprayer_has_prayer_time_content() {
    if (is_admin() || wp_doing_ajax()) {
        return false;
    }

    global $post;

    if (!is_a($post, 'WP_Post')) {
        return false;
    }

    $content = $post->post_content;

    if (fiveprayer_content_has_time_sensitive_shortcodes($content)) {
        return true;
    }

    if (fiveprayer_content_has_dynamic_text_patterns($content)) {
        return true;
    }

    return false;
}

// Hook to always enqueue scripts on both frontend and admin
add_action('wp_enqueue_scripts', 'fiveprayer_always_enqueue_scripts', 20);
add_action('admin_enqueue_scripts', 'fiveprayer_always_enqueue_scripts', 20);

/**
 * Global script tracker to track which scripts have been enqueued
 */
$fiveprayer_global_script_tracker = [
    'dynamic_loader_enqueued' => false,
    'live_time_enqueued' => false,
    'dynamic_loader_used_globally' => false,  // Persistent across page loads
    'live_time_used_globally' => false       // Persistent across page loads
];

/**
 * Track when dynamic content loader script is enqueued
 */
function fiveprayer_track_dynamic_loader_enqueue() {
    global $fiveprayer_global_script_tracker;
    $fiveprayer_global_script_tracker['dynamic_loader_enqueued'] = true;
    $fiveprayer_global_script_tracker['dynamic_loader_used_globally'] = true;  // Persistent
}

/**
 * Track when live time script is enqueued
 */
function fiveprayer_track_live_time_enqueue() {
    global $fiveprayer_global_script_tracker;
    $fiveprayer_global_script_tracker['live_time_enqueued'] = true;
    $fiveprayer_global_script_tracker['live_time_used_globally'] = true;  // Persistent
}

/**
 * Get global script tracking status
 */
function fiveprayer_get_global_script_status() {
    global $fiveprayer_global_script_tracker;
    return [
        'dynamic_loader_enqueued' => $fiveprayer_global_script_tracker['dynamic_loader_enqueued'],
        'live_time_enqueued' => $fiveprayer_global_script_tracker['live_time_enqueued'],
        'dynamic_loader_used_globally' => $fiveprayer_global_script_tracker['dynamic_loader_used_globally'],
        'live_time_used_globally' => $fiveprayer_global_script_tracker['live_time_used_globally']
    ];
}

/**
 * Reset per-page script tracking (for new page loads), but keep global usage
 */
function fiveprayer_reset_global_script_tracking() {
    global $fiveprayer_global_script_tracker;
    // Only reset the per-page flags, keep the global usage flags
    $fiveprayer_global_script_tracker['dynamic_loader_enqueued'] = false;
    $fiveprayer_global_script_tracker['live_time_enqueued'] = false;
}

// Hook into wp action to reset tracking for each page load
add_action('wp', 'fiveprayer_reset_global_script_tracking');

/**
 * Reset script localization tracking for new page loads
 */
function fiveprayer_reset_script_localization_tracking() {
    if (class_exists('\\FivePrayer\\Core\\Assets\\ScriptLocalizationManager')) {
        $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
        $localization_manager->resetTracking();
    }
}

// Hook into wp action to reset localization tracking for each page load
add_action('wp', 'fiveprayer_reset_script_localization_tracking');

/**
 * Check page content early and enqueue necessary scripts if time-sensitive shortcodes are present
 */
function fiveprayer_check_content_and_enqueue_scripts() {
    // Only run on frontend, not in admin
    if (is_admin() || wp_doing_ajax()) {
        return;
    }

    // Uses cached detection — no repeated regex work
    if (!fiveprayer_has_shortcode_on_page()) {
        return;
    }

    global $post;

    if (is_a($post, 'WP_Post')) {
        // Enqueue the dynamic content loader script
        $script_path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'php/classes/core/Assets/JS/dynamic-content-loader.js';
        $script_url = plugins_url('php/classes/core/Assets/JS/dynamic-content-loader.js', FIVEPRAYER_PLUGIN_FILE);

        if (!wp_script_is('fiveprayer-dynamic-content-loader', 'registered')) {
            $version = file_exists($script_path) ? filemtime($script_path) : fiveprayer_get_asset_version();
            wp_register_script(
                'fiveprayer-dynamic-content-loader',
                $script_url,
                [],
                $version,
                true
            );
        }

        // Use the central function to enqueue combined scripts
        fiveprayer_enqueue_combined_scripts();
    }
}

/**
 * Initialize the asset manager to combine and minify CSS/JS files.
 * Only runs on frontend requests where shortcodes may be present.
 */
function fiveprayer_initialize_asset_manager() {
    // Skip on admin, AJAX, REST, and cron — only needed on frontend
    if (is_admin() || wp_doing_ajax() || wp_doing_cron() || (defined('REST_REQUEST') && REST_REQUEST)) {
        return;
    }

    if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
        $asset_manager = \FivePrayer\Core\Assets\AssetManager::getInstance();

        // Register all front-end CSS files that should be combined.
        //
        // Only front-end stylesheets belong in this bundle: it is enqueued on
        // the front end, so admin-only sheets (Assets/CSS/settings-admin.css,
        // logging-styles.css, api-admin.css) are intentionally excluded and are
        // enqueued per-screen by their own admin classes. Optional sheets that
        // do not exist yet are dropped by the file_exists() filter below, so
        // they can be listed here before they actually ship.
        $css_files_to_combine = [
            FIVEPRAYER_ABSPATH . 'php/classes/core/ShortCodes/css/prayer-styles.css',
            FIVEPRAYER_ABSPATH . 'php/classes/core/ShortCodes/css/daily-styles.css',
            FIVEPRAYER_ABSPATH . 'php/classes/core/ShortCodes/css/responsive.css',
            // The TV signage stylesheet is front-end CSS too, so it ships in the
            // same bundle instead of as a second <link> on display pages. Every
            // rule in it is scoped to `body.fiveprayer-tv-active`, so loading it
            // on an ordinary prayer page changes nothing there.
            FIVEPRAYER_ABSPATH . 'php/classes/core/Assets/CSS/tv-display.css',
            // Next-prayer highlight styling. Scoped to `.fiveprayer_highlight`,
            // so the default look ships with every prayer page without touching
            // unrelated content.
            FIVEPRAYER_ABSPATH . 'php/classes/core/Assets/CSS/highlighter.css',
        ];

        // Filter out non-existent files
        $css_files = array_filter($css_files_to_combine, function($file) {
            return file_exists($file);
        });

        $asset_manager->registerCssFiles($css_files);

        // Register all JS files that should be combined
        $js_files_to_combine = [
            FIVEPRAYER_ABSPATH . 'php/classes/core/ShortCodes/JS/live-time.js',
            FIVEPRAYER_ABSPATH . 'php/classes/core/Assets/JS/next-prayer-countdown.js',
            FIVEPRAYER_ABSPATH . 'php/classes/core/Assets/JS/dynamic-content-loader.js',
            FIVEPRAYER_ABSPATH . 'php/classes/core/Assets/JS/hijri-date-updater.js',
            FIVEPRAYER_ABSPATH . 'php/classes/core/Calendar/JS/PrintCalendar.js',
            FIVEPRAYER_ABSPATH . 'php/classes/core/Assets/JS/highlighter.js',
        ];

        // Filter out non-existent files
        $js_files = array_filter($js_files_to_combine, function($file) {
            return file_exists($file);
        });

        $asset_manager->registerJsFiles($js_files);

        // Generate the combined files to ensure they're created
        $asset_manager->getCombinedCssUrl();
        $asset_manager->getCombinedJsUrl();

        \FivePrayer\Core\Logging\Logger::debug('FivePrayer asset manager initialized with combined files', 'FivePrayer');
    }
}

/**
 * Function to prevent duplicate script enqueuing
 */
function fiveprayer_enqueue_combined_scripts() {
    static $scripts_enqueued = false;

    if ($scripts_enqueued) {
        return; // Already enqueued
    }

    if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
        $asset_manager = \FivePrayer\Core\Assets\AssetManager::getInstance();
        $combined_js_url = $asset_manager->getCombinedJsUrl();
        $combined_css_url = $asset_manager->getCombinedCssUrl();

        if ($combined_js_url) {
            wp_enqueue_script(
                'fiveprayer-combined-js',
                $combined_js_url,
                ['jquery'],
                fiveprayer_get_asset_version(),
                true
            );

            // Localize script with AJAX URL and nonce
            wp_localize_script('fiveprayer-combined-js', 'fiveprayer_dynamic', [
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce'),
                'auto_print_page_url' => \FivePrayer\Core\Helpers\PrinterHelper::getAutoPrintPageUrl(),
            ]);
            
            // Also localize as fiveprayer_ajax for backward compatibility
            wp_localize_script('fiveprayer-combined-js', 'fiveprayer_ajax', [
                'ajaxurl' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce'),
                'auto_print_page_url' => \FivePrayer\Core\Helpers\PrinterHelper::getAutoPrintPageUrl(),
            ]);
        }

        // Styles go through StyleManager, which owns the single handle
        // (`fiveprayer-default-style`, the combined bundle) and attaches the
        // dynamic variables to it once. Enqueuing the bundle URL again here
        // under a second handle put the same stylesheet in the page twice.
        if (class_exists('\\FivePrayer\\Core\\ShortCodes\\Managers\\StyleManager')) {
            \FivePrayer\Core\ShortCodes\Managers\StyleManager::getInstance()->enqueueStyles();
        } elseif ($combined_css_url) {
            wp_enqueue_style(
                'fiveprayer-combined-css',
                $combined_css_url,
                [],
                fiveprayer_get_asset_version()
            );
        }

        $scripts_enqueued = true;
    }
}

// Hook into init to initialize asset manager for combining and minifying CSS/JS
add_action('init', 'fiveprayer_initialize_asset_manager', 15);
<?php
namespace FivePrayer\Core;

defined('ABSPATH') || exit;

use FivePrayer\Core\Database\DatabaseChecker;
use FivePrayer\Core\Database\DatabaseInitializer;
use FivePrayer\Core\Controllers\API\ApiControllerRegistrar;
use FivePrayer\Core\AdminHtmlInjector;
use FivePrayer\Core\Database\SchemaSetup;
use FivePrayer\Core\AdminMenu;
use FivePrayer\Core\Assets;
use FivePrayer\Core\Shortcodes;
use FivePrayer\Core\Blocks\BlockRegistrar;
use FivePrayer\Core\Database\Translate;
use FivePrayer\Core\initRegister;
use FivePrayer\Core\PathService;
use FivePrayer\Core\Cache\CacheControl;
use FivePrayer\Core\Media\ImageUploader;
use FivePrayer\Core\Admin\SettingsAdmin;
use FivePrayer\Core\Admin\ApiAdmin;
use FivePrayer\Core\Admin\TVDisplayMode;
use FivePrayer\Core\Admin\LocalTestingMode;
use FivePrayer\Core\Admin\TvCanvasLocker;
use FivePrayer\Core\Admin\UninstallSettings;
use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Helpers\MetaFieldGenerator;

class Plugin
{
    /**
     * Plugin main file path
     */
    public const FIVEPRAYER_FILE = FIVEPRAYER_FILE;
    
    /**
     * Cached instances for better performance
     */
    private static $pathService = null;
    private static $dbChecker = null;
    
    public function init(): void
    {
        // Uninstall cleanup lives in uninstall.php. A callback registered with
        // register_uninstall_hook() cannot be relied on: WordPress deletes the
        // plugin's files before it runs one, so the callback may be gone.

        // Flush rewrite rules on first request after upgrade so REST API
        // routes are always present in the rewrite index.
        add_action('init', function() {
            $option_key = 'fiveprayer_flush_rewrite';
            if (get_option($option_key)) {
                delete_option($option_key);
                flush_rewrite_rules();

                // Purge external page caches once after an upgrade so any 404
                // responses cached for the REST routes before the rewrite
                // flush are cleared. This must stay here (one-time) rather than
                // on every rest_api_init request, which purged every cache on
                // every admin page load.
                if (function_exists('fiveprayer_purge_external_caches')) {
                    fiveprayer_purge_external_caches();
                }
            }
        }, 99);

        // Initialize CacheControl after WordPress is fully loaded
        add_action('wp_loaded', function() {
            $cacheControl = CacheControl::getInstance();
            // Removed excessive debug logging to reduce log duplication
        });

        // Include helpers using cached path service
        $path_service = $this->getPathService();
        require_once $path_service->getFileFullPath('php/classes/core/helpers/helpers-init.php');

        // Initialize components
        $this->initializeComponents();

        // Register frontend scripts
        add_action('wp_enqueue_scripts', [$this, 'enqueueFrontendScripts']);

        // Removed excessive debug logging to reduce log duplication
    }
    
    /**
     * Get cached PathService instance
     */
    private function getPathService(): PathService
    {
        if (self::$pathService === null) {
            self::$pathService = new PathService();
        }
        return self::$pathService;
    }
    
    /**
     * Get cached DatabaseChecker instance
     */
    private function getDatabaseChecker(): DatabaseChecker
    {
        if (self::$dbChecker === null) {
            self::$dbChecker = new DatabaseChecker();
        }
        return self::$dbChecker;
    }
    
    /**
     * Enqueue frontend scripts and styles
     */
    public function enqueueFrontendScripts() {
        // Only load scripts on pages that contain FivePrayer shortcodes
        if (!is_admin() && !wp_doing_ajax() && function_exists('fiveprayer_has_shortcode_on_page') && !fiveprayer_has_shortcode_on_page()) {
            return;
        }

        // Use cached path service
        $path_service = $this->getPathService();
        $script_path = 'php/classes/core/Assets/JS/hijri-date-updater.js';
        
        // Use the central function to enqueue combined scripts instead of individual files
        if (function_exists('fiveprayer_enqueue_combined_scripts')) {
            fiveprayer_enqueue_combined_scripts();

            // Localize the combined script with AJAX URL and nonce
            wp_localize_script(
                'fiveprayer-combined-js',
                'fiveprayer_ajax',
                [
                    'ajaxurl' => admin_url('admin-ajax.php'),
                    'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce'),
                ]
            );
        } else {
            // Fallback to individual file if central function is not available
            wp_enqueue_script(
                'fiveprayer-hijri-date-updater',
                $path_service->getFileUrl($script_path),
                [],
                filemtime($path_service->getFileFullPath($script_path)),
                true
            );

            // Localize the script with AJAX URL and nonce
            wp_localize_script(
                'fiveprayer-hijri-date-updater',
                'fiveprayer_ajax',
                [
                    'ajaxurl' => admin_url('admin-ajax.php'),
                    'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce'),
                ]
            );
        }
    }

    private function initializeComponents(): void
    {
        // Use cached database checker
        $dbChecker = $this->getDatabaseChecker();

        // PNG uploader initialization removed

        // Blocks registration
        add_action('init', function() {
            (new BlockRegistrar())->register_blocks();
        },5);

        // Admin components
        (new AdminHtmlInjector())->init();
        (new AdminMenu())->register();
        // Register Settings admin submenu and actions
        (new SettingsAdmin())->register();
        // TV Display Mode: per-page full-screen signage toggle (admin + front end)
        (new TVDisplayMode())->register();
        // TV Mode editor guides (Canvas Force & Safe Zone Guide): two
        // editor-only design aids, each with its own switch on the TV Display
        // Mode page. Canvas Force locks a page builder's canvas to a display
        // page's chosen width × height; the Safe Zone Guide draws a read-only
        // overscan guide over it. Both are inert until their switch is turned on,
        // and neither ever touches the finished front-end page.
        (new TvCanvasLocker())->register();
        // Share on Local Network (network sharing): the on/off switch is the third
        // switch of the TV Display Mode page of the Configure Settings screen
        // (next to Pages and Posts); this class only registers the secure AJAX
        // endpoint that saves it, and is inert until that switch is turned on.
        (new LocalTestingMode())->register();
        // Delete-all-data-on-uninstall opt-in (read only by uninstall.php)
        (new UninstallSettings())->register();
        // Register API admin submenu and actions
        try {
            (new ApiAdmin());
            Logger::debug('API Management submenu page is now enabled and visible in admin menu', 'Plugin');
        } catch (\Throwable $e) {
            Logger::error('Error initializing ApiAdmin: ' . $e->getMessage(), 'Plugin');
        }

        // Frontend components
        (new Assets())->register();
        (new Shortcodes())->register();
        (new MetaFieldGenerator())->init();

        // Always register REST API controllers so endpoints return proper responses
        // instead of 404 on sites where tables are not yet created.
        (new ApiControllerRegistrar())->init();

        // Register the AJAX hooks of the settings-meta controller exactly once.
        // Its REST routes belong to ApiControllerRegistrar, so the constructor
        // no longer adds a second rest_api_init callback.
        add_action('init', function() {
            (new \FivePrayer\Core\Controllers\API\EndPoints\PrayerSettingsMetaController())->register_hooks();
        }, 1); // Very early priority to ensure AJAX hooks are registered
    }

    /**
     * Check if this is a REST API request
     */
    private function isRestApiRequest(): bool {
        return defined('REST_REQUEST') && REST_REQUEST;
    }

    /**
     * Check if this is an AJAX request
     */
    private function isAjaxRequest(): bool {
        return wp_doing_ajax();
    }

    public function onActivate(): void
    {
        // Only a buffer this method opened is closed again: activation runs
        // inside activate_plugin(), which has a buffer of its own, and closing
        // that one is what made WordPress log "Failed to delete buffer".
        $started_buffer = false;

        try {
            // Suppress any output during activation
            if (ob_get_level() === 0) {
                ob_start();
                $started_buffer = true;
            }

            // Create database tables
            (new SchemaSetup())->createTables();

            // ALWAYS run merge to add any missing default data
            // This ensures new entries are added even when tables already exist
            $schema_helper = new \FivePrayer\Core\Database\SchemaHelper();
            $schema_helper->insertDefaultSettings();
            $schema_helper->insertDefaultTranslations();

            // Ensure the default image is in the media library
            $image_uploader = new ImageUploader();
            $image_id = $image_uploader->ensureImageExists();

            if ($image_id) {
                Logger::info('Default image uploaded with ID: ' . $image_id, 'Plugin');
            }

            // Flush rewrite rules so REST API routes are registered in the
            // rewrite index — prevents 404 on freshly activated installs.
            flush_rewrite_rules();

            // Schedule a second flush on the next init to catch edge cases
            // where rewrite rules are rebuilt after the activation hook.
            update_option('fiveprayer_flush_rewrite', true);

            // Clear any existing caches
            if (class_exists('FivePrayer\\Core\\Helpers\\PrayerDataCache')) {
                \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
            }

            // Clear LiteSpeed cache if active
            if (class_exists('FivePrayer\\Core\\Cache\\CacheControl')) {
                $cacheControl = \FivePrayer\Core\Cache\CacheControl::getInstance();
                $cacheControl->bustCache();
            }

            // Clear any output that might have been generated
            if ($started_buffer && ob_get_level() > 0) {
                ob_end_clean();
            }
        } catch (\Throwable $e) {
            Logger::error('Activation error: ' . $e->getMessage(), 'Plugin');
            // Make sure to clean the output buffer if an error occurs
            if ($started_buffer && ob_get_level() > 0) {
                ob_end_clean();
            }
        }
    }
}
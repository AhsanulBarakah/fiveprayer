<?php
/**
 * FivePrayer Logging Module
 * 
 * This file handles all logging functionality for the FivePrayer plugin.
 * 
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

/**
 * Initialize the logging system with default settings
 */
function fiveprayer_initialize_logging() {
    static $initialized = false;
    if ($initialized) {
        return;
    }
    $initialized = true;

    // Set default log level if not already set (only runs once per process)
    if (get_option('fiveprayer_log_level') === false) {
        update_option('fiveprayer_log_level', 'none');
    }

    \FivePrayer\Core\Logging\Logger::debug('FivePrayer plugin logging system initialized', 'FivePrayer');
}

/**
 * Expose logging settings functionality for the React admin app
 * (No separate submenu page - integrated into main settings as tab)
 */
function fiveprayer_expose_logging_settings() {
    // Register REST API endpoints for the React admin app to use for logging settings
    add_action('rest_api_init', function() {
        register_rest_route('fiveprayer/v1', '/logging-settings', [
            'methods' => 'GET',
            'callback' => 'fiveprayer_get_logging_settings',
            'permission_callback' => function() {
                return current_user_can('manage_options');
            },
        ]);

        register_rest_route('fiveprayer/v1', '/logging-settings', [
            'methods' => 'POST',
            'callback' => 'fiveprayer_update_logging_settings',
            'permission_callback' => function() {
                return current_user_can('manage_options');
            },
            'args' => [
                'log_level' => [
                    'required' => true,
                    'type' => 'string',
                    'enum' => ['none', 'error', 'warning', 'info', 'debug']
                ]
            ]
        ]);
    });
}
add_action('plugins_loaded', 'fiveprayer_expose_logging_settings');

/**
 * Get logging settings via REST API
 */
function fiveprayer_get_logging_settings($request) {
    $log_level = get_option('fiveprayer_log_level', 'none');
    return rest_ensure_response([
        'log_level' => $log_level,
        'available_levels' => [
            'none' => 'None - No logging',
            'error' => 'Error - Errors only',
            'warning' => 'Warning - Warnings and errors',
            'info' => 'Info - Info, warnings and errors',
            'debug' => 'Debug - All messages'
        ]
    ]);
}

/**
 * Update logging settings via REST API
 */
function fiveprayer_update_logging_settings($request) {
    $log_level = $request->get_param('log_level');

    if (!in_array($log_level, ['none', 'error', 'warning', 'info', 'debug'])) {
        return new WP_Error('invalid_param', 'Invalid log level', ['status' => 400]);
    }

    update_option('fiveprayer_log_level', $log_level);

    // Invalidate cache to ensure consistency
    \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();

    // Also purge external cache plugins to ensure changes are visible immediately
    fiveprayer_purge_external_caches();

    return rest_ensure_response([
        'success' => true,
        'message' => 'Logging settings updated successfully',
        'log_level' => $log_level
    ]);
}
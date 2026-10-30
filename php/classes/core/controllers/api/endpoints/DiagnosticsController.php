<?php

namespace FivePrayer\Core\Controllers\API\EndPoints;
defined('ABSPATH') || exit;

use WP_REST_Request;
use WP_REST_Server;
use WP_Error;
use FivePrayer\Core\Controllers\API\RestControllerBase;

/**
 * Diagnostics endpoints.
 *
 * Exposes the timetable query regression check over REST so it can be run from
 * CI or by hand (curl / WP-CLI `wp rest ...`) without opening the admin UI.
 */
class DiagnosticsController extends RestControllerBase
{
    public function __construct()
    {
        add_action('rest_api_init', [$this, 'register_routes']);
    }

    public function register_routes(): void
    {
        register_rest_route($this->get_namespace(), '/diagnostics/timetable-query', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_timetable_query_check'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route($this->get_namespace(), '/diagnostics/object-cache-connection', [
            'methods'             => WP_REST_Server::READABLE,
            'callback'            => [$this, 'get_object_cache_connection'],
            'permission_callback' => [$this, 'check_permission'],
        ]);
    }

    public function check_permission()
    {
        return current_user_can('manage_options');
    }

    /**
     * Run the timetable query regression check and return the result as JSON.
     */
    public function get_timetable_query_check(WP_REST_Request $request)
    {
        if (!function_exists('fiveprayer_run_timetable_query_regression_check')) {
            return new WP_Error(
                'fiveprayer_check_unavailable',
                __('The timetable query regression check is not available.', 'fiveprayer'),
                ['status' => 500]
            );
        }

        $check = fiveprayer_run_timetable_query_regression_check();

        $response = [
            'passed' => !empty($check['passed']),
            'checks' => $check['checks'] ?? [],
        ];

        if (function_exists('fiveprayer_get_object_cache_status')) {
            $response['object_cache'] = fiveprayer_get_object_cache_status();
        }

        return rest_ensure_response($response);
    }

    /**
     * Test whether the configured Redis/Memcached server is reachable.
     */
    public function get_object_cache_connection(WP_REST_Request $request)
    {
        if (!function_exists('fiveprayer_test_object_cache_connection')) {
            return new WP_Error(
                'fiveprayer_check_unavailable',
                __('The object cache connection test is not available.', 'fiveprayer'),
                ['status' => 500]
            );
        }

        $test = fiveprayer_test_object_cache_connection();

        $response = [
            'any_reachable' => !empty($test['any_reachable']),
            'reachable'     => $test['reachable'] ?? [],
            'results'       => $test['results'] ?? [],
            'checked'       => $test['checked'] ?? 0,
        ];

        if (function_exists('fiveprayer_get_object_cache_status')) {
            $response['object_cache'] = fiveprayer_get_object_cache_status();
        }

        return rest_ensure_response($response);
    }
}

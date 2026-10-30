<?php

namespace FivePrayer\Core\Controllers\API;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

class ApiControllerRegistrar
{
    public function init(): void
    {
        // This ensures REST API routes are only registered after it's safe
        add_action('rest_api_init', [$this, 'register_api_controllers']);
    }

    public function register_api_controllers(): void
    {
        Logger::info('Registering API controllers', 'ApiControllerRegistrar');
        
        $controllers = [
            'FivePrayer\Core\Controllers\API\EndPoints\PrayerSettingsMetaController',
            'FivePrayer\Core\Controllers\API\EndPoints\PrayerTimeTableController',
            'FivePrayer\Core\Controllers\API\EndPoints\TranslateController',
            'FivePrayer\Core\Controllers\API\EndPoints\PngUrlController',
            'FivePrayer\Core\Controllers\API\EndPoints\ExternalApiController',
            'FivePrayer\Core\Controllers\API\EndPoints\DiagnosticsController',
        ];

        foreach ($controllers as &$controller) {
            try {
                (new $controller())->register_routes();
                Logger::info('Registered controller: ' . $controller, 'ApiControllerRegistrar');
            } catch (\Exception $e) {
                Logger::error('Error registering controller ' . $controller . ': ' . $e->getMessage(), 'ApiControllerRegistrar');
            }
        }
        
        // NOTE: external page caches are intentionally NOT purged here. This
        // method runs on every rest_api_init request, so purging here fired a
        // full cache purge (e.g. LiteSpeed's "Purged all caches successfully")
        // on every admin / REST request. The one-time purge that clears stale
        // 404 responses after an upgrade lives in Plugin::init(), gated by the
        // same flag that flushes the rewrite rules.
        Logger::info('All API controllers registered', 'ApiControllerRegistrar');
    }
}

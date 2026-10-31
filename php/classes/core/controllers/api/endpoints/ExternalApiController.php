<?php

namespace FivePrayer\Core\Controllers\API\EndPoints;

defined('ABSPATH') || exit;

use WP_REST_Request;
use WP_REST_Server;
use WP_Error;
use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Controllers\API\RestControllerBase;
use FivePrayer\Core\Database\FivePrayer_DatabaseTranslations;

use FivePrayer\Core\Controllers\API\EndPoints\Traits\ApiKeyHandlerTrait;
use FivePrayer\Core\Controllers\API\EndPoints\Traits\HijriDateTrait;
use FivePrayer\Core\Controllers\API\EndPoints\Traits\MosqueInfoEndpointTrait;
use FivePrayer\Core\Controllers\API\EndPoints\Traits\PrayerTimeEndpointTrait;
use FivePrayer\Core\Controllers\API\EndPoints\Traits\PrayerTimeResponseBuilderTrait;
use FivePrayer\Core\Controllers\API\EndPoints\Traits\TimeFormattingTrait;
use FivePrayer\Core\Controllers\API\EndPoints\Traits\TranslationHelperTrait;

class ExternalApiController extends RestControllerBase
{
    use ApiKeyHandlerTrait;
    use HijriDateTrait;
    use MosqueInfoEndpointTrait;
    use PrayerTimeEndpointTrait;
    use PrayerTimeResponseBuilderTrait;
    use TimeFormattingTrait;
    use TranslationHelperTrait;

    public function __construct()
    {
        // Don't initialize ApiKeyManager in constructor to avoid errors during route registration

        // Registered once, here, rather than from register_routes(): that method
        // runs on every rest_api_init, so the same filter was added again on
        // each pass.
        add_filter('rest_pre_serve_request', [$this, 'add_cors_headers'], 10, 4);
    }

    /**
     * Send the CORS headers for the external API routes.
     *
     * Authentication is the X-API-Key header, never a cookie, so a wildcard
     * origin cannot leak a visitor's session. Echoing the caller's Origin back
     * instead let a shared cache serve one site's response to another, and
     * without `Vary: Origin` a cache was free to mix them up anyway.
     *
     * @param bool             $served  Whether the request has been served.
     * @param \WP_REST_Response $result  Response, when there is one.
     * @param WP_REST_Request  $request Current request.
     * @param WP_REST_Server   $server  REST server.
     * @return bool
     */
    public function add_cors_headers($served, $result = null, $request = null, $server = null)
    {
        if (!$request instanceof WP_REST_Request || 0 !== strpos($request->get_route(), '/fiveprayer/v1/external/')) {
            return $served;
        }

        if (!headers_sent()) {
            header('Access-Control-Allow-Origin: *');
            // append: keep any Vary other code has already sent.
            header('Vary: Origin', false);
            header('Access-Control-Allow-Methods: GET, OPTIONS');
            header('Access-Control-Allow-Headers: X-API-Key, Content-Type, Authorization, Accept');
            header('Access-Control-Max-Age: 86400');
        }

        return $served;
    }

    public function register_routes(): void
    {
        Logger::info('Registering external API routes', 'ExternalApiController');

        // Prayer times endpoints
        \register_rest_route($this->get_namespace(), '/external/prayer-times', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_prayer_times'],
            'permission_callback' => [$this, 'check_api_key'],
            'args' => [
                'date' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'lang' => [
                    'required' => false,
                    'default' => 'en',
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Language code (e.g., en, ar). Defaults to en.',
                ],
                'langs' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Comma-separated list of language codes to include (e.g., en,ar)',
                ],
                'time_format' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Time format: 12h (default) or 24h',
                ],
                'ramadan_start_date' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Custom Ramadan start date in YYYY-MM-DD format (overrides system settings)',
                ],
            ],
        ]);

        \register_rest_route($this->get_namespace(), '/external/prayer-times/today', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_today_prayer_times'],
            'permission_callback' => [$this, 'check_api_key'],
            'args' => [
                'lang' => [
                    'required' => false,
                    'default' => 'en',
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Language code (e.g., en, ar). Defaults to en.',
                ],
                'langs' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Comma-separated list of language codes to include (e.g., en,ar)',
                ],
                'time_format' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Time format: 12h (default) or 24h',
                ],
            ],
        ]);

        \register_rest_route($this->get_namespace(), '/external/prayer-times/month', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_month_prayer_times'],
            'permission_callback' => [$this, 'check_api_key'],
            'args' => [
                'month' => [
                    'required' => false,
                    'validate_callback' => ['FivePrayer\\Core\\Helpers\\Validator', 'validateMonth'],
                ],
                'year' => [
                    'required' => false,
                    'validate_callback' => ['FivePrayer\\Core\\Helpers\\Validator', 'validateYear'],
                ],
                'lang' => [
                    'required' => false,
                    'default' => 'en',
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Language code (e.g., en, ar). Defaults to en.',
                ],
                'langs' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Comma-separated list of language codes to include (e.g., en,ar)',
                ],
                'ramadan_only' => [
                    'required' => false,
                    'sanitize_callback' => function ($value) {
                        return in_array(strtolower($value), ['true', '1', 'yes']) ? true : false;
                    },
                    'description' => 'Filter to show only Ramadan dates (true/false)',
                ],
                'ramadan_start_date' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Custom Ramadan start date in YYYY-MM-DD format (overrides system settings)',
                ],
                'time_format' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Time format: 12h (default) or 24h',
                ],
                'include_extras' => [
                    'required' => false,
                    'sanitize_callback' => function ($value) {
                        return in_array(strtolower((string) $value), ['true', '1', 'yes'], true) ? true : false;
                    },
                    'description' => 'Deprecated and ignored: the second ‘Asr (asr2) is a standard field, returned whenever the day has a stored value. Kept so existing clients keep working.',
                ],
            ],
        ]);

        // Next prayer endpoint
        \register_rest_route($this->get_namespace(), '/external/next-prayer', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'get_next_prayer'],
            'permission_callback' => [$this, 'check_api_key'],
            'args' => [
                'lang' => [
                    'required' => false,
                    'default' => 'en',
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Language code (e.g., en, ar). Defaults to en.',
                ],
                'langs' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Comma-separated list of language codes to include (e.g., en,ar)',
                ],
                'time_format' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Time format: 12h (default) or 24h',
                ],
            ],
        ]);

        // Test endpoint (no authentication required)
        \register_rest_route($this->get_namespace(), '/external/test', [
            'methods' => WP_REST_Server::READABLE,
            'callback' => [$this, 'test_endpoint'],
            'permission_callback' => '__return_true',
            'args' => [
                'lang' => [
                    'required' => false,
                    'default' => 'en',
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Language code (e.g., en, ar). Defaults to en.',
                ],
                'langs' => [
                    'required' => false,
                    'sanitize_callback' => 'sanitize_text_field',
                    'description' => 'Comma-separated list of language codes to include (e.g., en,ar)',
                ],
            ],
        ]);

        Logger::info('External API routes registered successfully', 'ExternalApiController');
    }

    public function test_endpoint(WP_REST_Request $request)
    {
        $resolved = $this->resolve_language_params($request);
        if (is_wp_error($resolved)) {
            return $resolved;
        }
        [$language, $selected_languages] = $resolved;

        $translations = FivePrayer_DatabaseTranslations::getTranslations();
        $active_language = $translations['activeLanguage'][0]['language_code'] ?? 'en';

        $available_languages = [];

        if (isset($translations['prayer_names'])) {
            foreach ($translations['prayer_names'] as &$translation) {
                if (isset($translation['language_code']) && isset($translation['language_name'])) {
                    $available_languages[$translation['language_code']] = $translation['language_name'];
                }
            }
        }

        return rest_ensure_response([
            'version' => '1.0.0',
            'timestamp' => current_time('mysql'),
            'requested_language' => $language ?? '',
            'active_language' => $active_language,
            'mosque_info' => $this->get_mosque_info_data($language),
            'endpoints' => [
                '/external/test',
                '/external/prayer-times',
                '/external/prayer-times/today',
                '/external/prayer-times/month',
                '/external/next-prayer',
            ],
            'available_languages' => $available_languages,
        ]);
    }
}

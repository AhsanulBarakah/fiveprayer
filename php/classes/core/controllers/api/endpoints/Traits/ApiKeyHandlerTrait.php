<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use WP_REST_Request;
use WP_Error;
use FivePrayer\Core\API\ApiKeyManager;
use FivePrayer\Core\API\BruteForceSettings;
use FivePrayer\Core\Security\SecurityHelper;

/**
 * Trait ApiKeyHandlerTrait
 *
 * Handles API key management and authentication for external API endpoints.
 * Extracted from ExternalApiController.php for code organization.
 *
 * @package FivePrayer\Core\Controllers\API\EndPoints
 */
trait ApiKeyHandlerTrait
{
    /**
     * @var ApiKeyManager|null
     */
    private $api_key_manager;

    /**
     * Get the API key manager instance.
     */
    private function get_api_key_manager(): ApiKeyManager
    {
        if (!$this->api_key_manager) {
            $this->api_key_manager = new ApiKeyManager();
        }
        return $this->api_key_manager;
    }

    /**
     * Get the client IP address used for brute-force tracking.
     *
     * Delegates to SecurityHelper so the REST permission callback and the key
     * manager always attribute a request to the same address, and so forwarded
     * headers are only honoured for explicitly trusted proxies.
     *
     * @return string The client IP address.
     */
    private function get_client_ip(): string
    {
        $ip = (string) SecurityHelper::get_client_ip();

        return 'unknown' === $ip ? '' : $ip;
    }

    /**
     * Check if the API key is valid with brute force protection.
     */
    public function check_api_key(WP_REST_Request $request)
    {
        $client_ip = $this->get_client_ip();
        $brute_force_enabled = $client_ip && BruteForceSettings::is_enabled();

        // Check if the client IP is blocked by brute force protection
        if ($brute_force_enabled && BruteForceSettings::is_ip_blocked($client_ip)) {
            return new WP_Error(
                'ip_blocked',
                'Your IP address has been temporarily blocked due to too many failed attempts.',
                ['status' => 403]
            );
        }

        $api_key = $request->get_header('X-API-Key');

        if (!$api_key) {
            if ($brute_force_enabled) {
                BruteForceSettings::track_failed_attempt($client_ip);
            }
            return new WP_Error(
                'missing_api_key',
                'API key is required',
                ['status' => 401]
            );
        }

        // The route is passed through so endpoint restrictions are compared with
        // the route being served, not with a value re-derived from REQUEST_URI
        // (which differs between pretty and plain permalinks and behind proxies).
        $validation = $this->get_api_key_manager()->validate_key($api_key, $request->get_route());

        if (!$validation['valid']) {
            // ApiKeyManager::validate_key() already records this failure. Counting
            // it again here made the configured threshold trip at half the
            // attempts an administrator expects.
            return new WP_Error(
                'invalid_api_key',
                $validation['error'],
                ['status' => 401]
            );
        }

        return true;
    }
}

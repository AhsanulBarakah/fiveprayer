<?php

namespace FivePrayer\Core\API\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Security\SecurityHelper;

/**
 * Trait KeyPermissionTrait
 *
 * Handles API key permission checks including domain, IP, and endpoint restrictions.
 * Extracted from ApiKeyManager for code organization.
 */
trait KeyPermissionTrait
{
    /**
     * Check if a request is permitted based on the key's domain, IP, and endpoint restrictions.
     *
     * @param object $key_data Key row from the database.
     * @param array  $server   Server variables (usually $_SERVER).
     * @param string $route    REST route handling the request, when available.
     */
    private function check_key_permissions($key_data, $server, string $route = ''): bool
    {
        // If no restrictions set, allow all
        if (empty($key_data->allowed_domains) && empty($key_data->allowed_ips) && empty($key_data->allowed_endpoints)) {
            return true;
        }

        // Check domain restriction
        if (!empty($key_data->allowed_domains)) {
            $allowed_domains = array_map('trim', explode(',', $key_data->allowed_domains));
            
            // Check Origin header first, then fall back to Referer.
            // These identify WHERE the request is coming FROM (e.g., your app's domain).
            // HTTP_HOST would be the API server's own hostname (e.g., fiveprayer.com),
            // which is never the intended check.
            $request_host = '';
            $origin = $server['HTTP_ORIGIN'] ?? '';
            $referer = $server['HTTP_REFERER'] ?? '';
            
            if (!empty($origin)) {
                // parse_url requires a scheme to extract the host.
                // If the Origin header is sent as a bare hostname (e.g., "fiveprayer.com"
                // instead of "https://fiveprayer.com"), prepend a default scheme so
                // parse_url can correctly identify the host portion.
                $origin_normalized = $origin;
                if (strpos($origin_normalized, '://') === false) {
                    $origin_normalized = 'https://' . $origin_normalized;
                }
                $request_host = wp_parse_url($origin_normalized, PHP_URL_HOST) ?: '';
            } elseif (!empty($referer)) {
                $referer_normalized = $referer;
                if (strpos($referer_normalized, '://') === false) {
                    $referer_normalized = 'https://' . $referer_normalized;
                }
                $request_host = wp_parse_url($referer_normalized, PHP_URL_HOST) ?: '';
            }
            
            // Check if wildcard '*' is in the list — this means allow all origins.
            if (in_array('*', $allowed_domains, true)) {
                // Skip domain restriction entirely
            } else {
                // If neither Origin nor Referer is provided and domains are restricted,
                // deny the request (secure default).
                if (empty($request_host)) {
                    return false;
                }
                
                // Check if request host matches any allowed domain
                $domain_match = false;
                foreach ($allowed_domains as $domain) {
                    // Normalize the stored domain: strip protocol (http://, https://),
                    // port numbers, and trailing paths so that entries like
                    // "https://fiveprayer.com", "fiveprayer.com", "http://localhost:3000",
                    // or "localhost" all compare against the raw hostname.
                    $normalized_domain = preg_replace('#^\w+://#', '', $domain);
                    $normalized_domain = wp_parse_url($normalized_domain, PHP_URL_HOST) ?: $normalized_domain;

                    if ($request_host === $normalized_domain || 
                        (strpos($normalized_domain, '*.') === 0 && 
                         substr($request_host, -strlen($normalized_domain)+1) === substr($normalized_domain, 1))) {
                        $domain_match = true;
                        break;
                    }
                }
                
                if (!$domain_match) {
                    return false;
                }
            }
        }

        // Check IP restriction
        if (!empty($key_data->allowed_ips)) {
            $allowed_ips = array_map('trim', explode(',', $key_data->allowed_ips));

            // Same client address the brute-force counter uses: the direct peer,
            // unless it is a proxy the site has explicitly listed as trusted.
            $request_ip = (string) SecurityHelper::get_client_ip();
            
            $ip_match = false;
            foreach ($allowed_ips as $ip_range) {
                if (strpos($ip_range, '/') !== false) {
                    // CIDR notation
                    if ($this->ip_in_range($request_ip, $ip_range)) {
                        $ip_match = true;
                        break;
                    }
                } else {
                    // Exact IP
                    if ($request_ip === $ip_range) {
                        $ip_match = true;
                        break;
                    }
                }
            }
            
            if (!$ip_match) {
                return false;
            }
        }

        // Check endpoint restriction
        if (!empty($key_data->allowed_endpoints)) {
            $allowed_endpoints = array_values(array_filter(
                array_map('trim', explode(',', $key_data->allowed_endpoints)),
                static function ($allowed_endpoint) {
                    return '' !== $allowed_endpoint;
                }
            ));

            $endpoint = '' !== $route
                ? $this->extract_route_endpoint($route)
                : $this->extract_endpoint($server['REQUEST_URI'] ?? '');

            // An empty name means the route could not be determined. Deny rather
            // than let a blank allowlist entry (a trailing comma, for example)
            // match every request.
            if ('' === $endpoint) {
                return false;
            }

            $endpoint_match = false;
            foreach ($allowed_endpoints as $allowed_endpoint) {
                if ($allowed_endpoint === '*' || $endpoint === $allowed_endpoint ||
                    (strpos($allowed_endpoint, '*') !== false && 
                     fnmatch($allowed_endpoint, $endpoint))) {
                    $endpoint_match = true;
                    break;
                }
            }
            
            if (!$endpoint_match) {
                return false;
            }
        }

        return true;
    }

    /**
     * Extract the endpoint name from a REST route such as
     * /fiveprayer/v1/external/prayer-times/today.
     *
     * @param string $route Route registered with the REST server.
     * @return string Endpoint name, e.g. "prayer-times/today".
     */
    private function extract_route_endpoint(string $route): string
    {
        $needle = 'fiveprayer/v1/external/';
        $position = strpos($route, $needle);

        if (false === $position) {
            return '';
        }

        return trim(substr($route, $position + strlen($needle)), '/');
    }

    /**
     * Extract the endpoint name from a request URI.
     *
     * Handles pretty permalinks (/wp-json/fiveprayer/v1/external/prayer-times),
     * plain permalinks (/?rest_route=/fiveprayer/v1/external/prayer-times), a
     * WordPress install in a subdirectory, and index.php style permalinks.
     *
     * @param string $request_uri Raw REQUEST_URI value.
     * @return string Endpoint name, e.g. "prayer-times".
     */
    private function extract_endpoint(string $request_uri): string
    {
        $path  = (string) wp_parse_url($request_uri, PHP_URL_PATH);
        $query = (string) wp_parse_url($request_uri, PHP_URL_QUERY);

        if ('' !== $query) {
            $args = [];
            wp_parse_str($query, $args);

            if (!empty($args['rest_route']) && is_string($args['rest_route'])) {
                $path = $args['rest_route'];
            }
        }

        $needle = 'fiveprayer/v1/external/';
        $position = strpos($path, $needle);

        if (false === $position) {
            return '';
        }

        return trim(substr($path, $position + strlen($needle)), '/');
    }

    /**
     * Check if an IP address is within a CIDR range.
     *
     * Supports IPv4 and IPv6. Malformed values return false instead of raising
     * a warning or an ArithmeticError (a mask outside 0-32 used to shift by a
     * negative number), which would have turned one mistyped CIDR into a 500
     * for every request using that key.
     */
    private function ip_in_range(string $ip, string $cidr): bool
    {
        $parts = explode('/', $cidr, 2);

        if (2 !== count($parts)) {
            return false;
        }

        list($subnet, $mask) = $parts;

        if (filter_var($ip, FILTER_VALIDATE_IP) === false || filter_var($subnet, FILTER_VALIDATE_IP) === false) {
            return false;
        }

        $packed_ip     = inet_pton($ip);
        $packed_subnet = inet_pton($subnet);

        if (false === $packed_ip || false === $packed_subnet || strlen($packed_ip) !== strlen($packed_subnet)) {
            return false;
        }

        $mask_bits = filter_var(trim($mask), FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 0, 'max_range' => strlen($packed_ip) * 8],
        ]);

        if (false === $mask_bits) {
            return false;
        }

        $whole_bytes    = intdiv($mask_bits, 8);
        $remaining_bits = $mask_bits % 8;

        if (substr($packed_ip, 0, $whole_bytes) !== substr($packed_subnet, 0, $whole_bytes)) {
            return false;
        }

        if (0 === $remaining_bits) {
            return true;
        }

        $mask_byte = chr((0xFF << (8 - $remaining_bits)) & 0xFF);

        return (ord($packed_ip[$whole_bytes]) & ord($mask_byte))
            === (ord($packed_subnet[$whole_bytes]) & ord($mask_byte));
    }
}

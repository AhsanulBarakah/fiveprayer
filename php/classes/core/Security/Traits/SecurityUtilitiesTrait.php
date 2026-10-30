<?php
namespace FivePrayer\Core\Security\Traits;

use FivePrayer\Core\Logging\Logger;
use Exception;

defined('ABSPATH') || exit;

trait SecurityUtilitiesTrait
{
    /**
     * Generate secure random tokens
     */
    public static function generate_secure_token($length = 32) {
        try {
            return bin2hex(random_bytes($length / 2));
        } catch (Exception $e) {
            return wp_generate_password($length, true, true);
        }
    }

    /**
     * Hash sensitive data securely
     */
    public static function hash_sensitive_data($data) {
        return hash('sha256', $data . wp_salt());
    }

    /**
     * Add security headers to HTTP responses
     */
    public static function add_security_headers() {
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Permissions-Policy: geolocation=(), microphone=(), camera=()');
    }

    /**
     * Log security events with additional context
     */
    public static function log_security_event($message, $severity = 'info', $context = []) {
        if (!Logger::isDebugEnabled() && $severity === 'info') {
            return;
        }

        $ip = self::get_client_ip();
        $user_id = get_current_user_id();

        $log_message = "Security - $message";
        if (!empty($context)) {
            $log_message .= ' | Context: ' . json_encode($context);
        }
        $log_message .= " | IP: $ip";
        if ($user_id) {
            $log_message .= " | User: $user_id";
        }

        switch ($severity) {
            case 'error':
                Logger::error($log_message, 'SecurityHelper');
                break;
            case 'warning':
                Logger::warning($log_message, 'SecurityHelper');
                break;
            case 'critical':
                Logger::critical($log_message, 'SecurityHelper');
                break;
            case 'info':
            default:
                Logger::info($log_message, 'SecurityHelper');
                break;
        }
    }

    /**
     * Get the client IP address.
     *
     * Forwarded headers (CF-Connecting-IP, X-Forwarded-For, X-Real-IP) are set
     * by the caller, so trusting them unconditionally let any client choose the
     * address a failed request was attributed to. That defeated API-key
     * brute-force lockouts and allowed locking out an arbitrary third-party IP
     * (and poisoning the usage/audit columns) on demand.
     *
     * The headers are therefore only read when the direct peer is a known proxy:
     *
     * - Cloudflare is detected automatically from its published edge ranges, so
     *   a site behind the Cloudflare proxy needs no configuration at all.
     * - Any other proxy, load balancer or CDN is opted in by the site owner:
     *
     *       add_filter('fiveprayer_trusted_proxy_ips', function () {
     *           return ['203.0.113.0/24']; // e.g. the load balancer's range
     *       });
     *
     * Without either of those only the direct connection address is used, which
     * is already the visitor's address on a site that is not proxied.
     *
     * @return string Client IP address, or 'unknown' when the server did not
     *                report one.
     */
    public static function get_client_ip() {
        $remote = trim((string) fiveprayer_get_server_value('REMOTE_ADDR', ''));

        if ('' === $remote) {
            return 'unknown';
        }

        $trusted_proxies = self::get_trusted_proxies();

        if (empty($trusted_proxies) || !self::is_trusted_proxy($remote, $trusted_proxies)) {
            return $remote;
        }

        // Cloudflare always sends the visitor's address in this header, so it is
        // used as-is when the request arrived through a Cloudflare edge.
        $connecting_ip = trim((string) fiveprayer_get_server_value('HTTP_CF_CONNECTING_IP', ''));

        if ('' !== $connecting_ip && self::is_public_address($connecting_ip)) {
            return $connecting_ip;
        }

        // X-Forwarded-For is a client-controlled chain (client, proxy1, proxy2 …).
        // A proxy appends to it, so the right-most entries are the ones the site
        // can actually verify. Walk it from the right, skip our own proxies, and
        // stop at the first real address: the left-hand prefix is attacker input
        // and would otherwise become the address recorded for the request.
        $forwarded_for = trim((string) fiveprayer_get_server_value('HTTP_X_FORWARDED_FOR', ''));

        if ('' !== $forwarded_for) {
            $hops = array_reverse(explode(',', $forwarded_for));

            foreach ($hops as $hop) {
                $hop = trim($hop);

                if ('' === $hop || self::is_trusted_proxy($hop, $trusted_proxies)) {
                    continue;
                }

                if (self::is_public_address($hop)) {
                    return $hop;
                }
            }
        }

        $real_ip = trim((string) fiveprayer_get_server_value('HTTP_X_REAL_IP', ''));

        if ('' !== $real_ip && self::is_public_address($real_ip)) {
            return $real_ip;
        }

        return $remote;
    }

    /**
     * Collect the proxy addresses whose forwarded headers may be trusted.
     *
     * @return string[] Exact IP addresses and CIDR ranges.
     */
    private static function get_trusted_proxies() {
        $defaults = self::is_cloudflare_trust_enabled() ? self::get_cloudflare_ranges() : [];

        /**
         * Filters the proxy addresses whose forwarded headers may be trusted.
         *
         * Used for proxies that are not Cloudflare (load balancers, reverse
         * proxies, other CDNs). Accepts exact IP addresses and CIDR ranges.
         *
         * @param string[] $trusted_proxies Extra trusted proxy addresses.
         */
        $custom = (array) apply_filters('fiveprayer_trusted_proxy_ips', []);

        $proxies = [];

        foreach (array_merge($defaults, $custom) as $proxy) {
            $proxy = trim((string) $proxy);

            if ('' !== $proxy) {
                $proxies[$proxy] = true;
            }
        }

        return array_keys($proxies);
    }

    /**
     * Whether Cloudflare's edge ranges are trusted automatically.
     *
     * @return bool
     */
    private static function is_cloudflare_trust_enabled() {
        /**
         * Filters whether requests arriving through Cloudflare are attributed to
         * the visitor address in CF-Connecting-IP. Enabled by default.
         *
         * @param bool $enabled Whether to trust Cloudflare's edge ranges.
         */
        return (bool) apply_filters('fiveprayer_trust_cloudflare_proxies', true);
    }

    /**
     * Cloudflare's published edge ranges (https://www.cloudflare.com/ips/).
     *
     * Not declared as a class constant: constants in traits require PHP 8.2 and
     * this plugin still supports PHP 7.4.
     *
     * @return string[]
     */
    private static function get_cloudflare_ranges() {
        return [
            // IPv4
            '173.245.48.0/20',
            '103.21.244.0/22',
            '103.22.200.0/22',
            '103.31.4.0/22',
            '141.101.64.0/18',
            '108.162.192.0/18',
            '190.93.240.0/20',
            '188.114.96.0/20',
            '197.234.240.0/22',
            '198.41.128.0/17',
            '162.158.0.0/15',
            '104.16.0.0/13',
            '104.24.0.0/14',
            '172.64.0.0/13',
            '131.0.72.0/22',
            // IPv6
            '2400:cb00::/32',
            '2606:4700::/32',
            '2803:f800::/32',
            '2405:b500::/32',
            '2405:8100::/32',
            '2a06:98c0::/29',
            '2c0f:f248::/32',
        ];
    }

    /**
     * Whether an address is a routable public address.
     *
     * Private, loopback and reserved values are rejected so a forwarded header
     * cannot supply something like 127.0.0.1 or 10.0.0.1 as the client address.
     *
     * @param string $ip Address to test.
     * @return bool
     */
    private static function is_public_address($ip) {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }

    /**
     * Check whether an address matches the trusted proxy list.
     *
     * @param string   $ip              Address to test.
     * @param string[] $trusted_proxies Exact IPs and/or CIDR ranges.
     * @return bool
     */
    private static function is_trusted_proxy($ip, array $trusted_proxies) {
        if (filter_var($ip, FILTER_VALIDATE_IP) === false) {
            return false;
        }

        $packed_ip = inet_pton($ip);
        if (false === $packed_ip) {
            return false;
        }

        foreach ($trusted_proxies as $trusted) {
            $trusted = trim((string) $trusted);

            if ('' === $trusted) {
                continue;
            }

            if (false === strpos($trusted, '/')) {
                if (filter_var($trusted, FILTER_VALIDATE_IP) !== false && inet_pton($trusted) === $packed_ip) {
                    return true;
                }
                continue;
            }

            list($subnet, $mask) = array_pad(explode('/', $trusted, 2), 2, '');

            if (filter_var($subnet, FILTER_VALIDATE_IP) === false) {
                continue;
            }

            $packed_subnet = inet_pton($subnet);
            if (false === $packed_subnet || strlen($packed_subnet) !== strlen($packed_ip)) {
                continue;
            }

            $mask_bits = filter_var($mask, FILTER_VALIDATE_INT, [
                'options' => ['min_range' => 0, 'max_range' => strlen($packed_subnet) * 8],
            ]);

            if (false === $mask_bits) {
                continue;
            }

            $whole_bytes = intdiv($mask_bits, 8);
            $remaining_bits = $mask_bits % 8;

            if (substr($packed_ip, 0, $whole_bytes) !== substr($packed_subnet, 0, $whole_bytes)) {
                continue;
            }

            if (0 === $remaining_bits) {
                return true;
            }

            $mask_byte = chr((0xFF << (8 - $remaining_bits)) & 0xFF);

            if ((ord($packed_ip[$whole_bytes]) & ord($mask_byte)) === (ord($packed_subnet[$whole_bytes]) & ord($mask_byte))) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if request is coming from a known bot/crawler
     */
    public static function is_bot_request() {
        $user_agent = fiveprayer_get_server_value('HTTP_USER_AGENT');
        $bot_agents = [
            'googlebot', 'bingbot', 'slurp', 'duckduckbot', 'baiduspider',
            'yandexbot', 'facebookexternalhit', 'twitterbot', 'rogerbot',
            'linkedinbot', 'embedly', 'quora link preview', 'showyoubot',
            'outbrain', 'pinterest', 'developers.google.com/+/web/snippet'
        ];

        foreach ($bot_agents as &$bot) {
            if (stripos($user_agent, $bot) !== false) {
                return true;
            }
        }

        return false;
    }
}

<?php
namespace FivePrayer\Core\Security\Traits;

defined('ABSPATH') || exit;

trait RequestValidationTrait
{
    /**
     * Verify nonce with additional security checks
     */
    public static function verify_nonce($nonce, $action) {
        if (!isset($nonce) || !wp_verify_nonce($nonce, $action)) {
            self::log_security_event("Nonce verification failed for action: $action", 'warning');
            wp_send_json_error(['message' => 'Invalid nonce'], 403);
        }
    }

    /**
     * Enhanced rate limiting with IP and user-based limits
     */
    public static function check_rate_limit($ip, $user_id = null) {
        // Check IP-based rate limit
        $ip_key = 'fiveprayer_rate_limit_ip_' . $ip;
        $ip_count = get_transient($ip_key);

        if ($ip_count && $ip_count >= self::MAX_REQUESTS) {
            self::log_security_event("Rate limit exceeded for IP: $ip", 'warning');
            wp_send_json_error([
                'message' => 'Too many requests. Please try again later.'
            ], 429);
        }

        // Check user-based rate limit if user ID is provided
        if ($user_id) {
            $user_key = 'fiveprayer_rate_limit_user_' . $user_id;
            $user_count = get_transient($user_key);

            if ($user_count && $user_count >= (self::MAX_REQUESTS * 2)) { // Higher limit for logged-in users
                self::log_security_event("Rate limit exceeded for user: $user_id", 'warning');
                wp_send_json_error([
                    'message' => 'Too many requests. Please try again later.'
                ], 429);
            }
        }

        // Increment counters
        $current_ip_count = $ip_count ? $ip_count + 1 : 1;
        set_transient($ip_key, $current_ip_count, self::RATE_LIMIT_WINDOW);

        if ($user_id) {
            $current_user_count = $user_count ? $user_count + 1 : 1;
            set_transient($user_key, $current_user_count, self::RATE_LIMIT_WINDOW);
        }
    }

    /**
     * Enhanced request validation with multiple HTTP methods support
     */
    public static function validate_request($required_fields = [], $method = 'POST') {
        $errors = [];
        $source = [];

        if (strtoupper($method) === 'POST') {
            $request_values = filter_input_array(INPUT_POST);
            if (is_array($request_values)) {
                foreach ($request_values as $key => $value) {
                    $source[sanitize_text_field($key)] = is_array($value)
                        ? array_map('sanitize_text_field', wp_unslash($value))
                        : sanitize_text_field(wp_unslash($value));
                }
            }
        } elseif (strtoupper($method) === 'GET') {
            $request_values = filter_input_array(INPUT_GET);
            if (is_array($request_values)) {
                foreach ($request_values as $key => $value) {
                    $source[sanitize_text_field($key)] = is_array($value)
                        ? array_map('sanitize_text_field', wp_unslash($value))
                        : sanitize_text_field(wp_unslash($value));
                }
            }
        } elseif (strtoupper($method) === 'PUT' || strtoupper($method) === 'DELETE') {
            parse_str(file_get_contents('php://input'), $input_data);
            foreach ($input_data as $key => $value) {
                $source[sanitize_text_field($key)] = is_array($value)
                    ? array_map('sanitize_text_field', $value)
                    : sanitize_text_field(wp_unslash($value));
            }
        }

        foreach ($required_fields as &$field) {
            if (!isset($source[$field]) || empty(trim($source[$field]))) {
                $errors[] = "Missing required field: $field";
            }
        }

        if (!empty($errors)) {
            self::log_security_event("Request validation failed: " . implode(', ', $errors), 'warning');
            wp_send_json_error([
                'message' => 'Invalid request',
                'errors'  => $errors
            ], 400);
        }
    }

    /**
     * Check whether a GET parameter is present.
     *
     * Used for read-only feature detection (page-builder preview flags), where
     * the parameter only selects how a page is rendered and changes no state,
     * so a nonce would be meaningless.
     */
    public static function has_query_arg($key): bool {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only presence check, no state is changed.
        return isset($_GET[$key]);
    }

    /**
     * Check whether a POST parameter is present without reading its value.
     *
     * Callers that act on the value must verify a nonce first; this only keeps
     * the raw superglobal out of call sites that merely branch on presence.
     */
    public static function has_post_arg($key): bool {
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Presence-only check; callers verify a nonce before acting.
        return isset($_POST[$key]);
    }

    /**
     * Read an array-valued POST field with every element unslashed and sanitized.
     *
     * @param string $key Field name.
     * @return string[] Sanitized values, or an empty array when the field is missing.
     */
    public static function get_sanitized_post_array($key): array {
        $values = filter_input(INPUT_POST, $key, FILTER_DEFAULT, FILTER_REQUIRE_ARRAY);

        return is_array($values) ? array_map('sanitize_text_field', wp_unslash($values)) : [];
    }

    /**
     * Safely get input from GET request with sanitization
     */
    public static function get_sanitized_get_input($key, $default = '', $sanitize_callback = 'sanitize_text_field') {
        $value = filter_input(INPUT_GET, $key, FILTER_SANITIZE_FULL_SPECIAL_CHARS) ?: $default;
        return is_callable($sanitize_callback) ? call_user_func($sanitize_callback, $value) : $value;
    }

    /**
     * Safely get input from POST request with sanitization
     */
    public static function get_sanitized_post_input($key, $default = '', $sanitize_callback = 'sanitize_text_field') {
        $value = filter_input(INPUT_POST, $key, FILTER_SANITIZE_FULL_SPECIAL_CHARS) ?: $default;
        return is_callable($sanitize_callback) ? call_user_func($sanitize_callback, $value) : $value;
    }

    /**
     * Safely get input from REQUEST (both GET and POST) with sanitization
     */
    public static function get_sanitized_request_input($key, $default = '', $sanitize_callback = 'sanitize_text_field') {
        $value = filter_input(INPUT_GET, $key, FILTER_SANITIZE_FULL_SPECIAL_CHARS) ?:
                 filter_input(INPUT_POST, $key, FILTER_SANITIZE_FULL_SPECIAL_CHARS) ?: $default;
        return is_callable($sanitize_callback) ? call_user_func($sanitize_callback, $value) : $value;
    }
}

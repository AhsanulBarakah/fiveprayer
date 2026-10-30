<?php
namespace FivePrayer\Core\Security\Traits;

use Exception;

defined('ABSPATH') || exit;

trait InputSanitizationTrait
{
    /**
     * Validate prayer name with enhanced security
     */
    public static function validate_prayer_name($name) {
        if (empty($name)) {
            throw new Exception('Prayer name cannot be empty');
        }

        if (strlen($name) > 255) {
            throw new Exception('Prayer name too long (max 255 characters)');
        }

        if (!preg_match('/^[\p{L}\p{N}\s\'\"-]+$/u', $name)) {
            throw new Exception('Invalid prayer name format');
        }

        $forbidden_patterns = [
            '/<script/i',
            '/javascript:/i',
            '/vbscript:/i',
            '/onload=/i',
            '/onerror=/i',
            '/<iframe/i',
            '/<object/i',
            '/<embed/i',
        ];

        foreach ($forbidden_patterns as &$pattern) {
            if (preg_match($pattern, $name)) {
                throw new Exception('Prayer name contains forbidden content');
            }
        }
    }

    /**
     * Enhanced input validation with multiple security layers
     */
    public static function validate_input($input, $allow_empty = false, $max_length = 1000) {
        if (is_null($input)) {
            throw new Exception('Input cannot be null');
        }

        if (is_array($input)) {
            foreach ($input as $key => $value) {
                if (empty($key)) {
                    throw new Exception('Array key cannot be empty');
                }
                if (is_string($key) && !preg_match('/^[a-zA-Z0-9_-]+$/', $key)) {
                    throw new Exception(esc_html('Invalid array key format: ' . $key));
                }
                self::validate_input($value, $allow_empty, $max_length);
            }
            return;
        }

        if (is_string($input)) {
            if (!$allow_empty && empty(trim($input))) {
                throw new Exception('String input cannot be empty');
            }

            if (strlen($input) > $max_length) {
                throw new Exception(esc_html("Input too long (max $max_length characters)"));
            }

            $sql_injection_patterns = [
                '/(union|select|insert|delete|update|drop|create|alter|exec|execute)\s+/i',
                '/(\'|\")\s*(--|#|\/\*|\*\/)/',
                '/(or|and)\s+[0-9]+\s*=\s*[0-9]+/i',
            ];

            foreach ($sql_injection_patterns as &$pattern) {
                if (preg_match($pattern, $input)) {
                    throw new Exception('Input contains potential SQL injection attempt');
                }
            }

            $xss_patterns = [
                '/<script/i',
                '/javascript:/i',
                '/vbscript:/i',
                '/onload=/i',
                '/onerror=/i',
                '/<iframe/i',
                '/<object/i',
                '/<embed/i',
                '/<svg/i',
                '/<img[^>]*onerror/i',
            ];

            foreach ($xss_patterns as &$pattern) {
                if (preg_match($pattern, $input)) {
                    throw new Exception('Input contains potential XSS attempt');
                }
            }

            return;
        }

        if (is_numeric($input)) {
            if (is_float($input) && !is_finite($input)) {
                throw new Exception('Invalid numeric value');
            }
            return;
        }

        if (is_bool($input)) {
            return;
        }

        throw new Exception('Invalid input type');
    }

    /**
     * Enhanced sanitization with multiple security layers
     */
    public static function sanitize_input($input, $allowed_tags = '') {
        if (is_array($input)) {
            return array_map(function($item) use ($allowed_tags) {
                return self::sanitize_input($item, $allowed_tags);
            }, $input);
        }

        if (is_string($input)) {
            if (preg_match('/^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$/', $input)) {
                return $input;
            }
            if (preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/', $input)) {
                return $input;
            }

            if (!empty($allowed_tags)) {
                $input = wp_kses($input, $allowed_tags);
            } else {
                $input = sanitize_text_field($input);
            }

            $input = str_replace(['<', '>', '"', "'", '&'], ['&lt;', '&gt;', '&quot;', '&#x27;', '&amp;'], $input);

            return $input;
        }

        if (is_numeric($input)) {
            return $input;
        }

        if (is_bool($input)) {
            return $input;
        }

        return $input;
    }

    /**
     * Enhanced text sanitization with XSS protection
     */
    public static function sanitize_text($text, $allow_empty = false, $allowed_tags = '') {
        if (is_null($text)) {
            return '';
        }

        if (is_array($text)) {
            return array_map(function($item) use ($allow_empty, $allowed_tags) {
                return self::sanitize_text($item, $allow_empty, $allowed_tags);
            }, $text);
        }

        if (is_string($text)) {
            if ($allow_empty && empty($text)) {
                return '';
            }

            if (!empty($allowed_tags)) {
                $text = wp_kses($text, $allowed_tags);
            } else {
                $text = esc_html($text);
            }

            return $text;
        }

        return '';
    }

    /**
     * Enhanced time sanitization
     */
    public static function sanitize_time($time) {
        if (empty($time)) {
            return '';
        }

        if (preg_match('/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/', $time)) {
            return $time;
        }

        return '';
    }

    /**
     * Enhanced date sanitization
     */
    public static function sanitize_date($date) {
        if (empty($date)) {
            return '';
        }

        if (preg_match('/^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$/', $date)) {
            $timestamp = strtotime($date);
            if ($timestamp !== false && $timestamp != -1) {
                return $date;
            }
        }

        return '';
    }

    /**
     * Validate and sanitize email addresses
     */
    public static function validate_email($email) {
        if (empty($email)) {
            throw new Exception('Email cannot be empty');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new Exception('Invalid email format');
        }

        return sanitize_email($email);
    }

    /**
     * Validate password strength
     */
    public static function validate_password_strength($password) {
        if (empty($password)) {
            throw new Exception('Password cannot be empty');
        }

        if (strlen($password) < 8) {
            throw new Exception('Password must be at least 8 characters long');
        }

        if (!preg_match('/[A-Z]/', $password)) {
            throw new Exception('Password must contain at least one uppercase letter');
        }

        if (!preg_match('/[a-z]/', $password)) {
            throw new Exception('Password must contain at least one lowercase letter');
        }

        if (!preg_match('/[0-9]/', $password)) {
            throw new Exception('Password must contain at least one number');
        }

        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            throw new Exception('Password must contain at least one special character');
        }
    }

    /**
     * Validate file uploads for security
     */
    public static function validate_file_upload($file) {
        if (!isset($file['tmp_name']) || !isset($file['name']) || !isset($file['size'])) {
            throw new Exception('Invalid file upload');
        }

        if ($file['size'] > self::MAX_FILE_SIZE) {
            throw new Exception(esc_html('File size exceeds maximum allowed size (' . (self::MAX_FILE_SIZE / 1024 / 1024) . 'MB)'));
        }

        $file_extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($file_extension, self::ALLOWED_FILE_TYPES)) {
            throw new Exception(esc_html('File type not allowed. Allowed types: ' . implode(', ', self::ALLOWED_FILE_TYPES)));
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $safe_mime_types = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
            'application/pdf', 'text/plain'
        ];

        if (!in_array($mime_type, $safe_mime_types)) {
            throw new Exception('File type not allowed based on content inspection');
        }

        $file_content = file_get_contents($file['tmp_name']);
        $forbidden_patterns = [
            '/<\?php/i',
            '/<\?=/i',
            '/<script/i',
            '/javascript:/i',
        ];

        foreach ($forbidden_patterns as &$pattern) {
            if (preg_match($pattern, $file_content)) {
                throw new Exception('File contains potentially dangerous content');
            }
        }
    }
}

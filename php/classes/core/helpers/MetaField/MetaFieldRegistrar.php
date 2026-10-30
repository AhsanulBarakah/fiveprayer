<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Logging\Logger;

/**
 * Meta Field Registrar - Handles all meta field registration and management
 */
class MetaFieldRegistrar {
    private SecurityHelper $security_helper;

    public function __construct() {
        $this->security_helper = new SecurityHelper();
    }

    /**
     * Register all meta fields based on the ShortCodeMap with security validation
     */
    public function register_meta_fields(): void {
        try {
            // Register meta fields for posts
            $this->register_secure_post_meta_fields();

            // Register meta fields for pages
            $this->register_secure_page_meta_fields();

            // Register meta fields for other post types if needed
            $this->register_secure_other_post_type_meta_fields();
        } catch (\Exception $e) {
            Logger::error('Error registering meta fields: ' . $e->getMessage(), 'MetaFieldRegistrar');
            SecurityHelper::log_security_event('Meta field registration failed: ' . $e->getMessage(), 'error');
        }
    }

    /**
     * Register meta fields for posts with security
     */
    private function register_secure_post_meta_fields(): void {
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $meta_key = 'fp_' . SecurityHelper::sanitize_input($field_key);

            register_meta(
                'post',
                $meta_key,
                [
                    'type' => 'string',
                    'description' => SecurityHelper::sanitize_text('Meta field for ' . $shortcode . ' shortcode'),
                    'single' => true,
                    'show_in_rest' => true,
                    'sanitize_callback' => [$this, 'secure_sanitize_meta_value'],
                    'auth_callback' => [$this, 'secure_auth_callback'],
                ]
            );
        }
    }

    /**
     * Register meta fields for pages with security
     */
    private function register_secure_page_meta_fields(): void {
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $meta_key = 'fp_' . SecurityHelper::sanitize_input($field_key);

            register_meta(
                'page',
                $meta_key,
                [
                    'type' => 'string',
                    'description' => SecurityHelper::sanitize_text('Meta field for ' . $shortcode . ' shortcode'),
                    'single' => true,
                    'show_in_rest' => true,
                    'sanitize_callback' => [$this, 'secure_sanitize_meta_value'],
                    'auth_callback' => [$this, 'secure_auth_callback'],
                ]
            );
        }
    }

    /**
     * Register meta fields for other post types with security
     */
    private function register_secure_other_post_type_meta_fields(): void {
        // Get all public post types with security validation
        $post_types = get_post_types(['public' => true], 'names');

        // Remove 'post' and 'page' as they are already handled
        unset($post_types['post']);
        unset($post_types['page']);

        foreach ($post_types as &$post_type) {
            // Validate post type name
            $post_type = SecurityHelper::sanitize_input($post_type);

            foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
                $meta_key = 'fp_' . SecurityHelper::sanitize_input($field_key);

                register_meta(
                    $post_type,
                    $meta_key,
                    [
                        'type' => 'string',
                        'description' => SecurityHelper::sanitize_text('Meta field for ' . $shortcode . ' shortcode'),
                        'single' => true,
                        'show_in_rest' => true,
                        'sanitize_callback' => [$this, 'secure_sanitize_meta_value'],
                        'auth_callback' => [$this, 'secure_auth_callback'],
                    ]
                );
            }
        }
    }

    /**
     * Secure sanitize meta value
     */
    public function secure_sanitize_meta_value($value): string {
        try {
            return SecurityHelper::sanitize_text($value, true, []);
        } catch (\Exception $e) {
            Logger::error('Error sanitizing meta value: ' . $e->getMessage(), 'MetaFieldRegistrar');
            return '';
        }
    }

    /**
     * Secure authentication callback for meta fields
     */
    public function secure_auth_callback($allowed, $meta_key, $post_id, $user_id, $cap, $caps): bool {
        try {
            // Validate inputs
            $meta_key = SecurityHelper::sanitize_input($meta_key);
            $post_id = intval($post_id);
            $user_id = intval($user_id);

            if ($post_id <= 0 || $user_id <= 0) {
                SecurityHelper::log_security_event("Invalid post_id or user_id in auth callback: post_id=$post_id, user_id=$user_id", 'warning');
                return false;
            }

            return current_user_can('edit_post', $post_id);
        } catch (\Exception $e) {
            Logger::error('Error in auth callback: ' . $e->getMessage(), 'MetaFieldRegistrar');
            SecurityHelper::log_security_event('Auth callback error: ' . $e->getMessage(), 'error');
            return false;
        }
    }

    /**
     * Get all available meta field keys
     */
    public static function get_all_meta_field_keys(): array {
        $keys = [];
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $keys[] = 'fp_' . $field_key;
        }
        return $keys;
    }

    /**
     * Get all available shortcode to meta key mappings
     */
    public static function get_shortcode_meta_mapping(): array {
        $mapping = [];
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $mapping[$shortcode] = 'fp_' . $field_key;
        }
        return $mapping;
    }

    /**
     * Update meta field value with security
     */
    public static function update_meta_field_value(int $post_id, string $field_key, string $value): bool {
        try {
            $security_helper = new SecurityHelper();

            // Validate inputs
            $post_id = intval($post_id);
            $field_key = $security_helper::sanitize_input($field_key);
            $value = $security_helper::sanitize_text($value, true, []);

            if ($post_id <= 0) {
                $security_helper::log_security_event("Invalid post_id in update_meta_field_value: $post_id", 'warning');
                return false;
            }

            $meta_key = 'fp_' . $field_key;
            return update_post_meta($post_id, $meta_key, $value);
        } catch (\Exception $e) {
            Logger::error('Error updating meta field value: ' . $e->getMessage(), 'MetaFieldRegistrar');
            return false;
        }
    }

    /**
     * Get meta field value with security
     */
    public static function get_meta_field_value_static(int $post_id, string $field_key): string {
        try {
            $security_helper = new SecurityHelper();

            // Validate inputs
            $post_id = intval($post_id);
            $field_key = $security_helper::sanitize_input($field_key);

            if ($post_id <= 0) {
                $security_helper::log_security_event("Invalid post_id in get_meta_field_value_static: $post_id", 'warning');
                return '';
            }

            $meta_key = 'fp_' . $field_key;
            $value = get_post_meta($post_id, $meta_key, true);
            return $security_helper::sanitize_text($value, true, []);
        } catch (\Exception $e) {
            Logger::error('Error getting meta field value: ' . $e->getMessage(), 'MetaFieldRegistrar');
            return '';
        }
    }
}

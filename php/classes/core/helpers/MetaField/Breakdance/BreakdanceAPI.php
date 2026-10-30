<?php
namespace FivePrayer\Core\Helpers\MetaField\Breakdance;

if (!defined('ABSPATH')) {
    exit;
}

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Logging\Logger;

/**
 * Breakdance API Handler - Handles AJAX requests for dynamic field values
 */
class BreakdanceAPI {

    /**
     * AJAX handler to get dynamic field value for Breakdance
     */
    public static function ajax_get_dynamic_field_value(): void {
        // Verify nonce
        $nonce = sanitize_text_field(wp_unslash($_POST['nonce'] ?? ''));
        if (!wp_verify_nonce($nonce, 'fiveprayer_dynamic_field_nonce')) {
            wp_die('Security check failed');
        }

        $post_id   = absint(SecurityHelper::get_sanitized_post_input('post_id', 0, 'absint'));
        $field_key = SecurityHelper::get_sanitized_post_input('field_key');

        // Validate field key against allowed values to prevent injection
        $allowed_fields = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
        if (!in_array($field_key, $allowed_fields, true)) {
            wp_send_json_error('Invalid field key');
            return;
        }

        // Validate post ID
        if ($post_id <= 0) {
            wp_send_json_error('Invalid post ID');
            return;
        }

        $meta_key = 'fp_' . $field_key;
        $meta_value = get_post_meta($post_id, $meta_key, true);

        // If no custom value is set, get the default value
        if (empty($meta_value)) {
            // Get the corresponding shortcode for this field key
            $shortcode_map = ShortCodeMap::ACTIVE_SHORTCODES;

            $shortcode = null;
            foreach ($shortcode_map as $sc => $mapped_field_key) {
                if ($mapped_field_key === $field_key) {
                    $shortcode = $sc;
                    break;
                }
            }

            if ($shortcode) {
                // Use do_shortcode to get the actual value from the shortcode
                $meta_value = do_shortcode('[' . $shortcode . ']');
            } else {
                // Fallback to the default prayer time method if no shortcode found
                $generator = new \FivePrayer\Core\Helpers\MetaFieldGenerator();
                $meta_value = $generator->get_default_prayer_time_public($field_key);
            }
        }

        wp_send_json_success($meta_value);
    }
    
    /**
     * Register AJAX actions for Breakdance
     */
    public static function register_ajax_handlers(): void {
        // Register AJAX action for logged-in users
        add_action('wp_ajax_fiveprayer_get_dynamic_field_value', [self::class, 'ajax_get_dynamic_field_value']);
        
        // Register AJAX action for non-logged-in users (if needed)
        add_action('wp_ajax_nopriv_fiveprayer_get_dynamic_field_value', [self::class, 'ajax_get_dynamic_field_value']);
    }
}
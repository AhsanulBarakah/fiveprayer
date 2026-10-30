<?php

namespace FivePrayer\Core\Helpers\MetaField\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Logging\Logger;

trait PatternRegistrationTrait
{
    /**
     * Register dynamic text patterns for live render support with security
     */
    public function register_dynamic_text_patterns(): void
    {
        try {
            add_filter('the_content', [$this, 'parse_secure_meta_field_patterns'], 20);
            add_filter('widget_text', [$this, 'parse_secure_meta_field_patterns'], 20);
            add_filter('the_excerpt', [$this, 'parse_secure_meta_field_patterns'], 20);

            add_filter('fiveprayer_dynamic_text_patterns', [$this, 'add_secure_shortcode_meta_patterns']);
        } catch (\Exception $e) {
            Logger::error('Error registering dynamic text patterns: ' . $e->getMessage(), 'DynamicTextHandler');
        }
    }

    /**
     * Parse meta field patterns in content with security
     */
    public function parse_secure_meta_field_patterns(string $content): string
    {
        try {
            $pattern = '/\{fp_([a-zA-Z_0-9]+)\}/';
            return preg_replace_callback($pattern, [$this, 'replace_secure_meta_field_pattern'], $content);
        } catch (\Exception $e) {
            Logger::error('Error parsing meta field patterns: ' . $e->getMessage(), 'DynamicTextHandler');
            return $content;
        }
    }

    /**
     * Replace meta field pattern with secure content
     */
    private function replace_secure_meta_field_pattern(array $matches): string
    {
        try {
            $full_match = SecurityHelper::sanitize_input($matches[0]);
            $field_key = SecurityHelper::sanitize_input($matches[1]);

            $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);

            if (in_array($field_key, $valid_field_keys, true)) {
                $value = $this->get_secure_meta_field_value($field_key);

                if ($this->is_secure_editor_context()) {
                    return '<span class="fiveprayer-meta-field fiveprayer-meta-field-' . esc_attr($field_key) . '" data-fiveprayer-field="' . esc_attr($field_key) . '" data-original-pattern="' . esc_attr($full_match) . '">' . $value . '</span>';
                }

                return $value;
            }

            return $full_match;
        } catch (\Exception $e) {
            Logger::error('Error replacing meta field pattern: ' . $e->getMessage(), 'DynamicTextHandler');
            return $matches[0];
        }
    }

    /**
     * Check if we're in an editor context with security validation
     */
    private function is_secure_editor_context(): bool
    {
        try {
            if (defined('ELEMENTOR_VERSION') && SecurityHelper::has_query_arg('elementor-preview')) {
                return true;
            }

            if (defined('FL_BUILDER_VERSION') && (SecurityHelper::has_query_arg('fl_builder') || SecurityHelper::has_query_arg('fl_builder_preview'))) {
                return true;
            }

            if (defined('ET_BUILDER_VERSION') && (SecurityHelper::has_query_arg('et_fb') || SecurityHelper::has_query_arg('et_preview'))) {
                return true;
            }

            if (defined('BRZ_VERSION') && (SecurityHelper::has_query_arg('brizy-edit') || SecurityHelper::has_query_arg('brizy-preview'))) {
                return true;
            }

            if (defined('VCV_VERSION') && (SecurityHelper::has_query_arg('vcv-editor') || SecurityHelper::has_query_arg('vcv-preview'))) {
                return true;
            }

            if (is_customize_preview()) {
                return true;
            }

            if (is_admin() && function_exists('get_current_screen')) {
                $screen = get_current_screen();
                if ($screen && $screen->base === 'post' && $screen->is_block_editor) {
                    return true;
                }
            }

            if (is_admin() && function_exists('get_current_screen')) {
                $screen = get_current_screen();
                if ($screen && $screen->base === 'post') {
                    return true;
                }
            }

            return false;
        } catch (\Exception $e) {
            Logger::error('Error checking editor context: ' . $e->getMessage(), 'DynamicTextHandler');
            return false;
        }
    }

    /**
     * Add shortcode meta patterns to dynamic text parser with security
     */
    public function add_secure_shortcode_meta_patterns($patterns): array
    {
        try {
            foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
                $meta_key = 'fp_' . SecurityHelper::sanitize_input($field_key);

                $patterns['{' . $meta_key . '}'] = function() use ($field_key) {
                    return $this->get_secure_meta_field_value($field_key);
                };
            }

            return $patterns;
        } catch (\Exception $e) {
            Logger::error('Error adding shortcode meta patterns: ' . $e->getMessage(), 'DynamicTextHandler');
            return $patterns;
        }
    }

    /**
     * Get meta field value for the current post with security
     */
    private function get_secure_meta_field_value(string $field_key): string
    {
        try {
            $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
            if (!in_array($field_key, $valid_field_keys, true)) {
                SecurityHelper::log_security_event("Invalid field key in get_secure_meta_field_value: $field_key", 'warning');
                return '';
            }

            $post_id = get_the_ID();
            if (!$post_id) {
                return $this->get_secure_default_prayer_time($field_key);
            }

            $meta_key = 'fp_' . SecurityHelper::sanitize_input($field_key);
            $meta_value = get_post_meta($post_id, $meta_key, true);

            if (empty($meta_value)) {
                return $this->get_secure_default_prayer_time($field_key);
            }

            return SecurityHelper::sanitize_text($meta_value, true, []);
        } catch (\Exception $e) {
            Logger::error('Error getting secure meta field value: ' . $e->getMessage(), 'DynamicTextHandler');
            return '';
        }
    }

    /**
     * Get default prayer time based on field key with security
     */
    public function get_secure_default_prayer_time(string $field_key): string
    {
        try {
            $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
            if (!in_array($field_key, $valid_field_keys, true)) {
                SecurityHelper::log_security_event("Invalid field key in get_secure_default_prayer_time: $field_key", 'warning');
                return '';
            }

            $shortcode_map = ShortCodeMap::ACTIVE_SHORTCODES;

            $shortcode = null;
            foreach ($shortcode_map as $sc => $mapped_field_key) {
                if ($mapped_field_key === $field_key) {
                    $shortcode = SecurityHelper::sanitize_input($sc);
                    break;
                }
            }

            if ($shortcode) {
                $shortcode_output = do_shortcode('[' . $shortcode . ']');
                $clean_output = SecurityHelper::sanitize_text($shortcode_output, true, []);
                return $clean_output;
            }

            $today_date = current_time('Y-m-d');
            $today_prayer_times = \FivePrayer\Core\Cache\PrayerDataCache::getTodaysPrayerTimes($today_date);

            if (!$today_prayer_times) {
                return '';
            }

            if (isset($today_prayer_times->$field_key)) {
                return SecurityHelper::sanitize_text($today_prayer_times->$field_key, true, []);
            }

            return '';
        } catch (\Exception $e) {
            Logger::error('Error getting secure default prayer time: ' . $e->getMessage(), 'DynamicTextHandler');
            return '';
        }
    }

    /**
     * Validate post ID for security
     */
    protected function validate_post_id($post_id): bool
    {
        if (empty($post_id) || !is_numeric($post_id)) {
            return false;
        }

        $post_id = intval($post_id);
        if ($post_id <= 0) {
            return false;
        }

        $post = get_post($post_id);
        if (!$post || $post->post_status !== 'publish') {
            return false;
        }

        return true;
    }
}

<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Security\SecurityHelper;

/**
 * Main Meta Field Generator - Orchestrates all meta field functionality
 * Delegates to specialized components for cleaner separation of concerns
 */
class MetaFieldGenerator {
    private MetaFieldRegistrar $meta_field_registrar;
    private DynamicTextHandler $dynamic_text_handler;
    private PageBuilderCompat $page_builder_compat;

    public function __construct() {
        try {
            $this->meta_field_registrar = new MetaFieldRegistrar();
            require_once __DIR__ . '/MetaField/DynamicTextHandler.php';
            $this->dynamic_text_handler = new DynamicTextHandler();

            // Only include Elementor-related files if Elementor is installed and active
            if (defined('ELEMENTOR_VERSION') && class_exists('\Elementor\Core\DynamicTags\Manager')) {
                require_once __DIR__ . '/MetaField/Elementor/BaseDynamicTag.php';
                require_once __DIR__ . '/MetaField/Elementor/DynamicTags/AbstractFieldTag.php';

                $dynamic_tags_dir = __DIR__ . '/MetaField/Elementor/DynamicTags';
                if (is_dir($dynamic_tags_dir)) {
                    $tag_files = glob($dynamic_tags_dir . '/*.php') ?: [];
                    sort($tag_files);
                    foreach ($tag_files as $tag_file) {
                        if (basename($tag_file) === 'AbstractFieldTag.php') {
                            continue;
                        }
                        require_once $tag_file;
                    }
                }

                require_once __DIR__ . '/MetaField/Elementor/FivePrayerElementorDynamicTags.php';
                $this->page_builder_compat = new PageBuilderCompat();
            } else {
                $this->page_builder_compat = null;
            }
        } catch (\Exception $e) {
            // Log error but create empty instances to prevent fatal errors
            if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                \FivePrayer\Core\Logging\Logger::error('Error in MetaFieldGenerator constructor: ' . $e->getMessage(), 'MetaFieldGenerator');
            }
            // Create minimal instances or null to prevent crashes
            $this->meta_field_registrar = null;
            $this->dynamic_text_handler = null;
            $this->page_builder_compat = null;
        }
    }

    /**
     * Initialize the meta field generation system
     */
    public function init(): void {
        try {
            add_action('init', [$this, 'register_meta_fields']);
            add_action('init', [$this, 'register_dynamic_text_patterns']);

            // Only register Elementor dynamic tags if Elementor is installed and active
            if (defined('ELEMENTOR_VERSION') && class_exists('\Elementor\Core\DynamicTags\Manager')) {
                add_action('elementor/dynamic_tags/register', [$this, 'register_elementor_tags']);
            }

            // Initialize Breakdance compatibility
            $breakdance_compat = new \FivePrayer\Core\Helpers\MetaField\BreakdanceCompatManager();
            $breakdance_compat->init();
        } catch (\Exception $e) {
            Logger::error('Error initializing MetaFieldGenerator: ' . $e->getMessage(), 'MetaFieldGenerator');
            SecurityHelper::log_security_event('MetaFieldGenerator initialization failed: ' . $e->getMessage(), 'error');
        }
    }

    /**
     * Register all meta fields by delegating to MetaFieldRegistrar
     */
    public function register_meta_fields(): void {
        try {
            if ($this->meta_field_registrar) {
                $this->meta_field_registrar->register_meta_fields();
            }
            if ($this->page_builder_compat) {
                $this->page_builder_compat->add_secure_acf_compatibility();
            }
        } catch (\Exception $e) {
            if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                \FivePrayer\Core\Logging\Logger::error('Error registering meta fields: ' . $e->getMessage(), 'MetaFieldGenerator');
            }
            if (class_exists('\FivePrayer\Core\Security\SecurityHelper')) {
                \FivePrayer\Core\Security\SecurityHelper::log_security_event('Meta field registration failed: ' . $e->getMessage(), 'error');
            }
        }
    }

    /**
     * Register dynamic text patterns by delegating to DynamicTextHandler
     */
    public function register_dynamic_text_patterns(): void {
        if ($this->dynamic_text_handler) {
            try {
                $this->dynamic_text_handler->register_dynamic_text_patterns();
            } catch (\Exception $e) {
                if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                    \FivePrayer\Core\Logging\Logger::error('Error registering dynamic text patterns: ' . $e->getMessage(), 'MetaFieldGenerator');
                }
            }
        }
    }

    /**
     * Register Elementor dynamic tags by delegating to PageBuilderCompat
     */
    public function register_elementor_tags($dynamic_tags): void {
        if ($this->page_builder_compat) {
            try {
                $this->page_builder_compat->register_elementor_tags($dynamic_tags);
            } catch (\Exception $e) {
                if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                    \FivePrayer\Core\Logging\Logger::error('Error registering Elementor tags: ' . $e->getMessage(), 'MetaFieldGenerator');
                }
            }
        }
    }

    /**
     * Static methods for backward compatibility - delegate to MetaFieldRegistrar
     */

    /**
     * Get all available meta field keys
     */
    public static function get_all_meta_field_keys(): array {
        return MetaFieldRegistrar::get_all_meta_field_keys();
    }

    /**
     * Get all available shortcode to meta key mappings
     */
    public static function get_shortcode_meta_mapping(): array {
        return MetaFieldRegistrar::get_shortcode_meta_mapping();
    }

    /**
     * Update meta field value with security
     */
    public static function update_meta_field_value(int $post_id, string $field_key, string $value): bool {
        return MetaFieldRegistrar::update_meta_field_value($post_id, $field_key, $value);
    }

    /**
     * Get meta field value with security
     */
    public static function get_meta_field_value_static(int $post_id, string $field_key): string {
        return MetaFieldRegistrar::get_meta_field_value_static($post_id, $field_key);
    }

    /**
     * Get default prayer time by field key - Public method for external access
     */
    public function get_default_prayer_time_public(string $field_key): string {
        if ($this->dynamic_text_handler) {
            try {
                return $this->dynamic_text_handler->get_secure_default_prayer_time($field_key);
            } catch (\Exception $e) {
                if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                    \FivePrayer\Core\Logging\Logger::error('Error getting default prayer time: ' . $e->getMessage(), 'MetaFieldGenerator');
                }
                return '';
            }
        }
        return '';
    }
}
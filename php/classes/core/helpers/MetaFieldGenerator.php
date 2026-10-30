<?php

namespace FivePrayer\Core\Helpers;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Cache\PrayerDataCache;
use FivePrayer\Core\Security\SecurityHelper;

use FivePrayer\Core\Helpers\Traits\MetaFieldRegistrationTrait;
use FivePrayer\Core\Helpers\Traits\AcfCompatibilityTrait;
use FivePrayer\Core\Helpers\Traits\EditorContextTrait;

require_once __DIR__ . '/MetaField/MetaFieldRegistrar.php';
require_once __DIR__ . '/MetaField/DynamicTextHandler.php';

if (defined('ELEMENTOR_VERSION') && class_exists('\Elementor\Core\DynamicTags\Manager')) {
    require_once __DIR__ . '/MetaField/BaseFivePrayerDynamicTag.php';
    require_once __DIR__ . '/MetaField/FivePrayerDynamicTags.php';
    require_once __DIR__ . '/MetaField/PageBuilderCompat.php';
}

require_once __DIR__ . '/MetaField/BreakdanceCompatManager.php';

class MetaFieldGenerator {
    use MetaFieldRegistrationTrait;
    use AcfCompatibilityTrait;
    use EditorContextTrait;

    public function init(): void {
        try {
            add_action('init', [$this, 'register_meta_fields']);
            add_action('init', [$this, 'register_dynamic_text_patterns']);

            if (defined('ELEMENTOR_VERSION') && class_exists('\Elementor\Core\DynamicTags\Manager')) {
                add_action('elementor/dynamic_tags/register', [$this, 'register_elementor_tags']);
            }

            $breakdance_compat = new \FivePrayer\Core\Helpers\MetaField\BreakdanceCompatManager();
            $breakdance_compat->init();
        } catch (\Exception $e) {
            if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                \FivePrayer\Core\Logging\Logger::error('MetaFieldGenerator init failed: ' . $e->getMessage(), 'MetaFieldGenerator');
            }
        }
    }

    public function register_meta_fields(): void {
        try {
            $this->registerPostMetaFields();
            $this->registerPageMetaFields();
            $this->registerOtherPostTypeMetaFields();
            $this->addAcfCompatibility();
        } catch (\Exception $e) {
            if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                \FivePrayer\Core\Logging\Logger::error('MetaFieldGenerator register_meta_fields failed: ' . $e->getMessage(), 'MetaFieldGenerator');
            }
        }
    }

    public function sanitize_meta_value($value): string {
        return sanitize_text_field($value);
    }

    public function auth_callback($allowed, $meta_key, $post_id, $user_id, $cap, $caps): bool {
        return current_user_can('edit_post', $post_id);
    }

    public function register_dynamic_text_patterns(): void {
        try {
            add_filter('the_content', [$this, 'parse_meta_field_patterns'], 20);
            add_filter('widget_text', [$this, 'parse_meta_field_patterns'], 20);
            add_filter('the_excerpt', [$this, 'parse_meta_field_patterns'], 20);
            add_filter('fiveprayer_dynamic_text_patterns', [$this, 'addShortcodeMetaPatterns']);
        } catch (\Exception $e) {
            if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                \FivePrayer\Core\Logging\Logger::error('MetaFieldGenerator register_dynamic_text_patterns failed: ' . $e->getMessage(), 'MetaFieldGenerator');
            }
        }
    }

    public function parse_meta_field_patterns(string $content): string {
        return $this->parseMetaFieldPatterns($content);
    }

    public function add_shortcode_meta_patterns($patterns): array {
        return $this->addShortcodeMetaPatterns($patterns);
    }

    public function get_default_prayer_time(string $field_key): string {
        $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
        if (!in_array($field_key, $valid_field_keys, true)) {
            return '';
        }

        $shortcode_map = ShortCodeMap::ACTIVE_SHORTCODES;
        $shortcode = null;
        foreach ($shortcode_map as $sc => $mapped_field_key) {
            if ($mapped_field_key === $field_key) {
                $shortcode = $sc;
                break;
            }
        }

        if ($shortcode) {
            $shortcode_output = do_shortcode('[' . $shortcode . ']');
            $clean_output = trim(wp_strip_all_tags($shortcode_output));
            if (empty($clean_output)) {
                $clean_output = preg_replace('/<[^>]*>/', ' ', $shortcode_output);
                $clean_output = trim(preg_replace('/\s+/', ' ', $shortcode_output));
            }
            return $clean_output;
        }

        $today_date = current_time('Y-m-d');
        $today_prayer_times = PrayerDataCache::getTodaysPrayerTimes($today_date);

        if (!$today_prayer_times) {
            return $this->get_default_prayer_time_via_shortcode($field_key);
        }

        if (isset($today_prayer_times->$field_key)) {
            return $today_prayer_times->$field_key;
        }

        return $this->get_default_prayer_time_via_shortcode($field_key);
    }

    public function register_elementor_tags($dynamic_tags): void {
        try {
            if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                \FivePrayer\Core\Logging\Logger::debug('Attempting to register FivePrayer dynamic tags', 'MetaFieldGenerator');
            }

            if (class_exists('\FivePrayer\Core\Helpers\MetaField\Elementor\ElementorIntegration')) {
                \FivePrayer\Core\Helpers\MetaField\Elementor\ElementorIntegration::register_dynamic_tags($dynamic_tags);
            } elseif (class_exists('\FivePrayer\Core\Helpers\MetaField\FivePrayerDynamicTags')) {
                $fiveprayer_tags = new \FivePrayer\Core\Helpers\MetaField\FivePrayerDynamicTags();
                $fiveprayer_tags->register_all_tags($dynamic_tags);
            }

            if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                \FivePrayer\Core\Logging\Logger::debug('Successfully registered FivePrayer dynamic tags', 'MetaFieldGenerator');
            }
        } catch (\Exception $e) {
            if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                \FivePrayer\Core\Logging\Logger::error('MetaFieldGenerator register_elementor_tags failed: ' . $e->getMessage(), 'MetaFieldGenerator');
            }
        }
    }

    public function get_default_prayer_time_public(string $field_key): string {
        return $this->get_default_prayer_time($field_key);
    }
}

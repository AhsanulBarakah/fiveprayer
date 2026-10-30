<?php

namespace FivePrayer\Core\Helpers\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Helpers\PrayerDataCache;

trait EditorContextTrait
{
    protected function isEditorContext(): bool
    {
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
            if ($screen && ($screen->base === 'post')) {
                return true;
            }
        }

        return false;
    }

    protected function parseMetaFieldPatterns(string $content): string
    {
        $pattern = '/\{fp_([a-zA-Z_0-9]+)\}/';
        return preg_replace_callback($pattern, [$this, 'replaceMetaFieldPattern'], $content);
    }

    private function replaceMetaFieldPattern(array $matches): string
    {
        $full_match = $matches[0];
        $field_key = $matches[1];

        $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);

        if (in_array($field_key, $valid_field_keys, true)) {
            $value = $this->getMetaFieldValue($field_key);

            if ($this->isEditorContext()) {
                return '<span class="fiveprayer-meta-field fiveprayer-meta-field-' . esc_attr($field_key) . '" data-fiveprayer-field="' . esc_attr($field_key) . '" data-original-pattern="' . esc_attr($full_match) . '">' . $value . '</span>';
            }

            return $value;
        }

        return $full_match;
    }

    private function getMetaFieldValue(string $field_key): string
    {
        $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
        if (!in_array($field_key, $valid_field_keys, true)) {
            return '';
        }

        $post_id = get_the_ID();
        if (!$post_id) {
            return $this->get_default_prayer_time($field_key);
        }

        $meta_key = 'fp_' . $field_key;
        $meta_value = get_post_meta($post_id, $meta_key, true);

        if (empty($meta_value)) {
            return $this->get_default_prayer_time($field_key);
        }

        return $meta_value;
    }

    public function addShortcodeMetaPatterns($patterns): array
    {
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $meta_key = 'fp_' . $field_key;
            $patterns['{' . $meta_key . '}'] = function() use ($field_key) {
                return $this->getMetaFieldValue($field_key);
            };
        }
        return $patterns;
    }

    public function get_default_prayer_time_via_shortcode(string $field_key): string
    {
        $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
        if (!in_array($field_key, $valid_field_keys, true)) {
            return '';
        }

        $shortcode_map = ShortCodeMap::ACTIVE_SHORTCODES;
        $target_shortcode = null;
        foreach ($shortcode_map as $shortcode => $mapped_field_key) {
            if ($mapped_field_key === $field_key) {
                $target_shortcode = $shortcode;
                break;
            }
        }

        if ($target_shortcode) {
            $shortcode_output = do_shortcode('[' . $target_shortcode . ']');
            $clean_output = trim(wp_strip_all_tags($shortcode_output));
            if (empty($clean_output)) {
                $clean_output = preg_replace('/<[^>]*>/', ' ', $shortcode_output);
                $clean_output = trim(preg_replace('/\s+/', ' ', $shortcode_output));
            }
            return $clean_output;
        }

        return '';
    }
}

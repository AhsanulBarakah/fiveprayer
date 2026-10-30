<?php

namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Components;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;

defined('ABSPATH') || exit;

/**
 * Manages field data retrieval and processing
 */
class FieldDataManager {
    
    /**
     * Get the value for a specific field
     *
     * @param string $field_key
     * @param int $post_id
     * @return string
     */
    public static function getFieldData(string $field_key, int $post_id): string {
        // Validate field key against allowed values to prevent injection
        $allowed_fields = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
        if (!in_array($field_key, $allowed_fields, true)) {
            return '';
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

        return $meta_value;
    }
    
    /**
     * Get all available shortcode mappings
     *
     * @return array
     */
    public static function getShortcodeMappings(): array {
        return ShortCodeMap::ACTIVE_SHORTCODES;
    }
    
    /**
     * Get field configuration data
     *
     * @param string $field_key
     * @param string $field_label
     * @return array
     */
    public static function getFieldConfiguration(string $field_key, string $field_label): array {
        return [
            'label' => $field_label,
            'slug' => $field_key,
            'group' => 'FivePrayer Fields',
            'category' => 'FivePrayer'
        ];
    }
}
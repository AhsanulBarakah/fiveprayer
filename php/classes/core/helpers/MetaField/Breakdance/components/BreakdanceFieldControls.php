<?php

namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Components;

defined('ABSPATH') || exit;

/**
 * Controls for Breakdance fields
 */
class BreakdanceFieldControls {
    
    /**
     * Get controls for title fields
     *
     * @return array
     */
    public static function getTitleFieldControls(): array {
        return [
            [
                'slug' => 'remove_first_word',
                'type' => 'toggle',
                'label' => 'Remove First Word',
                'defaultValue' => false,
                'options' => [
                    'type' => 'toggle',
                    'label' => 'Remove First Word',
                    'layout' => 'vertical', // Stack vertically
                ],
                'enableMediaQueries' => false,
                'enableHover' => false,
                'children' => [],
            ],
            [
                'slug' => 'remove_second_word',
                'type' => 'toggle',
                'label' => 'Remove Second Word',
                'defaultValue' => false,
                'options' => [
                    'type' => 'toggle',
                    'label' => 'Remove Second Word',
                    'layout' => 'vertical', // Stack vertically
                    // Condition to disable this when first is checked
                    'condition' => [
                        'path' => 'attributes.remove_first_word',
                        'operand' => 'not equals',
                        'value' => true,
                    ],
                ],
                'enableMediaQueries' => false,
                'enableHover' => false,
                'children' => [],
            ],
            [
                'slug' => 'remove_specific_word',
                'type' => 'text',
                'label' => 'Remove Specific Word',
                'placeholder' => 'Enter word to remove...',
                'defaultValue' => '',
                'options' => [
                    'type' => 'text',
                    'placeholder' => 'Enter word to remove...',
                    'label' => 'Remove Specific Word',
                    'layout' => 'vertical', // Stack vertically
                ],
                'enableMediaQueries' => false,
                'enableHover' => false,
                'children' => [],
            ]
        ];
    }
    
    /**
     * Get controls for different field types
     *
     * @param string $field_type Type of field (e.g., 'title', 'subtitle', etc.)
     * @param array $custom_options Custom options to modify controls
     * @return array
     */
    public static function getFieldControls(string $field_type = 'title', array $custom_options = []): array {
        // Default controls for title fields
        $default_controls = self::getTitleFieldControls();  // Use the existing method here for title fields

        // If custom options are passed, merge them with the default controls
        if (!empty($custom_options)) {
            foreach ($default_controls as &$control) {
                if (isset($custom_options[$control['slug']])) {
                    $control = array_merge($control, $custom_options[$control['slug']]);
                }
            }
        }

        // Return the final list of controls based on the field type
        if ($field_type === 'title') {
            return $default_controls;
        }

        // Add other types of fields (e.g., 'subtitle', 'custom') if needed
        if ($field_type === 'subtitle') {
            // Define controls for subtitle
            return [
                [
                    'slug' => 'subtitle_text',
                    'type' => 'text',
                    'label' => 'Subtitle Text',
                    'defaultValue' => '',
                    'options' => [
                        'type' => 'text',
                        'placeholder' => 'Enter subtitle...',
                        'label' => 'Subtitle Text',
                    ],
                    'enableMediaQueries' => false,
                    'enableHover' => false,
                    'children' => [],
                ]
            ];
        }

        return [];
    }
    
    /**
     * Check if a field is a title field that should have word removal controls
     *
     * @param string $field_key
     * @return bool
     */
    public static function isTitleField(string $field_key): bool {
        $title_fields = [
            'next_prayer_iqamah_title',
            'next_prayer_begins_title',
        ];
        
        return in_array($field_key, $title_fields, true);
    }
}

<?php

namespace FivePrayer\Core\Helpers\MetaField\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Logging\Logger;

trait AcfCompatTrait
{
    /**
     * Add ACF and page builder compatibility with security
     */
    public function add_secure_acf_compatibility(): void
    {
        try {
            if (class_exists('ACF')) {
                add_action('acf/init', [$this, 'register_secure_acf_field_groups']);
            }

            add_filter('acf/get_field_reference', [$this, 'secure_acf_field_reference'], 10, 3);
            add_filter('acf/get_field_group', [$this, 'secure_acf_field_group'], 10, 2);

            $this->add_secure_acf_preview_support();
            $this->add_secure_elementor_compatibility();
            $this->add_secure_page_builder_compatibilities();
        } catch (\Exception $e) {
            Logger::error('Error adding ACF compatibility: ' . $e->getMessage(), 'PageBuilderCompat');
        }
    }

    /**
     * Register ACF field groups with security
     */
    public function register_secure_acf_field_groups(): void
    {
        if (!function_exists('acf_add_local_field_group')) {
            return;
        }

        try {
            acf_add_local_field_group([
                'key' => 'group_fiveprayer_fields',
                'title' => SecurityHelper::sanitize_text('FivePrayer Fields'),
                'fields' => $this->get_secure_acf_fields(),
                'location' => [
                    [
                        [
                            'param' => 'post_type',
                            'operator' => '==',
                            'value' => 'post',
                        ],
                    ],
                    [
                        [
                            'param' => 'post_type',
                            'operator' => '==',
                            'value' => 'page',
                        ],
                    ],
                ],
                'menu_order' => 0,
                'position' => 'normal',
                'style' => 'default',
                'label_placement' => 'top',
                'instruction_placement' => 'label',
                'hide_on_screen' => '',
                'active' => true,
                'description' => SecurityHelper::sanitize_text('FivePrayer meta fields based on shortcode map'),
                'show_in_rest' => 0,
            ]);
        } catch (\Exception $e) {
            Logger::error('Error registering ACF field groups: ' . $e->getMessage(), 'PageBuilderCompat');
        }
    }

    /**
     * Get ACF fields based on our shortcode map with security
     */
    private function get_secure_acf_fields(): array
    {
        $fields = [];

        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $meta_key = 'fp_' . SecurityHelper::sanitize_input($field_key);

            $fields[] = [
                'key' => 'field_' . str_replace('-', '_', SecurityHelper::sanitize_input($field_key)),
                'label' => SecurityHelper::sanitize_text($this->get_secure_field_label($shortcode, $field_key)),
                'name' => $meta_key,
                'type' => 'text',
                'instructions' => SecurityHelper::sanitize_text('Meta field for ' . $shortcode . ' shortcode'),
                'required' => 0,
                'conditional_logic' => 0,
                'wrapper' => [
                    'width' => '',
                    'class' => '',
                    'id' => '',
                ],
                'default_value' => '',
                'placeholder' => '',
                'prepend' => '',
                'append' => '',
                'maxlength' => '',
            ];
        }

        return $fields;
    }

    /**
     * Get a human-readable label for the field with security
     */
    private function get_secure_field_label(string $shortcode, string $field_key): string
    {
        $label = str_replace('_', ' ', SecurityHelper::sanitize_input($field_key));
        $label = ucwords($label);

        $replacements = [
            'Begins' => 'Begins Time',
            'Iqamah' => 'Iqamah Time',
            'Current Date' => 'Current Date',
            'Current Time' => 'Current Time',
            'Prayer Times For Today' => 'Prayer Times for Today',
            'Hijra Date' => 'Hijra Date',
            'Masjid Name' => 'Masjid Name',
            'Current Location' => 'Current Location',
            'Next Prayer' => 'Next Prayer',
        ];

        foreach ($replacements as $search => $replace) {
            $label = str_replace($search, $replace, $label);
        }

        return SecurityHelper::sanitize_text($label . ' (' . $shortcode . ')');
    }

    /**
     * Handle ACF field reference with security
     */
    public function secure_acf_field_reference($reference, $selector, $post_id)
    {
        try {
            if (strpos($selector, 'fp_') === 0) {
                $field_key = SecurityHelper::sanitize_input(substr($selector, 3));
                $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);

                if (in_array($field_key, $valid_field_keys, true)) {
                    return 'meta:' . SecurityHelper::sanitize_input($selector);
                }
            }
            return $reference;
        } catch (\Exception $e) {
            Logger::error('Error in ACF field reference: ' . $e->getMessage(), 'PageBuilderCompat');
            return $reference;
        }
    }

    /**
     * Add preview value for ACF fields with security
     */
    public function add_secure_acf_preview_support(): void
    {
        if (class_exists('ACF')) {
            add_filter('acf/format_value', [$this, 'secure_acf_format_value'], 20, 3);
        }
    }

    /**
     * Format ACF value with secure preview capability
     */
    public function secure_acf_format_value($value, $post_id, $field)
    {
        try {
            if (strpos($field['name'], 'fp_') === 0) {
                $field_key = SecurityHelper::sanitize_input(substr($field['name'], 3));
                $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);

                if (in_array($field_key, $valid_field_keys, true)) {
                    if (empty($value)) {
                        return $this->dynamic_text_handler->get_secure_default_prayer_time($field_key);
                    }
                }
            }

            return $value;
        } catch (\Exception $e) {
            Logger::error('Error formatting ACF value: ' . $e->getMessage(), 'PageBuilderCompat');
            return $value;
        }
    }

    /**
     * Handle ACF field group with security
     */
    public function secure_acf_field_group($field_group, $field_group_key)
    {
        return $field_group;
    }
}

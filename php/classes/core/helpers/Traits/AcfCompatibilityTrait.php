<?php

namespace FivePrayer\Core\Helpers\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;

trait AcfCompatibilityTrait
{
    protected function addAcfCompatibility(): void
    {
        if (class_exists('ACF')) {
            add_action('acf/init', [$this, 'register_acf_field_groups']);
        }

        add_filter('acf/get_field_reference', [$this, 'acf_field_reference'], 10, 3);
        add_filter('acf/get_field_group', [$this, 'acf_field_group'], 10, 2);

        $this->addAcfPreviewSupport();
    }

    public function register_acf_field_groups(): void
    {
        if (!function_exists('acf_add_local_field_group')) {
            return;
        }

        acf_add_local_field_group([
            'key' => 'group_fiveprayer_fields',
            'title' => 'FivePrayer Fields',
            'fields' => $this->getAcfFields(),
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
            'description' => 'FivePrayer meta fields based on shortcode map',
            'show_in_rest' => 0,
        ]);
    }

    private function getAcfFields(): array
    {
        $fields = [];
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $meta_key = 'fp_' . $field_key;
            $fields[] = [
                'key' => 'field_' . str_replace('-', '_', $field_key),
                'label' => $this->getFieldLabel($shortcode, $field_key),
                'name' => $meta_key,
                'type' => 'text',
                'instructions' => 'Meta field for ' . $shortcode . ' shortcode',
                'required' => 0,
                'conditional_logic' => 0,
                'wrapper' => ['width' => '', 'class' => '', 'id' => ''],
                'default_value' => '',
                'placeholder' => '',
                'prepend' => '',
                'append' => '',
                'maxlength' => '',
            ];
        }
        return $fields;
    }

    private function getFieldLabel(string $shortcode, string $field_key): string
    {
        $label = str_replace('_', ' ', $field_key);
        $label = ucwords($label);
        return $label . ' (' . $shortcode . ')';
    }

    protected function addAcfPreviewSupport(): void
    {
        if (class_exists('ACF')) {
            add_filter('acf/format_value', [$this, 'acf_format_value'], 20, 3);
        }
    }

    public function acf_format_value($value, $post_id, $field)
    {
        if (strpos($field['name'], 'fp_') === 0) {
            $field_key = substr($field['name'], 3);
            $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
            if (in_array($field_key, $valid_field_keys, true) && empty($value)) {
                return $this->get_default_prayer_time($field_key);
            }
        }
        return $value;
    }

    public function acf_field_reference($reference, $selector, $post_id)
    {
        if (strpos($selector, 'fp_') === 0) {
            $field_key = substr($selector, 3);
            $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
            if (in_array($field_key, $valid_field_keys, true)) {
                return 'meta:' . $selector;
            }
        }
        return $reference;
    }

    public function acf_field_group($field_group, $field_group_key)
    {
        return $field_group;
    }
}

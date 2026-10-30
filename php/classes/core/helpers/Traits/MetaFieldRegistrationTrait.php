<?php

namespace FivePrayer\Core\Helpers\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;

trait MetaFieldRegistrationTrait
{
    protected function registerPostMetaFields(): void
    {
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $meta_key = 'fp_' . $field_key;
            register_meta('post', $meta_key, [
                'type' => 'string',
                'description' => 'Meta field for ' . $shortcode . ' shortcode',
                'single' => true,
                'show_in_rest' => true,
                'sanitize_callback' => [$this, 'sanitize_meta_value'],
                'auth_callback' => [$this, 'auth_callback'],
            ]);
        }
    }

    protected function registerPageMetaFields(): void
    {
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
            $meta_key = 'fp_' . $field_key;
            register_meta('page', $meta_key, [
                'type' => 'string',
                'description' => 'Meta field for ' . $shortcode . ' shortcode',
                'single' => true,
                'show_in_rest' => true,
                'sanitize_callback' => [$this, 'sanitize_meta_value'],
                'auth_callback' => [$this, 'auth_callback'],
            ]);
        }
    }

    protected function registerOtherPostTypeMetaFields(): void
    {
        $post_types = get_post_types(['public' => true], 'names');
        unset($post_types['post']);
        unset($post_types['page']);

        foreach ($post_types as &$post_type) {
            foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field_key) {
                $meta_key = 'fp_' . $field_key;
                register_meta($post_type, $meta_key, [
                    'type' => 'string',
                    'description' => 'Meta field for ' . $shortcode . ' shortcode',
                    'single' => true,
                    'show_in_rest' => true,
                    'sanitize_callback' => [$this, 'sanitize_meta_value'],
                    'auth_callback' => [$this, 'auth_callback'],
                ]);
            }
        }
    }
}

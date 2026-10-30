<?php

namespace FivePrayer\Core\ShortCodes\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Security\SecurityHelper;

/**
 * Trait for AJAX handler and cache management functionality.
 */
trait AjaxCacheTrait
{
    public function handle_dynamic_content_request(): void
    {
        $nonce = SecurityHelper::get_sanitized_post_input('nonce');
        if (!$nonce || !wp_verify_nonce($nonce, 'fiveprayer_dynamic_nonce')) {
            wp_die(esc_html__('Security check failed', 'fiveprayer'));
        }

        $response = [];

        $raw_shortcode_types = SecurityHelper::get_sanitized_post_input('shortcode_types');
        if ($raw_shortcode_types && is_array($raw_shortcode_types)) {
            $shortcode_types = array_map('sanitize_text_field', $raw_shortcode_types);

            foreach ($shortcode_types as &$shortcode_type) {
                switch ($shortcode_type) {
                    case 'monthly_timetable':
                        $attr_key = 'shortcode_attrs_' . $shortcode_type;
                        $post_shortcode_attrs = SecurityHelper::get_sanitized_post_input('shortcode_attrs');
                        $post_attr_value = SecurityHelper::get_sanitized_post_input($attr_key);

                        $post_attr_check = SecurityHelper::get_sanitized_post_input($attr_key);
                        $shortcode_attrs = $post_attr_check
                            ? json_decode(stripslashes($post_attr_value), true)
                            : json_decode(stripslashes($post_shortcode_attrs ?? '[]'), true);

                        if (!is_array($shortcode_attrs)) {
                            $shortcode_attrs = [];
                        }
                        $response[$shortcode_type] = $this->timetable_month($shortcode_attrs);
                        break;
                    case 'daily_timetable':
                        $attr_key = 'shortcode_attrs_' . $shortcode_type;
                        $post_shortcode_attrs = SecurityHelper::get_sanitized_post_input('shortcode_attrs');
                        $post_attr_value = SecurityHelper::get_sanitized_post_input($attr_key);

                        $post_attr_check = SecurityHelper::get_sanitized_post_input($attr_key);
                        $shortcode_attrs = $post_attr_check
                            ? json_decode(stripslashes($post_attr_value), true)
                            : json_decode(stripslashes($post_shortcode_attrs ?? '[]'), true);

                        if (!is_array($shortcode_attrs)) {
                            $shortcode_attrs = [];
                        }
                        $response[$shortcode_type] = $this->timetable_daily($shortcode_attrs);
                        break;
                    case 'single_prayer':
                        $raw_fields = SecurityHelper::get_sanitized_post_input('single_prayer_fields');
                        if ($raw_fields && is_array($raw_fields)) {
                            $fields = array_map('sanitize_text_field', $raw_fields);
                            $shortcode_instance = \FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers::getInstance();

                            foreach ($fields as &$field) {
                                $response[$field] = $shortcode_instance->renderShortCode($field, false, '');
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        } else {
            $raw_shortcode_type = SecurityHelper::get_sanitized_post_input('shortcode_type');
            $shortcode_type = sanitize_text_field($raw_shortcode_type ?: '');

            $attr_key = 'shortcode_attrs_' . $shortcode_type;
            $post_shortcode_attrs = SecurityHelper::get_sanitized_post_input('shortcode_attrs');
            $post_attr_value = SecurityHelper::get_sanitized_post_input($attr_key);

            $post_attr_check = SecurityHelper::get_sanitized_post_input($attr_key);
            $shortcode_attrs = $post_attr_check
                ? json_decode(stripslashes($post_attr_value), true)
                : json_decode(stripslashes($post_shortcode_attrs ?: '[]'), true);

            if (!is_array($shortcode_attrs)) {
                $shortcode_attrs = [];
            }

            switch ($shortcode_type) {
                case 'monthly_timetable':
                    $response[$shortcode_type] = $this->timetable_month($shortcode_attrs);
                    break;
                case 'daily_timetable':
                    $response[$shortcode_type] = $this->timetable_daily($shortcode_attrs);
                    break;
                case 'single_prayer':
                    $field = SecurityHelper::get_sanitized_post_input('field');
                    $field = sanitize_text_field($field ?: '');
                    if (!empty($field)) {
                        $shortcode_instance = \FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers::getInstance();
                        $response[$field] = $shortcode_instance->renderShortCode($field, false, '');
                    } else {
                        wp_send_json_error(esc_html__('Field parameter missing for single prayer shortcode', 'fiveprayer'));
                    }
                    break;
                default:
                    wp_send_json_error(esc_html__('Invalid shortcode type', 'fiveprayer'));
                    break;
            }
        }

        wp_send_json_success($response);
    }

    public static function maybe_purge_fragment_cache($option, $old_value, $value): void
    {
        $watched = [
            'hijralocale',
            'extra_info',
            'prayer_names',
            'activeLanguage',
            'timetable_prayer',
            'vertical_daily_prayer',
            'skip_iqamah_midnight',
            'hide_printer_button',
            'hide_month_selection',
            'printer_button_url',
            'hide_custom_url_button',
            'extra_prayers',
        ];
        if (in_array($option, $watched, true)) {
            self::purge_fragment_caches();
        }
    }

    public static function purge_fragment_caches(): void
    {
        global $wpdb;
        if (!$wpdb) {
            return;
        }
        $patterns = [
            '_transient_fp_vdp_%',
            '_transient_timeout_fp_vdp_%',
            '_transient_fp_month_%',
            '_transient_timeout_fp_month_%',
            '_transient_fiveprayer_block_single_%',
            '_transient_timeout_fiveprayer_block_single_%',
        ];
        foreach ($patterns as &$like) {
            // Clearing the runtime caches means deleting transients, which cannot
            // itself be cached. This runs from PrayerDataCache::invalidateAll(),
            // which also drops the plugin's object cache group.
            $wpdb->query($wpdb->prepare("DELETE FROM %i WHERE option_name LIKE %s", $wpdb->options, $like)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        }
    }
}

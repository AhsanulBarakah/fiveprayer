<?php

namespace FivePrayer\Core\Helpers\MetaField\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\Helpers\GetMeta;

trait FieldResolverTrait
{
    /**
     * Get field data consistently across all page builders
     */
    public static function getFieldData(string $field_key, int $post_id = null, array $attributes = []): string
    {
        $allowed_fields = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
        if (!in_array($field_key, $allowed_fields, true)) {
            return '';
        }

        if ($post_id === null) {
            $post_id = get_the_ID();
        }

        $meta_key = 'fp_' . $field_key;
        $meta_value = '';

        if ($post_id && self::validatePostId($post_id)) {
            $meta_value = get_post_meta($post_id, $meta_key, true);
        }

        if (empty($meta_value) && self::isPageBuilderContext()) {
            global $post;
            if ($post && isset($post->ID)) {
                $meta_value = get_post_meta($post->ID, $meta_key, true);
            }
        }

        if (class_exists('\FivePrayer\Core\Logging\Logger')) {
            \FivePrayer\Core\Logging\Logger::debug("UnifiedDataAccess.getFieldData: field_key={$field_key}, post_id={$post_id}, meta_value='" . $meta_value . "'", 'UnifiedDataAccess');
        }

        if (empty($meta_value)) {
            $meta_value = self::getDefaultFieldValue($field_key);
        }

        if (empty($meta_value)) {
            $today_date = current_time('Y-m-d');
            $today_prayer_times = PrayerDataCache::getTodaysPrayerTimes($today_date);

            if ($today_prayer_times && isset($today_prayer_times->$field_key)) {
                $meta_value = $today_prayer_times->$field_key;
            }
        }

        if (empty($meta_value)) {
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

                $meta_value = $clean_output;
            }
        }

        $meta_value = self::applyFieldProcessing($meta_value, $field_key, $attributes);

        return $meta_value;
    }

    private static function validatePostId($post_id): bool
    {
        if (empty($post_id) || !is_numeric($post_id)) {
            return false;
        }

        $post_id = intval($post_id);
        if ($post_id <= 0) {
            return false;
        }

        $post = get_post($post_id);
        if (!$post) {
            return false;
        }

        if (self::isPageBuilderContext()) {
            return true;
        }

        if ($post->post_status !== 'publish') {
            return false;
        }

        return true;
    }

    private static function isPageBuilderContext(): bool
    {
        if (defined('ELEMENTOR_VERSION') && (SecurityHelper::has_query_arg('elementor-preview') || SecurityHelper::has_query_arg('action') && SecurityHelper::get_sanitized_get_input('action') === 'elementor')) {
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

        if (function_exists('\Breakdance\Util\isBreakdancePage')) {
            return \Breakdance\Util\isBreakdancePage();
        }

        $page_builder_params = ['builder', 'edit', 'preview', 'mode'];
        foreach ($page_builder_params as $param) {
            if (SecurityHelper::has_query_arg($param)) {
                return true;
            }
        }

        return false;
    }

    private static function getDefaultFieldValue(string $field_key): string
    {
        $shortcode_map = ShortCodeMap::ACTIVE_SHORTCODES;

        $shortcode = null;
        foreach ($shortcode_map as $sc => $mapped_field_key) {
            if ($mapped_field_key === $field_key) {
                $shortcode = $sc;
                break;
            }
        }

        if ($shortcode) {
            $meta_value = do_shortcode('[' . $shortcode . ']');
            $clean_output = trim(wp_strip_all_tags($meta_value));

            if (empty($clean_output)) {
                $clean_output = preg_replace('/<[^>]*>/', ' ', $meta_value);
                $clean_output = trim(preg_replace('/\s+/', ' ', $meta_value));
            }

            return $clean_output;
        }

        $today_date = current_time('Y-m-d');
        $today_prayer_times = PrayerDataCache::getTodaysPrayerTimes($today_date);

        if ($today_prayer_times && isset($today_prayer_times->$field_key)) {
            return $today_prayer_times->$field_key;
        }

        return '';
    }

    private static function applyFieldProcessing(string $value, string $field_key, array $attributes): string
    {
        if (in_array($field_key, ['next_prayer_iqamah_title', 'next_prayer_begins_title'], true)) {
            $value = self::processWordRemoval($value, $field_key, $attributes);
        }

        return $value;
    }

    /**
     * Get all available field keys
     */
    public static function getAvailableFieldKeys(): array
    {
        return array_values(ShortCodeMap::ACTIVE_SHORTCODES);
    }

    /**
     * Get field label for UI purposes
     */
    public static function getFieldLabel(string $field_key): string
    {
        $label_map = [
            'fajr_begins' => 'Fajr Begins Time',
            'fajr_iqamah' => 'Fajr Iqamah Time',
            'dhuhr_begins' => 'Dhuhr Begins Time',
            'dhuhr_iqamah' => 'Dhuhr Iqamah Time',
            'asr_begins' => 'Asr Begins Time',
            'asr_second_begins' => 'Hanafi Begins Time (2 Mithl)',
            'asr_iqamah' => 'Asr Iqamah Time',
            'maghrib_begins' => 'Maghrib Begins Time',
            'maghrib_iqamah' => 'Maghrib Iqamah Time',
            'isha_begins' => 'Isha Begins Time',
            'isha_iqamah' => 'Isha Iqamah Time',
            'sunrise' => 'Sunrise Time',
            'current_time' => 'Current Time',
            'currentDate' => 'Current Date',
            'hijra_date' => 'Hijra Date',
            'current_location' => 'Current Location',
            'masjid_name' => 'Masjid Name',
            'midnight' => 'Midnight Time',
            'midnight_name' => 'Midnight Name',
            'single_prayer_begins_title' => 'Prayer Begins Title',
            'single_prayer_iqamah_title' => 'Prayer Iqamah Title',
            'fajr_name' => 'Fajr Name',
            'dhuhr_name' => 'Dhuhr Name',
            'asr_name' => 'Asr Name',
            'maghrib_name' => 'Maghrib Name',
            'isha_name' => 'Isha Name',
            'sunrise_name' => 'Sunrise Name',
            'prayer_times_for_today' => 'Prayer Times For Today',
            'next_prayer_iqamah_time' => 'Next Prayer Iqamah Time',
            'next_prayer_iqamah_title' => 'Next Prayer Iqamah Title',
            'next_prayer_begins_time' => 'Next Prayer Begins Time',
            'next_prayer_begins_title' => 'Next Prayer Begins Title',
            'next_prayer_title' => 'Next Prayer Title',
            'prayer_title' => 'Prayer Title',
            'current_title' => 'Current Title',
        ];

        return $label_map[$field_key] ?? str_replace('_', ' ', $field_key);
    }

    /**
     * Check if a field key is valid
     */
    public static function isValidFieldKey(string $field_key): bool
    {
        $allowed_fields = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
        return in_array($field_key, $allowed_fields, true);
    }
}

<?php
namespace FivePrayer\Core\Helpers;

defined('ABSPATH') || exit;

/**
 * Helper class for printer-related functions
 */
class PrinterHelper
{
    private static $cache = [];

    private static $metaCache = null;

    /**
     * Get cached value from meta using GetMeta
     */
    private static function getCachedMeta($key)
    {
        if (isset(self::$cache[$key])) {
            return self::$cache[$key];
        }

        if (self::$metaCache === null) {
            self::$metaCache = new GetMeta();
        }

        $value = self::$metaCache->get_meta_key($key);
        return self::$cache[$key] = $value;
    }

    /**
     * Get printer button text from extra_info translations
     * 
     * @return string The translated printer button text
     */
    public static function getPrinterButtonText()
    {
        // Get cached values
        $extra_info = self::getCachedMeta('extra_info');

        if (!$extra_info) {
            return __('Printer TimeTable', 'fiveprayer');
        }

        // Get active language and hijra locale (already cached)
        $active_language_data = self::getCachedMeta('activeLanguage');
        $hijra_locale_data = self::getCachedMeta('hijralocale');

        // Default to English
        $active_language = 'en';

        // Only use activeLanguage from DB if Hijra Calendar is active AND customLan is true
        if ($hijra_locale_data) {
            $hijra_is_active = isset($hijra_locale_data['isActive']) && $hijra_locale_data['isActive'] === true;
            $custom_lan = isset($hijra_locale_data['customLan']) && $hijra_locale_data['customLan'] === true;

            // Use activeLanguage ONLY if Hijra is active AND customLan is true
            if ($hijra_is_active && $custom_lan && $active_language_data) {
                if (is_array($active_language_data) && !empty($active_language_data[0]['language_code'])) {
                    $active_language = $active_language_data[0]['language_code'];
                }
            }
        }

        // Find printer button text in extra_info
        foreach ($extra_info as $item) {
            if (isset($item['original_text']) &&
                $item['original_text'] === 'Printer Button Text' &&
                isset($item['language_code']) &&
                $item['language_code'] === $active_language &&
                !empty($item['translated_text'])) {
                return $item['translated_text'];
            }
        }

        // Try English fallback if not found in active language
        if ($active_language !== 'en') {
            foreach ($extra_info as $item) {
                if (isset($item['original_text']) &&
                    $item['original_text'] === 'Printer Button Text' &&
                    isset($item['language_code']) &&
                    $item['language_code'] === 'en' &&
                    !empty($item['translated_text'])) {
                    return $item['translated_text'];
                }
            }
        }

        // Default fallback
        return __('Printer TimeTable', 'fiveprayer');
    }

    /**
     * Check if printer button should be hidden
     *
     * @return bool True if printer button should be hidden
     */
    public static function shouldHidePrinterButton()
    {
        $value = self::getCachedMeta('hide_printer_button');

        if ($value) {
            return (bool) $value;
        }

        return false;
    }

    /**
     * Check if month selection should be hidden
     *
     * @return bool True if month selection should be hidden
     */
    public static function shouldHideMonthSelection()
    {
        $value = self::getCachedMeta('hide_month_selection');

        if ($value) {
            return (bool) $value;
        }

        return false;
    }

    /**
     * Check if custom URL button should be hidden
     *
     * @return bool True if custom URL button should be hidden (show print instead)
     *              DB value works as "use custom URL": 1=use custom URL, 0=use print
     */
    public static function shouldHideCustomUrlButton()
    {
        $value = self::getCachedMeta('hide_custom_url_button');

        if ($value === null) {
            return true; // Default: hide custom URL (use print)
        }

        // If value is a boolean, INVERT it
        if (is_bool($value)) {
            return !$value;
        }

        // If it's a string, check if it's "1" or "true", then INVERT
        if (is_string($value)) {
            $is_one = $value === '1' || strtolower($value) === 'true';
            return !$is_one;
        }

        // Fallback to boolean conversion, then INVERT
        return !(bool) $value;
    }

    /**
     * Get custom printer button URL
     *
     * @return string The custom URL, or empty string if not set
     */
    public static function getPrinterButtonUrl()
    {
        $value = self::getCachedMeta('printer_button_url');

        if (!$value) {
            return '';
        }

        // If it's a string, return it
        if (is_string($value) && !empty($value)) {
            return $value;
        }

        return '';
    }

    /**
     * Get auto-print page URL
     *
     * @return string The auto-print page URL, or empty string if not set
     */
    public static function getAutoPrintPageUrl()
    {
         $value = self::getCachedMeta('auto_print_page_url');

        if (!$value) {
            return '';
        }

        // If it's a string, return it
        if (is_string($value) && !empty($value)) {
            return $value;
        }

        return '';
    }
}
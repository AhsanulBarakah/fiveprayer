<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Template file: included inside a function, so these are local variables, not globals.
/**
 * Render callback for single prayer block
 */
if (!defined('ABSPATH')) {
    exit;
}

use FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers;

// Prepare default attributes
$attributes = wp_parse_args($attributes, [
    'shortcode' => '',
    'isCurrentTime' => false,
    'removeNextWord' => false,
    'removeSpecificWord' => '',
    'elementTag' => 'p',
    'customId' => '',
    'customClass' => '',
    'customAttributes' => []
]);

// Sanitize tag name and ensure it's allowed
$allowed_tags = [
    'p', 'div', 'span', 'section', 'article', 'aside', 
    'header', 'footer', 'main', 'nav', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
    'time'
];
$tag = sanitize_text_field($attributes['elementTag']);
$tag = in_array($tag, $allowed_tags) ? $tag : 'p';

// Fragment cache (10 minutes). Keyed by attributes, locale, and date. Skip in admin/editor to ensure previews render.
// Also skip caching for current time blocks to allow live updates
$cache_key = 'fiveprayer_block_single_' . md5(
    wp_json_encode($attributes) . '|' . get_locale() . '|' . gmdate('Y-m-d')
);

// Sanitize GET parameters to prevent input validation issues
$preview_param = sanitize_text_field(filter_input(INPUT_GET, 'preview') ?: '');
$context_param = sanitize_text_field(filter_input(INPUT_GET, 'context') ?: '');

// Recalculate bypass condition with sanitized values
$bypass_cache = is_admin() || !empty($preview_param) || (!empty($context_param) && $context_param === 'edit') ||
                (!empty($attributes['shortcode']) && $attributes['shortcode'] === 'current_time');
if (!$bypass_cache) {
    $cached = get_transient($cache_key);
    if ($cached !== false) {
        echo wp_kses_post($cached);
        return;
    }
}

// Prepare custom attributes
$additional_attrs = [];

if (!empty($attributes['customId'])) {
    $additional_attrs[] = 'id="' . esc_attr(sanitize_text_field($attributes['customId'])) . '"';
}

if (!empty($attributes['customClass'])) {
    $additional_attrs[] = 'class="' . esc_attr(sanitize_text_field($attributes['customClass'])) . '"';
}

if (!empty($attributes['customAttributes']) && is_array($attributes['customAttributes'])) {
    foreach ($attributes['customAttributes'] as $attr) {
        if (!empty($attr['name']) && !empty($attr['value'])) {
            $name = sanitize_text_field($attr['name']);
            $value = esc_attr(sanitize_text_field($attr['value']));

            // Only allow safe attributes
            if (preg_match('/^(data-[a-z0-9_-]+|aria-[a-z0-9_-]+|role|title)$/i', $name)) {
                $additional_attrs[] = $name . '="' . $value . '"';
            }
        }
    }
}

// Combine final attributes string
$attrs_str = !empty($additional_attrs) ? ' ' . implode(' ', $additional_attrs) : '';

// Get the singleton instance of ShortCodesSinglePrayers
$short = ShortCodesSinglePrayers::getInstance();

// Generate output
if (!empty($attributes['shortcode']) && $attributes['shortcode'] === 'current_time') {
    // Use the central function to enqueue combined scripts
    fiveprayer_enqueue_combined_scripts();

    // Track that this script was enqueued globally
    if (function_exists('fiveprayer_track_live_time_enqueue')) {
        fiveprayer_track_live_time_enqueue();
    }
    
    // Load translations and localize script
    $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
    $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage", [['language_code' => 'en']]);
    $customLan = $getMetaFromDB->get_meta_key("hijralocale", []);
    $numbers = $getMetaFromDB->get_meta_key("gregorian_numbers", []);
    
    // Check if Hijra Calendar is active - if NOT active, ALWAYS force English
    $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;
    if (!$hijraIsActive) {
        $activeLanguage = [['language_code' => 'en']];  // Force English regardless of stored value
    }

    // Build translation array with English fallback
    $translations = array_merge(
        array_fill_keys(array_map('strval', range(0, 9)), array_map('strval', range(0, 9))),
        ['AM' => 'AM', 'PM' => 'PM']
    );

    if (is_array($numbers) && !empty($activeLanguage[0]['language_code'])) {
        $targetLang = $activeLanguage[0]['language_code'];
        $foundAM = false;
        $foundPM = false;

        // Use reference to avoid copying the array unnecessarily
        foreach ($numbers as &$num) {
            if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                $num['language_code'] === $targetLang) {

                $original = strtoupper($num['original_text']);
                $translated = $num['translated_text'];
                $translations[$original] = $translated;
                $translations[strtolower($original)] = strtolower($translated);

                if ($original === 'AM') $foundAM = true;
                if ($original === 'PM') $foundPM = true;
            }
        }

        // If AM/PM not found, try English fallback
        if (!$foundAM || !$foundPM) {
            // Use reference to avoid copying the array unnecessarily
            foreach ($numbers as &$num) {
                if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                    $num['language_code'] === 'en') {

                    $original = strtoupper($num['original_text']);
                    $translated = $num['translated_text'];
                    
                    if (($original === 'AM' && !$foundAM) || ($original === 'PM' && !$foundPM)) {
                        $translations[$original] = $translated;
                        $translations[strtolower($original)] = strtolower($translated);
                    }
                }
            }
        }
    }
    
    // Localize script with translation data
    $timeFormat = get_option('time_format', 'h:i A');
    $timeData = [
        'numbers' => $translations,
        'ampm' => [
            'AM' => $translations['AM'] ?? 'AM',
            'PM' => $translations['PM'] ?? 'PM'
        ],
        'initialTime' => date_i18n($timeFormat),
        'timeFormat' => $timeFormat,
        'timeSelector' => '.fiveprayer-live-time',
        'activeLanguage' => $activeLanguage[0]['language_code'] ?? 'en',
        'customLan' => $customLan['customLan'] ?? false,
    ];
    
    // Use centralized script localization manager to prevent duplicates
    if (class_exists('\\FivePrayer\\Core\\Assets\\ScriptLocalizationManager')) {
        $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
        
        // Localize script with translation data for the combined script
        if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
            $localization_manager->localizeScript(
                'fiveprayer-combined-js',
                'fiveprayerTimeData',
                $timeData,
                JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
            );
        } else {
            // Fallback to individual file if asset manager is not available
            $localization_manager->localizeScript(
                'fiveprayer-live-time',
                'fiveprayerTimeData',
                $timeData,
                JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
            );
        }
    } else {
        // Fallback to original behavior if localization manager is not available
        if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
            wp_localize_script(
                'fiveprayer-combined-js',
                'fiveprayerTimeData',
                $timeData,
                JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
            );
        } else {
            // Fallback to individual file if asset manager is not available
            wp_localize_script(
                'fiveprayer-live-time',
                'fiveprayerTimeData',
                $timeData,
                JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_AMP | JSON_HEX_QUOT
            );
        }
    }
    
    // Render live updating current time with translation support
    $context_param = sanitize_text_field(filter_input(INPUT_GET, 'context') ?: '');
    $is_page_builder = is_admin() || (!empty($context_param) && $context_param === 'edit');
    
    // Use the same timeFormat for both localization and display
    $timeFormat = get_option('time_format', 'h:i A');
    
    // For page builder, show translated static time
    if ($is_page_builder) {
        $current_time = date_i18n($timeFormat, current_time('timestamp'));
        
        // Try to translate time if in page builder and custom language is enabled
        if (isset($customLan['customLan']) && $customLan['customLan'] === true) {
            // Apply translations using regex for proper matching
            if (!empty($translations)) {
                $current_time = preg_replace_callback('/[0-9]|AM|PM/i', function($matches) use ($translations) {
                    $match = $matches[0];
                    $upperMatch = strtoupper($match);
                    
                    if (isset($translations[$upperMatch])) {
                        $val = $translations[$upperMatch];
                        return is_array($val) ? '' : $val;
                    } elseif (isset($translations[strtolower($upperMatch)])) {
                        $val = $translations[strtolower($upperMatch)];
                        return is_array($val) ? '' : $val;
                    }
                    
                    return $match;
                }, $current_time);
            }
        }
        
        $initial_content = esc_html($current_time);
    } else {
        // For frontend, show translated time as fallback (will be updated by JS)
        $current_time = date_i18n($timeFormat, current_time('timestamp'));
        
        // Try to translate time for frontend if custom language is enabled
        if (isset($customLan['customLan']) && $customLan['customLan'] === true) {
            // Apply translations using regex for proper matching
            if (!empty($translations)) {
                $current_time = preg_replace_callback('/[0-9]|AM|PM/i', function($matches) use ($translations) {
                    $match = $matches[0];
                    $upperMatch = strtoupper($match);
                    
                    if (isset($translations[$upperMatch])) {
                        $val = $translations[$upperMatch];
                        return is_array($val) ? '' : $val;
                    } elseif (isset($translations[strtolower($upperMatch)])) {
                        $val = $translations[strtolower($upperMatch)];
                        return is_array($val) ? '' : $val;
                    }
                    
                    return $match;
                }, $current_time);
            }
        }
        
        $initial_content = esc_html($current_time);
    }
    
    $content = '<span class="fiveprayer-live-time" 
        data-servertime="' . esc_attr(current_time('timestamp')) . '" 
        data-timeformat="' . esc_attr($timeFormat) . '"
        data-pagebuilder="' . ($is_page_builder ? 'true' : 'false') . '">' . 
        $initial_content . '</span>';
} else {
    // Render standard prayer shortcode
    $content = !empty($attributes['shortcode'])
        ? $short->renderShortCode(
            sanitize_text_field($attributes['shortcode']),
            (bool) $attributes['removeNextWord'],
            sanitize_text_field($attributes['removeSpecificWord'])
        )
        : esc_html__('No prayer data available.', 'fiveprayer');

    // Use combined JS file instead of individual file to reduce HTTP requests
    if (class_exists('\\FivePrayer\\Core\\Assets\\AssetManager')) {
        $asset_manager = \FivePrayer\Core\Assets\AssetManager::getInstance();
        $combined_js_url = $asset_manager->getCombinedJsUrl();

        if ($combined_js_url && !wp_script_is('fiveprayer-combined-js', 'enqueued')) {
            wp_enqueue_script(
                'fiveprayer-combined-js',
                $combined_js_url,
                ['jquery'],
                time(), // Use current time to ensure freshness during development
                true
            );

            // Localize script with AJAX URL and nonce for the combined script
            wp_localize_script('fiveprayer-combined-js', 'fiveprayer_dynamic', [
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce')
            ]);
        }
    } else {
        // Fallback to individual file if asset manager is not available
        $script_path = dirname(__FILE__, 3) . '/php/classes/core/Assets/JS/dynamic-content-loader.js';
        $script_url = plugins_url('php/classes/core/Assets/JS/dynamic-content-loader.js', dirname(__FILE__, 3) . '/Fiveprayer.php');

        if (!wp_script_is('fiveprayer-dynamic-content-loader', 'registered')) {
            $version = file_exists($script_path) ? filemtime($script_path) : time();
            wp_register_script(
                'fiveprayer-dynamic-content-loader',
                $script_url,
                [],
                $version,
                true
            );
        }

        // Use the central function to enqueue combined scripts
        fiveprayer_enqueue_combined_scripts();
    }
}

// Return the final markup with caching (only on frontend)
$html = "<{$tag}{$attrs_str}>{$content}</{$tag}>";
if (!$bypass_cache) {
    set_transient($cache_key, $html, 10 * MINUTE_IN_SECONDS);
}
echo wp_kses_post($html);

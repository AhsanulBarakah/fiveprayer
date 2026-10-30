<?php

namespace FivePrayer\Core;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\DynamicContent;

class DynamicTextParser {

    public function register(): void {
        // Add filters to parse dynamic text in various contexts
        add_filter('the_content', [$this, 'parse_dynamic_text']);
        add_filter('widget_text', [$this, 'parse_dynamic_text']);
        add_filter('the_excerpt', [$this, 'parse_dynamic_text']);
        
        // For page builders and other contexts
        add_action('wp_head', [$this, 'parse_dynamic_text_in_headers']);
    }

    /**
     * Parse dynamic text patterns like fp_fajr_time, fp_next_prayer, etc.
     */
    public function parse_dynamic_text(string $content): string {
        // Skip regex entirely if no fp_* patterns exist (saves processing on Elementor/Oxygen pages)
        if (strpos($content, 'fp_') === false) {
            return $content;
        }

        // Pattern to match fp_* dynamic text patterns
        $pattern = '/\bfp_([a-zA-Z_0-9]+)\b/';
        
        return preg_replace_callback($pattern, [$this, 'replace_dynamic_text'], $content);
    }

    /**
     * Replace dynamic text patterns with actual content
     */
    private function replace_dynamic_text(array $matches): string {
        $full_match = $matches[0]; // e.g., fp_fajr_time
        $function_part = $matches[1]; // e.g., fajr_time
        
        // Convert the function_part to the actual shortcode name using the ShortCodeMap
        $active_shortcodes = ShortCodeMap::ACTIVE_SHORTCODES;
        
        // Look for a matching shortcode in the active shortcodes
        $matched_shortcode = null;
        
        foreach ($active_shortcodes as $shortcode => $mapped_value) {
            // Convert shortcode to lowercase and remove prefixes for comparison
            $clean_shortcode = strtolower(str_replace(['Fp_Single_', 'Fp_'], ['', ''], $shortcode));
            $clean_shortcode = str_replace('_', '', $clean_shortcode); // Remove underscores for comparison
            
            // Convert function_part to lowercase and clean for comparison
            $clean_function_part = strtolower(str_replace('_', '', $function_part));
            
            if ($clean_shortcode === $clean_function_part) {
                $matched_shortcode = $shortcode;
                break;
            }
        }
        
        // If we found a matching shortcode, use do_shortcode to process it
        if ($matched_shortcode) {
            $shortcode_tag = '[' . $matched_shortcode . ']';
            return do_shortcode($shortcode_tag);
        }
        
        // Try to match common patterns to known shortcodes
        $shortcode_map = [
            'currenttime' => 'Fp_Single_CurrentTime',
            'currentdate' => 'Fp_Single_CurrentDate',
            'nextprayer' => 'Fp_Single_NextPrayer',
            'fajrbegins' => 'Fp_Single_Fajr',
            'sunrisebegins' => 'Fp_Single_Sunrise',
            'dhuhrbegins' => 'Fp_Single_Dhuhr',
            'asrbegins' => 'Fp_Single_Asr',
            'maghribbegins' => 'Fp_Single_Maghrib',
            'ishabegins' => 'Fp_Single_Isha',
        ];
        
        $clean_function_part = strtolower(str_replace('_', '', $function_part));
        
        if (isset($shortcode_map[$clean_function_part])) {
            $shortcode_tag = '[' . $shortcode_map[$clean_function_part] . ']';
            return do_shortcode($shortcode_tag);
        }
        
        // If no match found, return original text
        return $full_match;
    }

    /**
     * Parse dynamic text in headers and other areas
     */
    public function parse_dynamic_text_in_headers(): void {
        // This can be used to parse dynamic content in other contexts
        // For now, we'll focus on content areas
    }

    /**
     * Parse specific dynamic text pattern
     */
    public static function parse_single_pattern(string $pattern): string {
        $parser = new self();
        $matches = [];
        
        if (preg_match('/\bfp_([a-zA-Z_0-9]+)\b/', $pattern, $matches)) {
            return $parser->replace_dynamic_text($matches);
        }
        
        return $pattern;
    }

    /**
     * Get all available dynamic text patterns
     */
    public static function get_available_patterns(): array {
        $patterns = [];

        // Get patterns from ACTIVE_SHORTCODES in ShortCodeMap
        $active_shortcodes = ShortCodeMap::ACTIVE_SHORTCODES;

        foreach ($active_shortcodes as $shortcode => $mapped_value) {
            // Convert shortcode to a clean format for pattern matching
            $clean_shortcode = str_replace(['Fp_Single_', 'Fp_'], ['', ''], $shortcode);
            $clean_shortcode = strtolower($clean_shortcode);
            $clean_shortcode = str_replace(['_Begins_time', '_Iqamah_time', '_Begins', '_Iqamah', '_Name', '_Title'], ['_begins', '_iqamah', '_begins', '_iqamah', '_name', '_title'], $clean_shortcode);

            $patterns[] = 'fp_' . $clean_shortcode;
        }

        // Also include patterns from DynamicContent methods
        $methods = get_class_methods(DynamicContent::class);

        foreach ($methods as &$method) {
            if (strpos($method, 'get_') === 0) {
                $pattern = substr($method, 4); // Remove 'get_' prefix
                if (!in_array('fp_' . $pattern, $patterns)) { // Avoid duplicates
                    $patterns[] = 'fp_' . $pattern;
                }
            }
        }

        return $patterns;
    }
}
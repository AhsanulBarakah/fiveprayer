<?php
namespace FivePrayer\Core\Cache\helpers;

use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;

defined('ABSPATH') || exit;

class ShortcodeCacheChecker {
    private static $instance = null;

    // Private constructor to prevent direct instantiation
    private function __construct() {
        // Removed frequent debug logging to reduce log duplication
    }

    // Get the singleton instance
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function shouldDisableCache() {
        // Removed frequent debug logging to reduce log duplication
        // Only log errors when they occur

        global $post;

        try {
            // Only check for frontend requests
            if (is_admin()) {
                return false;
            }

            // Ensure we're after the main query
            if (!did_action('wp')) {
                return false;
            }

            if (is_feed() || is_preview()) {
                return false;
            }

            if (!$post instanceof \WP_Post || empty($post->post_content)) {
                return false;
            }

            $shortcodes = array_merge(
                array_keys(ShortCodeMap::ACTIVE_SHORTCODES),
                array_keys(ShortCodeMap::DEPRECATED_SHORTCODES),
                ['fiveprayer_widget', 'Fp_TimeTable_Monthly', 'Fp_Vertical_Daily_Prayer']
            );

            foreach ($shortcodes as &$shortcode) {
                if (has_shortcode($post->post_content, $shortcode)) {
                    return true;
                }
            }

        } catch (\Exception $e) {
            // Log error if debugging is enabled
            Logger::error('Error: ' . $e->getMessage(), 'ShortcodeCacheChecker');
            Logger::error('Stack trace: ' . $e->getTraceAsString(), 'ShortcodeCacheChecker');
            return false; // Fail safe - don't disable cache on error
        }

        return false;
    }
}

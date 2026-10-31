<?php
namespace FivePrayer\Core\Helpers;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers;
use FivePrayer\Core\PathService;
use FivePrayer\Core\Security\SecurityHelper;
use Exception;
if (!class_exists(__NAMESPACE__ . '\\FivePrayer_Highlighter')) {

    class FivePrayer_Highlighter {

        private $next_prayer_slug = '';
        private $shortcode_handler;
        private $path_service;
        private static $initialized = false;

        public function __construct() {
            // Prevent multiple initializations
            if (self::$initialized) {
                return;
            }
            
            try {
                if (class_exists(ShortCodesSinglePrayers::class)) {
                    $this->shortcode_handler = ShortCodesSinglePrayers::getInstance();
                    $this->path_service = new PathService();
                    Logger::info('Successfully initialized shortcode handler', 'FivePrayer_Highlighter');
                } else {
                    Logger::error('ShortCodesSinglePrayers class not found', 'FivePrayer_Highlighter');
                }
            } catch (\Exception $e) {
                Logger::error('Failed to initialize shortcode handler - ' . $e->getMessage(), 'FivePrayer_Highlighter');
            }

            // Enqueue on wp_enqueue_scripts (late) so the combined stylesheet and
            // script are registered and the localized data is attached BEFORE the
            // footer scripts are printed. Hooking wp_footer ran after
            // wp_print_footer_scripts, so neither the enqueue nor the
            // wp_localize_script data reached the page. Priority 99 keeps this
            // after the plugin's content/init enqueues so the combined bundle is
            // never loaded twice.
            add_action('wp_enqueue_scripts', [$this, 'init_highlighting'], 99);
            self::$initialized = true;
        }

        public function get_next_prayer_slug() {
            if (!$this->shortcode_handler) {
                SecurityHelper::log_security_event('Shortcode handler not available', 'warning');
                return '';
            }

            try {
                $next_prayer_data = $this->shortcode_handler->getNextPrayerData();
                SecurityHelper::log_security_event('Next prayer data: ' . json_encode($next_prayer_data), 'info');

                if (!isset($next_prayer_data['begins_title'])) {
                    SecurityHelper::log_security_event('Missing begins_title in prayer data', 'warning');
                    return '';
                }

                $begins_title = $next_prayer_data['begins_title'];
                SecurityHelper::log_security_event('Begins title: ' . $begins_title, 'info');

                // Extract prayer name from begins_title (format: "PrayerName Begins")
                // Remove the "Begins" part and any trailing whitespace
                $prayer_name = str_replace([' Begins', ' Iqamah', ' يبدأ', ' إقامة'], '', $begins_title);
                $prayer_name = trim($prayer_name);
                
                SecurityHelper::log_security_event('Extracted prayer name: ' . $prayer_name, 'info');

                // Clean up the prayer name while preserving Unicode characters
                $clean_prayer_name = mb_strtolower($prayer_name);
                SecurityHelper::log_security_event('Cleaned prayer name: ' . $clean_prayer_name, 'info');

                return $clean_prayer_name;
            } catch (Exception $e) {
                SecurityHelper::log_security_event('Error in get_next_prayer_slug: ' . $e->getMessage(), 'error');
                return '';
            }
        }

        public function init_highlighting() {
            $this->next_prayer_slug = $this->get_next_prayer_slug();

            if (!empty($this->next_prayer_slug)) {
                // Always load the script when we have a prayer to highlight
                // The JavaScript will handle finding elements or exiting silently
                
                // Sanitize the prayer name before sending to JS
                $sanitized_slug = SecurityHelper::sanitize_input($this->next_prayer_slug);
                
                // Add cache-busting parameter based on current time
                $cache_buster = fiveprayer_get_asset_version();
                
                // Load the highlight assets from the same combined bundle the rest
                // of the plugin uses (JS included in fiveprayer-combined-js,
                // styling in the combined stylesheet), so the highlight is visible
                // on every theme and page builder with no extra requests.
                if (function_exists('fiveprayer_enqueue_combined_scripts')) {
                    fiveprayer_enqueue_combined_scripts();

                    // Localize script with necessary data for the highlighter functionality
                    wp_localize_script('fiveprayer-combined-js', 'fiveprayerHighlighter', [
                        'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce'),
                        'ajaxUrl' => admin_url('admin-ajax.php'),
                        'nextPrayer' => $sanitized_slug,
                        'timestamp' => $cache_buster
                    ]);
                } else {
                    // Fallback to direct script/style loading if the combined
                    // system is not available (same assets, separate handles).
                    $js_url  = $this->path_service->getFileUrl('php/classes/core/Assets/JS/highlighter.js');
                    $css_url = $this->path_service->getFileUrl('php/classes/core/Assets/CSS/highlighter.css');

                    wp_enqueue_script('fiveprayer-highlighter', $js_url, ['jquery'], $cache_buster, true);
                    wp_enqueue_style('fiveprayer-highlighter', $css_url, [], $cache_buster);

                    // Localize script with necessary data
                    wp_localize_script('fiveprayer-highlighter', 'fiveprayerHighlighter', [
                        'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce'),
                        'ajaxUrl' => admin_url('admin-ajax.php'),
                        'nextPrayer' => $sanitized_slug,
                        'timestamp' => $cache_buster
                    ]);
                }

                SecurityHelper::log_security_event('Highlighter script loaded for prayer: ' . $sanitized_slug, 'info');
            } else {
                SecurityHelper::log_security_event('No prayer slug found for highlighting', 'warning');
            }
        }
    }
}
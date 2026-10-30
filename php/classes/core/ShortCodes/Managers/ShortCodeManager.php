<?php
namespace FivePrayer\Core\ShortCodes\Managers;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;

class ShortCodeManager {
    private $renderer;
    private $triggered = false;

    public function __construct($renderer) {
        $this->renderer = $renderer;
    }

    public function registerShortcodes(): void {
        foreach (ShortCodeMap::ACTIVE_SHORTCODES as $shortcode => $field) {
            add_shortcode($shortcode, [$this, 'handleShortcode']);
        }
        
        foreach (ShortCodeMap::DEPRECATED_SHORTCODES as $shortcode => $field) {
            add_shortcode($shortcode, [$this, 'handleDeprecatedShortcode']);
        }
    }

    public function handleShortcode($atts, $content = null, $tag = ''): string {
        $this->triggered = true;
        
        if (isset(ShortCodeMap::ACTIVE_SHORTCODES[$tag])) {
            // WordPress converts parameter names to lowercase, so we need to check for both formats
            $atts = shortcode_atts([
                'removenextword' => false,    // WordPress converts to lowercase
                'remove_next_word' => false,  // Also check for snake_case
                'removespecificword' => '',   // WordPress converts to lowercase
                'remove_specific_word' => ''  // Also check for snake_case
            ], $atts);
            
            // Check for both formats
            $removeNextWord = !empty($atts['remove_next_word']) 
                ? $atts['remove_next_word'] 
                : $atts['removenextword'];
                
            $removeSpecificWord = !empty($atts['remove_specific_word'])
                ? $atts['remove_specific_word']
                : $atts['removespecificword'];
            
            return $this->renderer->renderShortCode(
                ShortCodeMap::ACTIVE_SHORTCODES[$tag], 
                filter_var($removeNextWord, FILTER_VALIDATE_BOOLEAN),
                sanitize_text_field($removeSpecificWord)
            );
        }

        return '';
    }

    public function handleDeprecatedShortcode($atts, $content = null, $tag = ''): string {
        Logger::warning(sprintf(
            'Deprecated shortcode used: [%s]. Please update to use the new shortcode format.',
            esc_html($tag)
        ), 'ShortCodeManager');

        $this->triggered = true;
        
        if (isset(ShortCodeMap::DEPRECATED_SHORTCODES[$tag])) {
            $atts = shortcode_atts([
                'removeNextWord' => false,
                'removeSpecificWord' => ''
            ], $atts);
            
            return $this->renderer->renderShortCode(
                ShortCodeMap::DEPRECATED_SHORTCODES[$tag], 
                filter_var($atts['removeNextWord'], FILTER_VALIDATE_BOOLEAN),
                sanitize_text_field($atts['removeSpecificWord'])
            );
        }

        return '';
    }

    public function isTriggered(): bool {
        return $this->triggered;
    }
}
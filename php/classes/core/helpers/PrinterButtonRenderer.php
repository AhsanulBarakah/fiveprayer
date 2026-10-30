<?php

namespace FivePrayer\Core\Helpers;

defined('ABSPATH') || exit;

/**
 * Helper class for rendering printer buttons
 */
class PrinterButtonRenderer
{
    /**
     * Render the custom URL button
     * Returns empty string if no URL is set
     * Uses button + JavaScript redirect instead of hyperlink
     */
    public static function renderCustomUrlButton($atts = []): string
    {
        $attributes = shortcode_atts([
            'text' => '',
            'class' => '',
            'show_icon' => 'false',
            'icon' => 'printer',
            'hide_on_print' => 'true',
            'url' => '',
        ], $atts);

        // Get custom URL from settings or attribute
        $custom_url = !empty($attributes['url'])
            ? $attributes['url']
            : PrinterHelper::getPrinterButtonUrl();

        // If no custom URL, return empty
        if (empty($custom_url)) {
            return '';
        }

        // Get button text
        $button_text = !empty($attributes['text'])
            ? $attributes['text']
            : PrinterHelper::getPrinterButtonText();

        if (empty($button_text)) {
            $button_text = __('Printer TimeTable', 'fiveprayer');
        }

        // Build CSS classes - use only theme default classes (no fiveprayer__clickPrint to avoid conflict)
        $css_classes = ['wp-element-button', 'wp-block-button__link'];
        if (!empty($attributes['class'])) {
            $css_classes[] = sanitize_html_class($attributes['class']);
        }
        if ($attributes['hide_on_print'] === 'true') {
            $css_classes[] = 'fiveprayer-hide-on-print';
        }

        // Get icon
        $icon_html = '';
        if ($attributes['show_icon'] === 'true') {
            $icon_html = self::getIconHTML($attributes['icon']);
        }

        // Get current month as fallback
        $current_month = gmdate('n');

        // Generate unique ID for this button instance
        $button_id = 'fiveprayer-custom-url-btn-' . uniqid();

        // Build base URL (without month parameter - will be added by JavaScript)
        $base_url = esc_url($custom_url);

        // Render button with data-base-url attribute for JavaScript handler
        return sprintf(
            '<button id="%1$s" type="button" class="%2$s fiveprayer-custom-url-btn" data-base-url="%3$s">%4$s%5$s</button>',
            $button_id,
            esc_attr(implode(' ', $css_classes)),
            $base_url,
            $icon_html,
            esc_html($button_text)
        );
    }

    /**
     * Render the print button
     * This button prints on the SAME page (does not navigate away)
     * Uses theme default button classes (no fiveprayer__clickPrint to avoid extra styling)
     */
    public static function renderPrintButton($atts = []): string
    {
        $attributes = shortcode_atts([
            'text' => '',
            'class' => '',
            'show_icon' => 'false',
            'icon' => 'printer',
            'hide_on_print' => 'true',
        ], $atts);

        // Get button text
        $button_text = !empty($attributes['text'])
            ? $attributes['text']
            : PrinterHelper::getPrinterButtonText();

        if (empty($button_text)) {
            $button_text = __('Printer TimeTable', 'fiveprayer');
        }

        // Build CSS classes - use only theme default classes (same as renderCustomUrlButton)
        $css_classes = ['wp-element-button', 'wp-block-button__link'];
        if (!empty($attributes['class'])) {
            $css_classes[] = sanitize_html_class($attributes['class']);
        }
        if ($attributes['hide_on_print'] === 'true') {
            $css_classes[] = 'fiveprayer-hide-on-print';
        }

        // Get icon
        $icon_html = '';
        if ($attributes['show_icon'] === 'true') {
            $icon_html = self::getIconHTML($attributes['icon']);
        }

        // Generate unique ID for this button instance
        $button_id = 'fiveprayer-print-btn-' . uniqid();

        // Render button with inline JavaScript to print on same page
        return sprintf(
            '<button id="%s" type="button" class="%s" data-fiveprayer-shortcode-print="true">%s%s</button>
            <script>
            (function() {
                var btn = document.getElementById("%s");
                if (!btn) return;

                btn.addEventListener("click", function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();

                    if (e.cancelable) {
                        e.cancelBubble = true;
                    }

                    if (typeof FP_printTimetable === "function") {
                        FP_printTimetable();
                    } else {
                        window.print();
                    }

                    return false;
                }, true);

                var form = btn.closest("form");
                if (form) {
                    form.addEventListener("submit", function(e) {
                        e.preventDefault();
                        e.stopPropagation();
                        return false;
                    });
                }
            })();
            </script>',
            $button_id,
            esc_attr(implode(' ', $css_classes)),
            $icon_html,
            esc_html($button_text),
            $button_id
        );
    }

    /**
     * Get icon HTML
     */
    private static function getIconHTML($icon_type): string
    {
        $icons = [
            'printer' => '<svg class="fiveprayer-printer-icon" style="width:1em;height:1em;vertical-align:-0.125em;margin-right:0.25em;" viewBox="0 0 24 24" fill="currentColor"><path d="M19 8h-1V3H6v5H5c-1.66 0-3 1.34-3 3v6h3v4h14v-4h3v-6c0-1.66-1.34-3-3-3zM8 5h8v3H8V5zm8 12v2H8v-4h8v2zm2-2v-2H6v2H4v-4c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v4h-2z"/><circle cx="18" cy="11.5" r="1"/></svg>',
            'download' => '<svg class="fiveprayer-download-icon" style="width:1em;height:1em;vertical-align:-0.125em;margin-right:0.25em;" viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>',
            'calendar' => '<svg class="fiveprayer-calendar-icon" style="width:1em;height:1em;vertical-align:-0.125em;margin-right:0.25em;" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>',
        ];

        return $icons[$icon_type] ?? $icons['printer'];
    }

    /**
     * Output global CSS for custom URL buttons (applies to both calendar and shortcode)
     * CSS is loaded from prayer-styles.css
     */
    public static function outputGlobalStyles()
    {
        // CSS is already loaded from prayer-styles.css
        // No inline styles needed
    }
}

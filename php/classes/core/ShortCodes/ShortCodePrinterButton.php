<?php

namespace FivePrayer\Core\ShortCodes;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrinterButtonRenderer;

if (!class_exists(__NAMESPACE__ . '\ShortCodePrinterButton')) {
    /**
     * ShortCodePrinterButton Class
     * 
     * Handles two shortcodes:
     * - [Fp_Printer_Button]: Renders a print button that prints the calendar on the same page (default functionality).
     * - [Fp_Printer_Button_URL]: Renders a custom URL button that redirects to another page with the selected month
     *   as a query parameter (?print_month=). This replaces the default print functionality when enabled in settings.
     * 
     * When "Show Custom URL Button" is enabled in the admin settings, the calendar will display the custom URL button
     * instead of the print button. Clicking the custom URL button redirects the user to the specified URL with the
     * selected month appended as a parameter, allowing for cross-page printing or custom workflows.
     * 
     * Auto-Print Page URL:
     * You can set a dedicated print page URL in the admin settings. When a visitor lands on that URL with the
     * ?print_month= parameter, the print dialog will automatically open.
     * 
     * How it works:
     * • Make sure this page has the timetable calendar shortcode (`[Fp_TimeTable_Monthly]` or block).
     * • When visitors go to your designated print page (e.g., /printer/), the print dialog will automatically open.
     * • Use this for dedicated print-only pages.
     * • Set your custom URL button to redirect to this page for automatic printing.
     */
    class ShortCodePrinterButton
    {
        public function __construct()
        {
            add_action('init', [$this, 'registerShortcode']);
            add_action('wp_enqueue_scripts', [$this, 'enqueueScripts']);
        }

        public function registerShortcode()
        {
            add_shortcode('Fp_Printer_Button', [$this, 'renderPrinterButton']);
            add_shortcode('Fp_Printer_Button_URL', [$this, 'renderPrinterButtonUrl']);
        }

        public function enqueueScripts()
        {
            // Any page that renders a FivePrayer shortcode already loads the
            // combined bundle, which contains PrintCalendar.js and the printer
            // styles. Nothing more to do there.
            if (function_exists('fiveprayer_has_shortcode_on_page') && fiveprayer_has_shortcode_on_page()) {
                return;
            }

            // Otherwise only load the printer assets when this page actually
            // renders a printer button, so pages without one stay asset-free.
            if (!$this->pageHasPrinterButton()) {
                return;
            }

            $this->enqueuePrinterAssets();
        }

        /**
         * Whether the current view contains a printer button shortcode.
         *
         * Builder/block embeds are not part of post_content, so they are
         * covered by the render-time enqueue inside the shortcode callbacks
         * instead of this content scan.
         */
        private function pageHasPrinterButton(): bool
        {
            global $post;

            if (!is_a($post, 'WP_Post') || empty($post->post_content)) {
                return false;
            }

            return has_shortcode($post->post_content, 'Fp_Printer_Button')
                || has_shortcode($post->post_content, 'Fp_Printer_Button_URL');
        }

        /**
         * Enqueue the printer styles + PrintCalendar.js through the FivePrayer
         * combined asset cache.
         *
         * The combined bundle already contains both files, so serving it keeps
         * every printer asset cached in one fingerprinted request and removes
         * the duplicate standalone <script>/<link> the page used to emit. The
         * individual files are only used as a fallback when the AssetManager/(
         * combiner) is unavailable.
         */
        private function enqueuePrinterAssets(): void
        {
            if (function_exists('fiveprayer_enqueue_combined_scripts')) {
                fiveprayer_enqueue_combined_scripts();
                return;
            }

            $css_path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'php/classes/core/ShortCodes/css/prayer-styles.css';
            $css_url = plugins_url('php/classes/core/ShortCodes/css/prayer-styles.css', FIVEPRAYER_PLUGIN_FILE);

            if (!wp_style_is('fiveprayer-printer-styles', 'registered')) {
                $version = file_exists($css_path) ? filemtime($css_path) : (function_exists('fiveprayer_get_asset_version') ? fiveprayer_get_asset_version() : '1.0.0');
                wp_register_style('fiveprayer-printer-styles', $css_url, [], $version);
            }
            wp_enqueue_style('fiveprayer-printer-styles');

            $script_path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'php/classes/core/Calendar/JS/PrintCalendar.js';
            $script_url = plugins_url('php/classes/core/Calendar/JS/PrintCalendar.js', FIVEPRAYER_PLUGIN_FILE);

            if (!wp_script_is('fiveprayer-print-calendar', 'registered')) {
                $version = file_exists($script_path) ? filemtime($script_path) : (function_exists('fiveprayer_get_asset_version') ? fiveprayer_get_asset_version() : '1.0.0');
                wp_register_script('fiveprayer-print-calendar', $script_url, [], $version, true);
            }
            wp_enqueue_script('fiveprayer-print-calendar');
        }

        /**
         * Render the print button shortcode: [Fp_Printer_Button]
         * This button prints the calendar on the same page using the default print functionality.
         * The 'url' attribute is ignored for this shortcode.
         */
        public function renderPrinterButton($atts)
        {
            // Ensure the cached assets are present even on builder/block
            // embeds where the shortcode is not in post_content.
            $this->enqueuePrinterAssets();

            $attributes = shortcode_atts([
                'text' => '',
                'class' => '',
                'show_icon' => 'false',
                'icon' => 'printer',
                'hide_on_print' => 'true',
                'url' => '',
            ], $atts);

            // Always render print button (prints on same page, does not navigate)
            // The 'url' attribute is ignored for this shortcode
            return PrinterButtonRenderer::renderPrintButton($attributes);
        }

        /**
         * Render the custom URL button shortcode: [Fp_Printer_Button_URL]
         * This button redirects to a custom URL with the selected month as a parameter (?print_month=).
         * Replaces the default print functionality when "Show Custom URL Button" is enabled in settings.
         */
        public function renderPrinterButtonUrl($atts)
        {
            // Ensure the cached assets are present even on builder/block
            // embeds where the shortcode is not in post_content.
            $this->enqueuePrinterAssets();

            return PrinterButtonRenderer::renderCustomUrlButton($atts);
        }
    }
}

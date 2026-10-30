<?php
namespace FivePrayer\Core;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit; // Prevent direct access

use FivePrayer\Core\ShortCodes\Managers\StyleManager;
use FivePrayer\Core\Assets\AssetManager;

class initRegister {
    public function __construct() {
        // Build and register the combined stylesheet AFTER the asset manager
        // has been populated and the combined files generated. FivePrayerScripts
        // registers every front-end CSS/JS file and builds the bundles on
        // `init`:15; this hook runs at `init`:25 so `fiveprayer-default-style`
        // always points at a bundle that includes the complete file list. The
        // previous `init`:10 ordering built the CSS bundle before the later
        // registrations, so those files were silently left out.
        add_action('init', [$this, 'registerDefaultStyle'], 25);
        // Clear CSS cache when settings are updated
        add_action('update_option_fiveprayer_settings', [$this, 'clearStyleCache']);
        add_action('update_option_fiveprayer_style_settings', [$this, 'clearStyleCache']);
    }

    public function clearStyleCache() {
        // Update style version to force cache refresh
        update_option('fiveprayer_style_version', time());
        // Removed excessive logging to reduce duplication - only log errors
        // Logger::info('Cleared style cache', 'initRegister');
    }

    /**
     * Register (and conditionally enqueue) the combined front-end stylesheet.
     *
     * The stylesheet is registered on every front-end request so block and
     * shortcode code can depend on the `fiveprayer-default-style` handle; it is
     * enqueued only on pages that actually render FivePrayer output.
     *
     * @return void
     */
    public function registerDefaultStyle(): void {
        // Mirror the combiner's own guard: the AssetManager is only populated
        // on regular front-end requests.
        if (is_admin() || wp_doing_ajax() || wp_doing_cron() || (defined('REST_REQUEST') && REST_REQUEST)) {
            return;
        }

        $asset_manager = AssetManager::getInstance();
        $combined_css_url = $asset_manager->getCombinedCssUrl();

        if ($combined_css_url) {
            wp_register_style(
                'fiveprayer-default-style',
                $combined_css_url,
                [],
                time() // Use current time to ensure freshness during development
            );

            // Enqueue the combined stylesheet (and its dynamic colors, plus the
            // combined scripts) only on pages that actually render FivePrayer
            // output, so unrelated pages stay untouched. Detection is
            // builder-aware (post content *and* the layout a builder keeps in
            // post meta) so a shortcode dropped into Elementor/Breakdance/etc.
            // loads the bundle in the head like any other page.
            add_action('wp_enqueue_scripts', function () {
                global $post;
                if (!is_a($post, 'WP_Post') || !fiveprayer_post_has_shortcode($post)) {
                    return;
                }

                // One stylesheet, one handle: this enqueues the bundle and adds
                // the dynamic colour/border variables to it once.
                try {
                    StyleManager::getInstance()->enqueueStyles();
                } catch (\Exception $e) {
                    Logger::error('StyleManager Error: ' . $e->getMessage(), 'initRegister');
                }

                // The bundle's filename already carries a content hash (see
                // AssetManager), so a stable version string is correct here. The
                // previous time()-based value changed on every request and
                // stopped browsers from caching the stylesheet at all.
                wp_style_add_data('fiveprayer-default-style', 'version', fiveprayer_get_asset_version());

                // Use the central function to enqueue combined scripts
                fiveprayer_enqueue_combined_scripts();
            });
        } else {
            // Fallback to original CSS file if asset manager fails
            $css_path = plugin_dir_path(__FILE__) . 'ShortCodes/css/prayer-styles.css';
            $css_url = plugins_url('ShortCodes/css/prayer-styles.css', __FILE__);

            if (file_exists($css_path)) {
                wp_register_style(
                    'fiveprayer-default-style',
                    $css_url,
                    [],
                    filemtime($css_path)
                );

                Logger::warning('AssetManager failed to combine CSS files, using fallback', 'initRegister');
            } else {
                Logger::error('CSS file not found at initRegister: ' . $css_path, 'initRegister');
            }
        }
    }
}

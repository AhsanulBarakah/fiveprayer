<?php

namespace FivePrayer\Core\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Shared admin/editor script and style registration helpers.
 *
 * The TEXT_DOMAIN constant lives on the composing class (Assets) instead of
 * here: constants inside traits are only allowed from PHP 8.2 onward, and this
 * plugin supports PHP 7.4.
 */
trait AdminAssetsTrait
{
    /**
     * Add the wp-i18n dependency to a script handle's dependency list.
     *
     * The admin bundle imports @wordpress/i18n, which webpack rewrites to the
     * wp.i18n global. Declaring the dependency guarantees that global is present
     * regardless of how the bundle was built.
     *
     * @param array<int, string> $deps Existing script dependencies.
     * @return array<int, string> Dependencies including wp-i18n.
     */
    private function with_i18n_dependency(array $deps): array
    {
        if (!in_array('wp-i18n', $deps, true)) {
            $deps[] = 'wp-i18n';
        }

        return $deps;
    }

    /**
     * Absolute path of the directory holding the plugin's translation files.
     *
     * wp_set_script_translations() reads the JSON files generated from the POT
     * with `wp i18n make-json` out of this directory.
     */
    private function getLanguagesPath(): string
    {
        return $this->path_service->getFileFullPath('languages');
    }

    public function enqueue_admin_page_assets(): void
    {
        static $timezone_data = null;
        if ($timezone_data === null) {
            static $cached_gmt_offset = null;
            static $cached_timezone_string = null;

            if ($cached_gmt_offset === null) {
                $cached_gmt_offset = get_option('gmt_offset', 0);
            }

            if ($cached_timezone_string === null) {
                $cached_timezone_string = get_option('timezone_string', '');
            }

            $timezone_data = [
                'gmt_offset' => $cached_gmt_offset,
                'timezone_string' => $cached_timezone_string,
                'current_time' => current_time('Y-m-d H:i:s'),
                'current_timestamp' => current_time('timestamp'),
            ];
        }

        $mode = \FivePrayer\Core\Security\SecurityHelper::has_query_arg('fp_assets')
            ? \FivePrayer\Core\Security\SecurityHelper::get_sanitized_get_input('fp_assets')
            : apply_filters('fiveprayer_admin_asset_mode', 'enqueue');

        if ($mode === 'tags') {
            $this->output_admin_tags('build-admin', $timezone_data);
            return;
        }

        echo '<script>window.FivePrayerData = ' . wp_json_encode([
            'ajaxUrl'      => esc_url(admin_url('admin-ajax.php')),
            'adminUrl'     => esc_url(admin_url('admin.php')),
            'Site_title'   => sanitize_text_field(get_bloginfo('name')),
            'Site_tagline' => sanitize_text_field(get_bloginfo('description')),
            'Current_user' => wp_get_current_user()->display_name,
            'wordpress_timezone' => $timezone_data,
            // The site's time format (e.g. `g:i:s a`). The admin JavaScript
            // renders the Vertical Today "Current Local Time" preview with it,
            // so the clock matches the front end instead of a hard-coded shape.
            'time_format'  => get_option('time_format', 'h:i A'),
            // The site's own address. Admin help screens use it to show the
            // user's real host and port in examples instead of hard-coding one.
            'siteUrl'      => esc_url(home_url()),
            // Share on Local Network (sharing the site on the local network) state
            // plus the nonce the TV Display Mode page needs to save it.
            'localTesting' => \FivePrayer\Core\Admin\LocalTestingMode::get_admin_state(),
            // TV Display Mode state: the two switches (Pages and Posts) that
            // decide whether the "Enable TV Mode" checkbox is offered in
            // that editor at all, plus the nonce that saves them.
            'tvDisplay'    => \FivePrayer\Core\Admin\TVDisplayMode::get_admin_state(),
            // The two editor-only design aids of the TV Display Mode page —
            // Canvas Force and the Safe Zone Guide — each with its own switch
            // plus the nonce and action that save them.
            'tvCanvas'     => \FivePrayer\Core\Admin\TvCanvasLocker::get_admin_state(),
        ]) . ';</script>';

        echo '<script>
        window.addEventListener("error", function(e) {
            if (e.message && e.message.includes("ChunkLoadError")) {
                console.error("FivePrayer: Failed to load a required JavaScript chunk:", e.filename);
                if (typeof jQuery !== "undefined") {
                    jQuery("body").append(
                        \'<div class="notice notice-error is-dismissible" style="margin: 20px;">\'+
                        \'<p><strong>FivePrayer Plugin Error:</strong> Failed to load required JavaScript components. \'+
                        \'Please try refreshing the page. If the issue persists, try rebuilding the plugin assets.</p>\'+
                        \'</div>\'
                    );
                }
            }
        }, true);
        </script>';

        $this->enqueue_admin_scripts('build-admin', $timezone_data);

        $css_path = $this->path_service->getFileFullPath('build-admin/index.css');
        if (file_exists($css_path)) {
            wp_enqueue_style(
                'fiveprayer-style',
                $this->path_service->getFileUrl('build-admin/index.css'),
                [],
                filemtime($css_path)
            );
        }
    }

    private function enqueue_admin_scripts($build_dir, $timezone_data = [])
    {
        $build_path = $this->path_service->getFileFullPath($build_dir);
        if (!is_dir($build_path)) {
            Logger::error('Build directory does not exist: ' . $build_path, 'Assets');
            return;
        }

        $asset_files = glob($build_path . '/*.asset.php') ?: [];
        if (!empty($asset_files)) {
            natsort($asset_files);
            $asset_files = array_values($asset_files);
            $localized = false;
            foreach ($asset_files as &$asset_file) {
                $base = basename($asset_file, '.asset.php');
                $js_path = $build_path . '/' . $base . '.js';
                if (!file_exists($js_path)) {
                    continue;
                }
                $handle = 'fiveprayer-' . sanitize_key($base);
                $deps = [];
                // Use the JS file's modification time as the cache buster.
                // The `asset.php` content hash only covers the entry chunk —
                // lazy-loaded chunks (where most calculation logic lives) are
                // NOT part of that hash, so the entry version would stay the
                // same between builds and WordPress/browsers would keep
                // serving the OLD cached chunks (a recurring stale-bundle bug).
                // filemtime() changes on every build, so the new chunks are
                // always fetched.
                $ver = filemtime($js_path);
                $asset = null;

                if (file_exists($asset_file)) {
                    $asset = include $asset_file;
                }

                if (is_array($asset)) {
                    if (!empty($asset['dependencies']) && is_array($asset['dependencies'])) {
                        $deps = $asset['dependencies'];
                    }
                }

                $deps = $this->with_i18n_dependency($deps);

                wp_enqueue_script(
                    $handle,
                    $this->path_service->getFileUrl($build_dir . '/' . $base . '.js'),
                    $deps,
                    $ver,
                    true
                );

                wp_set_script_translations($handle, self::TEXT_DOMAIN, $this->getLanguagesPath());

                if (!$localized) {
                    wp_localize_script($handle, 'prayerData', [
                        'nonce' => wp_create_nonce('wp_rest'),
                    ]);
                    $localized = true;
                }
            }
            return;
        }

        $index_js  = $build_path . '/index.js';
        if (!file_exists($index_js)) {
            Logger::error('Main index.js file does not exist: ' . $index_js, 'Assets');
            return;
        }

        $handle = 'fiveprayer-index';
        // The admin bundle carries its own React 19 (react-router v8 requires
        // it, WordPress still ships React 18), so it must NOT depend on
        // wp-element — that would load a second, unused React on the page.
        $deps   = ['wp-api-fetch'];
        $asset_file = $build_path . '/index.asset.php';

        if (file_exists($asset_file)) {
            $asset = include $asset_file;
            if (is_array($asset) && !empty($asset['dependencies'])) {
                $deps = $asset['dependencies'];
            }
        }

        $deps = $this->with_i18n_dependency($deps);

        wp_enqueue_script(
            $handle,
            $this->path_service->getFileUrl($build_dir . '/index.js'),
            $deps,
            filemtime($index_js),
            true
        );

        wp_set_script_translations($handle, self::TEXT_DOMAIN, $this->getLanguagesPath());

        wp_localize_script($handle, 'prayerData', [
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        $css_path = $this->path_service->getFileFullPath($build_dir . '/index.css');
        if (file_exists($css_path)) {
            wp_enqueue_style(
                'fiveprayer-style',
                $this->path_service->getFileUrl($build_dir . '/index.css'),
                [],
                filemtime($css_path)
            );
        }
    }

    private function output_admin_tags(string $build_dir, array $timezone_data): void
    {
        $index_js_path  = $this->path_service->getFileFullPath($build_dir . '/index.js');
        $index_css_path = $this->path_service->getFileFullPath($build_dir . '/index.css');

        echo '<script>window.FivePrayerData = ' . wp_json_encode([
            'ajaxUrl'      => esc_url(admin_url('admin-ajax.php')),
            'adminUrl'     => esc_url(admin_url('admin.php')),
            'Site_title'   => sanitize_text_field(get_bloginfo('name')),
            'Site_tagline' => sanitize_text_field(get_bloginfo('description')),
            'Current_user' => wp_get_current_user()->display_name,
            'wordpress_timezone' => $timezone_data,
            // See the matching note in the main admin bootstrap: the preview
            // clock follows the site's time format, not a hard-coded one.
            'time_format'  => get_option('time_format', 'h:i A'),
            // See the matching note in the main admin bootstrap: help screens
            // resolve the user's real address/port from this value.
            'siteUrl'      => esc_url(home_url()),
            'nonce' => wp_create_nonce('wp_rest'),
            // See the matching note in the main admin bootstrap.
            'localTesting' => \FivePrayer\Core\Admin\LocalTestingMode::get_admin_state(),
            // See the matching note in the main admin bootstrap.
            'tvDisplay'    => \FivePrayer\Core\Admin\TVDisplayMode::get_admin_state(),
            // See the matching note in the main admin bootstrap.
            'tvCanvas'     => \FivePrayer\Core\Admin\TvCanvasLocker::get_admin_state(),
        ]) . ';</script>';

        if (file_exists($index_css_path)) {
            $href = $this->path_service->getFileUrl($build_dir . '/index.css');
            $ver  = filemtime($index_css_path);
            wp_register_style('fiveprayer-admin-tags-style', $href, [], $ver);
            wp_enqueue_style('fiveprayer-admin-tags-style');
            wp_style_add_data('fiveprayer-admin-tags-style', 'preload', true);
        }

        if (file_exists($index_js_path)) {
            $src = $this->path_service->getFileUrl($build_dir . '/index.js');
            $ver = filemtime($index_js_path);

            // This fallback path registers the bundle without reading
            // index.asset.php, so its dependencies are declared by hand. wp-i18n
            // is required because the admin bundle translates its own strings,
            // and wp-element must stay out: React ships inside the bundle.
            $handle = 'fiveprayer-admin-tags-script';
            $deps   = $this->with_i18n_dependency(['wp-api-fetch']);

            wp_register_script($handle, $src, $deps, $ver, true);
            wp_enqueue_script($handle);
            wp_script_add_data($handle, 'strategy', 'defer');

            wp_set_script_translations($handle, self::TEXT_DOMAIN, $this->getLanguagesPath());
        }
    }
}

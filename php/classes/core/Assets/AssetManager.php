<?php
/**
 * Asset Manager for FivePrayer Plugin
 * 
 * Combines and minifies CSS and JavaScript files to reduce HTTP requests
 */

namespace FivePrayer\Core\Assets;

defined('ABSPATH') || exit;

class AssetManager {
    
    private static $instance = null;
    private $css_files = [];
    private $js_files = [];
    private $combined_css_url = '';
    private $combined_js_url = '';
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    /**
     * Register CSS files for combination.
     *
     * Duplicate paths are ignored and, if a combined bundle was already built,
     * its cached URL is dropped so the next call rebuilds it from the complete
     * list. This makes registration order-independent: several components may
     * add files on different hooks and the final bundle still contains them all.
     *
     * @param string|string[] $files Absolute file path(s) to combine.
     * @return void
     */
    public function registerCssFiles($files) {
        if ($this->mergeFiles($files, $this->css_files)) {
            $this->combined_css_url = '';
        }
    }

    /**
     * Register JS files for combination.
     *
     * @see AssetManager::registerCssFiles() for the dedupe/invalidation rules.
     *
     * @param string|string[] $files Absolute file path(s) to combine.
     * @return void
     */
    public function registerJsFiles($files) {
        if ($this->mergeFiles($files, $this->js_files)) {
            $this->combined_js_url = '';
        }
    }

    /**
     * Append unique, non-empty file paths to a registration list.
     *
     * @param string|string[] $files  File path(s) to append.
     * @param string[]        $target Registration list, modified in place.
     * @return bool True when at least one new path was appended.
     */
    private function mergeFiles($files, array &$target): bool {
        if (!is_array($files)) {
            $files = [$files];
        }

        $added = false;
        foreach ($files as $file) {
            if (!is_string($file) || '' === $file) {
                continue;
            }
            if (!in_array($file, $target, true)) {
                $target[] = $file;
                $added = true;
            }
        }

        return $added;
    }
    
    /**
     * Get combined CSS URL
     */
    public function getCombinedCssUrl() {
        if (empty($this->combined_css_url)) {
            $this->combined_css_url = $this->combineAndMinifyCss();
        }
        return $this->combined_css_url;
    }
    
    /**
     * Get combined JS URL
     */
    public function getCombinedJsUrl() {
        if (empty($this->combined_js_url)) {
            $this->combined_js_url = $this->combineAndMinifyJs();
        }
        return $this->combined_js_url;
    }
    
    /**
     * Combine and minify CSS files
     */
    private function combineAndMinifyCss() {
        $combined_content = '';
        // Generated assets live in the uploads directory: plugin folders are
        // removed on upgrade, so they must not be written next to the plugin.
        $uploads = wp_upload_dir();
        // Include the newest source mtime in the filename so a changed asset
        // produces a new URL, busting browser, CDN, and page-cache copies.
        $cache_name = 'fiveprayer-combined-' . md5(serialize($this->css_files) . '|' . $this->getFilesStamp($this->css_files)) . '.css';
        $cache_file = trailingslashit($uploads['basedir']) . 'fiveprayer-cache/' . $cache_name;
        $cache_url = trailingslashit($uploads['baseurl']) . 'fiveprayer-cache/' . $cache_name;

        // Check if cache exists and is still valid
        if (file_exists($cache_file) && $this->isCacheValid($cache_file, $this->css_files)) {
            return $cache_url;
        }

        // Combine all CSS files
        foreach ($this->css_files as $css_file) {
            if (file_exists($css_file)) {
                // Cache file contents to improve performance
                $cache_key = 'fp_asset_content_' . md5($css_file);
                $content = wp_cache_get($cache_key, 'fiveprayer');

                if ($content === false) {
                    $content = file_get_contents($css_file);
                    $content = $this->minifyCss($content);
                    wp_cache_set($cache_key, $content, 'fiveprayer', 300); // Cache for 5 minutes
                }

                // Fix relative paths in CSS
                $content = $this->fixRelativePaths($content, dirname($css_file));

                $combined_content .= $content . "\n";
            }
        }

        // Ensure cache directory exists
        $cache_dir = dirname($cache_file);
        if (!file_exists($cache_dir)) {
            wp_mkdir_p($cache_dir);
        }

        // Write combined content to cache file
        file_put_contents($cache_file, $combined_content);

        return $cache_url;
    }
    
    /**
     * Combine and minify JS files
     */
    private function combineAndMinifyJs() {
        $combined_content = '';
        // Generated assets live in the uploads directory: plugin folders are
        // removed on upgrade, so they must not be written next to the plugin.
        $uploads = wp_upload_dir();
        // Include the newest source mtime in the filename so a changed asset
        // produces a new URL, busting browser, CDN, and page-cache copies.
        $cache_name = 'fiveprayer-combined-' . md5(serialize($this->js_files) . '|' . $this->getFilesStamp($this->js_files)) . '.js';
        $cache_file = trailingslashit($uploads['basedir']) . 'fiveprayer-cache/' . $cache_name;
        $cache_url = trailingslashit($uploads['baseurl']) . 'fiveprayer-cache/' . $cache_name;

        // Check if cache exists and is still valid
        if (file_exists($cache_file) && $this->isCacheValid($cache_file, $this->js_files)) {
            return $cache_url;
        }

        // Combine all JS files
        foreach ($this->js_files as $js_file) {
            if (file_exists($js_file)) {
                // Cache file contents to improve performance
                $cache_key = 'fp_js_asset_content_' . md5($js_file);
                $content = wp_cache_get($cache_key, 'fiveprayer');

                if ($content === false) {
                    $content = file_get_contents($js_file);
                    wp_cache_set($cache_key, $content, 'fiveprayer', 300); // Cache for 5 minutes
                }
                
                // Check if we should use ESI-optimized version when available
                if (basename($js_file) === 'dynamic-content-loader.js') {
                    // Look for ESI-optimized version
                    $esi_js_file = str_replace('dynamic-content-loader.js', 'esi-dynamic-content-loader.js', $js_file);
                    if (file_exists($esi_js_file)) {
                        // Cache ESI file contents to improve performance
                        $esi_cache_key = 'fp_esi_asset_content_' . md5($esi_js_file);
                        $esi_content = wp_cache_get($esi_cache_key, 'fiveprayer');

                        if ($esi_content === false) {
                            $esi_content = file_get_contents($esi_js_file);
                            wp_cache_set($esi_cache_key, $esi_content, 'fiveprayer', 300); // Cache for 5 minutes
                        }
                        $content = $esi_content;
                    }
                }
                
                $content = $this->minifyJs($content);
                $combined_content .= $content . "\n";
            }
        }

        // Ensure cache directory exists
        $cache_dir = dirname($cache_file);
        if (!file_exists($cache_dir)) {
            wp_mkdir_p($cache_dir);
        }

        // Write combined content to cache file
        file_put_contents($cache_file, $combined_content);

        return $cache_url;
    }
    
    /**
     * Minify CSS content
     */
    private function minifyCss($css) {
        // Remove comments
        $css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);
        
        // Remove tabs, spaces, newlines, etc.
        $css = str_replace(["\r\n", "\r", "\n", "\t", '  ', '    ', '    '], '', $css);
        
        // Remove space after colons
        $css = str_replace(': ', ':', $css);
        
        // Remove space around braces
        $css = str_replace([' {', '{ ', ' }', '} ', '; '], ['{', '{', '}', '}', ';'], $css);
        
        return $css;
    }
    
    /**
     * Minify JS content
     */
    private function minifyJs($js) {
        // Simple minification - remove comments and whitespace
        $js = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $js); // Remove multiline comments
        $js = preg_replace('!//[^\n]*!', '', $js); // Remove single line comments
        $js = preg_replace('/\s+/', ' ', $js); // Replace multiple whitespace with single space
        // Remove space around operators. Braces are deliberately left out: this
        // is a blunt regex rather than a parser, so it also rewrites the inside
        // of strings and template literals. Trimming next to "}" used to eat
        // the space in a template literal such as "...} ${value}", which glued
        // the AM/PM marker to the clock digits on the front end ("1:47pm")
        // while the admin preview, built by webpack, kept "1:47 pm".
        $js = preg_replace('/\s*([:;,>+])\s*/', '$1', $js);
        
        return trim($js);
    }
    
    /**
     * Fix relative paths in CSS files
     */
    private function fixRelativePaths($css, $base_dir) {
        // Fix url() paths in CSS
        $css = preg_replace_callback('/url\(["\']?([^"\')]+)["\']?\)/', function($matches) use ($base_dir) {
            $path = $matches[1];

            // Skip if it's an absolute path or external URL
            if (strpos($path, 'http') === 0 || strpos($path, '//') === 0 || strpos($path, '/') === 0) {
                return $matches[0];
            }

            // Convert relative path to absolute
            $absolute_path = realpath($base_dir . '/' . $path);
            if ($absolute_path) {
                $relative_to_content = str_replace(WP_CONTENT_DIR, '', $absolute_path);
                return 'url("' . content_url($relative_to_content) . '")';
            }

            return $matches[0];
        }, $css);

        return $css;
    }
    
    /**
     * Newest modification time across the given source files.
     *
     * Used to fingerprint the combined asset filename so that editing any
     * source file yields a new URL instead of relying on a plugin-version
     * query string that may not change.
     *
     * @param array $files Absolute source file paths.
     * @return int Unix timestamp (0 when no file exists).
     */
    private function getFilesStamp($files) {
        $stamp = 0;
        if (is_array($files)) {
            foreach ($files as $file) {
                if (file_exists($file)) {
                    $stamp = max($stamp, (int) filemtime($file));
                }
            }
        }
        return $stamp;
    }

    /**
     * Check if cache is still valid
     */
    private function isCacheValid($cache_file, $source_files) {
        $cache_mtime = filemtime($cache_file);
        
        foreach ($source_files as &$source_file) {
            if (file_exists($source_file) && filemtime($source_file) > $cache_mtime) {
                return false; // Source file is newer than cache
            }
        }
        
        return true;
    }
    
    /**
     * Clear asset cache
     */
    public function clearCache() {
        $uploads = wp_upload_dir();
        $cache_dir = trailingslashit($uploads['basedir']) . 'fiveprayer-cache/';

        if (file_exists($cache_dir)) {
            $files = glob($cache_dir . 'fiveprayer-combined-*');
            foreach ($files as &$file) {
                wp_delete_file($file);
            }
        }
    }
}

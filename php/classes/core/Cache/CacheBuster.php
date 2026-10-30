<?php
namespace FivePrayer\Core\Cache;

defined('ABSPATH') || exit;

class CacheBuster {
    private $cache_buster;
    private static $instance = null;
    
    // When enabled, a stable cache-friendly version token is appended
    // instead of a per-request random one (see __construct).
    private static $enabled = true;

    private function __construct() {
        // Stable, cache-friendly version token.
        //
        // The combined JS/CSS bundles are already fingerprinted by their source
        // modification times (AssetManager::getFilesStamp), and the plugin
        // version changes on every release, so appending a fresh random value
        // per request only stopped browsers, CDNs and page-cache plugins from
        // ever caching these files. Use the plugin version instead so the URLs
        // stay cacheable while still changing on a release.
        $this->cache_buster = function_exists('fiveprayer_get_plugin_version')
            ? (string) fiveprayer_get_plugin_version()
            : '1.0.0';
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function addToAssetUrl($src, $handle) {
        // Only process fiveprayer assets
        if (strpos($handle, 'fiveprayer') === false) {
            return $src;
        }
        
        // Allow development to opt back into per-request busting.
        if (!self::$enabled) {
            return $src;
        }

        // Remove any existing version parameter
        $src = remove_query_arg('ver', $src);
        
        // Append the stable version token.
        return add_query_arg('ver', $this->cache_buster, $src);
    }

    public static function bust() {
        // Kept for callers that just want the current timestamp; the version
        // token itself is now stable (see __construct).
        return time();
    }
    
    public static function setEnabled($enabled) {
        self::$enabled = (bool) $enabled;
    }
}

<?php
namespace FivePrayer\Core\Cache;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

use FivePrayer\Core\Cache\CacheBuster;

class CacheControl {
    private static $instance = null;
    private $buster;
    private static $initialized = false;

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct() {
        if (self::$initialized) {
            return;
        }
        
        $this->buster = CacheBuster::getInstance();
        
        // Add cache busting for assets
        add_filter('script_loader_src', [$this->buster, 'addToAssetUrl'], 10, 2);
        add_filter('style_loader_src', [$this->buster, 'addToAssetUrl'], 10, 2);
        
        self::$initialized = true;
    }
    
    public static function bustCache() {
        return time();
    }
}

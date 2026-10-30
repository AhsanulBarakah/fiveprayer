<?php
namespace FivePrayer\Core\Cache;

use FivePrayer\Core\Cache\helpers\ShortcodeCacheChecker;

defined('ABSPATH') || exit;

class StandardCacheControl {
    public function init() {
        if (!ShortcodeCacheChecker::getInstance()->shouldDisableCache()) {
            return;
        }

        add_filter('rocket_override_donotcachepage', '__return_true');
        add_filter('rocket_cache_reject_uri', [$this, 'handleWPRocket']);

        if (!defined('DONOTCACHEPAGE')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- WordPress core cache constant.
            define('DONOTCACHEPAGE', true);
        }

        if (function_exists('w3tc_pgcache_flush')) {
            w3tc_pgcache_flush();
        }

        if (function_exists('wp_cache_clear_cache')) {
            wp_cache_clear_cache();
        }
    }

    public function handleWPRocket($uris) {
        $uris = is_array($uris) ? $uris : [];
        $uris[] = 'prayer-times(.*)';
        $uris[] = '(.*)fiveprayer(.*)';
        return array_unique($uris);
    }
}

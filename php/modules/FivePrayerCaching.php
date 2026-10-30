<?php
/**
 * FivePrayer Caching Module
 * 
 * This file handles all caching-related functionality for the FivePrayer plugin.
 * 
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

/**
 * Cache prevention for content that cannot be handled by AJAX
 * Now that we have AJAX for time-sensitive content, we only need to prevent caching
 * for content that cannot be dynamically updated
 */
function fiveprayer_prevent_caching_for_time_content() {
    if (is_admin() || wp_doing_ajax() || is_feed() || is_404()) {
        return;
    }

    // Give site owners an escape hatch if they intentionally want to page-cache
    // these views and rely solely on the client-side re-sync.
    if (!apply_filters('fiveprayer_prevent_page_cache', true)) {
        return;
    }

    if (fiveprayer_has_shortcode_on_page()) {
        // LiteSpeed Cache: disable CSS async + tiny HTML optimization
        if (defined('LSCWP_V')) {
            add_filter('litespeed_optimize_css_async_inline', '__return_false');
            add_filter('litespeed_optm_tiny_html', '__return_false');
        }

        // Prevent full-page caching (NOT the DB object cache). This covers
        // singular views, the front page, and any other view that renders a
        // FivePrayer shortcode in its post content.
        if (!defined('DONOTCACHEPAGE')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- WordPress core cache constant.
            define('DONOTCACHEPAGE', true);
        }
    }
}
add_action('wp', 'fiveprayer_prevent_caching_for_time_content', 1);

/**
 * Alternative method: Hook into cache plugin detection
 */
function fiveprayer_cache_prevention_init() {
    // For WP Rocket
    add_filter('rocket_cache_reject_uri', 'fiveprayer_exclude_from_rocket');

    // For W3 Total Cache
    if (function_exists('w3tc_add_cache_action')) {
        add_filter('w3tc_pagecache_process_request', 'fiveprayer_w3tc_prevent_cache');
    }

    // For WP Super Cache
    add_filter('do_createsupercache', 'fiveprayer_prevent_supercache');

    // For LiteSpeed Cache
    add_action('litespeed_purge_post', 'fiveprayer_litespeed_purge');

    // Additional LiteSpeed specific handling
    add_action('send_headers', 'fiveprayer_add_litespeed_cache_headers');

    // Early content check for script enqueuing
    add_action('wp_head', 'fiveprayer_check_content_and_enqueue_scripts', 1);

}
add_action('init', 'fiveprayer_cache_prevention_init');

/**
 * Exclude pages with time-sensitive content from WP Rocket cache
 */
function fiveprayer_exclude_from_rocket($urls) {
    global $post;

    if (is_a($post, 'WP_Post')) {
        $content = $post->post_content;

        $rocket_whitelist = [
            'Fp_Single_CurrentTime',
            'Fp_Single_NextPrayer',
            'Fp_Single_Next_Prayer_Remaining',
            'Fp_Vertical_Daily_Prayer',
        ];

        if (fiveprayer_content_has_time_sensitive_shortcodes($content, $rocket_whitelist)) {
            $urls[] = esc_url_raw(wp_unslash($_SERVER['REQUEST_URI'] ?? ''));
        }
    }

    return $urls;
}

/**
 * Prevent W3 Total Cache from caching pages with time-sensitive content
 */
function fiveprayer_w3tc_prevent_cache($process) {
    global $post;

    if (is_a($post, 'WP_Post')) {
        $content = $post->post_content;

        $w3tc_whitelist = [
            'Fp_Single_CurrentTime',
            'Fp_Single_NextPrayer',
            'Fp_Single_Next_Prayer_Remaining',
            'Fp_Vertical_Daily_Prayer',
        ];

        if (fiveprayer_content_has_time_sensitive_shortcodes($content, $w3tc_whitelist)) {
            return false;
        }
    }

    return $process;
}

/**
 * Prevent WP Super Cache from caching pages with time-sensitive content
 */
function fiveprayer_prevent_supercache($cache) {
    global $post;

    if (is_a($post, 'WP_Post')) {
        $content = $post->post_content;

        $supercache_whitelist = [
            'Fp_Single_CurrentTime',
            'Fp_Single_NextPrayer',
            'Fp_Single_Next_Prayer_Remaining',
            'Fp_Vertical_Daily_Prayer',
        ];

        if (fiveprayer_content_has_time_sensitive_shortcodes($content, $supercache_whitelist)) {
            return false;
        }
    }

    return $cache;
}

/**
 * Handle LiteSpeed Cache purging
 */
function fiveprayer_litespeed_purge($post_id) {
    // This function can be used to programmatically purge specific content
}

/**
 * Add LiteSpeed-specific cache headers for pages with time-sensitive content
 */
function fiveprayer_add_litespeed_cache_headers() {
    if (is_admin() || wp_doing_ajax()) {
        return;
    }

    global $post;

    if (is_a($post, 'WP_Post')) {
        $content = $post->post_content;

        if (fiveprayer_content_has_time_sensitive_shortcodes($content)) {
            // Send LiteSpeed-specific headers to prevent caching of time-sensitive content
            if (!headers_sent()) {
                header('X-LiteSpeed-Cache-Control: no-cache, max-age=0');
                header('X-LiteSpeed-Tag: none');
                header('X-LiteSpeed-Vary: none');
                header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0, private');
                header('Pragma: no-cache');
                header('Surrogate-Control: no-store');
            }
        }
    }
}

/**
 * Purge external cache plugins to ensure changes are visible immediately
 */
function fiveprayer_purge_external_caches() {
    // WP Rocket
    if (function_exists('rocket_clean_domain')) {
        rocket_clean_domain();
    }

    // LiteSpeed - More aggressive approach for LiteSpeed server
    // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Third-party LiteSpeed Cache hook.
    do_action('litespeed_purge_all');
    // Additional LiteSpeed server-specific purge
    if (class_exists('\LiteSpeed\Purge')) {
        \LiteSpeed\Purge::purge_all();
    }

    // W3 Total Cache
    if (function_exists('w3tc_flush_all')) {
        w3tc_flush_all();
    }

    // WP Super Cache
    if (function_exists('wp_cache_clear_cache')) {
        wp_cache_clear_cache();
    }

    // WP Fastest Cache
    if (function_exists('wpfc_clear_all_cache')) {
        wpfc_clear_all_cache(true); // true for clear all sites in multisite
    }

    // SG Optimizer (SiteGround)
    if (function_exists('sg_cachepress_purge_cache')) {
        sg_cachepress_purge_cache();
    }

    // Hummingbird
    if (class_exists('WP_Hummingbird')) {
        // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Third-party Hummingbird hook.
        do_action('wphb_clear_page_cache');
    }

    // Cache Enabler
    if (function_exists('cache_enabler_clear_complete_cache')) {
        cache_enabler_clear_complete_cache();
    }

    // Comet Cache
    if (class_exists('comet_cache')) {
        comet_cache::clear();
    }

    // WP Optimize
    if (class_exists('WP_Optimize')) {
        $cache = WP_Optimize()->get_page_cache();
        if (method_exists($cache, 'clean')) {
            $cache->clean();
        }
    }

    // Additional server-level cache clearing for LiteSpeed
    if (function_exists('litespeed_esi_middleware')) {
        // Clear any ESI cache if enabled
        // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Third-party LiteSpeed Cache hook.
        if (has_action('litespeed_esi_middleware')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Third-party LiteSpeed Cache hook.
            do_action('litespeed_esi_middleware', 'purge');
        }
    }

    // Clear WordPress object cache only if an external object cache is active
    if (wp_using_ext_object_cache() && function_exists('wp_cache_flush')) {
        wp_cache_flush();
    }
}

/**
 * Utility function to force clear all caches including server-level caches
 * This can be called manually when needed to force refresh time-sensitive content
 */
function fiveprayer_force_clear_all_caches() {
    // Clear internal plugin caches
    \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();

    // Clear shortcode caches
    if (class_exists('\\FivePrayer\\Core\\ShortCodes\\ShortCodesSinglePrayers')) {
        \FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers::resetInstance();
    }

    // Purge external caches (but NOT wp_cache_flush — that destroys the entire object cache)
    fiveprayer_purge_external_caches();
}
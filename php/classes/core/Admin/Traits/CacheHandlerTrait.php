<?php
namespace FivePrayer\Core\Admin\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\Cache\CacheControl;

/** Cache busting and external cache purging for admin operations. */
trait CacheHandlerTrait
{
    private function bust_caches(): void
    {
        if (class_exists('FivePrayer\\Core\\Helpers\\PrayerDataCache')) {
            try { PrayerDataCache::invalidateAll(); } catch (\Throwable $e) {}
        }
        if (class_exists('FivePrayer\\Core\\Cache\\CacheControl')) {
            try { CacheControl::getInstance()->bustCache(); } catch (\Throwable $e) {}
        }
        $this->purge_external_caches();
    }

    private function purge_external_caches(): void
    {
        if (function_exists('rocket_clean_domain')) {
            rocket_clean_domain();
        }
        if (function_exists('do_action')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Third-party LiteSpeed Cache hook.
            do_action('litespeed_purge_all');
        }
        if (function_exists('w3tc_flush_all')) {
            w3tc_flush_all();
        }
        if (function_exists('wp_cache_clear_cache')) {
            wp_cache_clear_cache();
        }
        if (function_exists('wpfc_clear_all_cache')) {
            wpfc_clear_all_cache(true);
        }
        wp_cache_flush();
    }

    public function handle_force_clear_caches(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_force_clear_caches');

        if (function_exists('fiveprayer_force_clear_all_caches')) {
            fiveprayer_force_clear_all_caches();
        }
        $this->redirect_with_notice('fiveprayer-settings', 'updated', __('All caches cleared successfully. Time-sensitive content should now update properly.', 'fiveprayer'), 'translations');
    }
}

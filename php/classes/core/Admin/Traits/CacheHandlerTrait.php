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
        // The shared helper never flushes the object cache, so an admin save
        // no longer empties it for every other plugin on the site.
        if (function_exists('fiveprayer_purge_external_caches')) {
            fiveprayer_purge_external_caches();
        }
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
        $this->redirect_with_notice('fiveprayer-settings', 'updated', 'cache_cleared', 'translations');
    }
}

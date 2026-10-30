<?php

namespace FivePrayer\Core\Helpers\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Trait CacheKeyTrait
 *
 * Handles cache key generation and batch transient processing.
 * Extracted from PrayerDataCache for code organization.
 */
trait CacheKeyTrait
{
    /**
     * Generate a consistent cache key with the class prefix and MD5 hash of the base key.
     * MD5 is used to ensure the key is a valid length and character set for transients.
     *
     * @param string $baseKey Base key name (e.g., 'all_settings_meta', 'timetable_m1_y2023').
     * @return string Full cache key.
     */
    private static function generateCacheKey(string $baseKey): string
    {
        return self::CACHE_KEY_PREFIX . md5($baseKey);
    }

    /**
     * Add a transient to the batch for batch processing
     *
     * @param string $key Transient key
     * @param mixed $value Transient value
     * @param int $expiration Expiration time in seconds
     */
    private static function addToTransientBatch(string $key, $value, int $expiration): void
    {
        self::$transientBatch[] = [
            'key' => $key,
            'value' => $value,
            'expiration' => $expiration
        ];
    }

    /**
     * Process the batch of transients using a single database operation
     */
    private static function processTransientBatch(): void
    {
        if (empty(self::$transientBatch)) {
            return;
        }

        global $wpdb;
        $now = current_time('mysql');
        $expiration = time() + self::DEFAULT_EXPIRATION;
        
        $values = [];
        $placeholders = [];
        
        foreach (self::$transientBatch as $transient) {
            $key = '_transient_' . $transient['key'];
            $value = maybe_serialize($transient['value']);
            $expiration_time = $transient['expiration'] ? time() + $transient['expiration'] : 0;
            
            $values[] = $key;
            $values[] = $value;
            $values[] = $now;
            $values[] = $expiration_time;
            
            $placeholders[] = '(%s, %s, %s, %d)';
            
            // Add timeout entry
            $values[] = '_transient_timeout_' . $transient['key'];
            $values[] = $expiration_time;
            $values[] = $now;
            $placeholders[] = '(%s, %s, %s, 0)';
        }
        
        if (!empty($values)) {
            $table = $wpdb->options;
            $sql = "INSERT INTO %i (option_name, option_value, autoload, option_expires) VALUES " . 
                   implode(", ", $placeholders) . 
                   " ON DUPLICATE KEY UPDATE option_value = VALUES(option_value), autoload = VALUES(autoload), option_expires = VALUES(option_expires)";
            
            // Uncached by design: this statement writes the transient table, it is
            // the cache write itself and cannot be cached.
            // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.NotPrepared -- $sql is a fixed statement; every value is passed through prepare().
            $wpdb->query($wpdb->prepare($sql, array_merge([$table], $values)));
            
            if ($wpdb->last_error) {
                Logger::error("Error saving batch transients: " . $wpdb->last_error, 'PrayerDataCache');
            }
            
            self::$transientBatch = [];
        }
    }
}

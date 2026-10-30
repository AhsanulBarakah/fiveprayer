<?php

namespace FivePrayer\Core\Helpers\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Trait MetaDataTrait
 *
 * Handles loading and caching of settings meta data from fp_prayer_settings_meta.
 * Extracted from PrayerDataCache for code organization.
 */
trait MetaDataTrait
{
    /**
     * Load and cache all rows from fp_prayer_settings_meta.
     *
     * Three cache layers are used, cheapest first:
     * 1. Per-request static cache (self::$metaData).
     * 2. Object cache, group 'fiveprayer'.
     * 3. Transient, batched into a single options-table write.
     *
     * @return array<object> Array of meta data objects. Returns empty array on failure.
     */
    public static function getMetaData(): array
    {
        if (self::$metaData !== null) {
            return self::$metaData;
        }

        $objectCacheKey = 'fiveprayer_all_settings_meta';
        $objectCached = wp_cache_get($objectCacheKey, 'fiveprayer');

        if (is_array($objectCached)) {
            self::$metaData = $objectCached;
            return $objectCached;
        }

        $transientKey = self::generateCacheKey('all_settings_meta');
        $cached = get_transient($transientKey);

        if ($cached !== false && is_array($cached)) {
            self::$metaData = $cached;
            wp_cache_set($objectCacheKey, $cached, 'fiveprayer', self::DEFAULT_EXPIRATION);
            if (!in_array($transientKey, self::$cacheKeys)) {
                self::$cacheKeys[] = $transientKey;
            }
            return $cached;
        }

        global $wpdb;
        $table = $wpdb->prefix . 'fp_prayer_settings_meta';
        $results = $wpdb->get_results($wpdb->prepare("SELECT id, `meta-key`, value, version FROM %i", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

        if ($wpdb->last_error) {
            Logger::error("Failed to fetch meta data from DB. Error: " . $wpdb->last_error, 'PrayerDataCache');
            return [];
        }

        if (!is_array($results)) {
            $results = [];
        }

        self::$metaData = $results;
        wp_cache_set($objectCacheKey, $results, 'fiveprayer', self::DEFAULT_EXPIRATION);
        if (!in_array($transientKey, self::$cacheKeys)) {
            self::$cacheKeys[] = $transientKey;
        }
        
        // Add to batch for later processing
        self::addToTransientBatch($transientKey, $results, self::DEFAULT_EXPIRATION);
        
        // Process batch if it's getting large
        if (count(self::$transientBatch) >= 10) {
            self::processTransientBatch();
        }

        return $results;
    }

    /**
     * Get all meta values from fp_prayer_settings_meta for a specific meta-key.
     *
     * @param string $key The meta-key to retrieve.
     * @return array<string> Array of string values for the given meta key. Returns empty array if key not found or no values.
     */
    public static function getMetaValueByKey(string $key): array
    {
        $metaData = self::getMetaData(); // Ensures meta data is loaded and cached
        $values = [];
        foreach ($metaData as $meta) {
            if (isset($meta->{'meta-key'}) && $meta->{'meta-key'} === $key && isset($meta->value)) {
                $values[] = (string) $meta->value;
            }
        }
        return $values;
    }

    /**
     * Get a single meta value from fp_prayer_settings_meta for a specific meta-key.
     *
     * @param string $key The meta-key to retrieve.
     * @return string|null First value for the given meta key or null if not found.
     */
    public static function getSingleMetaValue(string $key): ?string
    {
        $values = self::getMetaValueByKey($key);
        return !empty($values) ? $values[0] : null;
    }

    /**
     * Get multiple meta values in a single optimized call
     *
     * @param array $keys Array of meta keys to retrieve
     * @return array Associative array of key => value pairs
     */
    public static function getMultipleMetaValues(array $keys): array
    {
        $metaData = self::getMetaData();
        $result = [];

        // Single pass through metadata instead of one call per key
        foreach ($metaData as $meta) {
            if (isset($meta->{'meta-key'}) && isset($meta->value) && in_array($meta->{'meta-key'}, $keys, true)) {
                $result[$meta->{'meta-key'}] = (string) $meta->value;
            }
        }

        // Fill in nulls for any missing keys
        foreach ($keys as $key) {
            if (!array_key_exists($key, $result)) {
                $result[$key] = null;
            }
        }

        return $result;
    }
}

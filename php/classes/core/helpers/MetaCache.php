<?php

namespace FivePrayer\Core\Helpers;

defined('ABSPATH') || exit;

if (!class_exists('MetaCache')) {

    class MetaCache
    {
        private static $metaDataIndexed = null; // Indexed version of metadata for faster lookups

        public static function get_meta_data()
        {
            // Use PrayerDataCache as the single source of truth to avoid duplicate queries
            return PrayerDataCache::getMetaData();
        }

        /**
         * Get a specific meta value by key with internal caching for individual keys
         */
        public static function get_meta_by_key($key)
        {
            // Build indexed cache if it doesn't exist
            if (self::$metaDataIndexed === null) {
                self::buildIndex();
            }

            // Return the value if found in index
            if (isset(self::$metaDataIndexed[$key])) {
                return self::$metaDataIndexed[$key];
            }

            return null;
        }

        /**
         * Build an indexed array of meta data for faster lookups
         */
        private static function buildIndex()
        {
            // Get data from PrayerDataCache to avoid duplicate database queries
            $metaData = PrayerDataCache::getMetaData();

            self::$metaDataIndexed = [];
            foreach ($metaData as &$meta) {
                if (isset($meta->{'meta-key'})) {
                    self::$metaDataIndexed[$meta->{'meta-key'}] = $meta;
                }
            }
        }

        // Invalidate the cache (optional, for cases where data changes)
        public static function invalidate_cache()
        {
            self::$metaDataIndexed = null;
        }
    }
}
<?php

namespace FivePrayer\Core\Database;

defined('ABSPATH') || exit;

if (!class_exists('FivePrayer_GetMeta')) {

    class FivePrayer_GetMeta
    {
        private static $metaCache = []; // Cache to store meta values

        /**
         * Get the meta value for a given key.
         *
         * @param string $data
         * @return mixed|null
         */
        public function get_meta_key($data)
        {
            // Check if the meta value is already cached
            if (isset(self::$metaCache[$data])) {
                return self::$metaCache[$data];
            }

            // Use the centralized cache to avoid duplicate database queries
            $all_meta_data = \FivePrayer\Core\Helpers\MetaCache::get_meta_data();

            // Find the specific meta key in the cached data
            foreach ($all_meta_data as &$meta_record) {
                if (isset($meta_record->{'meta-key'}) && $meta_record->{'meta-key'} === $data && isset($meta_record->value)) {
                    // Decode the JSON directly into an associative array
                    $meta = json_decode($meta_record->value, true); // Decode into associative array

                    // Cache the meta value
                    self::$metaCache[$data] = $meta;

                    return $meta;
                }
            }

            // Cache null result to avoid repeated queries
            self::$metaCache[$data] = null;
            return null;
        }
    }
}

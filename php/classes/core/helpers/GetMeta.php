<?php

namespace FivePrayer\Core\Helpers;

defined('ABSPATH') || exit;

if (!class_exists('GetMeta')) {

    class GetMeta
    {
        private static $metaCache = []; // Cache to store meta values

        public function get_meta_key($data)
        {
            // Check if the meta value is already cached locally in this class
            if (isset(self::$metaCache[$data])) {
                return self::$metaCache[$data];
            }

            // Get all meta data from the centralized cache (which is already cached)
            $all_meta_data = MetaCache::get_meta_data();

            // Find the specific meta key in the cached data
            foreach ($all_meta_data as &$meta_record) {
                if (isset($meta_record->{'meta-key'}) && $meta_record->{'meta-key'} === $data && isset($meta_record->value)) {
                    $raw = $meta_record->value;

                    // Attempt JSON decode for structured data (objects, arrays, booleans)
                    // Plain strings like URLs ("http://...") decode to null — return raw.
                    $decoded = json_decode($raw, true);
                    $meta = ($decoded !== null) ? $decoded : $raw;

                    // Cache the meta value locally in this class too
                    self::$metaCache[$data] = $meta;

                    return $meta;
                }
            }

            // Return null if no data is found
            return null;
        }
    }
}

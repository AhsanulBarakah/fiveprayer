<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\MetaField\Traits\BaseFivePrayerDynamicTagTrait;

// Conditionally define the classes based on Elementor availability
if (!class_exists('BaseFivePrayerDynamicTag')) {
    if (defined('ELEMENTOR_VERSION') && class_exists('\\Elementor\\Core\\DynamicTags\\Manager')) {
        /**
         * Base class for FivePrayer dynamic tags with enhanced security (when Elementor is active)
         */
        abstract class BaseFivePrayerDynamicTag extends \Elementor\Core\DynamicTags\Tag {
            use BaseFivePrayerDynamicTagTrait;

            abstract public function get_field_key();
        }
    } else {
        /**
         * Base class for FivePrayer dynamic tags with enhanced security (fallback when Elementor is not active)
         */
        abstract class BaseFivePrayerDynamicTag {
            use BaseFivePrayerDynamicTagTrait;

            abstract public function get_field_key();
        }
    }
}

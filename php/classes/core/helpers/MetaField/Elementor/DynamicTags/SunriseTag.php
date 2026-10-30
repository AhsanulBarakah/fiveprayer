<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class SunriseTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'sunrise';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_sunrise_begins_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Sunrise Time';
    }
}


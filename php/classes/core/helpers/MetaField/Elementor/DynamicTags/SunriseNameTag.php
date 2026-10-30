<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class SunriseNameTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'sunrise_name';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_sunrise_name';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Sunrise Name';
    }
}


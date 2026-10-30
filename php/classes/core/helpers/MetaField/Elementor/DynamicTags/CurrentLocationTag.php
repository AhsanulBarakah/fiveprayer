<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class CurrentLocationTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'current_location';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_current_location';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Current Location';
    }
}


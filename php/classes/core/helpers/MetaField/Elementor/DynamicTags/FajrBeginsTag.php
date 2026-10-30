<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class FajrBeginsTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'fajr_begins';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_fajr_begins_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Fajr Begins Time';
    }
}


<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class FajrIqamahTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'fajr_iqamah';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_fajr_iqamah_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Fajr Iqamah Time';
    }
}


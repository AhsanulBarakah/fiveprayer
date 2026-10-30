<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class IshaIqamahTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'isha_iqamah';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_isha_iqamah_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Isha Iqamah Time';
    }
}


<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class NextPrayerIqamahTimeTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'next_prayer_iqamah_time';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_next_prayer_iqamah_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Next Prayer Iqamah Time';
    }
}


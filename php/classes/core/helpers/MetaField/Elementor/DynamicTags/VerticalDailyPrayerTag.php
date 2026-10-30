<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class VerticalDailyPrayerTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'vertical_daily_prayer';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_vertical_daily_prayer';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Vertical Daily Prayer Table';
    }
}


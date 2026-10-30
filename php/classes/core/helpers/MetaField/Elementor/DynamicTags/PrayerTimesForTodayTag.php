<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class PrayerTimesForTodayTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'prayer_times_for_today';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_prayer_times_for_today';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Prayer Times For Today';
    }
}


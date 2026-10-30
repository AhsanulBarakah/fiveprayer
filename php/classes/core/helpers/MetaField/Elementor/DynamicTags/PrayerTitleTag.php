<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class PrayerTitleTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'prayer_title';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_prayer_title';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Prayer Title';
    }
}


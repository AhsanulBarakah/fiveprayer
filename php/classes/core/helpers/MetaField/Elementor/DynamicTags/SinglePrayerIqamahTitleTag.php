<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class SinglePrayerIqamahTitleTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'single_prayer_iqamah_title';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_single_prayer_iqamah_title';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Single Prayer Iqamah Title';
    }
}


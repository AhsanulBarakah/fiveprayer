<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class NextPrayerTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'next_prayer';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_next_prayer';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Next Prayer';
    }
}


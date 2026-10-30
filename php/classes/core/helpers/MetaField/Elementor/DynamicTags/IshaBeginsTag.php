<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class IshaBeginsTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'isha_begins';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_isha_begins_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Isha Begins Time';
    }
}


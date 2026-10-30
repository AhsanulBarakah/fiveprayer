<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class IshaNameTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'isha_name';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_isha_name';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Isha Name';
    }
}


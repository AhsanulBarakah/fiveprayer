<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class MidnightNameTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'midnight_name';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_midnight_name';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Midnight Name';
    }
}


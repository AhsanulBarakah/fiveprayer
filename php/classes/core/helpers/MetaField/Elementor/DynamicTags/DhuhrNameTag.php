<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class DhuhrNameTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'dhuhr_name';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_dhuhr_name';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Dhuhr Name';
    }
}


<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class FajrNameTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'fajr_name';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_fajr_name';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Fajr Name';
    }
}


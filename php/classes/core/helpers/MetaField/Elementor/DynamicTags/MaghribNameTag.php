<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class MaghribNameTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'maghrib_name';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_maghrib_name';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Maghrib Name';
    }
}


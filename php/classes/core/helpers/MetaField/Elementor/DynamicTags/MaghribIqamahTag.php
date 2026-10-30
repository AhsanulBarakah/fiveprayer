<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class MaghribIqamahTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'maghrib_iqamah';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_maghrib_iqamah_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Maghrib Iqamah Time';
    }
}


<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class DhuhrIqamahTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'dhuhr_iqamah';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_dhuhr_iqamah_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Dhuhr Iqamah Time';
    }
}


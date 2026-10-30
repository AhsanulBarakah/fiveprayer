<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class DhuhrBeginsTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'dhuhr_begins';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_dhuhr_begins_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Dhuhr Begins Time';
    }
}


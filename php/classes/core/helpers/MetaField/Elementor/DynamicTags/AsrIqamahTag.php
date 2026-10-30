<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class AsrIqamahTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'asr_iqamah';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_asr_iqamah_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Asr Iqamah Time';
    }
}


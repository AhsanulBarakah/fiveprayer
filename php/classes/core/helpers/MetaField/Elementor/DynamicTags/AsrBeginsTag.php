<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class AsrBeginsTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'asr_begins';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_asr_begins_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Asr Begins Time';
    }
}


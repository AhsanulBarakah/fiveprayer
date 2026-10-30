<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class CurrentDateTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'currentDate';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_current_date';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Current Date';
    }
}


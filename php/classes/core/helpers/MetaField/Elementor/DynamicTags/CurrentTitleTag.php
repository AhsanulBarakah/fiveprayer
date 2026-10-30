<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class CurrentTitleTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'current_title';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_current_title';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Current Prayer Title';
    }
}


<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class MasjidNameTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'masjid_name';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_masjid_name';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Masjid Name';
    }
}


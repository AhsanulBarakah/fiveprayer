<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\MetaField\Elementor\BaseDynamicTag;

abstract class AbstractFieldTag extends BaseDynamicTag {
    abstract protected static function get_field_key(): string;
    abstract protected static function get_tag_name(): string;
    abstract protected static function get_tag_title(): string;

    public function __construct($data = [], $args = null) {
        $field_key = static::get_field_key();

        if (!is_array($data)) {
            $data = [];
        }

        $data['field_key'] = $field_key;
        $data['config'] = [
            'field_key' => $field_key,
            'name' => static::get_tag_name(),
            'title' => static::get_tag_title(),
        ];

        parent::__construct($data, $args);
    }
}


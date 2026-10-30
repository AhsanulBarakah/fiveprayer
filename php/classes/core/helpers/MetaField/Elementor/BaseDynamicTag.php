<?php

namespace FivePrayer\Core\Helpers\MetaField\Elementor;

defined('ABSPATH') || exit;

use Elementor\Core\DynamicTags\Tag;
use FivePrayer\Core\Helpers\MetaField\UnifiedDataAccess;
use FivePrayer\Core\Helpers\MetaField\Elementor\Traits\WordRemovalTrait;
use FivePrayer\Core\Helpers\MetaField\Elementor\Traits\ScriptEnqueueTrait;

class BaseDynamicTag extends Tag {
    use WordRemovalTrait;
    use ScriptEnqueueTrait;

    protected $field_key;
    protected $config;

    public function __construct($data = [], $args = null) {
        $data = is_array($data) ? $data : [];
        $this->field_key = $data['field_key'] ?? '';
        $this->config = $data['config'] ?? [];

        if (!isset($data['id'])) {
            $data['id'] = 'fiveprayer_' . uniqid();
        }

        parent::__construct($data, $args);
    }

    public function get_name(): string {
        $name = $this->config['name'] ?? '';
        if (empty($name)) {
            $name = 'fiveprayer_' . $this->field_key;
        }
        return $name;
    }

    public function get_title(): string {
        $title = $this->config['title'] ?? '';
        if (empty($title)) {
            $title = 'FivePrayer - ' . ucfirst(str_replace('_', ' ', $this->field_key));
        }
        return $title;
    }

    public function get_categories() {
        return [\Elementor\Modules\DynamicTags\Module::TEXT_CATEGORY];
    }

    public function get_group() {
        return 'fiveprayer';
    }

    protected function resolve_value(bool $for_render = false): string {
        try {
            $field_key = $this->field_key ?? '';

            if (empty($field_key) && isset($this->config['field_key'])) {
                $field_key = $this->config['field_key'];
            }

            if (empty($field_key)) {
                return '';
            }

            if ($for_render) {
                if ($field_key === 'current_time') {
                    $this->enqueue_secure_live_time_script();
                } elseif (in_array($field_key, ['next_prayer', 'next_prayer_begins_time', 'next_prayer_iqamah_time'], true)) {
                    $this->enqueue_secure_dynamic_content_loader();
                }
            }

            $post_id = get_the_ID();
            $settings = $this->get_control_settings();

            $value = UnifiedDataAccess::getFieldData(
                $field_key,
                is_numeric($post_id) ? (int) $post_id : 0,
                is_array($settings) ? $settings : []
            );

            if ($value === '' || $value === null) {
                return '';
            }

            $value = (string) $value;

            if ($value !== '') {
                $value = $this->apply_word_removal($value);
            }

            return $value;
        } catch (\Throwable $e) {
            if (class_exists('\FivePrayer\\Core\\Logging\\Logger')) {
                \FivePrayer\Core\Logging\Logger::error('Error resolving dynamic tag value: ' . $e->getMessage(), static::class);
            }
            return '';
        }
    }

    public function render() {
        $value = $this->resolve_value(true);

        if ($value === '') {
            return;
        }

        echo wp_kses_post($value);
    }

    public function get_value($options = []) {
        $value = $this->resolve_value(false);

        return $value === '' ? '' : wp_kses_post($value);
    }
}
<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

use Elementor\Controls_Manager;

class NextPrayerIqamahTitleTag extends AbstractFieldTag {
    public function __construct($data = [], $args = null) {
        parent::__construct($data, $args);
    }

    protected static function get_field_key(): string {
        return 'next_prayer_iqamah_title';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_next_prayer_iqamah_title';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Next Prayer Iqamah Title';
    }

    protected function supports_word_removal(): bool {
        return true;
    }

    public function register_controls(): void {
        $this->add_control(
            'remove_first_word',
            [
                'label' => __('Remove first word', 'fiveprayer'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'fiveprayer'),
                'label_off' => __('No', 'fiveprayer'),
                'return_value' => 'yes',
                'default' => '',
            ]
        );

        $this->add_control(
            'remove_second_word',
            [
                'label' => __('Remove second word', 'fiveprayer'),
                'type' => Controls_Manager::SWITCHER,
                'label_on' => __('Yes', 'fiveprayer'),
                'label_off' => __('No', 'fiveprayer'),
                'return_value' => 'yes',
                'default' => '',
            ]
        );

        $this->add_control(
            'words_to_remove',
            [
                'label' => __('Additional words to remove', 'fiveprayer'),
                'type' => Controls_Manager::TEXT,
                'placeholder' => __('word1, word2', 'fiveprayer'),
                'description' => __('Comma separated list of extra words to strip from the title.', 'fiveprayer'),
                'default' => '',
            ]
        );
    }
}

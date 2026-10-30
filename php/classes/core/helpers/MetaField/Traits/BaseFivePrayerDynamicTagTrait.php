<?php

namespace FivePrayer\Core\Helpers\MetaField\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Cache\PrayerDataCache;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\PathService;
use FivePrayer\Core\Logging\Logger;

/**
 * Trait containing all common functionality for FivePrayer dynamic tags.
 * Used by both Elementor and non-Elementor base tag classes.
 */
trait BaseFivePrayerDynamicTagTrait
{
    protected $security_helper;

    public function __construct($data = [])
    {
        if (!is_array($data)) {
            $data = [];
        }

        $this->security_helper = new SecurityHelper();

        if (defined('ELEMENTOR_VERSION') && class_exists('\\Elementor\\Core\\DynamicTags\\Tag')) {
            parent::__construct($data);
        }
    }

    public function get_categories()
    {
        if (defined('ELEMENTOR_VERSION') && class_exists('\\Elementor\\Core\\DynamicTags\\Manager')) {
            return [\Elementor\Modules\DynamicTags\Module::TEXT_CATEGORY];
        }
        return [];
    }

    public function get_group()
    {
        return 'fiveprayer';
    }

    protected function _register_controls()
    {
    }

    public function render()
    {
        $is_elementor_tag = $this instanceof \Elementor\Core\DynamicTags\Tag;

        if ($is_elementor_tag) {
            try {
                $field_key = $this->get_field_key();
                $allowed_fields = array_values(\FivePrayer\Core\ShortCodes\Data\ShortCodeMap::ACTIVE_SHORTCODES);

                if (!in_array($field_key, $allowed_fields, true)) {
                    SecurityHelper::log_security_event("Invalid field key attempted: $field_key", 'warning');
                    return;
                }

                $post_id = get_the_ID();

                if (!$this->validate_post_id($post_id)) {
                    SecurityHelper::log_security_event("Invalid post ID in dynamic tag render: $post_id", 'warning');
                    return;
                }

                $meta_key = 'fp_' . $field_key;
                $meta_value = get_post_meta($post_id, $meta_key, true);

                if (empty($meta_value)) {
                    $shortcode_map = \FivePrayer\Core\ShortCodes\Data\ShortCodeMap::ACTIVE_SHORTCODES;
                    $shortcode = null;

                    foreach ($shortcode_map as $sc => $mapped_field_key) {
                        if ($mapped_field_key === $field_key) {
                            $shortcode = $sc;
                            break;
                        }
                    }

                    if ($shortcode) {
                        $meta_value = do_shortcode('[' . $shortcode . ']');

                        if ($field_key === 'hijra_date' && $meta_value === $shortcode) {
                            $meta_value = $this->get_secure_default_value($field_key);
                        }

                        if ($field_key === 'current_time') {
                            $this->enqueue_secure_live_time_script();
                        } elseif ($field_key === 'hijra_date') {
                            if (function_exists('fiveprayer_enqueue_combined_scripts')) {
                                fiveprayer_enqueue_combined_scripts();
                            }
                        } elseif (in_array($field_key, ['next_prayer', 'next_prayer_begins_time', 'next_prayer_iqamah_time'], true)) {
                            $this->enqueue_secure_dynamic_content_loader();
                        }
                    } else {
                        $generator = new \FivePrayer\Core\Helpers\MetaFieldGenerator();
                        $meta_value = $generator->get_default_prayer_time_public($field_key);
                    }
                }

                $processed_value = $this->process_word_removal($meta_value);

                if ($field_key === 'hijra_date' && empty($processed_value)) {
                    try {
                        $hijra = new \FivePrayer\Core\Calendar\Hijra();
                        $today = gmdate('Y-m-d');
                        $processed_value = $hijra->hijra($today);
                    } catch (\Exception $e) {
                        Logger::error('Error getting hijra date in final fallback: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
                    }
                }

                if (!empty($processed_value)) {
                    echo wp_kses_post($processed_value);
                } else {
                    if ($field_key !== 'hijra_date') {
                        echo esc_html($field_key);
                    } else {
                        echo '';
                    }
                }
            } catch (\Exception $e) {
                Logger::error('Error in BaseFivePrayerDynamicTag render: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
                SecurityHelper::log_security_event('Exception in dynamic tag render: ' . $e->getMessage(), 'error');
                $field_key = $this->get_field_key();
                if ($field_key !== 'hijra_date') {
                    echo esc_html($field_key);
                } else {
                    echo '';
                }
            }
        } else {
            return;
        }
    }

    public function get_value($key = '')
    {
        if (class_exists('\\Elementor\\Core\\DynamicTags\\Tag') && method_exists(parent::class, 'get_value')) {
            try {
                return parent::get_value($key);
            } catch (\Exception $e) {
                Logger::error('Error in get_value: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
                return '';
            }
        }
        return '';
    }

    public function get_safe_settings($setting_key = null)
    {
        try {
            if (method_exists($this, 'get_data')) {
                $data = $this->get_data();

                if (is_null($data)) {
                    $settings = [];
                } elseif (is_array($data) && isset($data['settings'])) {
                    $settings = $data['settings'];
                    if (!is_array($settings)) {
                        $settings = [];
                    }
                } else {
                    $settings = [];
                }
            } else {
                $settings = [];
            }

            if (!is_array($settings)) {
                $settings = [];
            }

            $default_settings = [
                'remove_specific_word' => '',
                'remove_iqamah_word' => '',
                'remove_begins_word' => '',
                'remove_iqam_word' => '',
                'remove_prayer_word' => '',
                'remove_time_word' => '',
            ];

            $settings = array_merge($default_settings, $settings);

            if ($setting_key !== null) {
                return isset($settings[$setting_key]) ? $settings[$setting_key] : ($default_settings[$setting_key] ?? '');
            }

            return $settings;
        } catch (\Exception $e) {
            Logger::error('Error in get_safe_settings: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
            $defaults = [
                'remove_specific_word' => '',
                'remove_iqamah_word' => '',
                'remove_begins_word' => '',
                'remove_iqam_word' => '',
                'remove_prayer_word' => '',
                'remove_time_word' => '',
            ];
            return $setting_key !== null ? ($defaults[$setting_key] ?? '') : $defaults;
        }
    }

    public function get_data($property = null)
    {
        if (class_exists('\\Elementor\\Core\\DynamicTags\\Tag') && method_exists(parent::class, 'get_data')) {
            try {
                $data = parent::get_data($property);

                if ($property === null) {
                    if (!is_array($data)) {
                        $data = [];
                    }
                    if (!isset($data['settings']) || !is_array($data['settings'])) {
                        $data['settings'] = [];
                    }
                }

                return $data;
            } catch (\Exception $e) {
                Logger::error('Error in get_data: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
                if ($property === null) {
                    return [
                        'settings' => [],
                        'id' => $this->get_id() ?? '',
                        'name' => $this->get_name() ?? '',
                    ];
                } else {
                    return null;
                }
            }
        }

        if ($property === null) {
            return [
                'settings' => [],
                'id' => $this->get_id() ?? '',
                'name' => $this->get_name() ?? '',
            ];
        }

        return null;
    }

    protected function process_word_removal($value)
    {
        return $value;
    }

    protected function get_settings_safe($setting_key = null)
    {
        return $this->get_safe_settings($setting_key);
    }

    protected function remove_words_from_text($text, $words_to_remove)
    {
        if (empty($words_to_remove) || !is_array($words_to_remove)) {
            return $text;
        }

        $clean_text = $text;
        foreach ($words_to_remove as &$word) {
            if (!empty($word) && is_string($word)) {
                $all_words_to_remove = $this->get_translated_versions_of_word($word);

                if (!in_array($word, $all_words_to_remove, true)) {
                    $all_words_to_remove[] = $word;
                }

                foreach ($all_words_to_remove as &$word_to_remove) {
                    if (is_string($word_to_remove) && !empty($word_to_remove)) {
                        $clean_text = preg_replace('/\b' . preg_quote($word_to_remove, '/') . '\b/i', '', $clean_text);
                        $clean_text = str_ireplace($word_to_remove, '', $clean_text);
                    }
                }

                $clean_text = preg_replace('/\s+/', ' ', $clean_text);
                $clean_text = trim($clean_text);
            }
        }

        return $clean_text;
    }

    protected function get_translated_versions_of_word($word)
    {
        $translations = [];

        try {
            if (class_exists('\\FivePrayer\\Core\\Helpers\\GetMeta')) {
                $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();

                $timetable_prayer = $getMetaFromDB->get_meta_key("timetable_prayer", []);

                if (!empty($timetable_prayer)) {
                    foreach ($timetable_prayer as &$translation) {
                        if (isset($translation['original_text'], $translation['translated_text']) &&
                            stripos($translation['original_text'], $word) !== false) {
                            $translations[] = $translation['translated_text'];
                        }
                    }
                }

                $prayer_names = $getMetaFromDB->get_meta_key("prayer_names", []);

                if (!empty($prayer_names)) {
                    foreach ($prayer_names as &$translation) {
                        if (isset($translation['original_text'], $translation['translated_text']) &&
                            stripos($translation['original_text'], $word) !== false) {
                            $translations[] = $translation['translated_text'];
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Logger::error('Error getting translations for word: ' . $word . ' - ' . $e->getMessage(), 'DynamicTextHandler');
        }

        return array_unique($translations);
    }

    protected function get_translated_version_for_display($word)
    {
        try {
            if (class_exists('\\FivePrayer\\Core\\Helpers\\GetMeta')) {
                $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
                $normalized_word = strtolower(trim($word));

                $search_terms = [$word];
                if ($word === 'Begins') {
                    $search_terms = array_merge($search_terms, ['Begin', 'Begins', 'Starts', 'Start', 'Begins Time', 'Begin Time']);
                } elseif ($word === 'Iqamah') {
                    $search_terms = array_merge($search_terms, ['Iqam', 'Iqamah', 'Call', 'Adhan', 'Iqamah Time', 'Iqam Time']);
                }

                $translation_sources = [
                    'timetable_prayer',
                    'prayer_names',
                    'gregorian_numbers',
                    'hijralocale'
                ];

                foreach ($translation_sources as &$source) {
                    $translations = $getMetaFromDB->get_meta_key($source, []);

                    if (!empty($translations)) {
                        foreach ($translations as &$translation) {
                            if (isset($translation['original_text'], $translation['translated_text'])) {
                                foreach ($search_terms as &$search_term) {
                                    if (strtolower(trim($translation['original_text'])) === strtolower(trim($search_term))) {
                                        return $translation['translated_text'];
                                    }
                                    if (stripos($translation['original_text'], $search_term) !== false) {
                                        return $translation['translated_text'];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            Logger::error('Error getting translation for display: ' . $e->getMessage(), 'DynamicTextHandler');
        }

        return $word;
    }

    protected function get_secure_default_value(string $field_key): string
    {
        try {
            $valid_field_keys = array_values(ShortCodeMap::ACTIVE_SHORTCODES);
            if (!in_array($field_key, $valid_field_keys, true)) {
                SecurityHelper::log_security_event("Invalid field key in get_secure_default_value: $field_key", 'warning');
                return '';
            }

            $shortcode_map = ShortCodeMap::ACTIVE_SHORTCODES;
            $shortcode = null;

            foreach ($shortcode_map as $sc => $mapped_field_key) {
                if ($mapped_field_key === $field_key) {
                    $shortcode = $sc;
                    break;
                }
            }

            if ($shortcode) {
                $meta_value = do_shortcode('[' . $shortcode . ']');

                if ($field_key === 'hijra_date' && $meta_value === $shortcode) {
                    try {
                        $hijra = new \FivePrayer\Core\Calendar\Hijra();
                        $today = gmdate('Y-m-d');
                        $meta_value = $hijra->hijra($today);
                    } catch (\Exception $e) {
                        Logger::error('Error getting hijra date directly: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
                        $meta_value = '';
                    }
                }

                if ($field_key === 'current_time') {
                    $this->enqueue_secure_live_time_script();
                } elseif ($field_key === 'hijra_date') {
                    if (function_exists('fiveprayer_enqueue_combined_scripts')) {
                        fiveprayer_enqueue_combined_scripts();
                    }
                } elseif (in_array($field_key, ['next_prayer', 'next_prayer_begins_time', 'next_prayer_iqamah_time'], true)) {
                    $this->enqueue_secure_dynamic_content_loader();
                }

                return SecurityHelper::sanitize_text($meta_value, true, []);
            } else {
                if ($field_key === 'hijra_date') {
                    try {
                        $hijra = new \FivePrayer\Core\Calendar\Hijra();
                        $today = gmdate('Y-m-d');
                        $meta_value = $hijra->hijra($today);
                        if (!empty($meta_value)) {
                            return SecurityHelper::sanitize_text($meta_value, true, []);
                        }
                    } catch (\Exception $e) {
                        Logger::error('Error getting hijra date in fallback: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
                    }
                }

                $generator = new \FivePrayer\Core\Helpers\MetaFieldGenerator();
                return $generator->get_default_prayer_time_public($field_key);
            }
        } catch (\Exception $e) {
            Logger::error('Error in get_secure_default_value: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
            return '';
        }
    }

    protected function validate_post_id($post_id): bool
    {
        if (empty($post_id) || !is_numeric($post_id)) {
            return false;
        }

        $post_id = intval($post_id);
        if ($post_id <= 0) {
            return false;
        }

        $post = get_post($post_id);
        if (!$post || $post->post_status !== 'publish') {
            return false;
        }

        return true;
    }

    protected function enqueue_secure_live_time_script(): void
    {
        try {
            fiveprayer_enqueue_combined_scripts();
            $this->enqueue_secure_live_time_translations();
        } catch (\Exception $e) {
            Logger::error('Error enqueuing live time script: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
        }
    }

    protected function enqueue_secure_live_time_translations(): void
    {
        try {
            if (!class_exists('\\FivePrayer\\Core\\Helpers\\GetMeta')) {
                $this->enqueue_fallback_translations();
                return;
            }
            $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
            $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage", [['language_code' => 'en']]);
            $customLan = $getMetaFromDB->get_meta_key("hijralocale", []);
            $numbers = $getMetaFromDB->get_meta_key("gregorian_numbers", []);

            $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;
            if (!$hijraIsActive) {
                $activeLanguage = [['language_code' => 'en']];
            }

            $translations = array_merge(
                array_fill_keys(array_map('strval', range(0, 9)), array_map('strval', range(0, 9))),
                ['AM' => 'AM', 'PM' => 'PM']
            );

            if (is_array($numbers) && !empty($activeLanguage[0]['language_code'])) {
                $targetLang = SecurityHelper::sanitize_input($activeLanguage[0]['language_code']);
                $foundAM = false;
                $foundPM = false;

                foreach ($numbers as &$num) {
                    if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                        $num['language_code'] === $targetLang) {

                        $original = SecurityHelper::sanitize_input(strtoupper($num['original_text']));
                        $translated = SecurityHelper::sanitize_text($num['translated_text']);

                        if (in_array($original, ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'AM', 'PM'])) {
                            $translations[$original] = $translated;
                            $translations[strtolower($original)] = strtolower($translated);

                            if ($original === 'AM') $foundAM = true;
                            if ($original === 'PM') $foundPM = true;
                        }
                    }
                }

                if (!$foundAM || !$foundPM) {
                    foreach ($numbers as &$num) {
                        if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                            $num['language_code'] === 'en') {

                            $original = SecurityHelper::sanitize_input(strtoupper($num['original_text']));
                            $translated = SecurityHelper::sanitize_text($num['translated_text']);

                            if (($original === 'AM' && !$foundAM) || ($original === 'PM' && !$foundPM)) {
                                $translations[$original] = $translated;
                                $translations[strtolower($original)] = strtolower($translated);
                            }
                        }
                    }
                }
            }

            $timeFormat = get_option('time_format', 'h:i A');
            $timeData = [
                'numbers' => SecurityHelper::sanitize_input($translations),
                'ampm' => [
                    'AM' => $translations['AM'] ?? 'AM',
                    'PM' => $translations['PM'] ?? 'PM'
                ],
                'initialTime' => date_i18n($timeFormat),
                'timeFormat' => SecurityHelper::sanitize_input($timeFormat),
                'timeSelector' => '.fiveprayer-live-time',
                'activeLanguage' => SecurityHelper::sanitize_input($activeLanguage[0]['language_code'] ?? 'en'),
                'customLan' => SecurityHelper::sanitize_input($customLan['customLan'] ?? false),
            ];

            if (class_exists('\\FivePrayer\\Core\\Assets\\ScriptLocalizationManager')) {
                $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
                $localization_manager->localizeScript(
                    'fiveprayer-live-time',
                    'fiveprayerTimeData',
                    $timeData
                );
            } else {
                wp_localize_script(
                    'fiveprayer-live-time',
                    'fiveprayerTimeData',
                    $timeData
                );
            }
        } catch (\Exception $e) {
            Logger::error('Error enqueuing live time translations: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
        }
    }

    protected function enqueue_secure_dynamic_content_loader(): void
    {
        try {
            fiveprayer_enqueue_combined_scripts();

            wp_localize_script('fiveprayer-dynamic-content-loader', 'fiveprayer_dynamic', [
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce')
            ]);
        } catch (\Exception $e) {
            Logger::error('Error enqueuing dynamic content loader: ' . $e->getMessage(), 'BaseFivePrayerDynamicTag');
        }
    }

    private function enqueue_fallback_translations(): void
    {
        $timeFormat = get_option('time_format', 'h:i A');
        $timeData = [
            'numbers' => array_combine(range(0, 9), range(0, 9)),
            'ampm' => ['AM' => 'AM', 'PM' => 'PM'],
            'initialTime' => date_i18n($timeFormat),
            'timeFormat' => $timeFormat,
            'timeSelector' => '.fiveprayer-live-time',
            'activeLanguage' => 'en',
            'customLan' => false,
        ];

        wp_localize_script(
            'fiveprayer-live-time',
            'fiveprayerTimeData',
            $timeData
        );
    }
}

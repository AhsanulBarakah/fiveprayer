<?php

namespace FivePrayer\Core\Helpers\MetaField\Elementor\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

trait WordRemovalTrait
{
    /**
     * Remove specific words from a text string
     */
    protected function remove_words_from_text($text, $words_to_remove)
    {
        if (empty($words_to_remove) || !is_array($words_to_remove)) {
            return $text;
        }

        $clean_text = $text;
        foreach ($words_to_remove as &$word) {
            if (!empty($word) && is_string($word)) {
                // Get all possible translations of this word
                $all_words_to_remove = $this->get_translated_versions_of_word($word);
                
                // Add the original word as well
                if (!in_array($word, $all_words_to_remove, true)) {
                    $all_words_to_remove[] = $word;
                }

                // Remove each version of the word
                foreach ($all_words_to_remove as &$word_to_remove) {
                    if (is_string($word_to_remove) && !empty($word_to_remove)) {
                        // Remove the word with word boundaries to avoid partial matches
                        $clean_text = preg_replace('/\b' . preg_quote($word_to_remove, '/') . '\b/i', '', $clean_text);
                        
                        // Also try case-insensitive partial match for more flexible removal
                        $clean_text = str_ireplace($word_to_remove, '', $clean_text);
                    }
                }

                // Clean up extra spaces that might result from removal
                $clean_text = preg_replace('/\s+/', ' ', $clean_text);
                $clean_text = trim($clean_text);
            }
        }

        return $clean_text;
    }

    /**
     * Get translated versions of a specific word from the translation system
     */
    protected function get_translated_versions_of_word($word)
    {
        $translations = [];

        try {
            if (class_exists('\FivePrayer\Core\Helpers\GetMeta')) {
                $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();

                // Get timetable prayer translations (includes "Begins", "Iqamah", etc.)
                $timetable_prayer = $getMetaFromDB->get_meta_key("timetable_prayer", []);

                if (!empty($timetable_prayer)) {
                    foreach ($timetable_prayer as &$translation) {
                        if (isset($translation['original_text'], $translation['translated_text']) &&
                            stripos($translation['original_text'], $word) !== false) {
                            $translations[] = $translation['translated_text'];
                        }
                    }
                }

                // Also check prayer names for common words
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
            // If there's an error, return empty array
            Logger::error('Error getting translations for word: ' . $word . ' - ' . $e->getMessage(), 'WordRemoval');
        }

        return array_unique($translations);
    }

    /**
     * Whether the current tag supports word removal controls.
     */
    protected function supports_word_removal(): bool
    {
        return false;
    }

    /**
     * Apply word removal rules based on Elementor controls.
     */
    protected function apply_word_removal(string $value): string
    {
        if (!$this->supports_word_removal() || $value === '') {
            return $value;
        }

        $settings = $this->get_control_settings();
        if (!is_array($settings)) {
            return $value;
        }

        $field_key = $this->field_key ?? ($this->config['field_key'] ?? '');
        $original_tokens = preg_split('/\s+/u', trim((string) $value), -1, PREG_SPLIT_NO_EMPTY);

        $remove_first = $this->is_truthy_setting($settings, 'remove_first_word');
        $remove_second = $this->is_truthy_setting($settings, 'remove_second_word');
        $custom_words_setting = isset($settings['words_to_remove']) ? $settings['words_to_remove'] : '';

        $words_to_remove = [];
        if (!empty($custom_words_setting) && is_string($custom_words_setting)) {
            $words_to_remove = array_filter(array_map('trim', explode(',', $custom_words_setting)));
            if (!empty($words_to_remove)) {
                $value = $this->remove_words_from_text($value, $words_to_remove);

                if ($value === '' && is_array($original_tokens) && count($original_tokens) > 1) {
                    $value = $this->remove_words_from_tokens($original_tokens, $words_to_remove);
                }
            }
        }

        if ($remove_first) {
            $value = $this->remove_word_at_position($value, 0);
        }

        if ($remove_second) {
            $value = $this->remove_word_at_position($value, 1);
        }

        $value = preg_replace('/\s+/', ' ', $value);

        return trim((string) $value);
    }

    /**
     * Apply admin-configured word removal if available.
     */
    protected function apply_admin_word_removal(string $value, string $context): string
    {
        if ($value === '') {
            return $value;
        }

        if (class_exists('\FivePrayer\Core\Admin\WordRemovalAdmin')) {
            try {
                $wordRemovalAdmin = new WordRemovalAdmin();
                $value = $wordRemovalAdmin->apply_word_removal_to_text($value, $context);
            } catch (\Throwable $e) {
                if (class_exists('\FivePrayer\Core\Logging\Logger')) {
                    \FivePrayer\Core\Logging\Logger::error('Word removal admin error: ' . $e->getMessage(), static::class);
                }
            }
        }

        return $value;
    }

    /**
     * Retrieve Elementor control settings safely.
     */
    protected function get_control_settings(): array
    {
        $settings = [];

        if (method_exists($this, 'get_settings_for_display')) {
            $display_settings = $this->get_settings_for_display();
            if (is_array($display_settings)) {
                $settings = $display_settings;
            }
        }

        if (empty($settings)) {
            $raw_settings = $this->get_settings();
            if (is_array($raw_settings)) {
                $settings = $raw_settings;
            }
        }

        if (!is_array($settings)) {
            $settings = [];
        }

        return $settings;
    }

    /**
     * Determine if a toggle-like setting is truthy.
     */
    protected function is_truthy_setting(array $settings, string $key): bool
    {
        if (!isset($settings[$key])) {
            return false;
        }

        $value = $settings[$key];

        if (is_string($value)) {
            return in_array(strtolower($value), ['yes', 'true', '1', 'on'], true);
        }

        if (is_bool($value)) {
            return $value === true;
        }

        if (is_int($value)) {
            return $value === 1;
        }

        return false;
    }

    /**
     * Remove a word at a specific position (0-indexed) from a string.
     */
    protected function remove_word_at_position(string $value, int $position): string
    {
        $words = preg_split('/\s+/u', trim($value));

        if (!is_array($words) || !isset($words[$position])) {
            return $value;
        }

        unset($words[$position]);

        $value = implode(' ', $words);

        return trim(preg_replace('/\s+/', ' ', $value));
    }

    /**
     * Remove words from a pre-split token list and rebuild string.
     */
    protected function remove_words_from_tokens(array $tokens, array $words_to_remove): string
    {
        if (empty($tokens) || empty($words_to_remove)) {
            return trim(implode(' ', $tokens));
        }

        $filtered = [];

        foreach ($tokens as $token) {
            $should_remove = false;

            foreach ($words_to_remove as $word) {
                if ($this->words_match($token, $word)) {
                    $should_remove = true;
                    break;
                }
            }

            if (!$should_remove) {
                $filtered[] = $token;
            }
        }

        return trim(implode(' ', $filtered));
    }

    /**
     * Case-insensitive comparison for words, ignoring surrounding punctuation.
     */
    protected function words_match(string $a, string $b): bool
    {
        $normalize = static function (string $value): string {
            $value = trim($value);
            $value = trim($value, "\"'.,-()[]{}");
            return mb_strtolower($value);
        };

        $normalized_a = $normalize($a);
        $normalized_b = $normalize($b);

        if ($normalized_a === '' || $normalized_b === '') {
            return false;
        }

        if ($normalized_a === $normalized_b) {
            return true;
        }

        return mb_strpos($normalized_a, $normalized_b) !== false;
    }
}

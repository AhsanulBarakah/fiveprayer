<?php

namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Components;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Utility class for handling word removal functionality
 */
class WordRemovalUtility {
    
    /**
     * Apply word removal functionality for title fields
     *
     * @param string $value
     * @param string $field_key
     * @param array $attributes
     * @return string
     */
    public static function applyWordRemoval($value, $field_key, $attributes = []): string {
        // Only apply word removal for title fields
        if (!BreakdanceFieldControls::isTitleField($field_key)) {
            return $value;
        }

        // Apply word removal settings from admin for specific fields
        if ($field_key === 'next_prayer_begins_title') {
            $value = self::applyAdminWordRemovalSettings($value, 'next_prayer_begins');
        } elseif ($field_key === 'next_prayer_iqamah_title') {
            $value = self::applyAdminWordRemovalSettings($value, 'iqamah_title');
        }

        // Apply custom controls from Breakdance
        // Mutual exclusion: if both are selected, prioritize first word removal
        if (!empty($attributes['remove_first_word']) && $attributes['remove_first_word']) {
            $words = explode(' ', $value);
            if (count($words) > 1) {
                array_shift($words);
                $value = implode(' ', $words);
            }
        } elseif (!empty($attributes['remove_second_word']) && $attributes['remove_second_word']) {
            $words = explode(' ', $value);
            if (count($words) > 1) {
                unset($words[1]);
                $words = array_values($words); // Re-index array
                $value = implode(' ', $words);
            }
        }

        if (!empty($attributes['remove_specific_word'])) {
            $specific_word = $attributes['remove_specific_word'];
            if (!empty($specific_word)) {
                $value = str_ireplace($specific_word, '', $value);
                $value = trim(preg_replace('/\s+/', ' ', $value)); // Clean up extra spaces
            }
        }

        return $value;
    }

    /**
     * Remove specific words from a text string
     */
    public static function removeWordsFromText($text, $words_to_remove) {
        if (empty($words_to_remove) || !is_array($words_to_remove)) {
            return $text;
        }

        $clean_text = $text;
        foreach ($words_to_remove as &$word) {
            if (!empty($word)) {
                // Get all possible translations of this word
                $all_words_to_remove = self::getTranslatedVersionsOfWord($word);

                // Add the original word as well
                if (!in_array($word, $all_words_to_remove)) {
                    $all_words_to_remove[] = $word;
                }

                // Remove each version of the word
                foreach ($all_words_to_remove as &$word_to_remove) {
                    // Remove the word with word boundaries to avoid partial matches
                    $clean_text = preg_replace('/\b' . preg_quote($word_to_remove, '/') . '\b/i', '', $clean_text);

                    // Also try case-insensitive partial match for more flexible removal
                    $clean_text = str_ireplace($word_to_remove, '', $clean_text);
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
    public static function getTranslatedVersionsOfWord($word) {
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
            Logger::error('Error getting translations for word: ' . $word . ' - ' . $e->getMessage(), 'WordRemovalUtility');
        }

        return array_unique($translations);
    }

    /**
     * Apply word removal settings from admin configuration
     */
    public static function applyAdminWordRemovalSettings($text, $context) {
        // Include the WordRemovalAdmin class to access admin settings
        if (!class_exists('\\FivePrayer\\Core\\Admin\\WordRemovalAdmin')) {
            // If the class doesn't exist, return the original text
            return $text;
        }

        $word_removal_admin = new \FivePrayer\Core\Admin\WordRemovalAdmin();
        return $word_removal_admin->apply_word_removal_to_text($text, $context);
    }
}
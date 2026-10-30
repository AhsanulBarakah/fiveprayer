<?php

namespace FivePrayer\Core\Helpers\MetaField\Traits;

defined('ABSPATH') || exit;

trait WordRemovalTrait
{
    /**
     * Process word removal for tags that support it
     */
    private static function processWordRemoval($value, $field_key, $settings = [])
    {
        if (!in_array($field_key, ['next_prayer_iqamah_title', 'next_prayer_begins_title'], true)) {
            return $value;
        }

        try {
            $processed_value = $value;

            $label_suffix = strpos($field_key, 'iqamah') !== false ? 'iqamah' : 'begins';

            if (!empty($settings["remove_{$label_suffix}_word"])) {
                $words_to_remove = [$label_suffix === 'iqamah' ? 'Iqamah' : 'Begins'];

                $getMetaFromDB = null;
                if (class_exists('\\FivePrayer\\Core\\Helpers\\GetMeta')) {
                    $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
                }

                if ($getMetaFromDB) {
                    $timetable_prayer = $getMetaFromDB->get_meta_key("timetable_prayer", []);

                    if (!empty($timetable_prayer)) {
                        foreach ($timetable_prayer as &$translation) {
                            if (isset($translation['original_text'], $translation['translated_text']) &&
                                stripos($translation['original_text'], $label_suffix) !== false) {
                                $words_to_remove[] = $translation['translated_text'];
                            }
                        }
                    }

                    $prayer_names = $getMetaFromDB->get_meta_key("prayer_names", []);

                    if (!empty($prayer_names)) {
                        foreach ($prayer_names as &$translation) {
                            if (isset($translation['original_text'], $translation['translated_text']) &&
                                stripos($translation['original_text'], $label_suffix) !== false) {
                                $words_to_remove[] = $translation['translated_text'];
                            }
                        }
                    }
                }

                $processed_value = self::removeWordsFromText($processed_value, $words_to_remove);
            }

            if (!empty($settings['remove_specific_word'])) {
                $words_to_remove = explode(',', $settings['remove_specific_word']);
                $words_to_remove = array_map('trim', $words_to_remove);
                $processed_value = self::removeWordsFromText($processed_value, $words_to_remove);
            }

            return $processed_value;
        } catch (\Exception $e) {
            return $value;
        }
    }

    /**
     * Remove specific words from a text string
     */
    private static function removeWordsFromText($text, $words_to_remove)
    {
        if (empty($words_to_remove) || !is_array($words_to_remove)) {
            return $text;
        }

        $clean_text = $text;
        foreach ($words_to_remove as &$word) {
            if (!empty($word) && is_string($word)) {
                if (is_string($word) && !empty($word)) {
                    $clean_text = preg_replace('/\b' . preg_quote($word, '/') . '\b/i', '', $clean_text);
                    $clean_text = str_ireplace($word, '', $clean_text);
                }
            }
        }

        $clean_text = preg_replace('/\s+/', ' ', $clean_text);
        $clean_text = trim($clean_text);

        return $clean_text;
    }
}

<?php

namespace FivePrayer\Core\ShortCodes\Renderers\Traits;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

trait TimeFormattingTrait
{
    protected function formatTime(string $time): string
    {
        if (empty($time)) {
            return $time;
        }

        if ($this->translationManager->isCustomLanguageEnabled()) {
            return $time;
        }

        try {
            return date_i18n(
                str_replace(':s', '', get_option('time_format')),
                strtotime($time)
            );
        } catch (\Exception $e) {
            \FivePrayer\Core\Logging\Logger::error('Error formatting time: ' . $e->getMessage(), 'PrayerTimeRenderer');
            return $time;
        }
    }

    protected function translateTimeString($time): string
    {
        $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
        $customLan = $getMetaFromDB->get_meta_key("hijralocale");

        $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;
        if (!$hijraIsActive || !isset($customLan['customLan']) || $customLan['customLan'] !== true) {
            return $time;
        }

        $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage");
        $gregorian_numbers = $getMetaFromDB->get_meta_key("gregorian_numbers");

        if (empty($activeLanguage[0]['language_code']) || empty($gregorian_numbers)) {
            return $time;
        }

        $targetLang = $activeLanguage[0]['language_code'];
        $translations = [];

        foreach ($gregorian_numbers as &$num) {
            if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                $num['language_code'] === $targetLang) {
                $original = $num['original_text'];
                $translated = $num['translated_text'];
                if (strlen($original) === 1 && strlen($translated) >= 1) {
                    $translations[strtoupper($original)] = $translated;
                    $translations[strtolower($original)] = strtolower($translated);
                } elseif (in_array(strtoupper($original), ['AM', 'PM']) && !empty($translated)) {
                    $translations[strtoupper($original)] = $translated;
                    $translations[strtolower($original)] = strtolower($translated);
                }
            }
        }

        return preg_replace_callback('/[0-9]|AM|PM/i', function($matches) use ($translations) {
            $match = $matches[0];
            $upperMatch = strtoupper($match);
            if (isset($translations[$upperMatch])) return $translations[$upperMatch];
            if (isset($translations[strtolower($upperMatch)])) return $translations[strtolower($upperMatch)];
            return $match;
        }, $time);
    }

    protected function removeSecondWord(string $string): string
    {
        $words = preg_split('/\s+/', trim($string), -1, PREG_SPLIT_NO_EMPTY);
        if (count($words) > 1) {
            unset($words[1]);
            return implode(' ', $words);
        }
        return $string;
    }

    protected function removeSpecificWord(string $string, string $wordToRemove): string
    {
        if (empty($wordToRemove)) {
            return $string;
        }
        return str_replace($wordToRemove, '', $string);
    }
}

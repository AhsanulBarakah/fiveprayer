<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrayerDataCache;

/**
 * Trait TimeFormattingTrait
 *
 * Handles time conversion, multilingual formatting, and number translations.
 * Extracted from ExternalApiController.php for code organization.
 *
 * @package FivePrayer\Core\Controllers\API\EndPoints
 */
trait TimeFormattingTrait
{
    /**
     * Convert time to formatted string with optional number translation.
     */
    private function convert_time(?string $time, string $timezone, ?string $language_code = null, ?string $time_format = null): string
    {
        if (empty($time) || $time === '00:00:00') {
            return $time ?? '';
        }

        $timestamp = strtotime($time);
        $format = ($time_format === '24h') ? 'H:i' : 'g:i A';
        $formatted_time = gmdate($format, $timestamp);

        $gregorian_numbers = json_decode(PrayerDataCache::getSingleMetaValue('gregorian_numbers') ?: '[]', true) ?: [];
        $activeLanguage = json_decode(PrayerDataCache::getSingleMetaValue('activeLanguage') ?: '[]', true) ?: [];
        $active_lang = $language_code ?: ($activeLanguage[0]['language_code'] ?? 'en');

        if ($active_lang !== 'en' && !empty($gregorian_numbers)) {
            $formatted_time = $this->translate_numbers($formatted_time, $gregorian_numbers, $active_lang);
        }

        return $formatted_time;
    }

    /**
     * Convert time for multiple languages.
     */
    private function convert_time_multilingual(?string $time, array $selected_languages, ?string $time_format = null): array
    {
        if (empty($time) || $time === '00:00:00') {
            $result = [];
            foreach ($selected_languages as $lang) {
                $result[$lang] = $time ?? '';
            }
            return $result;
        }

        $timestamp = strtotime($time);
        $format = ($time_format === '24h') ? 'H:i' : 'g:i A';
        $formatted_time_en = gmdate($format, $timestamp);

        $gregorian_numbers = json_decode(PrayerDataCache::getSingleMetaValue('gregorian_numbers') ?: '[]', true) ?: [];

        $result = [];
        foreach ($selected_languages as $lang) {
            $formatted_time = $formatted_time_en;

            // Translate numbers (digits) and AM/PM tokens through the
            // database-stored gregorian_numbers translation system. No
            // language-specific values are hardcoded here.
            if ($lang !== 'en' && !empty($gregorian_numbers)) {
                $formatted_time = $this->translate_numbers($formatted_time, $gregorian_numbers, $lang);
            }

            $result[$lang] = $formatted_time;
        }

        return $result;
    }

    /**
     * Get prayer name translated for multiple languages.
     */
    private function get_prayer_name_multilingual(string $prayer_name, array $selected_languages): array
    {
        $result = [];
        foreach ($selected_languages as $lang) {
            $translationManager = $this->get_translation_manager($lang);
            $result[$lang] = $translationManager->getTranslatedPrayerName($prayer_name);
        }
        return $result;
    }

    /**
     * Get a label translated for multiple languages.
     */
    private function get_label_multilingual(string $label, array $selected_languages): array
    {
        $result = [];
        foreach ($selected_languages as $lang) {
            $translationManager = $this->get_translation_manager($lang);
            $result[$lang] = $translationManager->getTranslatedLabel($label);
        }
        return $result;
    }

    /**
     * Translate numbers in a string using language-specific translations.
     */
    private function translate_numbers(string $text, array $number_translations, string $language_code): string
    {
        $lang_translations = array_filter($number_translations, function ($item) use ($language_code) {
            return isset($item['language_code']) && $item['language_code'] === $language_code;
        });

        foreach ($lang_translations as $translation) {
            if (isset($translation['original_text']) && isset($translation['translated_text'])) {
                $text = str_replace($translation['original_text'], $translation['translated_text'], $text);
            }
        }

        return $text;
    }

    /**
     * Translate numbers in a time string.
     */
    private function translate_numbers_in_time(string $time, ?string $language_code = null, ?string $time_format = null): string
    {
        if (empty($time)) {
            return $time;
        }

        $gregorian_numbers = json_decode(PrayerDataCache::getSingleMetaValue('gregorian_numbers') ?: '[]', true) ?: [];
        $activeLanguage = json_decode(PrayerDataCache::getSingleMetaValue('activeLanguage') ?: '[]', true) ?: [];
        $active_lang = $language_code ?: ($activeLanguage[0]['language_code'] ?? 'en');

        if ($active_lang !== 'en' && !empty($gregorian_numbers)) {
            $time = $this->translate_numbers($time, $gregorian_numbers, $active_lang);
        }

        return $time;
    }

    /**
     * Convert stored datetime values to requested timezone.
     */
    private function convert_datetimes_to_timezone($result, string $timezone): array
    {
        $original_tz = new \DateTimeZone(get_option('timezone_string') ?: 'UTC');
        $target_tz = new \DateTimeZone($timezone);

        $convert = function ($time) use ($original_tz, $target_tz) {
            if (empty($time) || $time === '00:00:00') {
                return $time;
            }
            $dt = new \DateTime($time, $original_tz);
            $dt->setTimezone($target_tz);
            return $dt->format('H:i:s');
        };

        return [
            'fajr' => [
                'begins' => $convert($result->fajr_begins),
                'iqamah' => $convert($result->fajr_iqamah),
            ],
            'dhuhr' => [
                'begins' => $convert($result->dhuhr_begins),
                'iqamah' => $convert($result->dhuhr_iqamah),
            ],
            'asr' => [
                'begins' => $convert($result->asr_begins),
                'iqamah' => $convert($result->asr_iqamah),
            ],
            'asr2' => [
                'begins' => $convert($result->asr_second_begins ?? ''),
            ],
            'maghrib' => [
                'begins' => $convert($result->maghrib_begins),
                'iqamah' => $convert($result->maghrib_iqamah),
            ],
            'isha' => [
                'begins' => $convert($result->isha_begins),
                'iqamah' => $convert($result->isha_iqamah),
            ],
            'sunrise' => $convert($result->sunrise),
            'midnight' => $convert($result->midnight),
        ];
    }
}

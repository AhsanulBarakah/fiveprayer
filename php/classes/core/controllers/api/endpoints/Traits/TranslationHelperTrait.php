<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\ShortCodes\Managers\TranslationManager;

/**
 * Trait TranslationHelperTrait
 *
 * Handles translation support, date translation, and language detection.
 * Extracted from ExternalApiController.php for code organization.
 *
 * @package FivePrayer\Core\Controllers\API\EndPoints
 */
trait TranslationHelperTrait
{
    /**
     * Get the translation manager with loaded data.
     */
    private function get_translation_manager(?string $language_code = null): TranslationManager
    {
        $prayer_names = json_decode(PrayerDataCache::getSingleMetaValue('prayer_names') ?: '[]', true) ?: [];
        $activeLanguage = json_decode(PrayerDataCache::getSingleMetaValue('activeLanguage') ?: '[]', true) ?: [];
        $locale = json_decode(PrayerDataCache::getSingleMetaValue('locale') ?: '[]', true) ?: [];
        $vertical_daily_prayer = json_decode(PrayerDataCache::getSingleMetaValue('vertical_daily_prayer') ?: '[]', true) ?: [];
        $extra_info = json_decode(PrayerDataCache::getSingleMetaValue('extra_info') ?: '[]', true) ?: [];

        if (!isset($locale['customLan']) || $locale['customLan'] !== true) {
            $locale['customLan'] = true;
        }

        if (!$language_code && !empty($activeLanguage)) {
            $activeLanguage = [$activeLanguage[0]];
        } elseif ($language_code) {
            $language_exists = false;

            foreach ($prayer_names as &$item) {
                if (isset($item['language_code']) && $item['language_code'] === $language_code) {
                    $language_exists = true;
                    break;
                }
            }

            if (!$language_exists) {
                foreach ($extra_info as &$item) {
                    if (isset($item['language_code']) && $item['language_code'] === $language_code) {
                        $language_exists = true;
                        break;
                    }
                }
            }

            if ($language_exists) {
                $activeLanguage = [['language_code' => $language_code]];
            } else {
                $activeLanguage = !empty($activeLanguage) ? [$activeLanguage[0]] : [];
            }
        }

        return new TranslationManager(
            $prayer_names,
            $activeLanguage,
            $locale,
            $vertical_daily_prayer,
            $extra_info
        );
    }

    /**
     * Translate a Gregorian date into the structured shape used by the API,
     * mirroring the shape returned for Hijri dates so consumers can use the
     * same code path for both calendars.
     *
     * Return shape:
     *   [
     *     'day'        => [lang => '1' | '١'],
     *     'month'      => [lang => '6' | '٦'],
     *     'year'       => [lang => '2026' | '٢٠٢٦'],
     *     'month_name' => [lang => 'June' | 'يونيو'],
     *     'formatted'  => [lang => '1 June 2026' | '١ يونيو ٢٠٢٦'],
     *   ]
     *
     * Numerals come from the database-stored gregorian_numbers translations,
     * month names from gregorian_months. No language-specific values are
     * hardcoded.
     */
    private function translate_date(string $date, ?string $language_code = null, ?array $selected_languages = null): array
    {
        $translations = [
            'day'        => [],
            'month'      => [],
            'year'       => [],
            'month_name' => [],
            'formatted'  => [],
            'date'       => [],
            'day_label'  => [],
        ];

        $gregorian_months = json_decode(PrayerDataCache::getSingleMetaValue('gregorian_months') ?: '[]', true) ?: [];
        $gregorian_numbers = json_decode(PrayerDataCache::getSingleMetaValue('gregorian_numbers') ?: '[]', true) ?: [];

        if ($selected_languages) {
            $languages_to_translate = $selected_languages;
        } elseif ($language_code) {
            $languages_to_translate = [$language_code];
        } else {
            $activeLanguage = json_decode(PrayerDataCache::getSingleMetaValue('activeLanguage') ?: '[]', true) ?: [];
            $languages_to_translate = [($activeLanguage[0]['language_code'] ?? 'en')];
        }

        try {
            $dateTime = new \DateTime($date);
            $day = (int) $dateTime->format('d');
            $month = (int) $dateTime->format('m');
            $year = (int) $dateTime->format('Y');

            // Canonical English month names used as the lookup key against
            // the database-stored gregorian_months.original_text column.
            $english_months = [
                1 => 'January', 2 => 'February', 3 => 'March', 4 => 'April',
                5 => 'May', 6 => 'June', 7 => 'July', 8 => 'August',
                9 => 'September', 10 => 'October', 11 => 'November', 12 => 'December',
            ];
            $base_month_name = $english_months[$month] ?? '';

            // Aliases - alternative spellings of the canonical English month
            // names. The database defaults use the long form, but admins
            // sometimes author translations with abbreviated keys ("Jan",
            // "Feb", etc.). These are NOT language-specific output bytes; they
            // are just English-language synonym keys used during DB lookup,
            // mirroring the pattern in HijriDateTrait.
            $month_name_aliases = [
                'January'   => ['Jan'],
                'February'  => ['Feb'],
                'March'     => ['Mar'],
                'April'     => ['Apr'],
                'May'       => [],
                'June'      => ['Jun'],
                'July'      => ['Jul'],
                'August'    => ['Aug'],
                'September' => ['Sept', 'Sep'],
                'October'   => ['Oct'],
                'November'  => ['Nov'],
                'December'  => ['Dec'],
            ];

            foreach ($languages_to_translate as $lang) {
                $translated_month = $base_month_name;
                $lookup_names = [$base_month_name];
                if (isset($month_name_aliases[$base_month_name])) {
                    foreach ($month_name_aliases[$base_month_name] as $alias) {
                        if (!in_array($alias, $lookup_names, true)) {
                            $lookup_names[] = $alias;
                        }
                    }
                }
                $found_month = false;
                foreach ($lookup_names as $name_to_lookup) {
                    if ($found_month) {
                        break;
                    }
                    foreach ($gregorian_months as $month_translation) {
                        if (!isset($month_translation['language_code'])
                            || $month_translation['language_code'] !== $lang
                            || !isset($month_translation['original_text'])
                            || !isset($month_translation['translated_text'])
                        ) {
                            continue;
                        }

                        if ($month_translation['original_text'] === $name_to_lookup) {
                            $translated_month = $month_translation['translated_text'];
                            $found_month = true;
                            break;
                        }

                        $normalized_original = str_replace(["'", 'ʻ', '‘', '`'], "'", $month_translation['original_text']);
                        $normalized_lookup = str_replace(["'", 'ʻ', '‘', '`'], "'", $name_to_lookup);
                        if ($normalized_original === $normalized_lookup) {
                            $translated_month = $month_translation['translated_text'];
                            $found_month = true;
                            break;
                        }
                    }
                }

                $number_map = [];
                foreach ($gregorian_numbers as $number_translation) {
                    if (isset($number_translation['language_code'])
                        && $number_translation['language_code'] === $lang
                        && isset($number_translation['original_text'])
                        && isset($number_translation['translated_text'])
                    ) {
                        $number_map[$number_translation['original_text']] = $number_translation['translated_text'];
                    }
                }

                $day_digits = str_split((string) $day);
                $translated_day = '';
                foreach ($day_digits as $digit) {
                    $translated_day .= $number_map[$digit] ?? $digit;
                }

                $month_digits = str_split((string) $month);
                $translated_month_num = '';
                foreach ($month_digits as $digit) {
                    $translated_month_num .= $number_map[$digit] ?? $digit;
                }

                $year_digits = str_split((string) $year);
                $translated_year = '';
                foreach ($year_digits as $digit) {
                    $translated_year .= $number_map[$digit] ?? $digit;
                }

                $translations['day'][$lang]        = $translated_day;
                $translations['month'][$lang]      = $translated_month_num;
                $translations['year'][$lang]       = $translated_year;
                $translations['month_name'][$lang] = $translated_month;
                $translations['formatted'][$lang]  = $translated_day . ' ' . $translated_month . ' ' . $translated_year;
                $translations['date'][$lang]       = $this->get_timetable_label_singular('Date', $lang);
                $translations['day_label'][$lang]  = $this->get_timetable_label_singular('Day', $lang);
            }
        } catch (\Throwable $e) {
            // On failure return the structured shape with empty values so
            // consumers don't have to guess the schema. Keep the shape
            // consistent: every per-language sub-key is empty.
            foreach ($languages_to_translate as $lang) {
                $translations['day'][$lang]        = '';
                $translations['month'][$lang]      = '';
                $translations['year'][$lang]       = '';
                $translations['month_name'][$lang] = '';
                $translations['formatted'][$lang]  = '';
                $translations['date'][$lang]       = '';
                $translations['day_label'][$lang]  = '';
            }
            $translations['error'] = $e->getMessage();
        }

        return $translations;
    }

    /**
     * Get supported languages from database translations.
     */
    private function get_supported_languages(): array
    {
        $prayer_names = json_decode(PrayerDataCache::getSingleMetaValue('prayer_names') ?: '[]', true) ?: [];
        $activeLanguage = json_decode(PrayerDataCache::getSingleMetaValue('activeLanguage') ?: '[]', true) ?: [];
        $vertical_daily_prayer = json_decode(PrayerDataCache::getSingleMetaValue('vertical_daily_prayer') ?: '[]', true) ?: [];
        $extra_info = json_decode(PrayerDataCache::getSingleMetaValue('extra_info') ?: '[]', true) ?: [];
        $gregorian_months = json_decode(PrayerDataCache::getSingleMetaValue('gregorian_months') ?: '[]', true) ?: [];
        $hijra_months = json_decode(PrayerDataCache::getSingleMetaValue('hijra_months') ?: '[]', true) ?: [];

        $supported_languages = [];

        $translation_arrays = [
            $prayer_names,
            $activeLanguage,
            $vertical_daily_prayer,
            $extra_info,
            $gregorian_months,
            $hijra_months,
        ];

        foreach ($translation_arrays as $translations) {
            if (is_array($translations)) {
                foreach ($translations as $translation) {
                    if (isset($translation['language_code'])) {
                        $supported_languages[] = $translation['language_code'];
                    }
                }
            }
        }

        $unique_languages = array_unique(array_filter($supported_languages));

        // English is always supported as the default fallback language.
        if (!in_array('en', $unique_languages, true)) {
            $unique_languages[] = 'en';
        }

        return array_values($unique_languages);
    }

    /**
     * Resolve and validate language parameters from a REST request.
     *
     * Returns an array [language, selected_languages] where:
     *   - language is the single requested language code (may be null)
     *   - selected_languages is an array of codes from the ?langs parameter (may be null)
     *
     * Returns WP_Error if any requested language is unsupported.
     */
    private function resolve_language_params(\WP_REST_Request $request)
    {
        $language = $request->get_param('lang');
        $langs = $request->get_param('langs');

        if ($language && !in_array($language, $this->get_supported_languages(), true)) {
            return new \WP_Error('invalid_lang', '', ['status' => 400]);
        }

        $selected_languages = null;
        if ($langs) {
            $requested_languages = array_map('trim', explode(',', $langs));
            $supported_languages = $this->get_supported_languages();
            foreach ($requested_languages as $lang_code) {
                if (!in_array($lang_code, $supported_languages, true)) {
                    return new \WP_Error('invalid_language', '', ['status' => 400, 'lang_code' => $lang_code]);
                }
            }
            $selected_languages = $requested_languages;
        }

        return [$language, $selected_languages];
    }

    /**
     * Get active languages (default).
     */
    private function get_active_languages(): array
    {
        return ['en', 'ar'];
    }

    /**
     * Look up a single translated label from the `timetable_prayer` translation
     * collection for a single language. Returns an empty string when no match
     * is found so consumers receive a stable, never-hardcoded scalar.
     */
    private function get_timetable_label_singular(string $label, ?string $language_code = null): string
    {
        $timetable_prayer = json_decode(PrayerDataCache::getSingleMetaValue('timetable_prayer') ?: '[]', true) ?: [];
        if (empty($timetable_prayer) || $language_code === null || $language_code === '') {
            return '';
        }

        foreach ($timetable_prayer as $item) {
            if (!isset($item['language_code'], $item['original_text'], $item['translated_text'])) {
                continue;
            }
            if ($item['language_code'] === $language_code
                && strcasecmp($item['original_text'], $label) === 0) {
                return $item['translated_text'];
            }
        }
        return '';
    }

    /**
     * Look up the translated `timetable_prayer` label across multiple languages
     * returning a `[language_code => translated_text]` map. Each selected
     * language that has no DB match maps to an empty string so the response
     * shape stays stable.
     */
    private function get_timetable_label_multilingual(string $label, array $selected_languages): array
    {
        $timetable_prayer = json_decode(PrayerDataCache::getSingleMetaValue('timetable_prayer') ?: '[]', true) ?: [];
        $result = [];
        foreach ($selected_languages as $lang) {
            $value = '';
            foreach ($timetable_prayer as $item) {
                if (!isset($item['language_code'], $item['original_text'], $item['translated_text'])) {
                    continue;
                }
                if ($item['language_code'] === $lang
                    && strcasecmp($item['original_text'], $label) === 0) {
                    $value = $item['translated_text'];
                    break;
                }
            }
            $result[$lang] = $value;
        }
        return $result;
    }
}

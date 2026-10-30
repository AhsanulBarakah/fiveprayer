<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrayerDataCache;

/**
 * Trait HijriDateTrait
 *
 * Handles Hijri date calculations, Ramadan detection, and Hijri number translation.
 * Extracted from ExternalApiController.php for code organization.
 *
 * @package FivePrayer\Core\Controllers\API\EndPoints
 */
trait HijriDateTrait
{
    /**
     * Get Hijri date information including Ramadan detection.
     */
    private function get_hijri_date_info(string $date, ?string $language_code = null, ?array $selected_languages = null, ?string $ramadan_start_date = null): array
    {
        try {
            $dateTime = new \DateTime($date);

            $day = (int) $dateTime->format('d');
            $month = (int) $dateTime->format('m');
            $year = (int) $dateTime->format('Y');

            $jd = gregoriantojd($month, $day, $year);

            $l = $jd - 1948440;
            $n = floor(($l - 1) / 10631);
            $l = $l - 10631 * $n - 354;
            $j = floor((10985 - $l) / 5316) * floor((50 * $l) / 17719) + floor($l / 5670) * floor((43 * $l) / 15238);
            $l = $l - floor((30 - $j) / 15) * floor((17719 * $j) / 50) - floor($j / 16) * floor((15238 * $j) / 43) + 29;
            $hijri_month = floor((24 * $l) / 709);
            $hijri_day = $l - floor((709 * $hijri_month) / 24);
            $hijri_year = 30 * $n + $j - 30;

            $hijri_year += 1447 - 1415;

            $hijri_day = max(1, $hijri_day);
            $hijri_month = max(1, min(12, $hijri_month));

            if ($ramadan_start_date) {
                $customRamadanStart = new \DateTime($ramadan_start_date);
                $daysDifference = $dateTime->diff($customRamadanStart)->days;

                if ($dateTime >= $customRamadanStart && $daysDifference < 30) {
                    $is_ramadan = true;
                    $hijri_day = $daysDifference + 1;
                    $hijri_month = 9;
                } else {
                    $is_ramadan = false;
                }
            } else {
                $isRamadan = json_decode(PrayerDataCache::getSingleMetaValue('ramadan') ?: '[]', true) ?: [];
                $ramadan_custom = 0;
                if (isset($isRamadan['ramadan']) && $isRamadan['ramadan']) {
                    $ramadan_custom = isset($isRamadan['ramadan_custom']) ? (int) $isRamadan['ramadan_custom'] : 0;
                }

                if ($ramadan_custom != 0) {
                    $dateTime->modify("{$ramadan_custom} day");

                    $day = (int) $dateTime->format('d');
                    $month = (int) $dateTime->format('m');
                    $year = (int) $dateTime->format('Y');

                    $jd = gregoriantojd($month, $day, $year);

                    $l = $jd - 1948440;
                    $n = floor(($l - 1) / 10631);
                    $l = $l - 10631 * $n - 354;
                    $j = floor((10985 - $l) / 5316) * floor((50 * $l) / 17719) + floor($l / 5670) * floor((43 * $l) / 15238);
                    $l = $l - floor((30 - $j) / 15) * floor((17719 * $j) / 50) - floor($j / 16) * floor((15238 * $j) / 43) + 29;
                    $hijri_month = floor((24 * $l) / 709);
                    $hijri_day = $l - floor((709 * $hijri_month) / 24);
                    $hijri_year = 30 * $n + $j - 30;

                    $hijri_year += 1447 - 1415;

                    $hijri_day = max(1, $hijri_day);
                    $hijri_month = max(1, min(12, $hijri_month));
                }

                $is_ramadan = ($hijri_month == 9);
            }

            $hijra_months = json_decode(PrayerDataCache::getSingleMetaValue('hijra_months') ?: '[]', true) ?: [];
            $hijra_numbers = json_decode(PrayerDataCache::getSingleMetaValue('hijra_numbers') ?: '[]', true) ?: [];

            // Fallback to gregorian_numbers if hijra_numbers is empty, so number
            // translation still works through the database-driven translation system
            // even if admins did not maintain a separate hijra_numbers list.
            if (empty($hijra_numbers)) {
                $gregorian_numbers_fallback = json_decode(PrayerDataCache::getSingleMetaValue('gregorian_numbers') ?: '[]', true) ?: [];
                if (!empty($gregorian_numbers_fallback)) {
                    $hijra_numbers = $gregorian_numbers_fallback;
                }
            }

            if ($selected_languages) {
                $languages_to_translate = $selected_languages;
            } elseif ($language_code) {
                $languages_to_translate = [$language_code];
            } else {
                $activeLanguage = json_decode(PrayerDataCache::getSingleMetaValue('activeLanguage') ?: '[]', true) ?: [];
                $languages_to_translate = [($activeLanguage[0]['language_code'] ?? 'en')];
            }

            // Canonical English month names that match the original_text keys used
            // by the database-stored hijra_months translations (and the
            // IntlDateFormatter islamic-calendar convention). Keeping these in
            // sync with the DB defaults means the DB-driven translation lookup
            // succeeds for every month, avoiding mixed Arabic-numerals +
            // English-month-name output.
            $hijri_months_en = [
                1 => 'Muharram', 2 => 'Safar',
                3 => 'Rabiʻ I', 4 => 'Rabiʻ II',
                5 => 'Jumada I', 6 => 'Jumada II',
                7 => 'Rajab', 8 => 'Shaʻban',
                9 => 'Ramadan', 10 => 'Shawwal',
                11 => 'Dhuʻl-Qiʻdah', 12 => 'Dhuʻl-Hijjah',
            ];

            // Aliases - alternative spellings of the canonical English month
            // names, for backward compatibility with database translations
            // authored using the older "Rabi' al-awwal / Dhu al-Qi'dah" form.
            // No language-specific output is hardcoded here: these are just
            // English-language synonym keys used during DB lookup, so existing
            // user translations still resolve correctly.
            $month_name_aliases = [
                'Rabiʻ I'     => ["Rabi' al-awwal", 'Rabi‘ I', "Rabi' I"],
                'Rabiʻ II'    => ["Rabi' al-thani", 'Rabi‘ II', "Rabi' II"],
                'Jumada I'    => ['Jumada al-awwal', "Jumada' I"],
                'Jumada II'   => ['Jumada al-thani', "Jumada' II"],
                'Dhuʻl-Qiʻdah' => ["Dhu al-Qi'dah", 'Dhu‘l-Qi‘dah', "Dhu'l-Qi'dah"],
                'Dhuʻl-Hijjah' => ['Dhu al-Hijjah', 'Dhu‘l-Hijjah', "Dhu'l-Hijjah"],
            ];

            $base_month_name = $hijri_months_en[$hijri_month] ?? '';

            // Build set of names to look up: the canonical name first, then any
            // known aliases. This way both the new Intl-style keys and any
            // existing user-authored translations with the older form can be
            // resolved purely from the database.
            $lookup_names = [$base_month_name];
            if (isset($month_name_aliases[$base_month_name])) {
                foreach ($month_name_aliases[$base_month_name] as $alias) {
                    if (!in_array($alias, $lookup_names, true)) {
                        $lookup_names[] = $alias;
                    }
                }
            }

            $hijri_date_translated = [];

            foreach ($languages_to_translate as $lang) {
                $translated_month = $base_month_name;
                foreach ($lookup_names as $name_to_lookup) {
                    foreach ($hijra_months as $month_translation) {
                        if (!isset($month_translation['language_code'])
                            || $month_translation['language_code'] !== $lang
                            || !isset($month_translation['original_text'])
                            || !isset($month_translation['translated_text'])
                        ) {
                            continue;
                        }

                        if ($month_translation['original_text'] === $name_to_lookup) {
                            $translated_month = $month_translation['translated_text'];
                            break 2;
                        }

                        $normalized_original = str_replace(["'", 'ʻ', '‘', '`'], "'", $month_translation['original_text']);
                        $normalized_lookup = str_replace(["'", 'ʻ', '‘', '`'], "'", $name_to_lookup);
                        if ($normalized_original === $normalized_lookup) {
                            $translated_month = $month_translation['translated_text'];
                            break 2;
                        }
                    }
                }

                $number_map = [];
                foreach ($hijra_numbers as $number_translation) {
                    if (isset($number_translation['language_code'])
                        && $number_translation['language_code'] === $lang
                        && isset($number_translation['original_text'])
                        && isset($number_translation['translated_text'])
                    ) {
                        $number_map[$number_translation['original_text']] = $number_translation['translated_text'];
                    }
                }

                $day_digits = str_split((string) (int) $hijri_day);
                $translated_day = '';
                foreach ($day_digits as $digit) {
                    $translated_day .= $number_map[$digit] ?? $digit;
                }

                $month_digits = str_split((string) (int) $hijri_month);
                $translated_month_num = '';
                foreach ($month_digits as $digit) {
                    $translated_month_num .= $number_map[$digit] ?? $digit;
                }

                $year_digits = str_split((string) (int) $hijri_year);
                $translated_year = '';
                foreach ($year_digits as $digit) {
                    $translated_year .= $number_map[$digit] ?? $digit;
                }

                $hijri_date_translated['day'][$lang] = $translated_day;
                $hijri_date_translated['month'][$lang] = $translated_month_num;
                $hijri_date_translated['year'][$lang] = $translated_year;
                $hijri_date_translated['month_name'][$lang] = $translated_month;
                $hijri_date_translated['formatted'][$lang] = $translated_day . ' ' . $translated_month . ' ' . $translated_year;
                $hijri_date_translated['date'][$lang] = $this->get_timetable_label_singular('Hijri Date', $lang);
                $hijri_date_translated['day_label'][$lang] = $this->get_timetable_label_singular('Day', $lang);
            }

            return [
                'hijri_date' => $hijri_date_translated,
                'is_ramadan' => $is_ramadan,
            ];
        } catch (\Exception $e) {
            // Do not hardcode language-specific strings here - the database
            // translation system is the single source of truth for localized
            // text. We return null so consumers can distinguish "Hijri
            // calculation failed" from "Hijri computed but no languages were
            // requested".
            return [
                'hijri_date' => null,
                'is_ramadan' => null,
                'error' => 'Hijri calculation failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Calculate Hijri date from Gregorian date (simplified version).
     */
    private function get_hijri_date_from_gregorian(\DateTime $date, array $locale): array
    {
        $year = (int) $date->format('Y');
        $month = (int) $date->format('m');
        $day = (int) $date->format('d');

        $a = floor((14 - $month) / 12);
        $y = $year + 4800 - $a;
        $m = $month + 12 * $a - 3;
        $jd = $day + floor((153 * $m + 2) / 5) + 365 * $y + floor($y / 4) - floor($y / 100) + floor($y / 400) - 32045;

        $islamic_epoch = 1948439.5;
        $days_since_epoch = $jd - $islamic_epoch;

        $hijri_year = floor($days_since_epoch / 354.367);

        $days_in_years = floor(($hijri_year - 1) * 354.367);
        $day_of_year = $days_since_epoch - $days_in_years;

        $month_num = 1;
        $remaining_days = $day_of_year;

        for ($i = 0; $i < 12; $i++) {
            $days_in_month = (($i + 1) % 2 == 1) ? 30 : 29;

            if ($i == 11) {
                $cycle_year = $hijri_year % 30;
                $is_leap = in_array($cycle_year, [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29]);
                $days_in_month = $is_leap ? 30 : 29;
            }

            if ($remaining_days <= $days_in_month) {
                $month_num = $i + 1;
                break;
            }
            $remaining_days -= $days_in_month;
        }

        return [
            'day' => (int) $remaining_days,
            'month' => (int) $month_num,
        ];
    }
}

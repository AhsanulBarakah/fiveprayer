<?php

namespace FivePrayer\Core\ShortCodes\Traits;

use FivePrayer\Core\Helpers\PrayerDataCache;

defined('ABSPATH') || exit('Direct script access denied.');

trait VerticalPrayerDataTrait
{
    private static $prayer_times_cache = null;
    private static $prayer_times_cache_date = null;

    private function getTranslationData(): array
    {
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
            $targetLang = $activeLanguage[0]['language_code'];
            $foundAM = false;
            $foundPM = false;
            foreach ($numbers as &$num) {
                if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                    $num['language_code'] === $targetLang) {
                    $original = strtoupper($num['original_text']);
                    $translated = $num['translated_text'];
                    $translations[$original] = $translated;
                    $translations[strtolower($original)] = strtolower($translated);
                    if ($original === 'AM') $foundAM = true;
                    if ($original === 'PM') $foundPM = true;
                }
            }
            if (!$foundAM || !$foundPM) {
                foreach ($numbers as &$num) {
                    if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                        $num['language_code'] === 'en') {
                        $original = strtoupper($num['original_text']);
                        $translated = $num['translated_text'];
                        if (($original === 'AM' && !$foundAM) || ($original === 'PM' && !$foundPM)) {
                            $translations[$original] = $translated;
                            $translations[strtolower($original)] = strtolower($translated);
                        }
                    }
                }
            }
        }

        return $translations;
    }

    private function getTranslatedNameVDP($key): string
    {
        $hijraIsActive = isset($this->locale['isActive']) && $this->locale['isActive'] === true;
        if (!$hijraIsActive || empty($this->locale['customLan']) || $this->locale['customLan'] == false) {
            return ucfirst($key);
        }

        if (empty($this->vertical_daily_prayer) || empty($this->activeLanguage)) {
            return ucfirst($key);
        }

        foreach ($this->vertical_daily_prayer as $item) {
            if ($item['language_code'] === $this->activeLanguage[0]['language_code']) {
                if (strcasecmp($key, $item['original_text']) === 0) {
                    return esc_html($item['translated_text']);
                }
            }
        }
        return ucfirst($key);
    }

    private function getTranslatedName($prayerKey, $prayer_names, $activeLanguage): string
    {
        if (empty($prayer_names) || empty($activeLanguage) || empty($this->locale['customLan']) || $this->locale['customLan'] == false) {
            return ucfirst($prayerKey);
        }

        foreach ($prayer_names as &$prayer_name) {
            if ($prayer_name['language_code'] === $activeLanguage[0]['language_code']) {
                if (strcasecmp($prayerKey, $prayer_name['original_text']) === 0) {
                    return esc_html($prayer_name['translated_text']);
                }
            }
        }
        return ucfirst($prayerKey);
    }

    private function getTodayPrayerTimes()
    {
        $current_date = current_time('Y-m-d');

        if (self::$prayer_times_cache === null || self::$prayer_times_cache_date !== $current_date) {
            $this->log("ShortCodeVerticalDailyPrayer: Getting prayer times for date: " . $current_date);
            $prayer_times = PrayerDataCache::getTodaysPrayerTimes($current_date);
            $this->log("ShortCodeVerticalDailyPrayer: Raw prayer times: " . json_encode($prayer_times));

            if (empty($prayer_times)) {
                $this->log("ShortCodeVerticalDailyPrayer: No prayer times found for date: " . $current_date);
                return null;
            }

            if (is_object($prayer_times) && isset($prayer_times->date)) {
                $prayer_data = (array)$prayer_times;
                self::$prayer_times_cache = (object)[
                    'date' => $prayer_data['date'],
                    'fajr_begins' => $prayer_data['fajr_begins'] ?? null,
                    'fajr_iqamah' => $prayer_data['fajr_iqamah'] ?? null,
                    'sunrise' => $prayer_data['sunrise'] ?? null,
                    'dhuhr_begins' => $prayer_data['dhuhr_begins'] ?? null,
                    'dhuhr_iqamah' => $prayer_data['dhuhr_iqamah'] ?? null,
                    'asr_begins' => $prayer_data['asr_begins'] ?? null,
                    // Optional second ‘Asr (2 Mithl / Hanafi) — the Asr 2 row.
                    'asr_second_begins' => $prayer_data['asr_second_begins'] ?? null,
                    'asr_iqamah' => $prayer_data['asr_iqamah'] ?? null,
                    'maghrib_begins' => $prayer_data['maghrib_begins'] ?? null,
                    'maghrib_iqamah' => $prayer_data['maghrib_iqamah'] ?? null,
                    'isha_begins' => $prayer_data['isha_begins'] ?? null,
                    'isha_iqamah' => $prayer_data['isha_iqamah'] ?? null
                ];
                self::$prayer_times_cache_date = $current_date;
            }

            $this->log("ShortCodeVerticalDailyPrayer: Cached prayer times: " . json_encode(self::$prayer_times_cache));
        }

        return self::$prayer_times_cache;
    }
}

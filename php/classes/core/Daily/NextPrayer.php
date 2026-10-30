<?php
namespace FivePrayer\Core\Daily;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\TimeToEnglish;
use InvalidArgumentException;
use RuntimeException;
use FivePrayer\Core\Helpers\PrayerDataCache;

if (!class_exists('FivePrayer\Core\Daily\NextPrayer')) {

    /**
     * Class to handle next prayer calculation
     * 
     * @since 1.0.0
     */
    class NextPrayer 
    {
        private $next_prayer_data = [];
        private $locale = [];
        private $timeConverter;

        public function __construct(?TimeToEnglish $timeConverter = null) 
        {
            if (!class_exists('FivePrayer\Core\Helpers\TimeToEnglish')) {
                throw new RuntimeException('TimeToEnglish class is required');
            }
            
            $this->timeConverter = $timeConverter ?? new TimeToEnglish();

            $value = PrayerDataCache::getMetaValueByKey("hijralocale");

            // Check if it's an array with at least one element
            if (is_array($value) && count($value) > 0 && is_string($value[0])) {
                $this->locale = json_decode($value[0], true); // decode JSON string to assoc array
            } else {
                $this->locale = [];
            }
            


        }

        public function getNextPrayer($prayer, $timetable_prayer, $prayer_names, $activeLanguage)
        {
            // Ensure all arrays are properly initialized before validation
            $timetable_prayer = is_null($timetable_prayer) ? [] : $timetable_prayer;
            $prayer_names = is_null($prayer_names) ? [] : $prayer_names;
            $activeLanguage = is_null($activeLanguage) ? [] : $activeLanguage;

            $this->validateInputs($prayer, $timetable_prayer, $prayer_names, $activeLanguage);

            // Check if iqamah is disabled
            $skip_iqamah_midnight = PrayerDataCache::getSingleMetaValue("skip_iqamah_midnight");
            $use_iqamah = $skip_iqamah_midnight !== '1';

            $current_time = current_time('timestamp');
            $prayer_times_begins = $this->getPrayerTimesArrayBegins($prayer);
            $prayer_times_iqamah = $this->getPrayerTimesArrayIqamah($prayer);

            // Use iqamah times if enabled, otherwise use begin times
            $prayer_times_to_check = $use_iqamah ? $prayer_times_iqamah : $prayer_times_begins;

            // Find all valid future prayers and select the one with the earliest time
            $future_prayers = [];

            foreach ($prayer_times_to_check as $slug => $time) {
                $begin_time = $prayer_times_begins[$slug] ?? '';

                if (empty($time)) continue;

                $time_string = $this->normalizeTimeFormat($time);
                if (!$time_string) continue;

                // Create a timestamp for today with the prayer time to ensure proper date context
                $today_date = gmdate('Y-m-d');
                $full_time_string = $today_date . ' ' . $time_string;
                $timestamp = strtotime($full_time_string);

                if ($timestamp === false) continue;

                $timestamp_with_buffer = $timestamp + 60;

                if ($current_time < $timestamp_with_buffer) {
                    $future_prayers[] = [
                        'slug' => $slug,
                        'time' => $time,
                        'timestamp' => $timestamp,
                        'timestamp_with_buffer' => $timestamp_with_buffer
                    ];
                }
            }

            // If we found future prayers, return the one with the earliest time
            if (!empty($future_prayers)) {
                // Sort by timestamp to get the earliest prayer
                usort($future_prayers, function($a, $b) {
                    return $a['timestamp'] <=> $b['timestamp'];
                });

                $next_prayer = $future_prayers[0];
                $this->setNextPrayerData($next_prayer['slug'], $next_prayer['time'],
                                       $next_prayer['timestamp'], $next_prayer['timestamp_with_buffer'],
                                       $timetable_prayer, $prayer_names, $activeLanguage);
                return $next_prayer['slug'];
            }

            // Fallback to next day's fajr
            $this->handleNextDayFajr($prayer, $timetable_prayer, $prayer_names, $activeLanguage, $use_iqamah);
            return 'fajr';
        }

        public function getNextPrayerData() 
        {
            return $this->next_prayer_data;
        }

        private function validateInputs($prayer, $timetable_prayer, $prayer_names, $activeLanguage)
        {
            if (!is_object($prayer)) {
                throw new InvalidArgumentException('Prayer times must be an object');
            }

            if (!is_array($timetable_prayer) && !is_null($timetable_prayer)) {
                throw new InvalidArgumentException('Timetable data must be an array or null');
            }

            if (!is_array($prayer_names) && !is_null($prayer_names)) {
                throw new InvalidArgumentException('Prayer names must be an array or null');
            }

            if (!is_array($activeLanguage) && !is_null($activeLanguage)) {
                throw new InvalidArgumentException('Active language must be an array or null');
            }
        }

        private function normalizeTimeFormat($time) 
        {
            if (empty($time) || !is_string($time)) {
                return false;
            }
            
            if (preg_match('/\b(am|pm)\b/i', $time)) {
                return $time;
            }
           
            if (($this->locale['customLan'] ?? false)) {
                return $this->timeConverter->convertToEnglish($time);
            }
            
            return $time;
        }

        private function getPrayerTimesArrayBegins($prayer) 
        {
            return [
                'fajr'    => $prayer->fajr_begins ?? '',
                'sunrise' => $prayer->sunrise ?? '',
                'dhuhr'   => $prayer->dhuhr_begins ?? '',
                'asr'     => $prayer->asr_begins ?? '',
                'maghrib' => $prayer->maghrib_begins ?? '',
                'isha'    => $prayer->isha_begins ?? ''
            ];
        }

        private function getPrayerTimesArrayIqamah($prayer) 
        {
            return [
                'fajr'    => $prayer->fajr_iqamah ?? '',
                'sunrise' => $prayer->sunrise ?? '',
                'dhuhr'   => $prayer->dhuhr_iqamah ?? '',
                'asr'     => $prayer->asr_iqamah ?? '',
                'maghrib' => $prayer->maghrib_iqamah ?? '',
                'isha'    => $prayer->isha_iqamah ?? ''
            ];
        }

        private function setNextPrayerData($slug, $time, $timestamp, $timestamp_with_buffer,
                                         $timetable_prayer, $prayer_names, $activeLanguage) 
        {
          
            $this->next_prayer_data = [
                'name' => $this->getPrayerName($slug, $timetable_prayer, $prayer_names, $activeLanguage),
                'time' => esc_html($time),
                'original_timestamp' => intval($timestamp),
                'timestamp' => intval($timestamp_with_buffer)
            ];
        }

        private function handleNextDayFajr($prayer, $timetable_prayer, $prayer_names, $activeLanguage, $use_iqamah = true)
        {
            $fajr_time = $this->normalizeTimeFormat($use_iqamah ? ($prayer->fajr_iqamah ?? '') : ($prayer->fajr_begins ?? ''));

            // Create timestamp for tomorrow's Fajr time, not today's
            $tomorrow_date = gmdate('Y-m-d', strtotime('+1 day'));
            $fajr_timestamp = $fajr_time ? strtotime($tomorrow_date . ' ' . $fajr_time) : 0;

            $this->setNextPrayerData(
                'fajr',
                $use_iqamah ? ($prayer->fajr_iqamah ?? '') : ($prayer->fajr_begins ?? ''),
                $fajr_timestamp,
                $fajr_timestamp + 60,
                $timetable_prayer,
                $prayer_names,
                $activeLanguage
            );
        }

        private function getPrayerName($slug, $timetable_prayer, $prayer_names, $activeLanguage)
        {
            $default_names = [
                'fajr'    => 'Fajr',
                'sunrise' => 'Sunrise',
                'dhuhr'   => 'Dhuhr',
                'asr'     => 'Asr',
                'maghrib' => 'Maghrib',
                'isha'    => 'Isha'
            ];

            if (!array_key_exists($slug, $default_names)) {
                return sanitize_text_field($slug);
            }

            if (empty($this->locale['customLan']) || empty($activeLanguage) || empty($activeLanguage[0]['language_code'])) {
                return sanitize_text_field($default_names[$slug]);
            }

            $lang_code = sanitize_text_field($activeLanguage[0]['language_code']);

            if (!is_array($prayer_names)) {
                return sanitize_text_field($default_names[$slug]);
            }

            foreach ($prayer_names as &$name) {
                if (isset($name['language_code'], $name['original_text'], $name['translated_text']) &&
                    $name['language_code'] === $lang_code &&
                    strcasecmp($default_names[$slug], $name['original_text']) === 0) {
                    return sanitize_text_field($name['translated_text']);
                }
            }

            return sanitize_text_field($default_names[$slug]);
        }
    }
}
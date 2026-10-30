<?php
namespace FivePrayer\Core\Calendar;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\GetMeta;
use FivePrayer\Core\Helpers\DateFormatted;

use DateTime;
use IntlDateFormatter;

if (!class_exists(__NAMESPACE__ . '\Hijra')) {
    class Hijra
    {
        private $cache_key = 'fiveprayer_hijra_metadata';
        private $cache_ttl = HOUR_IN_SECONDS; // Cache for 1 hour by default
        private $cache_version = '_v2'; // Increment to force cache clear when algorithm changes

        /**
         * Convert Gregorian date to Hijri using pure PHP calculation
         * This is a fallback when IntlDateFormatter is not available
         *
         * @param DateTime $date
         * @param array $locale Locale settings
         * @return array Array with hijri day, month, year
         */
        private function gregorianToHijri(DateTime $date, array $locale): array
        {
            $year = (int)$date->format('Y');
            $month = (int)$date->format('m');
            $day = (int)$date->format('d');

            // Calculate Julian Day Number
            $a = floor((14 - $month) / 12);
            $y = $year + 4800 - $a;
            $m = $month + 12 * $a - 3;
            $jd = $day + floor((153 * $m + 2) / 5) + 365 * $y + floor($y / 4) - floor($y / 100) + floor($y / 400) - 32045;

            // Islamic calendar calculations (simpler algorithm)
            // Islamic epoch: July 16, 622 CE (Julian) = JD 1948439.5
            $islamic_epoch = 1948439.5;
            $days_since_epoch = $jd - $islamic_epoch;
            
            // Calculate Hijri year (average Islamic year = 354.367 days)
            $hijri_year = floor($days_since_epoch / 354.367);
            
            // Calculate days into current year
            $days_in_years = floor(($hijri_year - 1) * 354.367);
            $day_of_year = floor($days_since_epoch - $days_in_years) + 1;
            
            // Calculate month and day
            // Islamic months alternate: 30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29/30
            $month_num = 1;
            $remaining_days = $day_of_year;
            
            for ($i = 0; $i < 12; $i++) {
                // Odd months (1,3,5,7,9,11) have 30 days, even months (2,4,6,8,10) have 29 days
                $days_in_month = (($i + 1) % 2 == 1) ? 30 : 29;
                
                // Month 12 (Dhu al-Hijjah) has 30 days in leap years
                if ($i == 11) {
                    // Leap year in 30-year cycle: years 2,5,7,10,13,16,18,21,24,26,29
                    $cycle_year = $hijri_year % 30;
                    $is_leap = in_array($cycle_year, [2,5,7,10,13,16,18,21,24,26,29]);
                    $days_in_month = $is_leap ? 30 : 29;
                }
                
                if ($remaining_days <= $days_in_month) {
                    $month_num = $i + 1;
                    break;
                }
                $remaining_days -= $days_in_month;
            }
            
            $day_num = $remaining_days;

            // Hijri month names in English
            $hijriMonthsEnglish = [
                'Muharram', 'Safar', 'Rabi\' al-awwal', 'Rabi\' al-thani',
                'Jumada al-awwal', 'Jumada al-thani', 'Rajab', 'Sha\'ban',
                'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'
            ];

            // Hijri month names in Arabic
            $hijriMonthsArabic = [
                'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر',
                'جمادى الأول', 'جمادى الآخر', 'رجب', 'شعبان',
                'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
            ];

            // Determine which month names to use based on locale
            $useArabic = (strpos($locale['lan'] ?? '', 'ar') === 0);
            $hijriMonths = $useArabic ? $hijriMonthsArabic : $hijriMonthsEnglish;

            return [
                'day' => (int)$day_num,
                'month' => (int)$month_num,
                'month_name' => $hijriMonths[$month_num - 1] ?? 'Unknown',
                'year' => (int)$hijri_year
            ];
        }

        public function hijra($data)
        {
            // Sanitize input data
            $data = sanitize_text_field($data);

            // Validate date format
            if (empty($data) || $data === '0000-00-00' || $data === 'NaN-NaN-NaN') {
                return ''; // Return empty string for invalid dates
            }

            // Initialize required classes
            $getMetaFromDB = new GetMeta();
            $dateFormatted = new DateFormatted();

            // Fetch meta data with cache control
            $locale = $this->getCachedMeta('hijralocale');
            $isRamadan = $this->getCachedMeta('ramadan');
            $activeLanguage = $this->getCachedMeta('activeLanguage');
            $hijra_months = $this->getCachedMeta('hijra_months');
            $hijra_numbers = $this->getCachedMeta('hijra_numbers');

            // Validate locale data
            if (!is_array($locale) || !isset($locale['lan'], $locale['calenderType'])) {
                return ''; // Return empty if locale data is invalid
            }

            // When the Hijri calendar is not activated, never return a Hijri date —
            // formatting with the locale's calendar type would otherwise output the
            // Gregorian date and duplicate it wherever it is displayed.
            if (!isset($locale['isActive']) || $locale['isActive'] !== true) {
                return '';
            }

            // Create DateTime object
            try {
                $DateTime = new DateTime($data);
            } catch (\Exception $e) {
                return '';
            }

            // Adjust date for Ramadan if enabled
            if (isset($isRamadan['ramadan']) && $isRamadan['ramadan']) {
                $ramadanCustomDays = isset($isRamadan['ramadan_custom']) ? (int)$isRamadan['ramadan_custom'] : 0;
                $DateTime->modify("+{$ramadanCustomDays} day");
            }

            // Generate cache key for this specific date and locale (with version)
            $cache_key = $this->cache_key . $this->cache_version . '_' . $data . '_' . md5(serialize($locale));
            $cached = get_transient($cache_key);

            // Return cached result if available
            if ($cached !== false) {
                return $cached;
            }

            // Format the date using IntlDateFormatter with error handling
            $hijra = '';
            $usePurePHP = false;

            try {
                // Check if IntlDateFormatter is available and working
                if (!class_exists('IntlDateFormatter')) {
                    $usePurePHP = true;
                } else {
                    $IntlDateFormatter = new IntlDateFormatter(
                        "{$locale['lan']}@calendar={$locale['calenderType']}",
                        IntlDateFormatter::LONG,
                        IntlDateFormatter::NONE,
                        null,
                        IntlDateFormatter::TRADITIONAL
                    );

                    // Check if formatter was created successfully
                    if (!$IntlDateFormatter) {
                        $usePurePHP = true;
                    } else {
                        $hijra = $IntlDateFormatter->format($DateTime);

                        // Check if formatting succeeded
                        if ($hijra === false || empty($hijra)) {
                            $usePurePHP = true;
                        }
                    }
                }

                // Use pure PHP calculation as fallback
                if ($usePurePHP) {
                    $hijriDate = $this->gregorianToHijri($DateTime, $locale);
                    $hijra = $hijriDate['day'] . ' ' . $hijriDate['month_name'] . ' ' . $hijriDate['year'];
                }
            } catch (\Exception $e) {
                // Use pure PHP calculation as final fallback
                $hijriDate = $this->gregorianToHijri($DateTime, $locale);
                $hijra = $hijriDate['day'] . ' ' . $hijriDate['month_name'] . ' ' . $hijriDate['year'];
            }

            // Apply custom language formatting if enabled
            if (isset($locale['customLan']) && $locale['customLan'] && !empty($hijra)) {
                $hijra = $dateFormatted->hijra_format($hijra, $hijra_numbers, $hijra_months, $activeLanguage);
            }

            // Cache the result
            set_transient($cache_key, $hijra, $this->cache_ttl);

            return $hijra;
        }

        /**
         * Get the Hijri month number for a Gregorian date.
         * Uses IntlDateFormatter with a pre-initialized formatter for batch efficiency.
         *
         * @param string $date Gregorian date in Y-m-d format.
         * @param IntlDateFormatter|null $formatter Pre-initialized formatter (passed from caller for reuse).
         * @return int Hijri month number (1-12), or 0 on invalid input.
         */
        public function getHijriMonth(string $date, $formatter = null): int
        {
            if (empty($date) || $date === '0000-00-00' || $date === 'NaN-NaN-NaN') {
                return 0;
            }

            try {
                $dt = new \DateTime($date);
            } catch (\Exception $e) {
                return 0;
            }

            // Apply Ramadan offset if enabled
            $isRamadan = $this->getCachedMeta('ramadan');
            if (is_array($isRamadan) && !empty($isRamadan['ramadan'])) {
                $offset = isset($isRamadan['ramadan_custom']) ? (int) $isRamadan['ramadan_custom'] : 0;
                if ($offset !== 0) {
                    $dt->modify("{$offset} days");
                }
            }

            if ($formatter === null) {
                return 0;
            }

            $hijra = $formatter->format($dt);
            if ($hijra === false || empty($hijra)) {
                return 0;
            }

            // IntlDateFormatter TRADITIONAL for Islamic calendar outputs like "1 Ramadan 1447"
            // Extract month name and map to number using a simple lookup
            $lower = strtolower($hijra);
            $month_map = [
                'muharram'    => 1, 'محرم'        => 1,
                'safar'       => 2, 'صفر'         => 2,
                'rabi'        => 3, 'ربيع'        => 3,
                'jumada'      => 5, 'جمادى'       => 5,
                'rajab'       => 7, 'رجب'         => 7,
                "sha'ban"     => 8, 'شعبان'       => 8,
                'ramadan'     => 9, 'رمضان'       => 9,
                'shawwal'     => 10, 'شوال'       => 10,
                "dhu al-qi'dah" => 11, 'ذو القعدة' => 11,
                'dhu al-hijjah' => 12, 'ذو الحجة'  => 12,
                'ramazan'     => 9,
                'ramadán'     => 9,
            ];

            foreach ($month_map as $needle => $num) {
                if (strpos($lower, $needle) !== false) {
                    return $num;
                }
            }

            return 0;
        }

        /**
         * Get cached locale data for IntlDateFormatter creation
         *
         * @return array|null Locale data with 'lan' and 'calenderType' keys
         */
        public function getCachedLocale(): ?array
        {
            $locale = $this->getCachedMeta('hijralocale');
            return is_array($locale) ? $locale : null;
        }

        /**
         * Get meta data with caching
         */
        private function getCachedMeta($key)
        {
            $cache_key = $this->cache_key . '_' . $key;
            $cached = get_transient($cache_key);
            
            if ($cached === false) {
                $getMetaFromDB = new GetMeta();
                $cached = $getMetaFromDB->get_meta_key($key);
                set_transient($cache_key, $cached, $this->cache_ttl);
            }
            
            return $cached;
        }

        /**
         * Clear all cached data for this class
         */
        public function clearCache()
        {
            global $wpdb;
            
            // Clear all transients for this plugin. This DELETE is cache
            // maintenance rather than a data read, so there is nothing to cache
            // about it; the wp_cache_flush() call below clears the object cache.
            $wpdb->query( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
                $wpdb->prepare(
                    "DELETE FROM $wpdb->options 
                    WHERE option_name LIKE %s 
                    OR option_name LIKE %s",
                    '%' . $wpdb->esc_like($this->cache_key) . '%',
                    '%' . $wpdb->esc_like('_transient_timeout_' . $this->cache_key) . '%'
                )
            );
            
            // Clear object cache if possible
            if (function_exists('wp_cache_flush')) {
                wp_cache_flush();
            }
        }
    }
}
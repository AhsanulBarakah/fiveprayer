<?php
namespace FivePrayer\Core\Database;


defined('ABSPATH') || exit;


if (!class_exists('FivePrayer_DatabaseTranslations')) {
    class FivePrayer_DatabaseTranslations
    {
        /**
         * Get default translations.
         *
         * @return array
         */
        public static function getTranslations()
        {
            return [
                'activeLanguage' => self::getActiveLanguage(),
                'prayer_names' => self::getPrayerNames(),
                'timetable_prayer' => self::getTimetablePrayer(),
                'vertical_daily_prayer' => self::getVerticalDailyPrayer(),
                'day_names' => self::getDayNames(),
                'gregorian_months' => self::getGregorianMonths(),
                'gregorian_numbers' => self::getGregorianNumbers(),
                'hijra_months' => self::getHijraMonths(),
                'hijra_numbers' => self::getHijraNumbers(),
                'extra_info' => self::getExtraInfo(),
            ];
        }

        /**
         * Prayer-name keys that were renamed and are no longer offered.
         *
         * The second ‘Asr was briefly keyed “Asr 2” before it was named for
         * what it is — the Hanafi (2 Mithl) time. Every renderer now asks for
         * “Hanafi”, so a stored “Asr 2” row is unreachable and must not linger
         * in More → Translate → Prayer Names as a second, editable field.
         *
         * @return string[]
         */
        public static function getRetiredPrayerNames()
        {
            return ['Asr 2'];
        }

        /**
         * Drop prayer-name entries whose key was renamed.
         *
         * Used by the editor payload (so the retired field disappears at once)
         * and by the additive translation merge/save (so the stored row is
         * removed instead of surviving forever).
         *
         * @param array $entries Prayer-name translation entries.
         * @return array
         */
        public static function withoutRetiredPrayerNames(array $entries)
        {
            $retired = array_map('strtolower', self::getRetiredPrayerNames());

            return array_values(array_filter($entries, static function ($entry) use ($retired) {
                return !(is_array($entry)
                    && in_array(strtolower((string) ($entry['original_text'] ?? '')), $retired, true));
            }));
        }

        /**
         * Get active language translations.
         *
         * @return array
         */
        private static function getActiveLanguage()
        {
            return [
                ['language_code' => 'en'], // Default language is English
            ];
        }

        /**
         * Get prayer names translations.
         *
         * @return array
         */
        private static function getPrayerNames()
        {
            return [
                ['original_text' => 'Fajr', 'translated_text' => 'Fajr', 'language_code' => 'en', 'language_name' => 'English'],
                ['original_text' => 'Dhuhr', 'translated_text' => 'Dhuhr', 'language_code' => 'en', 'language_name' => 'English'],
                ['original_text' => 'Asr', 'translated_text' => 'Asr', 'language_code' => 'en', 'language_name' => 'English'],
                // The optional second ‘Asr is the Hanafi (2 Mithl) time, so the
                // timetable column prints “Hanafi”. It is a prayer name, edited in
                // More → Translate → Prayer Names.
                ['original_text' => 'Hanafi', 'translated_text' => 'Hanafi', 'language_code' => 'en', 'language_name' => 'English'],
                ['original_text' => 'Maghrib', 'translated_text' => 'Maghrib', 'language_code' => 'en', 'language_name' => 'English'],
                ['original_text' => 'Isha', 'translated_text' => 'Isha', 'language_code' => 'en', 'language_name' => 'English'],
                ['original_text' => 'Sunrise', 'translated_text' => 'Sunrise', 'language_code' => 'en', 'language_name' => 'English'],
                ['original_text' => 'Midnight', 'translated_text' => 'Midnight', 'language_code' => 'en', 'language_name' => 'English'],
                ['original_text' => 'Fajr', 'translated_text' => 'الفجر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                ['original_text' => 'Dhuhr', 'translated_text' => 'الظهر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                ['original_text' => 'Asr', 'translated_text' => 'العصر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                ['original_text' => 'Hanafi', 'translated_text' => 'حنفي', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                ['original_text' => 'Maghrib', 'translated_text' => 'المغرب', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                ['original_text' => 'Isha', 'translated_text' => 'العشاء', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                ['original_text' => 'Sunrise', 'translated_text' => 'شروق الشمس', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                ['original_text' => 'Midnight', 'translated_text' => 'منتصف الليل', 'language_code' => 'ar', 'language_name' => 'Arabic']
            ];
        }

        /**
         * Get timetable prayer translations.
         *
         * @return array
         */
        private static function getTimetablePrayer()
        {
            return [
                    ['original_text' => 'Fajr Begins', 'translated_text' => 'Begins', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Fajr Iqamah', 'translated_text' => 'Iqamah', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Dhuhr Begins', 'translated_text' => 'Begins', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Dhuhr Iqamah', 'translated_text' => 'Iqamah', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Asr Begins', 'translated_text' => 'Begins', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Asr Iqamah', 'translated_text' => 'Iqamah', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Maghrib Begins', 'translated_text' => 'Begins', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Maghrib Iqamah', 'translated_text' => 'Iqamah', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Isha Begins', 'translated_text' => 'Begins', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Isha Iqamah', 'translated_text' => 'Iqamah', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Iftar Start', 'translated_text' => 'Iftar Start', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Suhoor End', 'translated_text' => 'Suhoor End', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Date', 'translated_text' => 'Date', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Sunrise', 'translated_text' => 'Sunrise', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Midnight', 'translated_text' => 'Begins', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Hijri Date', 'translated_text' => 'Hijri Date', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Day', 'translated_text' => 'Day', 'language_code' => 'en', 'language_name' => 'English'],

                    ['original_text' => 'Fajr Begins', 'translated_text' => 'يبدأ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Fajr Iqamah', 'translated_text' => 'إقامة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Dhuhr Begins', 'translated_text' => 'يبدأ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Dhuhr Iqamah', 'translated_text' => 'إقامة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Asr Begins', 'translated_text' => 'يبدأ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Asr Iqamah', 'translated_text' => 'إقامة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Maghrib Begins', 'translated_text' => 'يبدأ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Maghrib Iqamah', 'translated_text' => 'إقامة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Isha Begins', 'translated_text' => 'يبدأ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Isha Iqamah', 'translated_text' => 'إقامة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Iftar Start', 'translated_text' => 'بداية الإفطار', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Suhoor End', 'translated_text' => 'انتهى السحور', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Date', 'translated_text' => 'التاريخ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Sunrise', 'translated_text' => 'شروق الشمس', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Midnight', 'translated_text' => 'يبدأ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Hijri Date', 'translated_text' => 'التاريخ الهجري', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Day', 'translated_text' => 'اليوم', 'language_code' => 'ar', 'language_name' => 'Arabic'],

                
            ];
        }

        /**
         * Get vertical daily prayer translations.
         *
         * @return array
         */
        private static function getVerticalDailyPrayer()
        {
            return [
                    ['original_text' => 'Begins', 'translated_text' => 'Begins', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Iqamah', 'translated_text' => 'Iqamah', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Prayer', 'translated_text' => 'Prayer', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Next Prayer', 'translated_text' => 'Next Prayer', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Current Local Time', 'translated_text' => 'Current Local Time', 'language_code' => 'en', 'language_name' => 'English'],
                    // Next-prayer countdown unit words (used by
                    // [Fp_Single_Next_Prayer_Remaining] and the Vertical Daily Prayer).
                    ['original_text' => 'hour', 'translated_text' => 'hour', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'hours', 'translated_text' => 'hours', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'minute', 'translated_text' => 'minute', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'minutes', 'translated_text' => 'minutes', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'second', 'translated_text' => 'second', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'seconds', 'translated_text' => 'seconds', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Now', 'translated_text' => 'Now', 'language_code' => 'en', 'language_name' => 'English'],
                    // Countdown Prefix/Suffix connector words (translatable).
                    ['original_text' => 'in', 'translated_text' => 'in', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'remaining', 'translated_text' => 'remaining', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'left', 'translated_text' => 'left', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Begins', 'translated_text' => 'يبدأ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Iqamah', 'translated_text' => 'إقامة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Prayer', 'translated_text' => 'صلاة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Next Prayer', 'translated_text' => 'الصلاة القادمة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Current Local Time', 'translated_text' => 'الوقت المحلي الحالي', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'hour', 'translated_text' => 'ساعة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'hours', 'translated_text' => 'ساعات', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'minute', 'translated_text' => 'دقيقة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'minutes', 'translated_text' => 'دقائق', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'second', 'translated_text' => 'ثانية', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'seconds', 'translated_text' => 'ثوان', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Now', 'translated_text' => 'الآن', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'in', 'translated_text' => 'بعد', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'remaining', 'translated_text' => 'المتبقي', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'left', 'translated_text' => 'المتبقي', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                
            ];
        }

        /**
         * Get day-name translations.
         *
         * Powers the optional "Day" column in the monthly timetable and the
         * day line in the Vertical Daily Prayer table. Three families of entry
         * ship with English (default) and Arabic:
         *   - full weekday names, keyed by the English name (Monday … Sunday);
         *   - short weekday names, keyed by the English abbreviation (Mon … Sun);
         *   - day-of-month ordinals, keyed by the plain day number ("1" … "31"),
         *     so a date such as the 27th reads "27th" in English and the Arabic
         *     ordinal in Arabic.
         * The user can add further languages from More → Translate → Day Names.
         *
         * @return array
         */
        private static function getDayNames()
        {
            $english = 'English';
            $arabic  = 'Arabic';

            // English source key => [en display, ar display].
            $weekdays = [
                'Monday'    => ['Monday', 'الاثنين'],
                'Tuesday'   => ['Tuesday', 'الثلاثاء'],
                'Wednesday' => ['Wednesday', 'الأربعاء'],
                'Thursday'  => ['Thursday', 'الخميس'],
                'Friday'    => ['Friday', 'الجمعة'],
                'Saturday'  => ['Saturday', 'السبت'],
                'Sunday'    => ['Sunday', 'الأحد'],
            ];

            $shortWeekdays = [
                'Mon' => ['Mon', 'إثن'],
                'Tue' => ['Tue', 'ثلا'],
                'Wed' => ['Wed', 'أربع'],
                'Thu' => ['Thu', 'خميس'],
                'Fri' => ['Fri', 'جمع'],
                'Sat' => ['Sat', 'سبت'],
                'Sun' => ['Sun', 'أحد'],
            ];

            // Day-of-month ordinals. The key is the plain day number so the
            // renderer can look it up from the date without suffix logic.
            $ordinalsEn = [
                1 => '1st', 2 => '2nd', 3 => '3rd', 4 => '4th', 5 => '5th',
                6 => '6th', 7 => '7th', 8 => '8th', 9 => '9th', 10 => '10th',
                11 => '11th', 12 => '12th', 13 => '13th', 14 => '14th', 15 => '15th',
                16 => '16th', 17 => '17th', 18 => '18th', 19 => '19th', 20 => '20th',
                21 => '21st', 22 => '22nd', 23 => '23rd', 24 => '24th', 25 => '25th',
                26 => '26th', 27 => '27th', 28 => '28th', 29 => '29th', 30 => '30th',
                31 => '31st',
            ];

            $ordinalsAr = [
                1 => 'الأول', 2 => 'الثاني', 3 => 'الثالث', 4 => 'الرابع', 5 => 'الخامس',
                6 => 'السادس', 7 => 'السابع', 8 => 'الثامن', 9 => 'التاسع', 10 => 'العاشر',
                11 => 'الحادي عشر', 12 => 'الثاني عشر', 13 => 'الثالث عشر', 14 => 'الرابع عشر', 15 => 'الخامس عشر',
                16 => 'السادس عشر', 17 => 'السابع عشر', 18 => 'الثامن عشر', 19 => 'التاسع عشر', 20 => 'العشرون',
                21 => 'الحادي والعشرون', 22 => 'الثاني والعشرون', 23 => 'الثالث والعشرون', 24 => 'الرابع والعشرون', 25 => 'الخامس والعشرون',
                26 => 'السادس والعشرون', 27 => 'السابع والعشرون', 28 => 'الثامن والعشرون', 29 => 'التاسع والعشرون', 30 => 'الثلاثون',
                31 => 'الحادي والثلاثون',
            ];

            $entries = [];

            foreach ($weekdays as $key => $values) {
                $entries[] = ['original_text' => $key, 'translated_text' => $values[0], 'language_code' => 'en', 'language_name' => $english];
                $entries[] = ['original_text' => $key, 'translated_text' => $values[1], 'language_code' => 'ar', 'language_name' => $arabic];
            }

            foreach ($shortWeekdays as $key => $values) {
                $entries[] = ['original_text' => $key, 'translated_text' => $values[0], 'language_code' => 'en', 'language_name' => $english];
                $entries[] = ['original_text' => $key, 'translated_text' => $values[1], 'language_code' => 'ar', 'language_name' => $arabic];
            }

            for ($day = 1; $day <= 31; $day++) {
                $entries[] = ['original_text' => (string) $day, 'translated_text' => $ordinalsEn[$day], 'language_code' => 'en', 'language_name' => $english];
                $entries[] = ['original_text' => (string) $day, 'translated_text' => $ordinalsAr[$day], 'language_code' => 'ar', 'language_name' => $arabic];
            }

            return $entries;
        }

        /**
         * Get Gregorian months translations.
         *
         * @return array
         */
        private static function getGregorianMonths()
        {
            return [
                    ['original_text' => 'January', 'translated_text' => 'January', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'February', 'translated_text' => 'February', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'March', 'translated_text' => 'March', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'April', 'translated_text' => 'April', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'May', 'translated_text' => 'May', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'June', 'translated_text' => 'June', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'July', 'translated_text' => 'July', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'August', 'translated_text' => 'August', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'September', 'translated_text' => 'September', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'October', 'translated_text' => 'October', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'November', 'translated_text' => 'November', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'December', 'translated_text' => 'December', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'January', 'translated_text' => 'يناير', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'February', 'translated_text' => 'فبراير', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'March', 'translated_text' => 'مارس', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'April', 'translated_text' => 'أبريل', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'May', 'translated_text' => 'مايو', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'June', 'translated_text' => 'يونيو', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'July', 'translated_text' => 'يوليو', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'August', 'translated_text' => 'أغسطس', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'September', 'translated_text' => 'سبتمبر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'October', 'translated_text' => 'أكتوبر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'November', 'translated_text' => 'نوفمبر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'December', 'translated_text' => 'ديسمبر', 'language_code' => 'ar', 'language_name' => 'Arabic'],

                
            ];
        }

        /**
         * Get Gregorian numbers translations.
         *
         * @return array
         */
        private static function getGregorianNumbers()
        {
            return [
                    ['original_text' => '0', 'translated_text' => '0', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '1', 'translated_text' => '1', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '2', 'translated_text' => '2', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '3', 'translated_text' => '3', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '4', 'translated_text' => '4', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '5', 'translated_text' => '5', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '6', 'translated_text' => '6', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '7', 'translated_text' => '7', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '8', 'translated_text' => '8', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '9', 'translated_text' => '9', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'AM', 'translated_text' => 'am', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'PM', 'translated_text' => 'pm', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '0', 'translated_text' => '٠', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '1', 'translated_text' => '١', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '2', 'translated_text' => '٢', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '3', 'translated_text' => '٣', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '4', 'translated_text' => '٤', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '5', 'translated_text' => '٥', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '6', 'translated_text' => '٦', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '7', 'translated_text' => '٧', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '8', 'translated_text' => '٨', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '9', 'translated_text' => '٩', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'AM', 'translated_text' => 'ص', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'PM', 'translated_text' => 'م', 'language_code' => 'ar', 'language_name' => 'Arabic']
                
            ];
        }

        /**
         * Get Hijra months translations.
         *
         * @return array
         */
        private static function getHijraMonths()
        {
            return [
                    ['original_text' => 'Muharram', 'translated_text' => 'Muharram', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Safar', 'translated_text' => 'Safar', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Rabiʻ I', 'translated_text' => 'Rabi` al-awwal', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Rabiʻ II', 'translated_text' => 'Rabi` ath-thani', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Jumada I', 'translated_text' => 'Jumada al-awwal', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Jumada II', 'translated_text' => 'Jumada ath-thani', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Rajab', 'translated_text' => 'Rajab', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Shaʻban', 'translated_text' => 'Sha`ban', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Ramadan', 'translated_text' => 'Ramadan', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Shawwal', 'translated_text' => 'Shawwal', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Dhuʻl-Qiʻdah', 'translated_text' => 'Dhuʻl-Qiʻdah', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Dhuʻl-Hijjah', 'translated_text' => 'Dhuʻl-Hijjah', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'AH', 'translated_text' => 'AH', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => 'Muharram', 'translated_text' => 'المحرّم', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Safar', 'translated_text' => 'صفر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Rabiʻ I', 'translated_text' => 'ربيع الأول', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Rabiʻ II', 'translated_text' => 'ربيع الآخر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Jumada I', 'translated_text' => 'جمادى الأول', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Jumada II', 'translated_text' => 'جمادى الآخر', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Rajab', 'translated_text' => 'رجب', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Shaʻban', 'translated_text' => 'شعبان', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Ramadan', 'translated_text' => 'رمضان', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Shawwal', 'translated_text' => 'شوّال', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Dhuʻl-Qiʻdah', 'translated_text' => 'ذو القعدة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'Dhuʻl-Hijjah', 'translated_text' => 'ذو الحجة', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => 'AH', 'translated_text' => 'هـ', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                
            ];
        }

        /**
 * Get Hijra numbers translations.
 *
 * @return array
 */
private static function getHijraNumbers()
{
    return [
                    ['original_text' => '0', 'translated_text' => '0', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '1', 'translated_text' => '1', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '2', 'translated_text' => '2', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '3', 'translated_text' => '3', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '4', 'translated_text' => '4', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '5', 'translated_text' => '5', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '6', 'translated_text' => '6', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '7', 'translated_text' => '7', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '8', 'translated_text' => '8', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '9', 'translated_text' => '9', 'language_code' => 'en', 'language_name' => 'English'],
                    ['original_text' => '0', 'translated_text' => '٠', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '1', 'translated_text' => '١', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '2', 'translated_text' => '٢', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '3', 'translated_text' => '٣', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '4', 'translated_text' => '٤', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '5', 'translated_text' => '٥', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '6', 'translated_text' => '٦', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '7', 'translated_text' => '٧', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '8', 'translated_text' => '٨', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                    ['original_text' => '9', 'translated_text' => '٩', 'language_code' => 'ar', 'language_name' => 'Arabic'],
                   
                
    ];
}
private static function getExtraInfo()
{
    return [
            ['original_text' => "Prayer Times For Today", 'translated_text' => "Prayer Times For Today", 'language_code' => 'en', 'language_name' => 'English'],
            ['original_text' => 'Prayer Times For Today', 'translated_text' => 'أوقات الصلاة لليوم', 'language_code' => 'ar', 'language_name' => 'Arabic'],
            ['original_text' => "Masjid Name", 'translated_text' => "Masjid Name", 'language_code' => 'en', 'language_name' => 'English'],
            ['original_text' => 'Masjid Name', 'translated_text' => 'اسم المسجد', 'language_code' => 'ar', 'language_name' => 'Arabic'],
            ['original_text' => "The Current Prayer", 'translated_text' => "The Current Prayer", 'language_code' => 'en', 'language_name' => 'English'],
            ['original_text' => 'The Current Prayer', 'translated_text' => 'الصلاة الحالية', 'language_code' => 'ar', 'language_name' => 'Arabic'],
            ['original_text' => "Current Location", 'translated_text' => "Current Location", 'language_code' => 'en', 'language_name' => 'English'],
            ['original_text' => 'Current Location', 'translated_text' => 'الموقع الحالي', 'language_code' => 'ar', 'language_name' => 'Arabic'],
            ['original_text' => "Printer Button Text", 'translated_text' => "Printer TimeTable", 'language_code' => 'en', 'language_name' => 'English'],
            ['original_text' => 'Printer Button Text', 'translated_text' => 'جدول الطباعة', 'language_code' => 'ar', 'language_name' => 'Arabic'],

    ];
}
    }
}

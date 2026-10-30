<?php

namespace FivePrayer\Core\Helpers\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Trait TimetableDataTrait
 *
 * Handles fetching, caching, and processing of prayer timetable data.
 * Extracted from PrayerDataCache for code organization.
 */
trait TimetableDataTrait
{
    /**
     * Load and cache timetable rows, optionally filter by month and year.
     *
     * @param int|null $month Month of the year (1-12). If null, fetches data for the entire year.
     * @param int|null $year Optional year (defaults to current year if null).
     * @return array<object> Array of timetable data objects. Returns empty array on failure.
     */
    public static function getTimetableData(?int $month = null, ?int $year = null): array
    {
        $currentYear = $year ?? (int) wp_date('Y');
        $validMonth = ($month !== null && $month >= 1 && $month <= 12) ? $month : null;

        $cacheKeyIdentifier = $validMonth ? "timetable_m{$validMonth}_y{$currentYear}" : "timetable_allyear_y{$currentYear}";

        // Check in-memory cache first
        if (isset(self::$timetableData[$cacheKeyIdentifier])) {
            return self::$timetableData[$cacheKeyIdentifier];
        }

        // For year-only queries, we can optimize by checking if we have the full year data
        // and then filtering in memory instead of querying the database
        if ($validMonth === null) {
            // Check if we already have the full year cached under a different key
            foreach (self::$timetableData as $key => $data) {
                if (strpos($key, "_allyear_y{$currentYear}") !== false) {
                    self::$timetableData[$cacheKeyIdentifier] = $data;
                    return $data;
                }
            }
        }

        // Check object cache
        $objectCacheKey = 'fiveprayer_timetable_' . $cacheKeyIdentifier;
        $objectCached = wp_cache_get($objectCacheKey, 'fiveprayer');
        if (is_array($objectCached)) {
            self::$timetableData[$cacheKeyIdentifier] = $objectCached;
            return $objectCached;
        }

        $transientKey = self::generateCacheKey($cacheKeyIdentifier);

        // Check transient cache
        $cached = get_transient($transientKey);
        if ($cached !== false && is_array($cached)) {
            self::$timetableData[$cacheKeyIdentifier] = $cached;
            wp_cache_set($objectCacheKey, $cached, 'fiveprayer', self::DEFAULT_EXPIRATION);
             if (!in_array($transientKey, self::$cacheKeys)) {
                self::$cacheKeys[] = $transientKey;
            }
            return $cached;
        }

        // Fetch from DB if not cached
        global $wpdb;
        $table = $wpdb->prefix . 'fp_timetable';

        // Filter with a half-open date range rather than YEAR(date)/MONTH(date).
        // Wrapping the column in a function makes the query non-sargable and
        // forces a full table scan; a range can use the fp_timetable_date index.
        if ($validMonth !== null) {
            $rangeStart = sprintf('%04d-%02d-01', $currentYear, $validMonth);
            $rangeEnd   = $validMonth === 12
                ? sprintf('%04d-01-01', $currentYear + 1)
                : sprintf('%04d-%02d-01', $currentYear, $validMonth + 1);
        } else {
            $rangeStart = sprintf('%04d-01-01', $currentYear);
            $rangeEnd   = sprintf('%04d-01-01', $currentYear + 1);
        }

        $query = "SELECT date, fajr_begins, fajr_iqamah, fajr_masjid_jamaah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah, midnight, currentDate, hijri_date FROM %i WHERE date >= %s AND date < %s ORDER BY date ASC";
        $params = [$table, $rangeStart, $rangeEnd];

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.NotPrepared -- $query is prepared on the same line.
        $results = $wpdb->get_results($wpdb->prepare($query, ...$params));

        if ($wpdb->last_error) {
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- $query is prepared on the same line.
            Logger::error("Failed to fetch timetable data. Query: " . $wpdb->remove_placeholder_escape($wpdb->prepare($query, ...$params)) . " Error: " . $wpdb->last_error, 'PrayerDataCache');
            return [];
        }

        if (!is_array($results)) {
            $results = [];
        }

        self::$timetableData[$cacheKeyIdentifier] = $results;
        wp_cache_set($objectCacheKey, $results, 'fiveprayer', self::DEFAULT_EXPIRATION);
        if (!in_array($transientKey, self::$cacheKeys)) {
             self::$cacheKeys[] = $transientKey;
        }
        
        // Add to batch for later processing
        self::addToTransientBatch($transientKey, $results, self::DEFAULT_EXPIRATION);
        
        // Process batch if it's getting large
        if (count(self::$transientBatch) >= 10) {
            self::processTransientBatch();
        }

        return $results;
    }

    /**
     * Get timetable data for a specific date without filtering (for single prayer shortcodes and blocks).
     *
     * @param string $date Date in Y-m-d format.
     * @return object|null Timetable data object or null if not found.
     */
    public static function getTimetableByDateUnfiltered(string $date): ?object
    {
        $dateTime = \DateTime::createFromFormat('Y-m-d', $date);
        if (!$dateTime || $dateTime->format('Y-m-d') !== $date) {
            Logger::warning("Invalid date format provided to getTimetableByDateUnfiltered: {$date}", 'PrayerDataCache');
            return null;
        }

        // Direct, indexed single-row lookup instead of loading the whole year
        // through CalendarGenerator and scanning it for this date.
        return self::getRawTimetableRowByDate($date);
    }

    /**
     * Get PROCESSED timetable data for a specific date.
     *
     * @param string $date Date in Y-m-d format.
     * @return object|null Timetable data object or null if not found.
     */
    public static function getTimetableByDate(string $date): ?object
    {
        Logger::debug("getTimetableByDate (PROCESSED) - Called for date: " . $date, 'PrayerDataCache');

        $dateTime = \DateTime::createFromFormat('Y-m-d', $date);
        if (!$dateTime || $dateTime->format('Y-m-d') !== $date) {
            Logger::warning("Invalid date format provided to getTimetableByDate: {$date}", 'PrayerDataCache');
            return null;
        }

        $yearOfRequestedDate = (int) $dateTime->format('Y');
        $currentLocale = get_locale();

        // Get the full processed timetable for the current settings (year & locale)
        $processedYearTimetable = self::getOrGenerateProcessedTimetableForCurrentSettings($currentLocale);

        if (empty($processedYearTimetable)) {
            Logger::warning("getTimetableByDate - No processed timetable data found for locale: {$currentLocale}. CalendarGenerator might have returned empty.", 'PrayerDataCache');
            return null;
        }

        // Verify that the requested date's year matches the year of the processed data.
        $firstEntryDate = null;
        if (isset($processedYearTimetable[0]) && property_exists($processedYearTimetable[0], 'date')) {
            $firstEntryDate = $processedYearTimetable[0]->date;
        }
        
        if ($firstEntryDate) {
            $yearOfProcessedData = (int) substr($firstEntryDate, 0, 4);
            if ($yearOfRequestedDate !== $yearOfProcessedData) {
                Logger::warning("getTimetableByDate - Requested date {$date} (year {$yearOfRequestedDate}) does not match year of currently processed data ({$yearOfProcessedData}) for locale {$currentLocale}. Returning null as data is for a different year.", 'PrayerDataCache');
                return null;
            }
        } else {
            Logger::warning("getTimetableByDate - Cannot determine year of processed data for locale: {$currentLocale} from first entry.", 'PrayerDataCache');
        }

        Logger::debug("getTimetableByDate - Searching for {$date} in processed data for locale {$currentLocale} (count: " . count($processedYearTimetable) . ")", 'PrayerDataCache');

        foreach ($processedYearTimetable as $key => $entry) {
            if (isset($entry->date) && $entry->date === $date) {
                Logger::debug("getTimetableByDate - Entry found for date: " . $date, 'PrayerDataCache');
                return $entry;
            }
        }

        Logger::debug("getTimetableByDate - No specific entry found for date: " . $date, 'PrayerDataCache');
        return null;
    }

    /**
     * Fetches or generates and caches the fully processed timetable from CalendarGenerator.
     */
    private static function getOrGenerateProcessedTimetableForCurrentSettings(string $locale): array
    {
        if (isset(self::$processedTimetableCache[$locale])) {
            Logger::debug("getOrGenerateProcessedTimetableForCurrentSettings - Returning from in-memory cache for locale: {$locale}", 'PrayerDataCache');
            return self::$processedTimetableCache[$locale];
        }

        $transientKeyBase = "processed_timetable_l{$locale}";
        $transientKey = self::generateCacheKey($transientKeyBase);

        $cachedData = get_transient($transientKey);
        if ($cachedData !== false && is_array($cachedData)) {
            Logger::debug("getOrGenerateProcessedTimetableForCurrentSettings - Returning from transient cache for locale: {$locale} (Key: {$transientKey})", 'PrayerDataCache');
            self::$processedTimetableCache[$locale] = $cachedData;
            if (!in_array($transientKey, self::$cacheKeys)) {
                self::$cacheKeys[] = $transientKey;
            }
            return $cachedData;
        }

        Logger::debug("getOrGenerateProcessedTimetableForCurrentSettings - No cache found for locale: {$locale}. Generating with CalendarGenerator...", 'PrayerDataCache');

        if (!class_exists('\FivePrayer\Core\Calendar\CalendarGenerator')) {
            Logger::error("CalendarGenerator class not found.", 'PrayerDataCache');
            return [];
        }

        $calendarGenerator = new \FivePrayer\Core\Calendar\CalendarGenerator();
        $calendarGenerator->dynamic_generate_calendar();
        $processedData = $calendarGenerator->timeTable;

        if (empty($processedData)) {
            Logger::warning("getOrGenerateProcessedTimetableForCurrentSettings - CalendarGenerator returned empty data for locale: {$locale}.", 'PrayerDataCache');
            return [];
        }

        set_transient($transientKey, $processedData, self::DEFAULT_EXPIRATION);
        self::$processedTimetableCache[$locale] = $processedData;
        if (!in_array($transientKey, self::$cacheKeys)) {
            self::$cacheKeys[] = $transientKey;
        }

        return $processedData;
    }

    /**
     * Get next prayer data with fresh cache
     */
    public static function getNextPrayerData(): ?object
    {
        // Check if we're in a development environment
        $is_development = (defined('WP_DEBUG') && WP_DEBUG) ||
                         (defined('SCRIPT_DEBUG') && SCRIPT_DEBUG) ||
                         fiveprayer_get_server_value('HTTP_HOST') === 'localhost' ||
                         (strpos(fiveprayer_get_server_value('HTTP_HOST'), '.local') !== false) ||
                         (strpos(fiveprayer_get_server_value('HTTP_HOST'), '.test') !== false) ||
                         (strpos(fiveprayer_get_server_value('HTTP_HOST'), ':') !== false);

        // In development, always bypass cache to ensure fresh data
        if ($is_development) {
            self::$nextPrayerCache = null;
            self::$nextPrayerCacheTime = null;
        } else {
            // Always invalidate cache after 1 minute in production
            if (self::$nextPrayerCacheTime && time() - self::$nextPrayerCacheTime > self::NEXT_PRAYER_CACHE_TIMEOUT) {
                self::$nextPrayerCache = null;
                self::$nextPrayerCacheTime = null;
            }
        }

        // Check if we have cached data
        if (self::$nextPrayerCache !== null) {
            return self::$nextPrayerCache;
        }

        try {
            // Get today's prayer times to pass to NextPrayer
            $today_date = current_time('Y-m-d');
            $today_prayer_times = self::getTimetableByDateUnfiltered($today_date);

            if (!$today_prayer_times) {
                Logger::warning('Could not get today\'s prayer times for next prayer calculation', 'PrayerDataCache');
                return null;
            }

            // Get other required data for next prayer calculation
            $meta_values = self::getMultipleMetaValues([
                'timetable_prayer',
                'prayer_names',
                'activeLanguage'
            ]);

            $timetable_prayer = $meta_values['timetable_prayer'] ? json_decode($meta_values['timetable_prayer'], true) : [];
            $prayer_names = $meta_values['prayer_names'] ? json_decode($meta_values['prayer_names'], true) : [];
            $activeLanguage = $meta_values['activeLanguage'] ? json_decode($meta_values['activeLanguage'], true) : [['language_code' => 'en']];

            $nextPrayer = new \FivePrayer\Core\Daily\NextPrayer();
            $next_prayer_slug = $nextPrayer->getNextPrayer(
                $today_prayer_times,
                $timetable_prayer,
                $prayer_names,
                $activeLanguage
            );

            // Get the detailed data after calculating the next prayer
            $data = $nextPrayer->getNextPrayerData();

            if ($data) {
                self::$nextPrayerCache = $data;
                self::$nextPrayerCacheTime = time();
            }

            return $data;
        } catch (\Exception $e) {
            Logger::error('Error getting next prayer data: ' . $e->getMessage(), 'PrayerDataCache');
            return null;
        }
    }

    /**
     * Get today's prayer times with enhanced caching to prevent multiple DB calls per request.
     *
     * Only the requested date is fetched — the previous implementation loaded
     * (and formatted) the entire year through CalendarGenerator and then scanned
     * it for one row. The single `date = %s` lookup below is sargable and served
     * by the fp_timetable_date index, with the in-memory and object caches layered
     * on top for repeat calls.
     *
     * @param string|null $date Optional date in Y-m-d format, defaults to current date
     * @return object|null Timetable data object or null if not found
     */
    public static function getTodaysPrayerTimes(?string $date = null): ?object
    {
        $requested_date = $date ?: current_time('Y-m-d');

        $dateTime = \DateTime::createFromFormat('Y-m-d', $requested_date);
        if (!$dateTime || $dateTime->format('Y-m-d') !== $requested_date) {
            Logger::warning("Invalid date format provided to getTodaysPrayerTimes: {$requested_date}", 'PrayerDataCache');
            return null;
        }

        // Check if we have the cached data for the same date
        if (self::$todayPrayerTimesDate === $requested_date && self::$todayPrayerTimesCache !== null) {
            return self::$todayPrayerTimesCache;
        }

        $entry = self::getRawTimetableRowByDate($requested_date);

        if ($entry === null) {
            return null;
        }

        // Match the previous behaviour: on sites using a custom Gregorian locale
        // the time fields were localised before being handed to consumers.
        $entry = self::formatTimetableRowForActiveLocale($entry);

        self::$todayPrayerTimesCache = $entry;
        self::$todayPrayerTimesDate = $requested_date;

        return $entry;
    }

    /**
     * Fetch a single raw timetable row for an exact date.
     *
     * Equality on the indexed `date` column matches at most one row, unlike the
     * previous full-year fetch. The result is cached in-memory for the request
     * and in the shared object cache group for cross-request reuse.
     *
     * @param string $date Date in Y-m-d format (already validated by the caller).
     * @return object|null Raw timetable row, or null when not found / on error.
     */
    private static function getRawTimetableRowByDate(string $date): ?object
    {
        $cacheKeyIdentifier = 'timetable_date_' . $date;

        // In-memory cache (array_key_exists distinguishes a cached row from a miss).
        if (array_key_exists($cacheKeyIdentifier, self::$timetableData)) {
            $cached = self::$timetableData[$cacheKeyIdentifier];
            return is_object($cached) ? $cached : null;
        }

        $objectCacheKey = 'fiveprayer_timetable_' . $cacheKeyIdentifier;
        $objectCached = wp_cache_get($objectCacheKey, 'fiveprayer');
        if (is_object($objectCached)) {
            self::$timetableData[$cacheKeyIdentifier] = $objectCached;
            return $objectCached;
        }

        global $wpdb;
        $table = $wpdb->prefix . 'fp_timetable';

        $query = "SELECT date, fajr_begins, fajr_iqamah, fajr_masjid_jamaah, sunrise, dhuhr_begins, dhuhr_iqamah, asr_begins, asr_second_begins, asr_iqamah, maghrib_begins, maghrib_iqamah, isha_begins, isha_iqamah, midnight, currentDate, hijri_date FROM %i WHERE date = %s LIMIT 1";
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,PluginCheck.Security.DirectDB.UnescapedDBParameter,WordPress.DB.PreparedSQL.NotPrepared -- $query is prepared on the same line.
        $row = $wpdb->get_row($wpdb->prepare($query, $table, $date));

        if ($wpdb->last_error) {
            Logger::error("Failed to fetch timetable row for {$date}. Error: " . $wpdb->last_error, 'PrayerDataCache');
            return null;
        }

        if (!is_object($row)) {
            return null;
        }

        self::$timetableData[$cacheKeyIdentifier] = $row;
        wp_cache_set($objectCacheKey, $row, 'fiveprayer', self::DEFAULT_EXPIRATION);

        return $row;
    }

    /**
     * Apply the active Gregorian locale formatting to a single timetable row.
     *
     * This mirrors the formatting CalendarGenerator applies to the full-year
     * data, so consumers keep receiving localised times on custom-language sites.
     * Sites without a custom Gregorian locale get the raw row back unchanged.
     */
    private static function formatTimetableRowForActiveLocale(object $row): object
    {
        $meta_values = self::getMultipleMetaValues(['hijralocale', 'activeLanguage', 'gregorian_months', 'gregorian_numbers']);

        $locale = !empty($meta_values['hijralocale']) ? json_decode($meta_values['hijralocale'], true) : [];
        if (!is_array($locale) || empty($locale['customLan'])) {
            return $row;
        }

        $activeLanguage    = !empty($meta_values['activeLanguage']) ? json_decode($meta_values['activeLanguage'], true) : [];
        $gregorian_months  = !empty($meta_values['gregorian_months']) ? json_decode($meta_values['gregorian_months'], true) : [];
        $gregorian_numbers = !empty($meta_values['gregorian_numbers']) ? json_decode($meta_values['gregorian_numbers'], true) : [];

        $formatted = (new \FivePrayer\Core\Helpers\DateFormatted())->gregorian_format(
            [$row],
            is_array($gregorian_numbers) ? $gregorian_numbers : [],
            is_array($gregorian_months) ? $gregorian_months : [],
            is_array($activeLanguage) ? $activeLanguage : []
        );

        return $formatted[0] ?? $row;
    }
}

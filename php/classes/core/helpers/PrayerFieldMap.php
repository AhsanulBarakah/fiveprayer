<?php
/**
 * The timetable fields the dynamic-content endpoints may read.
 *
 * Both the AJAX handler (`DynamicContentHandler::get_single_prayer_data()`) and
 * the ESI fragment renderer (`ESIContentGeneratorTrait`) answer "what time is
 * fajr" questions from the same timetable row. Keeping the allowlist in one
 * place means the two cannot drift apart, and neither can fall back to reading
 * a property named after whatever the caller sent — which is how an
 * unauthenticated request was able to probe arbitrary (including private)
 * properties of the row.
 *
 * @package FivePrayer
 */

namespace FivePrayer\Core\Helpers;

defined('ABSPATH') || exit;

/**
 * Class PrayerFieldMap
 *
 * @since 3.0.0
 */
class PrayerFieldMap
{
    /**
     * Field name a caller may ask for, mapped to the timetable column it reads.
     *
     * The `*_time` spellings are the original dynamic-content fields; the
     * identity aliases (`fajr_begins`, …) are the ones the placeholders emit.
     *
     * @var array<string, string>
     */
    private const FIELDS = [
        'fajr_begins_time' => 'fajr_begins',
        'fajr_iqamah_time' => 'fajr_iqamah',
        'dhuhr_begins_time' => 'dhuhr_begins',
        'dhuhr_iqamah_time' => 'dhuhr_iqamah',
        'asr_begins_time' => 'asr_begins',
        'asr_second_begins_time' => 'asr_second_begins',
        'asr_iqamah_time' => 'asr_iqamah',
        'maghrib_begins_time' => 'maghrib_begins',
        'maghrib_iqamah_time' => 'maghrib_iqamah',
        'isha_begins_time' => 'isha_begins',
        'isha_iqamah_time' => 'isha_iqamah',
        'sunrise_begins_time' => 'sunrise',
        'midnight_begins_time' => 'midnight',
        // Identity aliases emitted by the dynamic-content placeholders
        // (DynamicContent\Traits\PrayerTimeContentTrait).
        'fajr_begins' => 'fajr_begins',
        'fajr_iqamah' => 'fajr_iqamah',
        'dhuhr_begins' => 'dhuhr_begins',
        'dhuhr_iqamah' => 'dhuhr_iqamah',
        'asr_begins' => 'asr_begins',
        'asr_second_begins' => 'asr_second_begins',
        'asr_iqamah' => 'asr_iqamah',
        'maghrib_begins' => 'maghrib_begins',
        'maghrib_iqamah' => 'maghrib_iqamah',
        'isha_begins' => 'isha_begins',
        'isha_iqamah' => 'isha_iqamah',
        'sunrise' => 'sunrise',
        'midnight' => 'midnight',
    ];

    /**
     * Timetable property for a requested field.
     *
     * @param mixed $field Field name supplied by the caller.
     * @return string|null Property to read, or null when the field is not one
     *                     this plugin advertises.
     */
    public static function getProperty($field)
    {
        if (!is_string($field) || '' === $field || !isset(self::FIELDS[$field])) {
            return null;
        }

        return self::FIELDS[$field];
    }

    /**
     * Every field a caller may ask for.
     *
     * @return string[]
     */
    public static function getFields()
    {
        return array_keys(self::FIELDS);
    }
}

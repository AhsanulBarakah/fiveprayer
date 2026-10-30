<?php

namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Components;

use FivePrayer\Core\Security\SecurityHelper;

defined('ABSPATH') || exit;

/**
 * Maps field keys to their corresponding labels
 */
class FieldLabelMapper {
    
    /**
     * Get the label for a specific field key
     *
     * @param string $field_key
     * @return string
     */
    public static function getFieldLabel(string $field_key): string {
        $label_map = [
            'fajr_begins' => 'Fajr Begins Time',
            'fajr_iqamah' => 'Fajr Iqamah Time',
            'dhuhr_begins' => 'Dhuhr Begins Time',
            'dhuhr_iqamah' => 'Dhuhr Iqamah Time',
            'asr_begins' => 'Asr Begins Time',
            'asr_second_begins' => 'Hanafi Begins Time (2 Mithl)',
            'asr_iqamah' => 'Asr Iqamah Time',
            'maghrib_begins' => 'Maghrib Begins Time',
            'maghrib_iqamah' => 'Maghrib Iqamah Time',
            'isha_begins' => 'Isha Begins Time',
            'isha_iqamah' => 'Isha Iqamah Time',
            'sunrise' => 'Sunrise Time',
            'current_time' => 'Current Time',
            'currentDate' => 'Current Date',
            'hijra_date' => 'Hijra Date',
            'current_location' => 'Current Location',
            'masjid_name' => 'Masjid Name',
            'midnight' => 'Midnight Time',
            'midnight_name' => 'Midnight Name',
            'single_prayer_begins_title' => 'Prayer Begins Title',
            'single_prayer_iqamah_title' => 'Prayer Iqamah Title',
            'fajr_name' => 'Fajr Name',
            'dhuhr_name' => 'Dhuhr Name',
            'asr_name' => 'Asr Name',
            'maghrib_name' => 'Maghrib Name',
            'isha_name' => 'Isha Name',
            'sunrise_name' => 'Sunrise Name',
            'prayer_times_for_today' => 'Prayer Times For Today',
            'next_prayer_iqamah_time' => 'Next Prayer Iqamah Time',
            'next_prayer_iqamah_title' => 'Next Prayer Iqamah Title',
            'next_prayer_begins_time' => 'Next Prayer Begins Time',
            'next_prayer_begins_title' => 'Next Prayer Begins Title',
            'next_prayer_title' => 'Next Prayer Title',
            'prayer_title' => 'Prayer Title',
            'current_title' => 'Current Title',
        ];

        $field_label = $label_map[$field_key] ?? str_replace('_', ' ', $field_key);

        return SecurityHelper::sanitize_text($field_label);
    }
    
    /**
     * Get all field mappings
     *
     * @return array
     */
    public static function getAllFieldMappings(): array {
        return [
            'fajr_begins' => 'Fajr Begins Time',
            'fajr_iqamah' => 'Fajr Iqamah Time',
            'dhuhr_begins' => 'Dhuhr Begins Time',
            'dhuhr_iqamah' => 'Dhuhr Iqamah Time',
            'asr_begins' => 'Asr Begins Time',
            'asr_second_begins' => 'Hanafi Begins Time (2 Mithl)',
            'asr_iqamah' => 'Asr Iqamah Time',
            'maghrib_begins' => 'Maghrib Begins Time',
            'maghrib_iqamah' => 'Maghrib Iqamah Time',
            'isha_begins' => 'Isha Begins Time',
            'isha_iqamah' => 'Isha Iqamah Time',
            'sunrise' => 'Sunrise Time',
            'current_time' => 'Current Time',
            'currentDate' => 'Current Date',
            'hijra_date' => 'Hijra Date',
            'current_location' => 'Current Location',
            'masjid_name' => 'Masjid Name',
            'midnight' => 'Midnight Time',
            'midnight_name' => 'Midnight Name',
            'single_prayer_begins_title' => 'Prayer Begins Title',
            'single_prayer_iqamah_title' => 'Prayer Iqamah Title',
            'fajr_name' => 'Fajr Name',
            'dhuhr_name' => 'Dhuhr Name',
            'asr_name' => 'Asr Name',
            'maghrib_name' => 'Maghrib Name',
            'isha_name' => 'Isha Name',
            'sunrise_name' => 'Sunrise Name',
            'prayer_times_for_today' => 'Prayer Times For Today',
            'next_prayer_iqamah_time' => 'Next Prayer Iqamah Time',
            'next_prayer_iqamah_title' => 'Next Prayer Iqamah Title',
            'next_prayer_begins_time' => 'Next Prayer Begins Time',
            'next_prayer_begins_title' => 'Next Prayer Begins Title',
            'next_prayer_title' => 'Next Prayer Title',
            'prayer_title' => 'Prayer Title',
            'current_title' => 'Current Title',
        ];
    }
}
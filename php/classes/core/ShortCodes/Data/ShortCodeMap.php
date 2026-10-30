<?php
namespace FivePrayer\Core\ShortCodes\Data;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

class ShortCodeMap {
    public const ACTIVE_SHORTCODES = [
        'Fp_Single_Fajr_Begins_time' => 'fajr_begins',
        'Fp_Single_Fajr_Iqamah_time' => 'fajr_iqamah',
        'Fp_Single_Dhuhr_Begins_time' => 'dhuhr_begins',
        'Fp_Single_Dhuhr_Iqamah_time' => 'dhuhr_iqamah',
        'Fp_Single_Asr_Begins_time' => 'asr_begins',
        'Fp_Single_Asr_2_Begins_time' => 'asr_second_begins',
        'Fp_Single_Asr_Iqamah_time' => 'asr_iqamah',
        'Fp_Single_Maghrib_Begins_time' => 'maghrib_begins',
        'Fp_Single_Maghrib_Iqamah_time' => 'maghrib_iqamah',
        'Fp_Single_Isha_Begins_time' => 'isha_begins',
        'Fp_Single_Isha_Iqamah_time' => 'isha_iqamah',
        'Fp_Single_Midnight_Begins_time' => 'midnight',
        'Fp_Single_Midnight_Name' => 'midnight_name',
        'Fp_Single_Sunrise_Begins_time' => 'sunrise',
        'Fp_Single_Prayer_Begins_Title' => 'single_prayer_begins_title',
        'Fp_Single_Prayer_Iqamah_Title' => 'single_prayer_iqamah_title',
        'Fp_Single_PTFT' => 'prayer_times_for_today',
        'Fp_Single_Hijra_Date' => 'hijra_date',
        'Fp_Single_Fajr_Name' => 'fajr_name',
        'Fp_Single_Dhuhr_Name' => 'dhuhr_name',
        'Fp_Single_Asr_Name' => 'asr_name',
        'Fp_Single_Maghrib_Name' => 'maghrib_name',
        'Fp_Single_Isha_Name' => 'isha_name',
        'Fp_Single_Sunrise_Name' => 'sunrise_name',
        'Fp_Single_CurrentDate' => 'currentDate',
        'Fp_Single_CurrentTime' => 'current_time',
        'Fp_Single_Current_Title' => 'current_title',
        'Fp_Single_Current_Location' => 'current_location',
        'Fp_Single_Masjid_Name' => 'masjid_name',
        'Fp_Single_Prayer_Title' => 'prayer_title',
        'Fp_Single_Next_Prayer_Iqamah_Time' => 'next_prayer_iqamah_time',
        'Fp_Single_Next_Prayer_Iqamah_Title' => 'next_prayer_iqamah_title',
        'Fp_Single_Next_Prayer_Begins_Time' => 'next_prayer_begins_time',
        'Fp_Single_Next_Prayer_Begins_Title' => 'next_prayer_begins_title',
        'Fp_Single_Next_Prayer_Title' => 'next_prayer_title',
        'Fp_Single_Next_Prayer_Remaining' => 'next_prayer_remaining',
    ];

    public const DEPRECATED_SHORTCODES = [
        'Fp_Single_Fajr_Begins' => 'fajr_begins',
        'Fp_Single_Fajr_Iqamah' => 'fajr_iqamah',
        'Fp_Single_Dhuhr_Begins' => 'dhuhr_begins',
        'Fp_Single_Dhuhr_Iqamah' => 'dhuhr_iqamah',
        'Fp_Single_Asr_Begins' => 'asr_begins',
        'Fp_Single_Asr_Iqamah' => 'asr_iqamah',
        'Fp_Single_Maghrib_Begins' => 'maghrib_begins',
        'Fp_Single_Maghrib_Iqamah' => 'maghrib_iqamah',
        'Fp_Single_Isha_Begins' => 'isha_begins',
        'Fp_Single_Isha_Iqamah' => 'isha_iqamah',
        'Fp_Single_Midnight_Begins' => 'midnight',
        'Fp_Single_Sunrise_Begins' => 'sunrise',
        'Fp_Single_CurrentDate' => 'currentDate',
        'Fp_Single_CurrentTime' => 'current_time',
        'Fp_Single_NextPrayerIqamahTime' => 'next_prayer_iqamah_time',
        'Fp_Single_NextPrayerIqamahTitle' => 'next_prayer_iqamah_title',
        'Fp_Single_NextPrayerBeginsTime' => 'next_prayer_begins_time',
        'Fp_Single_NextPrayerBeginsTitle' => 'next_prayer_begins_title',
    ];

    public const PRAYER_NAMES = [
        'fajr_name' => 'Fajr',
        'dhuhr_name' => 'Dhuhr',
        'asr_name' => 'Asr',
        'maghrib_name' => 'Maghrib',
        'isha_name' => 'Isha',
        'sunrise_name' => 'Sunrise',
        'midnight_name' => 'Midnight'
    ];
}
<?php

namespace FivePrayer\Core\Helpers\WarningNotice;

defined('ABSPATH') || exit;

class DeprecatedShortcodeScanner {
    private array $shortcode_map = [
        'Fp_Single_Fajr_Begins_time' => 'fajr_begins',
            'Fp_Single_Fajr_Iqamah_time' => 'fajr_iqamah',
            'Fp_Single_Dhuhr_Begins_time' => 'dhuhr_begins',
            'Fp_Single_Dhuhr_Iqamah_time' => 'dhuhr_iqamah',
            'Fp_Single_Asr_Begins_time' => 'asr_begins',
            'Fp_Single_Asr_Iqamah_time' => 'asr_iqamah',
            'Fp_Single_Maghrib_Begins_time' => 'maghrib_begins',
            'Fp_Single_Maghrib_Iqamah_time' => 'maghrib_iqamah',
            'Fp_Single_Isha_Begins_time' => 'isha_begins',
            'Fp_Single_Isha_Iqamah_time' => 'isha_iqamah',
            'Fp_Single_Midnight_Begins_time' => 'midnight',
            'Fp_Single_Sunrise_Begins_time' => 'sunrise',
            'Fp_Single_Prayer_Begins_Title' => 'single_prayer_begins_title',
            'Fp_Single_Prayer_Iqamah_Title' => 'single_prayer_iqamah_title',
            'Fp_Single_Fajr_Name' => 'fajr_name',
            'Fp_Single_Dhuhr_Name' => 'dhuhr_name',
            'Fp_Single_Asr_Name' => 'asr_name',
            'Fp_Single_Maghrib_Name' => 'maghrib_name',
            'Fp_Single_Isha_Name' => 'isha_name',
            'Fp_Single_Sunrise_Name' => 'sunrise_name',
            'Fp_Single_Next_Prayer_Iqamah_Time' => 'next_prayer_iqamah_time',
            'Fp_Single_Next_Prayer_Iqamah_Title' => 'next_prayer_iqamah_title',
            'Fp_Single_Next_Prayer_Begins_Time' => 'next_prayer_begins_time',
            'Fp_Single_Next_Prayer_Begins_Title' => 'next_prayer_begins_title',
            'Fp_Single_Next_Prayer_Title' => 'next_prayer_title',
    ];

    private array $deprecated_shortcode_map = [
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
            'Fp_Single_NextPrayerIqamahTime' => 'next_prayer_iqamah_time',
            'Fp_Single_NextPrayerIqamahTitle' => 'next_prayer_iqamah_title',
            'Fp_Single_NextPrayerBeginsTime' => 'next_prayer_begins_time',
            'Fp_Single_NextPrayerBeginsTitle' => 'next_prayer_begins_title',
    ];

    public function find(): array {
        $results = [];
        $posts = get_posts([
            'post_type' => 'any',
            'post_status' => 'publish', 
            'numberposts' => -1
        ]);

        foreach ($posts as &$post) {
            foreach ($this->deprecated_shortcode_map as $old_shortcode => $field) {
                if (has_shortcode($post->post_content, $old_shortcode)) {
                    // Find the new shortcode that maps to the same field
                    $new_shortcode = array_search($field, $this->shortcode_map);
                    
                    if ($new_shortcode !== false) {
                        if (!isset($results[$old_shortcode])) {
                            $results[$old_shortcode] = [
                                'new_shortcode' => $new_shortcode,
                                'pages' => []
                            ];
                        }
                        
                        $results[$old_shortcode]['pages'][] = [
                            'title' => $post->post_title,
                            'edit_link' => get_edit_post_link($post->ID),
                            'id' => $post->ID
                        ];
                    }
                }
            }
        }

        return $results;
    }
}
<?php
namespace FivePrayer\Core\Database;

defined('ABSPATH') || exit;

if (!class_exists('FivePrayer_DatabaseMetaSettings')) {
    class FivePrayer_DatabaseMetaSettings {
        /**
         * Get default meta settings for prayer calculations.
         *
         * @return array
         */
        public static function getMetaSettings()
        {
            return [
                'midnight_calculation_mode' => [
                    ['id' => 1, 'name' => 'Standard (Mid Sunset to Sunrise)', 'method' => 'Standard'],
                    ['id' => 2, 'name' => 'Jafari (Maghrib to Fajr)', 'method' => 'Jafari'],
                ],
                'Only_affects_Asr_calculation' => [
                    ['id' => 3, 'name' => 'Shafii, Maliki, Jafari and Hanbali', 'method' => 'Standard'],
                    ['id' => 4, 'name' => 'Hanafi', 'method' => 'Hanafi'],
                    // Both ‘Asr times in one choice: a 1 Mithl ‘Asr (the same
                    // Standard calculation as id 3) with the Hanafi school named
                    // too, so a mosque that prints the Hanafi 2 Mithl time in the
                    // Hanafi column can pick one entry for both. Additive merges
                    // hand it to existing installs, and SchemaHelper renames the
                    // label an older release shipped.
                    ['id' => 31, 'name' => 'Shafii, Maliki, Jafari, Hanbali and Hanafi (Asr + Hanafi)', 'method' => 'Standard'],
                ],
                'Higher_Latitudes_Methods' => [
                    ['id' => 5, 'name' => 'Middle of The Night Method', 'method' => 'NightMiddle'],
                    ['id' => 6, 'name' => 'One Seventh Rule', 'method' => 'OneSeventh'],
                    ['id' => 7, 'name' => 'Angel Base Method', 'method' => 'AngleBased'],
                    ['id' => 8, 'name' => 'No adjustments', 'method' => 'None'],
                ],
                'Rounding_Method' => [
                    ['id' => 24, 'name' => 'Nearest (Standard)', 'method' => 'nearest'],
                    ['id' => 25, 'name' => 'Up (Ceil)', 'method' => 'up'],
                    ['id' => 26, 'name' => 'Down (Floor)', 'method' => 'down'],
                    ['id' => 27, 'name' => 'None (Exact)', 'method' => 'none'],
                ],
                'rounding_selected' => [
                    'name' => 'Nearest (Standard)',
                    'method' => 'nearest',
                    'threshold' => 30,
                ],
                'rounding_enabled' => true,
                'smoothing_selected' => [
                    'enabled' => true,
                    'maxSeconds' => 90,
                    'mode' => 'noDrift',
                    'driftBudget' => 180,
                ],
                'calendar_type' => 'gregorian',
                'calendar_display' => 'span',
                // Only Prayer Calculation Methods + Unified Method ship ON; every
                // other feature starts OFF and is enabled from the Feature
                // Switches page when needed. feature_off_display controls how a
                // turned-off feature appears in the sidebar: 'hide' removes it,
                // 'badge' shows it dimmed with an Off label (Feature Switches
                // itself is always visible).
                'feature_off_display' => 'hide',
                'feature_toggles' => [
                    'Methods_For_Calculation' => true,
                    'Only_affects_Asr_calculation' => false,
                    'midnight_calculation_mode' => false,
                    'Higher_Latitudes_Methods' => false,
                    'Unified_Method_Settings' => true,
                    'Rounding_Method' => false,
                    'Day_to_day_Smoothing' => false,
                    'Calendar_Type' => false,
                    'Advanced_Schedules' => false,
                    'Next_Prayer_Countdown' => false,
                    'Extra_Prayers' => false,
                    // Master switch of the optional "Day" column / day line
                    // (full weekday name, short name and day-of-month number,
                    // in a configurable order). Ships OFF; its own
                    // customization lives in the `day_display` meta and is
                    // edited from Configure Settings → Day Display.
                    'Day_Display' => false,
                    // Master on/off for TV Display Mode (the full-screen signage
                    // box in Pages/Posts plus the TV / Phone network switch).
                    // A beta feature, so it ships OFF like every other optional
                    // feature: nothing of it is offered until it is turned on in
                    // Feature Switches, and only then is its own page listed in
                    // the Categories list. Turning it off switches its
                    // sub-switches off with it.
                    'TV_Display_Mode' => false,
                    // NOTE: the two editor-only design aids of the TV Display
                    // Mode page — Canvas Force and the Safe Zone Guide — are not
                    // entries here. They are switches of that page and live in
                    // their own options (TvCanvasLocker::CANVAS_FORCE_OPTION /
                    // SAFE_ZONE_OPTION), which default to 0 (off).
                ],
                // Six optional "extra prayer" slots for the Jumu'ah / Eid style
                // prayers a mosque prays on top of the five daily prayers.
                // Each slot = {name, time, note}; rendered by
                // [Fp_Extra_Prayer_1] … [Fp_Extra_Prayer_6] when the
                // Extra_Prayers feature switch is on.
                'extra_prayers' => [
                    ['name' => '', 'time' => '', 'note' => ''],
                    ['name' => '', 'time' => '', 'note' => ''],
                    ['name' => '', 'time' => '', 'note' => ''],
                    ['name' => '', 'time' => '', 'note' => ''],
                    ['name' => '', 'time' => '', 'note' => ''],
                    ['name' => '', 'time' => '', 'note' => ''],
                ],
                'Methods_For_Calculation' => [
                    [
                        'id' => 9,
                        'name' => 'Shia Ithna-Ashari, Leva Institute, Qum',
                        'params' => ['Fajr' => 16, 'Isha' => 14, 'Maghrib' => 4, 'Midnight' => 'JAFARI'],
                        'method' => 'Jafari',
                    ],
                    [
                        'id' => 10,
                        'name' => 'Institute of Geophysics, University of Tehran',
                        'params' => ['Fajr' => 17.7, 'Isha' => 14, 'Maghrib' => 4.5, 'Midnight' => 'JAFARI'],
                        'method' => 'Tehran',
                    ],
                    [
                        'id' => 11,
                        'name' => 'Islamic Society of North America (ISNA)',
                        'params' => ['Fajr' => 15, 'Isha' => 15],
                        'method' => 'ISNA',
                    ],
                    [
                        'id' => 12,
                        'name' => 'Muslim World League (MWL)',
                        'params' => ['Fajr' => 18, 'Isha' => 17],
                        'method' => 'MWL',
                    ],
                    [
                        'id' => 13,
                        'name' => 'Kuwait',
                        'params' => ['Fajr' => 18, 'Isha' => 17.5],
                        'method' => 'KUWAIT',
                    ],
                    [
                        'id' => 14,
                        'name' => 'Qatar',
                        'params' => ['Fajr' => 18, 'Isha' => "90 min"],
                        'method' => 'QATAR',
                    ],
                    [
                        'id' => 15,
                        'name' => 'Gulf Region',
                        'params' => ['Fajr' => 19.5, 'Isha' => "90 min"],
                        'method' => 'GULF',
                    ],
                    [
                        'id' => 16,
                        'name' => 'Egyptian General Authority of Survey',
                        'params' => ['Fajr' => 19.5, 'Isha' => 17.5],
                        'method' => 'Egypt',
                    ],
                    [
                        'id' => 17,
                        'name' => 'Umm Al-Qura University, Makkah',
                        'params' => ['Fajr' => 18.5, 'Isha' => '90 min'],
                        'method' => 'Makkah',
                    ],
                    [
                        'id' => 18,
                        'name' => 'University of Islamic Sciences, Karachi',
                        'params' => ['Fajr' => 18, 'Isha' => 17],
                        'method' => 'TURKEY',
                    ],
                    [
                        'id' => 19,
                        'name' => 'Diyanet İşleri Başkanlığı, Turkey',
                        'params' => ['Fajr' => 18, 'Isha' => 18],
                        'method' => 'Karachi',
                    ],
                    [
                        'id' => 20,
                        'name' => 'Majlis Ugama Islam Singapura, Singapore',
                        'params' => ['Fajr' => 20, 'Isha' => 18],
                        'method' => 'SINGAPORE',
                    ],
                    [
                        'id' => 21,
                        'name' => 'Union Organization Islamic de France',
                        'params' => ['Fajr' => 12, 'Isha' => 12],
                        'method' => 'FRANCE',
                    ],
                    [
                        'id' => 22,
                        'name' => 'Spiritual Administration of Muslims of Russia',
                        'params' => ['Fajr' => 16, 'Isha' => 15],
                        'method' => 'RUSSIA',
                    ],
                    [
                        'id' => 23,
                        'name' => 'Unified Method',
                        'params' => [
                            'Fajr' => 14.5,
                            'Isha' => '75 min',
                            'Maghrib' => '3 min',
                            'Asr' => 'Standard',
                            'Midnight' => 'Standard',
                            'HighLats' => 'AngleBased',
                            'Iterations' => 2,
                            // London Unified published-table safety margins
                            // (Sunrise −3 / Dhuhr +6 / Asr +1) — verified to
                            // reproduce the published Sunrise/Dhuhr/Asr/Maghrib
                            // to the minute against the engine.
                            'MarginsEnabled' => true,
                            'SunriseOffset' => -3,
                            'DhuhrOffset' => 6,
                            'AsrOffset' => 1,
                        ],
                        'method' => 'UNIFIED_METHOD',
                    ],
                ],
            ];
        }
    }
}

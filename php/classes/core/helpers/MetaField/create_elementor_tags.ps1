$base = "C:\Users\jamaal\Local Sites\corev2\app\public\wp-content\plugins\fiveprayercore\php\classes\core\helpers\MetaField\Elementor\DynamicTags"

$definitions = @(
    [pscustomobject]@{Class='FajrBeginsTag'; Field='fajr_begins'; Name='fiveprayer_fajr_begins_time'; Title='FivePrayer - Fajr Begins Time'},
    [pscustomobject]@{Class='FajrIqamahTag'; Field='fajr_iqamah'; Name='fiveprayer_fajr_iqamah_time'; Title='FivePrayer - Fajr Iqamah Time'},
    [pscustomobject]@{Class='DhuhrBeginsTag'; Field='dhuhr_begins'; Name='fiveprayer_dhuhr_begins_time'; Title='FivePrayer - Dhuhr Begins Time'},
    [pscustomobject]@{Class='DhuhrIqamahTag'; Field='dhuhr_iqamah'; Name='fiveprayer_dhuhr_iqamah_time'; Title='FivePrayer - Dhuhr Iqamah Time'},
    [pscustomobject]@{Class='AsrBeginsTag'; Field='asr_begins'; Name='fiveprayer_asr_begins_time'; Title='FivePrayer - Asr Begins Time'},
    [pscustomobject]@{Class='AsrIqamahTag'; Field='asr_iqamah'; Name='fiveprayer_asr_iqamah_time'; Title='FivePrayer - Asr Iqamah Time'},
    [pscustomobject]@{Class='MaghribBeginsTag'; Field='maghrib_begins'; Name='fiveprayer_maghrib_begins_time'; Title='FivePrayer - Maghrib Begins Time'},
    [pscustomobject]@{Class='MaghribIqamahTag'; Field='maghrib_iqamah'; Name='fiveprayer_maghrib_iqamah_time'; Title='FivePrayer - Maghrib Iqamah Time'},
    [pscustomobject]@{Class='IshaBeginsTag'; Field='isha_begins'; Name='fiveprayer_isha_begins_time'; Title='FivePrayer - Isha Begins Time'},
    [pscustomobject]@{Class='IshaIqamahTag'; Field='isha_iqamah'; Name='fiveprayer_isha_iqamah_time'; Title='FivePrayer - Isha Iqamah Time'},
    [pscustomobject]@{Class='SunriseTag'; Field='sunrise'; Name='fiveprayer_sunrise_begins_time'; Title='FivePrayer - Sunrise Time'},
    [pscustomobject]@{Class='MidnightTag'; Field='midnight'; Name='fiveprayer_midnight_begins_time'; Title='FivePrayer - Midnight Time'},
    [pscustomobject]@{Class='CurrentTimeTag'; Field='current_time'; Name='fiveprayer_current_time'; Title='FivePrayer - Current Time'},
    [pscustomobject]@{Class='CurrentDateTag'; Field='currentDate'; Name='fiveprayer_current_date'; Title='FivePrayer - Current Date'},
    [pscustomobject]@{Class='HijraDateTag'; Field='hijra_date'; Name='fiveprayer_hijra_date'; Title='FivePrayer - Hijri Date'},
    [pscustomobject]@{Class='PrayerTimesForTodayTag'; Field='prayer_times_for_today'; Name='fiveprayer_prayer_times_for_today'; Title='FivePrayer - Prayer Times For Today'},
    [pscustomobject]@{Class='NextPrayerTag'; Field='next_prayer'; Name='fiveprayer_next_prayer'; Title='FivePrayer - Next Prayer'},
    [pscustomobject]@{Class='NextPrayerBeginsTimeTag'; Field='next_prayer_begins_time'; Name='fiveprayer_next_prayer_begins_time'; Title='FivePrayer - Next Prayer Begins Time'},
    [pscustomobject]@{Class='NextPrayerIqamahTimeTag'; Field='next_prayer_iqamah_time'; Name='fiveprayer_next_prayer_iqamah_time'; Title='FivePrayer - Next Prayer Iqamah Time'},
    [pscustomobject]@{Class='NextPrayerTitleTag'; Field='next_prayer_title'; Name='fiveprayer_next_prayer_title'; Title='FivePrayer - Next Prayer Title'},
    [pscustomobject]@{Class='NextPrayerBeginsTitleTag'; Field='next_prayer_begins_title'; Name='fiveprayer_next_prayer_begins_title'; Title='FivePrayer - Next Prayer Begins Title'},
    [pscustomobject]@{Class='NextPrayerIqamahTitleTag'; Field='next_prayer_iqamah_title'; Name='fiveprayer_next_prayer_iqamah_title'; Title='FivePrayer - Next Prayer Iqamah Title'},
    [pscustomobject]@{Class='FajrNameTag'; Field='fajr_name'; Name='fiveprayer_fajr_name'; Title='FivePrayer - Fajr Name'},
    [pscustomobject]@{Class='DhuhrNameTag'; Field='dhuhr_name'; Name='fiveprayer_dhuhr_name'; Title='FivePrayer - Dhuhr Name'},
    [pscustomobject]@{Class='AsrNameTag'; Field='asr_name'; Name='fiveprayer_asr_name'; Title='FivePrayer - Asr Name'},
    [pscustomobject]@{Class='MaghribNameTag'; Field='maghrib_name'; Name='fiveprayer_maghrib_name'; Title='FivePrayer - Maghrib Name'},
    [pscustomobject]@{Class='IshaNameTag'; Field='isha_name'; Name='fiveprayer_isha_name'; Title='FivePrayer - Isha Name'},
    [pscustomobject]@{Class='SunriseNameTag'; Field='sunrise_name'; Name='fiveprayer_sunrise_name'; Title='FivePrayer - Sunrise Name'},
    [pscustomobject]@{Class='MidnightNameTag'; Field='midnight_name'; Name='fiveprayer_midnight_name'; Title='FivePrayer - Midnight Name'},
    [pscustomobject]@{Class='SinglePrayerBeginsTitleTag'; Field='single_prayer_begins_title'; Name='fiveprayer_single_prayer_begins_title'; Title='FivePrayer - Single Prayer Begins Title'},
    [pscustomobject]@{Class='SinglePrayerIqamahTitleTag'; Field='single_prayer_iqamah_title'; Name='fiveprayer_single_prayer_iqamah_title'; Title='FivePrayer - Single Prayer Iqamah Title'},
    [pscustomobject]@{Class='MasjidNameTag'; Field='masjid_name'; Name='fiveprayer_masjid_name'; Title='FivePrayer - Masjid Name'},
    [pscustomobject]@{Class='CurrentLocationTag'; Field='current_location'; Name='fiveprayer_current_location'; Title='FivePrayer - Current Location'},
    [pscustomobject]@{Class='PrayerTitleTag'; Field='prayer_title'; Name='fiveprayer_prayer_title'; Title='FivePrayer - Prayer Title'},
    [pscustomobject]@{Class='CurrentTitleTag'; Field='current_title'; Name='fiveprayer_current_title'; Title='FivePrayer - Current Prayer Title'},
    [pscustomobject]@{Class='VerticalDailyPrayerTag'; Field='vertical_daily_prayer'; Name='fiveprayer_vertical_daily_prayer'; Title='FivePrayer - Vertical Daily Prayer Table'}
)

$template = @"
<?php

namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

class {0} extends AbstractFieldTag {{
    protected static function get_field_key(): string {{
        return '{1}';
    }}

    protected static function get_tag_name(): string {{
        return '{2}';
    }}

    protected static function get_tag_title(): string {{
        return '{3}';
    }}
}}
"@

foreach ($def in $definitions) {
    $path = Join-Path $base ($def.Class + '.php')
    $content = [string]::Format($template, $def.Class, $def.Field, $def.Name, $def.Title)
    $content | Set-Content -Encoding UTF8 -Path $path
}

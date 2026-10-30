# FivePrayerElementorDynamicTags

## Overview
`FivePrayerElementorDynamicTags.php` is the main handler responsible for registering all FivePrayer dynamic tags with Elementor. It manages the registration process and organizes tags into logical groups.

## Location
`php/classes/core/helpers/MetaField/Elementor/FivePrayerElementorDynamicTags.php`

## Key Features

### Tag Registration
- Registers a custom "fiveprayer" group in Elementor's dynamic tags system
- Automatically registers all prayer time dynamic tags with Elementor
- Organizes tags under the "FivePrayer Fields" group title

### Supported Tags
The class registers the following dynamic tags with Elementor:

#### Prayer Time Tags
- FajrBeginsTag - Fajr prayer start time
- FajrIqamahTag - Fajr Iqamah time
- DhuhrBeginsTag - Dhuhr prayer start time
- DhuhrIqamahTag - Dhuhr Iqamah time
- AsrBeginsTag - Asr prayer start time
- Asr2BeginsTag - Second ‘Asr (2 Mithl / Hanafi) start time
- AsrIqamahTag - Asr Iqamah time
- MaghribBeginsTag - Maghrib prayer start time
- MaghribIqamahTag - Maghrib Iqamah time
- IshaBeginsTag - Isha prayer start time
- IshaIqamahTag - Isha Iqamah time

#### Special Time Tags
- SunriseTag - Sunrise time
- MidnightTag - Midnight time
- CurrentTimeTag - Current time
- CurrentDateTag - Current date
- HijraDateTag - Hijri date
- PrayerTimesForTodayTag - All prayer times for today
- NextPrayerTag - Next upcoming prayer

#### Next Prayer Specific Tags
- NextPrayerBeginsTimeTag - When the next prayer begins
- NextPrayerIqamahTimeTag - Iqamah time for the next prayer
- NextPrayerTitleTag - Title of the next prayer
- NextPrayerBeginsTitleTag - Title of the next prayer begins time
- NextPrayerIqamahTitleTag - Title of the next prayer Iqamah time

#### Name Tags
- FajrNameTag - Name/title of the Fajr prayer
- DhuhrNameTag - Name/title of the Dhuhr prayer
- AsrNameTag - Name/title of the Asr prayer
- MaghribNameTag - Name/title of the Maghrib prayer
- IshaNameTag - Name/title of the Isha prayer
- SunriseNameTag - Name/title of the sunrise time
- MidnightNameTag - Name/title of the midnight time

#### Advanced Tags
- SinglePrayerBeginsTitleTag - Title of a specific prayer begins time
- SinglePrayerIqamahTitleTag - Title of a specific prayer Iqamah time
- MasjidNameTag - Configured masjid name
- CurrentLocationTag - Configured location
- PrayerTitleTag - Generic prayer title
- CurrentTitleTag - Current title
- VerticalDailyPrayerTag - Vertical layout of daily prayer times

## Method

### `register(Manager $manager)`
Static method that takes Elementor's dynamic tags manager and registers all FivePrayer tags with it. It:
1. Creates a "fiveprayer" group with the title "FivePrayer Fields"
2. Defines an array of all supported tag classes
3. Iterates through the array and registers each tag with the manager

## Usage
This class is automatically invoked when the FivePrayer plugin initializes its Elementor integration. It ensures all dynamic tags are available in Elementor's dynamic content system.
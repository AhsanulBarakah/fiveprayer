# FivePrayer Elementor Integration

## Overview
The FivePrayer plugin provides comprehensive Elementor integration through dynamic tags that allow you to display prayer times and related information in any Elementor-powered page or post.

## Components

### Core Files
- [BaseDynamicTag](BaseDynamicTag.md) - Base class for all FivePrayer dynamic tags
- [FivePrayerElementorDynamicTags](FivePrayerElementorDynamicTags.md) - Main handler for registering all dynamic tags

### Dynamic Tags
The plugin provides numerous dynamic tags organized by prayer type:

#### Fajr Tags
- [FajrBeginsTag](FajrBeginsTag.md) - Displays the Fajr prayer start time
- [FajrIqamahTag](FajrIqamahTag.md) - Shows the Fajr Iqamah time
- [FajrNameTag](FajrNameTag.md) - Displays the name/title of the Fajr prayer

#### Sunrise Tag
- [SunriseTag](SunriseTag.md) - Shows the sunrise time
- [SunriseNameTag](SunriseNameTag.md) - Displays the name/title of the sunrise time

#### Dhuhr Tags
- [DhuhrBeginsTag](DhuhrBeginsTag.md) - Displays the Dhuhr prayer start time
- [DhuhrIqamahTag](DhuhrIqamahTag.md) - Shows the Dhuhr Iqamah time
- [DhuhrNameTag](DhuhrNameTag.md) - Displays the name/title of the Dhuhr prayer

#### Asr Tags
- [AsrBeginsTag](AsrBeginsTag.md) - Displays the Asr prayer start time
- [Asr2BeginsTag](Asr2BeginsTag.md) - Displays the second ‘Asr (2 Mithl / Hanafi) start time
- [AsrIqamahTag](AsrIqamahTag.md) - Shows the Asr Iqamah time
- [AsrNameTag](AsrNameTag.md) - Displays the name/title of the Asr prayer

#### Maghrib Tags
- [MaghribBeginsTag](MaghribBeginsTag.md) - Displays the Maghrib prayer start time
- [MaghribIqamahTag](MaghribIqamahTag.md) - Shows the Maghrib Iqamah time
- [MaghribNameTag](MaghribNameTag.md) - Displays the name/title of the Maghrib prayer

#### Isha Tags
- [IshaBeginsTag](IshaBeginsTag.md) - Displays the Isha prayer start time
- [IshaIqamahTag](IshaIqamahTag.md) - Shows the Isha Iqamah time
- [IshaNameTag](IshaNameTag.md) - Displays the name/title of the Isha prayer

#### Special Time Tags
- [CurrentTimeTag](CurrentTimeTag.md) - Displays the current time
- [CurrentDateTag](CurrentDateTag.md) - Shows the current date
- [CurrentLocationTag](CurrentLocationTag.md) - Displays the configured location
- [HijraDateTag](HijraDateTag.md) - Shows the Hijri date
- [MasjidNameTag](MasjidNameTag.md) - Displays the configured masjid name
- [MidnightTag](MidnightTag.md) - Shows the midnight time
- [MidnightNameTag](MidnightNameTag.md) - Displays the name/title of the midnight time

#### Next Prayer Tags
- [NextPrayerTag](NextPrayerTag.md) - Shows the next upcoming prayer
- [NextPrayerTitleTag](NextPrayerTitleTag.md) - Displays the title of the next prayer
- [NextPrayerBeginsTimeTag](NextPrayerBeginsTimeTag.md) - Shows when the next prayer begins
- [NextPrayerBeginsTitleTag](NextPrayerBeginsTitleTag.md) - Displays the title of the next prayer begins time
- [NextPrayerIqamahTimeTag](NextPrayerIqamahTimeTag.md) - Shows the Iqamah time for the next prayer
- [NextPrayerIqamahTitleTag](NextPrayerIqamahTitleTag.md) - Displays the title of the next prayer Iqamah time

#### Prayer Time Collection Tags
- [PrayerTimesForTodayTag](PrayerTimesForTodayTag.md) - Shows all prayer times for the current day
- [PrayerTitleTag](PrayerTitleTag.md) - Generic prayer title tag
- [SinglePrayerBeginsTitleTag](SinglePrayerBeginsTitleTag.md) - Displays the title of a specific prayer begins time
- [SinglePrayerIqamahTitleTag](SinglePrayerIqamahTitleTag.md) - Shows the title of a specific prayer Iqamah time
- [VerticalDailyPrayerTag](VerticalDailyPrayerTag.md) - Displays vertical layout of daily prayer times

#### Utility Tags
- [CurrentTitleTag](CurrentTitleTag.md) - Displays the current title
- [AbstractFieldTag](AbstractFieldTag.md) - Abstract base class defining the interface for field tags

## Features

### Dynamic Content Integration
The FivePrayer plugin provides a comprehensive set of dynamic tags for Elementor that allow you to display prayer times and related information in any Elementor widget that supports dynamic content.

### Automatic Registration
All dynamic tags are automatically registered with Elementor when the plugin is active, making them available in the dynamic content selector.

### Consistent Naming Convention
All dynamic tag files follow a consistent naming convention that reflects their purpose (e.g., FajrBeginsTag.php handles the Fajr begins time).

## Usage Instructions

### Adding Prayer Times to Pages
1. Edit a page or post with Elementor
2. Add a widget that supports dynamic content (Text Editor, Heading, etc.)
3. Click on the dynamic content icon (usually looks like a bracket {})
4. Search for "FivePrayer" tags
5. Select the desired prayer time tag
6. Customize display as needed

### Creating Prayer Time Layouts
1. Use Elementor's layout features to create attractive prayer time displays
2. Combine multiple dynamic tags to show complete schedules
3. Apply Elementor's styling options to match your site design
4. Use responsive controls to ensure mobile compatibility
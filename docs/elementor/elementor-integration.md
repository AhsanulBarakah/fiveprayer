# FivePrayer Elementor Integration Documentation

## Overview
This document describes the Elementor integration features of the FivePrayer plugin. The integration allows users to easily add prayer times and related content to their Elementor-powered pages and posts through dynamic tags and other integration points.

## Directory Structure
```
php/classes/core/helpers/MetaField/Elementor/
├── assets/
├── Controls/
├── DynamicTags/
│   ├── AbstractFieldTag.php
│   ├── AsrBeginsTag.php
│   ├── AsrIqamahTag.php
│   ├── AsrNameTag.php
│   ├── CurrentDateTag.php
│   ├── CurrentLocationTag.php
│   ├── CurrentTimeTag.php
│   ├── CurrentTitleTag.php
│   ├── DhuhrBeginsTag.php
│   ├── DhuhrIqamahTag.php
│   ├── DhuhrNameTag.php
│   ├── FajrBeginsTag.php
│   ├── FajrIqamahTag.php
│   ├── FajrNameTag.php
│   ├── HijraDateTag.php
│   ├── IshaBeginsTag.php
│   ├── IshaIqamahTag.php
│   ├── IshaNameTag.php
│   ├── MaghribBeginsTag.php
│   ├── MaghribIqamahTag.php
│   ├── MaghribNameTag.php
│   ├── MasjidNameTag.php
│   ├── MidnightNameTag.php
│   ├── MidnightTag.php
│   ├── NextPrayerBeginsTimeTag.php
│   ├── NextPrayerBeginsTitleTag.php
│   ├── NextPrayerIqamahTimeTag.php
│   ├── NextPrayerIqamahTitleTag.php
│   ├── NextPrayerTag.php
│   ├── NextPrayerTitleTag.php
│   ├── PrayerTimesForTodayTag.php
│   ├── PrayerTitleTag.php
│   ├── SinglePrayerBeginsTitleTag.php
│   ├── SinglePrayerIqamahTitleTag.php
│   ├── SunriseNameTag.php
│   ├── SunriseTag.php
│   └── VerticalDailyPrayerTag.php
├── BaseDynamicTag.php
└── FivePrayerElementorDynamicTags.php
```

## Core Files

### BaseDynamicTag.php
**Purpose**: Base class for all FivePrayer Elementor dynamic tags
**Functions**: Provides common functionality and structure for all dynamic tags

### FivePrayerElementorDynamicTags.php
**Purpose**: Main handler for registering all FivePrayer dynamic tags with Elementor
**Functions**: Initializes and registers all prayer time dynamic tags with Elementor

## Dynamic Tags Available

### Fajr Tags
- **FajrBeginsTag.php**: Displays the Fajr prayer start time
- **FajrIqamahTag.php**: Shows the Fajr Iqamah time
- **FajrNameTag.php**: Displays the name/title of the Fajr prayer

### Sunrise Tag
- **SunriseTag.php**: Shows the sunrise time
- **SunriseNameTag.php**: Displays the name/title of the sunrise time

### Dhuhr Tags
- **DhuhrBeginsTag.php**: Displays the Dhuhr prayer start time
- **DhuhrIqamahTag.php**: Shows the Dhuhr Iqamah time
- **DhuhrNameTag.php**: Displays the name/title of the Dhuhr prayer

### Asr Tags
- **AsrBeginsTag.php**: Displays the Asr prayer start time
- **Asr2BeginsTag.php**: Displays the second ‘Asr (2 Mithl / Hanafi) start time
- **AsrIqamahTag.php**: Shows the Asr Iqamah time
- **AsrNameTag.php**: Displays the name/title of the Asr prayer

### Maghrib Tags
- **MaghribBeginsTag.php**: Displays the Maghrib prayer start time
- **MaghribIqamahTag.php**: Shows the Maghrib Iqamah time
- **MaghribNameTag.php**: Displays the name/title of the Maghrib prayer

### Isha Tags
- **IshaBeginsTag.php**: Displays the Isha prayer start time
- **IshaIqamahTag.php**: Shows the Isha Iqamah time
- **IshaNameTag.php**: Displays the name/title of the Isha prayer

### Special Time Tags
- **CurrentTimeTag.php**: Displays the current time
- **CurrentDateTag.php**: Shows the current date
- **CurrentLocationTag.php**: Displays the configured location
- **HijraDateTag.php**: Shows the Hijri date
- **MasjidNameTag.php**: Displays the configured masjid name
- **MidnightTag.php**: Shows the midnight time
- **MidnightNameTag.php**: Displays the name/title of the midnight time

### Next Prayer Tags
- **NextPrayerTag.php**: Shows the next upcoming prayer
- **NextPrayerTitleTag.php**: Displays the title of the next prayer
- **NextPrayerBeginsTimeTag.php**: Shows when the next prayer begins
- **NextPrayerBeginsTitleTag.php**: Displays the title of the next prayer begins time
- **NextPrayerIqamahTimeTag.php**: Shows the Iqamah time for the next prayer
- **NextPrayerIqamahTitleTag.php**: Displays the title of the next prayer Iqamah time

### Prayer Time Collection Tags
- **PrayerTimesForTodayTag.php**: Shows all prayer times for the current day
- **PrayerTitleTag.php**: Generic prayer title tag
- **SinglePrayerBeginsTitleTag.php**: Displays the title of a specific prayer begins time
- **SinglePrayerIqamahTitleTag.php**: Shows the title of a specific prayer Iqamah time
- **VerticalDailyPrayerTag.php**: Displays vertical layout of daily prayer times

### Utility Tags
- **CurrentTitleTag.php**: Displays the current title
- **AbstractFieldTag.php**: Abstract base class defining the interface for field tags

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

## Technical Implementation

### Dynamic Tag Architecture
Each dynamic tag extends the base functionality provided by BaseDynamicTag.php and implements specific logic for retrieving and formatting the corresponding prayer time or related data.

### Data Retrieval
Dynamic tags retrieve prayer time data from the FivePrayer plugin's data storage, ensuring consistency with other plugin features.

## Compatibility
- Compatible with Elementor Free and Pro versions
- Works with most Elementor templates and themes
- Responsive design support through Elementor controls
- Compatible with Elementor's theme builder

## Support
For support with Elementor integration:
- Check the main FivePrayer documentation
- Visit the plugin support forums
- Ensure both plugins are updated to their latest versions
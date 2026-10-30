# PrayerTimesForTodayTag

## Overview
`PrayerTimesForTodayTag.php` is a dynamic tag that displays all prayer times for the current day in Elementor. It extends AbstractFieldTag and implements the required methods to provide complete daily prayer schedule data.

## Location
`php/classes/core/helpers/MetaField/Elementor/DynamicTags/PrayerTimesForTodayTag.php`

## Key Features

### Field Identification
- **Field Key**: `prayer_times_for_today` - Identifies the daily prayer times field in the FivePrayer system
- **Tag Name**: `fiveprayer_prayer_times_for_today` - Unique identifier for Elementor's dynamic tag system
- **Tag Title**: `FivePrayer - Prayer Times For Today` - Display name in Elementor's dynamic tags interface

### Functionality
- Retrieves and displays all prayer times for the current day
- Includes Fajr, Sunrise, Dhuhr, Asr, Maghrib, and Isha times
- Formats times according to the site's time format settings
- Supports translation of prayer names and time formats
- Integrates with Elementor's dynamic content system
- Applies any configured word removal rules

### Inheritance
- Extends `AbstractFieldTag` to inherit standardized structure
- Implements the abstract methods required for all field tags
- Inherits all security and data handling features from the base classes

## Methods

### `get_field_key(): string`
Returns `'prayer_times_for_today'` to identify the daily prayer times field in the FivePrayer system.

### `get_tag_name(): string`
Returns `'fiveprayer_prayer_times_for_today'` as the unique identifier for Elementor's dynamic tag system.

### `get_tag_title(): string`
Returns `'FivePrayer - Prayer Times For Today'` as the display name in Elementor's interface.

## Usage
This tag can be added to any Elementor widget that supports dynamic content:
1. Edit a page or post with Elementor
2. Add a widget that supports dynamic content (Text Editor, Heading, etc.)
3. Click on the dynamic content icon
4. Search for "FivePrayer" tags
5. Select "FivePrayer - Prayer Times For Today"
6. All prayer times for the current day will be displayed

## Security
- Inherits all security measures from BaseDynamicTag
- Validates data before output
- Sanitizes content for safe display
- Supports word removal functionality for customized display
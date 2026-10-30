# NextPrayerTag

## Overview
`NextPrayerTag.php` is a dynamic tag that displays the next upcoming prayer in Elementor. It extends AbstractFieldTag and implements the required methods to provide next prayer data.

## Location
`php/classes/core/helpers/MetaField/Elementor/DynamicTags/NextPrayerTag.php`

## Key Features

### Field Identification
- **Field Key**: `next_prayer` - Identifies the next prayer field in the FivePrayer system
- **Tag Name**: `fiveprayer_next_prayer` - Unique identifier for Elementor's dynamic tag system
- **Tag Title**: `FivePrayer - Next Prayer` - Display name in Elementor's dynamic tags interface

### Functionality
- Calculates and retrieves the next upcoming prayer based on current time
- Updates dynamically as time progresses throughout the day
- Supports translation of prayer names
- Integrates with Elementor's dynamic content system
- Enqueues necessary scripts for real-time updates

### Inheritance
- Extends `AbstractFieldTag` to inherit standardized structure
- Implements the abstract methods required for all field tags
- Inherits all security and data handling features from the base classes

## Methods

### `get_field_key(): string`
Returns `'next_prayer'` to identify the next prayer field in the FivePrayer system.

### `get_tag_name(): string`
Returns `'fiveprayer_next_prayer'` as the unique identifier for Elementor's dynamic tag system.

### `get_tag_title(): string`
Returns `'FivePrayer - Next Prayer'` as the display name in Elementor's interface.

## Usage
This tag can be added to any Elementor widget that supports dynamic content:
1. Edit a page or post with Elementor
2. Add a widget that supports dynamic content (Text Editor, Heading, etc.)
3. Click on the dynamic content icon
4. Search for "FivePrayer" tags
5. Select "FivePrayer - Next Prayer"
6. The next upcoming prayer will be displayed and update automatically

## Security
- Inherits all security measures from BaseDynamicTag
- Validates data before output
- Sanitizes content for safe display
- Supports word removal functionality for customized display
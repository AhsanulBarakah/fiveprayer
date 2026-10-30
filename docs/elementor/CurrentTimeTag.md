# CurrentTimeTag

## Overview
`CurrentTimeTag.php` is a dynamic tag that displays the current time in Elementor. It extends AbstractFieldTag and implements the required methods to provide real-time clock data.

## Location
`php/classes/core/helpers/MetaField/Elementor/DynamicTags/CurrentTimeTag.php`

## Key Features

### Field Identification
- **Field Key**: `current_time` - Identifies the current time field in the FivePrayer system
- **Tag Name**: `fiveprayer_current_time` - Unique identifier for Elementor's dynamic tag system
- **Tag Title**: `FivePrayer - Current Time` - Display name in Elementor's dynamic tags interface

### Functionality
- Retrieves and displays the current time according to WordPress timezone settings
- Updates in real-time with JavaScript for live display
- Formats time according to the site's time format settings
- Supports translation of time formats and numbers
- Integrates with Elementor's dynamic content system
- Enqueues necessary scripts for live time updates

### Inheritance
- Extends `AbstractFieldTag` to inherit standardized structure
- Implements the abstract methods required for all field tags
- Inherits all security and data handling features from the base classes

## Methods

### `get_field_key(): string`
Returns `'current_time'` to identify the current time field in the FivePrayer system.

### `get_tag_name(): string`
Returns `'fiveprayer_current_time'` as the unique identifier for Elementor's dynamic tag system.

### `get_tag_title(): string`
Returns `'FivePrayer - Current Time'` as the display name in Elementor's interface.

## Usage
This tag can be added to any Elementor widget that supports dynamic content:
1. Edit a page or post with Elementor
2. Add a widget that supports dynamic content (Text Editor, Heading, etc.)
3. Click on the dynamic content icon
4. Search for "FivePrayer" tags
5. Select "FivePrayer - Current Time"
6. The current time will be displayed and update in real-time

## Security
- Inherits all security measures from BaseDynamicTag
- Validates data before output
- Sanitizes content for safe display
- Supports word removal functionality for customized display
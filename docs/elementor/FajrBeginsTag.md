# FajrBeginsTag

## Overview
`FajrBeginsTag.php` is a dynamic tag that displays the Fajr prayer start time in Elementor. It extends AbstractFieldTag and implements the required methods to provide Fajr begins time data.

## Location
`php/classes/core/helpers/MetaField/Elementor/DynamicTags/FajrBeginsTag.php`

## Key Features

### Field Identification
- **Field Key**: `fajr_begins` - Identifies the Fajr begins time field in the FivePrayer system
- **Tag Name**: `fiveprayer_fajr_begins_time` - Unique identifier for Elementor's dynamic tag system
- **Tag Title**: `FivePrayer - Fajr Begins Time` - Display name in Elementor's dynamic tags interface

### Functionality
- Retrieves the Fajr prayer start time from the FivePrayer data system
- Formats the time according to the site's time format settings
- Supports translation of time formats and numbers
- Integrates with Elementor's dynamic content system

### Inheritance
- Extends `AbstractFieldTag` to inherit standardized structure
- Implements the abstract methods required for all field tags
- Inherits all security and data handling features from the base classes

## Methods

### `get_field_key(): string`
Returns `'fajr_begins'` to identify the Fajr begins time field in the FivePrayer system.

### `get_tag_name(): string`
Returns `'fiveprayer_fajr_begins_time'` as the unique identifier for Elementor's dynamic tag system.

### `get_tag_title(): string`
Returns `'FivePrayer - Fajr Begins Time'` as the display name in Elementor's interface.

## Usage
This tag can be added to any Elementor widget that supports dynamic content:
1. Edit a page or post with Elementor
2. Add a widget that supports dynamic content (Text Editor, Heading, etc.)
3. Click on the dynamic content icon
4. Search for "FivePrayer" tags
5. Select "FivePrayer - Fajr Begins Time"
6. The Fajr prayer start time will be displayed in the widget

## Security
- Inherits all security measures from BaseDynamicTag
- Validates data before output
- Sanitizes content for safe display
- Supports word removal functionality for customized display
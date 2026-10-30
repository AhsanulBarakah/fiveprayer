# AbstractFieldTag

## Overview
`AbstractFieldTag.php` is an abstract class that extends BaseDynamicTag and provides a standardized structure for all specific prayer time dynamic tags. It defines the required methods that each concrete tag class must implement.

## Location
`php/classes/core/helpers/MetaField/Elementor/DynamicTags/AbstractFieldTag.php`

## Key Features

### Abstract Methods
The class defines three abstract methods that must be implemented by all extending classes:

#### `get_field_key(): string`
Returns the unique field key used to identify the specific data field in the FivePrayer system.

#### `get_tag_name(): string`
Returns the unique name for the Elementor dynamic tag.

#### `get_tag_title(): string`
Returns the human-readable title displayed in Elementor's dynamic tags interface.

### Constructor
The constructor automatically:
- Sets the field key from the implementing class
- Configures the tag with the name and title from the implementing class
- Passes the configuration to the parent BaseDynamicTag class

### Inheritance Chain
- Extends `BaseDynamicTag` to inherit all core functionality
- Provides a consistent interface for all specific prayer time tags
- Ensures all tags follow the same structural pattern

## Usage
This class is not used directly but serves as the foundation for all specific prayer time dynamic tags. Each concrete tag class extends this abstract class and implements the required methods.

## Example Implementation
Concrete classes like `FajrBeginsTag` extend this class and implement the abstract methods:

```php
class FajrBeginsTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'fajr_begins';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_fajr_begins_time';
    }

    protected static function get_tag_title(): string {
        return 'FivePrayer - Fajr Begins Time';
    }
}
```

This ensures consistency across all dynamic tags while allowing each to specify its unique field key, tag name, and display title.
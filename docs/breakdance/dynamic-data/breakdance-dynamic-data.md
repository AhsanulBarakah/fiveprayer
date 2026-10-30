# Breakdance Dynamic Data Documentation

## Overview

Dynamic Data in Breakdance allows pulling content from various WordPress sources (posts, custom fields, ACF, etc.) to populate elements in the builder. This enables creating flexible, data-driven websites.

## Dynamic Data Architecture

### Base Classes
- `Breakdance\DynamicData\Field`: Abstract base class for all dynamic fields
- `Breakdance\DynamicData\StringField`: For text/string data
- `Breakdance\DynamicData\ImageField`: For image data
- `Breakdance\DynamicData\PostField`: For post-related data

### Data Types
- **String**: Text content (titles, excerpts, custom fields, etc.)
- **Image**: Image URLs, alt text, captions
- **Gallery**: Collections of images
- **Post**: Post objects and their properties
- **Oembed**: Embedded content from external services

## Creating Dynamic Fields

### Extending StringField
```php
namespace Breakdance\DynamicData;

class CustomTextField extends StringField {
    public function label()
    {
        return 'Custom Text Field';
    }

    public function category()
    {
        return 'Custom Category';
    }

    public function subcategory()
    {
        return 'Custom Subcategory';
    }

    public function slug()
    {
        return 'custom_text_field_slug';
    }

    public function handler($attributes): StringData
    {
        // Process and return dynamic data
        $value = get_option('my_custom_setting');
        return StringData::fromString($value);
    }
}
```

### Registration
```php
// Register the field
Breakdance\DynamicData\registerField(new CustomTextField());
```

## Field Methods

### Required Methods
- `label()`: Display name for the field
- `category()`: Main category grouping
- `subcategory()`: Subcategory grouping
- `slug()`: Unique identifier
- `handler()`: Processes and returns the data

### Optional Methods
- `returnTypes()`: Defines data types returned
- `controls()`: Additional configuration controls
- `defaultAttributes()`: Default control values

## Handler Parameters

The handler receives an `$attributes` array containing control values set by the user, allowing for configurable dynamic content.

## Available Dynamic Fields

### Post-Based Fields
- Post titles, content, excerpts
- Post dates and times
- Featured images
- Post metadata
- Terms and taxonomies

### ACF Fields
- ACF text, textarea, WYSIWYG
- ACF image and file fields
- ACF gallery fields
- ACF relationship fields
- ACF repeater and flexible content

### Meta Fields
- Standard WordPress meta fields
- Custom meta fields
- User meta fields
- Term meta fields

## Advanced Features

### Controls for Dynamic Fields
Dynamic fields can have their own configuration controls, allowing users to customize behavior per instance.

### Fallback Values
Fields can provide fallback values when primary data is unavailable.

### Advanced Controls
Additional controls can be added to configure how the dynamic data is processed.
</content>
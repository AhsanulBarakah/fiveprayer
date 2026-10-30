# Development Guide

## Architecture Overview

### Plugin Structure

The FivePrayer Breakdance integration follows this structure:

```
fiveprayer/
├── Fiveprayer.php (main plugin file)
├── php/
│   └── classes/
│       └── core/
│           └── helpers/
│               └── MetaField/
│                   ├── Breakdance/
│                   │   ├── init.php (element registration)
│                   │   ├── RegisterFields.php (dynamic field registration)
│                   │   └── elements/ (element files)
│                   │       ├── FivePrayerTimes/
│                   │       ├── FivePrayerCountdown/
│                   │       ├── FivePrayerSchedule/
│                   │       └── FivePrayerHijriCalendar/
│                   ├── BreakdanceCompatManager.php
│                   ├── MetaFieldGenerator.php
│                   └── PageBuilderCompat.php
```

### Registration Flow

1. **Main Plugin File** (`Fiveprayer.php`):
   - Category registration happens here
   - Dynamic field registration
   - Hooked to `breakdance_loaded` action

2. **Init File** (`init.php`):
   - Element registration only (no category registration)
   - Prevents duplicate categories in Oxygen
   - Hooked to `breakdance_loaded` action

3. **Element Files**:
   - Located in respective element directories
   - Each element has its own directory with all required files

## Adding New Elements

### Element File Structure

Each element must have the following files:

```
elements/ElementName/
├── element.php (main element class)
├── html.twig (HTML template)
├── css.twig (dynamic CSS template)
├── default.css (default styling)
└── ssr.php (server-side rendering - optional)
```

### Creating a New Element

1. **Create Element Directory**:
   ```
   php/classes/core/helpers/MetaField/Breakdance/elements/NewElementName/
   ```

2. **Create Element Class** (`element.php`):
   ```php
   <?php

   namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Elements;

   use function Breakdance\Elements\c;
   use function Breakdance\Elements\controlSection;

   class NewElementName extends \Breakdance\Elements\Element
   {
       static function uiIcon()
       {
           return 'Generic';
       }

       static function tag()
       {
           return 'div';
       }

       static function name()
       {
           return 'New Element Name';
       }

       static function className()
       {
           return 'new-element-class';
       }

       static function category()
       {
           return 'five-prayer'; // Important: use the correct category
       }

       static function template()
       {
           return file_get_contents(__DIR__ . '/html.twig');
       }

       // ... other required methods
   }
   ```

3. **Create Templates**:
   - `html.twig`: HTML structure with Twig syntax
   - `css.twig`: Dynamic CSS with property references
   - `default.css`: Default styling

4. **Update Init File**:
   Add the new element to the `$element_classes` array in `init.php`

### Element Registration

The registration process is automated through the save location approach:

```php
\Breakdance\ElementStudio\registerSaveLocation(
    $relative_path,
    'FivePrayerElements',
    'element',
    'FivePrayer Elements',
    false
);
```

This allows Breakdance to automatically discover elements in the specified directory.

## Dynamic Fields

### Dynamic Field Structure

Dynamic fields are registered through the `FivePrayerBreakdanceField` class:

```php
class FivePrayerBreakdanceField extends \Breakdance\DynamicData\StringField
{
    // Field implementation
}
```

### Adding New Dynamic Fields

1. **Update ShortCodeMap**:
   Add the new field to `ShortCodeMap::ACTIVE_SHORTCODES`

2. **Register Field**:
   The field will be automatically registered through the loop in `RegisterFields.php`

3. **Field Data Manager**:
   Update `FieldDataManager` if special handling is needed

## Category Registration

### Single Category Registration

To prevent duplicate categories in Oxygen Builder:

- **Category registration**: Only in main plugin file (`Fiveprayer.php`)
- **Element registration**: In init.php file (without category registration)
- **Result**: Single category registration, no duplicates in Oxygen

### Category Registration Code

```php
if (class_exists('\Breakdance\Elements\ElementCategoriesController')) {
    \Breakdance\Elements\ElementCategoriesController::getInstance()
        ->registerCategory('five-prayer', 'Five Prayer');
}
```

## Compatibility Systems

### Breakdance Compatibility

Managed through `BreakdanceCompatManager`:

```php
class BreakdanceCompatManager {
    public function init(): void {
        // Only load when Breakdance is active
        if (class_exists('\Breakdance\Elements\Element')) {
            // Load element files
        }
    }
}
```

### Oxygen Builder Compatibility

Handled through dynamic fields and conditional loading:

```php
if (defined('OXYGEN_VERSION')) {
    // Oxygen-specific compatibility
}
```

## File Loading Strategy

### Conditional Loading

Files are only loaded when the corresponding page builder is active:

```php
// Only load when Breakdance is active
if (class_exists('\Breakdance\Elements\Element')) {
    // Load element files
}

// Only load when Elementor is active
if (defined('ELEMENTOR_VERSION')) {
    // Load Elementor compatibility
}
```

### Preventing Duplicate Loading

Use WordPress action tracking to prevent duplicate registrations:

```php
if (!did_action('oxygen_elements_registered_fiveprayer')) {
    // Register elements
    do_action('oxygen_elements_registered_fiveprayer');
}
```

## Error Handling

### Safe File Loading

Always check if files exist and classes are loaded:

```php
if (file_exists($file_path) && !class_exists($class_name)) {
    require_once $file_path;
}
```

### Breakdance Availability Checks

Always verify Breakdance components exist before using them:

```php
if (class_exists('\Breakdance\Elements\ElementCategoriesController')) {
    // Use category controller
}
```

## Performance Considerations

### Lazy Loading

Load files only when needed:

```php
add_action('breakdance_loaded', function() {
    // Load element files only when Breakdance is loaded
});
```

### Efficient Registration

Use save location approach for automatic discovery:

```php
\Breakdance\ElementStudio\registerSaveLocation(
    // Efficient registration without manual file loading
);
```

## Testing Guidelines

### Breakdance Testing

1. Verify category appears in Breakdance
2. Check all elements are functional
3. Test dynamic field integration
4. Verify styling options work

### Oxygen Builder Testing

1. Check dynamic fields are available
2. Verify no duplicate categories
3. Test dynamic content insertion
4. Confirm styling works properly

### Cross-Compatibility Testing

1. Test with both builders active
2. Verify no conflicts occur
3. Check performance impact
4. Confirm all features work

## Troubleshooting Development Issues

### Element Not Appearing

- Check if element file is properly structured
- Verify category registration
- Confirm save location path is correct
- Ensure Breakdance is active

### Dynamic Fields Not Working

- Verify field registration
- Check shortcode mapping
- Confirm Breakdance dynamic data system is available
- Test field handler functionality

### Category Duplication

- Verify category is only registered once
- Check for multiple registration points
- Confirm Oxygen compatibility approach
- Test with both builders active
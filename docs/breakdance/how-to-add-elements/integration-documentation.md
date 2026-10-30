# Breakdance Integration Documentation

## Overview
This document outlines the integration of FivePrayer custom elements with the Breakdance page builder. The integration enables users to add prayer time elements directly in the Breakdance editor under a dedicated "Five Prayer" category.

## What Was Achieved

### 1. Custom Element Registration
- Successfully registered 4 custom Breakdance elements:
  - Five Prayer Times
  - Five Prayer Countdown
  - Five Prayer Schedule
  - Five Prayer Hijri Calendar

### 2. Category Registration
- Created and registered a custom "Five Prayer" category in Breakdance
- All custom elements appear under this dedicated category

### 3. Dynamic Data Fields
- Maintained existing dynamic data field functionality
- Prayer time data is accessible through Breakdance's dynamic content system

### 4. Proper Architecture
- Elements are properly structured with controls, templates, and styling
- Compatible with both Oxygen and Breakdance page builders
- Follows Breakdance's recommended patterns

## Technical Implementation

### 1. Element Structure
Each element follows Breakdance's standard structure:
- `element.php` - Contains the main element class extending `\Breakdance\Elements\Element`
- `html.twig` - Twig template for the element's HTML structure
- `css.twig` - Dynamic CSS template
- `default.css` - Default styling

### 2. Registration Method
The integration uses Breakdance's `registerSaveLocation` approach:
```php
\Breakdance\ElementStudio\registerSaveLocation(
    $relative_path,
    'FivePrayerElements',
    'element',
    'FivePrayer Elements',
    false
);
```

### 3. Category Registration
Custom category is registered using:
```php
\Breakdance\Elements\ElementCategoriesController::getInstance()->registerCategory('five-prayer', 'Five Prayer');
```
This registration happens in the main plugin file (`Fiveprayer.php`) to prevent duplicate category registration in Oxygen Builder.

### 4. File Locations
- Main registration: `Fiveprayer.php` (main plugin file) - Category registration
- Element files: `php/classes/core/helpers/MetaField/Breakdance/elements/`
- Element registration: `php/classes/core/helpers/MetaField/Breakdance/init.php` - Element registration only (no category registration)
- Compatibility classes: `php/classes/core/helpers/MetaField/`

### 5. Dual Registration Approach
To prevent duplicate categories in Oxygen Builder while maintaining functionality in Breakdance:
- Category registration is centralized in the main plugin file (`Fiveprayer.php`)
- Element registration happens in the init.php file without duplicate category registration
- This ensures elements appear in Breakdance with proper categorization while avoiding duplicate categories in Oxygen Builder

## Elements Details

### Five Prayer Times
- Displays daily prayer times in a formatted layout
- Configurable prayer selection (all prayers, specific prayers, or custom selection)
- Option to show/hide Iqamah times
- Customizable styling options

### Five Prayer Countdown
- Shows countdown to the next prayer time
- Configurable target prayer selection
- Multiple display formats (blocks, inline, circular)
- Customizable appearance options

### Five Prayer Schedule
- Complete daily prayer schedule display
- Multiple layout options (horizontal, vertical, grid)
- Configurable prayer names and times
- Option to include/exclude sunrise and Iqamah times

### Five Prayer Hijri Calendar
- Islamic Hijri calendar with prayer times
- Dual display of Gregorian and Hijri dates
- Configurable calendar size and appearance
- Option to highlight today's date

## Integration Process

### 1. Initial Approach
- Started with a separate "BreakFive" plugin to test the integration
- Verified that elements appeared correctly in Breakdance
- Confirmed category registration worked properly

### 2. Main Plugin Integration
- Migrated the working solution to the main FivePrayer plugin
- Used `registerSaveLocation` approach for automatic element discovery
- Ensured proper category registration timing
- Maintained backward compatibility

### 3. Issue Resolution
- Fixed icon display issues by using 'Generic' icons
- Resolved dynamic field registration conflicts
- Ensured proper file loading order
- Maintained all existing functionality

## Files Modified

### Main Plugin File
- `Fiveprayer.php` - Added Breakdance element and dynamic field registration

### Element Files
- `php/classes/core/helpers/MetaField/Breakdance/elements/FivePrayerTimes/`
- `php/classes/core/helpers/MetaField/Breakdance/elements/FivePrayerCountdown/`
- `php/classes/core/helpers/MetaField/Breakdance/elements/FivePrayerSchedule/`
- `php/classes/core/helpers/MetaField/Breakdance/elements/FivePrayerHijriCalendar/`

### Compatibility Files
- `php/classes/core/helpers/MetaField/BreakdanceCompatManager.php`
- `php/classes/core/helpers/MetaField/Breakdance/init.php`
- Various compatibility classes in the MetaField directory

## Dependencies

### Required Plugins
- Breakdance page builder
- FivePrayer plugin (main plugin)

### Breakdance Components Used
- `\Breakdance\ElementStudio`
- `\Breakdance\Elements\ElementCategoriesController`
- `\Breakdance\DynamicData\registerField`
- `\Breakdance\Util\getDirectoryPathRelativeToPluginFolder`

## Testing Results

### Verified Functionality
- ✅ Elements appear in Breakdance editor
- ✅ Elements are grouped under "Five Prayer" category
- ✅ All element controls work properly
- ✅ Dynamic data fields are accessible
- ✅ Elements render correctly on frontend
- ✅ Styling options work as expected
- ✅ Existing functionality remains intact

## Future Enhancements

### Planned Features
- Additional prayer time elements
- Enhanced styling options
- Translation support
- Advanced scheduling features

### Maintenance Notes
- Elements follow Breakdance's recommended patterns
- Easy to add new elements following the same structure
- Backward compatibility maintained
- Proper error handling implemented
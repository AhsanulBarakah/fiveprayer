# Breakdance Integration Documentation

## Overview

This document describes how the FivePrayer plugin integrates with Breakdance to provide dynamic prayer time data as dynamic fields within the Breakdance page builder.

## Integration Points

### Dynamic Field Registration
- The plugin registers custom dynamic fields with Breakdance
- Fields are categorized under "FivePrayer Fields"
- Each field corresponds to a specific prayer time or data element

### Registration Process
1. Check if Breakdance is active before initializing
2. Register each prayer time field as a Breakdance dynamic field
3. Provide custom controls for field configuration
4. Implement data processing in the handler method

## Dynamic Field Structure

### Base Class
- `FivePrayerBreakdanceField` extends `\Breakdance\DynamicData\StringField`
- Implements required methods for Breakdance integration
- Handles data retrieval and processing

### Required Methods
- `label()`: Returns the field display name
- `category()`: Returns the field category ("FivePrayer")
- `subcategory()`: Returns the subcategory
- `slug()`: Returns the unique field identifier
- `handler()`: Processes and returns the dynamic data

### Field Data Retrieval
- Retrieves data from post meta or generates default values
- Applies word removal functionality for title fields
- Processes shortcode to get actual prayer time values

## Word Removal Feature

### Title Field Detection
- Uses `isTitleField()` method to identify title fields
- Only applies word removal to designated title fields
- Supports "next_prayer_begins_title" and "next_prayer_iqamah_title"

### Word Removal Controls
- Provides toggle controls for removing first or second words
- Uses mutually exclusive button_bar control for radio-like behavior
- Includes text control for removing specific words

### Processing Logic
- Applies admin-defined word removal settings
- Supports custom word removal via Breakdance controls
- Handles case-insensitive matching for translations

## Control Definitions

### BreakdanceFieldControls Class
- Manages control definitions for different field types
- Provides `getTitleFieldControls()` for title-specific options
- Uses button_bar control for mutually exclusive options

### Control Types Used
- **button_bar**: For mutually exclusive word removal options
- **text**: For specific word removal input
- **toggle**: For on/off options (deprecated in favor of button_bar)

## Asset Integration

### JavaScript Files
- Enqueues necessary JavaScript when Breakdance is active
- Handles frontend functionality for enhanced features
- Ensures compatibility with Breakdance's UI system

### CSS Integration
- Applies styling that integrates with Breakdance's UI
- Maintains visual consistency with Breakdance's design

## Security Considerations

### Data Validation
- Validates field keys against allowed values
- Prevents injection of unauthorized data
- Sanitizes all user inputs

### Access Control
- Checks permissions before returning data
- Ensures data is only accessible where appropriate
- Respects WordPress user roles and capabilities

## Troubleshooting

### Common Issues
- Field not appearing: Verify Breakdance is active
- Data not updating: Clear caches and refresh
- Controls not working: Check for JavaScript conflicts

### Debugging Steps
1. Verify Breakdance activation status
2. Check for JavaScript errors in browser console
3. Confirm field registration in Breakdance panel
4. Review data availability in post meta
</content>
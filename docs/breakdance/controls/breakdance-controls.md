# Breakdance Controls Documentation

## Overview

Controls are the fundamental building blocks for configuring elements in the Breakdance builder. They define the user interface for adjusting element properties like content, design, and settings.

## Control Types

### Basic Controls
- **toggle**: Boolean on/off switch
- **text**: Text input field
- **number**: Numeric input field
- **unit**: Number with unit selector (px, em, rem, etc.)
- **dropdown**: Dropdown selection menu
- **button_bar**: Horizontal/vertical button group for radio-like selections

### Advanced Controls
- **section**: Groups related controls together
- **color**: Color picker with various formats
- **shadow**: Box-shadow and text-shadow controls
- **typography**: Font family, size, weight, etc.
- **spacing**: Margin, padding, and positioning controls
- **condition**: Logic-based show/hide controls

## Control Structure

### Basic Control Syntax
```php
control(
    'slug',                    // Unique identifier
    'Label',                   // Display label
    [                         // Options array
        'type' => 'control_type',
        'layout' => 'vertical|inline',  // Layout orientation
        'default' => 'value',   // Default value
    ]
);
```

### Button Bar Example
```php
control('style', 'Style', [
    'type' => 'button_bar',
    'layout' => 'vertical', // Stack buttons vertically
    'items' => [
        '0' => ['text' => 'Tabs', 'value' => 'tabs'],
        '1' => ['text' => 'Pills', 'value' => 'pills'],
        '2' => ['text' => 'Bar', 'value' => 'bar'],
    ],
]),
```

## Layout Options

### Vertical vs Inline
- **vertical**: Controls stack in a column
- **inline**: Controls appear side by side

## Conditions

Controls can be conditionally shown/hidden based on other control values:

```php
'condition' => [
    'path' => '%%CURRENTPATH%%.some_control',  // Reference path
    'operand' => 'equals|not equals|is set|is not set',  // Comparison operator
    'value' => 'target_value',  // Value to compare against
]
```

## Common Properties

### Control Properties
- **slug**: Unique identifier for the control
- **label**: Display text for the control
- **type**: Control type (toggle, text, etc.)
- **defaultValue**: Initial value
- **enableMediaQueries**: Whether to enable responsive options
- **enableHover**: Whether to enable hover states

### Options Properties
- **type**: Control type
- **layout**: Orientation (vertical/inline)
- **items**: Array of options for dropdowns/button bars
- **condition**: Conditional logic for showing/hiding
</content>
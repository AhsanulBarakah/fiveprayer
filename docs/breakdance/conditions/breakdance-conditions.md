# Breakdance Conditions Documentation

## Overview

Conditions in Breakdance allow controlling the visibility of controls and elements based on certain criteria. They provide dynamic UI behavior based on user selections and site data.

## Condition System

### Purpose
- Show/hide controls based on other control values
- Conditionally display elements based on visitor context
- Enable advanced configuration workflows

## Control Conditions

### Basic Structure
```php
'condition' => [
    'path' => 'path.to.control',     // Path to the control to check
    'operand' => 'equals',           // Comparison operator
    'value' => 'target_value'        // Value to compare against
]
```

### Path Format
- Use `%%CURRENTPATH%%` for relative paths within the same element
- Full paths follow the format: `attributes.control_name` or `settings.section.control_name`
- Paths are dot-separated property chains

## Operand Types

### Equality Operators
- **`equals`**: Value equals the target
- **`not equals`**: Value does not equal the target

### Existence Operators
- **`is set`**: Value exists and is not empty/null
- **`is not set`**: Value is empty or null

### Membership Operators
- **`is one of`**: Value is in the provided list
- **`is none of`**: Value is not in the provided list

### String Operators
- **`includes`**: Value contains the target string
- **`contains`**: Alias for includes
- **`does not contain`**: Value does not contain the target string

## Implementation Examples

### Simple Visibility Condition
```php
[
    'slug' => 'secondary_text',
    'type' => 'text',
    'label' => 'Secondary Text',
    'options' => [
        'type' => 'text',
        'condition' => [
            'path' => '%%CURRENTPATH%%.enable_secondary_text',
            'operand' => 'equals',
            'value' => true,
        ]
    ]
]
```

### Multiple Conditions
```php
'options' => [
    'type' => 'unit',
    'condition' => [
        '0' => [
            '0' => [
                'path' => '%%CURRENTPATH%%.position',
                'operand' => 'not equals',
                'value' => 'inherit'
            ]
        ]
    ]
]
```

## Element Display Conditions

### Context-Based Conditions
- **Post Type**: Show based on current post type
- **User Role**: Show based on visitor's user role
- **Date/Time**: Show based on current date/time
- **Visitor State**: Show based on login status, referrer, etc.
- **Session/View Counts**: Show based on visit frequency

### Condition Builder
- Visual interface for creating complex condition rules
- Supports AND/OR logic combinations
- Multiple rule groups with different operators

## Condition Properties

### Basic Properties
- **path**: Property path to evaluate
- **operand**: Comparison operator
- **value**: Target value for comparison

### Advanced Properties
- **rules**: Multiple conditions combined with logic operators
- **groups**: Organized collections of related conditions

## Common Use Cases

### Control Dependency
- Advanced options shown only when "Advanced" toggle is on
- Specific styling options shown only for certain element types
- Responsive controls shown only when responsive features are enabled

### Contextual Display
- Different header layouts for different post types
- Special elements shown only to logged-in users
- Seasonal content displayed based on calendar dates

## Best Practices

### Performance
- Minimize complex condition chains
- Use simple conditions when possible
- Avoid deeply nested conditionals

### Usability
- Group related controls under common conditions
- Use clear, descriptive labels for conditional controls
- Provide sensible defaults when conditions are not met

### Maintenance
- Document complex conditional logic
- Use consistent naming patterns for conditional controls
- Test all conditional paths during development
</content>
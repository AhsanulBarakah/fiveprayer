# How to Add Elements to Breakdance

## Overview
This guide explains how to add custom elements to the Breakdance page builder. It covers the complete process from creating element files to registering them with Breakdance.

## Prerequisites

### Required Knowledge
- PHP programming skills
- Understanding of WordPress plugin development
- Familiarity with Breakdance's element structure

### Required Components
- Breakdance page builder installed and activated
- Basic understanding of Twig templating
- Knowledge of CSS and JavaScript for frontend functionality

## Element Structure

### Required Files
Each Breakdance element requires the following files:

```
elements/
└── ElementName/
    ├── element.php          # Main element class
    ├── html.twig            # HTML template
    ├── css.twig             # Dynamic CSS template
    ├── default.css          # Default styling
    └── ssr.php              # Server-side rendering (optional)
```

### Element Class Structure
The main element file (`element.php`) must extend `\Breakdance\Elements\Element` and implement required methods:

```php
<?php

namespace YourNamespace\Elements;

use function Breakdance\Elements\c;
use function Breakdance\Elements\controlSection;

\Breakdance\ElementStudio\registerElementForEditing(
    "YourNamespace\\Elements\\ElementName",
    \Breakdance\Util\getDirectoryPathRelativeToPluginFolder(__DIR__)
);

class ElementName extends \Breakdance\Elements\Element
{
    static function uiIcon()
    {
        return 'Generic'; // Icon for the element
    }

    static function tag()
    {
        return 'div'; // HTML tag for the element
    }

    static function name()
    {
        return 'Element Display Name';
    }

    static function className()
    {
        return 'your-element-class';
    }

    static function category()
    {
        return 'your-category'; // Category slug
    }

    static function template()
    {
        return file_get_contents(__DIR__ . '/html.twig');
    }

    static function defaultCss()
    {
        return file_get_contents(__DIR__ . '/default.css');
    }

    static function cssTemplate()
    {
        return file_get_contents(__DIR__ . '/css.twig');
    }

    static function designControls()
    {
        // Return design control sections
    }

    static function contentControls()
    {
        // Return content control sections
    }

    static function settingsControls()
    {
        // Return settings control sections
    }

    // Additional required methods...
}
```

## Element Registration

### Register Save Location
To allow Breakdance to discover your elements automatically, register a save location in your main plugin file:

```php
function your_plugin_initialize_breakdance_elements() {
    // Register the custom category
    if (class_exists('\Breakdance\Elements\ElementCategoriesController')) {
        \Breakdance\Elements\ElementCategoriesController::getInstance()
            ->registerCategory('your-category', 'Your Category Name');
    }

    // Register save location for element discovery
    if (class_exists('\Breakdance\ElementStudio')) {
        \Breakdance\ElementStudio\registerSaveLocation(
            \Breakdance\Util\getDirectoryPathRelativeToPluginFolder(plugin_dir_path(__FILE__)) . 'path/to/elements',
            'YourPluginElements',
            'element',
            'Your Plugin Elements',
            false
        );
    }
}

add_action('breakdance_loaded', 'your_plugin_initialize_breakdance_elements', 9);
```

### Manual Registration (Alternative)
If you prefer to register elements individually:

```php
function your_plugin_register_elements() {
    $element_classes = [
        'YourNamespace\Elements\ElementOne',
        'YourNamespace\Elements\ElementTwo',
        // Add more element classes as needed
    ];

    foreach ($element_classes as $element_class) {
        $element_file = plugin_dir_path(__FILE__) . 'path/to/elements/' . substr(strrchr($element_class, '\\'), 1) . '/element.php';
        
        if (file_exists($element_file) && !class_exists($element_class)) {
            require_once $element_file;
        }

        if (class_exists($element_class)) {
            \Breakdance\ElementStudio\registerElementForEditing(
                $element_class,
                \Breakdance\Util\getDirectoryPathRelativeToPluginFolder(dirname($element_file))
            );
        }
    }
}
```

## Template Files

### HTML Template (html.twig)
The HTML template uses Twig syntax with Breakdance-specific variables:

```twig
<div class="{{ '%%CLASSES%%' }}" {{ '%%ATTRIBUTES%%' }} {{ '%%PSEUDO_SELECTOR_CLASSES%%' }}>
    <h3>{{ properties.content.title.text }}</h3>
    <p>{{ properties.content.description.text }}</p>
</div>
```

### CSS Template (css.twig)
The CSS template allows dynamic styling based on element properties:

```twig
{{ '%%SELECTOR%%' }} {
    background-color: {{ '{{properties.design.style.background_color}}' ?: '#ffffff' }};
    padding: {{ '{{properties.design.style.padding}}' ?: '10px' }}px;
}
```

### Default CSS (default.css)
Provides default styling for the element:

```css
.your-element-class {
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 5px;
}
```

## Control Sections

### Content Controls
Define controls for content-related settings:

```php
static function contentControls()
{
    return [
        controlSection(
            "content_section",
            "Content Settings",
            [
                c(
                    "title",
                    "Title",
                    [],
                    ['type' => 'text', 'layout' => 'vertical'],
                    false,
                    false,
                    [],
                ),
                c(
                    "description",
                    "Description",
                    [],
                    ['type' => 'textarea', 'layout' => 'vertical'],
                    false,
                    false,
                    [],
                ),
            ]
        )
    ];
}
```

### Design Controls
Define controls for design-related settings:

```php
static function designControls()
{
    return [
        controlSection(
            "style_section",
            "Styling",
            [
                c(
                    "background_color",
                    "Background Color",
                    [],
                    ['type' => 'color', 'layout' => 'vertical'],
                    false,
                    false,
                    [],
                ),
                c(
                    "padding",
                    "Padding",
                    [],
                    [
                        'type' => 'unit',
                        'layout' => 'vertical',
                        'unitOptions' => [
                            'types' => ['px', '%', 'em', 'rem'],
                            'defaultType' => 'px',
                        ],
                    ],
                    false,
                    false,
                    [],
                ),
            ]
        )
    ];
}
```

## Best Practices

### Naming Conventions
- Use PascalCase for element class names
- Use lowercase with hyphens for category slugs
- Use descriptive names for properties and controls

### File Organization
- Keep all element files in a dedicated `elements` directory
- Organize elements in subdirectories by feature or type
- Use consistent file naming conventions

### Performance Considerations
- Minimize external dependencies
- Use efficient queries when retrieving data
- Implement proper caching where appropriate

### Security
- Sanitize all user inputs
- Validate all data before processing
- Follow WordPress coding standards

## Troubleshooting

### Elements Not Appearing
- Verify that the save location is registered correctly
- Check that the category is registered before elements
- Ensure element files are in the correct directory structure
- Confirm that Breakdance is activated

### Controls Not Working
- Verify that property paths are correct
- Check that control IDs are unique
- Ensure proper data types are specified

### Styling Issues
- Verify CSS selectors are properly formatted
- Check that dynamic properties are correctly referenced
- Test in different Breakdance contexts

## Advanced Features

### Server-Side Rendering
For complex elements, implement server-side rendering:

```php
static function ssr($propertiesData, $parentPropertiesData = [], $isBuilder = false, $repeaterItemNodeId = null)
{
    return [
        'html' => '<div>Your rendered HTML</div>',
        'css' => '.your-class { color: red; }'
    ];
}
```

### Dependencies
Add JavaScript dependencies for interactive elements:

```php
static function dependencies()
{
    return [
        '0' => [
            'scripts' => [plugin_dir_url(__FILE__) . 'assets/js/element-script.js'],
            'inlineScripts' => [
                'console.log("Element loaded");'
            ],
        ],
    ];
}
```

## Testing Checklist

- [ ] Element appears in Breakdance editor
- [ ] Element appears in correct category
- [ ] All controls function properly
- [ ] Element renders correctly on frontend
- [ ] Responsive behavior works as expected
- [ ] Dynamic properties update correctly
- [ ] No JavaScript errors in console
- [ ] Styling options work properly
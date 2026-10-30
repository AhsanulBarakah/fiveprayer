# Element Templates Guide

## Overview
This guide provides templates and examples for creating Breakdance elements. Use these templates as starting points for your custom elements.

## Basic Element Template

### element.php
```php
<?php

namespace YourNamespace\Elements;

use function Breakdance\Elements\c;
use function Breakdance\Elements\controlSection;

\Breakdance\ElementStudio\registerElementForEditing(
    "YourNamespace\\Elements\\YourElementName",
    \Breakdance\Util\getDirectoryPathRelativeToPluginFolder(__DIR__)
);

class YourElementName extends \Breakdance\Elements\Element
{
    static function uiIcon()
    {
        return 'Generic';
    }

    static function tag()
    {
        return 'div';
    }

    static function tagOptions()
    {
        return [];
    }

    static function tagControlPath()
    {
        return false;
    }

    static function name()
    {
        return 'Your Element Name';
    }

    static function className()
    {
        return 'your-element-class';
    }

    static function category()
    {
        return 'your-category';
    }

    static function badge()
    {
        return false;
    }

    static function slug()
    {
        return __CLASS__;
    }

    static function template()
    {
        return file_get_contents(__DIR__ . '/html.twig');
    }

    static function defaultCss()
    {
        return file_get_contents(__DIR__ . '/default.css');
    }

    static function defaultProperties()
    {
        return false;
    }

    static function defaultChildren()
    {
        return false;
    }

    static function cssTemplate()
    {
        return file_get_contents(__DIR__ . '/css.twig');
    }

    static function designControls()
    {
        return [
            controlSection(
                "section_name",
                "Section Title",
                [
                    c(
                        "property_name",
                        "Property Label",
                        [],
                        ['type' => 'text', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                ]
            )
        ];
    }

    static function contentControls()
    {
        return [
            controlSection(
                "content_section",
                "Content Settings",
                [
                    c(
                        "content_property",
                        "Content Property",
                        [],
                        ['type' => 'text', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                ]
            )
        ];
    }

    static function settingsControls()
    {
        return [];
    }

    static function dependencies()
    {
        return false;
    }

    static function settings()
    {
        return ['shareStateWithChildSSR' => true, 'bypassPointerEvents' => false];
    }

    static function addPanelRules()
    {
        return ['alwaysHide' => false];
    }

    static public function actions()
    {
        return false;
    }

    static function nestingRule()
    {
        return ['type' => 'final'];
    }

    static function spacingBars()
    {
        return false;
    }

    static function attributes()
    {
        return false;
    }

    static function experimental()
    {
        return false;
    }

    static function availableIn()
    {
        return ['oxygen', 'breakdance'];
    }

    static function order()
    {
        return 100;
    }

    static function dynamicPropertyPaths()
    {
        return false;
    }

    static function additionalClasses()
    {
        return false;
    }

    static function projectManagement()
    {
        return false;
    }

    static function propertyPathsToWhitelistInFlatProps()
    {
        return false;
    }

    static function propertyPathsToSsrElementWhenValueChanges()
    {
        return ['none'];
    }
}
```

## Template Files

### html.twig
```twig
<div class="{{ '%%CLASSES%%' }}" {{ '%%ATTRIBUTES%%' }} {{ '%%PSEUDO_SELECTOR_CLASSES%%' }}>
    <div class="your-element-wrapper">
        {{ properties.content.your_property }}
    </div>
</div>
```

### default.css
```css
.your-element-class {
    padding: 20px;
    background-color: #f9f9f9;
    border-radius: 5px;
}
```

### css.twig
```twig
{{ '%%SELECTOR%%' }} {
    background-color: {{ '{{properties.design.style.background_color}}' ?: '#f9f9f9' }};
    padding: {{ '{{properties.design.style.padding}}' ?: '20px' }};
}
```

## Advanced Control Templates

### Color Picker Control
```php
c(
    "color_property",
    "Color Property",
    [],
    ['type' => 'color', 'layout' => 'vertical'],
    false,
    false,
    [],
)
```

### Unit Control (with multiple units)
```php
c(
    "dimension_property",
    "Dimension Property",
    [],
    [
        'type' => 'unit',
        'layout' => 'vertical',
        'unitOptions' => [
            'types' => ['px', '%', 'em', 'rem'],
            'defaultType' => 'px',
        ],
        'rangeOptions' => [
            'min' => 0,
            'max' => 500,
            'step' => 1,
        ],
    ],
    false,
    false,
    [],
)
```

### Toggle Control
```php
c(
    "toggle_property",
    "Toggle Property",
    [],
    ['type' => 'toggle', 'layout' => 'vertical'],
    false,
    false,
    [],
)
```

### Dropdown Control
```php
c(
    "dropdown_property",
    "Dropdown Property",
    [],
    [
        'type' => 'dropdown',
        'layout' => 'vertical',
        'items' => [
            ['text' => 'Option 1', 'value' => 'option1'],
            ['text' => 'Option 2', 'value' => 'option2'],
            ['text' => 'Option 3', 'value' => 'option3'],
        ],
    ],
    false,
    false,
    [],
)
```

### Button Bar Control
```php
c(
    "button_bar_property",
    "Button Bar Property",
    [],
    [
        'type' => 'button_bar',
        'layout' => 'vertical',
        'items' => [
            ['text' => 'Left', 'value' => 'left'],
            ['text' => 'Center', 'value' => 'center'],
            ['text' => 'Right', 'value' => 'right'],
        ],
    ],
    false,
    false,
    [],
)
```

## Conditional Controls

### Control with Condition
```php
c(
    "conditional_property",
    "Conditional Property",
    [],
    ['type' => 'text', 'layout' => 'vertical'],
    false,
    false,
    [
        'condition' => [
            'path' => '%%CURRENTPATH%%.some_parent_property',
            'operand' => 'equals',
            'value' => 'enabled'
        ]
    ],
)
```

### Section with Condition
```php
controlSection(
    "conditional_section",
    "Conditional Section",
    [
        // Controls here
    ],
    [
        'type' => 'section',
        'sectionOptions' => ['type' => 'popout'],
        'layout' => 'vertical',
        'condition' => [
            'path' => '%%CURRENTPATH%%.enable_advanced_options',
            'operand' => 'equals',
            'value' => 'true'
        ]
    ]
)
```

## Complete Element Example

### Advanced Element with Multiple Controls
```php
static function designControls()
{
    return [
        controlSection(
            "styling",
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
                    "text_color",
                    "Text Color",
                    [],
                    ['type' => 'color', 'layout' => 'vertical'],
                    false,
                    false,
                    [],
                ),
                c(
                    "border_radius",
                    "Border Radius",
                    [],
                    [
                        'type' => 'unit',
                        'layout' => 'vertical',
                        'unitOptions' => [
                            'types' => ['px', '%', 'em', 'rem'],
                            'defaultType' => 'px',
                        ],
                        'rangeOptions' => [
                            'min' => 0,
                            'max' => 50,
                            'step' => 1,
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

static function contentControls()
{
    return [
        controlSection(
            "content_settings",
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
                c(
                    "show_icon",
                    "Show Icon",
                    [],
                    ['type' => 'toggle', 'layout' => 'vertical'],
                    false,
                    false,
                    [],
                ),
            ]
        )
    ];
}
```

## File Structure Template

```
elements/
└── YourElementName/
    ├── element.php          # Main element class
    ├── html.twig            # HTML template
    ├── css.twig             # Dynamic CSS template
    ├── default.css          # Default styling
    ├── ssr.php              # Server-side rendering (optional)
    └── assets/
        ├── js/
        │   └── your-element-script.js
        └── css/
            └── your-element-styles.css
```

## Tips and Tricks

### Property Path References
- Use `%%CURRENTPATH%%` to reference the current control path
- Access nested properties with dot notation: `properties.section.property`
- Use `{{variable}}` syntax in Twig templates to access properties

### Dynamic Content
- Properties can be accessed dynamically in templates
- Use conditional logic in Twig templates
- Reference other elements' properties when needed

### Performance Optimization
- Keep templates lightweight
- Use efficient CSS selectors
- Minimize external dependencies
- Implement proper caching strategies
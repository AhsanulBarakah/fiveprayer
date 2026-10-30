# Shared Element Integration Control

## Common `availableIn()` Method

Both Oxygen and Breakdance integrations use the same `availableIn()` method to control element visibility in page builders:

```php
static function availableIn()
{
    // Check both Oxygen and Breakdance - only show if both integrations are enabled
    // By default, both are disabled which hides the element from both builders
    $oxygen_enabled = defined('OXYGEN_VERSION') && apply_filters('fiveprayer_enable_oxygen_integration', false);
    $breakdance_enabled = apply_filters('fiveprayer_enable_breakdance_integration', false);

    $available_in = [];

    if ($oxygen_enabled) {
        $available_in[] = 'oxygen';
    }

    if ($breakdance_enabled) {
        $available_in[] = 'breakdance';
    }

    // By default both filters return false, so the element will be hidden from both builders
    return $available_in;
}
```

This method checks both Oxygen and Breakdance integration filters and only makes the element available in a page builder if its respective integration is enabled.

## How It Works

1. The method checks if Oxygen is active and if the oxygen integration filter allows it
2. The method checks if Breakdance is active and if the breakdance integration filter allows it
3. The element is added to the available platforms based on these checks
4. By default, both filters return false, hiding elements from both builders
# Breakdance Builder Integration Control

## Hiding FivePrayer Category from Breakdance

We have hidden the entire FivePrayer category from Breakdance Builder to prevent conflicts and ensure proper functionality.

## Technical Implementation

The Breakdance integration is controlled by a filter in `Fiveprayer.php`:

```php
add_filter('fiveprayer_enable_breakdance_integration', function($enabled) {
    // Breakdance integration is disabled by default
    // Set to true to enable FivePrayer elements in Breakdance
    return false; // Disable Breakdance integration to hide FivePrayer category
});
```

To re-enable Breakdance support, change the return value from `false` to `true`.

## Element-Level Control

Each Breakdance element checks these filters in their `availableIn()` method. For details about the common implementation, see [Shared Element Integration Control](../common/element-availability-control.md).

## Re-enabling Breakdance Integration

To re-enable Breakdance integration:

1. Edit the filter in `Fiveprayer.php`
2. Change the return value from `false` to `true` for the breakdance integration
3. Breakdance: `return true;` in the `fiveprayer_enable_breakdance_integration` filter

## Status
- ✅ FivePrayer elements hidden from Breakdance Builder
- ✅ Easy to re-enable when ready
# FivePrayer CSS Fixes Documentation

## Overview
This document documents all CSS fixes applied to resolve styling issues between development and production servers for the FivePrayer WordPress plugin.

## Date of Fixes
December 20, 2025

---

## Issue 1: CSS Not Loading in Production

### Problem
- CSS was registered but never enqueued
- Styles worked in development but not in production
- Inconsistent loading across different server environments

### Root Cause
- `fiveprayer-default-style` was only registered using `wp_register_style()` but never actually enqueued with `wp_enqueue_style()`
- Multiple conflicting CSS loading systems
- No cache-busting mechanism

### Files Modified
- `php/classes/Core/initRegister.php`

### Changes Made

#### 1. Added Conditional CSS Enqueuing
```php
// Enqueue the style when shortcodes are present
add_action('wp_enqueue_scripts', function() use ($css_path) {
    global $post;
    if (is_a($post, 'WP_Post') && (
        has_shortcode($post->post_content, 'Fp_Vertical_Daily_Prayer') ||
        has_shortcode($post->post_content, 'fiveprayer_timetable') ||
        has_shortcode($post->post_content, 'FP_Dairy_Prayer') ||
        has_shortcode($post->post_content, 'fiveprayer_single_prayer')
    )) {
        wp_enqueue_style('fiveprayer-default-style');
        error_log('FivePrayer: Enqueued styles for shortcode page');
        
        // Force cache refresh for CSS by adding version parameter
        $version = filemtime($css_path) . '-' . get_option('fiveprayer_style_version', '1');
        wp_style_add_data('fiveprayer-default-style', 'version', $version);
    }
});
```

#### 2. Added Cache Management
```php
public function clearStyleCache() {
    // Update style version to force cache refresh
    update_option('fiveprayer_style_version', time());
    if (defined('WP_DEBUG') && WP_DEBUG) {
        error_log('FivePrayer: Cleared style cache');
    }
}

// Added to constructor
add_action('update_option_fiveprayer_settings', [$this, 'clearStyleCache']);
add_action('update_option_fiveprayer_style_settings', [$this, 'clearStyleCache']);
```

#### 3. Standardized Style Loading
- `php/classes/Core/ShortCodes/ShortCodeVerticalDailyPrayer.php`
- Changed from `wp_enqueue_style('fiveprayer-daily')` to `wp_enqueue_style('fiveprayer-default-style')`

---

## Issue 2: Missing .next-prayer-notice Styles

### Problem
- `.next-prayer-notice` CSS was only defined in `DailyStyleDynamic.php` within print media query
- Styles were not applied in screen display mode
- Inconsistent styling across environments

### Root Cause
- CSS was only available in print mode, not for normal screen display
- Missing from main stylesheet that gets loaded on all pages

### Files Modified
- `php/classes/Core/ShortCodes/css/prayer-styles.css`

### Changes Made

#### 1. Added to Print Media Query (lines 76-80)
```css
.next-prayer-notice {
    display: flex !important;
    gap: 8px !important;
    justify-content: center !important;
}
```

#### 2. Added to Screen Media Query (lines 358-362)
```css
.next-prayer-notice {
    display: flex;
    gap: 8px;
    justify-content: center;
}
```

---

## Issue 3: Missing Odd/Even Styling for Vertical Table

### Problem
- `.fiveprayer__DairyPrayer_` (vertical table) had no odd/even row styling
- Only `.fiveprayer__printer` (horizontal timetable) had odd/even styling
- Vertical table appeared with uniform row colors

### Root Cause
- CSS selectors only targeted horizontal table class
- Missing selectors for vertical table class

### Files Modified
- `php/classes/Core/ShortCodes/css/prayer-styles.css`

### Changes Made

#### 1. Added to Print Media Query (lines 142-150)
```css
.fiveprayer__DairyPrayer_ tbody tr:nth-child(even) {
    background-color: var(--bg-even) !important;
    color: var(--clr-even) !important;
}

.fiveprayer__DairyPrayer_ tbody tr:nth-child(odd) {
    background-color: var(--fiveprayer-bg-odd) !important;
    color: var(--clr-odd) !important;
}
```

#### 2. Added to Screen Media Query (lines 310-318)
```css
.fiveprayer__DairyPrayer_ tbody tr:nth-child(even) {
    background-color: var(--bg-even);
    color: var(--clr-even);
}

.fiveprayer__DairyPrayer_ tbody tr:nth-child(odd) {
    background-color: var(--fiveprayer-bg-odd);
    color: var(--clr-odd);
}
```

---

## Key CSS Variables Used
- `--bg-even`: Background color for even rows
- `--clr-even`: Text color for even rows
- `--fiveprayer-bg-odd`: Background color for odd rows
- `--clr-odd`: Text color for odd rows
- `--bg-highlight`: Background color for highlighted rows
- `--clr-highlight`: Text color for highlighted rows

---

## Testing Recommendations

### After Future Updates
1. Test both horizontal and vertical tables
2. Verify odd/even row coloring
3. Check `.next-prayer-notice` styling
4. Test in both screen and print modes
5. Verify across different server environments

### Cache Testing
1. Update plugin settings to trigger cache clear
2. Verify CSS changes are reflected immediately
3. Test with browser caching disabled
4. Test with CDN/caching plugins enabled

---

## Prevention Tips

### For Future CSS Changes
1. Always add styles to both print and screen media queries
2. Include selectors for both `.fiveprayer__printer` (horizontal) and `.fiveprayer__DairyPrayer_` (vertical)
3. Use CSS variables for dynamic colors
4. Test cache invalidation when making style changes

### For Development vs Production
1. The CSS loading system now handles both environments consistently
2. Cache-busting ensures changes propagate immediately
3. Conditional enqueuing prevents unnecessary loading on pages without shortcodes

---

## Summary
These fixes ensure that:
- CSS loads consistently across all server environments
- Both horizontal and vertical tables have proper styling
- Dynamic colors work correctly
- Cache issues are automatically handled
- Print and screen modes both display correctly

The plugin should now work identically in development and production environments.

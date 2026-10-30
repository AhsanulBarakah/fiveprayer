# FivePrayer Cache Fixes Documentation

## Overview
This document outlines the cache-related fixes implemented to resolve issues with Hijri date display and translation updates not reflecting immediately on the frontend.

## Issues Addressed

### 1. Hijri Date Not Updating on Frontend
- **Problem**: Hijri date showed correctly in editor but not on frontend
- **Root Cause**: AJAX handler for `load_shortcode` action was missing, causing JavaScript to fail to update Hijri date
- **Solution**: Added missing AJAX handler and ensured proper cache invalidation

### 2. Translation Changes Not Reflecting Immediately
- **Problem**: When translation settings were changed, updates didn't appear until cache was manually cleared
- **Root Cause**: Multiple caching layers weren't being properly invalidated when settings changed
- **Solution**: Enhanced cache invalidation across all relevant components

### 3. Calendar Data Stale After Translation Updates
- **Problem**: Monthly calendar didn't update with new translations until month selection changed
- **Root Cause**: CalendarGenerator maintained internal cache that wasn't being cleared
- **Solution**: Added cache clearing mechanism for CalendarGenerator's internal data

## Files Modified

### 1. `php/classes/core/Shortcodes.php`
- Added AJAX handler registration for `load_shortcode` action
- Enhanced `maybe_purge_fragment_cache()` to monitor additional translation-related settings:
  - `gregorian_months`
  - `gregorian_numbers`
  - `hijra_months`
  - `hijra_numbers`
- Added cache invalidation to AJAX handlers

### 2. `php/classes/core/helpers/PrayerDataCache.php`
- Enhanced `invalidateAll()` method to:
  - Delete shortcode fragment caches (`_transient_fp_%`)
  - Clear Hijri date cache (`fiveprayer_hijri_date`)
  - Improve overall cache clearing efficiency
- Added connection to cache clearing action for CalendarGenerator

### 3. `php/classes/core/Calendar/CalendarGenerator.php`
- Added `clearInternalCache()` method to clear `$timeTable` property
- Connected to cache clearing action (`fiveprayer_clear_calendar_generator_cache`)

### 4. `php/classes/core/controllers/api/endpoints/PrayerSettingsMetaController.php`
- Added cache invalidation to `load_timetable` AJAX handler
- Enhanced `store_settings` to trigger shortcode cache clearing

### 5. `php/classes/core/Assets/JS/hijri-date-updater.js`
- Fixed initialization condition to check for `window.fiveprayer_dynamic` instead of `window.fiveprayer_ajax`
- Updated AJAX URL reference to use correct variable

## Technical Details

### Cache Invalidation Chain
When translation settings are updated:
1. `PrayerSettingsMetaController::store_settings()` calls `PrayerDataCache::invalidateAll()`
2. `PrayerDataCache::invalidateAll()` clears all caches and triggers `fiveprayer_clear_calendar_generator_cache` action
3. `CalendarGenerator` receives the action and clears its internal `$timeTable` cache
4. All shortcode caches are cleared via `maybe_purge_fragment_cache()`

### AJAX Handler Flow
For Hijri date updates:
1. JavaScript calls `load_shortcode` action with `sc=Fp_Single_Hijra_Date`
2. New AJAX handler invalidates caches and creates fresh shortcode instance
3. Returns updated Hijri date to frontend

## Testing Recommendations

After implementing these changes:
1. Update translation settings and verify immediate reflection on frontend
2. Test Hijri date display on both frontend and in editor
3. Verify calendar updates with new translations without manual cache clearing
4. Ensure all existing functionality remains intact

## Known Limitations

- Changes require plugin cache to be cleared once after implementation
- External caching plugins (e.g., W3 Total Cache, WP Rocket) may still require specific handling
- High-traffic sites may experience slightly increased load due to more frequent cache regeneration

## Rollback Information

If issues arise:
- Backup copies of original files should be maintained
- Changes are isolated to cache handling and AJAX functionality
- Core business logic remains unchanged
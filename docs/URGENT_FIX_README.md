# URGENT FIX: Current Time & Hide Button Issues

## Problems Fixed

### 1. ✅ Current Time Display Broken
**Problem:** Current time showed as "0,1,2,3,4,5,6,7,8,9:0,1,2,3..." instead of "2:30 PM"

**Cause:** The `gregorian_numbers` database entries were corrupted or missing

**Solution:** Restored correct gregorian_numbers data

### 2. ✅ Month Selector Hidden with Printer Button
**Problem:** When hiding printer button, the month selection dropdown was also hidden

**Cause:** Incorrect CSS scoping - the entire form was being hidden

**Solution:** Only hide the button element, keep month selector visible

## CRITICAL: Run This Fix Now

**Access this URL immediately:**
```
http://yoursite.local/wp-content/plugins/fiveprayer/fix-critical-database.php
```

This script will:
1. **Restore gregorian_numbers** - Fixes current time display
2. **Add Printer Button Text** - Ensures printer button text works
3. **Preserve existing data** - Won't delete your other settings

## What Was Changed

### PHP Files (Backend)
- ✅ `CalendarTemplateOutside.php` - Only hides button, not month selector
- ✅ `CalendarTemplateInside.php` - Only hides button, not month selector
- ✅ `PrinterHelper.php` - Helper functions (unchanged)
- ✅ `fix-critical-database.php` - **NEW - RUN THIS NOW**

### React Files (Frontend)
- ✅ `storeLocation.ts` - Added hidePrinterButton state
- ✅ `HidePrinterButtonSettings.tsx` - Toggle component
- ✅ `DisplaySettingsPage.tsx` - Added toggle to UI
- ✅ `usePostControlFromUI.ts` - Added update function

## After Running the Fix

### Step 1: Verify Current Time
1. Visit a page with current time display
2. Should show normal time like "2:30 PM" NOT "0,1,2,3..."
3. If still broken, clear ALL caches and hard refresh (Ctrl+F5)

### Step 2: Test Hide Button
1. Go to FivePrayer → More → Display Settings
2. Toggle "Hide Printer Timetable Button"
3. Visit calendar page:
   - Month selector should be VISIBLE ✓
   - Printer button should be HIDDEN ✓

### Step 3: Test Printer Button Text
1. Go to FivePrayer → More → Translations → Extra Info
2. Find "Printer Button Text"
3. Change to custom text like "Print Schedule"
4. Save
5. Check calendar - button should show "Print Schedule"

## Database Changes

### gregorian_numbers (FIXED)
```json
[
  {"original_text": "0", "translated_text": "0", "language_code": "en"},
  {"original_text": "1", "translated_text": "1", "language_code": "en"},
  ...
  {"original_text": "0", "translated_text": "٠", "language_code": "ar"},
  {"original_text": "1", "translated_text": "١", "language_code": "ar"},
  ...
]
```

### extra_info (ADDED)
```json
[
  ...existing entries...,
  {"original_text": "Printer Button Text", "translated_text": "Printer TimeTable", "language_code": "en"},
  {"original_text": "Printer Button Text", "translated_text": "جدول الطباعة", "language_code": "ar"}
]
```

### hide_printer_button (NEW)
```json
true  // or false
```

## Files to Delete After Testing

**For security, delete these fix scripts after confirming everything works:**
- `fix-critical-database.php` ← DELETE AFTER RUNNING
- `PRINTER_BUTTON_IMPLEMENTATION.md` ← Optional (documentation)
- `DATABASE_MERGE_FIX.md` ← Optional (documentation)

## Troubleshooting

### Current Time Still Broken

1. **Clear all caches:**
   - Browser cache (Ctrl+Shift+Delete)
   - WordPress cache plugins
   - Server cache (LiteSpeed, Varnish, etc.)

2. **Check database directly:**
   ```sql
   SELECT value FROM wp_fp_prayer_settings_meta WHERE `meta-key` = 'gregorian_numbers';
   ```
   Should return proper number translations, NOT corrupted data

3. **Check browser console:**
   - Press F12
   - Look for JavaScript errors
   - Check if `fiveprayer-live-time` script is loading

### Month Selector Still Hidden

1. **Hard refresh:** Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

2. **Check CSS:**
   - Right-click on month selector
   - Inspect Element
   - Verify no `display: none` on the select element

3. **Check template:**
   - Verify `CalendarTemplateOutside.php` has the updated code
   - Button should be wrapped in `<?php if (!$hide_printer_button) : ?>`

### Hide Toggle Not Working

1. **Check database:**
   ```sql
   SELECT value FROM wp_fp_prayer_settings_meta WHERE `meta-key` = 'hide_printer_button';
   ```

2. **Check browser console:**
   - Look for errors when toggling
   - Verify API call succeeds

3. **Try deactivating/reactivating plugin**

## Summary

| Issue | Status | Fix |
|-------|--------|-----|
| Current time broken | ✅ FIXED | Run fix-critical-database.php |
| Month selector hidden | ✅ FIXED | Template files updated |
| Printer button text | ✅ WORKING | Uses extra_info database |
| Hide button option | ✅ WORKING | In Display Settings |

## Support

If issues persist after running the fix:
1. Check plugin logs (FivePrayer → Logs)
2. Enable WordPress debug: `define('WP_DEBUG', true);`
3. Check browser console for errors
4. Restore from backup if needed

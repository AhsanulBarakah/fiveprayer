# Printer Button Text & Hide Option - Implementation Summary

## Changes Made

### 1. Printer Button Text from Database (FIXED)

**Files Created:**
- `php/classes/core/helpers/PrinterHelper.php` - Centralized helper for printer functions

**Files Modified:**
- `php/classes/core/Calendar/CalendarTemplateOutside.php` - Uses PrinterHelper
- `php/classes/core/Calendar/CalendarTemplateInside.php` - Uses PrinterHelper
- `php/classes/core/ShortCodes/ShortCodePrinterButton.php` - Uses PrinterHelper

**Result:** Both the calendar printer button and shortcode now use the SAME text from the database (`extra_info` → "Printer Button Text")

### 2. Hide Printer Button Option in Display Settings

**Files Created:**
- `src/admin/components/prayerSetting/HidePrinterButtonSettings.tsx` - Toggle component
- `php/classes/core/helpers/PrinterHelper.php` - Helper function

**Files Modified:**
- `src/admin/components/More/page/DisplaySettingsPage.tsx` - Added toggle to UI
- `src/admin/state/storeLocation.ts` - Added `hidePrinterButton` state
- `src/admin/hooks/usePostControlFromUI.ts` - Added `updateHidePrinterButton` function
- `php/classes/core/Calendar/CalendarTemplateOutside.php` - Checks hide setting
- `php/classes/core/Calendar/CalendarTemplateInside.php` - Checks hide setting

**Result:** New toggle in Display Settings → Table Display Options to hide/show printer button

### 3. Database Fix for Missing Entries

**Files Modified:**
- `php/classes/core/Plugin.php` - Runs merge on EVERY activation
- `php/classes/core/database/SchemaHelper.php` - Always merges (removed version check)

**Fix Script Created:**
- `fix-printer-button-text.php` - Direct fix for missing "Printer Button Text"

## How to Fix & Test

### Step 1: Add Missing Database Entry

**Access this URL in your browser:**
```
http://yoursite.local/wp-content/plugins/fiveprayer/fix-printer-button-text.php
```

This will:
1. Check if "Printer Button Text" exists in database
2. Add it if missing (English + Arabic)
3. Show you the final state

### Step 2: Test Printer Button Text

1. Go to **FivePrayer Admin** → **More** → **Translations** → **Extra Info**
2. Find "Printer Button Text"
3. Change the English text to something like "Print Schedule"
4. Click **Save**
5. Visit a page with the calendar - button should show "Print Schedule"
6. Use shortcode `[Fp_Printer_Button]` - should also show "Print Schedule"

### Step 3: Test Hide Option

1. Go to **FivePrayer Admin** → **More** → **Display Settings**
2. Find "Hide Printer Timetable Button" toggle
3. Enable it
4. Visit a page with the calendar - printer button should be hidden
5. Disable it - button should reappear

### Step 4: Test Shortcode

Create a new page and add:

```
[Fp_Printer_Button]
```

Or with custom options:

```
[Fp_Printer_Button text="Custom Text" show_icon="true"]
```

Or as a link:

```
[Fp_Printer_Button tag="a" text="Print Version"]
```

## Database Structure

The `hide_printer_button` setting is stored in:
- Table: `wp_fp_prayer_settings_meta`
- Meta Key: `hide_printer_button`
- Value: `true` or `false` (boolean as JSON)

The printer button text is stored in:
- Table: `wp_fp_prayer_settings_meta`
- Meta Key: `extra_info`
- Value: JSON array containing "Printer Button Text" entries

## Files Summary

### PHP Files (Backend)
- ✅ `PrinterHelper.php` - NEW
- ✅ `CalendarTemplateOutside.php` - Updated
- ✅ `CalendarTemplateInside.php` - Updated
- ✅ `ShortCodePrinterButton.php` - Updated
- ✅ `Plugin.php` - Updated
- ✅ `SchemaHelper.php` - Updated
- ✅ `fix-printer-button-text.php` - NEW (can delete after use)

### React Files (Frontend)
- ✅ `HidePrinterButtonSettings.tsx` - NEW
- ✅ `DisplaySettingsPage.tsx` - Updated
- ✅ `storeLocation.ts` - Updated
- ✅ `usePostControlFromUI.ts` - Updated

## Troubleshooting

### Button still shows "Printer TimeTable" instead of custom text

1. Run the fix script: `fix-printer-button-text.php`
2. Clear all caches (browser + server)
3. Deactivate and reactivate the plugin
4. Check database directly:
   ```sql
   SELECT value FROM wp_fp_prayer_settings_meta WHERE `meta-key` = 'extra_info';
   ```
5. Verify "Printer Button Text" exists in the JSON

### Hide toggle not working

1. Check browser console for JavaScript errors
2. Verify the toggle saves correctly (check network tab)
3. Check database:
   ```sql
   SELECT value FROM wp_fp_prayer_settings_meta WHERE `meta-key` = 'hide_printer_button';
   ```
4. Should return `true` or `false`

### Shortcode not working

1. Make sure you're using the exact shortcode: `[Fp_Printer_Button]`
2. Check if the page has the print calendar script loaded
3. View page source and search for "fiveprayer-print-calendar"

## Next Steps After Testing

1. **Delete the fix script** (for security):
   - `fix-printer-button-text.php`
   - `test-database-merge.php`
   - `test-add-printer-text.php`

2. **Rebuild React** (if you made frontend changes):
   ```bash
   npm run build
   # or
   pnpm build
   ```

3. **Test on a staging site** before deploying to production

## Support

If you encounter any issues:
1. Check the plugin logs (FivePrayer → Logs)
2. Enable WordPress debug mode
3. Check browser console for JavaScript errors

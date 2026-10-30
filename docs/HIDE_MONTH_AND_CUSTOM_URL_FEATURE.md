# Hide Month Selection & Custom Printer URL Feature

## Overview
This document describes the new features added to the FivePrayer plugin:
1. **Hide Month Selection** - Ability to hide the month selection dropdown from the calendar display
2. **Custom Printer Button URL** - Ability to set a custom URL redirect when clicking the printer timetable button

## Changes Made

### 1. Frontend (React/TypeScript)

#### Store Updates (`src/admin/state/storeLocation.ts`)
- Added `hideMonthSelection: boolean` state
- Added `printerButtonUrl: string` state
- Added `updateHideMonthSelection` action
- Added `updatePrinterButtonUrl` action

#### Hook Updates (`src/admin/hooks/usePostControlFromUI.ts`)
- Added `updateHideMonthSelection()` function - saves hide month selection setting to database
- Added `updatePrinterButtonUrl()` function - saves custom URL setting to database

#### Meta Reading Hook (`src/admin/hooks/useGetMetaPrayerSettings.ts`)
- Added handling for `hide_month_selection` meta key
- Added handling for `printer_button_url` meta key

#### New Components
1. **`HideMonthSelectionSettings.tsx`**
   - Toggle component to show/hide month selection dropdown
   - Located next to Hide Printer Button settings
   - Saves setting to database with meta key `hide_month_selection`

2. **`PrinterButtonUrlSettings.tsx`**
   - Input field to enter custom URL for printer button redirect
   - Saves setting to database with meta key `printer_button_url`
   - Empty URL means default print functionality is used

#### Display Settings Page (`src/admin/components/More/page/DisplaySettingsPage.tsx`)
- Added `HideMonthSelectionSettings` component under "Table Display Options"
- Added new "Printer Button Options" section with `PrinterButtonUrlSettings` component

### 2. Backend (PHP)

#### API Controller (`php/classes/core/controllers/api/endpoints/PrayerSettingsMetaController.php`)
- Added `hide_month_selection` to the list of wanted meta keys returned by API
- Added `printer_button_url` to the list of wanted meta keys returned by API
- Added special handling for `hide_month_selection` boolean storage
- Added special handling for `printer_button_url` string storage

#### PrinterHelper (`php/classes/core/helpers/PrinterHelper.php`)
- Added `shouldHideMonthSelection()` method - checks if month selection should be hidden
- Added `getPrinterButtonUrl()` method - retrieves custom URL from database

#### Calendar Templates
- **`CalendarTemplateOutside.php`**: Updated to conditionally hide month selection dropdown
- **`CalendarTemplateInside.php`**: Updated to conditionally hide month selection dropdown

Both templates now check `hide_month_selection` setting before rendering the month dropdown.

#### Shortcode (`php/classes/core/ShortCodes/ShortCodePrinterButton.php`)
- Added `url` attribute support for shortcode override
- Modified `renderPrinterButton()` to check for custom URL from settings
- If custom URL is set (from settings or attribute), button becomes a link to that URL
- Priority: shortcode `url` attribute > settings URL > default print functionality

## Usage

### Hide Month Selection
1. Go to WordPress Admin → Prayer Settings → Display Settings
2. Under "Table Display Options", find "Hide Month Selection"
3. Toggle the switch to enable/disable
4. When enabled, the month selection dropdown will be hidden from the calendar
5. **The setting is now persisted across page refreshes**

### Custom Printer Button URL
1. Go to WordPress Admin → Prayer Settings → Display Settings
2. Under "Printer Button Options", enter a URL in the input field
3. Click the **Save** button to save the URL
4. When set, clicking the printer timetable button will redirect to this URL
5. Leave empty to use default print functionality
6. **The setting is now persisted across page refreshes**

### Shortcodes

#### Default Print Button
```php
[Fp_Printer_Button]
```
Shows the default print button that triggers the print dialog.

#### Custom URL Button (NEW)
```php
[Fp_Printer_Button_URL]
```
Shows a button that links to the custom URL. **Only displays if a custom URL is saved.** If no URL is set, nothing is shown.

**Usage:**
- Use `[Fp_Printer_Button_URL]` when you want to show only the custom URL button
- Use `[Fp_Printer_Button]` for the default print button
- You can hide one and show the other depending on your needs

#### Shortcode Attributes
Both shortcodes support these attributes:
- `text` - Custom button text
- `class` - Additional CSS class
- `show_icon` - Show/hide icon ("true" or "false")
- `target` - Link target ("_self", "_blank", "_parent", "_top")
- `hide_on_print` - Hide button when printing ("true" or "false")
- `url` - Override the saved URL for this instance only

**Examples:**
```php
// Custom URL button with custom text
[Fp_Printer_Button_URL text="View Calendar"]

// Custom URL button with icon
[Fp_Printer_Button_URL show_icon="true"]

// Override URL for this instance
[Fp_Printer_Button_URL url="https://example.com/calendar"]

// Default print button with custom text
[Fp_Printer_Button text="Print Calendar"]
```

## Database Meta Keys
- `hide_printer_button` - boolean, hides the printer button
- `hide_month_selection` - boolean, hides the month selection dropdown
- `printer_button_url` - string, custom URL for printer button redirect

## Files Modified
1. `src/admin/state/storeLocation.ts`
2. `src/admin/hooks/usePostControlFromUI.ts`
3. `src/admin/hooks/useGetMetaPrayerSettings.ts`
4. `src/admin/components/More/page/DisplaySettingsPage.tsx`
5. `php/classes/core/helpers/PrinterHelper.php`
6. `php/classes/core/Calendar/CalendarTemplateOutside.php`
7. `php/classes/core/Calendar/CalendarTemplateInside.php`
8. `php/classes/core/ShortCodes/ShortCodePrinterButton.php`
9. `php/classes/core/controllers/api/endpoints/PrayerSettingsMetaController.php`

## Files Created
1. `src/admin/components/prayerSetting/HideMonthSelectionSettings.tsx`
2. `src/admin/components/prayerSetting/PrinterButtonUrlSettings.tsx`

## Build Status
✅ Build completed successfully with no errors

## Fix Applied (State Persistence)
The initial implementation had an issue where the `hide_month_selection` and `printer_button_url` settings were not being restored after page refresh. This was fixed by:

1. Adding both meta keys to the `wanted_keys` array in `PrayerSettingsMetaController.php`
2. Adding proper boolean handling for `hide_month_selection` (stored as "1" or "0")
3. Adding proper string handling for `printer_button_url`

Now both settings persist correctly across page refreshes, just like `hide_printer_button`.

## Fix Applied (Custom URL Button Direct Link)
The printer button now correctly redirects to the custom URL when saved:

1. **Calendar Templates Updated**: Both `CalendarTemplateOutside.php` and `CalendarTemplateInside.php` now check for custom URL and render as a link instead of a button
2. **Shortcode Updated**: `ShortCodePrinterButton.php` now renders as a themed button link when custom URL is set
3. **Theme Styling Preserved**: Uses WordPress theme button classes (`wp-element-button`, `wp-block-button__link`) without custom CSS
4. **Behavior**:
   - When custom URL is saved: Button becomes a direct link to that URL (replaces print button)
   - When no custom URL: Button triggers print dialog as before
   - Shortcode `url` attribute overrides saved URL for that instance
5. **Hide Printer Button Setting**: When "Hide Printer Timetable Button" is enabled BUT a custom URL is saved, the custom URL button is still shown (replaces the hidden print button)

## New Shortcode: [Fp_Printer_Button_URL]
A dedicated shortcode that only shows when a custom URL is saved:

- Returns empty string if no URL is set (button is completely hidden)
- Perfect for showing custom URL button separately from print button
- Use alongside `[Fp_Printer_Button]` with the "Hide Printer Timetable Button" setting for full control

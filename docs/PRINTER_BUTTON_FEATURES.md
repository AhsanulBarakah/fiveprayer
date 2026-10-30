# Printer Timetable Button Features

This document explains the new printer timetable button features added to FivePrayer plugin.

## Features Overview

### 1. **Shortcode for Printer Button** - `[Fp_Printer_Button]`

You can now add a printer timetable button anywhere on your website using the shortcode. This allows you to place the print button on different pages as needed.

#### Basic Usage

```
[Fp_Printer_Button]
```

This displays a button with the default translated text "Printer TimeTable".

#### Shortcode Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `text` | (from translation) | Custom button text |
| `class` | (none) | Additional CSS class for styling |
| `show_icon` | `false` | Show/hide icon (`true` or `false`) |
| `icon` | `printer` | Icon type: `printer`, `download`, or `calendar` |
| `tag` | `button` | HTML tag: `button` or `a` (link) |
| `hide_on_print` | `true` | Hide button when printing |
| `target` | `_self` | Link target when using `tag="a"` |

#### Examples

**Default button:**
```
[Fp_Printer_Button]
```

**Custom text:**
```
[Fp_Printer_Button text="Print Schedule"]
```

**With icon:**
```
[Fp_Printer_Button text="Print" show_icon="true"]
```

**As a link:**
```
[Fp_Printer_Button tag="a" text="View Printable Version"]
```

**With custom class for styling:**
```
[Fp_Printer_Button class="my-custom-button" text="Print Timetable"]
```

**With calendar icon:**
```
[Fp_Printer_Button text="Calendar" show_icon="true" icon="calendar"]
```

---

### 2. **Hide/Show Printer Button in Calendar**

The printer button that appears in the monthly calendar can now be hidden using a WordPress filter.

#### Hide the printer button in the calendar

Add this to your theme's `functions.php` file:

```php
add_filter('fiveprayer_hide_printer_button', '__return_true');
```

#### Conditionally hide based on user role

```php
add_filter('fiveprayer_hide_printer_button', function($hide) {
    if (!current_user_can('manage_options')) {
        return true; // Hide for non-admins
    }
    return $hide;
});
```

---

### 3. **Custom Printer Button Text via Translation System**

You can now customize the printer button text through the Extra Info Translations system.

#### How to Set Custom Text

1. Go to **FivePrayer Admin Panel**
2. Navigate to **More** → **Translations** → **Extra Info**
3. Select your language
4. Find **"Printer Button Text"** in the list
5. Enter your custom text in the input field
6. Click **Save Changes**

The custom text will be used for:
- The default printer button in the calendar
- The `[Fp_Printer_Button]` shortcode (when no `text` attribute is provided)

#### Default Values

- **English:** "Printer TimeTable"
- **Arabic:** "جدول الطباعة"

---

### 4. **URL-Based Print Trigger**

You can trigger the print dialog by adding a URL parameter. This allows you to create custom links that automatically open the print dialog.

#### How It Works

Add `?fp_print=1` to any page URL that contains the prayer timetable.

**Example:**
```
https://yourmosque.com/prayer-times/?fp_print=1
```

When a user visits this URL, the print dialog will automatically open.

#### Use Cases

**Custom styled link:**
```html
<a href="/prayer-times/?fp_print=1" class="custom-print-link">
    <svg><!-- Your custom icon --></svg>
    <span>Print Prayer Times</span>
</a>
```

**Button with custom design:**
```html
<button onclick="window.location.href='/prayer-times/?fp_print=1'">
    🖨️ Print Schedule
</button>
```

**Menu item:**
Add a menu item with the URL: `/prayer-times/?fp_print=1`

---

## Technical Details

### Files Modified

1. **ShortCodePrinterButton.php** - New shortcode class
2. **CalendarTemplateOutside.php** - Added hide/show filter
3. **CalendarTemplateInside.php** - Added hide/show filter
4. **PrintCalendar.js** - Added URL trigger detection
5. **ExtraInfo.tsx** - Added Printer Button Text mapping
6. **FivePrayer_DatabaseTranslations.php** - Added default translations
7. **prayer-styles.css** - Added button styles

### CSS Classes

- `.fiveprayer-printer-button` - Main button class
- `.fiveprayer-hide-on-print` - Hidden when printing
- `.fiveprayer-printer-icon` - Printer icon SVG
- `.fiveprayer-download-icon` - Download icon SVG
- `.fiveprayer-calendar-icon` - Calendar icon SVG

### JavaScript Functions

- `FP_printTimetable()` - Main print function
- `FP_checkURLForPrintTrigger()` - Checks URL for print parameter
- `FP_attachClickListenerPrinter()` - Attaches click listeners to buttons and links

---

## Troubleshooting

### Print button not showing?

1. Ensure the prayer timetable is loaded on the page
2. Check browser console for JavaScript errors
3. Verify the shortcode is correctly placed

### Custom text not appearing?

1. Go to Extra Info Translations and verify "Printer Button Text" exists
2. Make sure the correct language is selected
3. Save the translations again

### URL trigger not working?

1. Ensure the page contains the prayer timetable
2. Check that the PrintCalendar.js script is loaded
3. Verify the URL parameter is `fp_print=1` (not `fp_print=true`)

### Button styling issues?

1. Check if your theme is overriding button styles
2. Use the `class` attribute to add custom classes
3. Inspect the element to check for CSS conflicts

---

## Support

For issues or questions, please contact the plugin support team or visit the support forum.

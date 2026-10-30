# Installation Guide

## Prerequisites

Before installing the FivePrayer Breakdance integration, ensure you have:

- WordPress installation (version 5.6 or higher)
- PHP 7.4 or higher
- FivePrayer plugin installed and activated
- Breakdance page builder plugin installed and activated (for Breakdance elements)
- Oxygen Builder (optional, for Oxygen compatibility)

## Installation Steps

### Method 1: Direct Plugin Installation
1. Download the FivePrayer plugin ZIP file
2. Navigate to WordPress Admin → Plugins → Add New
3. Click "Upload Plugin" and select the ZIP file
4. Click "Install Now"
5. Activate the plugin

### Method 2: FTP Installation
1. Extract the plugin ZIP file
2. Upload the `fiveprayer` folder to `/wp-content/plugins/` directory
3. Navigate to WordPress Admin → Plugins
4. Find "FivePrayer" and click "Activate"

## Post-Installation Setup

### Breakdance Integration
1. Ensure Breakdance plugin is activated
2. The FivePrayer elements will automatically appear in Breakdance under the "Five Prayer" category
3. No additional configuration required

### Oxygen Builder Integration
1. Ensure Oxygen Builder is activated
2. Dynamic fields will be available in Oxygen's dynamic content system
3. The "Five Prayer" category will appear in Oxygen's element panel

## Verification

After installation:
1. Check that the "Five Prayer" category appears in Breakdance
2. Verify that all Four elements (Times, Countdown, Schedule, Hijri Calendar) are available
3. Test dynamic fields in both Breakdance and Oxygen Builder
4. Confirm no duplicate categories appear in Oxygen Builder

## Troubleshooting

### Elements Not Appearing
- Verify Breakdance is activated
- Check that the plugin files are properly uploaded
- Clear any caching plugins
- Refresh the Breakdance editor

### Duplicate Categories in Oxygen
- This issue has been resolved in the current version
- If experiencing issues, deactivate and reactivate the FivePrayer plugin

### Dynamic Fields Not Working
- Ensure the required page builder plugins are active
- Check for JavaScript errors in browser console
- Verify proper permissions on plugin files
# Database Merge Fix for Plugin Reactivation

## Problem

When deactivating and reactivating the plugin, new default data (like "Printer Button Text" in extra_info) was not being added to the database.

## Root Cause

The merge logic was only running when the **version number changed**. If the plugin version stayed the same, the merge was skipped.

## Solution

Modified `SchemaHelper.php` to **always merge** new default entries with existing data, regardless of version number.

## Key Change in SchemaHelper.php

**BEFORE (insertDefaultSettings):**
```php
if (!$existing_data) {
    // Insert new
} else if ($existing_data->version !== $current_version) {
    // Only merge if version changed - BUG!
}
```

**AFTER (insertDefaultSettings):**
```php
if (!$existing_data) {
    // Insert new
} else {
    // ALWAYS merge, regardless of version - FIXED!
    $merged_value = $this->mergeSettings($existing_value, $value);
    if ($merged_value !== $existing_value) {
        // Update with merged data
    }
}
```

## How It Works Now

### On EVERY Plugin Activation:

1. **Tables missing?** → Create tables + insert all defaults
2. **Tables exist?** → Run merge to add any missing entries

### Merge Process:

```
Existing Data + New Defaults = Merged Data
(User entries preserved)  (Missing entries added)
```

## Example

### Before Reactivation
Database `extra_info` has 2 entries:
- Masjid Name
- Current Location

### New Default Added
FivePrayer_DatabaseTranslations.php now includes:
- Printer Button Text ← NEW!

### After Reactivation
Database `extra_info` now has 3 entries:
- Masjid Name (preserved)
- Current Location (preserved)
- Printer Button Text ← Added automatically!

## Testing

### Option 1: Use Test Script
```
http://yoursite.local/wp-content/plugins/fiveprayer/test-database-merge.php
```
Click "Run Manual Merge" to add missing entries immediately.

### Option 2: Deactivate/Reactivate
1. Deactivate plugin
2. Reactivate plugin  
3. Check database - new entries added automatically

### Option 3: SQL Query
```sql
SELECT value FROM wp_fp_prayer_settings_meta WHERE `meta-key` = 'extra_info';
```
Look for `"original_text": "Printer Button Text"` in results.

## Files Modified

- ✅ `DatabaseInitializer.php` - Runs merge on every activation
- ✅ `SchemaHelper.php` - Always merges (removed version check)

## Important Notes

- **User data is NEVER overwritten** - only missing entries are added
- **Works with any version** - doesn't require version change
- **Automatic** - happens on every plugin activation
- **Safe** - fully backward compatible

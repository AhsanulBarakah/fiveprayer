# FivePrayer Shortcode Cache Compatibility Analysis

## Overview
This document analyzes the FivePrayer plugin's shortcode compatibility with various caching plugins, particularly focusing on LiteSpeed Cache and ESI (Edge Side Includes) nonces for dynamic content.

## Current Caching Implementation

### 1. Shortcode Structure & Dynamic Content Handling
The plugin implements a sophisticated dynamic content loading system:

- **AJAX-based Updates**: Time-sensitive content (current time, next prayer, prayer times) is loaded via AJAX
- **Nonce Protection**: Uses `fiveprayer_dynamic_nonce` for security
- **JavaScript Integration**: Dynamic content loader updates content without page refresh
- **Fallback Support**: Shows initial content while waiting for AJAX updates

### 2. LiteSpeed Cache Integration
The plugin includes specific LiteSpeed Cache compatibility:

```php
// Headers sent to prevent caching of time-sensitive content
header('X-LiteSpeed-Cache-Control: no-cache, max-age=0');
header('X-LiteSpeed-Tag: none');
header('X-LiteSpeed-Vary: none');
```

### 3. ESI Request Detection
```php
function fiveprayer_is_esi_request() {
    return isset($_SERVER['HTTP_X_LITESPEED_ESI']) || (isset($_GET['esi']) && $_GET['esi'] === '1');
}
```

## Shortcode-Specific Analysis

### Single Prayer Shortcodes (`[Fp_Single_*]`)
- ✅ **Current Time**: Implemented with live JavaScript updates and fallback content
- ✅ **Next Prayer**: Dynamically calculated and updated via AJAX
- ✅ **Specific Times**: Updated via AJAX with cache-busting parameters

### Table-Based Shortcodes
- ✅ **Daily Prayer Table**: Uses minimal cache (30 seconds) and JavaScript updates
- ✅ **Monthly Calendar**: Uses hourly cache with AJAX refresh capability

## Cache Plugin Compatibility

### 1. LiteSpeed Cache
- ✅ **ESI Support**: Plugin detects ESI requests and handles them appropriately
- ✅ **Dynamic Content**: Uses X-LiteSpeed headers to prevent caching of time-sensitive content
- ✅ **Purge Integration**: Responds to `litespeed_purge_all` actions
- ⚠️ **Recommendation**: Configure LiteSpeed to allow dynamic content for prayer time pages

### 2. WP Rocket
- ✅ **Exclusion Rules**: Pages with prayer shortcodes are excluded from caching
- ✅ **Purge Triggers**: Responds to prayer time changes with automatic purges

### 3. W3 Total Cache
- ✅ **Conditional Caching**: Prevents caching of pages with time-sensitive content
- ✅ **Purge Integration**: Compatible with W3TC flush functions

### 4. WP Super Cache
- ✅ **Conditional Caching**: Prevents caching of pages with prayer time shortcodes
- ✅ **Purge Integration**: Compatible with super cache clearing functions

## Dynamic Data Implementation

### 1. ESI Nonces Usage
The plugin implements security through:
- WordPress nonces for AJAX requests
- ESI request detection for server-level caching
- Cache-busting parameters for dynamic content

### 2. JavaScript-Based Updates
- **Real-time Clock**: Current time updates every second via JavaScript
- **Prayer Time Tracking**: Automatically detects and highlights current prayer time
- **Dynamic Content Loading**: AJAX-based updates for all time-sensitive data

### 3. Server-Side Cache Handling
- **Transient Caching**: Short-lived cache for prayer times (30 seconds to 1 minute)
- **Automatic Cache Invalidation**: When prayer times change
- **Selective Caching**: Only caches static portions of content

## Recommendations for Optimal Performance

### 1. LiteSpeed Cache Configuration
```
# Add to .htaccess or LiteSpeed configuration
RewriteRule ^(.*)fiveprayer(.*)$ - [E=LSCACHE:NO,LSESI:ON]
```

### 2. ESI Nonce Implementation
The plugin is ready for ESI with:
- Proper ESI request detection
- Dynamic content generation for ESI contexts
- Security nonce validation

### 3. Advanced Cache Settings
For optimal performance with caching plugins:
- Set minimum cache timeouts for prayer time pages
- Enable dynamic content features in cache plugins
- Configure exclusion rules for prayer time URLs

## Conclusion

The FivePrayer plugin is **well-prepared** for use with LiteSpeed Cache and other caching plugins. The implementation includes:

✅ **Robust Dynamic Content System**: AJAX-based updates ensure fresh content  
✅ **ESI Compatibility**: Proper detection and handling of ESI requests  
✅ **Security**: Nonce-based protection for all dynamic requests  
✅ **Performance**: Smart caching with short expiration for time-sensitive data  
✅ **Compatibility**: Integration with major caching plugins (LiteSpeed, WP Rocket, W3TC, etc.)  

The plugin follows modern WordPress practices for handling dynamic content in cached environments and should work seamlessly with LiteSpeed's ESI features for dynamic data.
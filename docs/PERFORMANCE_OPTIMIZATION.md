# FivePrayer Plugin Performance Optimization Guide

## Understanding the Plugin Test Results

The plugin test showed:
- Memory usage: 1.2 MiB average increase
- Page speed impact: 0.057 seconds average
- These are excellent results for a feature-rich plugin

## Areas for Performance Improvement

### 1. Optimize Asset Loading

Currently, your assets are loaded on the main admin page. Consider more granular loading:

```php
// In AdminMenu.php, refine asset loading
public function render_page(): void
{
    // Only load assets when on the fiveprayer admin page
    $page = sanitize_text_field(filter_input(INPUT_GET, 'page') ?: '');
    $current_page = sanitize_title($page);

    if ($current_page === 'fiveprayer' || 
        $current_page === 'fiveprayer-settings' || 
        strpos($current_page, 'fiveprayer') !== false) {
        
        (new Assets())->enqueue_admin_page_assets();
    }

    // Render the admin page content
    echo '<div id="fiveprayer-admin-app"></div>';
}
```

### 2. Optimize Database Queries

Reduce database hits by implementing better caching:

```php
// In PrayerDataCache.php, enhance caching mechanism
public static function getTimetableByDateUnfiltered($date) {
    $cache_key = 'fiveprayer_timetable_' . $date;
    
    // Check WordPress object cache first
    $cached_result = wp_cache_get($cache_key, 'fiveprayer');
    if ($cached_result !== false) {
        return $cached_result;
    }
    
    // If not in cache, get from database
    global $wpdb;
    $table = $wpdb->prefix . 'fp_timetable';
    $result = $wpdb->get_row($wpdb->prepare(
        "SELECT * FROM {$table} WHERE date = %s LIMIT 1",
        $date
    ));
    
    // Cache for 1 hour
    wp_cache_set($cache_key, $result, 'fiveprayer', HOUR_IN_SECONDS);
    
    return $result;
}
```

### 3. Lazy Load Heavy Components

Instead of loading all services immediately, load them when needed:

```php
// In your main Plugin class
class Plugin {
    private $assets = null;
    private $path_service = null;
    
    private function getAssets() {
        if ($this->assets === null) {
            $this->assets = new Assets();
        }
        return $this->assets;
    }
    
    private function getPathService() {
        if ($this->path_service === null) {
            $this->path_service = new PathService();
        }
        return $this->path_service;
    }
}
```

### 4. Optimize Shortcode Processing

Make sure shortcodes are only processed when actually present:

```php
// Only hook shortcode processing when needed
function fiveprayer_maybe_init_shortcodes() {
    if (has_shortcode(get_post()->post_content, 'fiveprayer') || 
        is_admin_bar_showing()) {
        // Initialize shortcodes
        add_shortcode('fiveprayer', 'fiveprayer_shortcode_callback');
    }
}
add_action('wp', 'fiveprayer_maybe_init_shortcodes');
```

### 5. Reduce Memory Footprint of the Memory Test Page

Your memory test page itself could be optimized:

```php
// In AdminMenu.php, optimize the memory test page
public function render_memory_test_page(): void
{
    // Minimize operations during measurement
    $iter = filter_input(INPUT_GET, 'iter', FILTER_VALIDATE_INT) ?: 50; // Reduced default
    
    // Pre-calculate expensive operations
    static $bundle_size = null;
    if ($bundle_size === null) {
        $bundle_size = $this->calculate_bundle_size();
    }
    
    // Perform minimal operations
    $baseline_memory = memory_get_usage(false);
    
    // Your measurement code here...
}

private function calculate_bundle_size(): int {
    static $size = null;
    if ($size === null) {
        $ps = new \FivePrayer\Core\PathService();
        $index_path = $ps->getFileFullPath('build-admin/index.js');
        $size = file_exists($index_path) ? filesize($index_path) : 0;
    }
    return $size;
}
```

### 6. Optimize Database Schema

Review your database tables for optimization:

```sql
-- Add indexes to frequently queried columns
ALTER TABLE wp_fp_timetable ADD INDEX idx_date (date);
ALTER TABLE wp_fp_prayer_settings_meta ADD INDEX idx_meta_key (`meta-key`);
```

### 7. Implement Proper Uninstall Cleanup

Clean up resources when plugin is uninstalled:

```php
// In your uninstall hook
function fiveprayer_uninstall() {
    global $wpdb;
    
    // Delete plugin options
    delete_option('fiveprayer_version');
    delete_option('fiveprayer_log_level');
    delete_option('fiveprayer_data_versions');
    
    // Delete plugin tables
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}fp_timetable");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}fp_prayer_settings_meta");
    $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}fp_api_keys");
    
    // Clear all plugin-related transients
    if (class_exists('FivePrayer\\Core\\Helpers\\PrayerDataCache')) {
        \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
    }
}
```

## How to Replicate Plugin Test Results

To get similar results to the plugin test, you can:

### 1. Use WordPress's Built-in Benchmarking
```php
// Add this to your plugin temporarily for testing
function fiveprayer_benchmark_load() {
    if (defined('WP_DEBUG') && WP_DEBUG) {
        $start_memory = memory_get_usage();
        $start_time = microtime(true);
        
        // Your plugin's main operations
        
        $end_memory = memory_get_usage();
        $end_time = microtime(true);
        
        error_log(sprintf(
            'FivePrayer: Memory usage: %d bytes, Time: %.4f seconds',
            $end_memory - $start_memory,
            $end_time - $start_time
        ));
    }
}
```

### 2. Test with Query Monitor Plugin
Install the Query Monitor plugin to see detailed performance metrics for your plugin.

### 3. Use WordPress CLI for Performance Testing
```bash
# Test with WP-CLI
wp eval 'wp_remote_get(site_url("/"));'
```

## Best Practices Moving Forward

1. **Profile Before Optimizing**: Always measure performance before making changes
2. **Focus on Critical Paths**: Optimize the most frequently used features
3. **Lazy Loading**: Load resources only when needed
4. **Efficient Queries**: Use indexes and cache database results
5. **Minimize Hooks**: Only add actions/filters when necessary
6. **Clean Up**: Remove unused code and optimize algorithms

Your current performance is already quite good (1.2 MiB increase is excellent), so focus on the most impactful optimizations first.
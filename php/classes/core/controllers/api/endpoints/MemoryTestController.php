<?php

namespace FivePrayer\Core\Controllers\API\EndPoints;

defined('ABSPATH') || exit;

class MemoryTestController
{
    public function __construct()
    {
        add_action('wp_ajax_fiveprayer_memory_test', [$this, 'handle_memory_test']);
        add_action('wp_ajax_nopriv_fiveprayer_memory_test', [$this, 'handle_memory_test']);
    }

    public function handle_memory_test()
    {
        // Verify nonce
        $nonce = sanitize_text_field(filter_input(INPUT_POST, 'nonce') ?: '');
        if (!wp_verify_nonce($nonce, 'wp_rest')) {
            wp_die('Security check failed');
        }

        // Get baseline memory usage
        $baseline_memory = memory_get_usage(true);
        
        // Test individual components
        $assets_memory = $this->test_assets_class();
        $cache_memory = $this->test_cache_system();
        $pathservice_memory = $this->test_pathservice();
        
        // Calculate totals
        $total_plugin_memory = $assets_memory + $cache_memory + $pathservice_memory;
        $peak_memory = memory_get_peak_usage(true);
        
        // Estimate real impact
        $estimated_plugin_memory = $this->estimate_plugin_memory();
        $wordpress_plus_plugin = $baseline_memory + $estimated_plugin_memory;
        $wp_hive_measured = 269 * 1024; // 269 KB in bytes
        $difference = $estimated_plugin_memory - $wp_hive_measured;
        $improvement = $difference > 0 ? (($difference / $wp_hive_measured) * 100) : 0;
        $improvement_text = $difference > 0 ? sprintf('%.1f%% WORSE', $improvement) : sprintf('%.1f%% BETTER', abs($improvement));

        $response = [
            'timestamp' => current_time('Y-m-d H:i:s'),
            'wordpress_memory' => [
                'baseline' => $this->format_memory($baseline_memory),
                'peak' => $this->format_memory($peak_memory),
                'plugin_components' => [
                    'assets_class' => $this->format_memory($assets_memory),
                    'cache_system' => $this->format_memory($cache_memory),
                    'path_service' => $this->format_memory($pathservice_memory),
                    'total_plugin' => $this->format_memory($total_plugin_memory)
                ],
                'estimated_real_impact' => [
                    'estimated_plugin_memory' => $this->format_memory($estimated_plugin_memory),
                    'wordpress_plus_plugin' => $this->format_memory($wordpress_plus_plugin),
                    'wp_hive_measured' => '269.00 KB',
                    'estimated_current' => $this->format_memory($estimated_plugin_memory),
                    'difference' => $this->format_memory($difference),
                    'improvement' => $improvement_text
                ]
            ],
            'browser_memory' => [
                'note' => 'Browser memory is measured on client side'
            ]
        ];

        wp_send_json($response);
    }

    private function test_assets_class()
    {
        $start_memory = memory_get_usage(true);
        
        // Test Assets class
        $assets = new \FivePrayer\Core\Assets();
        
        return memory_get_usage(true) - $start_memory;
    }

    private function test_cache_system()
    {
        $start_memory = memory_get_usage(true);
        
        // Test PrayerDataCache
        \FivePrayer\Core\Helpers\PrayerDataCache::getSingleMetaValue('test');
        
        return memory_get_usage(true) - $start_memory;
    }

    private function test_pathservice()
    {
        $start_memory = memory_get_usage(true);
        
        // Test PathService
        $pathservice = new \FivePrayer\Core\PathService();
        
        return memory_get_usage(true) - $start_memory;
    }

    private function estimate_plugin_memory()
    {
        // Estimate based on file sizes and typical usage patterns
        $plugin_dir = plugin_dir_path(FIVEPRAYER_FILE);
        $total_size = 0;
        
        // Calculate total plugin file size
        if (file_exists($plugin_dir)) {
            $iterator = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($plugin_dir));
            foreach ($iterator as &$file) {
                if ($file->isFile() && $file->getExtension() !== 'map') {
                    $total_size += $file->getSize();
                }
            }
        }
        
        // Estimate memory usage (typically 30-50% of file size in memory)
        return $total_size * 0.4;
    }

    private function format_memory($bytes)
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= (1 << (10 * $pow));
        
        return round($bytes, 2) . ' ' . $units[$pow];
    }
}

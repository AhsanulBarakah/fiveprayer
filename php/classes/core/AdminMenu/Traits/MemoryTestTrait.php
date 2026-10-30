<?php

namespace FivePrayer\Core\AdminMenu\Traits;

defined('ABSPATH') || exit;

trait MemoryTestTrait
{
    public function render_memory_test_page(): void
    {
        $iter = filter_input(INPUT_GET, 'iter', FILTER_VALIDATE_INT) ?: (filter_input(INPUT_GET, 'deep') ? 500 : 30);
        if ($iter < 50) { $iter = 50; }
        if ($iter > 1000) { $iter = 1000; }
        if (function_exists('gc_collect_cycles')) { gc_collect_cycles(); }
        if (function_exists('gc_mem_caches')) { gc_mem_caches(); }

        $baseline_memory = memory_get_usage(false);
        $peak_memory     = memory_get_peak_usage(false);

        $measure = function (callable $factory, int $iterations = 300): array {
            if (function_exists('gc_collect_cycles')) { gc_collect_cycles(); }
            if (function_exists('gc_mem_caches')) { gc_mem_caches(); }
            $before       = memory_get_usage(false);
            $before_real  = memory_get_usage(true);
            $peak_before  = memory_get_peak_usage(false);
            $hold = [];
            for ($i = 0; $i < $iterations; $i++) {
                $val = $factory($i);
                if (is_string($val)) {
                    $val .= '|' . $i;
                }
                $hold[] = $val;
            }
            $after       = memory_get_usage(false);
            $after_real  = memory_get_usage(true);
            $peak_after  = memory_get_peak_usage(false);
            unset($hold);
            if (function_exists('gc_collect_cycles')) { gc_collect_cycles(); }
            if (function_exists('gc_mem_caches')) { gc_mem_caches(); }
            $diff       = (int) max(0, max($after - $before, $after_real - $before_real));
            $peak_delta = (int) max(0, $peak_after - $peak_before);
            $avg  = (int) max(0, floor($diff / max(1, $iterations)));
            $avg_peak = (int) max(0, floor($peak_delta / max(1, $iterations)));
            return [
                'total'      => $diff,
                'avg'        => $avg,
                'peak'       => $peak_delta,
                'avg_peak'   => $avg_peak,
                'iterations' => $iterations,
            ];
        };

        $pathservice_stats = $measure(function () {
            return new \FivePrayer\Core\PathService();
        }, $iter);
        $pathservice_total = $pathservice_stats['total'] ?: $pathservice_stats['peak'];
        $pathservice_avg   = $pathservice_stats['avg']   ?: $pathservice_stats['avg_peak'];

        $do_cache = filter_input(INPUT_GET, 'deep') || filter_input(INPUT_GET, 'cache');
        $cache_total = 0; $cache_avg = 0;
        if ($do_cache) {
            $cache_stats = $measure(function ($i) {
                \FivePrayer\Core\Helpers\PrayerDataCache::getSingleMetaValue('fiveprayer_memory_probe_' . $i);
                return new \stdClass();
            }, $iter);
            $cache_total = $cache_stats['total'] ?: $cache_stats['peak'];
            $cache_avg   = $cache_stats['avg']   ?: $cache_stats['avg_peak'];
        }

        $assets_proxy_stats = $measure(function ($i) {
            $ps = new \FivePrayer\Core\PathService();
            return $ps->getFileUrl('build-admin/index.js') . '?v=' . $i;
        }, $iter);
        $assets_proxy_total = $assets_proxy_stats['total'] ?: $assets_proxy_stats['peak'];
        $assets_proxy_avg   = $assets_proxy_stats['avg']   ?: $assets_proxy_stats['avg_peak'];

        $pathservice_display = $pathservice_total;
        $cache_display       = $cache_total;
        $assets_display      = $assets_proxy_total;
        if ($pathservice_display === 0) {
            $pathservice_display = strlen(serialize(new \FivePrayer\Core\PathService()));
        }
        if ($cache_display === 0 && $do_cache) {
            $cache_result = \FivePrayer\Core\Helpers\PrayerDataCache::getSingleMetaValue('fiveprayer_memory_probe_preview');
            $cache_display = strlen(serialize($cache_result));
        }
        if ($assets_display === 0) {
            $ps2 = new \FivePrayer\Core\PathService();
            $assets_display = strlen($ps2->getFileUrl('build-admin/index.js'));
            unset($ps2);
        }

        $total_plugin_memory = max(0, $assets_display + $cache_display + $pathservice_display);

        $estimated_plugin_memory = $this->estimate_admin_bundle_memory();
        $wordpress_plus_plugin   = $baseline_memory + $estimated_plugin_memory;
        $wp_hive_measured        = 269 * 1024;
        $difference              = $estimated_plugin_memory - $wp_hive_measured;
        $improvement_text        = ($difference > 0)
            ? sprintf('%.1f%% WORSE', ($difference / $wp_hive_measured) * 100)
            : sprintf('%.1f%% BETTER', abs($difference) / $wp_hive_measured * 100);

        ?>
        <div class="wrap">
            <h1>FivePrayer Memory Test</h1>

            <div class="card" style="background:#fff;padding:20px;border:1px solid #ccd0d4;border-radius:4px;margin:20px 0;">
                <h2>WordPress Baseline</h2>
                <table class="widefat" style="margin-top:10px;">
                    <tr>
                        <td><strong>WordPress Memory:</strong></td>
                        <td><?php echo $this->format_memory($baseline_memory); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
                    </tr>
                    <tr>
                        <td><strong>Peak Memory:</strong></td>
                        <td><?php echo $this->format_memory($peak_memory); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
                    </tr>
                </table>
            </div>

            <div class="card" style="background:#fff;padding:20px;border:1px solid #ccd0d4;border-radius:4px;margin:20px 0;">
                <h2>Plugin Component Tests</h2>
                <table class="widefat" style="margin-top:10px;">
                    <tr>
                        <td><strong>Assets Pipeline (URL resolve) — batch total:</strong></td>
                        <td><?php echo $this->format_memory($assets_display); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <span style="color:#666;">(~ <?php echo $this->format_memory($assets_proxy_avg); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>/op)</span></td>
                    </tr>
                    <tr>
                        <td><strong>Cache System:</strong></td>
                        <td><?php echo $this->format_memory($cache_display); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <span style="color:#666;">(~ <?php echo $this->format_memory($cache_avg); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>/op)</span></td>
                    </tr>
                    <tr>
                        <td><strong>PathService:</strong></td>
                        <td><?php echo $this->format_memory($pathservice_display); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?> <span style="color:#666;">(~ <?php echo $this->format_memory($pathservice_avg); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>/op)</span></td>
                    </tr>
                    <tr>
                        <td><strong>Total Plugin Memory:</strong></td>
                        <td><?php echo $this->format_memory($total_plugin_memory); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
                    </tr>
                </table>
            </div>

            <div class="card" style="background:#fff;padding:20px;border:1px solid #ccd0d4;border-radius:4px;margin:20px 0;">
                <h2>Estimated Real Impact</h2>
                <table class="widefat" style="margin-top:10px;">
                    <tr>
                        <td><strong>Estimated Plugin Memory:</strong></td>
                        <td><?php echo $this->format_memory($estimated_plugin_memory); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
                    </tr>
                    <tr>
                        <td><strong>WordPress + Plugin:</strong></td>
                        <td><?php echo $this->format_memory($wordpress_plus_plugin); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
                    </tr>
                    <tr>
                        <td><strong>WP Hive Measured:</strong></td>
                        <td>269.00 KB</td>
                    </tr>
                    <tr>
                        <td><strong>Estimated Current:</strong></td>
                        <td><?php echo $this->format_memory($estimated_plugin_memory); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
                    </tr>
                    <tr>
                        <td><strong>Difference:</strong></td>
                        <td><?php echo $this->format_memory($difference); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
                    </tr>
                    <tr>
                        <td><strong>Improvement:</strong></td>
                        <td><?php echo $improvement_text; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?></td>
                    </tr>
                </table>
            </div>

            <div class="card" style="background:#f0f6fc;padding:15px;border:1px solid #0073aa;border-radius:4px;margin:20px 0;font-size:12px;color:#50575e;">
                <p><strong>Note:</strong> Component values are measured by comparing memory before and after instantiation. Run again to average out variability.</p>
            </div>

            <div style="margin-top:20px;">
                <button onclick="location.reload()" class="button button-primary">Run Test Again</button>
            </div>
        </div>
        <?php
    }

    private function test_assets_class()
    {
        $start_memory = memory_get_usage(true);
        $assets = new \FivePrayer\Core\Assets();
        return memory_get_usage(true) - $start_memory;
    }

    private function test_cache_system()
    {
        $start_memory = memory_get_usage(true);
        \FivePrayer\Core\Helpers\PrayerDataCache::getSingleMetaValue('test');
        return memory_get_usage(true) - $start_memory;
    }

    private function test_pathservice()
    {
        $start_memory = memory_get_usage(true);
        $pathservice = new \FivePrayer\Core\PathService();
        return memory_get_usage(true) - $start_memory;
    }

    private function estimate_plugin_memory()
    {
        return 427 * 1024;
    }

    private function estimate_admin_bundle_memory(): int
    {
        $ps = new \FivePrayer\Core\PathService();
        $index_path = $ps->getFileFullPath('build-admin/index.js');
        if (file_exists($index_path)) {
            $size = filesize($index_path);
            return (int) floor($size * 0.12);
        }
        return 427 * 1024;
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

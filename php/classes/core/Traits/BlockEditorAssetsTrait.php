<?php

namespace FivePrayer\Core\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

trait BlockEditorAssetsTrait
{
    /**
     * Enqueue block editor assets (editor scripts/styles for all blocks)
     */
    public function enqueue_block_editor_assets(): void
    {
        if (is_admin()) {
            $blocks_path = $this->path_service->getFileFullPath('build-blocks/');
            if (!is_dir($blocks_path)) {
                return;
            }

            // Collect all vendor/runtime script handles that block scripts must depend on
            $vendor_handles = [];

            $runtime_js = $blocks_path . '/runtime.js';
            if (file_exists($runtime_js)) {
                wp_enqueue_script(
                    'fiveprayer-blocks-runtime',
                    $this->path_service->getFileUrl('build-blocks/runtime.js'),
                    [],
                    filemtime($runtime_js),
                    true
                );
                $vendor_handles[] = 'fiveprayer-blocks-runtime';
            }

            // Enqueue vendor chunks (webpack split chunks) that block scripts depend on
            $vendor_asset_files = glob($blocks_path . '*.asset.php') ?: [];
            foreach ($vendor_asset_files as $asset_file) {
                $base = basename($asset_file, '.asset.php');
                // Skip runtime (already enqueued) and block subdirectory assets
                if ($base === 'runtime' || is_dir($blocks_path . $base)) {
                    continue;
                }
                $vendor_js = $blocks_path . $base . '.js';
                if (file_exists($vendor_js)) {
                    $asset = include $asset_file;
                    $vendor_handle = 'fiveprayer-vendor-' . $base;
                    $vendor_deps = is_array($asset) ? ($asset['dependencies'] ?? []) : [];
                    $vendor_ver = is_array($asset) ? ($asset['version'] ?? filemtime($vendor_js)) : filemtime($vendor_js);
                    wp_enqueue_script(
                        $vendor_handle,
                        $this->path_service->getFileUrl('build-blocks/' . $base . '.js'),
                        $vendor_deps,
                        $vendor_ver,
                        true
                    );
                    $vendor_handles[] = $vendor_handle;
                }
            }

            $block_dirs = glob($blocks_path . '*', GLOB_ONLYDIR) ?: [];
            foreach ($block_dirs as &$dir) {
                $block_json = $dir . '/block.json';
                if (!file_exists($block_json)) continue;

                static $block_cache = array();
                $cache_key = md5($block_json);

                if (!isset($block_cache[$cache_key])) {
                    if (!function_exists('WP_Filesystem')) {
                        require_once(ABSPATH . 'wp-admin/includes/file.php');
                    }

                    global $wp_filesystem;
                    if (empty($wp_filesystem)) {
                        WP_Filesystem();
                    }

                    $block_content = false;
                    if ($wp_filesystem && $wp_filesystem->exists($block_json)) {
                        $block_content = $wp_filesystem->get_contents($block_json);
                    }

                    if ($block_content === false) {
                        Logger::error('FivePrayer: Could not read block JSON file via filesystem API: ' . basename($block_json), 'BlockEditorAssets');
                    }

                    $block_cache[$cache_key] = $block_content !== false ? json_decode($block_content, true) : null;
                }

                $block = $block_cache[$cache_key];
                if (!$block || empty($block['name'])) continue;

                $base_name = basename($dir);

                if (!empty($block['editorScript']) && strpos($block['editorScript'], 'file:') === 0) {
                    $script_path = $dir . '/' . substr($block['editorScript'], 6);
                    if (file_exists($script_path)) {
                        $handle = 'fiveprayer-block-' . $base_name . '-editor';
                        $asset_file = $dir . '/index.asset.php';
                        $deps = [];
                        $ver = filemtime($script_path);
                        if (file_exists($asset_file)) {
                            $asset = include $asset_file;
                            if (is_array($asset)) {
                                $deps = $asset['dependencies'] ?? [];
                                $ver = $asset['version'] ?? $ver;
                            }
                        }
                        // Merge vendor/runtime dependencies with WordPress deps from asset.php
                        $all_deps = array_merge($vendor_handles, $deps);
                        wp_enqueue_script(
                            $handle,
                            $this->path_service->getFileUrl('build-blocks/' . $base_name . '/' . basename($script_path)),
                            $all_deps,
                            $ver,
                            true
                        );
                    }
                }

                if (!empty($block['editorStyle'])) {
                    $styles = is_array($block['editorStyle']) ? $block['editorStyle'] : [$block['editorStyle']];
                    foreach ($styles as &$style) {
                        if (strpos($style, 'file:') === 0) {
                            $style_path = $dir . '/' . substr($style, 6);
                            if (file_exists($style_path)) {
                                wp_enqueue_style(
                                    'fiveprayer-block-' . $base_name . '-editor',
                                    $this->path_service->getFileUrl('build-blocks/' . $base_name . '/' . basename($style_path)),
                                    [],
                                    filemtime($style_path)
                                );
                            }
                        }
                    }
                }
            }
        }

        if (defined('BREAKDANCE_PLUGIN_VERSION')) {
            // Currently no Breakdance-specific scripts to enqueue
        }
    }
}

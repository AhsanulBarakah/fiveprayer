<?php
namespace FivePrayer\Core\Blocks;

use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\PathService;

defined('ABSPATH') || exit;

class BlockRegistrar 
{
    private $path_service;

    public function __construct()
    {
        $this->path_service = new PathService();
    }

    /**
     * Registers all Gutenberg blocks from the build-blocks directory
     * 
     * Automatically detects block directories and registers each block with WordPress.
     * Supports blocks with dynamic rendering via render.php files.
     */
    public function register_blocks()
    {
        add_filter('block_categories_all', [$this, 'fiveprayer_filter_block_categories'], 10, 2);

        $blocks_path = $this->path_service->getFileFullPath('build-blocks/');
        
        // Check if build-blocks directory exists
        if (!is_dir($blocks_path)) {
            Logger::error("build-blocks directory not found at: " . $blocks_path, 'BlockRegistrar');
            return;
        }
        
        $block_directories = glob($blocks_path . '*', GLOB_ONLYDIR);

        if (empty($block_directories)) {
            Logger::error("No block directories found in build-blocks at: " . $blocks_path, 'BlockRegistrar');
            return;
        }

        foreach ($block_directories as &$block_directory) {
            $this->register_single_block($block_directory);
        }
    }

    /**
     * Add a custom block category for FivePrayer blocks.
     */
    public function fiveprayer_filter_block_categories($block_categories, $editor_context)
    {
        if (!empty($editor_context->post)) {
            $block_categories[] = [
                'slug'  => 'fiveprayer-blocks',
                'title' => __('FivePrayer', 'fiveprayer'),
                'icon'  => null,
            ];
        }
        return $block_categories;
    }
        
    /**
     * Registers a single block with WordPress
     * 
     * @param string $block_directory Absolute path to the block directory
     */
    protected function register_single_block($block_directory)
    {
        $block_name = basename($block_directory);
        $block_json_path = $block_directory . '/block.json';
        
        // Check if block.json exists
        if (!file_exists($block_json_path)) {
            Logger::error("block.json not found for block: " . $block_name, 'BlockRegistrar');
            return;
        }
        
        $render_path = $block_directory . '/render.php';

        $args = file_exists($render_path) 
            ? [
                'render_callback' => function ($attributes, $content, $block) use ($render_path) {
                    try {
                        ob_start();
                        include $render_path;
                        return ob_get_clean();
                    } catch (Exception $e) {
                        Logger::error("Error rendering block " . $block_name . ": " . $e->getMessage(), 'BlockRegistrar');
                        return '<!-- FivePrayer Block Error -->';
                    }
                }
              ]
            : [];

        $result = register_block_type($block_directory, $args);
        
        if ($result === false) {
            Logger::error("Failed to register block: " . $block_name, 'BlockRegistrar');
        } else {
            // Removed excessive success logging to reduce log duplication - only log errors
            // Logger::info("Successfully registered block: " . $block_name, 'BlockRegistrar');
        }
    }
}
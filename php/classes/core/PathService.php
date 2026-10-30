<?php
namespace FivePrayer\Core;

defined('ABSPATH') || exit;

/**
 * Core Path Service class for handling all path-related operations
 */
class PathService
{
    private const PLUGIN_NAME = 'fiveprayer';
    private const ASSETS_DIR = 'Assets';
    private const IMAGES_DIR = 'images';
    private const PNG_DIR = 'png';
    private const DEFAULT_PNG = 'image-empty.png';

    private $plugin_dir;
    private $plugin_url;

    public function __construct()
    {
        $plugin_path = dirname(__DIR__, 2);
        $this->plugin_dir = plugin_dir_path($plugin_path);
        $this->plugin_url = plugin_dir_url($plugin_path);
    }

    /**
     * Get the full path to the plugin directory
     * @return string
     */
    public function getPluginDir(): string
    {
        return $this->plugin_dir;
    }

    /**
     * Get the URL to the plugin directory
     * @return string
     */
    public function getPluginUrl(): string
    {
        return $this->plugin_url;
    }

    /**
     * Get the full path to the assets directory
     * @return string
     */
    public function getAssetsDir(): string
    {
        return wp_normalize_path($this->plugin_dir . '/' . self::ASSETS_DIR);
    }

    /**
     * Get the URL to the assets directory
     * @return string
     */
    public function getAssetsUrl(): string
    {
        return $this->plugin_url . self::ASSETS_DIR;
    }

    /**
     * Get the full path to the images directory
     * @return string
     */
    public function getImagesDir(): string
    {
        return wp_normalize_path($this->getAssetsDir() . '/' . self::IMAGES_DIR);
    }

    /**
     * Get the URL to the images directory
     * @return string
     */
    public function getImagesUrl(): string
    {
        return $this->getAssetsUrl() . '/' . self::IMAGES_DIR;
    }

    /**
     * Get the full path to the PNG directory
     * @return string
     */
    public function getPngDir(): string
    {
        return wp_normalize_path($this->getImagesDir() . '/' . self::PNG_DIR);
    }

    /**
     * Get the URL to the PNG directory
     * @return string
     */
    public function getPngUrl(): string
    {
        return $this->getImagesUrl() . '/' . self::PNG_DIR;
    }

    /**
     * Get the full path to the default PNG file
     * @return string
     */
    public function getDefaultPngPath(): string
    {
        return wp_normalize_path($this->getPngDir() . '/' . self::DEFAULT_PNG);
    }

    /**
     * Get the URL to the default PNG file
     * @return string
     */
    public function getDefaultPngUrl(): string
    {
        return $this->getPngUrl() . '/' . self::DEFAULT_PNG;
    }

    /**
     * Validate a file path
     * @param string $path
     * @return bool
     */
    public function validatePath(string $path): bool
    {
        if (empty($path)) {
            return false;
        }

        $normalized_path = wp_normalize_path($path);
        
        // Check if path is within plugin directory
        if (strpos($normalized_path, $this->plugin_dir) !== 0) {
            return false;
        }

        // Check if file exists and is readable
        if (!file_exists($path) || !is_readable($path)) {
            return false;
        }

        // Check file permissions
        $perms = fileperms($path) & 0777;
        if ($perms !== 0644) {
            return false;
        }

        return true;
    }

    /**
     * Get a secure URL with proper headers
     * @param string $url
     * @return string
     */
    public function getSecureUrl(string $url): string
    {
        $security_headers = [
            'Content-Type' => 'image/png',
            'Cache-Control' => 'public, max-age=31536000',
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'DENY',
            'X-XSS-Protection' => '1; mode=block'
        ];

        return add_query_arg([
            'headers' => base64_encode(json_encode($security_headers))
        ], $url);
    }

    /**
     * Get the full path to a specific file in the plugin
     * @param string $relative_path Relative path from plugin directory
     * @return string
     */
    public function getFileFullPath(string $relative_path): string
    {
        return wp_normalize_path($this->plugin_dir . '/' . $relative_path);
    }

    /**
     * Get the URL to a specific file in the plugin
     * @param string $relative_path Relative path from plugin directory
     * @return string
     */
    public function getFileUrl(string $relative_path): string
    {
        return $this->plugin_url . $relative_path;
    }
}

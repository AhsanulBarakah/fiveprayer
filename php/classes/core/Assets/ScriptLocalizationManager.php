<?php
namespace FivePrayer\Core\Assets;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

/**
 * Centralized Script Localization Manager
 * Prevents duplicate script localization and improves caching performance
 */
class ScriptLocalizationManager {
    private static $instance = null;
    private $localized_data = [];
    private $localization_attempted = [];

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Localize script data with duplicate prevention
     *
     * @param string $handle Script handle
     @param string $name Variable name
     @param array $data Data to localize
     * @param int $flags JSON encoding flags
     * @return bool Whether the data was localized
     */
    public function localizeScript($handle, $name, $data, $flags = 0) {
        $key = $handle . '_' . $name;
        
        // Check if this localization has already been attempted
        if (isset($this->localization_attempted[$key])) {
            Logger::debug("Script localization skipped for duplicate: {$key}", 'ScriptLocalizationManager');
            return false;
        }
        
        // Mark that localization has been attempted for this key
        $this->localization_attempted[$key] = true;
        
        // Check if the data has already been stored
        if (!isset($this->localized_data[$key])) {
            $this->localized_data[$key] = $data;
            
            // Actually perform the localization
            wp_localize_script($handle, $name, $data, $flags);
            Logger::debug("Script localized: {$key}", 'ScriptLocalizationManager');
            return true;
        }
        
        Logger::debug("Script localization already exists: {$key}", 'ScriptLocalizationManager');
        return false;
    }

    /**
     * Force localization regardless of previous attempts (for special cases)
     */
    public function forceLocalizeScript($handle, $name, $data, $flags = 0) {
        $this->localized_data[$handle . '_' . $name] = $data;
        $this->localization_attempted[$handle . '_' . $name] = true;
        return wp_localize_script($handle, $name, $data, $flags);
    }

    /**
     * Check if specific localization exists
     */
    public function hasLocalizedData($handle, $name) {
        $key = $handle . '_' . $name;
        return isset($this->localized_data[$key]);
    }

    /**
     * Get localized data
     */
    public function getLocalizedData($handle, $name) {
        $key = $handle . '_' . $name;
        return $this->localized_data[$key] ?? null;
    }

    /**
     * Reset localization tracking (typically for new page loads)
     */
    public function resetTracking() {
        $this->localization_attempted = [];
        Logger::debug("Script localization tracking reset", 'ScriptLocalizationManager');
    }

    /**
     * Get all localized data for debugging
     */
    public function getAllLocalizedData() {
        return $this->localized_data;
    }
    
    /**
     * Check if ESI is available and should be used for dynamic content
     */
    public function isESISupported() {
        return class_exists('\\FivePrayer\\Core\\Assets\\ESIDynamicContentHandler') &&
               \FivePrayer\Core\Assets\ESIDynamicContentHandler::getInstance()->isESIEnabled();
    }
}
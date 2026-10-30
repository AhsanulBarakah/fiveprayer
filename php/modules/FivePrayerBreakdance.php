<?php
/**
 * FivePrayer Breakdance Module
 * 
 * This file handles Breakdance integration functionality for the FivePrayer plugin.
 * 
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

/**
 * Initialize Breakdance elements when Breakdance is loaded
 * Using the same approach as the working breakfive plugin
 */
function fiveprayer_initialize_breakdance_elements() {
    // Register the custom category with Breakdance
    if (class_exists('\Breakdance\Elements\ElementCategoriesController')) {
        \Breakdance\Elements\ElementCategoriesController::getInstance()->registerCategory('five-prayer', 'Five Prayer');
    }

    // Register save location for Breakdance to discover our elements
    if (class_exists('\Breakdance\ElementStudio')) {
        \Breakdance\ElementStudio\registerSaveLocation(
            \Breakdance\Util\getDirectoryPathRelativeToPluginFolder(plugin_dir_path(__FILE__)) . 'php/classes/core/helpers/MetaField/Breakdance/elements',
            'FivePrayerElements',
            'element',
            'FivePrayer Elements',
            false
        );
    }
}

// Hook into Breakdance when it's loaded
add_action('breakdance_loaded', 'fiveprayer_initialize_breakdance_elements', 9);

// Breakdance dynamic fields are registered via init.php -> RegisterFields.php
// (hooked to init at priority 20 to avoid _load_textdomain_just_in_time warnings)
<?php
namespace FivePrayer\Core\Helpers\MetaField\Breakdance;

if (!defined('ABSPATH')) {
    exit;
}

// Include the Breakdance API handlers
require_once __DIR__ . '/BreakdanceAPI.php';

// Register AJAX handlers for Breakdance
BreakdanceAPI::register_ajax_handlers();


// Register custom Breakdance elements (category is registered in main plugin file)
add_action('breakdance_loaded', function() {
    // Register each element individually to ensure they are properly loaded
    if (class_exists('\Breakdance\Elements\Element')) {
        // Array of element classes to register
        $element_classes = [
            'FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes',
            'FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerCountdown',
            'FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerSchedule',
            'FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerHijriCalendar'
        ];

        foreach ($element_classes as &$element_class) {
            // Ensure the element class file is loaded
            $element_name = substr(strrchr($element_class, '\\'), 1); // Extract class name
            $element_file = __DIR__ . '/elements/' . $element_name . '/element.php';

            if (file_exists($element_file) && !class_exists($element_class)) {
                require_once $element_file;
            }

            // Register the element with ElementStudio if the class exists
            if (class_exists($element_class)) {
                \Breakdance\ElementStudio\registerElementForEditing(
                    $element_class,
                    \Breakdance\Util\getDirectoryPathRelativeToPluginFolder(dirname($element_file))
                );
            }
        }
    }
}, 10); // Standard priority for breakdance_loaded

// Initialize Breakdance compatibility at init action (after translations are loaded)
// to avoid "_load_textdomain_just_in_time was called incorrectly" warnings in WP 6.7+
add_action('init', function() {
    if (function_exists('\Breakdance\DynamicData\registerField') && class_exists('\Breakdance\DynamicData\Field')) {
        // Include the direct registration file which handles all field registrations
        require_once __DIR__ . '/RegisterFields.php';
    }
}, 20);
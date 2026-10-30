<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

/**
 * Breakdance Compatibility Manager - Initializes Breakdance compatibility only
 */

class BreakdanceCompatManager {

    /**
     * Initialize Breakdance compatibility
     */
    public function init(): void {
        // Only proceed if Breakdance is active
        if (class_exists('\Breakdance\Elements\Element')) {
            // Load only the specific compatibility classes needed for Breakdance elements
            // Avoid loading index.php to prevent class redeclaration issues

            // Load base dependencies first
            if (file_exists(__DIR__ . '/MetaFieldRegistrar.php') && !class_exists('FivePrayer\Core\Helpers\MetaField\MetaFieldRegistrar')) {
                require_once __DIR__ . '/MetaFieldRegistrar.php';
            }

            if (file_exists(__DIR__ . '/DynamicTextHandler.php') && !class_exists('FivePrayer\Core\Helpers\MetaField\DynamicTextHandler')) {
                require_once __DIR__ . '/DynamicTextHandler.php';
            }

            // Load the main element compatibility classes
            if (file_exists(__DIR__ . '/FivePrayerElement.php') && !class_exists('FivePrayer\Core\Helpers\MetaField\FivePrayerElement')) {
                require_once __DIR__ . '/FivePrayerElement.php';
            }

            if (file_exists(__DIR__ . '/FivePrayerTimes.php') && !class_exists('FivePrayer\Core\Helpers\MetaField\FivePrayerTimes')) {
                require_once __DIR__ . '/FivePrayerTimes.php';
            }

            // Load our new element compatibility classes
            if (file_exists(__DIR__ . '/FivePrayerCountdown.php') && !class_exists('FivePrayer\Core\Helpers\MetaField\FivePrayerCountdown')) {
                require_once __DIR__ . '/FivePrayerCountdown.php';
            }

            if (file_exists(__DIR__ . '/FivePrayerSchedule.php') && !class_exists('FivePrayer\Core\Helpers\MetaField\FivePrayerSchedule')) {
                require_once __DIR__ . '/FivePrayerSchedule.php';
            }

            if (file_exists(__DIR__ . '/FivePrayerHijriCalendar.php') && !class_exists('FivePrayer\Core\Helpers\MetaField\FivePrayerHijriCalendar')) {
                require_once __DIR__ . '/FivePrayerHijriCalendar.php';
            }
        }

        // Add Breakdance compatibility if Breakdance is active
        if (function_exists('\Breakdance\DynamicData\registerField') && class_exists('\Breakdance\DynamicData\Field')) {
            // Include and initialize Breakdance compatibility
            if (file_exists(__DIR__ . '/Breakdance/init.php')) {
                require_once __DIR__ . '/Breakdance/init.php';
            }
        }
    }
}
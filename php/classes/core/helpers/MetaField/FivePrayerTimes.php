<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

/**
 * FivePrayerTimes Element for Oxygen and other page builders
 * This file provides the FivePrayerTimes class that Oxygen Builder expects
 */

// Ensure the actual element file is loaded first
$fiveprayer_element_file = __DIR__ . '/Breakdance/elements/FivePrayerTimes/element.php';
if (file_exists($fiveprayer_element_file) && !class_exists('FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes')) {
    require_once $fiveprayer_element_file;
}

// Only define the class if the parent Breakdance element class exists
if (class_exists('\\Breakdance\\Elements\\Element') && class_exists('FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes')) {
    class FivePrayerTimes extends \Breakdance\Elements\Element
    {
        public static function uiIcon()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function availableIn()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function tag()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function tagOptions()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function tagControlPath()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function name()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function className()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function category()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function badge()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function slug()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function template()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function defaultCss()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function defaultProperties()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function defaultChildren()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function cssTemplate()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function designControls()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function contentControls()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function settingsControls()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function dependencies()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function settings()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function addPanelRules()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function actions()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function nestingRule()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function spacingBars()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function attributes()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function experimental()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function order()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function dynamicPropertyPaths()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function additionalClasses()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function projectManagement()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function propertyPathsToWhitelistInFlatProps()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function propertyPathsToSsrElementWhenValueChanges()
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__]);
        }

        public static function ssr($propertiesData, $parentPropertiesData = [], $isBuilder = false, $repeaterItemNodeId = null)
        {
            return call_user_func(['FivePrayer\Core\Helpers\MetaField\Breakdance\Elements\FivePrayerTimes', __FUNCTION__], $propertiesData, $parentPropertiesData, $isBuilder, $repeaterItemNodeId);
        }
    }
} else {
    // Fallback class in case Breakdance is not available
    class FivePrayerTimes
    {
        // Empty class as fallback
    }
}
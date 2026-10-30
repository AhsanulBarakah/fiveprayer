<?php

namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Elements;

use function Breakdance\Elements\c;
use function Breakdance\Elements\controlSection;

defined('ABSPATH') || exit;

class FivePrayerTimes extends \Breakdance\Elements\Element
{
    static function uiIcon()
    {
        return '💙';
    }

    static function tag()
    {
        return 'div';
    }

    static function tagOptions()
    {
        return [];
    }

    static function tagControlPath()
    {
        return false;
    }

    static function name()
    {
        return 'Five Prayer Times';
    }

    static function className()
    {
        return 'fiveprayer-times-element';
    }

    static function category()
    {
        return 'five-prayer';
    }

    static function badge()
    {
        return false;
    }

    static function slug()
    {
        return __CLASS__;
    }

    static function template()
    {
        return file_get_contents(__DIR__ . '/html.twig');
    }

    static function defaultCss()
    {
        return file_get_contents(__DIR__ . '/default.css');
    }

    static function defaultProperties()
    {
        return [
            'content' => [
                'prayer_times_selection' => [
                    'selected_prayers' => 'all',
                    'show_iqamah' => true,
                ]
            ]
        ];
    }

    static function defaultChildren()
    {
        return false;
    }

    static function cssTemplate()
    {
        return file_get_contents(__DIR__ . '/css.twig');
    }

    static function designControls()
    {
        return [
            controlSection(
                "prayer_times_styling",
                "Prayer Times Styling",
                [
                    c(
                        "time_color",
                        "Time Color",
                        [],
                        ['type' => 'color', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "prayer_name_color", 
                        "Prayer Name Color",
                        [],
                        ['type' => 'color', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "background_color",
                        "Background Color", 
                        [],
                        ['type' => 'color', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "border_radius",
                        "Border Radius",
                        [],
                        [
                            'type' => 'unit', 
                            'layout' => 'vertical',
                            'unitOptions' => [
                                'types' => ['px', '%', 'em', 'rem'],
                                'defaultType' => 'px',
                            ],
                            'rangeOptions' => [
                                'min' => 0,
                                'max' => 50,
                                'step' => 1,
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
                ]
            )
        ];
    }

    static function contentControls()
    {
        return [
            controlSection(
                "prayer_times_selection",
                "Prayer Times Selection",
                [
                    c(
                        "selected_prayers",
                        "Select Prayer Times",
                        [],
                        [
                            'type' => 'button_bar',
                            'layout' => 'vertical',
                            'items' => [
                                ['text' => 'All Prayers', 'value' => 'all'],
                                ['text' => 'Fajr Only', 'value' => 'fajr'],
                                ['text' => 'Dhuhr Only', 'value' => 'dhuhr'],
                                ['text' => 'Asr Only', 'value' => 'asr'],
                                ['text' => 'Maghrib Only', 'value' => 'maghrib'],
                                ['text' => 'Isha Only', 'value' => 'isha'],
                                ['text' => 'Custom Selection', 'value' => 'custom'],
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_iqamah",
                        "Show Iqamah Times",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                ]
            ),
            controlSection(
                "custom_prayer_selection",
                "Custom Prayer Selection",
                [
                    c(
                        "fajr_enabled",
                        "Include Fajr",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        []
                    ),
                    c(
                        "sunrise_enabled",
                        "Include Sunrise",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        []
                    ),
                    c(
                        "dhuhr_enabled",
                        "Include Dhuhr",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        []
                    ),
                    c(
                        "asr_enabled",
                        "Include Asr",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        []
                    ),
                    c(
                        "maghrib_enabled",
                        "Include Maghrib",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        []
                    ),
                    c(
                        "isha_enabled",
                        "Include Isha",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        []
                    ),
                ],
                [
                    'type' => 'section',
                    'sectionOptions' => ['type' => 'popout'],
                    'layout' => 'vertical',
                    'condition' => [
                        'path' => '%%CURRENTPATH%%.selected_prayers',
                        'operand' => 'equals',
                        'value' => 'custom'
                    ]
                ]
            )
        ];
    }

    static function settingsControls()
    {
        return [
            controlSection(
                "prayer_times_settings",
                "Settings",
                [
                    c(
                        "update_frequency",
                        "Update Frequency",
                        [],
                        [
                            'type' => 'dropdown',
                            'layout' => 'vertical',
                            'items' => [
                                ['text' => 'Every hour', 'value' => 'hourly'],
                                ['text' => 'Twice daily', 'value' => 'twicedaily'],
                                ['text' => 'Daily', 'value' => 'daily'],
                                ['text' => 'Weekly', 'value' => 'weekly'],
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "time_format",
                        "Time Format",
                        [],
                        [
                            'type' => 'button_bar',
                            'layout' => 'vertical',
                            'items' => [
                                ['text' => '12 Hour', 'value' => '12h'],
                                ['text' => '24 Hour', 'value' => '24h'],
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
                ]
            )
        ];
    }

    static function dependencies()
    {
        return false;
    }

    static function settings()
    {
        return ['shareStateWithChildSSR' => true, 'bypassPointerEvents' => false];
    }

    static function addPanelRules()
    {
        return ['alwaysHide' => false];
    }

    static public function actions()
    {
        return false;
    }

    static function nestingRule()
    {
        return ['type' => 'final'];
    }

    static function spacingBars()
    {
        return false;
    }

    static function attributes()
    {
        return false;
    }

    static function experimental()
    {
        return false;
    }

    static function availableIn()
    {
        // Check both Oxygen and Breakdance - only show if both integrations are enabled
        // By default, both are disabled which hides the element from both builders
        $oxygen_enabled = defined('OXYGEN_VERSION') && apply_filters('fiveprayer_enable_oxygen_integration', false);
        $breakdance_enabled = apply_filters('fiveprayer_enable_breakdance_integration', false);
        
        $available_in = [];
        
        if ($oxygen_enabled) {
            $available_in[] = 'oxygen';
        }
        
        if ($breakdance_enabled) {
            $available_in[] = 'breakdance';
        }
        
        // By default both filters return false, so the element will be hidden from both builders
        return $available_in;
    }

    static function order()
    {
        return 100;
    }

    static function dynamicPropertyPaths()
    {
        return false;
    }

    static function additionalClasses()
    {
        return false;
    }

    static function projectManagement()
    {
        return false;
    }

    static function propertyPathsToWhitelistInFlatProps()
    {
        return false;
    }

    static function propertyPathsToSsrElementWhenValueChanges()
    {
        return ['none'];
    }
}
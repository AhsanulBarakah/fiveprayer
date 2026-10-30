<?php
namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Elements;

if (!defined('ABSPATH')) {
    exit;
}

use function Breakdance\Elements\c;
use function Breakdance\Elements\controlSection;

class FivePrayerSchedule extends \Breakdance\Elements\Element
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
        return 'Five Prayer Schedule';
    }

    static function className()
    {
        return 'fiveprayer-schedule-element';
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
                'schedule_settings' => [
                    'show_today_only' => true,
                    'show_prayer_names' => true,
                    'show_iqamah' => true,
                    'include_sunrise' => false,
                ]
            ],
            'design' => [
                'schedule_style' => [
                    'layout' => 'horizontal',
                    'show_borders' => true,
                    'time_format' => '12h',
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
                "schedule_style",
                "Schedule Style",
                [
                    c(
                        "layout",
                        "Layout",
                        [],
                        [
                            'type' => 'button_bar',
                            'layout' => 'vertical',
                            'items' => [
                                ['text' => 'Horizontal', 'value' => 'horizontal'],
                                ['text' => 'Vertical', 'value' => 'vertical'],
                                ['text' => 'Grid', 'value' => 'grid'],
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
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
                        "border_color",
                        "Border Color",
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
                    c(
                        "padding",
                        "Padding",
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
                "schedule_settings",
                "Schedule Settings",
                [
                    c(
                        "show_today_only",
                        "Show Today's Schedule Only",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_prayer_names",
                        "Show Prayer Names",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
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
                    c(
                        "include_sunrise",
                        "Include Sunrise",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
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

    static function settingsControls()
    {
        return [
            controlSection(
                "schedule_behavior",
                "Behavior",
                [
                    c(
                        "auto_update",
                        "Auto Update Times",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "highlight_current",
                        "Highlight Current Prayer",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_countdown",
                        "Show Countdown to Next Prayer",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
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
        return [
            '0' => [
                'inlineScripts' => [
                    '(function() {
                        const element = document.querySelector(\'%%SELECTOR%%\');
                        if (!element) return;
                        
                        function updateSchedule() {
                            // This would be replaced with actual schedule logic
                            // For now, we just ensure the element exists
                            console.log("FivePrayer Schedule element loaded:", element);
                        }
                        
                        updateSchedule();
                    })();'
                ],
            ],
        ];
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
        return 102; // Higher than previous elements
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
<?php
namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Elements;

if (!defined('ABSPATH')) {
    exit;
}

use function Breakdance\Elements\c;
use function Breakdance\Elements\controlSection;

class FivePrayerHijriCalendar extends \Breakdance\Elements\Element
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
        return 'Five Prayer Hijri Calendar';
    }

    static function className()
    {
        return 'fiveprayer-hijri-calendar-element';
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
                'calendar_settings' => [
                    'show_current_month' => true,
                    'show_gregorian_date' => true,
                    'show_hijri_date' => true,
                    'highlight_today' => true,
                ]
            ],
            'design' => [
                'calendar_style' => [
                    'calendar_size' => 'medium',
                    'header_color' => '#0073aa',
                    'day_names_color' => '#333',
                    'date_color' => '#666',
                    'today_highlight_color' => '#ff6b6b',
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
                "calendar_style",
                "Calendar Style",
                [
                    c(
                        "calendar_size",
                        "Calendar Size",
                        [],
                        [
                            'type' => 'button_bar',
                            'layout' => 'vertical',
                            'items' => [
                                ['text' => 'Small', 'value' => 'small'],
                                ['text' => 'Medium', 'value' => 'medium'],
                                ['text' => 'Large', 'value' => 'large'],
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "header_color",
                        "Header Color",
                        [],
                        ['type' => 'color', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "day_names_color",
                        "Day Names Color",
                        [],
                        ['type' => 'color', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "date_color",
                        "Date Color",
                        [],
                        ['type' => 'color', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "today_highlight_color",
                        "Today Highlight Color",
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
                "calendar_settings",
                "Calendar Settings",
                [
                    c(
                        "show_current_month",
                        "Show Current Month",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_gregorian_date",
                        "Show Gregorian Date",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_hijri_date",
                        "Show Hijri Date",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "highlight_today",
                        "Highlight Today",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_prayer_times",
                        "Show Prayer Times",
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

    static function settingsControls()
    {
        return [
            controlSection(
                "calendar_behavior",
                "Behavior",
                [
                    c(
                        "auto_update",
                        "Auto Update Dates",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_week_numbers",
                        "Show Week Numbers",
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
                        
                        function updateCalendar() {
                            // This would be replaced with actual calendar logic
                            // For now, we just ensure the element exists
                            console.log("FivePrayer Hijri Calendar element loaded:", element);
                        }
                        
                        updateCalendar();
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
        return 103; // Higher than previous elements
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
<?php
namespace FivePrayer\Core\Helpers\MetaField\Breakdance\Elements;

if (!defined('ABSPATH')) {
    exit;
}

use function Breakdance\Elements\c;
use function Breakdance\Elements\controlSection;

class FivePrayerCountdown extends \Breakdance\Elements\Element
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
        return 'Five Prayer Countdown';
    }

    static function className()
    {
        return 'fiveprayer-countdown-element';
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
                'countdown_settings' => [
                    'target_prayer' => 'next',
                    'show_days' => true,
                    'show_hours' => true,
                    'show_minutes' => true,
                    'show_seconds' => true,
                ]
            ],
            'design' => [
                'countdown_style' => [
                    'display_format' => 'blocks',
                    'block_width' => '60',
                    'block_height' => '60',
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
                "countdown_style",
                "Countdown Style",
                [
                    c(
                        "display_format",
                        "Display Format",
                        [],
                        [
                            'type' => 'button_bar',
                            'layout' => 'vertical',
                            'items' => [
                                ['text' => 'Blocks', 'value' => 'blocks'],
                                ['text' => 'Inline', 'value' => 'inline'],
                                ['text' => 'Circular', 'value' => 'circular'],
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "block_width",
                        "Block Width",
                        [],
                        [
                            'type' => 'unit',
                            'layout' => 'vertical',
                            'unitOptions' => [
                                'types' => ['px', '%', 'em', 'rem'],
                                'defaultType' => 'px',
                            ],
                            'rangeOptions' => [
                                'min' => 30,
                                'max' => 200,
                                'step' => 5,
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "block_height",
                        "Block Height",
                        [],
                        [
                            'type' => 'unit',
                            'layout' => 'vertical',
                            'unitOptions' => [
                                'types' => ['px', '%', 'em', 'rem'],
                                'defaultType' => 'px',
                            ],
                            'rangeOptions' => [
                                'min' => 30,
                                'max' => 200,
                                'step' => 5,
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
                        "label_color",
                        "Label Color",
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
                "countdown_settings",
                "Countdown Settings",
                [
                    c(
                        "target_prayer",
                        "Target Prayer",
                        [],
                        [
                            'type' => 'dropdown',
                            'layout' => 'vertical',
                            'items' => [
                                ['text' => 'Next Prayer', 'value' => 'next'],
                                ['text' => 'Fajr', 'value' => 'fajr'],
                                ['text' => 'Dhuhr', 'value' => 'dhuhr'],
                                ['text' => 'Asr', 'value' => 'asr'],
                                ['text' => 'Maghrib', 'value' => 'maghrib'],
                                ['text' => 'Isha', 'value' => 'isha'],
                            ],
                        ],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_days",
                        "Show Days",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_hours",
                        "Show Hours",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_minutes",
                        "Show Minutes",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "show_seconds",
                        "Show Seconds",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "custom_message",
                        "Custom Message When Time Reached",
                        [],
                        ['type' => 'text', 'layout' => 'vertical'],
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
                "countdown_behavior",
                "Behavior",
                [
                    c(
                        "auto_refresh",
                        "Auto Refresh",
                        [],
                        ['type' => 'toggle', 'layout' => 'vertical'],
                        false,
                        false,
                        [],
                    ),
                    c(
                        "refresh_interval",
                        "Refresh Interval (seconds)",
                        [],
                        [
                            'type' => 'number',
                            'layout' => 'vertical',
                            'numberOptions' => [
                                'min' => 1,
                                'max' => 60,
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

    static function dependencies()
    {
        return [
            '0' => [
                'inlineScripts' => [
                    '(function() {
                        const element = document.querySelector(\'%%SELECTOR%%\');
                        if (!element) return;
                        
                        function updateCountdown() {
                            // This would be replaced with actual countdown logic
                            // For now, we just ensure the element exists
                            console.log("FivePrayer Countdown element loaded:", element);
                        }
                        
                        updateCountdown();
                        setInterval(updateCountdown, 1000);
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
        return 101; // Slightly higher than FivePrayerTimes to position it after
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
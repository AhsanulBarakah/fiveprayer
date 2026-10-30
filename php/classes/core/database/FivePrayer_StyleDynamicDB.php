<?php
namespace FivePrayer\Core\Database;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrayerDataCache;

if (!class_exists('FivePrayer_StyleDynamicDB')) {

    class FivePrayer_StyleDynamicDB
    {
        private $colorSettings;

        public function __construct()
        {
            // Use PrayerDataCache to load color settings
            $this->colorSettings = PrayerDataCache::getMetaData();
        }

  private function getColorValue($metaKey, $defaultValue)
{
    $filteredColors = array_filter($this->colorSettings, function ($val) use ($metaKey) {
        return isset($val->{'meta-key'}) && $val->{'meta-key'} === $metaKey;
    });
    
    
    $colorValue = array_map(function ($value) {
        if (!isset($value->value)) {
            return null;
        }
        
        // Check if the value is a JSON string (color values) or plain string (other settings)
        $decoded = json_decode($value->value, true);
        
        // If it's a valid JSON (color data), process it
        if ($decoded !== null && json_last_error() === JSON_ERROR_NONE) {
            if (isset($decoded['a'])) {
                // Preserve alpha value precision
                $decoded['a'] = (string)$decoded['a'];
            }
            return json_encode($decoded, JSON_UNESCAPED_UNICODE | JSON_PRESERVE_ZERO_FRACTION);
        } else {
            // It's a plain string value (like "dashed", "5", etc.)
            return $value->value;
        }
    }, array_values($filteredColors));
    
    return isset($colorValue[0]) ? $colorValue[0] : $defaultValue;
}

        public function StyleDynamic($color)
        {
            $colorMap = [
                'firstbg' => '{"r":0,"g":184,"b":29,"a":"1"}',
                'firstclr' => '{"r":255,"g":255,"b":255,"a":"1"}',
                'secondbg' => '{"r":80,"g":228,"b":19,"a":"1"}',
                'secondclr' => '{"r":30,"g":0,"b":0,"a":"1"}',
                'evenbg' => '{"r":255,"g":255,"b":255,"a":"1"}',
                'evenclr' => '{"r":3,"g":6,"b":20,"a":"1"}',
                'oddbg' => '{"r":0,"g":138,"b":14,"a":"1"}',
                'oddclr' => '{"r":255,"g":255,"b":255,"a":"1"}',
                'highlightbg' => '{"r":242,"g":255,"b":0,"a":"1"}',
                'highlightclr' => '{"r":201,"g":9,"b":9,"a":"1"}',
                'borderclr' => '{"r":33,"g":76,"b":10,"a":"1"}',
                'hoverbg' => '{"r":0,"g":0,"b":0,"a":"0.08"}',
                'hoverclr' => '{"r":0,"g":0,"b":0,"a":"0"}',
                'hover_mode' => 'blend',
                'hover_enabled' => '0',
                'borderstyle' => 'solid',
                'bordersize' => '1',
                // Corner rounding of the timetable table, in whole pixels. 0 is
                // the historical look (square corners), so the setting changes
                // nothing until someone moves it.
                'borderradius' => '0'
            ];

            $metaKeyMap = [
                'firstbg' => 'firstbg',
                'firstclr' => 'firstclr',
                'secondbg' => 'secondbg',
                'secondclr' => 'secondclr',
                'evenrowbg' => 'evenbg',
                'evenbg' => 'evenbg',
                'evenrowclr' => 'evenclr',
                'evenclr' => 'evenclr',
                'oddrowbg' => 'oddbg',
                'oddbg' => 'oddbg',
                'oddrowclr' => 'oddclr',
                'oddclr' => 'oddclr',
                'highlightrowbg' => 'highlightbg',
                'highlightbg' => 'highlightbg',
                'highlightrowclr' => 'highlightclr',
                'highlightclr' => 'highlightclr',
                'borderclr' => 'borderclr',
                'hoverbg' => 'hoverbg',
                'hoverclr' => 'hoverclr',
                'hover_mode' => 'hover_mode',
                'hover_enabled' => 'hover_enabled',
                'borderstyle' => 'borderstyle',
                'bordersize' => 'bordersize',
                'borderradius' => 'borderradius',
            ];

            if (array_key_exists($color, $metaKeyMap)) {
                $metaKey = $metaKeyMap[$color];
                $value = $this->getColorValue($metaKey, $colorMap[$metaKey]);
             
                return apply_filters('fiveprayer_style_dynamic_value', $value, $color, $metaKey);
            }

            return apply_filters('fiveprayer_style_dynamic_default', null, $color);
        }
    }
}
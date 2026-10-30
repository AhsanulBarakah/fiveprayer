<?php
namespace FivePrayer\Core\Helpers\MetaField\Breakdance;

if (!defined('ABSPATH')) {
    exit;
}

use FivePrayer\Core\ShortCodes\Data\ShortCodeMap;
use FivePrayer\Core\Helpers\MetaField\Breakdance\Components\FieldLabelMapper;
use FivePrayer\Core\Helpers\MetaField\Breakdance\Components\FieldDataManager;

/**
 * Direct registration of all Breakdance fields
 */
if (function_exists('\Breakdance\DynamicData\registerField') && class_exists('\Breakdance\DynamicData\Field')) {
    
    // Include required classes
    if (!class_exists('FivePrayerBreakdanceField')) {
        require_once __DIR__ . '/FivePrayerBreakdanceField.php';
    }
    
    require_once __DIR__ . '/components/BreakdanceFieldControls.php';
    require_once __DIR__ . '/components/WordRemovalUtility.php';
    require_once __DIR__ . '/components/FieldLabelMapper.php';
    require_once __DIR__ . '/components/FieldDataManager.php';
    
    // Register each prayer time field as a Breakdance dynamic field
    $fiveprayer_shortcode_map = ShortCodeMap::ACTIVE_SHORTCODES;

    foreach ($fiveprayer_shortcode_map as $fiveprayer_shortcode => $fiveprayer_field_key) {
        // Use FieldLabelMapper to get the field label
        $fiveprayer_field_label = FieldLabelMapper::getFieldLabel($fiveprayer_field_key);

        // Use FieldDataManager to get field configuration
        $fiveprayer_field_data = FieldDataManager::getFieldConfiguration($fiveprayer_field_key, $fiveprayer_field_label);

        $fiveprayer_field_instance = new FivePrayerBreakdanceField($fiveprayer_field_data);
        \Breakdance\DynamicData\registerField($fiveprayer_field_instance);
    }
}
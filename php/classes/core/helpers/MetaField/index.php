<?php

// MetaField System Index - Organize and load all meta field related classes
// This file serves as an entry point for the MetaField system

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

// Include all MetaField classes in the correct order (dependencies first)
// Load classes but don't instantiate them during file loading
if (!class_exists('FivePrayer\Core\Helpers\MetaField\BaseFivePrayerDynamicTag')) {
    require_once __DIR__ . '/BaseFivePrayerDynamicTag.php';
}
if (!class_exists('FivePrayer\Core\Helpers\MetaField\MetaFieldRegistrar')) {
    require_once __DIR__ . '/MetaFieldRegistrar.php';
}
if (!class_exists('FivePrayer\Core\Helpers\MetaField\DynamicTextHandler')) {
    require_once __DIR__ . '/DynamicTextHandler.php';
}
if (!class_exists('FivePrayer\Core\Helpers\MetaField\FivePrayerDynamicTags')) {
    require_once __DIR__ . '/FivePrayerDynamicTags.php';
}
if (!class_exists('FivePrayer\Core\Helpers\MetaField\PageBuilderCompat')) {
    require_once __DIR__ . '/PageBuilderCompat.php';
}
if (!class_exists('FivePrayer\Core\Helpers\MetaField\MetaFieldGenerator')) {
    require_once __DIR__ . '/MetaFieldGenerator.php';
}
if (!class_exists('FivePrayer\Core\Helpers\MetaField\FivePrayerElement')) {
    require_once __DIR__ . '/FivePrayerElement.php';
}
if (!class_exists('FivePrayer\Core\Helpers\MetaField\FivePrayerTimes')) {
    require_once __DIR__ . '/FivePrayerTimes.php';
}


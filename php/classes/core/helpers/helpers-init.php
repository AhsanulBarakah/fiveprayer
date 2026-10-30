<?php

namespace FivePrayer\Core\Helpers\WarningNotice;

defined('ABSPATH') || exit;

use FivePrayer\Core\PathService;

// Load all necessary helper files for the WarningNotice functionality
$fiveprayer_path_service = new PathService();

require_once $fiveprayer_path_service->getPluginDir() . 'php/classes/core/helpers/WarningNotice/NoticeRenderer.php';
require_once $fiveprayer_path_service->getPluginDir() . 'php/classes/core/helpers/WarningNotice/DeprecatedShortcodeScanner.php';
require_once $fiveprayer_path_service->getPluginDir() . 'php/classes/core/helpers/WarningNotice/NoticeScriptEnqueuer.php';

// Initialize the WarningNotice functionality - hook into admin_init to run BEFORE admin_notices
add_action('admin_init', function() {
    $notice = new WarningNotice();
    $notice->init();
}, 1); // Priority 1 to run early

// MetaField system is loaded directly by Plugin.php
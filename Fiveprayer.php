<?php
/**
 * Plugin Name:       FivePrayer
 * Plugin URI:        https://fiveprayer.com
 * Description:       FivePrayer – A plugin for displaying Muslim prayer times.
 * Version:           3.0.0
 * Author:            AhsanulBarakah
 * Author URI:        https://profiles.wordpress.org/jamaaldev/
 * Text Domain:       fiveprayer
 * Domain Path:       /languages
 * License:           GPL v3 or later
 * License URI:       https://www.gnu.org/licenses/gpl-3.0.txt
 * Requires at least: 6.7
 * Requires PHP:      7.4
 *
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

// Include the main plugin functionality and all modular components
require_once __DIR__ . '/php/FivePrayerMain.php';

// Activation and deactivation hooks are registered in php/FivePrayerMain.php,
// which owns the functions they call. Registering them here as well meant both
// copies were attached to the same action.

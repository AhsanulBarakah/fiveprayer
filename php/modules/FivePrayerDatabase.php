<?php
/**
 * FivePrayer Database Module
 * 
 * This file handles database-related functionality for the FivePrayer plugin.
 * 
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

/**
 * Initialize the database query monitoring system (when explicitly enabled)
 */
function fiveprayer_initialize_db_monitoring() {
    // Only the FIVEPRAYER_DB_MONITOR constant enables query monitoring. A
    // ?fiveprayer_db_monitor=true query argument used to do it too, which let
    // any visitor define SAVEQUERIES and have every query of that request kept
    // in memory.
    $constant_enabled = defined('FIVEPRAYER_DB_MONITOR') && FIVEPRAYER_DB_MONITOR;

    if ($constant_enabled) {
        // Enable query logging for monitoring
        if (!defined('SAVEQUERIES')) {
            define('SAVEQUERIES', true); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- SAVEQUERIES is a WordPress core constant, not one this plugin introduces.
        }

        $monitor_file = FIVEPRAYER_ABSPATH . 'dev-tools/db-query-monitor/QueryMonitorLoader.php';
        if (file_exists($monitor_file)) {
            require_once $monitor_file;
            \FivePrayer\Core\Logging\Logger::debug('FivePrayer database query monitoring system loaded', 'FivePrayer');
        } else {
            \FivePrayer\Core\Logging\Logger::debug('FivePrayer database query monitoring system not found', 'FivePrayer');
        }
    }
}

/**
 * Utility function to manually trigger database query report (when monitoring is enabled)
 */
if (!function_exists('fiveprayer_trigger_db_query_report')) {
    function fiveprayer_trigger_db_query_report() {
        // Check if monitoring is enabled
        $monitoring_enabled = isset($GLOBALS['fiveprayer_query_monitor']) ||
                             (defined('FIVEPRAYER_DB_MONITOR') && FIVEPRAYER_DB_MONITOR);

        if ($monitoring_enabled) {
            // Initialize monitor if not already done
            if (!isset($GLOBALS['fiveprayer_query_monitor'])) {
                // Enable SAVEQUERIES if not already enabled
                if (!defined('SAVEQUERIES')) {
                    define('SAVEQUERIES', true); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedConstantFound -- SAVEQUERIES is a WordPress core constant, not one this plugin introduces.
                }

                $query_monitor = \FivePrayer\DevTools\QueryMonitor\QueryMonitor::getInstance();

                // Process existing queries if SAVEQUERIES was already active
                $query_monitor->processAllQueries();

                $GLOBALS['fiveprayer_query_monitor'] = $query_monitor;
            }

            if (isset($GLOBALS['fiveprayer_query_monitor'])) {
                $analyzer = new \FivePrayer\DevTools\QueryMonitor\QueryAnalyzer($GLOBALS['fiveprayer_query_monitor']);
                $reporter = new \FivePrayer\DevTools\QueryMonitor\QueryReporter(
                    $GLOBALS['fiveprayer_query_monitor'],
                    $analyzer
                );

                $reporter->printFullReport();
                return true;
            } else {
                \FivePrayer\Core\Logging\Logger::error('[FivePrayer] Could not initialize query monitor.', 'FivePrayerDatabase');
                return false;
            }
        } else {
            \FivePrayer\Core\Logging\Logger::error('[FivePrayer] Database query reporting requires monitoring to be enabled with the FIVEPRAYER_DB_MONITOR constant.', 'FivePrayerDatabase');
            return false;
        }
    }
}
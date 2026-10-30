<?php
/**
 * Base class for the PHPUnit suites.
 *
 * The tests run against a real WordPress (see tests/phpunit/bootstrap.php), so
 * this only adds the helpers they share: reading the plugin's table prefix and
 * asserting that a route or shortcode is registered.
 *
 * @package FivePrayer
 */

use PHPUnit\Framework\TestCase;

/**
 * Shared helpers for the plugin suites.
 */
abstract class FivePrayerTestCase extends TestCase
{
    /**
     * Fully-prefixed name of a plugin table, e.g. `wp_fp_timetable`.
     */
    protected function tableName(string $suffix): string
    {
        global $wpdb;

        return $wpdb->prefix . $suffix;
    }

    /**
     * Column names of a plugin table.
     *
     * @return array<int, string>
     */
    protected function columnsOf(string $table): array
    {
        global $wpdb;

        if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $table)) !== $table) {
            $this->fail("Table {$table} does not exist — activation did not create it.");
        }

        $columns = $wpdb->get_col($wpdb->prepare('SHOW COLUMNS FROM %i', $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

        return is_array($columns) ? array_map('strval', $columns) : [];
    }

    /**
     * Every REST route the plugin registers under its own namespace.
     *
     * @return array<string, array<string, mixed>>
     */
    protected function fiveprayerRoutes(): array
    {
        $routes = [];
        foreach (rest_get_server()->get_routes() as $route => $handlers) {
            // WordPress registers the namespace itself (`/fiveprayer/v1`) with no
            // handlers of its own, so it is not one of the plugin's routes.
            if (preg_match('#^/fiveprayer/v\d+$#', $route)) {
                continue;
            }

            if (str_starts_with($route, '/fiveprayer/')) {
                $routes[$route] = $handlers;
            }
        }

        return $routes;
    }
}

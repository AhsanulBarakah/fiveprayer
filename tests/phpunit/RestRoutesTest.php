<?php
/**
 * The plugin's REST routes.
 *
 * Registering a route without a permission callback exposes it to every
 * visitor: WordPress treats a missing callback as "allow anyone". The route
 * list is read from the live REST server, so a route added anywhere in the
 * plugin is covered without updating this file.
 *
 * @package FivePrayer
 */

/**
 * REST surface.
 */
final class RestRoutesTest extends FivePrayerTestCase
{
    public function test_the_plugin_registers_routes(): void
    {
        $this->assertNotEmpty($this->fiveprayerRoutes(), 'The plugin should register at least one REST route under /fiveprayer/.');
    }

    public function test_every_route_declares_a_permission_callback(): void
    {
        $routes = $this->fiveprayerRoutes();
        $this->assertNotEmpty($routes);

        $missing = [];
        foreach ($routes as $route => $handlers) {
            foreach ($handlers as $handler) {
                if (empty($handler['permission_callback'])) {
                    $missing[] = $route;
                }
            }
        }

        $this->assertSame([], array_values(array_unique($missing)), 'Every /fiveprayer/ route needs a permission_callback.');
    }

    public function test_namespace_is_versioned(): void
    {
        foreach (array_keys($this->fiveprayerRoutes()) as $route) {
            $this->assertMatchesRegularExpression('#^/fiveprayer/v\d/#', $route, "Route {$route} should be versioned under /fiveprayer/vN/.");
        }
    }
}

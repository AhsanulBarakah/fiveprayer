<?php

namespace FivePrayer\Core\Controllers\API;

defined('ABSPATH') || exit;

abstract class RestControllerBase {
    abstract public function register_routes(): void;

    protected function get_namespace(): string {
        return 'fiveprayer/v1';
    }
}

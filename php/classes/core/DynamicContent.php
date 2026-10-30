<?php

namespace FivePrayer\Core;

defined('ABSPATH') || exit;

use FivePrayer\Core\DynamicContent\Traits\PrayerTimeContentTrait;

class DynamicContent {
    use PrayerTimeContentTrait;

    public function register(): void {
        add_action('init', [$this, 'register_dynamic_functions']);
    }

    public function register_dynamic_functions(): void {
        // Register functions that can be called directly instead of using shortcodes
    }
}

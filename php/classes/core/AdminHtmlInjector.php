<?php

namespace FivePrayer\Core;

defined('ABSPATH') || exit;

class AdminHtmlInjector {
    public function init(): void {
        add_action('admin_enqueue_scripts', [$this, 'enqueueScript']);
    }

    public function enqueueScript(): void {
        $screen = get_current_screen();
        
            wp_register_script(
                'fiveprayer-admin-injector',
                plugins_url('classes/core/js/injector.js', dirname(__DIR__)),
                [],
                '1.0',
                true
            );
            wp_enqueue_script('fiveprayer-admin-injector');
        
    }
}

<?php

namespace FivePrayer\Core\Helpers\WarningNotice;

defined('ABSPATH') || exit;

class DatabaseMissingNotice
{
    public function __construct()
    {
        add_action('admin_notices', [$this, 'show_missing_tables_notice']);
    }

    public function show_missing_tables_notice(): void
    {
        // Only show the message on the admin page and when the plugin page is active
        $page = sanitize_text_field(filter_input(INPUT_GET, 'page') ?: '');
        if (is_admin() && $page && sanitize_text_field($page) === 'fiveprayer') {
            echo '<div class="notice notice-error "><p><strong>FivePrayer Plugin:</strong> Database tables are missing. Please deactivate and then reactivate the plugin to restore them.</p></div>';
        }
    }
}
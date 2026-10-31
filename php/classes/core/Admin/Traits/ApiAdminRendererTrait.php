<?php

namespace FivePrayer\Core\Admin\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

trait ApiAdminRendererTrait
{
    public function add_admin_menu()
    {
        add_submenu_page(
            'fiveprayer',
            __('API Management', 'fiveprayer'),
            __('API Management', 'fiveprayer'),
            'manage_options',
            $this->page_slug,
            [$this, 'render_admin_page']
        );

        add_submenu_page(
            'fiveprayer',
            __('API Security', 'fiveprayer'),
            __('API Security', 'fiveprayer'),
            'manage_options',
            $this->security_page_slug,
            [$this, 'render_security_page']
        );

        Logger::info('API Management and API Security submenu pages are now visible in admin menu', 'ApiAdmin');
    }

    public function enqueue_admin_scripts($hook)
    {
        if (strpos($hook, $this->page_slug) === false && strpos($hook, $this->security_page_slug) === false) {
            return;
        }

        $plugin_url = plugin_dir_url(FIVEPRAYER_PLUGIN_FILE);

        $get_file_version = function($relative_path) use ($plugin_url) {
            $file_path = plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . $relative_path;
            return file_exists($file_path) ? (string)filemtime($file_path) : \FivePrayer\Core\Database\VersionManager::getCurrentPluginVersion();
        };

        wp_enqueue_style('fiveprayer-api-admin', $plugin_url . 'php/classes/core/Assets/CSS/api-admin.css', [], $get_file_version('php/classes/core/Assets/CSS/api-admin.css'));

        // wp-i18n is required because the script translates its own strings with
        // wp.i18n.__(); its JSON translations are read from languages/.
        wp_enqueue_script('fiveprayer-api-admin', $plugin_url . 'php/classes/core/Assets/JS/api-admin.js', ['jquery', 'wp-i18n'], $get_file_version('php/classes/core/Assets/JS/api-admin.js'), true);

        wp_set_script_translations('fiveprayer-api-admin', 'fiveprayer', plugin_dir_path(FIVEPRAYER_PLUGIN_FILE) . 'languages');

        $site_name = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);

        wp_localize_script('fiveprayer-api-admin', 'fpApiAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('fp_api_admin'),
            'confirmDelete' => __('Are you sure you want to delete this API key?', 'fiveprayer'),
            'confirmRevoke' => __('Are you sure you want to revoke this API key?', 'fiveprayer'),
            'siteName' => $site_name,
            'defaultSubject' => sprintf(
                /* translators: %s: site name */
                __('[%s] API Security Alert: IP Blocked', 'fiveprayer'),
                $site_name
            ),
            'defaultTestSubject' => sprintf(
                /* translators: %s: site name */
                __('[%s] API Security Alert [TEST] — IP Blocked Notification Test', 'fiveprayer'),
                $site_name
            ),
            'strings' => [
                'noTrackedIps' => __('No IPs are currently being tracked.', 'fiveprayer'),
            ],
        ]);
    }

    public function render_admin_page()
    {
        ?>
        <div class="wrap fiveprayer-api-admin">
            <div id="fiveprayer-legacy-migration-result" style="display: none;"></div>
            <div class="fiveprayer-api-hero">
                <div class="fiveprayer-api-hero-icon"><span class="dashicons dashicons-admin-network"></span></div>
                <div>
                    <h1><?php esc_html_e('FivePrayer API Management', 'fiveprayer'); ?></h1>
                    <p><?php esc_html_e('Manage API keys for external access to prayer times data.', 'fiveprayer'); ?></p>
                </div>
            </div>

            <div class="fiveprayer-api-header">
                <p><strong><?php esc_html_e('API Base URL:', 'fiveprayer'); ?></strong> <?php echo esc_url(rest_url('fiveprayer/v1/external/')); ?></p>
            </div>

            <div class="fiveprayer-api-grid">
                <div class="fiveprayer-api-card">
                    <h2><?php esc_html_e('Create New API Key', 'fiveprayer'); ?></h2>
                    <form id="fiveprayer-create-key-form" class="fiveprayer-form">
                        <div class="fiveprayer-form-group">
                            <label for="key-name" class="fiveprayer-form-label">
                                <?php esc_html_e('Key Name', 'fiveprayer'); ?>
                                <span class="fiveprayer-form-required" aria-label="<?php esc_attr_e('required', 'fiveprayer'); ?>">*</span>
                            </label>
                            <input type="text" id="key-name" name="name" required placeholder="<?php esc_attr_e('e.g., Mobile App API', 'fiveprayer'); ?>">
                        </div>
                        <div class="fiveprayer-form-group">
                            <label for="key-prefix" class="fiveprayer-form-label">
                                <?php esc_html_e('Key Prefix', 'fiveprayer'); ?>
                            </label>
                            <input type="text" id="key-prefix" name="key_prefix" value="fp_" placeholder="fp_" style="width: 120px;" aria-describedby="key-prefix-desc">
                            <p class="fiveprayer-field-caption" id="key-prefix-desc">
                                <?php esc_html_e('Customizes the prefix on generated API keys. Use alphanumeric characters, underscores, and hyphens only; max 30 characters.', 'fiveprayer'); ?>
                            </p>
                            <code id="fiveprayer-prefix-preview" style="display: inline-block; margin-top: 4px; font-size: 12px; background: #f0f0f0; padding: 2px 8px; border-radius: 3px;"></code>
                        </div>
                        <div class="fiveprayer-form-group">
                            <label for="key-description" class="fiveprayer-form-label">
                                <?php esc_html_e('Description', 'fiveprayer'); ?>
                            </label>
                            <textarea id="key-description" name="description" rows="3" placeholder="<?php esc_attr_e('Optional description of how this key will be used', 'fiveprayer'); ?>"></textarea>
                        </div>
                        <div class="fiveprayer-form-group">
                            <label for="key-expires" class="fiveprayer-form-label">
                                <?php esc_html_e('Expires On', 'fiveprayer'); ?>
                            </label>
                            <input type="date" id="key-expires" name="expires_at" min="<?php echo esc_attr(gmdate('Y-m-d', strtotime('+1 day'))); ?>" aria-describedby="key-expires-desc">
                            <p class="fiveprayer-field-caption" id="key-expires-desc">
                                <?php esc_html_e('Optional expiration date. After this date, the key is automatically rejected by the API.', 'fiveprayer'); ?>
                            </p>
                        </div>
                        <div class="fiveprayer-form-group">
                            <label for="allowed-domains" class="fiveprayer-form-label">
                                <?php esc_html_e('Allowed Domains', 'fiveprayer'); ?>
                            </label>
                            <input type="text" id="allowed-domains" name="allowed_domains" placeholder="<?php esc_attr_e('example.com, *.example.org', 'fiveprayer'); ?>" aria-describedby="allowed-domains-desc">
                            <p class="fiveprayer-field-caption" id="allowed-domains-desc">
                                <?php esc_html_e('Comma-separated list of request origins to allow. Use * for wildcard. Leave empty to allow all origins.', 'fiveprayer'); ?>
                            </p>
                        </div>
                        <div class="fiveprayer-form-group">
                            <label for="allowed-ips" class="fiveprayer-form-label">
                                <?php esc_html_e('Allowed IPs', 'fiveprayer'); ?>
                            </label>
                            <input type="text" id="allowed-ips" name="allowed_ips" placeholder="<?php esc_attr_e('192.168.1.1, 10.0.0.0/24', 'fiveprayer'); ?>" aria-describedby="allowed-ips-desc">
                            <p class="fiveprayer-field-caption" id="allowed-ips-desc">
                                <?php esc_html_e('Comma-separated IPs or CIDR ranges to allow. Leave empty to allow all IPs.', 'fiveprayer'); ?>
                            </p>
                        </div>
                        <div class="fiveprayer-form-group">
                            <label for="allowed-endpoints" class="fiveprayer-form-label">
                                <?php esc_html_e('Allowed Endpoints', 'fiveprayer'); ?>
                            </label>
                            <input type="text" id="allowed-endpoints" name="allowed_endpoints" placeholder="<?php esc_attr_e('prayer-times, next-prayer', 'fiveprayer'); ?>" aria-describedby="allowed-endpoints-desc">
                            <p class="fiveprayer-field-caption" id="allowed-endpoints-desc">
                                <?php esc_html_e('Comma-separated endpoint slugs to allow. Leave empty to allow all endpoints.', 'fiveprayer'); ?>
                            </p>
                        </div>
                        <div class="fiveprayer-form-group">
                            <label for="rate-limit" class="fiveprayer-form-label">
                                <?php esc_html_e('Rate Limit Per Hour', 'fiveprayer'); ?>
                            </label>
                            <input type="number" id="rate-limit" name="rate_limit" value="1000" min="1" max="100000" aria-describedby="rate-limit-desc">
                            <p class="fiveprayer-field-caption" id="rate-limit-desc">
                                <?php esc_html_e('Maximum number of API requests allowed per hour for this key. Default is 1000.', 'fiveprayer'); ?>
                            </p>
                        </div>
                        <div class="fiveprayer-form-group">
                            <button type="submit" class="fiveprayer-btn fiveprayer-btn-primary">
                                <?php esc_html_e('Generate API Key', 'fiveprayer'); ?>
                            </button>
                        </div>
                    </form>
                    <div id="fiveprayer-create-result" class="fiveprayer-result" style="display: none;"></div>
                </div>

                <div class="fiveprayer-api-card">
                    <h2><?php esc_html_e('API Documentation', 'fiveprayer'); ?></h2>
                    <div class="fiveprayer-api-docs">
                        <h3><?php esc_html_e('Authentication', 'fiveprayer'); ?></h3>
                        <p><?php esc_html_e('Include your API key in the request header:', 'fiveprayer'); ?></p>
                        <code>X-API-Key: your_api_key_here</code>

                        <h3><?php esc_html_e('Base URL', 'fiveprayer'); ?></h3>
                        <p><?php esc_html_e('All endpoints use this base URL:', 'fiveprayer'); ?></p>
                        <code><?php echo esc_url(rest_url('fiveprayer/v1/external/')); ?></code>

                        <h3><?php esc_html_e('Domain Restrictions & Origin Header', 'fiveprayer'); ?></h3>
                        <p><strong><?php esc_html_e('Allowed Domains is a convenience filter for browser use, not a security control.', 'fiveprayer'); ?></strong>
                        <?php esc_html_e('It compares the Origin or Referer header, and any non-browser client (curl, a script, a server integration) can send those headers itself. Use the IP allowlist when another server calls this API, because the client address cannot be chosen that way.', 'fiveprayer'); ?></p>
                        <p><?php esc_html_e('If you set Allowed Domains on your API key, requests must include an Origin or Referer header matching an allowed domain.', 'fiveprayer'); ?></p>
                        <p><strong><?php esc_html_e('Testing:', 'fiveprayer'); ?></strong></p>
                        <ul>
                            <li><?php esc_html_e('Leave Allowed Domains empty for unrestricted testing (recommended).', 'fiveprayer'); ?></li>
                            <li><?php esc_html_e('Or use * as the only domain to allow all origins.', 'fiveprayer'); ?></li>
                            <li><?php esc_html_e('Or set localhost and add Origin: http://localhost to your request headers.', 'fiveprayer'); ?></li>
                        </ul>
                        <p><strong><?php esc_html_e('curl example with Origin header:', 'fiveprayer'); ?></strong></p>
                        <code>curl -H 'X-API-Key: fp_your_key_here' -H 'Origin: https://example.com' '<?php echo esc_url(rest_url('fiveprayer/v1/external/prayer-times/today')); ?>'</code>

                        <h3><?php esc_html_e('Available Endpoints', 'fiveprayer'); ?></h3>
                        <ul>
                            <li><a href="<?php echo esc_url(rest_url('fiveprayer/v1/external/prayer-times')); ?>" target="_blank"><strong>GET /prayer-times</strong></a> - <?php esc_html_e('Get prayer times for a specific date (?date=2024-12-25)', 'fiveprayer'); ?></li>
                            <li><a href="<?php echo esc_url(rest_url('fiveprayer/v1/external/prayer-times/today')); ?>" target="_blank"><strong>GET /prayer-times/today</strong></a> - <?php esc_html_e('Get today\'s prayer times', 'fiveprayer'); ?></li>
                            <li><a href="<?php echo esc_url(rest_url('fiveprayer/v1/external/prayer-times/month')); ?>" target="_blank"><strong>GET /prayer-times/month</strong></a> - <?php esc_html_e('Get prayer times for a month (?month=1&year=2026)', 'fiveprayer'); ?></li>
                            <li><a href="<?php echo esc_url(rest_url('fiveprayer/v1/external/next-prayer')); ?>" target="_blank"><strong>GET /next-prayer</strong></a> - <?php esc_html_e('Get the next prayer time', 'fiveprayer'); ?></li>
                            <li><a href="<?php echo esc_url(rest_url('fiveprayer/v1/external/mosque-info')); ?>" target="_blank"><strong>GET /mosque-info</strong></a> - <?php esc_html_e('Get mosque information', 'fiveprayer'); ?></li>
                            <li><strong>GET /test</strong> - <?php esc_html_e('Test endpoint (no API key needed)', 'fiveprayer'); ?></li>
                        </ul>

                        <h3><?php esc_html_e('Language Support', 'fiveprayer'); ?></h3>
                        <p><?php esc_html_e('Add ?lang=code to any endpoint to get translations. Use ?langs=en,ar,so for multilingual responses.', 'fiveprayer'); ?></p>
                        <code><?php echo esc_url(rest_url('fiveprayer/v1/external/prayer-times/today?lang=ar')); ?></code>

                        <p class="fiveprayer-docs-note"><?php
                        printf(
                            /* translators: 1: opening anchor HTML tag linking to the API documentation page, 2: closing anchor HTML tag. */
                            esc_html__('For complete documentation with all parameters, examples, and response formats, see the %1$sAPI Documentation page%2$s.', 'fiveprayer'),
                            '<a href="' . esc_url(admin_url('admin.php?page=fiveprayer#/documentation/api')) . '">',
                            '</a>'
                        );
                        ?></p>
                    </div>
                </div>
            </div>

            <div class="fiveprayer-api-card">
                <h2><?php esc_html_e('Existing API Keys', 'fiveprayer'); ?></h2>
                <div class="fiveprayer-keys-list">
                    <?php $this->render_api_keys_list(); ?>
                </div>
            </div>
        </div>

        <div id="fiveprayer-confirm-modal" class="fiveprayer-modal" style="display: none;">
            <div class="fiveprayer-modal-content">
                <div class="fiveprayer-modal-header">
                    <h3 id="fiveprayer-modal-title"><?php esc_html_e('Confirm Action', 'fiveprayer'); ?></h3>
                    <button class="fiveprayer-modal-close" id="fiveprayer-modal-close">&times;</button>
                </div>
                <div class="fiveprayer-modal-body">
                    <p id="fiveprayer-modal-message"><?php esc_html_e('Are you sure you want to perform this action?', 'fiveprayer'); ?></p>
                </div>
                <div class="fiveprayer-modal-footer">
                    <button class="fiveprayer-btn fiveprayer-btn-secondary" id="fiveprayer-modal-cancel"><?php esc_html_e('Cancel', 'fiveprayer'); ?></button>
                    <button class="fiveprayer-btn fiveprayer-btn-primary" id="fiveprayer-modal-confirm"><?php esc_html_e('Confirm', 'fiveprayer'); ?></button>
                </div>
            </div>
        </div>

        <div id="fiveprayer-key-detail-modal" class="fiveprayer-modal" style="display: none;">
            <div class="fiveprayer-modal-content fiveprayer-detail-modal-content">
                <div class="fiveprayer-modal-header">
                    <h3 id="fiveprayer-detail-title"><?php esc_html_e('API Key Details', 'fiveprayer'); ?></h3>
                    <button class="fiveprayer-modal-close" id="fiveprayer-detail-close">&times;</button>
                </div>
                <div class="fiveprayer-modal-body" id="fiveprayer-detail-body">
                    <div class="fiveprayer-detail-loading"><?php esc_html_e('Loading...', 'fiveprayer'); ?></div>
                </div>
                <div class="fiveprayer-modal-footer" id="fiveprayer-detail-footer">
                    <button class="fiveprayer-btn fiveprayer-btn-secondary" id="fiveprayer-detail-cancel"><?php esc_html_e('Close', 'fiveprayer'); ?></button>
                    <button class="fiveprayer-btn fiveprayer-btn-primary" id="fiveprayer-detail-edit" style="display:none;"><?php esc_html_e('Edit', 'fiveprayer'); ?></button>
                    <button class="fiveprayer-btn fiveprayer-btn-primary" id="fiveprayer-detail-save" style="display:none;"><?php esc_html_e('Save Changes', 'fiveprayer'); ?></button>
                </div>
            </div>
        </div>

        <?php
    }

    private function render_api_keys_list()
    {
        $keys = $this->api_key_manager->get_keys();

        if (empty($keys)) {
            echo '<div class="fiveprayer-no-keys">' . esc_html__('No API keys found. Create your first API key above.', 'fiveprayer') . '</div>';
            return;
        }

        foreach ($keys as $key) {
            $is_expired = isset($key->expires_at) && $key->expires_at && strtotime($key->expires_at) < time();

            if ($is_expired) {
                $status_class = 'fiveprayer-status-expired';
                $status_text = esc_html__('Expired', 'fiveprayer');
                $card_class = 'fiveprayer-row-expired';
            } elseif (isset($key->status) && $key->status === 'active') {
                $status_class = 'fiveprayer-status-active';
                $status_text = ucfirst($key->status);
                $card_class = '';
            } else {
                $status_class = 'fiveprayer-status-inactive';
                $status_text = isset($key->status) ? ucfirst($key->status) : esc_html__('Unknown', 'fiveprayer');
                $card_class = '';
            }

            $usage_count = isset($key->usage_count) ? number_format($key->usage_count) : 0;
            ?>
            <div class="fiveprayer-key-card <?php echo esc_attr($card_class); ?>">
                <div class="fiveprayer-key-header">
                    <div class="fiveprayer-key-title">
                        <a href="#" class="fiveprayer-key-name-link" data-id="<?php echo esc_attr($key->id); ?>">
                            <strong><?php echo isset($key->name) ? esc_html($key->name) : ''; ?></strong>
                        </a>
                        <?php if (isset($key->description) && $key->description): ?>
                            <span class="fiveprayer-key-description"><?php echo esc_html($key->description); ?></span>
                        <?php endif; ?>
                    </div>
                    <div class="fiveprayer-key-header-actions">
                        <span class="fiveprayer-status <?php echo esc_attr($status_class); ?>"><?php echo esc_html($status_text); ?></span>
                        <span class="fiveprayer-usage-badge"><?php
                        echo esc_html(sprintf(
                            /* translators: %s: number of API calls made. */
                            __('%s calls', 'fiveprayer'),
                            $usage_count
                        ));
                        ?></span>
                        <div class="fiveprayer-actions-wrapper">
                            <button class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline fiveprayer-view-key" data-id="<?php echo esc_attr($key->id); ?>" title="<?php esc_html_e('View Details', 'fiveprayer'); ?>">
                                <span class="dashicons dashicons-visibility"></span>
                            </button>
                            <button class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-primary fiveprayer-edit-key" data-id="<?php echo esc_attr($key->id); ?>" title="<?php esc_html_e('Edit API Key', 'fiveprayer'); ?>">
                                <span class="dashicons dashicons-edit"></span>
                            </button>
                            <?php if ($key->status === 'active' && !$is_expired): ?>
                                <button class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-warning fiveprayer-revoke-key" data-id="<?php echo esc_attr($key->id); ?>" title="<?php esc_html_e('Revoke API Key', 'fiveprayer'); ?>">
                                    <span class="dashicons dashicons-no-alt"></span>
                                </button>
                                <button class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-secondary fiveprayer-regenerate-key" data-id="<?php echo esc_attr($key->id); ?>" title="<?php esc_html_e('Regenerate API Key', 'fiveprayer'); ?>">
                                    <span class="dashicons dashicons-update"></span>
                                </button>
                            <?php elseif (isset($key->status) && $key->status === 'revoked'): ?>
                                <button class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-success fiveprayer-unrevoke-key" data-id="<?php echo esc_attr($key->id); ?>" title="<?php esc_html_e('Restore API Key', 'fiveprayer'); ?>">
                                    <span class="dashicons dashicons-yes"></span>
                                </button>
                            <?php endif; ?>
                            <button class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-danger fiveprayer-delete-key" data-id="<?php echo esc_attr($key->id); ?>" title="<?php esc_html_e('Delete API Key', 'fiveprayer'); ?>">
                                <span class="dashicons dashicons-trash"></span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="fiveprayer-key-masked-row">
                    <span class="fiveprayer-key-mask"><?php echo wp_kses_post($this->mask_api_key($key->id)); ?></span>
                </div>
            </div>
            <?php
        }
    }

    private function mask_api_key(int $key_id): string
    {
        // No part of the key is stored any more: only a keyed hash remains.
        return '<span class="fiveprayer-key-mask-text" title="' . esc_attr__('Keys are shown only when they are created', 'fiveprayer') . '">'
            . esc_html(str_repeat('•', 32))
            . '</span>'
            . ' <span class="fiveprayer-field-caption">' . esc_html__('shown only when created', 'fiveprayer') . '</span>';
    }

    public function render_security_page()
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'fiveprayer'));
        }


        $settings = \FivePrayer\Core\API\BruteForceSettings::get_settings();
        $tracked_ips = \FivePrayer\Core\API\BruteForceSettings::get_tracked_ips();
        ?>
        <div class="wrap fiveprayer-api-admin fiveprayer-api-security">
            <div class="fiveprayer-api-hero">
                <div class="fiveprayer-api-hero-icon"><span class="dashicons dashicons-shield"></span></div>
                <div>
                    <h1><?php esc_html_e('FivePrayer API Security', 'fiveprayer'); ?></h1>
                    <p><?php esc_html_e('Configure brute force protection settings and manage blocked IP addresses.', 'fiveprayer'); ?></p>
                </div>
            </div>

            <div class="fiveprayer-api-grid">
                <div class="fiveprayer-api-card">
                    <h2><?php esc_html_e('Brute Force Protection Settings', 'fiveprayer'); ?></h2>
                    <form id="fiveprayer-brute-force-form" class="fiveprayer-form">
                        <div class="fiveprayer-form-group">
                            <label class="fiveprayer-form-label">
                                <input type="checkbox" id="brute-force-enabled" name="enabled" <?php checked($settings['enabled']); ?>>
                                <?php esc_html_e('Enable brute force protection', 'fiveprayer'); ?>
                            </label>
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('When enabled, IPs with too many failed API key attempts will be temporarily blocked.', 'fiveprayer'); ?>
                            </p>
                        </div>

                        <div class="fiveprayer-form-group">
                            <label for="brute-force-max-attempts" class="fiveprayer-form-label">
                                <?php esc_html_e('Max Failed Attempts', 'fiveprayer'); ?>
                            </label>
                            <input type="number" id="brute-force-max-attempts" name="max_attempts" value="<?php echo esc_attr($settings['max_attempts']); ?>" min="1" max="1000" required>
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('Number of failed API key attempts before an IP is blocked. Default: 10.', 'fiveprayer'); ?>
                            </p>
                        </div>

                        <div class="fiveprayer-form-group">
                            <label for="brute-force-lockout-minutes" class="fiveprayer-form-label">
                                <?php esc_html_e('Lockout Duration (minutes)', 'fiveprayer'); ?>
                            </label>
                            <input type="number" id="brute-force-lockout-minutes" name="lockout_minutes" value="<?php echo esc_attr($settings['lockout_minutes']); ?>" min="1" max="10080" required>
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('How long an IP remains blocked after reaching the max failed attempts. Default: 15 minutes.', 'fiveprayer'); ?>
                            </p>
                        </div>

                        <hr class="fiveprayer-section-divider">

                        <div class="fiveprayer-form-group">
                            <h3><?php esc_html_e('Email Notifications', 'fiveprayer'); ?></h3>
                            <label class="fiveprayer-form-label">
                                <input type="checkbox" id="brute-force-notify-enabled" name="notify_enabled" <?php checked($settings['notify_enabled']); ?>>
                                <?php esc_html_e('Send email notification when an IP is blocked', 'fiveprayer'); ?>
                            </label>
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('Receive an email alert whenever an IP address reaches the max failed attempts threshold.', 'fiveprayer'); ?>
                            </p>
                        </div>

                        <div class="fiveprayer-form-group">
                            <label for="brute-force-notify-email" class="fiveprayer-form-label">
                                <?php esc_html_e('Notification Email', 'fiveprayer'); ?>
                            </label>
                            <input type="email" id="brute-force-notify-email" name="notify_email" value="<?php echo esc_attr($settings['notify_email']); ?>" placeholder="<?php echo esc_attr(get_option('admin_email')); ?>">
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('Email address to receive block notifications. Defaults to the WordPress admin email.', 'fiveprayer'); ?>
                            </p>
                        </div>

                        <div class="fiveprayer-form-group">
                            <label for="brute-force-notify-cooldown" class="fiveprayer-form-label">
                                <?php esc_html_e('Global Notification Cooldown (minutes)', 'fiveprayer'); ?>
                            </label>
                            <input type="number" id="brute-force-notify-cooldown" name="notify_cooldown" value="<?php echo esc_attr($settings['notify_cooldown']); ?>" min="0" max="10080" required>
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('Minimum time between any email notifications to prevent spam. This cooldown applies globally across all IPs. Set to 0 to disable. Default: 60 minutes.', 'fiveprayer'); ?>
                            </p>
                        </div>

                        <div class="fiveprayer-form-group">
                            <label class="fiveprayer-form-label">
                                <input type="checkbox" id="brute-force-escalate-cooldown" name="escalate_cooldown" <?php checked($settings['escalate_cooldown']); ?>>
                                <?php esc_html_e('Enable escalating cooldown (10min → 30min → 60min)', 'fiveprayer'); ?>
                            </label>
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('When enabled, the cooldown escalates with each new notification: 10 minutes → 30 minutes → 60 minutes. At the max level, a "stopped" notification is sent and no further alerts are delivered until you reset the cooldown. This prevents email flooding during coordinated attacks while still notifying you of each wave.', 'fiveprayer'); ?>
                            </p>
                            <?php
                            $cooldown_info = \FivePrayer\Core\API\BruteForceSettings::get_cooldown_level_info();
                            if ($settings['escalate_cooldown'] && $cooldown_info['level'] !== 0) : ?>
                                <div class="fiveprayer-cooldown-level-badge">
                                    <span class="fiveprayer-cooldown-badge-row">
                                        <span class="fiveprayer-cooldown-level-label"><?php esc_html_e('Current level:', 'fiveprayer'); ?></span>
                                        <span class="fiveprayer-cooldown-level-value"><?php echo esc_html($cooldown_info['label']); ?></span>
                                        <?php if ($cooldown_info['level'] !== 'stopped' && $cooldown_info['next_duration'] > 0) : ?>
                                            <span class="fiveprayer-cooldown-next-duration">
                                                <?php
                                                /* translators: %d: cooldown duration in minutes */
                                                echo esc_html(sprintf(__('(next: %d min)', 'fiveprayer'), $cooldown_info['next_duration']));
                                                ?>
                                            </span>
                                        <?php endif; ?>
                                        <button type="button" class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-warning fiveprayer-reset-cooldown-global">
                                            <?php esc_html_e('Reset', 'fiveprayer'); ?>
                                        </button>
                                    </span>
                                </div>
                            <?php endif; ?>
                        </div>

                        <?php $site_domain = wp_parse_url(home_url(), PHP_URL_HOST); ?>

                        <div class="fiveprayer-form-group">
                            <label for="brute-force-from-name" class="fiveprayer-form-label">
                                <?php esc_html_e('From Name', 'fiveprayer'); ?>
                            </label>
                            <input type="text" id="brute-force-from-name" name="from_name" value="<?php echo esc_attr($settings['from_name']); ?>" placeholder="<?php esc_attr_e('e.g., FivePrayer Alerts', 'fiveprayer'); ?>">
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('Custom display name shown as the sender of alert emails. If you use an SMTP plugin, configure the sender name there instead. Leave empty for the default WordPress name.', 'fiveprayer'); ?>
                            </p>
                        </div>

                        <div class="fiveprayer-form-group">
                            <label for="brute-force-from-email" class="fiveprayer-form-label">
                                <?php esc_html_e('From Email', 'fiveprayer'); ?>
                            </label>
                            <input type="email" id="brute-force-from-email" name="from_email" value="<?php echo esc_attr($settings['from_email']); ?>" placeholder="<?php
                            /* translators: %s: site domain name (e.g., example.com) */
                            echo esc_attr(sprintf(__('e.g., noreply@%s', 'fiveprayer'), $site_domain)); ?>">
                            <p class="fiveprayer-field-caption">
                                <?php
                                printf(
                                    /* translators: %s: site domain name (e.g., example.com) */
                                    esc_html__('Custom email address for alert emails. This is a basic override — SMTP plugins offer more advanced options. Leave empty to use the default WordPress address (wordpress@%s). After saving, test emails will show "From: Your Name <your@email.com>" at the top of the message.', 'fiveprayer'),
                                    esc_html($site_domain)
                                );
                                ?>
                            </p>
                        </div>

                        <div class="fiveprayer-form-group">
                            <label for="brute-force-subject" class="fiveprayer-form-label">
                                <?php esc_html_e('Email Subject', 'fiveprayer'); ?>
                            </label>
                            <input type="text" id="brute-force-subject" name="subject" value="<?php echo esc_attr($settings['subject']); ?>" placeholder="<?php esc_attr_e('e.g., {sitename} — Security Alert', 'fiveprayer'); ?>" autocomplete="off">
                            <p class="fiveprayer-field-caption">
                                <?php esc_html_e('Custom subject line for alert emails. Use {sitename} to insert your site name. Leave empty for the default subject.', 'fiveprayer'); ?>
                            </p>
                            <div class="fiveprayer-subject-preview" id="fiveprayer-subject-preview">
                                <div class="fiveprayer-subject-preview-row">
                                    <span class="fiveprayer-subject-preview-label"><?php esc_html_e('Block alert:', 'fiveprayer'); ?></span>
                                    <span class="fiveprayer-subject-preview-value" id="fiveprayer-subject-preview-real"></span>
                                </div>
                                <div class="fiveprayer-subject-preview-row">
                                    <span class="fiveprayer-subject-preview-label"><?php esc_html_e('Test email:', 'fiveprayer'); ?></span>
                                    <span class="fiveprayer-subject-preview-value" id="fiveprayer-subject-preview-test"></span>
                                </div>
                            </div>
                        </div>

                        <div class="fiveprayer-form-group">
                            <div class="fiveprayer-button-group">
                                <button type="submit" class="fiveprayer-btn fiveprayer-btn-primary">
                                    <?php esc_html_e('Save Settings', 'fiveprayer'); ?>
                                </button>
                                <button type="button" id="fiveprayer-send-test-email" class="fiveprayer-btn fiveprayer-btn-secondary">
                                    <?php esc_html_e('Send Test Email', 'fiveprayer'); ?>
                                </button>
                            </div>
                        </div>
                    </form>
                    <div id="fiveprayer-brute-force-result" class="fiveprayer-result" style="display: none;"></div>
                    <div id="fiveprayer-test-email-result" class="fiveprayer-result" style="display: none;"></div>
                </div>

                <div>
                    <div class="fiveprayer-api-card">
                        <div class="fiveprayer-card-header-with-btn">
                            <h2><?php esc_html_e('Blocked / Tracked IPs', 'fiveprayer'); ?></h2>
                            <?php
                            $cooldown_level_info = \FivePrayer\Core\API\BruteForceSettings::get_cooldown_level_info();
                            $has_active_level = $cooldown_level_info['level'] !== 0;
                            if ($has_active_level) : ?>
                                <button type="button" class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-warning fiveprayer-reset-cooldown-global">
                                    <?php esc_html_e('Reset', 'fiveprayer'); ?>
                                </button>
                            <?php endif; ?>
                        </div>
                    <p class="fiveprayer-field-caption">
                        <?php esc_html_e('IPs currently being tracked for failed API key attempts. IPs that have reached the max attempts threshold are marked as blocked.', 'fiveprayer'); ?>
                    </p>

                    <?php if (empty($tracked_ips)) : ?>
                        <div class="fiveprayer-no-keys">
                            <?php esc_html_e('No IPs are currently being tracked.', 'fiveprayer'); ?>
                        </div>
                    <?php else : ?>
                        <div class="fiveprayer-blocked-ips-table-wrapper">
                            <table class="fiveprayer-blocked-ips-table widefat">
                                <thead>
                                    <tr>
                                        <th><?php esc_html_e('IP Address', 'fiveprayer'); ?></th>
                                        <th><?php esc_html_e('Failed Attempts', 'fiveprayer'); ?></th>
                                        <th><?php esc_html_e('Status', 'fiveprayer'); ?></th>
                                        <th><?php esc_html_e('Expires', 'fiveprayer'); ?></th>
                                        <th><?php esc_html_e('Actions', 'fiveprayer'); ?></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($tracked_ips as $ip_data) : ?>
                                        <tr data-ip="<?php echo esc_attr($ip_data['ip']); ?>">
                                            <td><code><?php echo esc_html($ip_data['ip']); ?></code></td>
                                            <td><?php echo esc_html($ip_data['attempts']); ?></td>
                                            <td>
                                                <?php if ($ip_data['blocked']) : ?>
                                                    <span class="fiveprayer-status fiveprayer-status-inactive"><?php esc_html_e('Blocked', 'fiveprayer'); ?></span>
                                                <?php else : ?>
                                                    <span class="fiveprayer-status fiveprayer-status-active"><?php esc_html_e('Tracking', 'fiveprayer'); ?></span>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if ($ip_data['expires_at'] && $ip_data['expires_at'] > time()) : ?>
                                                    <?php echo esc_html(human_time_diff(time(), $ip_data['expires_at']) . ' ' . __('left', 'fiveprayer')); ?>
                                                <?php elseif ($ip_data['expires_at']) : ?>
                                                    <?php esc_html_e('Expired', 'fiveprayer'); ?>
                                                <?php else : ?>
                                                    <?php esc_html_e('Unknown', 'fiveprayer'); ?>
                                                <?php endif; ?>
                                            </td>
                                            <td>
                                                <?php if ($ip_data['ip'] === 'email_cooldown') : ?>
                                                    <div class="fiveprayer-cooldown-actions">
                                                        <button type="button" class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-warning fiveprayer-reset-cooldown-ip" data-ip="<?php echo esc_attr($ip_data['ip']); ?>">
                                                            <?php esc_html_e('Reset', 'fiveprayer'); ?>
                                                        </button>
                                                        <button type="button" class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline fiveprayer-expire-cooldown-ip" data-ip="<?php echo esc_attr($ip_data['ip']); ?>">
                                                            <?php esc_html_e('Expire', 'fiveprayer'); ?>
                                                        </button>
                                                    </div>
                                                <?php else : ?>
                                                    <button type="button" class="fiveprayer-btn fiveprayer-btn-sm fiveprayer-btn-outline-success fiveprayer-unblock-ip" data-ip="<?php echo esc_attr($ip_data['ip']); ?>">
                                                        <?php esc_html_e('Unblock', 'fiveprayer'); ?>
                                                    </button>
                                                <?php endif; ?>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>                </div>

                    <div class="fiveprayer-api-card fiveprayer-guide-card">
                        <h2><?php esc_html_e('Email Setup Guide', 'fiveprayer'); ?></h2>
                    <p class="fiveprayer-field-caption">
                        <?php esc_html_e('This plugin uses WordPress\'s built-in wp_mail() function. Delivery depends on your server environment.', 'fiveprayer'); ?>
                    </p>

                    <div class="fiveprayer-email-guide-section">
                        <h4 class="fiveprayer-email-guide-heading"><?php esc_html_e('🖥️ Local Development (localhost)', 'fiveprayer'); ?></h4>
                        <p class="fiveprayer-email-guide-text"><?php esc_html_e('Most local environments cannot send emails by default. Two options:', 'fiveprayer'); ?></p>
                        <ol class="fiveprayer-email-guide-list">
                            <li>
                                <strong><?php esc_html_e('Recommended:', 'fiveprayer'); ?></strong>
                                <?php esc_html_e('Install a free SMTP plugin like FluentSMTP or SureMail, configure with your email provider.', 'fiveprayer'); ?>
                            </li>
                            <li>
                                <strong><?php esc_html_e('No SMTP:', 'fiveprayer'); ?></strong>
                                <?php esc_html_e('Click "Send Test Email" above — content is logged to the debug log.', 'fiveprayer'); ?>
                            </li>
                        </ol>
                    </div>

                    <hr class="fiveprayer-section-divider">

                    <div class="fiveprayer-email-guide-section-top">
                        <h4 class="fiveprayer-email-guide-heading"><?php esc_html_e('☁️ Production Server', 'fiveprayer'); ?></h4>
                        <ol class="fiveprayer-email-guide-list">
                            <li>
                                <strong><?php esc_html_e('With SMTP plugin:', 'fiveprayer'); ?></strong>
                                <?php esc_html_e('Install a free SMTP plugin (FluentSMTP, SureMail, etc.) and configure with any provider.', 'fiveprayer'); ?>
                            </li>
                            <li>
                                <strong><?php esc_html_e('Without SMTP plugin:', 'fiveprayer'); ?></strong>
                                <?php esc_html_e('Some hosts support PHP mail(). Click "Send Test Email" to check. If it works, no plugin needed!', 'fiveprayer'); ?>
                            </li>
                        </ol>
                    </div>

                    <hr class="fiveprayer-section-divider">

                    <div class="fiveprayer-email-guide-section-top">
                        <h4 class="fiveprayer-email-guide-heading"><?php esc_html_e('🔧 Free SMTP Plugins', 'fiveprayer'); ?></h4>
                        <p class="fiveprayer-email-guide-text"><?php esc_html_e('There are many free SMTP plugins to choose from — pick the one that works best for you:', 'fiveprayer'); ?></p>
                        <ul class="fiveprayer-email-guide-list">
                            <li><?php esc_html_e('FluentSMTP — Free, modern UI, supports many providers', 'fiveprayer'); ?></li>
                            <li><?php esc_html_e('SureMail — Free, lightweight, simple setup', 'fiveprayer'); ?></li>
                        </ul>
                    </div>
                    <hr class="fiveprayer-section-divider">

                    <div class="fiveprayer-email-guide-section fiveprayer-email-guide-section-last">
                        <h4 class="fiveprayer-email-guide-heading"><?php esc_html_e('📋 Debug Log (No Config Needed)', 'fiveprayer'); ?></h4>
                        <p class="fiveprayer-email-guide-text"><?php esc_html_e('If WP_DEBUG is enabled (already active on this site), no need to edit wp-config.php.', 'fiveprayer'); ?></p>
                        <p class="fiveprayer-email-guide-text"><?php esc_html_e('When you click "Send Test Email", the full email content goes to:', 'fiveprayer'); ?></p>
                        <code class="fiveprayer-email-guide-code">
                            /wp-content/debug-*.log
                        </code>
                        <p class="fiveprayer-email-guide-note">
                            <em><?php esc_html_e('If debug is not enabled, install the free "WP Debugging" plugin — it enables logging without editing any core files.', 'fiveprayer'); ?></em>
                        </p>
                    </div>
                </div>
                </div>
            </div>
        <?php
    }
}

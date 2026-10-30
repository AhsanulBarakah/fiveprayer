<?php

namespace FivePrayer\Core\Admin\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

trait ApiAdminAjaxHandlerTrait
{
    public function handle_create_key()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to create API key', 'ApiAdmin');
            wp_die(esc_html__('You do not have sufficient permissions', 'fiveprayer'));
        }

        $name = sanitize_text_field(filter_input(INPUT_POST, 'name') ?: '');
        $description = sanitize_textarea_field(filter_input(INPUT_POST, 'description') ?: '');
        $expires_at = sanitize_text_field(filter_input(INPUT_POST, 'expires_at') ?: null);
        $key_prefix = sanitize_text_field(filter_input(INPUT_POST, 'key_prefix') ?: 'fp_');

        $allowed_domains = sanitize_text_field(filter_input(INPUT_POST, 'allowed_domains') ?: '');
        $allowed_ips = sanitize_text_field(filter_input(INPUT_POST, 'allowed_ips') ?: '');
        $allowed_endpoints = sanitize_text_field(filter_input(INPUT_POST, 'allowed_endpoints') ?: '');
        $permission_level = sanitize_text_field(filter_input(INPUT_POST, 'permission_level') ?: 'basic');
        $rate_limit = intval(filter_input(INPUT_POST, 'rate_limit') ?: 1000);

        $permissions = [
            'domains' => $allowed_domains ? explode(',', $allowed_domains) : [],
            'ips' => $allowed_ips ? explode(',', $allowed_ips) : [],
            'endpoints' => $allowed_endpoints ? explode(',', $allowed_endpoints) : [],
            'level' => $permission_level,
            'rate_limit' => $rate_limit
        ];

        Logger::info('Creating new API key: ' . $name, 'ApiAdmin');

        if (empty($name)) {
            Logger::warning('Attempt to create API key with empty name', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('Key name is required', 'fiveprayer')]);
        }

        $result = $this->api_key_manager->generate_key($name, $description, $expires_at, $permissions, $key_prefix);

        if ($result['success']) {
            Logger::info('Successfully created API key: ' . $name, 'ApiAdmin');
            wp_send_json_success([
                'message' => esc_html__('API key created successfully!', 'fiveprayer'),
                'api_key' => $result['api_key'],
                'name' => $name,
            ]);
        } else {
            Logger::error('Failed to create API key: ' . $result['error'], 'ApiAdmin');
            wp_send_json_error(['message' => esc_html($result['error'])]);
        }
    }

    public function handle_revoke_key()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to revoke API key', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $key_id = intval(filter_input(INPUT_POST, 'key_id', FILTER_VALIDATE_INT) ?: 0);

        Logger::info('Revoking API key with ID: ' . $key_id, 'ApiAdmin');

        if ($this->api_key_manager->revoke_key($key_id)) {
            Logger::info('Successfully revoked API key with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('API key revoked successfully', 'fiveprayer')]);
        } else {
            Logger::error('Failed to revoke API key with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('Failed to revoke API key', 'fiveprayer')]);
        }
    }

    public function handle_unrevoke_key()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to unrevoke API key', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $key_id = intval(filter_input(INPUT_POST, 'key_id', FILTER_VALIDATE_INT) ?: 0);

        Logger::info('Unrevoking API key with ID: ' . $key_id, 'ApiAdmin');

        if ($this->api_key_manager->unrevoke_key($key_id)) {
            Logger::info('Successfully unrevoked API key with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('API key restored successfully', 'fiveprayer')]);
        } else {
            Logger::error('Failed to unrevoke API key with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('Failed to restore API key', 'fiveprayer')]);
        }
    }

    public function handle_delete_key()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to delete API key', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $key_id = intval(filter_input(INPUT_POST, 'key_id', FILTER_VALIDATE_INT) ?: 0);

        Logger::info('Deleting API key with ID: ' . $key_id, 'ApiAdmin');

        if ($this->api_key_manager->delete_key($key_id)) {
            Logger::info('Successfully deleted API key with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('API key deleted successfully', 'fiveprayer')]);
        } else {
            Logger::error('Failed to delete API key with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('Failed to delete API key', 'fiveprayer')]);
        }
    }

    public function handle_regenerate_key()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to regenerate API key', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $key_id = intval(filter_input(INPUT_POST, 'key_id', FILTER_VALIDATE_INT) ?: 0);

        Logger::info('Regenerating API key with ID: ' . $key_id, 'ApiAdmin');

        $result = $this->api_key_manager->regenerate_key($key_id);

        if ($result['success']) {
            Logger::info('Successfully regenerated API key with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_success([
                'message' => esc_html__('API key regenerated successfully!', 'fiveprayer'),
                'api_key' => $result['api_key'],
            ]);
        } else {
            Logger::error('Failed to regenerate API key with ID: ' . $key_id . '. Error: ' . $result['error'], 'ApiAdmin');
            wp_send_json_error(['message' => esc_html($result['error'])]);
        }
    }

    public function handle_get_key()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to get API key details', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $key_id = intval(filter_input(INPUT_POST, 'key_id', FILTER_VALIDATE_INT) ?: 0);

        if (!$key_id) {
            wp_send_json_error(['message' => esc_html__('Invalid key ID', 'fiveprayer')]);
        }

        Logger::info('Fetching API key details for ID: ' . $key_id, 'ApiAdmin');

        $key = $this->api_key_manager->get_key($key_id);

        if (!$key) {
            wp_send_json_error(['message' => esc_html__('API key not found', 'fiveprayer')]);
        }

        $data = [
            'id' => $key->id,
            'name' => $key->name ?? '',
            'description' => $key->description ?? '',
            'status' => $key->status ?? 'unknown',
            'created_at' => isset($key->created_at) ? date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($key->created_at)) : '—',
            'expires_at' => isset($key->expires_at) && $key->expires_at ? date_i18n(get_option('date_format'), strtotime($key->expires_at)) : __('Never', 'fiveprayer'),
            'expires_raw' => $key->expires_at ?? '',
            'last_used' => isset($key->last_used) && $key->last_used ? date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($key->last_used)) : __('Never', 'fiveprayer'),
            'usage_count' => isset($key->usage_count) ? number_format($key->usage_count) : '0',
            'allowed_domains' => $key->allowed_domains ?? '',
            'allowed_ips' => $key->allowed_ips ?? '',
            'allowed_endpoints' => $key->allowed_endpoints ?? '',
            'rate_limit' => $key->rate_limit_per_hour ?? 1000,
            'is_expired' => isset($key->expires_at) && $key->expires_at && strtotime($key->expires_at) < time(),
        ];

        wp_send_json_success($data);
    }

    public function handle_copy_key()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to copy API key', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $key_id = intval(filter_input(INPUT_POST, 'key_id', FILTER_VALIDATE_INT) ?: 0);

        if (!$key_id) {
            wp_send_json_error(['message' => esc_html__('Invalid key ID', 'fiveprayer')]);
        }

        Logger::info('Fetching full API key for copy with ID: ' . $key_id, 'ApiAdmin');

        $full_key = $this->api_key_manager->get_full_key($key_id);

        if ($full_key === null) {
            Logger::error('API key not found for copy with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('API key not found', 'fiveprayer')]);
        }

        if ($full_key === '') {
            Logger::error('API key is empty (likely stored in legacy hash format) for ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('This key was stored in an older format and cannot be retrieved. Try regenerating it.', 'fiveprayer')]);
        }

        wp_send_json_success([
            'api_key' => $full_key,
        ]);
    }

    public function handle_migrate_legacy_keys()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to migrate legacy API keys', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        Logger::info('Starting legacy API key migration via admin AJAX', 'ApiAdmin');

        $result = $this->api_key_manager->migrate_legacy_keys();

        if ($result['success']) {
            $message = sprintf(
                /* translators: %d: number of keys migrated */
                __('Successfully migrated %d legacy API key(s). New keys were generated — please copy them now as they will not be shown again.', 'fiveprayer'),
                $result['migrated_count']
            );
            Logger::info('Legacy API key migration completed: ' . $result['migrated_count'] . ' migrated', 'ApiAdmin');
            wp_send_json_success([
                'message' => $message,
                'migrated' => $result['migrated'],
                'migrated_count' => $result['migrated_count'],
            ]);
        } else {
            $message = sprintf(
                /* translators: 1: number of keys migrated, 2: number of errors */
                __('Migration completed with %1$d migrated and %2$d error(s).', 'fiveprayer'),
                $result['migrated_count'],
                $result['error_count']
            );
            Logger::error('Legacy API key migration had errors', 'ApiAdmin');
            wp_send_json_error([
                'message' => $message,
                'errors' => $result['errors'],
            ]);
        }
    }

    public function handle_save_brute_force_settings()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to save brute force settings', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $enabled = filter_input(INPUT_POST, 'enabled', FILTER_VALIDATE_BOOLEAN);
        $max_attempts = filter_input(INPUT_POST, 'max_attempts', FILTER_VALIDATE_INT);
        $lockout_minutes = filter_input(INPUT_POST, 'lockout_minutes', FILTER_VALIDATE_INT);
        $notify_enabled = filter_input(INPUT_POST, 'notify_enabled', FILTER_VALIDATE_BOOLEAN);
        $notify_email = filter_input(INPUT_POST, 'notify_email', FILTER_SANITIZE_EMAIL);
        $notify_cooldown = filter_input(INPUT_POST, 'notify_cooldown', FILTER_VALIDATE_INT);
        $from_name = filter_input(INPUT_POST, 'from_name');
        $from_email = filter_input(INPUT_POST, 'from_email', FILTER_SANITIZE_EMAIL);
        $subject = filter_input(INPUT_POST, 'subject');
        $escalate_cooldown = filter_input(INPUT_POST, 'escalate_cooldown', FILTER_VALIDATE_BOOLEAN);

        $settings = [
            'enabled' => $enabled,
            'max_attempts' => $max_attempts !== false ? $max_attempts : 10,
            'lockout_minutes' => $lockout_minutes !== false ? $lockout_minutes : 15,
            'notify_enabled' => $notify_enabled,
            'notify_email' => $notify_email ?: '',
            'notify_cooldown' => $notify_cooldown !== false ? $notify_cooldown : 60,
            'from_name' => $from_name ? sanitize_text_field($from_name) : '',
            'from_email' => $from_email ?: '',
            'subject' => $subject ? sanitize_text_field($subject) : '',
            'escalate_cooldown' => $escalate_cooldown,
        ];

        Logger::info('Saving brute force settings', 'ApiAdmin');

        if (\FivePrayer\Core\API\BruteForceSettings::save_settings($settings)) {
            Logger::info('Brute force settings saved successfully', 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('Brute force settings saved successfully.', 'fiveprayer')]);
        } else {
            Logger::error('Failed to save brute force settings', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('Failed to save brute force settings.', 'fiveprayer')]);
        }
    }

    public function handle_unblock_ip()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to unblock IP', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $ip = filter_input(INPUT_POST, 'ip', FILTER_VALIDATE_IP);
        if (!$ip) {
            wp_send_json_error(['message' => esc_html__('Invalid IP address.', 'fiveprayer')]);
        }

        Logger::info('Unblocking IP: ' . $ip, 'ApiAdmin');

        if (\FivePrayer\Core\API\BruteForceSettings::unblock_ip($ip)) {
            Logger::info('IP unblocked successfully: ' . $ip, 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('IP unblocked successfully.', 'fiveprayer')]);
        } else {
            Logger::warning('Failed to unblock IP or IP was not blocked: ' . $ip, 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('IP was not blocked or has already expired.', 'fiveprayer')]);
        }
    }

    public function handle_reset_email_cooldown()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to reset email cooldown', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        Logger::info('Resetting email notification cooldown', 'ApiAdmin');

        if (\FivePrayer\Core\API\BruteForceSettings::reset_email_cooldown()) {
            Logger::info('Email cooldown reset successfully', 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('Cooldown reset. You can now send another test email.', 'fiveprayer')]);
        } else {
            Logger::warning('No active cooldown to reset', 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('No active cooldown found. You can send a test email anytime.', 'fiveprayer')]);
        }
    }

    public function handle_expire_email_cooldown()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to expire email cooldown', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        Logger::info('Expiring email notification cooldown (keeping level)', 'ApiAdmin');

        if (\FivePrayer\Core\API\BruteForceSettings::expire_email_cooldown()) {
            Logger::info('Email cooldown expired successfully', 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('Cooldown expired. Level preserved for next escalation.', 'fiveprayer')]);
        } else {
            Logger::warning('No active cooldown to expire', 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('No active cooldown found.', 'fiveprayer')]);
        }
    }

    public function handle_send_test_email()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to send test email', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        Logger::info('Sending brute force test email', 'ApiAdmin');

        $result = \FivePrayer\Core\API\BruteForceSettings::send_test_email();

        if ($result['success']) {
            Logger::info('Test email sent successfully', 'ApiAdmin');
            wp_send_json_success(['message' => esc_html($result['message'])]);
        } else {
            Logger::error('Test email failed to send', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html($result['message'])]);
        }
    }

    public function handle_update_key()
    {
        check_ajax_referer('fp_api_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            Logger::warning('Unauthorized attempt to update API key', 'ApiAdmin');
            wp_send_json_error(['message' => esc_html__('You do not have sufficient permissions', 'fiveprayer')]);
        }

        $key_id = intval(filter_input(INPUT_POST, 'key_id', FILTER_VALIDATE_INT) ?: 0);

        if (!$key_id) {
            wp_send_json_error(['message' => esc_html__('Invalid key ID', 'fiveprayer')]);
        }

        Logger::info('Updating API key with ID: ' . $key_id, 'ApiAdmin');

        if (!$this->api_key_manager->get_key($key_id)) {
            wp_send_json_error(['message' => esc_html__('API key not found', 'fiveprayer')]);
        }

        $data = [];

        $name = filter_input(INPUT_POST, 'name');
        if ($name !== null) {
            $data['name'] = sanitize_text_field($name);
        }

        $description = filter_input(INPUT_POST, 'description');
        if ($description !== null) {
            $data['description'] = sanitize_textarea_field($description);
        }

        $expires_at = filter_input(INPUT_POST, 'expires_at');
        if ($expires_at !== null) {
            $data['expires_at'] = sanitize_text_field($expires_at ?: '');
        }

        $allowed_domains = filter_input(INPUT_POST, 'allowed_domains');
        if ($allowed_domains !== null) {
            $data['allowed_domains'] = sanitize_text_field($allowed_domains);
        }

        $allowed_ips = filter_input(INPUT_POST, 'allowed_ips');
        if ($allowed_ips !== null) {
            $data['allowed_ips'] = sanitize_text_field($allowed_ips);
        }

        $allowed_endpoints = filter_input(INPUT_POST, 'allowed_endpoints');
        if ($allowed_endpoints !== null) {
            $data['allowed_endpoints'] = sanitize_text_field($allowed_endpoints);
        }

        $rate_limit = filter_input(INPUT_POST, 'rate_limit', FILTER_VALIDATE_INT);
        if ($rate_limit !== false && $rate_limit !== null) {
            $data['rate_limit_per_hour'] = intval($rate_limit);
        }

        if (empty($data)) {
            wp_send_json_error(['message' => esc_html__('No data provided to update', 'fiveprayer')]);
        }

        $result = $this->api_key_manager->update_key($key_id, $data);

        if ($result['success']) {
            Logger::info('Successfully updated API key with ID: ' . $key_id, 'ApiAdmin');
            wp_send_json_success(['message' => esc_html__('API key updated successfully!', 'fiveprayer')]);
        } else {
            Logger::error('Failed to update API key with ID: ' . $key_id . '. Error: ' . $result['error'], 'ApiAdmin');
            wp_send_json_error(['message' => esc_html($result['error'])]);
        }
    }
}

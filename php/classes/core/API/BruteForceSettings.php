<?php

namespace FivePrayer\Core\API;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

/**
 * Manages brute force protection settings and blocked IP queries.
 */
class BruteForceSettings
{
    public const OPTION_NAME = 'fp_brute_force_settings';
    public const TRANSIENT_PREFIX = 'fp_brute_';
    public const COOLDOWN_LEVEL_OPTION = 'fp_brute_cooldown_level';

    /**
     * Timestamp written when escalation reaches the "stopped" level.
     */
    public const STOPPED_OPTION = 'fp_brute_stopped_at';

    /**
     * How long "stopped" silences alerts before it resets itself.
     */
    private const STOPPED_RESET_SECONDS = DAY_IN_SECONDS;

    /**
     * Hard ceiling on per-address transient rows.
     *
     * An attacker cycling addresses could otherwise create one option row per
     * request and grow wp_options without bound.
     */
    private const MAX_TRACKED_IPS = 500;

    /**
     * Escalating cooldown durations in minutes.
     * Level 0 → 10 min, Level 1 → 30 min, Level 2 → 60 min + stopped.
     */
    private const ESCALATION_LEVELS = [10, 30, 60];

    /**
     * Default brute force protection settings.
     */
    public static function get_defaults(): array
    {
        return [
            'enabled' => true,
            'max_attempts' => 10,
            'lockout_minutes' => 15,
            'notify_enabled' => false,
            'notify_email' => '',
            'notify_cooldown' => 60,
            'from_name' => '',
            'from_email' => '',
            'subject' => '',
            'escalate_cooldown' => false,
        ];
    }

    /**
     * Get the email subject line, using a custom subject if set, with {sitename} placeholder support.
     *
     * @param string $default Default subject if no custom subject is configured.
     * @return string Processed subject line with {sitename} replaced by the site name.
     */
    private static function get_subject(string $default): string
    {
        $settings = self::get_settings();
        $custom = !empty($settings['subject']) ? trim($settings['subject']) : '';

        if (empty($custom)) {
            return $default;
        }

        $site_name = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
        return str_replace('{sitename}', $site_name, $custom);
    }

    /**
     * Get current brute force settings with defaults merged.
     */
    /**
     * @var array|null Cached settings to avoid repeated DB queries.
     */
    private static $cached_settings = null;

    public static function get_settings(): array
    {
        if (self::$cached_settings !== null) {
            return self::$cached_settings;
        }

        $settings = get_option(self::OPTION_NAME, []);
        if (!is_array($settings)) {
            $settings = [];
        }

        self::$cached_settings = wp_parse_args($settings, self::get_defaults());
        return self::$cached_settings;
    }

    /**
     * Clear the cached settings so the next call re-fetches from DB.
     */
    public static function clear_settings_cache(): void
    {
        self::$cached_settings = null;
    }

    /**
     * Save brute force settings.
     */
    public static function save_settings(array $settings): bool
    {
        $defaults = self::get_defaults();

        $sanitized = [
            'enabled' => !empty($settings['enabled']),
            'max_attempts' => isset($settings['max_attempts']) ? absint($settings['max_attempts']) : $defaults['max_attempts'],
            'lockout_minutes' => isset($settings['lockout_minutes']) ? absint($settings['lockout_minutes']) : $defaults['lockout_minutes'],
            'notify_enabled' => !empty($settings['notify_enabled']),
            'notify_email' => isset($settings['notify_email']) ? sanitize_email($settings['notify_email']) : $defaults['notify_email'],
            'notify_cooldown' => isset($settings['notify_cooldown']) ? absint($settings['notify_cooldown']) : $defaults['notify_cooldown'],
            'from_name' => isset($settings['from_name']) ? sanitize_text_field($settings['from_name']) : $defaults['from_name'],
            'from_email' => isset($settings['from_email']) ? sanitize_email($settings['from_email']) : $defaults['from_email'],
            'subject' => isset($settings['subject']) ? sanitize_text_field($settings['subject']) : $defaults['subject'],
            'escalate_cooldown' => !empty($settings['escalate_cooldown']),
        ];

        // Enforce sensible minimums
        $sanitized['max_attempts'] = max(1, $sanitized['max_attempts']);
        $sanitized['lockout_minutes'] = max(1, $sanitized['lockout_minutes']);
        $sanitized['notify_cooldown'] = max(0, $sanitized['notify_cooldown']);

        // Fallback to admin email if no notification email is provided
        if (empty($sanitized['notify_email'])) {
            $sanitized['notify_email'] = get_option('admin_email');
        }

        $result = update_option(self::OPTION_NAME, $sanitized);

        // Clear the static cache so next read picks up the new values
        self::clear_settings_cache();

        return $result;
    }

    /**
     * Check if brute force protection is enabled.
     */
    public static function is_enabled(): bool
    {
        $settings = self::get_settings();
        return !empty($settings['enabled']);
    }

    /**
     * Get the maximum allowed failed attempts before blocking.
     */
    public static function get_max_attempts(): int
    {
        $settings = self::get_settings();
        return max(1, absint($settings['max_attempts'] ?? 10));
    }

    /**
     * Get the lockout duration in minutes.
     */
    public static function get_lockout_minutes(): int
    {
        $settings = self::get_settings();
        return max(1, absint($settings['lockout_minutes'] ?? 15));
    }

    /**
     * Get the lockout duration in seconds.
     */
    public static function get_lockout_seconds(): int
    {
        return self::get_lockout_minutes() * MINUTE_IN_SECONDS;
    }

    /**
     * Reduce an address to the unit that is tracked.
     *
     * An attacker owns a whole IPv6 /64, so counting a single address lets
     * them rotate through the block with a new source address per request. The
     * lower 64 bits are zeroed and the /64 network is tracked instead.
     *
     * @param string $ip IPv4 or IPv6 address.
     * @return string Tracked address.
     */
    public static function get_tracked_address(string $ip): string
    {
        $packed = @inet_pton($ip); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- Malformed input is expected and handled by the false return.

        if (false === $packed || strlen($packed) !== 16) {
            return $ip;
        }

        $network = substr($packed, 0, 8) . str_repeat("\0", 8);
        $printable = inet_ntop($network);

        return false === $printable ? $ip : $printable;
    }

    /**
     * Build the transient key for an IP address.
     */
    public static function get_transient_key(string $ip): string
    {
        return self::TRANSIENT_PREFIX . self::get_tracked_address($ip);
    }

    /**
     * Track a failed attempt for an IP address.
     */
    public static function track_failed_attempt(string $ip): void
    {
        if (!$ip) {
            return;
        }

        $transient_key = self::get_transient_key($ip);
        $new_attempts  = self::increment_attempt_counter($transient_key, self::get_lockout_seconds());

        // A brand new counter row is the only moment the table can grow.
        if (1 === $new_attempts) {
            self::prune_tracked_addresses();
        }

        // Send notification exactly when the IP crosses the block threshold
        if ($new_attempts === self::get_max_attempts()) {
            self::send_block_notification($ip);
        }
    }

    /**
     * Increment the failed-attempt counter for one transient key.
     *
     * With a persistent object cache `wp_cache_incr()` updates the value
     * atomically, so two simultaneous failures cannot both read N and write
     * N+1. The transient is still written so the admin list and the block check
     * see the current value; without a persistent cache the previous
     * read-then-write behaviour is the only option.
     *
     * @param string $transient_key Transient name.
     * @param int    $ttl           Lifetime in seconds.
     * @return int New attempt count.
     */
    private static function increment_attempt_counter(string $transient_key, int $ttl): int
    {
        if (wp_using_ext_object_cache()) {
            $cache_key = 'fiveprayer_brute_' . md5($transient_key);

            if (false === wp_cache_get($cache_key, 'fiveprayer')) {
                wp_cache_set($cache_key, 1, 'fiveprayer', $ttl);
                set_transient($transient_key, 1, $ttl);
                return 1;
            }

            $new_count = wp_cache_incr($cache_key, 1, 'fiveprayer');
            $new_count = $new_count > 0 ? (int) $new_count : 1;
            set_transient($transient_key, $new_count, $ttl);

            return $new_count;
        }

        $attempts     = get_transient($transient_key);
        $new_attempts = false === $attempts ? 1 : absint($attempts) + 1;
        set_transient($transient_key, $new_attempts, $ttl);

        return $new_attempts;
    }

    /**
     * Delete the oldest tracked addresses when the cap is exceeded.
     */
    private static function prune_tracked_addresses(): void
    {
        global $wpdb;

        $prefix = '_transient_' . self::TRANSIENT_PREFIX;
        $like   = $wpdb->esc_like($prefix) . '%';

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching -- Bounded cleanup on the failure path.
        $count = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$wpdb->options} WHERE option_name LIKE %s AND option_name <> %s",
            $like,
            '_transient_fp_brute_email_cooldown'
        ));

        if ($count <= self::MAX_TRACKED_IPS) {
            return;
        }

        $excess = $count - self::MAX_TRACKED_IPS;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
        $names = $wpdb->get_col($wpdb->prepare(
            "SELECT option_name FROM {$wpdb->options} WHERE option_name LIKE %s AND option_name <> %s ORDER BY option_id ASC LIMIT %d",
            $like,
            '_transient_fp_brute_email_cooldown',
            $excess
        ));

        foreach ($names as $name) {
            delete_transient(substr((string) $name, strlen('_transient_')));
        }
    }

    /**
     * Reset the "stopped" escalation after its window elapses.
     *
     * Without this, one burst of blocked addresses silenced alerts forever and
     * the only way back was the manual Reset button.
     */
    public static function maybe_reset_stopped_level(): void
    {
        if ('stopped' !== get_option(self::COOLDOWN_LEVEL_OPTION)) {
            return;
        }

        $since = (int) get_option(self::STOPPED_OPTION, 0);

        if ($since > 0 && (time() - $since) < self::STOPPED_RESET_SECONDS) {
            return;
        }

        delete_option(self::COOLDOWN_LEVEL_OPTION);
        delete_option(self::STOPPED_OPTION);
        delete_transient('fp_brute_email_cooldown');

        Logger::info('Brute-force alert escalation reset after the stopped window elapsed.', 'BruteForceSettings');
    }

    /**
     * Add custom From headers to the email header array using stored settings.
     */
    private static function apply_custom_from_headers(array $headers): array
    {
        $settings = self::get_settings();

        if (!empty($settings['from_email']) && is_email($settings['from_email'])) {
            if (!empty($settings['from_name'])) {
                $headers[] = 'From: ' . sanitize_text_field($settings['from_name']) . ' <' . sanitize_email($settings['from_email']) . '>';
            } else {
                $headers[] = 'From: ' . sanitize_email($settings['from_email']);
            }
        }

        return $headers;
    }

    /**
     * Send an email notification when an IP is blocked.
     */
    private static function send_block_notification(string $ip): void
    {
        $settings = self::get_settings();

        if (empty($settings['notify_enabled'])) {
            return;
        }

        $to = !empty($settings['notify_email']) ? $settings['notify_email'] : get_option('admin_email');
        if (!is_email($to)) {
            return;
        }

        // Respect notification cooldown to prevent email floods
        $cooldown_key = 'fp_brute_email_cooldown';

        // A stopped escalation expires on its own after the configured window.
        self::maybe_reset_stopped_level();

        // If escalation is enabled and we're in 'stopped' mode, skip all
        if (!empty($settings['escalate_cooldown']) && get_option(self::COOLDOWN_LEVEL_OPTION) === 'stopped') {
            return;
        }

        if (get_transient($cooldown_key)) {
            return;
        }

        $site_name = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
        $default_subject = sprintf(
            /* translators: %s: site name */
            __('[%s] API Security Alert: IP Blocked', 'fiveprayer'),
            $site_name
        );
        $subject = apply_filters(
            'fiveprayer_brute_force_email_subject',
            self::get_subject($default_subject),
            $ip
        );

        $unblock_url = admin_url('admin.php?page=fiveprayer-api-security');
        $lockout_minutes = self::get_lockout_minutes();
        $date = wp_date(get_option('date_format') . ' ' . get_option('time_format'));

        $message = apply_filters(
            'fiveprayer_brute_force_email_message',
            sprintf(
                /* translators: 1: IP address, 2: date/time, 3: lockout minutes, 4: unblock URL */
                __("An IP address has been temporarily blocked due to repeated failed API key attempts.\n\nIP Address: %1\$s\nTime: %2\$s\nLockout Duration: %3\$d minutes\n\nYou can unblock this IP from the admin panel:\n%4\$s\n\n— FivePrayer API Security", 'fiveprayer'),
                sanitize_text_field($ip),
                sanitize_text_field($date),
                $lockout_minutes,
                $unblock_url
            ),
            $ip,
            $date,
            $lockout_minutes,
            $unblock_url
        );

        $headers = apply_filters('fiveprayer_brute_force_email_headers', ['Content-Type: text/plain; charset=UTF-8'], $ip);
        $headers = self::apply_custom_from_headers($headers);
        $sent = wp_mail($to, $subject, $message, $headers);

        if ($sent) {
            if (!empty($settings['escalate_cooldown'])) {
                // Escalating cooldown: 10min → 30min → 60min + stopped
                $current_level = (int) get_option(self::COOLDOWN_LEVEL_OPTION, 0);
                $escalation_minutes = isset(self::ESCALATION_LEVELS[$current_level])
                    ? self::ESCALATION_LEVELS[$current_level]
                    : end(self::ESCALATION_LEVELS);

                set_transient($cooldown_key, 1, $escalation_minutes * MINUTE_IN_SECONDS);

                if ($current_level >= count(self::ESCALATION_LEVELS) - 1) {
                    // Reached max level — send stopped notification and remember
                    // when, so the level can reset itself later.
                    self::send_stopped_notification($to, $settings);
                    update_option(self::COOLDOWN_LEVEL_OPTION, 'stopped');
                    update_option(self::STOPPED_OPTION, time());
                } else {
                    update_option(self::COOLDOWN_LEVEL_OPTION, $current_level + 1);
                }
            } else {
                // Fixed cooldown (original behavior)
                $cooldown = max(0, absint($settings['notify_cooldown'] ?? 60));
                if ($cooldown > 0) {
                    set_transient($cooldown_key, 1, $cooldown * MINUTE_IN_SECONDS);
                }
            }
        } else {
            Logger::error('Failed to send brute force block notification to ' . $to . ' for IP: ' . $ip, 'BruteForceSettings');
        }
    }

    /**
     * Send a "stopped" notification when the escalation max level is reached.
     * Informs the admin that alerts are paused due to high IP block volume.
     */
    private static function send_stopped_notification(string $to, array $settings): void
    {
        $site_name = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
        $admin_url = admin_url('admin.php?page=fiveprayer-api-security');

        $subject = sprintf(
            /* translators: %s: site name */
            __('[%s] API Security — Notifications Paused (High Volume)', 'fiveprayer'),
            $site_name
        );

        $message = sprintf(
            /* translators: 1: admin URL */
            __("FivePrayer API Security has temporarily paused email notifications due to a high volume of blocked IP addresses.\n\nMultiple IP addresses have been blocked in a short period. To prevent flooding your inbox, email alerts are now suspended.\n\nTo resume notifications:\n1. Go to your WordPress admin\n2. Navigate to FivePrayer → API Security\n3. Click the \"Reset\" button on the cooldown entry in the Blocked / Tracked IPs table\n\nAdmin URL: %1\$s\n\n— FivePrayer API Security", 'fiveprayer'),
            $admin_url
        );

        $headers = ['Content-Type: text/plain; charset=UTF-8'];
        $headers = self::apply_custom_from_headers($headers);

        wp_mail($to, $subject, $message, $headers);
    }

    /**
     * Send a test email to verify the notification configuration.
     *
     * Uses the same email template as a real block notification but with
     * a clear "[TEST]" prefix so recipients know it is only a test.
     */
    public static function send_test_email(): array
    {
        $settings = self::get_settings();

        $to = !empty($settings['notify_email']) ? $settings['notify_email'] : get_option('admin_email');
        if (!is_email($to)) {
            return [
                'success' => false,
                'message' => __('Invalid notification email address configured.', 'fiveprayer'),
            ];
        }

        $site_name = wp_specialchars_decode(get_bloginfo('name'), ENT_QUOTES);
        $test_ip = '127.0.0.1';
        $date = wp_date(get_option('date_format') . ' ' . get_option('time_format'));
        $lockout_minutes = self::get_lockout_minutes();
        $unblock_url = admin_url('admin.php?page=fiveprayer-api-security');

        $default_subject = sprintf(
            /* translators: %s: site name */
            __('[%s] API Security Alert [TEST] — IP Blocked Notification Test', 'fiveprayer'),
            $site_name
        );
        $custom_subject = self::get_subject($default_subject);
        // If using a custom subject, prepend [TEST] to indicate this is a test
        if (!empty($settings['subject'])) {
            $custom_subject = '[TEST] ' . $custom_subject;
        }
        $subject = apply_filters(
            'fiveprayer_brute_force_email_subject',
            $custom_subject,
            $test_ip
        );

        $message = apply_filters(
            'fiveprayer_brute_force_email_message',
            sprintf(
                /* translators: 1: IP address, 2: date/time, 3: lockout minutes, 4: unblock URL */
                __("This is a TEST email from the FivePrayer API Security system.\n\nYour email notification settings are working correctly!\n\nIf this were a real security event, you would receive an alert like this:\n\n---\nIP Address: %1\$s\nTime: %2\$s\nLockout Duration: %3\$d minutes\nUnblock URL: %4\$s\n---\n\nNo action is needed. This was only a test.\n\n— FivePrayer API Security", 'fiveprayer'),
                sanitize_text_field($test_ip),
                sanitize_text_field($date),
                $lockout_minutes,
                $unblock_url
            ),
            $test_ip,
            $date,
            $lockout_minutes,
            $unblock_url
        );

        $headers = apply_filters('fiveprayer_brute_force_email_headers', ['Content-Type: text/plain; charset=UTF-8'], $test_ip);

        // Log that the message was prepared, but never the body: it contains
        // the recipient address and is a data leak with no diagnostic value.
        Logger::info('Test email prepared — To: ' . $to . ' | Subject: ' . $subject, 'BruteForceSettings');

        $headers = self::apply_custom_from_headers($headers);
        $sent = wp_mail($to, $subject, $message, $headers);

        if ($sent) {
            Logger::info('Test email sent successfully to ' . $to, 'BruteForceSettings');
            return [
                'success' => true,
                'message' => sprintf(
                    /* translators: %s: email address */
                    __('Test email sent to %s — check the debug log for full details.', 'fiveprayer'),
                    $to
                ),
            ];
        }

        Logger::error('Failed to send test email to ' . $to, 'BruteForceSettings');
        return [
            'success' => false,
            'message' => __('Failed to send email. Install an SMTP plugin or configure your server to send mail.', 'fiveprayer'),
        ];
    }

    /**
     * Check if an IP address is currently blocked.
     */
    public static function is_ip_blocked(string $ip): bool
    {
        if (!$ip) {
            return false;
        }

        $attempts = get_transient(self::get_transient_key($ip));
        if ($attempts === false) {
            return false;
        }

        return absint($attempts) >= self::get_max_attempts();
    }

    /**
     * Unblock an IP address by deleting its transient.
     */
    public static function unblock_ip(string $ip): bool
    {
        if (!$ip) {
            return false;
        }

        return delete_transient(self::get_transient_key($ip));
    }

    /**
     * Reset the email notification cooldown so another test email can be sent immediately.
     * Also resets the escalating cooldown level back to 0.
     */
    public static function reset_email_cooldown(): bool
    {
        delete_option(self::COOLDOWN_LEVEL_OPTION);
        delete_option(self::STOPPED_OPTION);
        return delete_transient('fp_brute_email_cooldown');
    }

    /**
     * Expire only the cooldown timer, keeping the escalation level intact.
     * Use this to advance to the next escalation level without waiting.
     */
    public static function expire_email_cooldown(): bool
    {
        return delete_transient('fp_brute_email_cooldown');
    }

    /**
     * Get the current escalating cooldown level name for display.
     *
     * @return array{level: string, next_duration: int}
     */
    public static function get_cooldown_level_info(): array
    {
        self::maybe_reset_stopped_level();

        $level = get_option(self::COOLDOWN_LEVEL_OPTION, 0);

        if ($level === 'stopped') {
            return [
                'level' => 'stopped',
                'label' => __('Paused (high volume)', 'fiveprayer'),
                'next_duration' => 0,
            ];
        }

        $current = (int) $level;
        $next_duration = isset(self::ESCALATION_LEVELS[$current])
            ? self::ESCALATION_LEVELS[$current]
            : end(self::ESCALATION_LEVELS);

        if ($current === 0) {
            $label = __('None', 'fiveprayer');
        } else {
            /* translators: %d: cooldown level number (1, 2, 3) */
            $label = sprintf(__('Level %d', 'fiveprayer'), $current);
        }

        return [
            'level' => $level,
            'label' => $label,
            'next_duration' => $next_duration,
        ];
    }

    /**
     * Get a list of currently blocked or tracked IPs.
     *
     * @return array<int, array{ip: string, attempts: int, expires_at: int}>
     */
    public static function get_tracked_ips(): array
    {
        global $wpdb;

        $prefix = '_transient_' . self::TRANSIENT_PREFIX;
        $like = $wpdb->esc_like($prefix) . '%';

        // Deliberately uncached: this feeds the admin security panel, which has to
        // show the live block list. A cached copy would hide a block that was just
        // applied or keep showing an IP that an administrator has just released.
        $rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
            $wpdb->prepare(
                "SELECT option_name, option_value FROM {$wpdb->options} WHERE option_name LIKE %s",
                $like
            )
        );

        $tracked = [];
        $max_attempts = self::get_max_attempts();

        foreach ($rows as $row) {
            $ip = str_replace($prefix, '', $row->option_name);

            // The e-mail flood-control transient shares the prefix but is not
            // an address, and must not appear in the tracked list.
            if (!$ip || 'email_cooldown' === $ip) {
                continue;
            }

            $attempts = absint($row->option_value);
            $expires_at = (int) get_option('_transient_timeout_' . self::TRANSIENT_PREFIX . $ip, 0);

            $tracked[] = [
                'ip' => $ip,
                'attempts' => $attempts,
                'expires_at' => $expires_at,
                'blocked' => $attempts >= $max_attempts,
            ];
        }

        // Sort by blocked status, then by attempts descending
        usort($tracked, function ($a, $b) {
            if ($a['blocked'] !== $b['blocked']) {
                return $a['blocked'] ? -1 : 1;
            }
            return $b['attempts'] <=> $a['attempts'];
        });

        return $tracked;
    }
}

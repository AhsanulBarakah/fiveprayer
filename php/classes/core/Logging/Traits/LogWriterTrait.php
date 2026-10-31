<?php

namespace FivePrayer\Core\Logging\Traits;

defined('ABSPATH') || exit;

/**
 * Trait for writing log messages with deduplication
 */
trait LogWriterTrait
{
    private static array $logged_entries = [];

    public static function debug(string $message, string $context = ''): void
    {
        if (self::is_log_level_enabled(self::LOG_LEVEL_DEBUG)) {
            if (!self::has_logged_entry('DEBUG', $message, $context)) {
                $formatted_message = self::format_message('DEBUG', $message, $context);
                self::write_log($formatted_message);
                self::mark_logged_entry('DEBUG', $message, $context);
            }
        }
    }

    public static function info(string $message, string $context = ''): void
    {
        if (self::is_log_level_enabled(self::LOG_LEVEL_INFO)) {
            if (!self::has_logged_entry('INFO', $message, $context)) {
                $formatted_message = self::format_message('INFO', $message, $context);
                self::write_log($formatted_message);
                self::mark_logged_entry('INFO', $message, $context);
            }
        }
    }

    public static function warning(string $message, string $context = ''): void
    {
        if (self::is_log_level_enabled(self::LOG_LEVEL_WARNING)) {
            if (!self::has_logged_entry('WARNING', $message, $context)) {
                $formatted_message = self::format_message('WARNING', $message, $context);
                self::write_log($formatted_message);
                self::mark_logged_entry('WARNING', $message, $context);
            }
        }
    }

    public static function error(string $message, string $context = ''): void
    {
        if (self::is_log_level_enabled(self::LOG_LEVEL_ERROR)) {
            if (!self::has_logged_entry('ERROR', $message, $context)) {
                $formatted_message = self::format_message('ERROR', $message, $context);
                self::write_log($formatted_message);
                self::mark_logged_entry('ERROR', $message, $context);
            }
        }
    }

    private static function format_message(string $level, string $message, string $context = ''): string
    {
        $timestamp = gmdate('Y-m-d H:i:s');
        $context_part = $context ? " [{$context}]" : '';

        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_debug_backtrace -- Builds the caller context included in every log line.
        $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 3);
        $caller = '';
        if (isset($backtrace[2])) {
            $file = basename($backtrace[2]['file'] ?? 'unknown');
            $line = $backtrace[2]['line'] ?? 'unknown';
            $function = $backtrace[1]['function'] ?? 'unknown';
            $caller = " ({$file}:{$line}, {$function}())";
        }

        $request_id = self::get_request_id();

        return "FivePrayer [{$level}] {$timestamp} [Request:{$request_id}]{$context_part}{$caller}: {$message}";
    }

    private static function generate_log_key(string $level, string $message, string $context = ''): string
    {
        return md5(strtoupper($level) . '|' . trim($message) . '|' . $context);
    }

    private static function has_logged_entry(string $level, string $message, string $context = ''): bool
    {
        $key = self::generate_log_key($level, $message, $context);
        return isset(self::$logged_entries[$key]);
    }

    public static function reset_logged_entries(): void
    {
        self::$logged_entries = [];
    }

    private static function mark_logged_entry(string $level, string $message, string $context = ''): void
    {
        $key = self::generate_log_key($level, $message, $context);
        self::$logged_entries[$key] = true;
    }

    /**
     * Remove secrets and personal data from a log line.
     *
     * Log files are support artefacts, not a data store: an e-mail address or
     * an API key in one is a leak with no diagnostic value. The pattern covers
     * the plugin's `fp_` keys; bearer-style values are left to the caller.
     */
    private static function redact(string $message): string
    {
        $message = (string) preg_replace('/[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}/i', '[redacted-email]', $message);
        $message = (string) preg_replace('/\bfp_[A-Za-z0-9]{16,}\b/', '[redacted-api-key]', $message);
        // Keep the network for diagnostics but not the host part of an IPv4
        // address, which identifies a person on most home connections.
        $message = (string) preg_replace('/\b(\d{1,3}\.\d{1,3}\.\d{1,3})\.\d{1,3}\b/', '$1.x', $message);

        return $message;
    }

    private static function write_log(string $message): void
    {
        $message = self::redact($message);

        // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log -- Last-resort fallback when the log file is not writable.
        error_log($message);

        $log_file = self::get_log_file_path();
        $log_entry = $message . "\n";

        $max_size = 5 * 1024 * 1024;

        if (file_exists($log_file)) {
            $current_size = filesize($log_file);
            if ($current_size > $max_size) {
                $backup_file = $log_file . '.prev';
                copy($log_file, $backup_file);
                file_put_contents($log_file, $log_entry);
            } else {
                file_put_contents($log_file, $log_entry, FILE_APPEND | LOCK_EX);
            }
        } else {
            file_put_contents($log_file, $log_entry, LOCK_EX);
        }
    }
}

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

    private static function write_log(string $message): void
    {
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

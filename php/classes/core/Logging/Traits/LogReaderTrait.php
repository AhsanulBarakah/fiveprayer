<?php

namespace FivePrayer\Core\Logging\Traits;

defined('ABSPATH') || exit;

/**
 * Trait for reading and querying log entries
 */
trait LogReaderTrait
{
    public static function get_recent_logs(int $limit = 50): array
    {
        $log_file = self::get_log_file_path();

        if (!file_exists($log_file)) {
            return [];
        }

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $recent_lines = array_slice($lines, -$limit);

        $log_entries = [];
        foreach ($recent_lines as &$line) {
            $entry = self::parse_log_line($line);
            if ($entry) {
                $log_entries[] = $entry;
            }
        }

        usort($log_entries, function($a, $b) {
            return strtotime($b['timestamp']) <=> strtotime($a['timestamp']);
        });

        return $log_entries;
    }

    public static function get_recent_logs_deduplicated(int $limit = 50): array
    {
        $log_file = self::get_log_file_path();

        if (!file_exists($log_file)) {
            return [];
        }

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $recent_lines = array_slice($lines, -$limit * 2);

        $log_entries = [];
        $seen_messages = [];

        foreach ($recent_lines as &$line) {
            $entry = self::parse_log_line($line);
            if ($entry) {
                $unique_key = md5($entry['message'] . $entry['level'] . $entry['context']);

                if (!isset($seen_messages[$unique_key])) {
                    $entry['occurrences'] = 1;
                    $log_entries[] = $entry;
                    $seen_messages[$unique_key] = true;
                } else {
                    foreach ($log_entries as &$existing_entry) {
                        $existing_unique_key = md5($existing_entry['message'] . $existing_entry['level'] . $existing_entry['context']);
                        if ($existing_unique_key === $unique_key) {
                            $existing_entry['occurrences']++;
                            break;
                        }
                    }
                }
            }
        }

        $log_entries = array_slice($log_entries, 0, $limit);
        usort($log_entries, function($a, $b) {
            return strtotime($b['timestamp']) <=> strtotime($a['timestamp']);
        });

        return $log_entries;
    }

    public static function get_log_statistics(): array
    {
        $log_file = self::get_log_file_path();

        if (!file_exists($log_file)) {
            return [
                'total_logs' => 0,
                'unique_logs' => 0,
                'by_level' => [],
                'by_context' => []
            ];
        }

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $stats = [
            'total_logs' => count($lines),
            'unique_logs' => 0,
            'by_level' => [],
            'by_context' => [],
            'duplicate_count' => 0
        ];

        $seen_messages = [];
        $level_counts = [];
        $context_counts = [];

        foreach ($lines as &$line) {
            $entry = self::parse_log_line($line);
            if ($entry) {
                $level = strtoupper($entry['level']);
                $level_counts[$level] = ($level_counts[$level] ?? 0) + 1;

                $context = $entry['context'] ?: 'General';
                $context_counts[$context] = ($context_counts[$context] ?? 0) + 1;

                $unique_key = md5($entry['message'] . $entry['level'] . $entry['context']);
                if (isset($seen_messages[$unique_key])) {
                    $stats['duplicate_count']++;
                } else {
                    $seen_messages[$unique_key] = true;
                }
            }
        }

        $stats['unique_logs'] = count($seen_messages);
        $stats['by_level'] = $level_counts;
        $stats['by_context'] = $context_counts;

        return $stats;
    }

    private static function parse_log_line(string $line): ?array
    {
        $pattern = '/FivePrayer \\[(DEBUG|INFO|WARNING|ERROR)\\] (\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})(?: \\[([^\\]]+)\\])?(?: \\(([^)]+)\\))?: (.+)/';

        if (preg_match($pattern, $line, $matches)) {
            return [
                'level' => $matches[1],
                'timestamp' => $matches[2],
                'context' => $matches[3] ?? '',
                'caller' => $matches[4] ?? '',
                'message' => $matches[5],
                'raw' => $line
            ];
        }

        $pattern_fallback = '/FivePrayer \\[(DEBUG|INFO|WARNING|ERROR)\\] (\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2}).*?: (.+)/';
        if (preg_match($pattern_fallback, $line, $matches)) {
            $context = '';
            $caller = '';

            if (preg_match('/\\[([^\\]]+)\\]/', $line, $ctx_matches)) {
                $context = $ctx_matches[1];
            }

            if (preg_match('/\\(([^)]+)\\)/', $line, $call_matches)) {
                $caller = $call_matches[1];
            }

            return [
                'level' => $matches[1],
                'timestamp' => $matches[2],
                'context' => $context,
                'caller' => $caller,
                'message' => $matches[3],
                'raw' => $line
            ];
        }

        if (strpos($line, 'FivePrayer [') !== false) {
            preg_match('/FivePrayer \\[(DEBUG|INFO|WARNING|ERROR)\\]/', $line, $level_matches);
            $level = $level_matches[1] ?? 'UNKNOWN';

            preg_match('/(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})/', $line, $time_matches);
            $timestamp = $time_matches[1] ?? gmdate('Y-m-d H:i:s');

            $parts = explode(': ', $line, 2);
            $message = isset($parts[1]) ? $parts[1] : $line;

            return [
                'level' => $level,
                'timestamp' => $timestamp,
                'context' => 'General',
                'caller' => 'Unknown',
                'message' => $message,
                'raw' => $line
            ];
        }

        return null;
    }

    public static function get_log_count(): int
    {
        $log_file = self::get_log_file_path();

        if (!file_exists($log_file)) {
            return 0;
        }

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        return count($lines);
    }

    public static function get_logs_by_level(string $level, int $limit = 50): array
    {
        $all_logs = self::get_recent_logs(1000);
        $filtered_logs = [];

        foreach ($all_logs as &$log) {
            if (strtoupper($log['level']) === strtoupper($level)) {
                $filtered_logs[] = $log;
                if (count($filtered_logs) >= $limit) {
                    break;
                }
            }
        }

        return $filtered_logs;
    }

    public static function get_raw_log_lines(int $limit = 10): array
    {
        $log_file = self::get_log_file_path();

        if (!file_exists($log_file)) {
            return [];
        }

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        return array_slice($lines, -$limit);
    }

    public static function get_current_request_logs(int $limit = 50): array
    {
        $log_file = self::get_log_file_path();

        if (!file_exists($log_file)) {
            return [];
        }

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $current_request_id = self::get_request_id();

        $log_entries = [];
        foreach (array_reverse($lines) as $line) {
            if (strpos($line, '[Request:' . $current_request_id . ']') !== false) {
                $entry = self::parse_log_line($line);
                if ($entry) {
                    $log_entries[] = $entry;
                    if (count($log_entries) >= $limit) {
                        break;
                    }
                }
            }
        }

        return $log_entries;
    }

    public static function get_previous_request_logs(int $limit = 50): array
    {
        $log_file = self::get_log_file_path();

        if (!file_exists($log_file)) {
            return [];
        }

        $lines = file($log_file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $current_request_id = self::get_request_id();

        $log_entries = [];
        foreach (array_reverse($lines) as $line) {
            if (strpos($line, '[Request:' . $current_request_id . ']') === false) {
                $entry = self::parse_log_line($line);
                if ($entry) {
                    $log_entries[] = $entry;
                    if (count($log_entries) >= $limit) {
                        break;
                    }
                }
            }
        }

        return $log_entries;
    }
}

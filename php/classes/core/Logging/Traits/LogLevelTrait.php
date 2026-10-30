<?php

namespace FivePrayer\Core\Logging\Traits;

defined('ABSPATH') || exit;

/**
 * Trait for log level management and request ID generation
 *
 * The LOG_LEVEL_* constants are declared on the composing class (Logger)
 * instead of here: constants inside traits are only allowed from PHP 8.2
 * onward, and this plugin supports PHP 7.4. The methods below read them
 * through `self::`, exactly like the API traits read the constants on
 * ApiKeyManager.
 */
trait LogLevelTrait
{
    private static string $request_id = '';
    private static $log_level_cache = null;

    private static function get_request_id(): string
    {
        if (empty(self::$request_id)) {
            self::$request_id = uniqid(gmdate('YmdHis'), true);
        }
        return self::$request_id;
    }

    private static function get_log_level(): int
    {
        if (self::$log_level_cache === null) {
            self::$log_level_cache = get_option('fiveprayer_log_level', 'none');
        }

        $log_level = self::$log_level_cache;

        switch ($log_level) {
            case 'debug':
                return self::LOG_LEVEL_DEBUG;
            case 'info':
                return self::LOG_LEVEL_INFO;
            case 'warning':
                return self::LOG_LEVEL_WARNING;
            case 'error':
                return self::LOG_LEVEL_ERROR;
            case 'none':
            default:
                return self::LOG_LEVEL_NONE;
        }
    }

    private static function is_log_level_enabled(int $level): bool
    {
        return $level <= self::get_log_level();
    }

    public static function isDebugEnabled(): bool
    {
        return self::is_log_level_enabled(self::LOG_LEVEL_DEBUG);
    }
}

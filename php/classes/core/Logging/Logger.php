<?php

namespace FivePrayer\Core\Logging;

defined('ABSPATH') || exit;

use \FivePrayer\Core\Logging\Traits\LogLevelTrait;
use \FivePrayer\Core\Logging\Traits\LogWriterTrait;
use \FivePrayer\Core\Logging\Traits\LogFileManagerTrait;
use \FivePrayer\Core\Logging\Traits\LogReaderTrait;

/**
 * Centralized logging system for the FivePrayer plugin
 */
class Logger
{
    use LogLevelTrait;
    use LogWriterTrait;
    use LogFileManagerTrait;
    use LogReaderTrait;

    /**
     * Log severity levels, used by LogLevelTrait and LogWriterTrait.
     *
     * Declared on the class rather than inside the trait because constants in
     * traits require PHP 8.2, while this plugin supports PHP 7.4. Trait methods
     * can read private class constants of the class they are composed into.
     */
    private const LOG_LEVEL_NONE = 0;
    private const LOG_LEVEL_ERROR = 1;
    private const LOG_LEVEL_WARNING = 2;
    private const LOG_LEVEL_INFO = 3;
    private const LOG_LEVEL_DEBUG = 4;
}

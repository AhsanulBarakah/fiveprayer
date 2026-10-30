<?php

namespace FivePrayer\Core\Admin;

defined('ABSPATH') || exit;

use FivePrayer\Core\PathService;
use FivePrayer\Core\Admin\Logging\Traits\LogActionHandlerTrait;
use FivePrayer\Core\Admin\Logging\Traits\LogAjaxHandlerTrait;
use FivePrayer\Core\Admin\Logging\Traits\LogSettingsRendererTrait;

class LoggingAdmin
{
    use LogActionHandlerTrait;
    use LogAjaxHandlerTrait;
    use LogSettingsRendererTrait;

    private PathService $paths;

    public function __construct()
    {
        $this->paths = new PathService();
    }
}

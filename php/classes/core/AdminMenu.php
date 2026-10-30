<?php

namespace FivePrayer\Core;

defined('ABSPATH') || exit;

use FivePrayer\Core\AdminMenu\Traits\MenuRendererTrait;
use FivePrayer\Core\AdminMenu\Traits\MemoryTestTrait;
use FivePrayer\Core\PathService;

class AdminMenu
{
    use MenuRendererTrait;
    use MemoryTestTrait;

    public function __construct()
    {
        $this->pathService = new PathService();
    }
}

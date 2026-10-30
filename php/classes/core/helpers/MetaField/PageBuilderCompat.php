<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\MetaField\Traits\AcfCompatTrait;
use FivePrayer\Core\Helpers\MetaField\Traits\PageBuilderIntegrationTrait;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Logging\Logger;

class PageBuilderCompat {
    use AcfCompatTrait;
    use PageBuilderIntegrationTrait;

    private SecurityHelper $security_helper;
    private DynamicTextHandler $dynamic_text_handler;

    public function __construct() {
        $this->security_helper = new SecurityHelper();
        $this->dynamic_text_handler = new DynamicTextHandler();
    }
}

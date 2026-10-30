<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\MetaField\Traits\PatternRegistrationTrait;
use FivePrayer\Core\Helpers\MetaField\Traits\DynamicScriptEnqueueTrait;

class DynamicTextHandler {
    use PatternRegistrationTrait;
    use DynamicScriptEnqueueTrait;

    public function __construct() {
        // All methods provided by traits
    }
}

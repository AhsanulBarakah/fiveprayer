<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\MetaField\Traits\FieldResolverTrait;
use FivePrayer\Core\Helpers\MetaField\Traits\WordRemovalTrait;

class UnifiedDataAccess {
    use FieldResolverTrait;
    use WordRemovalTrait;
}

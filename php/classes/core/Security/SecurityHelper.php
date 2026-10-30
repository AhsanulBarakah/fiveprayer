<?php
namespace FivePrayer\Core\Security;

defined('ABSPATH') || exit;

use FivePrayer\Core\Security\Traits\RequestValidationTrait;
use FivePrayer\Core\Security\Traits\InputSanitizationTrait;
use FivePrayer\Core\Security\Traits\SecurityUtilitiesTrait;

class SecurityHelper {
    use RequestValidationTrait;
    use InputSanitizationTrait;
    use SecurityUtilitiesTrait;

    private const RATE_LIMIT_WINDOW = 5;
    private const MAX_REQUESTS = 3;
    private const MAX_FILE_SIZE = 5242880;
    private const ALLOWED_FILE_TYPES = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt'];
}

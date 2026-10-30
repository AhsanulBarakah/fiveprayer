<?php

namespace FivePrayer\Core;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\Traits\ShortcodeRegistrationTrait;
use FivePrayer\Core\ShortCodes\Traits\SinglePrayerRendererTrait;
use FivePrayer\Core\ShortCodes\Traits\TimetableRendererTrait;
use FivePrayer\Core\ShortCodes\Traits\AjaxCacheTrait;

class Shortcodes
{
    use ShortcodeRegistrationTrait;
    use SinglePrayerRendererTrait;
    use TimetableRendererTrait;
    use AjaxCacheTrait;
}

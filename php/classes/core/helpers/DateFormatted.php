<?php
namespace FivePrayer\Core\Helpers;

use FivePrayer\Core\Helpers\DateFormatted\Traits\NumberConversionTrait;
use FivePrayer\Core\Helpers\DateFormatted\Traits\DateFormattingTrait;

defined('ABSPATH') || exit;

class DateFormatted
{
    use NumberConversionTrait;
    use DateFormattingTrait;
}

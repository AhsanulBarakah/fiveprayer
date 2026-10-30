<?php

namespace FivePrayer\Core\Helpers\DateFormatted\Traits;

defined('ABSPATH') || exit;

trait NumberConversionTrait
{
    /**
     * Converts each digit in a string to the target locale.
     */
    private function split_numbers_and_convert($num, $numbers)
    {
        $converted = '';
        foreach (str_split($num) as &$digit) {
            $found = false;
            foreach ($numbers as &$n) {
                if ($n['original_text'] === $digit) {
                    $converted .= $n['translated_text'];
                    $found = true;
                    break;
                }
            }
            if (!$found) {
                $converted .= $digit;
            }
        }
        return $converted;
    }
}

<?php
namespace FivePrayer\Core\Helpers;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

class TimeToEnglish {
    
    /**
     * Convert Arabic time to English format with validation
     * 
     * @param string $arabicTime Time string in Arabic format (e.g. "٤:٣٨ ص")
     * @return string|false English formatted time or false on invalid input
     */
    public function convertToEnglish($arabicTime) {
        // Validate input
        if (!is_string($arabicTime) || empty(trim($arabicTime))) {
            return false;
        }

        try {
            // Split the Arabic time into parts with validation
            $timeParts = $this->splitArabicTime($arabicTime);
            if (!$timeParts) {
                return false;
            }

            // Convert each component with validation
            $englishHour = $this->convertArabicToEnglishDigits($timeParts['hour']);
            $englishMinute = $this->convertArabicToEnglishDigits($timeParts['minute']);
            $englishPeriod = $this->convertArabicToEnglishPeriod($timeParts['period']);

            if ($englishHour === false || $englishMinute === false || $englishPeriod === false) {
                return false;
            }

            // Validate the final time format
            return $this->validateEnglishTime(
                $englishHour . ':' . $englishMinute . ' ' . $englishPeriod
            );

        } catch (Exception $e) {
            Logger::error('Time conversion error: ' . $e->getMessage(), 'TimeToEnglish');
            return false;
        }
    }

    /**
     * Split Arabic time string into components with validation
     */
    private function splitArabicTime($arabicTime) {
        $trimmedTime = trim($arabicTime);
        
        // Basic pattern validation
        if (!preg_match('/^([٠-٩]+):([٠-٩]+)\s+(ص|م)$/u', $trimmedTime)) {
            return false;
        }

        $parts = explode(' ', $trimmedTime);
        if (count($parts) !== 2) {
            return false;
        }

        $timeComponents = explode(':', $parts[0]);
        if (count($timeComponents) !== 2) {
            return false;
        }

        return [
            'hour' => $timeComponents[0],
            'minute' => $timeComponents[1],
            'period' => $parts[1]
        ];
    }

    /**
     * Convert Arabic digits to English with validation
     */
    private function convertArabicToEnglishDigits($arabicDigits) {
        static $arabicToEnglish = [
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4',
            '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9'
        ];

        $converted = strtr($arabicDigits, $arabicToEnglish);
        
        // Validate all characters were converted
        if (preg_match('/[^0-9]/', $converted)) {
            return false;
        }

        return $converted;
    }

    /**
     * Convert Arabic period to English with validation
     */
    private function convertArabicToEnglishPeriod($period) {
        if ($period === 'ص') {
            return 'AM';
        } elseif ($period === 'م') {
            return 'PM';
        }
        return false;
    }

    /**
     * Validate the final English time format
     */
    private function validateEnglishTime($time) {
        if (!preg_match('/^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/i', $time)) {
            return false;
        }
        return $time;
    }
}

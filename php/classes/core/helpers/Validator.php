<?php
namespace FivePrayer\Core\Helpers;

defined('ABSPATH') || exit;

use DateTime;
use FivePrayer\Core\Security\SecurityHelper;

if (!class_exists('Validator')) {
    class Validator
    {
        public function validate_monthly_number($month)
        {
            try {
                // Removed excessive logging for routine validation to reduce log duplication
                // SecurityHelper::log_security_event('Validating monthly number: ' . $month, 'info');

                $month = SecurityHelper::sanitize_input($month);

                if ($month >= 1 && $month <= 12 || $month == wp_date('n', null, $timezone = null)) {
                    // Removed excessive logging for routine validation to reduce log duplication
                    // SecurityHelper::log_security_event('Monthly number valid: ' . $month, 'info');
                    return $month ? $month : wp_date('n', null, $timezone = null);
                } else {
                    SecurityHelper::log_security_event('Monthly number invalid, using current month', 'warning');
                    return wp_date('n', null, $timezone = null);
                }
            } catch (Exception $e) {
                SecurityHelper::log_security_event('Error validating monthly number: ' . $e->getMessage(), 'error');
                return wp_date('n', null, $timezone = null);
            }
        }

        public function customLocationInsert($data)
        {
            try {
                SecurityHelper::log_security_event('Validating custom location insert', 'info');
                
                $sanitized_data = SecurityHelper::sanitize_input($data);
                
                if (!is_numeric($sanitized_data['country']) && 
                    !is_numeric($sanitized_data['city']) && 
                    is_numeric($sanitized_data['lat']) && 
                    is_numeric($sanitized_data['lng'])) {
                    SecurityHelper::log_security_event('Custom location insert valid', 'info');
                    return true;
                } else {
                    SecurityHelper::log_security_event('Custom location insert invalid', 'warning');
                    return false;
                }
            } catch (Exception $e) {
                SecurityHelper::log_security_event('Error validating custom location insert: ' . $e->getMessage(), 'error');
                return false;
            }
        }

        public function customLocationUpdate($data)
        {
            try {
                SecurityHelper::log_security_event('Validating custom location update', 'info');
                
                $sanitized_data = SecurityHelper::sanitize_input($data);
                
                if (is_numeric($sanitized_data['id']) && 
                    !is_numeric($sanitized_data['country']) && 
                    !is_numeric($sanitized_data['city']) && 
                    is_numeric($sanitized_data['lat']) && 
                    is_numeric($sanitized_data['lng'])) {
                    SecurityHelper::log_security_event('Custom location update valid', 'info');
                    return true;
                } else {
                    SecurityHelper::log_security_event('Custom location update invalid', 'warning');
                    return false;
                }
            } catch (Exception $e) {
                SecurityHelper::log_security_event('Error validating custom location update: ' . $e->getMessage(), 'error');
                return false;
            }
        }

        public function customLocationDelete($data)
        {
            try {
                SecurityHelper::log_security_event('Validating custom location delete', 'info');
                
                $sanitized_data = SecurityHelper::sanitize_input($data);
                
                if (is_numeric($sanitized_data['id'])) {
                    SecurityHelper::log_security_event('Custom location delete valid', 'info');
                    return true;
                } else {
                    SecurityHelper::log_security_event('Custom location delete invalid', 'warning');
                    return false;
                }
            } catch (Exception $e) {
                SecurityHelper::log_security_event('Error validating custom location delete: ' . $e->getMessage(), 'error');
                return false;
            }
        }

        public static function validateMonth($month): bool
        {
            return is_numeric($month) && $month >= 1 && $month <= 12;
        }

        public static function validateYear($year): bool
        {
            return is_numeric($year) && $year >= 2020 && $year <= 2030;
        }

    public static function validateDate($date): bool
    {
        $d = DateTime::createFromFormat('Y-m-d', $date);
        return $d && $d->format('Y-m-d') === $date;
    }
    }
}

<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use Exception;
use FivePrayer\Core\Security\SecurityHelper;

trait SettingsValidationTrait
{
    protected function validatePrinterSettings(array $value): array
    {
        $required_fields = [
            'printer_left1', 'printer_left2', 'printer_left3', 'printer_left4',
            'printer_left5', 'printer_left6', 'printer_left7', 'printer_right1',
            'printer_right2', 'printer_right3', 'printer_right4', 'printer_right5',
            'printer_right6', 'printer_right7', 'printer_boolean', 'printer_logo'
        ];

        foreach ($required_fields as &$field) {
            if (!array_key_exists($field, $value)) {
                throw new Exception(esc_html("Missing required printer field: $field"));
            }
        }

        foreach ($value as $key => &$val) {
            if (is_string($val)) {
                $value[$key] = sanitize_text_field($val);
            } elseif (is_bool($val)) {
                $value[$key] = (bool) $val;
            }
        }

        $value['printer_boolean'] = (bool) $value['printer_boolean'];
        return $value;
    }

    protected function validateLocationList(array $value): array
    {
        if (empty($value)) {
            return [];
        }

        foreach ($value as $index => &$location) {
            if (!is_array($location)) {
                throw new Exception(esc_html("Invalid location data at index $index: expected an object"));
            }

            $required_fields = ['city', 'country', 'id', 'lat', 'lng'];
            foreach ($required_fields as &$field) {
                if (!isset($location[$field]) || $location[$field] === '') {
                    throw new Exception(esc_html("Missing or empty required field '$field' in location at index $index"));
                }

                if (in_array($field, ['lat', 'lng']) && !is_numeric($location[$field])) {
                    throw new Exception(esc_html("Invalid value for '$field' in location at index $index: must be a number"));
                }
            }
        }

        return $value;
    }

    /**
     * Validate the Vertical Today design layout.
     *
     * Only the known fields are kept and every one is coerced to a real
     * boolean, so the stored payload is a stable, predictable shape no matter
     * what the client sends (mirrors how skip_iqamah_midnight is coerced).
     *
     * @param mixed $value
     * @return array{showTime: bool, showDate: bool, showHijriDate: bool}
     */
    protected function validateVerticalTodayLayout($value): array
    {
        if (!is_array($value)) {
            $value = [];
        }

        return [
            'showTime' => !empty($value['showTime']),
            'showDate' => !empty($value['showDate']),
            'showHijriDate' => !empty($value['showHijriDate']),
            // Optional second ‘Asr (2 Mithl) row in the Vertical Today table.
            'showAsr2' => !empty($value['showAsr2']),
        ];
    }

    /**
     * Validate the global Day display config (Configure Settings → Day Display).
     *
     * Only the known fields are kept; the three flags are coerced to real
     * booleans and the order to one of the two supported values, so the stored
     * payload is a stable shape whatever the client sends.
     *
     * @param mixed $value
     * @return array{showFull: bool, showShort: bool, showNumber: bool, order: string}
     */
    protected function validateDayDisplay($value): array
    {
        if (!is_array($value)) {
            $value = [];
        }

        return [
            'showFull' => !empty($value['showFull']),
            'showShort' => !empty($value['showShort']),
            'showNumber' => !empty($value['showNumber']),
            'order' => ($value['order'] ?? '') === 'number_first' ? 'number_first' : 'name_first',
        ];
    }

    /**
     * Validate the six optional "extra prayer" slots (Jumu'ah / Eid etc.).
     *
     * The stored shape is always six objects of {name, time, note}. Every
     * field is a sanitized string; slots the client omits are padded with
     * empty values so the stored payload has a stable, predictable shape.
     *
     * @param mixed $value
     * @return array<int, array{name: string, time: string, note: string}>
     */
    protected function validateExtraPrayers($value): array
    {
        $entries = [];

        if (is_object($value)) {
            $value = (array) $value;
        }

        if (is_array($value)) {
            if (isset($value['slots']) && is_array($value['slots'])) {
                $value = $value['slots'];
            }
            $entries = array_values($value);
        }

        $slots = [];
        for ($i = 0; $i < 6; $i++) {
            $entry = $entries[$i] ?? [];
            if (is_object($entry)) {
                $entry = (array) $entry;
            }
            if (!is_array($entry)) {
                $entry = [];
            }

            $slots[] = [
                'name' => isset($entry['name']) ? sanitize_text_field((string) $entry['name']) : '',
                'time' => isset($entry['time']) ? sanitize_text_field((string) $entry['time']) : '',
                'note' => isset($entry['note']) ? sanitize_text_field((string) $entry['note']) : '',
            ];
        }

        return $slots;
    }

    protected function validateCustomPrayerTimeSchedules($value): array
    {
        if (!is_array($value) && !is_object($value)) {
            throw new Exception("Invalid custom prayer time schedules data: expected an object or array");
        }

        if (is_object($value) && isset($value->state)) {
            $value = [
                'state' => $value->state,
                'version' => isset($value->version) ? $value->version : 0
            ];
        } elseif (is_array($value) && isset($value['state'])) {
            $value = [
                'state' => $value['state'],
                'version' => isset($value['version']) ? $value['version'] : 0
            ];
        }

        if (isset($value['state']['customSchedules']) && is_array($value['state']['customSchedules'])) {
            foreach ($value['state']['customSchedules'] as &$schedule) {
                if (is_array($schedule)) {
                    if (isset($schedule['name']) && is_string($schedule['name'])) {
                        $schedule['name'] = sanitize_text_field($schedule['name']);
                    }
                    if (isset($schedule['startDate']) && is_string($schedule['startDate'])) {
                        $schedule['startDate'] = sanitize_text_field($schedule['startDate']);
                    }
                    if (isset($schedule['endDate']) && is_string($schedule['endDate'])) {
                        $schedule['endDate'] = sanitize_text_field($schedule['endDate']);
                    }
                    if (isset($schedule['enabled'])) {
                        $schedule['enabled'] = (bool) $schedule['enabled'];
                    }
                    if (isset($schedule['prayerTimes']) && is_array($schedule['prayerTimes'])) {
                        foreach ($schedule['prayerTimes'] as $timeKey => &$timeValue) {
                            if (is_string($timeValue)) {
                                $timeValue = sanitize_text_field($timeValue);
                            }
                        }
                    }
                    if (isset($schedule['prayerTimeEnabledFlags']) && is_array($schedule['prayerTimeEnabledFlags'])) {
                        foreach ($schedule['prayerTimeEnabledFlags'] as $flagKey => &$flagValue) {
                            $flagValue = (bool) $flagValue;
                        }
                    }
                    if (isset($schedule['daysOfWeek']) && is_array($schedule['daysOfWeek'])) {
                        $schedule['daysOfWeek'] = array_map('intval', $schedule['daysOfWeek']);
                    }
                }
            }
        }

        if (isset($value['state']['isCustomSchedulesEnabled'])) {
            $value['state']['isCustomSchedulesEnabled'] = (bool) $value['state']['isCustomSchedulesEnabled'];
        }

        return $value;
    }
}

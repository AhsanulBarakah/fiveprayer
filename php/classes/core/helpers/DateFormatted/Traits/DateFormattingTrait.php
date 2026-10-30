<?php

namespace FivePrayer\Core\Helpers\DateFormatted\Traits;

defined('ABSPATH') || exit;

trait DateFormattingTrait
{
    /**
     * Formats the prayer data in Gregorian calendar.
     */
    public function gregorian_format($calendar, $gregorian_numbers, $gregorian_months, $active_language)
    {
        $update_time_fields_new = function (&$prayer, $numbers) {
            foreach ($prayer as $field => &$value) {
                if ($field && $field !== "date" && $field !== "currentDate" && $field !== "today" && $field !== "is_ramadan" && $field !== "hijri_date" && $field !== "className") {
                    if (empty($value)) continue;

                    $time_value = strtotime($value);
                    if ($time_value === false) continue;

                    $time_format = str_replace(':s', '', get_option('time_format'));
                    $formatted_time = date_i18n($time_format, $time_value);

                    if (!empty($numbers)) {
                        if (strpos($formatted_time, ' ') !== false) {
                            list($time_part, $ampm_part) = explode(' ', $formatted_time, 2);

                            $converted_time = $this->split_numbers_and_convert($time_part, $numbers);

                            $translated_ampm = $ampm_part;
                            foreach ($numbers as &$n) {
                                if (strtoupper($n['original_text']) === strtoupper($ampm_part)) {
                                    $translated_ampm = $n['translated_text'];
                                    break;
                                }
                            }

                            $value = $converted_time . ' ' . $translated_ampm;
                        } else {
                            $value = $this->split_numbers_and_convert($formatted_time, $numbers);
                        }
                    } else {
                        $value = $formatted_time;
                    }
                }
            }
        };

        $filter_translations = function ($translations) use ($active_language) {
            if (empty($active_language) || !is_array($active_language) || !isset($active_language[0]) || !is_array($active_language[0]) || !isset($active_language[0]['language_code'])) {
                return $translations;
            }
            $active_language_code = $active_language[0]['language_code'];
            return array_filter($translations, function ($item) use ($active_language_code) {
                return $item['language_code'] === $active_language_code;
            });
        };

        $update_date_field = function (&$prayer, $numbers, $months) {
            if (is_object($prayer)) {
                $date_to_format = null;
                $is_current_date_format = false;

                if (property_exists($prayer, 'currentDate') && !empty($prayer->currentDate)) {
                    $date_to_format = $prayer->currentDate;
                    $is_current_date_format = true;
                } elseif (property_exists($prayer, 'Date') && !empty($prayer->Date)) {
                    try {
                        $dateTime = new \DateTime($prayer->Date);
                        $date_to_format = $dateTime->format('d F Y');
                    } catch (\Exception $e) {
                        return;
                    }
                }

                if ($date_to_format) {
                    list($day_num_str, $month_name_str, $year_num_str) = explode(' ', $date_to_format, 3);

                    $updated_year = $this->split_numbers_and_convert($year_num_str, $numbers);
                    $updated_day = $this->split_numbers_and_convert($day_num_str, $numbers);

                    $updated_month = $month_name_str;
                    foreach ($months as &$m) {
                        if (isset($m['original_text']) && $m['original_text'] === $month_name_str) {
                            $updated_month = $m['translated_text'];
                            break;
                        }
                    }
                    $prayer->currentDate = trim("$updated_day $updated_month  $updated_year");
                }
            }
        };

        $convert_gregorian = function ($numbers, $months) use ($calendar, $update_time_fields_new, $update_date_field) {
            return array_map(function ($prayer) use ($numbers, $months, $update_time_fields_new, $update_date_field) {
                $updated_prayer = $prayer;
                $update_date_field($updated_prayer, $numbers, $months);
                $update_time_fields_new($updated_prayer, $numbers);
                return $updated_prayer;
            }, $calendar);
        };

        $convert_gregorian_locales = function () use ($gregorian_numbers, $gregorian_months, $filter_translations, $convert_gregorian) {
            $numbers = $filter_translations($gregorian_numbers);
            $months = $filter_translations($gregorian_months);
            return $convert_gregorian($numbers, $months);
        };

        return $convert_gregorian_locales();
    }

    /**
     * Formats the prayer data in Hijri calendar.
     */
    public function hijra_format($data, $hijra_numbers, $hijra_months, $active_language)
    {
        $filter_translations = function ($translations) use ($active_language) {
            if (empty($active_language) || !is_array($active_language) || !isset($active_language[0]) || !is_array($active_language[0]) || !isset($active_language[0]['language_code'])) {
                return $translations;
            }
            $active_language_code = $active_language[0]['language_code'];
            $tran = array_filter($translations, function ($item) use ($active_language_code) {
                return $item['language_code'] === $active_language_code;
            });
            $results = [];
            foreach ($tran as $key => &$value) {
                $results[] = $value;
            }
            return $results;
        };

        $update_date_hijra = function ($data, $numbers, $months) {
            $normalizedData = preg_replace('/[,\'\\"]/', '', trim($data));

            $parts = preg_split('/\s+/', $normalizedData);

            $day_num = '';
            $month_name = '';
            $year_num = '';
            $ah = 'AH';

            $ahFound = false;
            foreach ($parts as $key => &$part) {
                if (strtoupper($part) === 'AH' || $part === 'هـ') {
                    $ah = $part;
                    unset($parts[$key]);
                    $ahFound = true;
                    break;
                }
            }

            $parts = array_values($parts);

            if (count($parts) >= 3) {
                $day_num = array_shift($parts);
                $year_num = array_pop($parts);
                $month_name = implode(' ', $parts);
            } elseif (count($parts) === 2) {
                $day_num = $parts[0];
                $year_num = $parts[1];
                $month_name = '';
            }

            $updated_year = $this->split_numbers_and_convert($year_num, $numbers);
            $updated_day = $this->split_numbers_and_convert($day_num, $numbers);

            $updated_month = $month_name;
            if (!empty($month_name)) {
                $foundMonth = false;
                foreach ($months as &$m) {
                    if (strcasecmp(trim($m['original_text']), trim($month_name)) === 0) {
                        $updated_month = $m['translated_text'];
                        $foundMonth = true;
                        break;
                    }
                }

                if (!$foundMonth) {
                    foreach ($months as &$m) {
                        if (strpos(strtolower($month_name), strtolower($m['original_text'])) !== false ||
                            strpos(strtolower($m['original_text']), strtolower($month_name)) !== false) {
                            $updated_month = $m['translated_text'];
                            $foundMonth = true;
                            break;
                        }
                    }
                }
            }

            $updated_ah = $ah;
            foreach ($months as &$m) {
                if (strcasecmp(trim($m['original_text']), trim($ah)) === 0) {
                    $updated_ah = $m['translated_text'];
                    break;
                }
            }

            $result = [];
            if (!empty($updated_day)) $result[] = $updated_day;
            if (!empty($updated_month)) $result[] = $updated_month;
            if (!empty($updated_year)) $result[] = $updated_year;
            if (!empty($updated_ah)) $result[] = $updated_ah;

            return implode(' ', $result);
        };

        $convert_hijra = function ($numbers, $months) use ($data, $update_date_hijra) {
            return $update_date_hijra($data, $numbers, $months);
        };

        $final_convert_hijra_locales = function () use ($hijra_numbers, $hijra_months, $filter_translations, $convert_hijra) {
            $numbers = $filter_translations($hijra_numbers);
            $months = $filter_translations($hijra_months);
            return $convert_hijra($numbers, $months);
        };

        return $final_convert_hijra_locales();
    }
}

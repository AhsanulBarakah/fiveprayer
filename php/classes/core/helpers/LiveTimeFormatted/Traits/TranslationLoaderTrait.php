<?php

namespace FivePrayer\Core\Helpers\LiveTimeFormatted\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\GetMeta;

trait TranslationLoaderTrait
{
    private $translations = [];
    private static $cachedMeta = [];

    /**
     * Cache meta data to reduce database queries
     */
    private function getCachedMeta($getMeta, $key, $default = null)
    {
        if (!isset(self::$cachedMeta[$key])) {
            self::$cachedMeta[$key] = $getMeta->get_meta_key($key) ?: $default;
        }
        return self::$cachedMeta[$key];
    }

    private function loadTranslations($numbers, $language)
    {
        $translations = array_merge(
            array_combine(array_map('strval', range(0, 9)), array_map('strval', range(0, 9))),
            ['AM' => 'AM', 'PM' => 'PM']
        );

        if (is_array($numbers) && !empty($language[0]['language_code'])) {
            $targetLang = $language[0]['language_code'];

            $foundAM = false;
            $foundPM = false;

            foreach ($numbers as &$num) {
                if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                    $num['language_code'] === $targetLang) {

                    $original = strtoupper($num['original_text']);
                    $translated = $num['translated_text'];
                    $translations[$original] = $translated;
                    $translations[strtolower($original)] = strtolower($translated);

                    if ($original === 'AM') $foundAM = true;
                    if ($original === 'PM') $foundPM = true;
                }
            }

            if (!$foundAM || !$foundPM) {
                foreach ($numbers as &$num) {
                    if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                        $num['language_code'] === 'en') {

                        $original = strtoupper($num['original_text']);
                        $translated = $num['translated_text'];

                        if (($original === 'AM' && !$foundAM) || ($original === 'PM' && !$foundPM)) {
                            $translations[$original] = $translated;
                            $translations[strtolower($original)] = strtolower($translated);
                        }
                    }
                }
            }
        }

        return $translations;
    }

    private function getTranslatedTime()
    {
        $timeFormat = get_option('time_format', 'h:i A');
        if (!strpos($timeFormat, 's')) {
            $timeFormat = str_replace(['h:i', 'g:i'], ['h:i:s', 'g:i:s'], $timeFormat);
        }
        $time = date_i18n($timeFormat);
        return $this->translateTime($time);
    }

    private function translateTime($time)
    {
        if (!is_string($time)) return $time;

        static $pattern = null;
        if ($pattern === null) {
            $pattern = '/[0-9]|AM|PM/i';
        }

        return preg_replace_callback($pattern, function ($matches) {
            $match = $matches[0];
            $upperMatch = strtoupper($match);

            if (isset($this->translations[$upperMatch])) {
                return $this->translations[$upperMatch];
            } elseif (isset($this->translations[strtolower($upperMatch)])) {
                return $this->translations[strtolower($upperMatch)];
            }

            return $match;
        }, $time);
    }

    private function fallbackTimeDisplay()
    {
        // No fallback needed - time is handled by JavaScript
    }

    /**
     * Check if current page has prayer time content that needs live time functionality
     */
    private function hasPrayerTimeContent()
    {
        if (is_admin() || wp_doing_ajax()) {
            return false;
        }

        global $post;

        if (!is_a($post, 'WP_Post')) {
            return false;
        }

        $content = $post->post_content;

        $time_sensitive_shortcodes = [
            'Fp_Single_CurrentTime',
            'Fp_Single_NextPrayer',
            'Fp_Single_Next_Prayer_Remaining',
            'Fp_Vertical_Daily_Prayer',
            'Fp_TimeTable_Monthly',
            'Fp_Single_Fajr',
            'Fp_Single_Sunrise',
            'Fp_Single_Dhuhr',
            'Fp_Single_Asr',
            'Fp_Single_Maghrib',
            'Fp_Single_Isha'
        ];

        foreach ($time_sensitive_shortcodes as &$shortcode) {
            if (has_shortcode($content, $shortcode)) {
                return true;
            }
        }

        $dynamic_text_patterns = [
            '/\bfp_currenttime\b/',
            '/\bfp_currentdate\b/',
            '/\bfp_nextprayer\b/',
            '/\bfp_fajrbegins\b/',
            '/\bfp_sunrisebegins\b/',
            '/\bfp_dhuhrbegins\b/',
            '/\bfp_asrbegins\b/',
            '/\bfp_maghribbegins\b/',
            '/\bfp_ishabegins\b/',
        ];

        foreach ($dynamic_text_patterns as &$pattern) {
            if (preg_match($pattern, $content)) {
                return true;
            }
        }

        return false;
    }
}

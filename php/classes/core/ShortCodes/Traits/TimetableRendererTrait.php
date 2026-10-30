<?php

namespace FivePrayer\Core\ShortCodes\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\ShortCodes\ShortCodeTimetableMonth;
use FivePrayer\Core\ShortCodes\ShortCodeVerticalDailyPrayer;
use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\Security\SecurityHelper;

/**
 * Trait for timetable shortcode rendering (monthly and daily).
 */
trait TimetableRendererTrait
{
    public function timetable_month($atts): string
    {
        try {
            if (defined('DOING_AJAX') && DOING_AJAX &&
                SecurityHelper::get_sanitized_post_input('action') === 'fiveprayer_dynamic_content') {
                $timetable_month = new ShortCodeTimetableMonth();
                return $timetable_month->fpTimetableMonth($atts);
            }

            // The rendered table depends on the selected month. Include it in the
            // key (validated to 1-13) so a month switched via the non-JS form POST
            // fallback is never served the previously cached month.
            $requested_month = SecurityHelper::get_sanitized_post_input('newMonth');
            $month_selector  = (is_numeric($requested_month) && (int) $requested_month >= 1 && (int) $requested_month <= 13)
                ? (string) (int) $requested_month
                : 'default';
            $cache_key = 'fp_month_shortcode_' . md5(wp_json_encode($atts) . '|' . get_locale() . '|' . gmdate('Y-m-d-H') . '|' . $month_selector . '|' . $this->shortcode_render_fingerprint());
            $preview_param = SecurityHelper::get_sanitized_get_input('preview');
            $context_param = SecurityHelper::get_sanitized_get_input('context');
            $bypass_cache = is_admin() || !empty($preview_param) || (!empty($context_param) && $context_param === 'edit');

            if (!$bypass_cache) {
                $cached = get_transient($cache_key);
                if ($cached !== false) {
                    return $cached;
                }
            }

            $timetable_month = new ShortCodeTimetableMonth();
            $content = $timetable_month->fpTimetableMonth($atts);

            if (!$bypass_cache) {
                set_transient($cache_key, $content, 30 * MINUTE_IN_SECONDS);
            }

            $this->enqueue_dynamic_content_loader();

            return $content;
        } catch (\Throwable $e) {
            if (defined('WP_DEBUG') && WP_DEBUG) {
                return '<!-- FivePrayer error: ' . esc_html($e->getMessage()) . ' -->';
            }
            return '';
        }
    }

    /**
     * Fingerprint of the settings that change the rendered table markup.
     *
     * The monthly and daily fragments are cached as transients, and saving a
     * setting purges them — but the cache key itself used to omit the display
     * configuration, so a fragment generated *before* a display setting changed
     * (the Day column's parts/order, the Day_Display master switch, the Vertical
     * Today fields) could keep being served until its TTL ran out. Folding the
     * relevant meta into the key means a changed setting always maps to a fresh
     * key, so the new markup is rendered rather than a stale fragment.
     */
    private function shortcode_render_fingerprint(): string
    {
        $keys = [
            'day_display',
            'feature_toggles',
            'day_names',
            'vertical_today_layout',
            'timetable_layout',
            'activeLanguage',
            'hijralocale',
            'prayer_names',
            'timetable_prayer',
            'vertical_daily_prayer',
            'skip_iqamah_midnight',
        ];

        $values = PrayerDataCache::getMultipleMetaValues($keys);

        return md5((string) wp_json_encode($values));
    }

    public function timetable_daily($atts): string
    {
        if (defined('DOING_AJAX') && DOING_AJAX &&
            SecurityHelper::get_sanitized_post_input('action') === 'fiveprayer_dynamic_content') {
            ob_start();
            $timetable_daily = new ShortCodeVerticalDailyPrayer();
            echo $timetable_daily->renderPrayerTable($atts); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
            return ob_get_clean();
        }

        $cache_key = 'fp_daily_shortcode_' . md5(get_locale() . '|' . wp_json_encode($atts) . '|' . $this->shortcode_render_fingerprint());

        $preview_param = SecurityHelper::get_sanitized_get_input('preview');
        $context_param = SecurityHelper::get_sanitized_get_input('context');

        $host = sanitize_text_field(wp_unslash($_SERVER['HTTP_HOST'] ?? ''));
        $bypass_cache = is_admin() ||
                       !empty($preview_param) ||
                       (!empty($context_param) && $context_param === 'edit') ||
                       (defined('WP_DEBUG') && WP_DEBUG) ||
                       (defined('SCRIPT_DEBUG') && SCRIPT_DEBUG) ||
                       $host === 'localhost' ||
                       strpos($host, '.local') !== false ||
                       strpos($host, '.test') !== false;

        if (!$bypass_cache) {
            $cached = get_transient($cache_key);
            if ($cached !== false) {
                return $cached;
            }
        }

        ob_start();
        $timetable_daily = new ShortCodeVerticalDailyPrayer();
        echo $timetable_daily->renderPrayerTable($atts); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        $content = ob_get_clean();

        if (!$bypass_cache) {
            set_transient($cache_key, $content, 5 * MINUTE_IN_SECONDS);
        }

        $this->enqueue_dynamic_content_loader();

        return $content;
    }
}

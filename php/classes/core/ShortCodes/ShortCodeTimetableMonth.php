<?php

namespace FivePrayer\Core\Shortcodes;

use FivePrayer\Core\Calendar\CalendarGenerator;

defined('ABSPATH') || exit;

if (!class_exists(__NAMESPACE__ . '\ShortCodeTimetableMonth')) {
    class ShortCodeTimetableMonth
    {
        public function __construct()
        {
            add_action('init', array($this, 'registerShortcodes'));
        }

        public function registerShortcodes()
        {
            add_shortcode('Fp_TimeTable_Monthly', array($this, 'fpTimetableMonth'));
        }

        public function fpTimetableMonth($atts)
        {
            $attributes = shortcode_atts([], $atts);

            // The one styling entry point (combined stylesheet + dynamic
            // variables), called at render time so the timetable is styled even
            // on a page builder page where the head-time detection found nothing
            // to enqueue.
            if (class_exists('\\FivePrayer\\Core\\ShortCodes\\Managers\\StyleManager')) {
                \FivePrayer\Core\ShortCodes\Managers\StyleManager::getInstance()->enqueueStyles();
            }

            ob_start();
            try {
                $genTable = new CalendarGenerator();
                // Render only needs the requested month; skip the full-year load.
                $genTable->dynamic_generate_calendar($attributes, false, false);
            } catch (\Throwable $e) {
                ob_end_clean();
                if (defined('WP_DEBUG') && WP_DEBUG) {
                    return '<!-- FivePrayer error: ' . esc_html($e->getMessage()) . ' -->';
                }
                return '';
            }

            return ob_get_clean();
        }
    }
}

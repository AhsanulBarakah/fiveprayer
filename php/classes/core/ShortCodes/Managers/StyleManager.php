<?php
namespace FivePrayer\Core\ShortCodes\Managers;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

use FivePrayer\Core\Database\FivePrayer_StyleDynamicDB;

class StyleManager {
    /**
     * Highest border radius the settings screen offers, in whole pixels.
     *
     * The same ceiling is applied on the way in (the REST controller) and on the
     * way out (here), so a value written by an older build, a filter or a direct
     * database edit can never produce an absurd radius in the stylesheet.
     */
    public const MAX_BORDER_RADIUS = 80;

    /**
     * Elements that own FivePrayer output, and the only place the colour and
     * border variables are declared.
     *
     * They used to be published on `:root` too, which made fifteen plugin
     * names global: a theme or builder using one of them changed the timetable,
     * and the timetable changed theirs. Now the values live here and nowhere
     * else, so they inherit only into the plugin's own markup and cannot be
     * read (or overwritten) from outside it. Declaring them on every container
     * also means the nearest declaration is ours whatever a page builder puts
     * on the elements in between — custom properties inherit, and an inherited
     * invalid value cannot be substituted, which used to drop every `border:`
     * declaration on an Elementor page.
     */
    public const CONTAINER_SCOPE = '.fiveprayer-container, .fiveprayer__iqamah_next, '
        . '.fiveprayer__printer, .fiveprayer-default-layout, .fiveprayer-hijri-layout, '
        . 'table.fiveprayer__TablePrayer_, table.fiveprayer__DairyPrayer_';

    private static $instance = null;
    private $styleDynamicDB;
    private $styles = [];

    // Private constructor to prevent direct instantiation
    private function __construct() {
        $this->styleDynamicDB = new FivePrayer_StyleDynamicDB();
        $this->loadStyles();
    }

    // Get the singleton instance
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function loadStyles(): void {
        $this->styles = $this->getDynamicStyles();
        // Removed excessive debug logging to reduce log duplication
    }

    private function getDynamicStyles(): array {
        $styles = [
            'firstbg' => $this->styleDynamicDB->StyleDynamic('firstbg'),
            'firstclr' => $this->styleDynamicDB->StyleDynamic('firstclr'),
            'secondbg' => $this->styleDynamicDB->StyleDynamic('secondbg'),
            'secondclr' => $this->styleDynamicDB->StyleDynamic('secondclr'),
            'evenrowbg' => $this->styleDynamicDB->StyleDynamic('evenrowbg'),
            'evenrowclr' => $this->styleDynamicDB->StyleDynamic('evenrowclr'),
            'oddrowbg' => $this->styleDynamicDB->StyleDynamic('oddrowbg'),
            'oddrowclr' => $this->styleDynamicDB->StyleDynamic('oddrowclr'),
            'highlightrowbg' => $this->styleDynamicDB->StyleDynamic('highlightrowbg'),
            'highlightrowclr' => $this->styleDynamicDB->StyleDynamic('highlightrowclr'),
            'borderclr' => $this->styleDynamicDB->StyleDynamic('borderclr'),
            'borderstyle' => $this->styleDynamicDB->StyleDynamic('borderstyle'),
            'bordersize' => $this->styleDynamicDB->StyleDynamic('bordersize'),
            'borderradius' => $this->styleDynamicDB->StyleDynamic('borderradius')
        ];
        // Removed excessive debug logging to reduce log duplication

        return $styles;
    }

    /**
     * The one entry point for the plugin's front-end styling.
     *
     * Enqueues the combined stylesheet — registered as `fiveprayer-default-style`
     * by initRegister, and pointing at the single fallback file when the combiner
     * is unavailable — and attaches the dynamic colour/border variables to it
     * exactly once. Every renderer calls this, so a shortcode dropped into a page
     * builder is styled even when nothing discovered it in the head; callers used
     * to enqueue their own file URL under this same handle, which replaced the
     * bundle and printed the same CSS twice.
     *
     * @return void
     */
    public function enqueueStyles(): void {
        if (!wp_style_is('fiveprayer-default-style', 'registered')) {
            // Admin, AJAX, cron or a REST request where initRegister registered
            // nothing: there is no stylesheet to enqueue.
            return;
        }

        wp_enqueue_style('fiveprayer-default-style');

        // wp_add_inline_style() appends, so guard against printing the same
        // variables once per renderer that runs on the page.
        static $variables_added = false;
        if ($variables_added) {
            return;
        }
        $variables_added = true;

        $dynamic_css = $this->generateDynamicCSS();
        if ($dynamic_css !== '') {
            wp_add_inline_style('fiveprayer-default-style', $dynamic_css);
        }
    }

    public function generateDynamicCSS(): string {
        if (empty($this->styles)) {
            return '';
        }

        // The declarations are printed on the plugin's own containers and
        // nowhere else. They used to be declared on `:root` as well, which put
        // fifteen generic names (`--border-size`, `--bg-odd`, …) on every page
        // the plugin rendered on: a theme or another plugin that happened to use
        // one of them changed the timetable, and the plugin changed theirs. The
        // names now carry the `--fiveprayer-` prefix and stay inside CONTAINER_SCOPE.
        $variables = $this->generateColorVariables() . $this->generateBorderStyles();

        $css = self::CONTAINER_SCOPE . " {\n" . $variables . "}\n";

        // Add print-specific styles
        $print_styles = $this->generatePrintStyles();
        $css .= $print_styles;

        return $css;
    }

    private function generateColorVariables(): string {
        $css = '';
        $color_map = [
            'firstbg' => '--fiveprayer-bg-first',
            'firstclr' => '--fiveprayer-clr-first',
            'secondbg' => '--fiveprayer-bg-second',
            'secondclr' => '--fiveprayer-clr-second',
            'evenrowbg' => '--fiveprayer-bg-even',
            'evenrowclr' => '--fiveprayer-clr-even',
            'oddrowbg' => '--fiveprayer-bg-odd',
            'oddrowclr' => '--fiveprayer-clr-odd',
            'highlightrowbg' => '--fiveprayer-bg-highlight',
            'highlightrowclr' => '--fiveprayer-clr-highlight',
        ];

        foreach ($color_map as $key => $var) {
            if (!empty($this->styles[$key])) {
                $color = $this->parseColor($this->styles[$key]);
                if ($color) {
                    $css .= "    {$var}: {$color};\n";
                }
            }
        }

        return $css;
    }

    private function generateBorderStyles(): string {
        $css = '';
        
        // Set default values if not provided
        $border_color = 'rgba(0, 0, 0, 0.1)';
        $border_style = 'solid';
        $border_width = '1px';
        
        // Override with database values if they exist
        if (!empty($this->styles['borderclr'])) {
            $parsed_color = $this->parseColor($this->styles['borderclr']);
            if ($parsed_color) {
                $border_color = $parsed_color;
            }
        }
        
        if (!empty($this->styles['borderstyle'])) {
            // Remove any quotes from the border style
            $border_style = trim($this->styles['borderstyle'], ' "\'');
        }
        
        // 0 is a valid size ("no border"), so test for "is set" rather than
        // "is non-empty" — !empty('0') is false and quietly reinstated the
        // 1px default. Fractions such as 0.5 are kept as-is.
        $border_size = $this->styles['bordersize'] ?? null;
        if ($border_size !== null && $border_size !== '') {
            $border_width = is_numeric($border_size)
                ? $border_size . 'px'
                : $border_size;
        }
        
        // Set the CSS variables without quotes
        $css .= "    --fiveprayer-clr-border: {$border_color};\n";
        $css .= "    --fiveprayer-border-style: {$border_style};\n";
        $css .= "    --fiveprayer-border-size: {$border_width};\n";
        
        // Add a default border rule without quotes
        $css .= "    --fiveprayer-border-default: {$border_width} {$border_style} {$border_color};\n";

        // Corner rounding of the timetable table. Always emitted (0 when nothing
        // is stored) so a stylesheet can safely read it without a fallback, and
        // rearranged to a bare number so `12` never becomes `12.0px`.
        $css .= "    --fiveprayer-clr-radius: " . self::getBorderRadius($this->styles['borderradius'] ?? null) . "px;\n";

        // Removed excessive debug logging to reduce log duplication
        //     'color' => $border_color,
        //     'style' => $border_style,
        //     'width' => $border_width
        // ], true), 'StyleManager');

        return $css;
    }

    /**
     * Normalise a stored border radius to a whole number of pixels within range.
     *
     * Anything that is not a number (a missing row, an empty string, a stray
     * colour) becomes 0 — the square-corner default — and the value is clamped to
     * 0-{@see self::MAX_BORDER_RADIUS}.
     *
     * @param mixed $raw Stored value, usually a numeric string such as "8".
     * @return int Radius in whole pixels, never negative and never above the cap.
     */
    public static function getBorderRadius($raw): int
    {
        if (!is_numeric($raw)) {
            return 0;
        }

        return (int) max(0, min(self::MAX_BORDER_RADIUS, (float) $raw));
    }

    private function generatePrintStyles(): string {
        if (empty($this->styles['highlightrowbg']) || empty($this->styles['highlightrowclr'])) {
            return '';
        }

        $highlight_bg = $this->parseColor($this->styles['highlightrowbg']);
        $highlight_text = $this->parseColor($this->styles['highlightrowclr']);

        if (!$highlight_bg || !$highlight_text) {
            return '';
        }

        return "
        @media print {
            .fiveprayer_highlight .prayer-highlight {
                background-color: {$highlight_bg} !important;
                color: {$highlight_text} !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
        }";
    }

    private function parseColor($color) {
        if (empty($color)) {
            return '';
        }

        // If it's an array, try to convert it to a proper color value
        if (is_array($color)) {
            if (isset($color['r'], $color['g'], $color['b'])) {
                $r = (int)$color['r'];
                $g = (int)$color['g'];
                $b = (int)$color['b'];
                $a = isset($color['a']) ? (float)$color['a'] : 1;
                
                if ($a < 1) {
                    return sprintf('rgba(%d, %d, %d, %s)', $r, $g, $b, $a);
                } else {
                    return sprintf('rgb(%d, %d, %d)', $r, $g, $b);
                }
            }
            // If it's an array but not in the expected format, try to use the first value
            if (!empty($color)) {
                $color = reset($color);
            } else {
                return '';
            }
        }

        // If it's a JSON string, decode it
        if (is_string($color) && strpos($color, '{') === 0) {
            $decoded = json_decode($color, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                if (isset($decoded['r'], $decoded['g'], $decoded['b'])) {
                    $r = (int)$decoded['r'];
                    $g = (int)$decoded['g'];
                    $b = (int)$decoded['b'];
                    $a = isset($decoded['a']) ? (float)$decoded['a'] : 1;
                    
                    if ($a < 1) {
                        return sprintf('rgba(%d, %d, %d, %s)', $r, $g, $b, $a);
                    } else {
                        return sprintf('rgb(%d, %d, %d)', $r, $g, $b);
                    }
                }
            }
        }

        // If it's already a valid CSS color, return as is
        if (preg_match('/^(#|rgb|hsl|rgba|hsla)/', $color)) {
            return $color;
        }

        // If it's a hex color without the #, add it
        if (preg_match('/^[a-f0-9]{3,6}$/i', $color)) {
            return '#' . $color;
        }

        // Return as is if we can't parse it
        return (string)$color;
    }
}

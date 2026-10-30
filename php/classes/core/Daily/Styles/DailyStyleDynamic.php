<?php
namespace FivePrayer\Core\Daily\Styles;

defined('ABSPATH') || exit;

if (!class_exists('DailyStyleDynamic')) {

    class DailyStyleDynamic
    {
        use \FivePrayer\Core\Daily\Styles\Traits\StyleRendererTrait;
        use \FivePrayer\Core\Daily\Styles\Traits\JavaScriptRendererTrait;

        private $styleDynamicDB;
        private $styleData = [];

        public function __construct()
        {
            $this->styleDynamicDB = new \FivePrayer\Core\Database\FivePrayer_StyleDynamicDB();
        }

        public function dailyStyleDynamic()
        {
            // Only skip in pure AJAX contexts, but allow in admin for page builders
            if (wp_doing_ajax()) {
                return;
            }

            // Get custom style settings
            $colorBorderClr = $this->styleDynamicDB->StyleDynamic('borderclr');
            $colorBorderC = $colorBorderClr ? json_decode($colorBorderClr, true) : null;
            $borderStyle = $this->styleDynamicDB->StyleDynamic('borderstyle');
            $borderSize = $this->styleDynamicDB->StyleDynamic('bordersize');
            
            $colorHighlightRowBg = $this->styleDynamicDB->StyleDynamic('highlightrowbg');
            $colorHighlightRowB = $colorHighlightRowBg ? json_decode($colorHighlightRowBg, true) : null;
            $colorHighlightRowClr = $this->styleDynamicDB->StyleDynamic('highlightrowclr');
            $colorHighlightRowC = $colorHighlightRowClr ? json_decode($colorHighlightRowClr, true) : null;

            $colorSecondBg = $this->styleDynamicDB->StyleDynamic('secondbg');
            $colorSecondB = $colorSecondBg ? json_decode($colorSecondBg, true) : null;
            $colorSecondClr = $this->styleDynamicDB->StyleDynamic('secondclr');
            $colorSecondC = $colorSecondClr ? json_decode($colorSecondClr, true) : null;

            $colorFirstBg = $this->styleDynamicDB->StyleDynamic('firstbg');
            $colorFirstB = $colorFirstBg ? json_decode($colorFirstBg, true) : null;
            $colorFirstClr = $this->styleDynamicDB->StyleDynamic('firstclr');
            $colorFirstC = $colorFirstClr ? json_decode($colorFirstClr, true) : null;

            $colorEvenBg = $this->styleDynamicDB->StyleDynamic('evenrowbg');
            $evenrowbg = $colorEvenBg ? json_decode($colorEvenBg, true) : null;
            $colorEvenClr = $this->styleDynamicDB->StyleDynamic('evenrowclr');
            $evenrowclr = $colorEvenClr ? json_decode($colorEvenClr, true) : null;

            $colorOddBg = $this->styleDynamicDB->StyleDynamic('oddrowbg');
            $oddrowbg = $colorOddBg ? json_decode($colorOddBg, true) : null;
            $colorOddClr = $this->styleDynamicDB->StyleDynamic('oddrowclr');
            $oddrowclr = $colorOddClr ? json_decode($colorOddClr, true) : null;

            $colorHoverBg = $this->styleDynamicDB->StyleDynamic('hoverbg');
            $hoverbg = $colorHoverBg ? json_decode($colorHoverBg, true) : null;
            $colorHoverClr = $this->styleDynamicDB->StyleDynamic('hoverclr');
            $hoverclr = $colorHoverClr ? json_decode($colorHoverClr, true) : null;
            $hoverMode = $this->styleDynamicDB->StyleDynamic('hover_mode') ?: 'blend';
            $hoverEnabled = ($this->styleDynamicDB->StyleDynamic('hover_enabled') ?: '0') !== '0';

            // Store style data
            $this->styleData = [
                'colorBorderC' => $colorBorderC,
                'borderStyle' => $borderStyle,
                'borderSize' => $borderSize,
                'colorHighlightRowB' => $colorHighlightRowB,
                'colorHighlightRowC' => $colorHighlightRowC,
                'colorSecondB' => $colorSecondB,
                'colorSecondC' => $colorSecondC,
                'colorFirstB' => $colorFirstB,
                'colorFirstC' => $colorFirstC,
                'evenrowbg' => $evenrowbg,
                'evenrowclr' => $evenrowclr,
                'oddrowbg' => $oddrowbg,
                'oddrowclr' => $oddrowclr,
                'hoverbg' => $hoverbg,
                'hoverclr' => $hoverclr,
                'hoverMode' => $hoverMode,
                'hoverEnabled' => $hoverEnabled
            ];

            // Add styles to WordPress hooks
            add_action('wp_head', [$this, 'outputStylesInHead']);
            add_action('wp_footer', [$this, 'outputBorderScript']);
            add_action('wp_footer', [$this, 'outputFunctionalityScript']);
            // Fallback: some themes forget wp_footer; also load functionality in head to ensure handler exists
            add_action('wp_head', [$this, 'outputFunctionalityScript']);
        }
    }
}

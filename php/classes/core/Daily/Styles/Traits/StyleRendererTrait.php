<?php

namespace FivePrayer\Core\Daily\Styles\Traits;

defined('ABSPATH') || exit;

/**
 * Trait StyleRendererTrait
 *
 * Handles rendering of dynamic CSS styles for prayer timetable display.
 * Extracted from DailyStyleDynamic for code organization.
 */
trait StyleRendererTrait
{
    public function outputStylesInHead()
    {
        if (!empty($this->styleData) && !headers_sent()) {
            $this->renderStyles();
        }
    }

    private function renderStyles()
    {
        $data = $this->styleData;
        // 0 is a valid width (no border); only a missing value falls back to 1px
        // so the declaration never ends up as the invalid "px".
        $border_size = ($data['borderSize'] === null || $data['borderSize'] === '') ? '1' : $data['borderSize'];
        ?>
        <style class="fiveprayer-inline-styles">
        /* Declared on the plugin's own containers, never on :root: the names
           are the plugin's, and nothing else on the page should see them. */
        <?php echo \FivePrayer\Core\ShortCodes\Managers\StyleManager::CONTAINER_SCOPE; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Plugin-owned selector list. ?> {
            --fiveprayer-clr-border: <?php echo $data['colorBorderC'] ? "rgba(" . esc_attr($data['colorBorderC']["r"] . "," . $data['colorBorderC']["g"] . "," . $data['colorBorderC']["b"] . "," . $data['colorBorderC']["a"]) . ")" : "rgba(0, 0, 0, 0.1)" ?>;
            --fiveprayer-border-style: <?php echo esc_attr($data['borderStyle']) ?>;
            --fiveprayer-border-size: <?php echo esc_attr($border_size . "px") ?>;
            --fiveprayer-bg-highlight: <?php echo $data['colorHighlightRowB'] ? "rgba(" . esc_attr($data['colorHighlightRowB']["r"] . "," . $data['colorHighlightRowB']["g"] . "," . $data['colorHighlightRowB']["b"] . "," . $data['colorHighlightRowB']["a"]) . ")" : "rgba(242, 255, 0, 1)" ?>;
            --fiveprayer-clr-highlight: <?php echo $data['colorHighlightRowC'] ? "rgba(" . esc_attr($data['colorHighlightRowC']["r"] . "," . $data['colorHighlightRowC']["g"] . "," . $data['colorHighlightRowC']["b"] . "," . $data['colorHighlightRowC']["a"]) . ")" : "rgba(201, 9, 9, 1)" ?>;
            --fiveprayer-bg-second: <?php echo $data['colorSecondB'] ? "rgba(" . esc_attr($data['colorSecondB']["r"] . "," . $data['colorSecondB']["g"] . "," . $data['colorSecondB']["b"] . "," . $data['colorSecondB']["a"]) . ")" : "transparent" ?>;
            --fiveprayer-clr-second: <?php echo $data['colorSecondC'] ? "rgba(" . esc_attr($data['colorSecondC']["r"] . "," . $data['colorSecondC']["g"] . "," . $data['colorSecondC']["b"] . "," . $data['colorSecondC']["a"]) . ")" : "transparent" ?>;
            --fiveprayer-bg-first: <?php echo $data['colorFirstB'] ? "rgba(" . esc_attr($data['colorFirstB']["r"] . "," . $data['colorFirstB']["g"] . "," . $data['colorFirstB']["b"] . "," . $data['colorFirstB']["a"]) . ")" : "transparent" ?>;
            --fiveprayer-clr-first: <?php echo $data['colorFirstC'] ? "rgba(" . esc_attr($data['colorFirstC']["r"] . "," . $data['colorFirstC']["g"] . "," . $data['colorFirstC']["b"] . "," . $data['colorFirstC']["a"]) . ")" : "transparent" ?>;
            --fiveprayer-bg-even: <?php echo $data['evenrowbg'] ? "rgba(" . esc_attr($data['evenrowbg']["r"] . "," . $data['evenrowbg']["g"] . "," . $data['evenrowbg']["b"] . "," . $data['evenrowbg']["a"]) . ")" : "transparent" ?>;
            --fiveprayer-clr-even: <?php echo $data['evenrowclr'] ? "rgba(" . esc_attr($data['evenrowclr']["r"] . "," . $data['evenrowclr']["g"] . "," . $data['evenrowclr']["b"] . "," . $data['evenrowclr']["a"]) . ")" : "transparent" ?>;
            --fiveprayer-bg-odd: <?php echo $data['oddrowbg'] ? "rgba(" . esc_attr($data['oddrowbg']["r"] . "," . $data['oddrowbg']["g"] . "," . $data['oddrowbg']["b"] . "," . $data['oddrowbg']["a"]) . ")" : "transparent" ?>;
            --fiveprayer-clr-odd: <?php echo $data['oddrowclr'] ? "rgba(" . esc_attr($data['oddrowclr']["r"] . "," . $data['oddrowclr']["g"] . "," . $data['oddrowclr']["b"] . "," . $data['oddrowclr']["a"]) . ")" : "transparent" ?>;
            --fiveprayer-bg-hover: <?php echo !empty($data['hoverbg']) ? "rgba(" . esc_attr($data['hoverbg']["r"] . "," . $data['hoverbg']["g"] . "," . $data['hoverbg']["b"] . "," . $data['hoverbg']["a"]) . ")" : "rgba(0, 0, 0, 0.08)" ?>;
            --fiveprayer-clr-hover: <?php echo (!empty($data['hoverclr']) && ((float) ($data['hoverclr']['a'] ?? 0)) > 0) ? "rgba(" . esc_attr($data['hoverclr']["r"] . "," . $data['hoverclr']["g"] . "," . $data['hoverclr']["b"] . "," . $data['hoverclr']["a"]) . ")" : "inherit" ?>;
        }

        /* Universal border styles for all environments */
        html body table.fiveprayer__printer th,
        html body table.fiveprayer__printer td,
        html body table.fiveprayer__DairyPrayer_ th,
        html body table.fiveprayer__DairyPrayer_ td,
        html body .fiveprayer__printer th,
        html body .fiveprayer__printer td,
        html body .fiveprayer__DairyPrayer_ th,
        html body .fiveprayer__DairyPrayer_ td {
            border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border) !important;
            text-align: center !important;
            box-sizing: border-box !important;
        }

        /* Page builder specific targeting */
        html body .elementor-editor table.fiveprayer__printer th,
        html body .elementor-editor table.fiveprayer__printer td,
        html body .elementor-editor-active table.fiveprayer__printer th,
        html body .elementor-editor-active table.fiveprayer__printer td,
        html body .fl-builder-edit table.fiveprayer__printer th,
        html body .fl-builder-edit table.fiveprayer__printer td,
        html body .et-fb-post-areas table.fiveprayer__printer th,
        html body .et-fb-post-areas table.fiveprayer__printer td,
        html body .brizy-editor table.fiveprayer__printer th,
        html body .brizy-editor table.fiveprayer__printer td,
        html body .vc_editor table.fiveprayer__printer th,
        html body .vc_editor table.fiveprayer__printer td {
            border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border) !important;
        }

        /* Table collapse */
        html body table.fiveprayer__printer,
        html body table.fiveprayer__DairyPrayer_,
        html body .fiveprayer__printer,
        html body .fiveprayer__DairyPrayer_ {
            border-collapse: collapse !important;
        }

        /* Highlight styles - ONLY use !important here to override odd/even */
        html body .fiveprayer__today_row,
        html body .fiveprayer-container .fiveprayer__DairyPrayer_ .fiveprayer__today_row,
        html body .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ .fiveprayer__today_row,
        html body .elementor-editor .fiveprayer__today_row,
        html body .elementor-editor-active .fiveprayer__today_row,
        html body .fl-builder-edit .fiveprayer__today_row,
        html body .et-fb-post-areas .fiveprayer__today_row,
        html body .brizy-editor .fiveprayer__today_row,
        html body .vc_editor .fiveprayer__today_row,
        html body .brz-ed-root .fiveprayer__today_row,
        html body .brz-ed-root .fiveprayer__printer tbody .fiveprayer__today_row td,
        html body .brz-ed-root .fiveprayer__DairyPrayer_ tbody .fiveprayer__today_row td {
            background-color: var(--fiveprayer-bg-highlight) !important;
            color: var(--fiveprayer-clr-highlight) !important;
        }

        /* Odd/Even row styles.

           The highlighted row is left out of the selector rather than left to
           lose on specificity: with `!important` here, the highlight's own
           `!important` rule would be the one fighting for the row. Excluding
           `tr.fiveprayer__today_row` keeps the highlight untouched and lets
           the `!important` win against a theme's own table striping — a theme
           commonly paints `table:not(.x):not(.y) tbody tr:nth-child(2n+1)`,
           which carries more classes than these rules and turned the odd rows
           white behind the plugin's white text. The `:not()` also brings the
           specificity above that theme selector. */
        html body .fiveprayer__printer tbody tr:not(.fiveprayer__today_row):nth-child(odd),
        html body .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):nth-child(odd) {
            background-color: var(--fiveprayer-bg-odd) !important;
            color: var(--fiveprayer-clr-odd) !important;
        }

        html body .fiveprayer__printer tbody tr:not(.fiveprayer__today_row):nth-child(even),
        html body .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):nth-child(even) {
            background-color: var(--fiveprayer-bg-even) !important;
            color: var(--fiveprayer-clr-even) !important;
        }

        <?php
        // 'replace' overwrites the row colour entirely, 'blend' layers the hover
        // colour over the row's own odd/even colour. The optional Hover Text
        // colour is applied only when set (alpha > 0) so a light hover background
        // does not leave white row text unreadable. Emitted only when the whole
        // hover effect is enabled.
        $hover_decls = '';
        if (!empty($data['hoverEnabled'])) {
            $hover_decls = (($data['hoverMode'] ?? 'blend') === 'replace')
                ? 'background-color: var(--fiveprayer-bg-hover) !important;'
                : 'background-image: linear-gradient(var(--fiveprayer-bg-hover), var(--fiveprayer-bg-hover));';
            if (!empty($data['hoverclr']) && ((float) ($data['hoverclr']['a'] ?? 0)) > 0) {
                $hover_decls .= ' color: var(--fiveprayer-clr-hover) !important;';
            }
        }
        if ($hover_decls !== '') : ?>
        html body .fiveprayer__printer tbody tr:not(.fiveprayer__today_row):hover,
        html body .fiveprayer__DairyPrayer_ tbody tr:not(.fiveprayer__today_row):hover {
            <?php echo esc_attr($hover_decls); ?>
        }
        <?php endif; ?>

        /* Fix vertical prayer table th elements to match row colors */
        html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(odd) th,
        html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(even) th {
            background-color: inherit !important;
            color: inherit !important;
        }

        html body .fiveprayer__tbmonthsecond {
            background-color: var(--fiveprayer-bg-second) !important;
            color: var(--fiveprayer-clr-second) !important;
        }

        /* Vertical daily prayer specific styles */
        .fiveprayer-container .fiveprayer__DairyPrayer_ th,
        .fiveprayer-container .fiveprayer__DairyPrayer_ td,
        .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ th,
        .fiveprayer__iqamah_next .fiveprayer__DairyPrayer_ td {
            border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border) !important;
            text-align: center !important;
            box-sizing: border-box !important;
        }

        /* Print Styles */
        @media print {
            /* Page controls, not timetable content. Everything else in this
               block matches the plugin's own markup: the page-wide reset that
               used to be here (hiding the theme's header/footer/content and
               shrinking `body *`) restyled pages the plugin only happened to
               be placed on. */
            #fiveprayer-no-print,
            .fiveprayer__printer_option select {
                display: none;
            }

            .fiveprayer__printer * {
                white-space: nowrap !important;
                height: fit-content !important;
                margin: 0 !important;
                padding: 0 !important;
                font-size: 8px !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            .fiveprayer__printer .printer_line {
                font-size: 12px !important;
                white-space: wrap !important;
            }

            .fiveprayer__noDisplay {
                display: block;
                margin-bottom: 10px !important;
            }

            .fiveprayer__printer {
                width: 100% !important;
                max-width: inherit !important;
            }

            #fiveprayer-div-to {
                width: 100% !important;
                max-width: inherit !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 0 !important;
            }

            #fiveprayer-div-to-print {
                width: 100% !important;
                border-collapse: collapse !important;
            }

            .fiveprayer__printer th,
            .fiveprayer__printer td,
            .fiveprayer__DairyPrayer_ th,
            .fiveprayer__DairyPrayer_ td {
                padding: 0 !important;
                padding-inline: 7px !important;
                padding-block: 3px !important;
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border) !important;
                text-align: center !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            html body .fiveprayer__tbhead,
            html body .fiveprayer__tbhead th {
                width: 100% !important;
                background: var(--fiveprayer-bg-first) !important;
                color: var(--fiveprayer-clr-first) !important;
            }

            html body .fiveprayer__tbmonthfirst,
            html body .fiveprayer__tbmonthfirst th {
                background-color: var(--fiveprayer-bg-first) !important;
                color: var(--fiveprayer-clr-first) !important;
            }

            html body .fiveprayer__tbmonthsecond,
            html body .fiveprayer__tbmonthsecond th {
                background-color: var(--fiveprayer-bg-second) !important;
                color: var(--fiveprayer-clr-second) !important;
            }

            html body .fiveprayer__printer tbody tr:nth-child(even),
            html body .fiveprayer__printer tbody tr:nth-child(even) td,
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(even),
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(even) td {
                background-color: var(--fiveprayer-bg-even) !important;
                color: var(--fiveprayer-clr-even) !important;
            }

            html body .fiveprayer__printer tbody tr:nth-child(odd),
            html body .fiveprayer__printer tbody tr:nth-child(odd) td,
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(odd),
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(odd) td {
                background-color: var(--fiveprayer-bg-odd) !important;
                color: var(--fiveprayer-clr-odd) !important;
            }

            /* Remove highlight in print mode */
            html body .fiveprayer__today_row,
            html body .fiveprayer__today_row td,
            html body .fiveprayer__highlight,
            html body .fiveprayer__highlight td {
                background-color: transparent !important;
                color: inherit !important;
            }

            html body .fiveprayer__DairyPrayer_ {
                border-collapse: collapse !important;
                width: fit-content !important;
            }

            html body .fiveprayer__printer .printer-page-container {
                display: grid !important;
                grid-template-columns: repeat(3,2fr) !important;
                grid-gap: 30px !important;
                margin-bottom: 1px !important;
                justify-content: stretch !important;
            }

            html body .fiveprayer__printer .left-printer {
                margin: 0 auto !important;
            }

            html body .fiveprayer__printer .med-printer {
                padding-inline: 48px !important;
                text-align: center !important;
            }

            html body .fiveprayer__printer .med-printer img {
                width: 160px !important;
                height: 130px !important;
            }

            html body .fiveprayer__printer .right-printer {
                margin: 0 auto !important;
                padding-left: 0.5rem !important;
            }

        }

        /* Screen Styles */
        @media screen {
            html body .fiveprayer__printer .printer-page-container {
                display: grid;
                grid-template-columns: repeat(3,2fr);
                grid-gap: 0px;
                align-items: stretch;
                justify-content: stretch;
            }

            html body .fiveprayer__printer .printer-page-container span {
                height: 0;
            }

            html body .fiveprayer__printer .med-printer {
                padding-inline: 48px;
                text-align: center;
            }

            html body .fiveprayer__printer .med-printer img {
                width: 160px;
                height: 130px;
            }

            html body .fiveprayer__noDisplay,
            html body .fiveprayer__printer #printerdisplay {
                display: none;
            }

            html body #fiveprayer-div-to {
                border-collapse: collapse;
                max-width: inherit;
            }

            /* The month table is repainted row by row only when its borders are
               separate: with collapsed borders the line between two cells
               belongs to both, so any row change invalidates the whole table —
               on a full month (31 rows x 13 cells) each hover repainted the
               entire table. Measured in Chrome on that page, four hover
               transitions cost 47.2 ms painting with a 6.3 ms worst frame
               collapsed and 31.5 ms with a 2.8 ms worst frame separated, with
               identical pixels (each cell draws only its right and bottom edge,
               see the template's cell rule). */
            html body #fiveprayer-div-to-print {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
            }

            html body .fiveprayer__printer_option {
                display: flex;
                justify-content: space-between;
            }

            html body .fiveprayer__printer_option select {
                padding: 9px;
            }

            html body .fiveprayer_top{
                display: contents;
            }

            html body .fiveprayer__clickPrint {
                padding: 9px;
                cursor: pointer;
                width: auto;
            }

            html body .fiveprayer__printer_option form {
                display: contents;
            }

            html body #fiveprayer-no-print table th {
                border: none;
            }

            html body .fiveprayer__printer thead {
                vertical-align: 0;
            }

            html body .fiveprayer__printer th,
            html body .fiveprayer__printer td,
            html body .fiveprayer__DairyPrayer_ th,
            html body .fiveprayer__DairyPrayer_ td {
                padding: 0;
                padding-inline: 3px;
                padding-block: 3px;
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border);
                text-align: center;
            }

            /* Frontend specific targeting */
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) .fiveprayer__printer th,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) .fiveprayer__printer td,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) .fiveprayer__DairyPrayer_ th,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) .fiveprayer__DairyPrayer_ td {
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border);
                padding: 3px;
                text-align: center;
                box-sizing: border-box;
            }

            /* Target all tables with prayer content on frontend */
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[id*="fiveprayer"] th,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[id*="fiveprayer"] td,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[class*="fiveprayer"] th,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[class*="fiveprayer"] td,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[id*="fiveprayer"] th,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[id*="fiveprayer"] td,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[class*="fiveprayer"] th,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[class*="fiveprayer"] td {
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border);
                padding: 3px;
                text-align: center;
            }

            /* Page builder specific overrides */
            html body .elementor-editor .fiveprayer__printer th,
            html body .elementor-editor .fiveprayer__printer td,
            html body .elementor-editor .fiveprayer__DairyPrayer_ th,
            html body .elementor-editor .fiveprayer__DairyPrayer_ td,
            html body .elementor-editor-active .fiveprayer__printer th,
            html body .elementor-editor-active .fiveprayer__printer td,
            html body .elementor-editor-active .fiveprayer__DairyPrayer_ th,
            html body .elementor-editor-active .fiveprayer__DairyPrayer_ td,
            html body .fl-builder-edit .fiveprayer__printer th,
            html body .fl-builder-edit .fiveprayer__printer td,
            html body .fl-builder-edit .fiveprayer__DairyPrayer_ th,
            html body .fl-builder-edit .fiveprayer__DairyPrayer_ td,
            html body .et-fb-post-areas .fiveprayer__printer th,
            html body .et-fb-post-areas .fiveprayer__printer td,
            html body .et-fb-post-areas .fiveprayer__DairyPrayer_ th,
            html body .et-fb-post-areas .fiveprayer__DairyPrayer_ td,
            html body .brizy-editor .fiveprayer__printer th,
            html body .brizy-editor .fiveprayer__printer td,
            html body .brizy-editor .fiveprayer__DairyPrayer_ th,
            html body .brizy-editor .fiveprayer__DairyPrayer_ td,
            html body .vc_editor .fiveprayer__printer th,
            html body .vc_editor .fiveprayer__printer td,
            html body .vc_editor .fiveprayer__DairyPrayer_ th,
            html body .vc_editor .fiveprayer__DairyPrayer_ td {
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border);
                padding: 3px;
                text-align: center;
                box-sizing: border-box;
            }

            /* Also target all tables in page builders with custom variables */
            html body .elementor-editor table.fiveprayer__printer th,
            html body .elementor-editor table.fiveprayer__printer td,
            html body .elementor-editor table.fiveprayer__DairyPrayer_ th,
            html body .elementor-editor table.fiveprayer__DairyPrayer_ td,
            html body .elementor-editor-active table.fiveprayer__printer th,
            html body .elementor-editor-active table.fiveprayer__printer td,
            html body .elementor-editor-active table.fiveprayer__DairyPrayer_ th,
            html body .elementor-editor-active table.fiveprayer__DairyPrayer_ td,
            html body .fl-builder-edit table.fiveprayer__printer th,
            html body .fl-builder-edit table.fiveprayer__printer td,
            html body .fl-builder-edit table.fiveprayer__DairyPrayer_ th,
            html body .fl-builder-edit table.fiveprayer__DairyPrayer_ td,
            html body .et-fb-post-areas table.fiveprayer__printer th,
            html body .et-fb-post-areas table.fiveprayer__printer td,
            html body .et-fb-post-areas table.fiveprayer__DairyPrayer_ th,
            html body .et-fb-post-areas table.fiveprayer__DairyPrayer_ td {
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border);
                padding: 3px;
                text-align: center;
            }

            /* Aggressive targeting for any table in page builders that might contain prayer times */
            html body .elementor-editor table[id*="fiveprayer"] th,
            html body .elementor-editor table[id*="fiveprayer"] td,
            html body .elementor-editor table[class*="fiveprayer"] th,
            html body .elementor-editor table[class*="fiveprayer"] td,
            html body .elementor-editor table[id*="fiveprayer"] th,
            html body .elementor-editor table[id*="fiveprayer"] td,
            html body .elementor-editor table[class*="fiveprayer"] th,
            html body .elementor-editor table[class*="fiveprayer"] td,
            html body .elementor-editor-active table[id*="fiveprayer"] th,
            html body .elementor-editor-active table[id*="fiveprayer"] td,
            html body .elementor-editor-active table[class*="fiveprayer"] th,
            html body .elementor-editor-active table[class*="fiveprayer"] td,
            html body .elementor-editor-active table[id*="fiveprayer"] th,
            html body .elementor-editor-active table[id*="fiveprayer"] td,
            html body .elementor-editor-active table[class*="fiveprayer"] th,
            html body .elementor-editor-active table[class*="fiveprayer"] td,
            html body .fl-builder-edit table[id*="fiveprayer"] th,
            html body .fl-builder-edit table[id*="fiveprayer"] td,
            html body .fl-builder-edit table[class*="fiveprayer"] th,
            html body .fl-builder-edit table[class*="fiveprayer"] td,
            html body .fl-builder-edit table[id*="fiveprayer"] th,
            html body .fl-builder-edit table[id*="fiveprayer"] td,
            html body .fl-builder-edit table[class*="fiveprayer"] th,
            html body .fl-builder-edit table[class*="fiveprayer"] td {
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border);
                padding: 3px;
                text-align: center;
            }

            /* Force table collapse in page builders */
            html body .elementor-editor .fiveprayer__printer,
            html body .elementor-editor-active .fiveprayer__printer,
            html body .fl-builder-edit .fiveprayer__printer,
            html body .et-fb-post-areas .fiveprayer__printer,
            html body .brizy-editor .fiveprayer__printer,
            html body .vc_editor .fiveprayer__printer,
            html body .elementor-editor .fiveprayer__DairyPrayer_,
            html body .elementor-editor-active .fiveprayer__DairyPrayer_,
            html body .fl-builder-edit .fiveprayer__DairyPrayer_,
            html body .et-fb-post-areas .fiveprayer__DairyPrayer_,
            html body .brizy-editor .fiveprayer__DairyPrayer_,
            html body .vc_editor .fiveprayer__DairyPrayer_,
            html body .elementor-editor table.fiveprayer__printer,
            html body .elementor-editor-active table.fiveprayer__printer,
            html body .fl-builder-edit table.fiveprayer__printer,
            html body .et-fb-post-areas table.fiveprayer__printer,
            html body .elementor-editor table.fiveprayer__DairyPrayer_,
            html body .elementor-editor-active table.fiveprayer__DairyPrayer_,
            html body .fl-builder-edit table.fiveprayer__DairyPrayer_,
            html body .et-fb-post-areas table.fiveprayer__DairyPrayer_ {
                border-collapse: collapse;
            }

            /* Frontend table collapse */
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) .fiveprayer__printer,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) .fiveprayer__DairyPrayer_,
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[id*="fiveprayer"],
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[class*="fiveprayer"],
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[id*="fiveprayer"],
            html body:not(.elementor-editor):not(.elementor-editor-active):not(.fl-builder-edit):not(.et-fb-post-areas) table[class*="fiveprayer"] {
                border-collapse: collapse;
            }

            html body .fiveprayer__printer th[style*="border"],
            html body .fiveprayer__printer td[style*="border"],
            html body .fiveprayer__DairyPrayer_ th[style*="border"],
            html body .fiveprayer__DairyPrayer_ td[style*="border"] {
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border);
            }

            html body .fiveprayer__tbhead,
            html body .fiveprayer__tbhead th {
                width: 100%;
                background: var(--fiveprayer-bg-first) !important;
                color: var(--fiveprayer-clr-first) !important;
            }

            html body .fiveprayer__today_row,
            html body .fiveprayer__today_row td {
                background-color: var(--fiveprayer-bg-highlight) !important;
                color: var(--fiveprayer-clr-highlight) !important;
            }

            html body .fiveprayer__tbmonthfirst,
            html body .fiveprayer__tbmonthfirst th {
                background-color: var(--fiveprayer-bg-first);
                color: var(--fiveprayer-clr-first);
            }

            html body .fiveprayer__tbmonthsecond,
            html body .fiveprayer__tbmonthsecond th {
                background-color: var(--fiveprayer-bg-second);
                color: var(--fiveprayer-clr-second);
            }

            html body .fiveprayer__printer tbody tr:nth-child(even),
            html body .fiveprayer__printer tbody tr:nth-child(even) td,
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(even),
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(even) td {
                background-color: var(--fiveprayer-bg-even);
                color: var(--fiveprayer-clr-even);
            }

            html body .fiveprayer__printer tbody tr:nth-child(odd),
            html body .fiveprayer__printer tbody tr:nth-child(odd) td,
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(odd),
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(odd) td {
                background-color: var(--fiveprayer-bg-odd);
                color: var(--fiveprayer-clr-odd);
            }

            /* Fix vertical prayer table th elements to match row colors in screen mode */
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(odd) th,
            html body .fiveprayer__DairyPrayer_ tbody tr:nth-child(even) th {
                background-color: inherit !important;
                color: inherit !important;
            }

            html body .fiveprayer-select-print {
                display: flex;
                padding: 0;
                margin: 0;
            }

            html body .fiveprayer-select-print form {
                margin-bottom: 0;
            }

            html body .fiveprayer-select-print select,
            html body #fiveprayer-click-print {
                border: none;
                height: 100%;
            }

            html body .fiveprayer-select-print select {
                border: none;
                align-self: center;
            }

            html body .fiveprayer-select-print .fiveprayer__clickPrint {
                border: none;
            }

            html body .fiveprayer__DairyPrayer_ {
                border-collapse: collapse;
                width: 100%;
            }

            html body .fiveprayer__DairyPrayer_ th,
            html body .fiveprayer__DairyPrayer_ td {
                padding: 5px;
                border-width: 0 1px 1px 0;
                border: var(--fiveprayer-border-size) var(--fiveprayer-border-style) var(--fiveprayer-clr-border);
                text-align: center;
            }

            html body .fiveprayer__DairyPrayerf_ th,
            html body .fiveprayer__DairyPrayerf_ td {
                padding: 10px;
            }

            html body .fiveprayer__highlight,
            html body .fiveprayer__highlight td {
                background-color: var(--fiveprayer-bg-highlight);
                color: var(--fiveprayer-clr-highlight);
            }

            html body .fiveprayer-container .next-prayer-notice {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                justify-content: center;
            }

            html body .fiveprayer-container .next-prayer-countdown {
                flex-basis: 100%;
                text-align: center;
                font-weight: 600;
            }
        }
        </style>
        <?php
    }
}

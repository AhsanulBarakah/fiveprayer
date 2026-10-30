import styled from "styled-components";

interface FivePrayerProps {
    readonly $rgba_odd_bg: { r: number; g: number; b: number; a: number };
    readonly $rgba_even_bg: { r: number; g: number; b: number; a: number };
    readonly $rgba_odd_text: { r: number; g: number; b: number; a: number };
    readonly $rgba_even_text: { r: number; g: number; b: number; a: number };
    readonly $rgba_border_clr?: { r: number; g: number; b: number; a: number };
    readonly $rgba_hover_bg?: { r: number; g: number; b: number; a: number };
    readonly $rgba_hover_text?: { r: number; g: number; b: number; a: number };
    readonly $hoverMode?: 'blend' | 'replace';
    readonly $hoverEnabled?: boolean;
    readonly $rgba_border_size?: number;
    readonly $rgba_border_style?: string;
    readonly $rgba_border_radius: number;
    readonly $rgba_light_bg?: { r: number; g: number; b: number; a: number };
    readonly $rgba_light_text?: { r: number; g: number; b: number; a: number };
}

export const PrayerTableStyled = styled.div.attrs<FivePrayerProps>((p) => ({
    style: {
        ...p.style,
        '--sc-color-odd': `rgba(${p.$rgba_odd_bg.r},${p.$rgba_odd_bg.g},${p.$rgba_odd_bg.b},${p.$rgba_odd_bg.a})`,
        '--sc-color-even': `rgba(${p.$rgba_even_bg.r},${p.$rgba_even_bg.g},${p.$rgba_even_bg.b},${p.$rgba_even_bg.a})`,
        '--sc-color-odd-text': `rgba(${p.$rgba_odd_text.r},${p.$rgba_odd_text.g},${p.$rgba_odd_text.b},${p.$rgba_odd_text.a})`,
        '--sc-color-even-text': `rgba(${p.$rgba_even_text.r},${p.$rgba_even_text.g},${p.$rgba_even_text.b},${p.$rgba_even_text.a})`,
        // `?? 1` rather than `|| 1`: 0 is a real width (no border) and must not be
        // upgraded to a 1px border in the preview.
        '--sc-border': p.$rgba_border_clr ? `${p.$rgba_border_style || 'solid'} ${p.$rgba_border_size ?? 1}px rgba(${p.$rgba_border_clr.r},${p.$rgba_border_clr.g},${p.$rgba_border_clr.b},${p.$rgba_border_clr.a})` : 'none',
        // The width on its own. The table needs an invisible border of exactly
        // this width so the `overflow: hidden` clip that rounds the corners
        // lands where the outline below draws the table's outer line.
        '--sc-border-width': `${p.$rgba_border_size ?? 1}px`,

        // Corner rounding, in whole pixels, from the same "Border radius"
        // setting the PHP templates read. The store always holds a number
        // (0 = square corners), so there is no fallback to mislead a reader
        // into thinking the preview can run without a value.
        '--sc-radius': `${p.$rgba_border_radius}px`,
        '--sc-highlight-bg': p.$rgba_light_bg ? `rgba(${p.$rgba_light_bg.r},${p.$rgba_light_bg.g},${p.$rgba_light_bg.b},${p.$rgba_light_bg.a})` : 'transparent',
        '--sc-highlight-text': p.$rgba_light_text ? `rgba(${p.$rgba_light_text.r},${p.$rgba_light_text.g},${p.$rgba_light_text.b},${p.$rgba_light_text.a})` : 'inherit',
        '--sc-hover-bg': p.$rgba_hover_bg ? `rgba(${p.$rgba_hover_bg.r},${p.$rgba_hover_bg.g},${p.$rgba_hover_bg.b},${p.$rgba_hover_bg.a})` : 'rgba(0,0,0,0.08)',
        '--sc-hover-text': p.$rgba_hover_text ? `rgba(${p.$rgba_hover_text.r},${p.$rgba_hover_text.g},${p.$rgba_hover_text.b},${p.$rgba_hover_text.a})` : 'inherit'
    },
}))`
    /* The line around the table is drawn with an outline, not with the table's
       own border — the same way the vertical preview and the PHP templates
       draw theirs. The rounded corners need overflow: hidden, and that clip
       runs on the padding box, so it discarded the table's own border and the
       cells' collapsed outer border with it — which is why no line was drawn
       around this table at all. An outline is not clipped by it and bends with
       the radius, so all four sides and all four corners stay painted. The
       transparent border of the same width keeps the clip exactly where that
       outline is drawn, so the two do not stack into a heavier line. Rounded
       corners come from Customizing → Timetable → Border → Border radius, the
       same setting the PHP templates read. */
    table {
        border-collapse: collapse;
        width: 100%;
        border: var(--sc-border-width) solid transparent;
        border-radius: var(--sc-radius);
        overflow: hidden;
        outline: var(--sc-border);
        outline-offset: calc(-1 * var(--sc-border-width));
    }
    thead tr th, thead tr td{
        padding-block: 6px;
        white-space: nowrap;
    }
    th, td {
        border: var(--sc-border);
        text-align: center;
        padding: 4px 8px;
    }
    /* The rounding lives on the table only: the corner cells keep square
       corners (mirrors the PHP templates exactly). A rounded cell's collapsed
       border is clipped by the same overflow clip wherever it curves, which
       used to leave the four corner lines unconnected; the table's outline
       above draws the outer ring instead, so no cell needs a radius. The row
       backgrounds still respect the rounded corners through the table's own
       overflow: hidden. */

    /* Same selectors as the front end: the stripes are scoped to tbody so the
       heading rows keep their own colours, and the highlighted row is left out
       so its own rule decides its colour instead of the stripe fighting it. */
    tbody tr:not(.fiveprayer__today_row):nth-child(odd) {
        background-color: var(--sc-color-odd);
        color: var(--sc-color-odd-text);
    }
    
    tbody tr:not(.fiveprayer__today_row):nth-child(even) {
        background-color: var(--sc-color-even);
        color: var(--sc-color-even-text);
    }
    
    tbody tr.fiveprayer__today_row {
        background-color: var(--sc-highlight-bg) !important;
        color: var(--sc-highlight-text) !important;
    }

    /* Hover highlight. 'blend' (default) layers the colour over the row's own
       colour so a translucent hover tints it; 'replace' overwrites the row
       colour entirely. An optional Hover Text colour is applied only when set
       (alpha > 0) so white-on-white rows stay readable after a Replace. */
    ${(p) => {
        if (p.$hoverEnabled === false) return '';
        const bg = p.$hoverMode === 'replace'
            ? 'background-color: var(--sc-hover-bg) !important;'
            : 'background-image: linear-gradient(var(--sc-hover-bg), var(--sc-hover-bg));';
        const text = p.$rgba_hover_text && p.$rgba_hover_text.a > 0
            ? ' color: var(--sc-hover-text) !important;'
            : '';
        return `tr:not(.fiveprayer__today_row):hover {\n            ${bg}${text}\n        }`;
    }}
`;

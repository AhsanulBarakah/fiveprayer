import styled from 'styled-components';
import type { RGBAColor } from '../../../state/storeTimeTableColor';

interface VerticalPrayerProps {
  readonly $second_bg: RGBAColor;
  readonly $second_text: RGBAColor;
  readonly $odd_bg: RGBAColor;
  readonly $even_bg: RGBAColor;
  readonly $odd_text: RGBAColor;
  readonly $even_text: RGBAColor;
  readonly $border_clr: RGBAColor;
  readonly $border_size: number;
  readonly $border_style: string;
  readonly $border_radius: number;
  readonly $light_bg: RGBAColor;
  readonly $light_text: RGBAColor;
  readonly $hover_bg: RGBAColor;
  readonly $hover_text: RGBAColor;
  readonly $hoverMode: 'blend' | 'replace';
  readonly $hoverEnabled: boolean;
}

const rgba = (c: RGBAColor) => `rgba(${c.r},${c.g},${c.b},${c.a})`;

/**
 * Vertical Today preview table.
 *
 * Mirrors the frontend `.fiveprayer-container .fiveprayer__iqamah_next
 * table.fiveprayer__DairyPrayer_` markup (see php/classes/core/ShortCodes/
 * ShortCodeVerticalDailyPrayer.php + StyleRendererTrait) using the same
 * colour store as the monthly preview, so the admin sees the real output
 * instead of an approximation.
 */
export const VerticalPrayerTableStyled = styled.div.attrs<VerticalPrayerProps>((p) => ({
  style: {
    ...p.style,
    '--vp-second-bg': rgba(p.$second_bg),
    '--vp-second-text': rgba(p.$second_text),
    '--vp-odd-bg': rgba(p.$odd_bg),
    '--vp-odd-text': rgba(p.$odd_text),
    '--vp-even-bg': rgba(p.$even_bg),
    '--vp-even-text': rgba(p.$even_text),
    // `?? 1` instead of `|| 1`: 0 is a valid width (no border) and must survive.
    '--vp-border': `${p.$border_style || 'solid'} ${p.$border_size ?? 1}px ${rgba(p.$border_clr)}`,
    // Corner rounding, in whole pixels, from the same "Border radius" setting
    // the front end's vertical table reads. The store always holds a number
    // (0 = square corners), so no fallback is needed.
    '--vp-radius': `${p.$border_radius}px`,
    '--vp-highlight-bg': rgba(p.$light_bg),
    '--vp-highlight-text': rgba(p.$light_text),
    '--vp-hover-bg': rgba(p.$hover_bg),
    '--vp-hover-text': rgba(p.$hover_text),
    // The variables the frontend puts on :root (via StyleManager). Set here so
    // the copied notice rules below resolve to the user's own border settings.
    '--clr-border': rgba(p.$border_clr),
    '--border-style': p.$border_style || 'solid',
    '--border-size': `${p.$border_size ?? 1}px`,
  },
}))<VerticalPrayerProps>`
  width: 100%;
  /* The front end's table text is the theme's neutral body colour (near-black),
     but inside wp-admin the preview would otherwise inherit the admin's slate
     grey (body color #3c434a). Pin it to the front end's text colour so the
     notice, date line and clock read the same. Rows/sub-header keep their own
     configured colours below. */
  color: #111;

  table {
    border-collapse: collapse;
    width: 100%;
    /* Rounded corners come from Customizing → Timetable → Border → Border
       radius — the same setting the front end's vertical table reads, so the
       two can never disagree. The rounding stays on the table and is never put
       on the cells: the overflow clip (needed so row colours respect the
       radius) cuts a collapsed cell border wherever the corners curve, which
       left the four corner lines unconnected. The outer line is therefore an
       outline, which bends with the radius, and the invisible border of the
       same width keeps the clip exactly where that outline is drawn.
       Mirrors renderVerticalTableRadiusStyles() on the front end. */
    border: var(--border-size) solid transparent;
    border-radius: var(--vp-radius);
    overflow: hidden;
    outline: var(--vp-border);
    outline-offset: calc(-1 * var(--border-size));
  }

  th,
  td {
    border: var(--vp-border);
    text-align: center;
    padding: 5px 8px;
    box-sizing: border-box;
  }

  /* Top header cell — the notice + date line live in here. The frontend does
     not paint this cell (it only carries the table border), so neither do we. */
  th.prayer-header {
    padding: 10px 12px;
  }

  /* Next-prayer notice + date line. Copied from
     NextPrayerCountdown::noticeStyles() — those rules are only printed on the
     frontend, so the admin preview rendered the block unstyled without them. */
  .next-prayer-notice {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
    margin: 0 0 8px;
    padding-bottom: 8px;
    border-bottom: var(--border-size) var(--border-style) var(--clr-border);
    text-align: center;
    line-height: 1.2;
    /* The frontend notice has no font-size of its own — it inherits the page's
       base size (16px on a default theme). The admin screen's base is smaller,
       so set it explicitly here: that way the em-sized name/time below and the
       countdown render at the same size visitors see. */
    font-size: 16px;
  }

  .prayer-date {
    font-size: 14.5px;
    line-height: 1.7;
    opacity: 0.85;
  }

  .prayer-date-time {
    display: flex;
    gap: 6px;
    align-items: baseline;
    justify-content: center;
    /* Equal-width digits so the per-second tick does not change the width of
       the centred line and shove the label sideways (same idea as the front
       end's tabular-nums on the prayer time). */
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
  }

  /* The live clock. The front end pins it to "font-family: auto" (the browser's
     default font) and inherits the weight. That font ships uniform-width digits
     for every script - Latin AND Arabic-Indic - so the ticking seconds never
     change the width, and the AM/PM marker renders exactly as on the front end.
     Mirrored here so the admin preview matches. */
  .fiveprayer-live-time {
    display: inline-block;
    white-space: nowrap;
    flex: 0 0 auto;
    font-family: auto;
    font-weight: inherit;
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
  }

  .next-prayer-head {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 3px 10px;
  }

  .next-prayer-title {
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    opacity: 0.65;
  }

  .next-prayer-name,
  .next-prayer-time {
    font-size: 1.45em;
    font-weight: 700;
    line-height: 1.15;
  }

  .next-prayer-time {
    font-variant-numeric: tabular-nums;
  }

  /* Live next-prayer countdown (from NextPrayerCountdown::noticeStyles() /
     renderStyles()). */
  .next-prayer-countdown {
    display: flex;
    justify-content: center;
  }

  .next-prayer-countdown:empty {
    display: none;
  }

  .fiveprayer-next-prayer-countdown {
    display: inline-block;
    text-align: center;
    white-space: nowrap;
    /* No explicit size, exactly like the frontend rule — it inherits the
       notice's base (16px above), so the live value matches the frontend. */
    font-variant-numeric: tabular-nums;
    font-feature-settings: 'tnum' 1;
  }

  /* Prayer / Begins / Iqamah sub-header row. The front end paints this colour
     on the row itself (#fiveprayer-tbmonth-second) and lets the cells inherit
     it, so a Blend hover composites the tint over the sub-header colour. With
     the colour on the cells instead, the hover emptied them and the row fell
     back to the page background — a visible colour jump the front end never
     showed. */
  #fiveprayer-tbmonth-second {
    background-color: var(--vp-second-bg);
    color: var(--vp-second-text);
  }

  /* Same selectors as the front end: the highlighted row is left out of the
     stripes so its own rule decides its colour. */
  tbody tr:not(.fiveprayer__today_row):nth-child(odd) {
    background-color: var(--vp-odd-bg);
    color: var(--vp-odd-text);
  }

  tbody tr:not(.fiveprayer__today_row):nth-child(even) {
    background-color: var(--vp-even-bg);
    color: var(--vp-even-text);
  }

  /* th cells inherit the row colour on the vertical table (see the screen
     rules in StyleRendererTrait). */
  tbody tr th,
  tbody tr td {
    background-color: inherit;
    color: inherit;
  }

  tbody tr.fiveprayer__today_row,
  tbody tr.fiveprayer__today_row th,
  tbody tr.fiveprayer__today_row td {
    background-color: var(--vp-highlight-bg) !important;
    color: var(--vp-highlight-text) !important;
  }

  ${(p) => {
    if (p.$hoverEnabled === false) return '';
    const bg =
      p.$hoverMode === 'replace'
        ? 'background-color: var(--vp-hover-bg) !important;'
        : 'background-image: linear-gradient(var(--vp-hover-bg), var(--vp-hover-bg));';
    const text =
      p.$hover_text.a > 0 ? ' color: var(--vp-hover-text) !important;' : '';
    // Mirrors renderVerticalTableHoverStyles(): the tint goes on the row —
    // both the body rows (except "today"), the sub-header row and the notice
    // row — so Blend layers over the row colour and Replace overwrites it.
    return `
    tbody tr:not(.fiveprayer__today_row):hover,
    thead tr:hover {
      ${bg}${text}
    }

    /* Keep the cells transparent on hover, exactly like the frontend: the
       global stylesheet also paints the odd/even colour on the cells, and a
       cell's own colour is drawn over the row's, so the tint would stay
       hidden behind it. An !important declaration is what beats that cell
       colour (the frontend rule carries one too), otherwise Blend tinted only
       some of the columns and the sub-header row never tinted at all. */
    tbody tr:not(.fiveprayer__today_row):hover th,
    tbody tr:not(.fiveprayer__today_row):hover td,
    thead tr:hover th,
    thead tr:hover td {
      background-color: transparent !important;
    }`;
  }}
`;

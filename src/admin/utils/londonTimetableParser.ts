/**
 * London Unified timetable parser
 *
 * Parses a pasted full-year mosque timetable into per-date prayer times. Two
 * printed layouts are recognised (both can be pasted through the same Import
 * button — only the *layout* is detected, nothing is hardcoded):
 *
 * ── Layout 1 — East London / printed London Unified (12 columns, no AM/PM):
 *
 *   SEPTEMBER 2026
 *   Fajr   Zuhr   'Asr   Maghrib   'Ishā
 *   Begins Jamā'ah Sunrise Begins Jamā'ah 1 Mithl 2 Mithl Jamā'ah Begins Jamā'ah Begins Jamā'ah
 *   Tue 1 4:38 4:58 6:10 1:06 1:30 4:44 5:41 6:00 7:50 7:57 9:01 9:15
 *   ...
 *
 *   Column order (after the day): Fajr Begins, Fajr Jamā'ah, Sunrise, Zuhr
 *   Begins, Zuhr Jamā'ah, 'Asr 1 Mithl, 'Asr 2 Mithl, 'Asr Jamā'ah, Maghrib
 *   Begins, Maghrib Jamā'ah, 'Ishā Begins, 'Ishā Jamā'ah.
 *
 * ── Layout 2 — Date + Hijri + 7 prayer times (each with AM/PM):
 *
 *   January 2026
 *   Date | Hijri | Fajr | Sunrise | Zuhr | ʿAsr 1 | ʿAsr 2 | Maghrib | ʿIsha
 *   1Thu 12 Rajab 1447 6:26 AM 8:03 AM 12:09 PM 1:47 PM 2:18 PM 4:05 PM 5:42 PM
 *   ...
 *
 *   Column order (after the day + Hijri date): Fajr, Sunrise, Zuhr, ʿAsr 1,
 *   ʿAsr 2, Maghrib, ʿIshā. Only the prayer times are imported — the Hijri
 *   date column is skipped, and ʿAsr 1 (Shafi'i/Mithl 1) fills the Asr chart
 *   exactly like Layout 1 ignores the 2-Mithl column. This layout has no
 *   Jamā'ah columns.
 *
 * Times print in a 12-hour clock. Layout 2 carries an explicit AM/PM suffix,
 * which is honoured; when a time has no suffix (Layout 1), each prayer column
 * is converted using its known daily range (Fajr/Sunrise are morning, the
 * rest are afternoon). The UK clock changes (last Sunday of March / October)
 * are just data rows — the published minutes for those dates are kept as
 * printed, so the chart stays correct across BST/GMT transitions.
 *
 * Note: regexes deliberately avoid backslash escapes (character classes like
 * [ \t] and [0-9] instead of \s and \d) so the source stays robust no matter
 * how it is written/encoded.
 *
 * @module utils/londonTimetableParser
 */

/** Month header, e.g. 'SEPTEMBER 2026' or 'January 2026'. */
const MONTH_HEADER =
  /^(JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER|DECEMBER)[ \t]*20[0-9][0-9]/i;

/** A printed time token: H:MM with an optional AM/PM suffix. */
const TIME_TOKEN = /([0-9]{1,2}):([0-9]{2})[ \t]*(AM|PM|am|pm)?/g;

/**
 * Start of a data row: a weekday may sit on either side of the day number —
 * 'Thu 1', 'Wed14' or '1Thu' — followed by anything (Hijri date, times…).
 * The day number is the first 1-2 digits on the line.
 */
const DAY_PREFIX = /^[ \t]*(?:[A-Za-z]{2,4}[ \t]*)?([0-9]{1,2})(?:[ \t]*[A-Za-z]{2,4})?/;

const MONTH_INDEX: Record<string, number> = {
  JANUARY: 0, FEBRUARY: 1, MARCH: 2, APRIL: 3, MAY: 4, JUNE: 5,
  JULY: 6, AUGUST: 7, SEPTEMBER: 8, OCTOBER: 9, NOVEMBER: 10, DECEMBER: 11,
};

export const CHART_PRAYERS = [
  'fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha',
] as const;
export type ChartPrayer = (typeof CHART_PRAYERS)[number];

/** 12 months × up to 31 days of 'HH:MM' (24h) or null (no value). */
export type PrayerChart = (string | null)[][];

/** The five prayers that have a printed Jamā'ah column in the timetable. */
export const JAMAAH_PRAYERS = [
  'fajr', 'dhuhr', 'asr', 'maghrib', 'isha',
] as const;
export type JamaahPrayer = (typeof JAMAAH_PRAYERS)[number];

export interface ParsedTimetable {
  fajr: PrayerChart;
  sunrise: PrayerChart;
  dhuhr: PrayerChart;
  asr: PrayerChart;
  /**
   * The printed second 'Asr time (2 Mithl / Hanafi opinion). Optional: the
   * East London layout always carries it; the Date/Hijri layout may or may
   * not. Only imported when the admin leaves the second-'Asr option on.
   */
  asr2: PrayerChart;
  maghrib: PrayerChart;
  isha: PrayerChart;
  /** Printed Jamā'ah (congregation) times — only Layout 1 has these. */
  fajrJamaah: PrayerChart;
  dhuhrJamaah: PrayerChart;
  asrJamaah: PrayerChart;
  maghribJamaah: PrayerChart;
  ishaJamaah: PrayerChart;
  /** True when the pasted table actually carried Jamā'ah columns. */
  hasJamaah: boolean;
  /** True when the pasted table actually carried a second 'Asr column. */
  hasAsr2: boolean;
  /** How many day rows were parsed (should be 365 for a full year). */
  rows: number;
  /** Per-month row counts (Jan..Dec) for feedback. */
  rowsByMonth: number[];
}

const emptyChart = (): PrayerChart =>
  Array.from({ length: 12 }, () => Array(31).fill(null));

/**
 * Convert a printed 12-hour time to 24h.
 * When a meridiem (AM/PM) is printed it wins; otherwise the prayer's known
 * daily range is used (Fajr/Sunrise are morning, the others are afternoon —
 * any printed hour below 11 is PM).
 */
const to24h = (
  h: number,
  m: number,
  mer: string | undefined,
  prayer: string
): string => {
  let hour = h;
  if (mer) {
    const pm = /^p/i.test(mer);
    if (pm && hour < 12) hour += 12;
    else if (!pm && hour === 12) hour = 0;
  } else if (prayer !== 'fajr' && prayer !== 'sunrise' && hour < 11) {
    hour += 12;
  }
  return `${String(hour).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Parse a pasted full-year timetable (either supported layout). Returns null
 * when no day rows were found (e.g. the user pasted something in an
 * unsupported format).
 */
export const parseLondonUnifiedTimetable = (text: string): ParsedTimetable | null => {
  const out: ParsedTimetable = {
    fajr: emptyChart(), sunrise: emptyChart(), dhuhr: emptyChart(),
    asr: emptyChart(), asr2: emptyChart(), maghrib: emptyChart(), isha: emptyChart(),
    fajrJamaah: emptyChart(), dhuhrJamaah: emptyChart(),
    asrJamaah: emptyChart(), maghribJamaah: emptyChart(), ishaJamaah: emptyChart(),
    hasJamaah: false,
    hasAsr2: false,
    rows: 0,
    rowsByMonth: Array(12).fill(0),
  };

  let month = -1;
  let parsed = 0;

  String(text)
    .split('\n')
    .forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line) return;

      const mh = line.match(MONTH_HEADER);
      if (mh) {
        month = MONTH_INDEX[mh[1].toUpperCase()] ?? -1;
        return;
      }
      if (month < 0) return; // row before any month header — ignore

      // Every data row starts with the day number (weekday may sit on either
      // side: 'Thu 1', 'Wed14' or '1Thu').
      const dp = line.match(DAY_PREFIX);
      if (!dp) return; // header rows, footnotes, '*', blank lines
      const day = Number(dp[1]);
      if (day < 1 || day > 31) return;

      // Collect every printed time on the line. Layout 1 rows have 12 times,
      // Layout 2 rows have 7 (with the Hijri date in between); a 6-time row
      // is accepted as Layout 2 without the ʿAsr 2 column.
      const tokens = Array.from(line.matchAll(TIME_TOKEN));
      if (tokens.length !== 12 && tokens.length !== 7 && tokens.length !== 6)
        return;

      const idx = day - 1;
      const pick = (n: number, prayer: string): string | null => {
        const h = Number(tokens[n][1]);
        const m = Number(tokens[n][2]);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        return to24h(h, m, tokens[n][3], prayer);
      };

      if (tokens.length === 12) {
        // Layout 1: day, then 12 times:
        // fajrBegins(0) fajrJamaah(1) sunrise(2) dhuhrBegins(3)
        // dhuhrJamaah(4) asr1(5) asr2(6) asrJamaah(7) maghribBegins(8)
        // maghribJamaah(9) ishaBegins(10) ishaJamaah(11)
        out.fajr[month][idx] = pick(0, 'fajr');
        out.sunrise[month][idx] = pick(2, 'sunrise');
        out.dhuhr[month][idx] = pick(3, 'dhuhr');
        out.asr[month][idx] = pick(5, 'asr');
        // Second 'Asr time (2 Mithl / Hanafi opinion) — optional extra column.
        const asr2Value = pick(6, 'asr');
        out.asr2[month][idx] = asr2Value;
        if (asr2Value !== null) out.hasAsr2 = true;
        out.maghrib[month][idx] = pick(8, 'maghrib');
        out.isha[month][idx] = pick(10, 'isha');
        // Jamā'ah columns — same 12-hour conversion as the matching Begins
        // prayer (Fajr stays morning; the rest are afternoon).
        out.fajrJamaah[month][idx] = pick(1, 'fajr');
        out.dhuhrJamaah[month][idx] = pick(4, 'dhuhr');
        out.asrJamaah[month][idx] = pick(7, 'asr');
        out.maghribJamaah[month][idx] = pick(9, 'maghrib');
        out.ishaJamaah[month][idx] = pick(11, 'isha');
        out.hasJamaah = true;
      } else {
        // Layout 2 (7 times, with Hijri date column skipped): fajr(0)
        // sunrise(1) dhuhr(2) asr1(3) asr2(4) maghrib(5) isha(6).
        // A 6-time row is the same without the ʿAsr 2 column.
        out.fajr[month][idx] = pick(0, 'fajr');
        out.sunrise[month][idx] = pick(1, 'sunrise');
        out.dhuhr[month][idx] = pick(2, 'dhuhr');
        out.asr[month][idx] = pick(3, 'asr');
        if (tokens.length === 7) {
          const asr2Value = pick(4, 'asr');
          out.asr2[month][idx] = asr2Value;
          if (asr2Value !== null) out.hasAsr2 = true;
        }
        out.maghrib[month][idx] = pick(5, 'maghrib');
        out.isha[month][idx] = pick(6, 'isha');
        // No Jamā'ah columns in this layout.
      }

      parsed++;
      out.rowsByMonth[month]++;
    });

  if (parsed === 0) return null;
  out.rows = parsed;
  return out;
};

/**
 * Convert a parsed timetable into the Unified Method params chart fields.
 * `includeJamaah` (default true) also maps the printed Jamā'ah columns to the
 * chart*Jamaah params used for the Iqamah columns — but only when the pasted
 * table actually carried Jamā'ah columns (Layout 1).
 */
export const parsedToParams = (
  parsed: ParsedTimetable,
  includeJamaah = true,
  includeAsr2 = true
): Record<string, PrayerChart> => ({
  chartFajr: parsed.fajr,
  chartSunrise: parsed.sunrise,
  chartDhuhr: parsed.dhuhr,
  chartAsr: parsed.asr,
  chartMaghrib: parsed.maghrib,
  chartIsha: parsed.isha,
  ...(includeAsr2 && parsed.hasAsr2
    ? { chartAsr2: parsed.asr2 }
    : {}),
  ...(includeJamaah && parsed.hasJamaah
    ? {
        chartFajrJamaah: parsed.fajrJamaah,
        chartDhuhrJamaah: parsed.dhuhrJamaah,
        chartAsrJamaah: parsed.asrJamaah,
        chartMaghribJamaah: parsed.maghribJamaah,
        chartIshaJamaah: parsed.ishaJamaah,
      }
    : {}),
});

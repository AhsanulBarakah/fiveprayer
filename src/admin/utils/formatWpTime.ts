/**
 * WordPress time-format clock formatting.
 *
 * Renders a clock the same way `live-time.js` does on the front end: the shape
 * comes from the site's `time_format` option (`g:i:s a`, `H:i`, ...) and, when
 * the site's Translate language is active, the digits and the AM/PM marker are
 * replaced through `gregorian_numbers`.
 *
 * Used by the admin Vertical Today preview so its "Current Local Time" value
 * matches the live page instead of a hard-coded `en-US` rendering.
 *
 * @module utils/formatWpTime
 */

/** 24-hour wall-clock parts (the caller decides which timezone they represent). */
export type ClockParts = {
  hours: number;
  minutes: number;
  seconds: number;
};

export type ClockTranslator = {
  /** Translate a single digit ("0".."9"). */
  digit?: (digit: string) => string;
  /** Translate the AM/PM marker; return `undefined` to fall back to the format's casing. */
  meridiem?: (period: 'AM' | 'PM') => string | undefined;
};

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Format 24-hour clock parts using a WordPress `time_format` string.
 *
 * Casing of the AM/PM marker follows the format (`a` lower, `A` upper), exactly
 * like the front-end ticker. When a translator is supplied, the translated
 * marker is re-cased to match as well.
 */
export const formatWpClock = (
  parts: ClockParts,
  format: string,
  translate?: ClockTranslator
): string => {
  const safeFormat = format && format.trim() !== '' ? format : 'g:i a';
  const periodCase = safeFormat.includes('a') ? 'lower' : 'upper';
  const is24hr = safeFormat.includes('H') || safeFormat.includes('G');
  const showSeconds = safeFormat.includes('s');
  const padHours = safeFormat.includes('h') || safeFormat.includes('H');

  const mins = pad(parts.minutes);
  const secs = showSeconds ? pad(parts.seconds) : '';

  let clock: string;
  if (is24hr) {
    const hours = padHours ? pad(parts.hours) : String(parts.hours);
    clock = `${hours}:${mins}${showSeconds ? `:${secs}` : ''}`;
  } else {
    const period: 'AM' | 'PM' = parts.hours >= 12 ? 'PM' : 'AM';
    const hours = parts.hours % 12 || 12;
    const hourText = padHours ? pad(hours) : String(hours);

    const custom = translate?.meridiem?.(period);
    let marker = custom ?? period;
    marker = periodCase === 'lower' ? marker.toLowerCase() : marker.toUpperCase();

    clock = `${hourText}:${mins}${showSeconds ? `:${secs}` : ''} ${marker}`;
  }

  // Only digits are translated; separators and the (already resolved) marker
  // pass through untouched.
  if (translate?.digit) {
    clock = clock.replace(/\d/g, (digit) => translate.digit!(digit));
  }

  return clock;
};

/**
 * Next-Prayer Countdown formatting.
 *
 * Single source of truth for how the live "time remaining until the next
 * prayer" value is written. Mirrors the PHP/JS renderer
 * (NextPrayerCountdown::format / live-ticker) so the admin preview and the
 * Configure Settings preview never drift from the front end.
 *
 * @module utils/countdownFormat
 */
import { __ } from '@wordpress/i18n';

export type CountdownConfig = {
  format: 'long' | 'short' | 'clock';
  show_prefix: boolean;
  show_suffix: boolean;
  show_now: boolean;
  show_seconds: boolean;
};

/**
 * Optional translator for the countdown's unit and connector words.
 *
 * On the front end these words resolve through the plugin's own Translate
 * system (`vertical_daily_prayer`), so the Vertical Today preview passes a
 * translator built from that store. When omitted, the countdown falls back to
 * the WordPress gettext strings below (the admin language).
 */
export type CountdownTranslator = (word: string) => string;

/** Mirror of the PHP/JS countdown formatter so the admin preview is accurate. */
export const formatCountdown = (
  remainingSeconds: number,
  config: CountdownConfig,
  translate?: CountdownTranslator
): string => {
  // The literal gettext calls stay in the source so string extraction keeps
  // finding them; the optional translator only overrides the shown value.
  const word = (key: string, fallback: string): string =>
    translate ? translate(key) || fallback : fallback;

  // Single-character unit suffix for the compact "short" format. Derived from
  // the translated unit word (NextPrayerCountdown::unitSuffix) so it follows
  // the language — "hours" => "h", "ساعات" => "س" — instead of a hard-coded
  // Latin h/m/s.
  const unitSuffix = (key: string, fallback: string): string =>
    Array.from(word(key, fallback))[0] ?? '';

  const showSeconds = !!config.show_seconds;
  let secs = Math.max(0, Math.floor(remainingSeconds));

  // Hidden seconds floor to the whole minute so the value ticks once a minute.
  if (!showSeconds && secs > 0) secs = Math.max(60, Math.floor(secs / 60) * 60);

  // The "Now" label is optional; when it is off nothing is shown at zero.
  if (secs <= 0) return config.show_now ? word('Now', __('Now', 'fiveprayer')) : '';

  const hours = Math.floor(secs / 3600);
  const minutes = Math.floor((secs % 3600) / 60);
  const remainder = secs % 60;
  const pad = (n: number) => (n < 10 ? '0' : '') + n;

  // Every number is zero-padded and every unit is always shown, so the value
  // keeps a constant width while it counts down (no jump when 10 → 9, and a
  // unit reaching zero stays on screen).
  let value: string;
  if (config.format === 'clock') {
    value = showSeconds
      ? `${pad(hours)}:${pad(minutes)}:${pad(remainder)}`
      : `${pad(hours)}:${pad(minutes)}`;
  } else if (config.format === 'short') {
    const parts: string[] = [
      `${pad(hours)}${unitSuffix('hours', __('hours', 'fiveprayer'))}`,
      `${pad(minutes)}${unitSuffix('minutes', __('minutes', 'fiveprayer'))}`,
    ];
    if (showSeconds) parts.push(`${pad(remainder)}${unitSuffix('seconds', __('seconds', 'fiveprayer'))}`);
    value = parts.join(' ');
  } else {
    const parts: string[] = [
      `${pad(hours)} ${hours === 1 ? word('hour', __('hour', 'fiveprayer')) : word('hours', __('hours', 'fiveprayer'))}`,
      `${pad(minutes)} ${minutes === 1 ? word('minute', __('minute', 'fiveprayer')) : word('minutes', __('minutes', 'fiveprayer'))}`,
    ];
    if (showSeconds) {
      parts.push(`${pad(remainder)} ${remainder === 1 ? word('second', __('second', 'fiveprayer')) : word('seconds', __('seconds', 'fiveprayer'))}`);
    }
    value = parts.join(' ');
  }

  // The connector words mirror the PHP/JS output. Their translations live in
  // the Translate system; here they are shown in the admin language.
  const prefix = config.show_prefix ? word('in', __('in', 'fiveprayer')) : '';
  const suffix = config.show_suffix ? word('remaining', __('remaining', 'fiveprayer')) : '';

  // One space is always placed between a connector and the time.
  return (prefix ? prefix + ' ' : '') + value + (suffix ? ' ' + suffix : '');
};

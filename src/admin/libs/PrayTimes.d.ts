/**
 * Type declarations for the vendored PrayTimes.js calculator (praytimes.org).
 *
 * The library itself is plain JavaScript; only the surface the admin app uses
 * is declared here, so `import PrayTimes from '../libs/PrayTimes.js'` is typed
 * instead of implicitly `any`.
 */

/** Named calculation methods the library ships with, keyed by code. */
export type PrayTimesMethods = Record<string, Record<string, unknown>>;

export default class PrayTimes {
  /** Every calculation setting currently applied (method, tune, rounding, …). */
  settings: Record<string, unknown>;

  /** Built-in calculation methods (MWL, ISNA, Egypt, …). */
  methods: PrayTimesMethods;

  constructor(method?: string);

  /** Register a custom calculation method. */
  addMethod(name: string, params: Record<string, unknown>): this;

  /** Select a registered method by name. */
  method(method: string): this;

  /** Alias of `method()` used by some call sites. */
  setMethod(method: string): this;

  /** Set `[latitude, longitude]`. */
  location(coordinates: number[]): this;

  /** Set an IANA timezone name, e.g. 'Europe/London'. */
  timezone(timezone: string): this;

  /** Set the UTC offset in hours, or 'auto'. */
  utcOffset(offset: number | string): this;

  /** Adjust calculation parameters (asr, midnight, highLats, fajr, isha, …). */
  adjust(params: Record<string, unknown>): this;

  /** Tune individual times by minutes. */
  tune(offsets: Record<string, number | string>): this;

  /** Output format: '24h', '12h', '12H', '24hs', … */
  format(format: string): this;

  /** Rounding mode ('nearest' | 'up' | 'down' | 'none') and seconds threshold. */
  round(method: string, threshold?: number): this;

  /** Compute the times for a date; keys are prayer names in lower case. */
  times(date?: Date | string | number): Record<string, string>;
}

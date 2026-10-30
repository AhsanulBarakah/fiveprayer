/**
 * Test double for the vendored `src/admin/libs/PrayTimes.js` engine.
 *
 * The library is plain ESM-with-CommonJS-fallback JavaScript; Vite's module
 * transform cannot evaluate its `module.exports` fallback, so unit tests alias
 * it to this stub. The helpers under test (rounding, iqamah shifting, calendar
 * maths) never call the engine, they only import it.
 */
export default class PrayTimesStub {
  settings: Record<string, unknown> = {};

  methods: Record<string, Record<string, unknown>> = {};

  constructor(_method?: string) {}

  addMethod(name: string, params: Record<string, unknown>): this {
    this.methods[name] = params;
    return this;
  }

  method(_method: string): this {
    return this;
  }

  setMethod(_method: string): this {
    return this;
  }

  location(_coordinates: number[]): this {
    return this;
  }

  timezone(_timezone: string): this {
    return this;
  }

  utcOffset(_offset: number | string): this {
    return this;
  }

  adjust(params: Record<string, unknown>): this {
    Object.assign(this.settings, params);
    return this;
  }

  tune(_offsets: Record<string, number | string>): this {
    return this;
  }

  format(_format: string): this {
    return this;
  }

  round(_method: string, _threshold?: number): this {
    return this;
  }

  /**
   * Deterministic stand-in for the real engine.
   *
   * The only thing the time consumers can observe here is which 'Asr shadow
   * factor was configured: the stub reports 14:30 for the one-mithl (Standard)
   * factor and 15:30 for the two-mithl (Hanafi) one, so a test can assert that
   * the second 'Asr really came from the two-mithl computation. Every other
   * time is a fixed value that never changes between calls.
   */
  times(_date?: Date | string | number): Record<string, string> {
    const asr =
      String(this.settings.asr ?? 'Standard').toLowerCase() === 'hanafi'
        ? '15:30:00'
        : '14:30:00';

    return {
      imsak: '04:00:00',
      fajr: '04:10:00',
      sunrise: '05:30:00',
      dhuhr: '12:30:00',
      asr,
      sunset: '19:20:00',
      maghrib: '19:22:00',
      isha: '20:40:00',
      midnight: '00:30:00',
    };
  }
}

/**
 * The engine generation reuses across a day loop.
 *
 * `createDayTimesComputer` builds one PrayTime instance, snapshots its base
 * settings and restores them before every day. That restore is what keeps the
 * Hanafi ‘Asr lookup (and any per-date seasonal adjustment) from leaking into
 * the following day. A leak only shows on the second day of a run, so the
 * single-day checks in asr2-combined-generation.test.tsx cannot catch it —
 * this file computes four consecutive days through the real loop entry point.
 *
 * The engine is the test double in tests/js/unit/stubs/PrayTimes.ts: it reports
 * 14:30 for the Standard (1 Mithl) factor and 15:30 for the Hanafi (2 Mithl)
 * one, so a leaked factor changes the *main* ‘Asr of the next day, not just the
 * optional column.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { createDayTimesComputer } from '../../../src/admin/utils/computeDayTimes';
import { useLocationStore } from '../../../src/admin/state/storeLocation';

/** What `useCalenderSettings` does with the ‘Asr selection. */
const settingsForAsr =
  (asr: string) =>
  (prayerTime: any): void => {
    prayerTime.settings.asr = asr;
  };

/** Four consecutive days — enough for a leak to surface on the second one. */
const days = [0, 1, 2, 3].map((offset) => new Date(Date.UTC(2026, 2, 15 + offset)));

beforeEach(() => {
  // computeDayTimes reads the site timezone from data the PHP side prints into
  // the admin page; an empty object keeps the numeric-offset branch.
  (globalThis as any).window = { FivePrayerData: {} };

  useLocationStore.setState({
    customLocationSelected: { lat: 51.5, lng: -0.1 },
    methodsForCalculation: [],
    feature_toggles: {},
    roundingEnabled: false,
  } as any);
});

describe('createDayTimesComputer', () => {
  it("stores the second 'Asr on every day of the loop, not just the first", () => {
    const computer = createDayTimesComputer(settingsForAsr('Standard'));

    days.forEach((date, index) => {
      const day = computer(date, 0);

      // Day 2 would carry the Hanafi factor as its *main* ‘Asr if the lookup
      // from day 1 were never undone.
      expect(day.times.asr, `day ${index + 1} keeps the 1 Mithl ‘Asr`).toBe('14:30');
      expect(day.raw.asr2).toBe('15:30:00');
      expect(day.times.asr2).toBe('15:30');
    });
  });

  it("leaves a Hanafi selection with no second 'Asr on any day", () => {
    const computer = createDayTimesComputer(settingsForAsr('Hanafi'));

    days.forEach((date, index) => {
      const day = computer(date, 0);

      expect(day.times.asr, `day ${index + 1} keeps the 2 Mithl ‘Asr`).toBe('15:30');
      expect(day.raw).not.toHaveProperty('asr2');
    });
  });
});

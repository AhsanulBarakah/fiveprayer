/**
 * Unit tests for the rounding helpers shared by calendar generation, the
 * day-to-day smoothing pass and the Iqamah adjustment.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  applyIqamahAdjustment,
  getRoundingConfig,
  roundToMinute,
  shiftTimeMinutes,
} from '../../../src/admin/utils/computeDayTimes';
import { DEFAULT_FEATURE_TOGGLES, useLocationStore } from '../../../src/admin/state/storeLocation';

describe('roundToMinute', () => {
  it('rounds to nearest at the 30 second threshold by default', () => {
    expect(roundToMinute('04:35:29', 'nearest', 30)).toBe('04:35');
    expect(roundToMinute('04:35:30', 'nearest', 30)).toBe('04:36');
  });

  it('honours a custom seconds threshold', () => {
    expect(roundToMinute('04:35:09', 'nearest', 10)).toBe('04:35');
    expect(roundToMinute('04:35:10', 'nearest', 10)).toBe('04:36');
    expect(roundToMinute('04:35:50', 'nearest', 50)).toBe('04:36');
  });

  it('rounds up any non-zero seconds for "up"', () => {
    expect(roundToMinute('04:35:00', 'up', 30)).toBe('04:35');
    expect(roundToMinute('04:35:01', 'up', 30)).toBe('04:36');
  });

  it('truncates for "down"', () => {
    expect(roundToMinute('04:35:59', 'down', 30)).toBe('04:35');
    expect(roundToMinute('04:35:00', 'down', 30)).toBe('04:35');
  });

  it('keeps the exact minute for "none"', () => {
    // NOTE: unlike the other modes, 'none' returns the parsed fields unpadded
    // ('4:35'), which is the behaviour the calendar stores today.
    expect(roundToMinute('04:35:59', 'none', 30)).toBe('4:35');
    expect(roundToMinute('10:35:59', 'none', 30)).toBe('10:35');
  });

  it('rolls over to the next hour and over midnight', () => {
    expect(roundToMinute('04:59:45', 'nearest', 30)).toBe('05:00');
    expect(roundToMinute('23:59:45', 'nearest', 30)).toBe('00:00');
  });
});

describe('shiftTimeMinutes', () => {
  it('shifts forwards and backwards across midnight', () => {
    expect(shiftTimeMinutes('23:58', 5)).toBe('00:03');
    expect(shiftTimeMinutes('00:02', -5)).toBe('23:57');
    expect(shiftTimeMinutes('12:00', 0)).toBe('12:00');
    expect(shiftTimeMinutes('12:00', 1500)).toBe('13:00');
  });

  it('returns malformed cells unchanged', () => {
    expect(shiftTimeMinutes('12:30 PM', 5)).toBe('12:30 PM');
    expect(shiftTimeMinutes('', 5)).toBe('');
    expect(shiftTimeMinutes('abc', 5)).toBe('abc');
  });
});

describe('applyIqamahAdjustment', () => {
  const day = () => ({
    fajr_iqamah: '05:30',
    dhuhr_iqamah: '13:15',
    asr_iqamah: '16:45',
    maghrib_iqamah: '19:05',
    isha_iqamah: '20:30',
    fajr: '04:50',
  });

  it('shifts every iqamah column and leaves the begins times alone', () => {
    const times = applyIqamahAdjustment(day(), 5);

    expect(times.fajr_iqamah).toBe('05:35');
    expect(times.isha_iqamah).toBe('20:35');
    expect(times.fajr).toBe('04:50');
  });

  it('skips the columns an advanced schedule already controls', () => {
    const times = applyIqamahAdjustment(day(), 5, ['fajr_iqamah', 'isha_iqamah']);

    expect(times.fajr_iqamah).toBe('05:30');
    expect(times.isha_iqamah).toBe('20:30');
    expect(times.dhuhr_iqamah).toBe('13:20');
  });

  it('is a no-op for zero or non-finite adjustments', () => {
    expect(applyIqamahAdjustment(day(), 0)).toEqual(day());
    expect(applyIqamahAdjustment(day(), Number.NaN)).toEqual(day());
  });

  it('never rewrites a cell that is not HH:MM', () => {
    const times = applyIqamahAdjustment({ fajr_iqamah: '05:30 AM' }, 5);

    expect(times.fajr_iqamah).toBe('05:30 AM');
  });
});

describe('getRoundingConfig', () => {
  beforeEach(() => {
    useLocationStore.setState({
      // The Rounding feature ships OFF, so switch it on for the custom cases.
      feature_toggles: { ...DEFAULT_FEATURE_TOGGLES, Rounding_Method: true },
      roundingEnabled: true,
      rounding_selected: { name: 'Up', method: 'up', threshold: 10 },
    });
  });

  it('uses the configured method while custom rounding is on', () => {
    expect(getRoundingConfig()).toEqual({ rounding: 'up', threshold: 10 });
  });

  it('falls back to nearest@30 when custom rounding is off', () => {
    useLocationStore.setState({ roundingEnabled: false });
    expect(getRoundingConfig()).toEqual({ rounding: 'nearest', threshold: 30 });
  });

  it('falls back to nearest@30 when the feature switch is off', () => {
    useLocationStore.setState({
      feature_toggles: { ...DEFAULT_FEATURE_TOGGLES, Rounding_Method: false },
    });
    expect(getRoundingConfig()).toEqual({ rounding: 'nearest', threshold: 30 });
  });

  it('defaults a missing threshold to 30', () => {
    useLocationStore.setState({ rounding_selected: { name: 'Nearest', method: 'nearest' } });
    expect(getRoundingConfig()).toEqual({ rounding: 'nearest', threshold: 30 });
  });
});

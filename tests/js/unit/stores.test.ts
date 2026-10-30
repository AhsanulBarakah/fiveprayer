/**
 * Unit tests for the admin Zustand stores.
 *
 * These cover the rules that are easy to break without noticing in the UI:
 * factory defaults for feature switches, meta coercion in the colour store,
 * and the deep-merge/delete behaviour of the custom prayer schedules.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_FEATURE_TOGGLES,
  LEGACY_FEATURE_TOGGLES,
  resolveFeatureToggles,
  useLocationStore,
} from '../../../src/admin/state/storeLocation';
import { useTimeTableColor } from '../../../src/admin/state/storeTimeTableColor';
import {
  createDefaultSchedule,
  getMatchingSchedule,
  hasActiveIqamahSchedule,
  useCustomPrayerTimeSchedulesStore,
} from '../../../src/admin/state/useCustomPrayerTimeSchedulesStore';
import type { CustomPrayerTimeSchedule } from '../../../src/admin/state/useCustomPrayerTimeSchedulesStore';

describe('resolveFeatureToggles', () => {
  it('treats the untouched legacy "everything on" map as factory defaults', () => {
    const toggles = resolveFeatureToggles({ ...LEGACY_FEATURE_TOGGLES });

    expect(toggles).toEqual(DEFAULT_FEATURE_TOGGLES);
    expect(toggles['Next_Prayer_Countdown']).toBe(false);
    expect(toggles['Rounding_Method']).toBe(false);
    expect(toggles['Methods_For_Calculation']).toBe(true);
  });

  it('keeps an explicitly enabled countdown even when the rest is the legacy map', () => {
    const toggles = resolveFeatureToggles({
      ...LEGACY_FEATURE_TOGGLES,
      Next_Prayer_Countdown: true,
    });

    expect(toggles['Next_Prayer_Countdown']).toBe(true);
    expect(toggles['Rounding_Method']).toBe(true);
  });

  it('fills missing switches from the factory defaults', () => {
    const toggles = resolveFeatureToggles({ Rounding_Method: '1' });

    expect(toggles['Rounding_Method']).toBe(true);
    expect(toggles['Unified_Method_Settings']).toBe(true);
    expect(toggles['Day_Display']).toBe(false);
    expect(toggles['TV_Display_Mode']).toBe(false);
  });

  it('preserves unknown switches so custom toggles keep working', () => {
    expect(resolveFeatureToggles({ My_Custom_Switch: 1 })['My_Custom_Switch']).toBe(true);
  });

  it('falls back to the defaults for unusable input', () => {
    expect(resolveFeatureToggles(null)).toEqual(DEFAULT_FEATURE_TOGGLES);
    expect(resolveFeatureToggles('nonsense')).toEqual(DEFAULT_FEATURE_TOGGLES);
    expect(resolveFeatureToggles([1, 2])).toEqual(DEFAULT_FEATURE_TOGGLES);
  });
});

describe('useLocationStore', () => {
  it('merges a loaded toggle map over the defaults instead of replacing them', () => {
    const store = useLocationStore.getState();
    store.feature_toggles_set({ Rounding_Method: true });

    const toggles = useLocationStore.getState().feature_toggles;
    expect(toggles['Rounding_Method']).toBe(true);
    expect(toggles['Unified_Method_Settings']).toBe(true);
    expect(toggles['Day_Display']).toBe(false);
  });

  it('stores the month selected in the dropdown', () => {
    useLocationStore.getState().updateMonth({ name: 'March', method: '3' });

    expect(useLocationStore.getState().month.name).toBe('March');
    expect(useLocationStore.getState().month.method).toBe('3');
  });

  it('accepts only the two feature-off display modes', () => {
    useLocationStore.getState().updateFeatureOffDisplay('badge');
    expect(useLocationStore.getState().feature_off_display).toBe('badge');

    useLocationStore.getState().updateFeatureOffDisplay('hide');
    expect(useLocationStore.getState().feature_off_display).toBe('hide');
  });
});

describe('useTimeTableColor', () => {
  it.each([
    ['1', true],
    ['true', true],
    [1, true],
    [true, true],
    ['0', false],
    [0, false],
    [false, false],
    [undefined, false],
  ])('coerces hover switch %j to %j', (raw, expected) => {
    useTimeTableColor.getState().updateHoverEnabled(raw);
    expect(useTimeTableColor.getState().hoverEnabled).toBe(expected);
  });

  it('clamps the border radius to whole pixels in the allowed range', () => {
    const { updateBorderRadius } = useTimeTableColor.getState();

    updateBorderRadius(-4);
    expect(useTimeTableColor.getState().rgba_border_radius).toBe(0);

    updateBorderRadius(120);
    expect(useTimeTableColor.getState().rgba_border_radius).toBe(80);

    updateBorderRadius(12.6);
    expect(useTimeTableColor.getState().rgba_border_radius).toBe(13);
  });
});

describe('useCustomPrayerTimeSchedulesStore', () => {
  const store = () => useCustomPrayerTimeSchedulesStore.getState();

  beforeEach(() => {
    useCustomPrayerTimeSchedulesStore.setState({
      customSchedules: [],
      isCustomSchedulesEnabled: false,
    });
  });

  it('adds, toggles and removes a schedule', () => {
    store().addSchedule(createDefaultSchedule());
    expect(store().customSchedules).toHaveLength(1);

    const { id } = store().customSchedules[0];
    expect(id).toBeTruthy();

    store().toggleSchedule(id);
    expect(store().customSchedules[0].enabled).toBe(false);

    store().removeSchedule(id);
    expect(store().customSchedules).toHaveLength(0);
  });

  it('deep-merges prayer times and deletes a key set back to undefined', () => {
    store().addSchedule(createDefaultSchedule());
    const { id, prayerTimes } = store().customSchedules[0];

    store().updateSchedule(id, { prayerTimes: { fajr: '05:01', dhuhr: undefined } });

    const updated = store().customSchedules[0].prayerTimes;
    expect(updated.fajr).toBe('05:01');
    expect('dhuhr' in updated).toBe(false);
    expect(updated.fajrIqamah).toBe(prayerTimes.fajrIqamah);
  });

  it('adds, keeps and drops per-date overrides', () => {
    store().addSchedule(createDefaultSchedule());
    const { id } = store().customSchedules[0];

    store().updateSchedule(id, {
      dateOverrides: { '2026-01-05': { fajrIqamah: '06:45' } },
    });
    expect(store().customSchedules[0].dateOverrides?.['2026-01-05']).toEqual({
      fajrIqamah: '06:45',
    });

    store().updateSchedule(id, { dateOverrides: { '2026-01-05': null } });
    expect(store().customSchedules[0].dateOverrides).toBeUndefined();
  });

  it('matches a schedule by date range, weekday and enabled flag', () => {
    const schedule: CustomPrayerTimeSchedule = {
      ...createDefaultSchedule(),
      id: 'schedule-1',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
      daysOfWeek: [1, 2], // Monday, Tuesday
    };
    const schedules = [schedule];

    // 5 Jan 2026 is a Monday, 7 Jan a Wednesday.
    expect(getMatchingSchedule(new Date('2026-01-05T12:00:00'), schedules)?.id).toBe('schedule-1');
    expect(getMatchingSchedule(new Date('2026-01-07T12:00:00'), schedules)).toBeNull();
    // Outside the range.
    expect(getMatchingSchedule(new Date('2026-02-02T12:00:00'), schedules)).toBeNull();
    // Disabled schedules never match.
    expect(
      getMatchingSchedule(new Date('2026-01-05T12:00:00'), [{ ...schedule, enabled: false }])
    ).toBeNull();
  });

  it('detects only enabled schedules that really override an iqamah time', () => {
    const base: CustomPrayerTimeSchedule = { ...createDefaultSchedule(), id: 'base' };

    expect(hasActiveIqamahSchedule([base])).toBe(true);
    expect(hasActiveIqamahSchedule([{ ...base, enabled: false }])).toBe(false);
    expect(
      hasActiveIqamahSchedule([
        {
          ...base,
          prayerTimes: { ...base.prayerTimes, fajrIqamah: '' },
          prayerTimeEnabledFlags: { isFajrIqamahEnabled: false },
        },
      ])
    ).toBe(false);
  });
});

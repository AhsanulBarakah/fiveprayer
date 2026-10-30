/**
 * Generation with the combined “Asr + Hanafi” choice.
 *
 * The Asr Calculation list ships a combined option — “Shafii, Maliki, Jafari,
 * Hanbali and Hanafi (Asr + Hanafi)” — whose label names every school. Picking
 * it must keep the timetable’s ‘Asr on the 1 Mithl (Standard) factor AND still
 * make generation store the Hanafi 2 Mithl time, which is what the optional
 * Hanafi column prints.
 *
 * It also pins the other half of the same rule: picking the plain Hanafi entry
 * must leave the optional column empty, because both columns would print the
 * same time.
 *
 * The chain under test is the real one generation uses: the selected option
 * (`oaac`) goes through `useCalenderSettings`, and its `settingsPrayer` drives
 * `computeDayTimes`. A hand-built settings function cannot prove that wiring,
 * which is why the direct-engine variant of these checks was removed. Both stores are replaced with plain readers over a hoisted
 * state object because the hook is rendered with `renderToStaticMarkup`:
 * zustand v5 serves the initial state to the server snapshot, so a real store
 * could not show the selection this test just made. The engine itself is the
 * alias stub, which reports 14:30 for 1 Mithl and 15:30 for 2 Mithl.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCalenderSettings } from '../../../src/admin/hooks/useCalenderSettings';
import { computeDayTimes } from '../../../src/admin/utils/computeDayTimes';

/** The combined option exactly as the PHP defaults ship it. */
const COMBINED_ASR2_OPTION = {
  id: 31,
  name: 'Shafii, Maliki, Jafari, Hanbali and Hanafi (Asr + Hanafi)',
  method: 'Standard',
};

/** Any fixed day works — the stub ignores the date. */
const DAY = new Date('2026-03-15T00:00:00Z');

const state = vi.hoisted(() => ({
  location: {
    oaac: { id: 31, name: 'Shafii, Maliki, Jafari, Hanbali and Hanafi (Asr + Hanafi)', method: 'Standard' },
    mfc: { id: 1, name: 'Muslim World League', method: 'MWL' },
    mncm: { id: 1, name: 'Standard (Mid Sunset to Sunrise)', method: 'Standard' },
    hlm: { id: 5, name: 'Middle of The Night Method', method: 'NightMiddle' },
    methodsForCalculation: [] as any[],
    rounding_selected: { method: 'nearest', threshold: 30 },
    roundingEnabled: false,
    feature_toggles: {} as Record<string, boolean>,
    customLocationSelected: { lat: 51.5, lng: -0.1, city: 'London', country: 'United Kingdom' },
  },
  tune: {
    Imsak: '0',
    Fajr: '0',
    Sunrise: '0',
    Dhuhr: '0',
    Asr: '0',
    Sunset: '0',
    Maghrib: '0',
    Isha: '0',
    Midnight: '0',
  },
}));

const { asStore } = vi.hoisted(() => ({
  asStore: (read: () => any) =>
    Object.assign(
      (selector?: (value: any) => unknown) =>
        typeof selector === 'function' ? selector(read()) : read(),
      { getState: read }
    ),
}));

vi.mock('../../../src/admin/state/storeLocation', () => ({
  useLocationStore: asStore(() => state.location),
}));
vi.mock('../../../src/admin/state/storeTunePrayer', () => ({
  useTuneStore: asStore(() => state.tune),
}));

beforeEach(() => {
  // computeDayTimes reads the site timezone from the data PHP prints into the
  // admin page; an empty object keeps the numeric-offset branch.
  (globalThis as any).window = { FivePrayerData: {} };

  state.location.oaac = { ...COMBINED_ASR2_OPTION };
  state.location.feature_toggles = {};
  state.location.methodsForCalculation = [];
  state.location.roundingEnabled = false;
});

/**
 * Render a probe that calls the real `useCalenderSettings` hook and returns the
 * `settingsPrayer` it builds — hooks run during server rendering, so this is
 * the hook's actual output, not a copy of its logic.
 */
const settingsPrayerFor = (): ((prayerTime: any) => void) => {
  let captured: ((prayerTime: any) => void) | null = null;

  const Probe = () => {
    captured = useCalenderSettings().settingsPrayer;
    return null;
  };

  renderToStaticMarkup(<Probe />);

  if (!captured) {
    throw new Error('useCalenderSettings did not return settingsPrayer');
  }

  return captured;
};

describe('generation with the combined Asr + Hanafi option', () => {
  it("keeps the 1 Mithl 'Asr and stores the Hanafi 2 Mithl time as asr2", () => {
    const day = computeDayTimes(DAY, 0, settingsPrayerFor());

    // Main ‘Asr still uses the one-mithl (Standard) shadow factor …
    expect(day.times.asr).toBe('14:30');
    // … and the second ‘Asr is the two-mithl (Hanafi) computation.
    expect(day.raw.asr2).toBe('15:30:00');
    expect(day.times.asr2).toBe('15:30');
  });

  it('stores the same asr2 values the daily REST payload reports', () => {
    const day = computeDayTimes(DAY, 0, settingsPrayerFor());

    // The row generation writes is what becomes `prayer_times.asr2`, so the
    // stored string has to be a full 'HH:MM:SS' time, not a rounded label.
    expect(day.raw.asr2).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('leaves the engine configured with the selected option afterwards', () => {
    const settingsPrayer = settingsPrayerFor();
    let engine: any = null;

    computeDayTimes(DAY, 0, (prayerTime: any) => {
      engine = prayerTime;
      settingsPrayer(prayerTime);
    });

    // Reading the Hanafi factor for asr2 must restore the selected ‘Asr, or
    // every following day in the generation loop would shift to 2 Mithl.
    expect(String(engine?.settings?.asr)).toBe('Standard');
  });

  it("stores no asr2 when the main 'Asr is itself the Hanafi (2 Mithl) time", () => {
    // Moved here from the direct-engine test this file replaced: it is the same
    // rule, asserted where it matters — only a real selection can prove the
    // option reached the engine.
    state.location.oaac = { id: 4, name: 'Hanafi', method: 'Hanafi' };

    const day = computeDayTimes(DAY, 0, settingsPrayerFor());

    expect(day.times.asr).toBe('15:30');
    expect(day.raw).not.toHaveProperty('asr2');
    expect(day.times).not.toHaveProperty('asr2');
  });
});

/**
 * Unit tests for the meta loaders that fill the admin stores from the REST API.
 *
 * The loaders are hooks, so each one is executed once through a server render
 * and its returned updater is then driven directly with raw meta rows — the
 * same rows `useRefreshMetaData` passes in.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGetMetaPrayerSettings } from '../../../src/admin/hooks/useGetMetaPrayerSettings';
import { useGetMetaPrinter } from '../../../src/admin/hooks/useGetMetaPrinter';
import { useGetMetaIqama } from '../../../src/admin/hooks/useGetMetaIqama';
import { useGetMetaTune } from '../../../src/admin/hooks/useGetMetaTune';
import {
  DEFAULT_FEATURE_TOGGLES,
  useLocationStore,
} from '../../../src/admin/state/storeLocation';
import { usePrinterExtraStore } from '../../../src/admin/state/storePrinterExtra';
import { useIqamaStore } from '../../../src/admin/state/storeIqamaDelay';
import { useTuneStore } from '../../../src/admin/state/storeTunePrayer';

/** Execute a hook once and return what it returns (server render runs hooks). */
function runHook<T>(useHook: () => T): T {
  let result: T | undefined;
  const Probe = () => {
    result = useHook();
    return null;
  };
  renderToStaticMarkup(React.createElement(Probe));

  if (result === undefined) {
    throw new Error('The hook did not run.');
  }
  return result;
}

describe('prayer settings meta loader', () => {
  const load = () => runHook(useGetMetaPrayerSettings).GetMetaPrayerSettings;

  beforeEach(() => {
    useLocationStore.setState({
      feature_toggles: { ...DEFAULT_FEATURE_TOGGLES },
      roundingEnabled: true,
      feature_off_display: 'hide',
      next_prayer_countdown: {
        format: 'long',
        show_prefix: false,
        show_suffix: false,
        show_now: false,
        show_seconds: false,
      },
    });
  });

  it('loads the stored toggle map over the factory defaults', () => {
    load()({
      'meta-key': 'feature_toggles',
      value: JSON.stringify({ Rounding_Method: true, Day_to_day_Smoothing: true }),
    });

    const toggles = useLocationStore.getState().feature_toggles;
    expect(toggles['Rounding_Method']).toBe(true);
    expect(toggles['Day_to_day_Smoothing']).toBe(true);
    expect(toggles['Methods_For_Calculation']).toBe(true);
    expect(toggles['Next_Prayer_Countdown']).toBe(false);
  });

  it('applies rounding only while its feature switch is ON', () => {
    load()({ 'meta-key': 'feature_toggles', value: JSON.stringify({ Rounding_Method: false }) });
    expect(useLocationStore.getState().roundingEnabled).toBe(false);

    // A legacy row still saying "enabled" must not switch the engine back on.
    load()({ 'meta-key': 'rounding_enabled', value: '1' });
    expect(useLocationStore.getState().roundingEnabled).toBe(false);

    load()({ 'meta-key': 'feature_toggles', value: JSON.stringify({ Rounding_Method: true }) });
    load()({ 'meta-key': 'rounding_enabled', value: '1' });
    expect(useLocationStore.getState().roundingEnabled).toBe(true);
  });

  it('turns smoothing off with its feature switch', () => {
    load()({ 'meta-key': 'feature_toggles', value: JSON.stringify({ Day_to_day_Smoothing: false }) });

    expect(useLocationStore.getState().smoothing_selected.enabled).toBe(false);
  });

  it('reads the 1/0 boolean rows correctly', () => {
    load()({ 'meta-key': 'hide_printer_button', value: '1' });
    expect(useLocationStore.getState().hidePrinterButton).toBe(true);

    load()({ 'meta-key': 'hide_printer_button', value: '0' });
    expect(useLocationStore.getState().hidePrinterButton).toBe(false);
  });

  it('sanitises the next-prayer countdown config', () => {
    load()({
      'meta-key': 'next_prayer_countdown',
      value: JSON.stringify({
        format: 'not-a-format',
        show_prefix: 1,
        show_seconds: '1',
        unit: 'removed',
        rounding: 'removed',
      }),
    });

    expect(useLocationStore.getState().next_prayer_countdown).toEqual({
      format: 'long',
      show_prefix: true,
      show_suffix: false,
      show_now: false,
      show_seconds: true,
    });
  });

  it('accepts only badge as the feature-off display mode', () => {
    load()({ 'meta-key': 'feature_off_display', value: 'badge' });
    expect(useLocationStore.getState().feature_off_display).toBe('badge');

    load()({ 'meta-key': 'feature_off_display', value: 'nonsense' });
    expect(useLocationStore.getState().feature_off_display).toBe('hide');
  });
});

describe('printer meta loader', () => {
  it('fills every printer field from the stored payload', () => {
    const { metaPrinter } = runHook(useGetMetaPrinter);

    metaPrinter({
      'meta-key': 'printer',
      value: JSON.stringify({
        printer_left1: 'Address line',
        printer_right7: 'Right line',
        printer_boolean: true,
        printer_logo: 'logo.png',
      }),
    });

    const printer = usePrinterExtraStore.getState();
    expect(printer.printer_left1).toBe('Address line');
    expect(printer.printer_right7).toBe('Right line');
    expect(printer.printer_boolean).toBe(true);
    expect(printer.printer_logo).toBe('logo.png');
    // Fields the payload does not carry are cleared, never left stale.
    expect(printer.printer_left2).toBe('');
  });

  it('ignores rows that are not the printer payload', () => {
    const { metaPrinter } = runHook(useGetMetaPrinter);
    usePrinterExtraStore.getState().updateprinter_left1('Keep me');

    metaPrinter({ 'meta-key': 'iqamah', value: '{}' });

    expect(usePrinterExtraStore.getState().printer_left1).toBe('Keep me');
  });
});

describe('iqamah and tune meta loaders', () => {
  it('loads iqamah delays by meta key', () => {
    const { iqamaMetaUpdate } = runHook(useGetMetaIqama);

    iqamaMetaUpdate({ 'meta-key': 'IQFajr', value: '5' });
    iqamaMetaUpdate({ 'meta-key': 'unknown_key', value: '9' });

    expect(String(useIqamaStore.getState().IQFajr)).toBe('5');
    expect(String(useIqamaStore.getState().IQDhuhr)).toBe('0');
  });

  it('loads tune offsets by meta key', () => {
    const { tuneMetaUpdate } = runHook(useGetMetaTune);

    tuneMetaUpdate({ 'meta-key': 'Dhuhr', value: '3' });

    expect(String(useTuneStore.getState().Dhuhr)).toBe('3');
  });
});

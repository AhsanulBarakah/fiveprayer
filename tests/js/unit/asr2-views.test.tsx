/**
 * Rendering checks for the two Asr 2 surfaces the admin shows.
 *
 *  - The monthly calendar explains an empty Hanafi column only when it really is
 *    empty: column on, at least one day in the month, and no stored second ‘Asr
 *    anywhere. The advice differs for a Hanafi main ‘Asr, where there is no
 *    second time to store at all.
 *  - The Vertical Today preview shows the extra row only when its own switch is
 *    on AND the day carries a stored time.
 *
 * The stores are replaced with plain readers over a hoisted state object
 * because the components are rendered with `renderToStaticMarkup`: zustand v5
 * serves the *initial* state to the server snapshot, so a real store could
 * never show a switch that the test just flipped. Swapping the store modules
 * keeps the components' own logic (field names, conditions, copy) under test.
 */
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const rgba = { r: 0, g: 0, b: 0, a: 1 };

const state = vi.hoisted(() => ({
  rows: [] as any[],
  layout: {
    layoutType: 'default',
    showDate: true,
    showHijriDate: false,
    showSunrise: true,
    showBegins: true,
    showIqamah: true,
    showMidnight: true,
    showAsr2: true,
  },
  vertical: { showTime: false, showDate: true, showHijriDate: false, showAsr2: true },
  dayDisplay: { showFull: false, showShort: false, showNumber: false, order: 'name_first' },
  location: {
    month: { method: '3', name: 'March' },
    oaac: { id: 3, name: 'Shafii, Maliki, Jafari and Hanbali', method: 'Standard' },
    calendar_type: 'gregorian',
    feature_toggles: {},
    next_prayer_countdown: {},
  },
  translation: {
    prayer_names: [] as any[],
    activeLanguage: 'en',
    hijralocales: { isActive: false, customLan: false },
    timetable_prayer: [],
    day_names: [],
    gregorian_numbers: [],
    gregorian_months: [],
    vertical_daily_prayer: [],
  },
  tableMonth: { HijraLocale: null, TimeTableMonthFullYear: [] },
}));

// Hoisted with the factories below: vi.mock calls are lifted above ordinary
// top-level declarations, so the helper has to live in the hoisted scope.
const { asStore } = vi.hoisted(() => ({
  asStore: (read: () => any) =>
    Object.assign(
      (selector?: (value: any) => unknown) =>
        typeof selector === 'function' ? selector(read()) : read(),
      { getState: read }
    ),
}));

vi.mock('../../../src/admin/state/storeTimetableLayout', () => ({
  useTimetableLayoutStore: asStore(() => state.layout),
}));
vi.mock('../../../src/admin/state/storeVerticalTodayLayout', () => ({
  useVerticalTodayLayoutStore: asStore(() => state.vertical),
}));
vi.mock('../../../src/admin/state/storeDayDisplay', () => ({
  useDayDisplayStore: asStore(() => state.dayDisplay),
}));
vi.mock('../../../src/admin/state/storeLocation', () => ({
  useLocationStore: asStore(() => state.location),
}));
vi.mock('../../../src/admin/state/storeTimeTable', () => ({
  useTimeTableMonth: asStore(() => state.tableMonth),
}));
vi.mock('../../../src/admin/state/useTranslationStore', () => ({
  useTranslationStore: asStore(() => state.translation),
}));
vi.mock('../../../src/admin/state/storeTimeTableColor', () => ({
  useTimeTableColor: asStore(() => ({
    rgba_first_bg: rgba,
    rgba_first_text: rgba,
    rgba_second_bg: rgba,
    rgba_second_text: rgba,
    rgba_odd_bg: rgba,
    rgba_even_bg: rgba,
    rgba_odd_text: rgba,
    rgba_even_text: rgba,
    rgba_light_bg: rgba,
    rgba_light_text: rgba,
    rgba_border_clr: rgba,
    rgba_hover_bg: { ...rgba, a: 0.08 },
    rgba_hover_text: { ...rgba, a: 0 },
    rgba_border_size: 1,
    rgba_border_style: 'solid',
    rgba_border_radius: 0,
    hoverMode: 'blend',
    hoverEnabled: false,
  })),
}));

vi.mock('../../../src/admin/hooks/useMonthCalendar', () => ({
  useMonthCalendar: () => state.rows,
}));
vi.mock('../../../src/admin/hooks/useDayTimesSeconds', () => ({
  useDayTimesSeconds: () => ({}),
}));
vi.mock('../../../src/admin/hooks/useHijra', () => ({
  useHijra: () => ({ hijraLocale: () => '' }),
}));
vi.mock('../../../src/admin/hooks/translate/useFormatDataLocale', () => ({
  default: () => ({ gregorian_format: (rows: any[]) => rows }),
}));

import ColumnLayoutCalendar from '../../../src/admin/components/customizing/ColumnLayoutCalendar';
import VerticalTodayPreview from '../../../src/admin/components/customizing/VerticalTodayPreview';

/** One complete timetable row, so every rendered column has a value. */
const day = () => ({
  date: '2026-03-15',
  currentDate: '15 March 2026',
  fajr_begins: '04:36',
  fajr_iqamah: '05:00',
  sunrise: '06:10',
  dhuhr_begins: '12:10',
  dhuhr_iqamah: '12:30',
  asr_begins: '14:30',
  asr_iqamah: '14:50',
  maghrib_begins: '19:20',
  maghrib_iqamah: '19:24',
  isha_begins: '20:40',
  isha_iqamah: '21:00',
  midnight: '00:30',
});

beforeEach(() => {
  (globalThis as any).window = {
    FivePrayerData: {
      time_format: 'g:i a',
      wordpress_timezone: { gmt_offset: 0, current_timestamp: 0 },
    },
    setInterval: () => 0,
    clearInterval: () => {},
  };

  state.rows.length = 0;
  state.rows.push(day());
  state.layout.showAsr2 = true;
  state.vertical.showAsr2 = true;
  state.location.oaac = { id: 3, name: 'Shafii, Maliki, Jafari and Hanbali', method: 'Standard' };
});

describe('Asr 2 notice on the monthly calendar', () => {
  it('explains the empty column and says how to fill it', () => {
    const html = renderToStaticMarkup(<ColumnLayoutCalendar />);

    expect(html).toContain('The Hanafi column is on');
    expect(html).toContain('click Generate');
  });

  it('stays quiet once the month carries stored second ‘Asr times', () => {
    state.rows[0].asr_second_begins = '15:30';

    const html = renderToStaticMarkup(<ColumnLayoutCalendar />);

    expect(html).not.toContain('The Hanafi column is on');
    expect(html).toContain('15:30');
  });

  it('stays quiet while the column is switched off', () => {
    state.layout.showAsr2 = false;

    const html = renderToStaticMarkup(<ColumnLayoutCalendar />);

    expect(html).not.toContain('The Hanafi column is on');
  });

  it('tells a Hanafi main ‘Asr that there is no second time to store', () => {
    state.location.oaac = { id: 4, name: 'Hanafi', method: 'Hanafi' };

    const html = renderToStaticMarkup(<ColumnLayoutCalendar />);

    expect(html).toContain('already uses the Hanafi 2 Mithl time');
    expect(html).not.toContain('then click Generate');
  });
});

describe('Hanafi column header in the monthly calendar', () => {
  const arabic = [
    { original_text: 'Hanafi', translated_text: 'حنفي', language_code: 'ar', language_name: 'Arabic' },
  ];

  it('prints the stored translation for a mosque using a custom language', () => {
    state.translation.prayer_names = arabic;
    state.translation.activeLanguage = 'ar';
    state.translation.hijralocales = { isActive: true, customLan: true };
    state.rows[0].asr_second_begins = '15:30';

    const html = renderToStaticMarkup(<ColumnLayoutCalendar />);

    expect(html).toContain('حنفي');
    expect(html).not.toContain('<th>Hanafi</th>');
  });

  it('keeps the untranslated name while the custom language is off', () => {
    state.translation.prayer_names = arabic;
    state.translation.activeLanguage = 'ar';
    state.translation.hijralocales = { isActive: false, customLan: false };
    state.rows[0].asr_second_begins = '15:30';

    const html = renderToStaticMarkup(<ColumnLayoutCalendar />);

    expect(html).toContain('<th>Hanafi</th>');
    expect(html).not.toContain('حنفي');
  });

  it('falls back to the untranslated name when that language has none yet', () => {
    state.translation.prayer_names = [];
    state.translation.activeLanguage = 'ar';
    state.translation.hijralocales = { isActive: true, customLan: true };
    state.rows[0].asr_second_begins = '15:30';

    const html = renderToStaticMarkup(<ColumnLayoutCalendar />);

    expect(html).toContain('<th>Hanafi</th>');
  });
});

describe('Asr 2 row in the Vertical Today preview', () => {
  it('shows the row with the stored time when the switch is on', () => {
    state.rows[0].asr_second_begins = '15:30';

    const html = renderToStaticMarkup(<VerticalTodayPreview />);

    // The second ‘Asr is the Hanafi (2 Mithl) time, so the row reads “Hanafi”.
    expect(html).toContain('Hanafi');
    expect(html).toContain('15:30');
  });

  it('hides the row while the switch is off', () => {
    state.rows[0].asr_second_begins = '15:30';
    state.vertical.showAsr2 = false;

    const html = renderToStaticMarkup(<VerticalTodayPreview />);

    expect(html).not.toContain('Hanafi');
  });

  it('skips the row when the day has no stored second ‘Asr', () => {
    const html = renderToStaticMarkup(<VerticalTodayPreview />);

    expect(html).not.toContain('Hanafi');
    expect(html).toContain('14:30');
  });
});

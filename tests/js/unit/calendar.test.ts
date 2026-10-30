/**
 * Unit tests for the calendar generation helpers: the generated year span for
 * each Calendar Type, the Hijri conversion, and which month the calendar shows.
 */
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_HIJRI_VARIANT,
  getCalendarYearSpan,
  getEffectiveCalendarType,
  gregorianToHijri,
  hijriToGregorian,
  resolveDisplayMonth,
  resolveHijriVariant,
} from '../../../src/admin/utils/hijriCalendar';

const isBetween = (date: Date, start: Date, end: Date) =>
  date.getTime() >= start.getTime() && date.getTime() < end.getTime();

describe('resolveHijriVariant', () => {
  it('keeps the civil variant and defaults everything else to umalqura', () => {
    expect(resolveHijriVariant('islamic-civil')).toBe('islamic-civil');
    expect(resolveHijriVariant('islamic-umalqura')).toBe(DEFAULT_HIJRI_VARIANT);
    expect(resolveHijriVariant(undefined)).toBe(DEFAULT_HIJRI_VARIANT);
  });
});

describe('getEffectiveCalendarType', () => {
  it('behaves like Gregorian when the Calendar Type feature is off', () => {
    expect(getEffectiveCalendarType('hijri', { Calendar_Type: false })).toBe('gregorian');
    expect(getEffectiveCalendarType('persian', { Calendar_Type: false })).toBe('gregorian');
  });

  it('keeps the stored type while the feature is on or unknown', () => {
    expect(getEffectiveCalendarType('hijri', { Calendar_Type: true })).toBe('hijri');
    expect(getEffectiveCalendarType('persian', undefined)).toBe('persian');
    expect(getEffectiveCalendarType(undefined, { Calendar_Type: true })).toBe('gregorian');
  });
});

describe('Hijri conversion', () => {
  it('reads a known Islamic New Year', () => {
    const parts = gregorianToHijri(new Date(Date.UTC(2026, 5, 16, 12)), 'islamic-umalqura');

    expect(parts).toEqual({ year: 1448, month: 1, day: 1 });
  });

  it('round-trips a date back to itself', () => {
    const date = new Date(Date.UTC(2026, 9, 23, 12));
    const parts = gregorianToHijri(date, 'islamic-umalqura');
    expect(parts).not.toBeNull();

    const back = hijriToGregorian(
      (parts as { year: number }).year,
      (parts as { month: number }).month,
      (parts as { day: number }).day,
      'islamic-umalqura'
    );

    expect(back).not.toBeNull();
    expect((back as Date).toISOString().slice(0, 10)).toBe(date.toISOString().slice(0, 10));
  });
});

describe('getCalendarYearSpan', () => {
  const today = new Date(Date.UTC(2026, 9, 23, 12));

  // These two walk every month of the year through Intl's calendar conversion,
  // which takes several seconds on a loaded machine and overran vitest's 5 s
  // default while the pre-commit hook was running the other suites. Nothing
  // here is relaxed except the time allowance.
  it('covers the current Hijri year and labels it', () => {
    const span = getCalendarYearSpan('hijri', today, 'islamic-umalqura');

    expect(span).not.toBeNull();
    expect(span?.label).toMatch(/^Lunar Hijri \d{4} AH$/);
    expect(isBetween(today, (span as { start: Date }).start, (span as { end: Date }).end)).toBe(true);
    // A Hijri year is ~354 days; the generated span adds the extra months
    // (EXTRA_MONTHS = 3), so it lands around 440 days.
    const days =
      ((span as { end: Date }).end.getTime() - (span as { start: Date }).start.getTime()) / 864e5;
    expect(days).toBeGreaterThanOrEqual(354);
    expect(days).toBeLessThan(460);
  }, 20_000);

  it('covers the current Persian year and labels it', () => {
    const span = getCalendarYearSpan('persian', today);

    expect(span).not.toBeNull();
    expect(span?.label).toMatch(/^Solar Hijri \d{4} AP$/);
    expect(isBetween(today, (span as { start: Date }).start, (span as { end: Date }).end)).toBe(true);
  }, 20_000);

  it('returns null for the Gregorian calendar (caller uses the plain year)', () => {
    expect(getCalendarYearSpan('gregorian', today)).toBeNull();
    expect(getCalendarYearSpan(undefined, today)).toBeNull();
  });
});

describe('resolveDisplayMonth', () => {
  const gregorianMonths = [
    { name: 'September', method: '9' },
    { name: 'October', method: '10' },
    { name: 'November', method: '11' },
  ];
  const today = new Date(2026, 9, 23); // 23 October 2026

  it('prefers an exact match on the stored selection', () => {
    expect(resolveDisplayMonth({ method: '11' }, gregorianMonths, 'gregorian', today)?.name).toBe(
      'November'
    );
  });

  it('falls back to the current Gregorian month', () => {
    expect(resolveDisplayMonth(null, gregorianMonths, 'gregorian', today)?.name).toBe('October');
    expect(resolveDisplayMonth({ method: 'nope' }, gregorianMonths, 'gregorian', today)?.method).toBe(
      '10'
    );
  });

  it('picks the span entry that contains today in Hijri span mode', () => {
    const spanMonths = [
      { name: 'June 2026', method: 'g-2026-6', start: '2026-06-01T00:00:00.000Z', end: '2026-07-01T00:00:00.000Z' },
      { name: 'October 2026', method: 'g-2026-10', start: '2026-10-01T00:00:00.000Z', end: '2026-11-01T00:00:00.000Z' },
    ];

    expect(resolveDisplayMonth(null, spanMonths, 'hijri', today)?.name).toBe('October 2026');
  });

  it('falls back to the first span entry when today is outside it', () => {
    const spanMonths = [
      { name: 'June 2027', method: 'g-2027-6', start: '2027-06-01T00:00:00.000Z', end: '2027-07-01T00:00:00.000Z' },
      { name: 'July 2027', method: 'g-2027-7', start: '2027-07-01T00:00:00.000Z', end: '2027-08-01T00:00:00.000Z' },
    ];

    expect(resolveDisplayMonth(null, spanMonths, 'hijri', today)?.name).toBe('June 2027');
  });

  it('returns null only for an empty list', () => {
    expect(resolveDisplayMonth({ method: '10' }, [], 'gregorian', today)).toBeNull();
  });
});

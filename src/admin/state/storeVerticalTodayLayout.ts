/**
 * Vertical Today Layout Store
 *
 * Holds the user's layout preferences for the "Vertical Today" design — the
 * single-day vertical prayer table rendered by [Fp_Vertical_Daily_Prayer].
 * Persisted via the `vertical_today_layout` meta key in the database.
 *
 * Kept separate from `storeTimetableLayout` (the monthly timetable) on purpose:
 * each design owns its own field set, so new designs and new per-design fields
 * can be added without touching the others.
 *
 * @module storeVerticalTodayLayout
 */
import { create } from 'zustand';

export interface VerticalTodayLayoutOptions {
  /** Show the "Current Local Time" line (label + live clock). */
  showTime: boolean;
  /** Show the Gregorian date line. */
  showDate: boolean;
  /** Show the Hijri date line (only rendered while the Hijra Calendar is active). */
  showHijriDate: boolean;
  /** Optional second ‘Asr (2 Mithl / Hanafi) row — off by default. */
  showAsr2: boolean;
}

interface VerticalTodayLayoutStore extends VerticalTodayLayoutOptions {
  updateOption: <K extends keyof VerticalTodayLayoutOptions>(key: K, value: VerticalTodayLayoutOptions[K]) => void;
  setOptions: (options: Partial<VerticalTodayLayoutOptions>) => void;
}

/**
 * Coerce a stored value into a boolean. Handles the JSON booleans and the
 * legacy `'1'` / `'0'` / `'true'` strings the settings table can carry, without
 * routing through `JSON.parse` (which turns `'1'` into the number 1 and would
 * silently fail a strict `=== true` check).
 */
export const toLayoutBool = (value: unknown, fallback: boolean): boolean => {
  if (value === true) return true;
  if (value === false) return false;
  if (value === undefined || value === null || value === '') return fallback;
  const s = String(value).trim().toLowerCase();
  return s === '1' || s === 'true';
};

export const useVerticalTodayLayoutStore = create<VerticalTodayLayoutStore>((set) => ({
  showTime: true,
  showDate: true,
  showHijriDate: true,
  showAsr2: false,

  updateOption: (key, value) => set({ [key]: value }),
  /**
   * Bulk-load options from the database. Only known keys are adopted and every
   * value is coerced to a boolean, so a stray/corrupt value can never leak into
   * the preview or the saved payload.
   */
  setOptions: (options) =>
    set((state) => ({
      showTime: toLayoutBool(options?.showTime, state.showTime),
      showDate: toLayoutBool(options?.showDate, state.showDate),
      showHijriDate: toLayoutBool(options?.showHijriDate, state.showHijriDate),
      showAsr2: toLayoutBool(options?.showAsr2, state.showAsr2),
    })),
}));

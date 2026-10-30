/**
 * Day Display Store
 *
 * Holds the global optional "Day" display config shared by the monthly
 * timetable's Day column and the Vertical Today header line. Persisted via the
 * `day_display` meta key.
 *
 * The master on/off is the `Day_Display` feature switch (Feature Switches
 * page); see DEFAULT_FEATURE_TOGGLES. The config carries three independent
 * parts (full weekday name / short weekday name / day-of-month number) and the
 * order they render in:
 *
 *   - name_first   → "Fri 27th"
 *   - number_first → "27th Fri"
 *
 * @module storeDayDisplay
 */
import { create } from 'zustand';

export type DayDisplayOrder = 'name_first' | 'number_first';

export interface DayDisplayConfig {
  /** Show the full weekday name (Friday). */
  showFull: boolean;
  /** Show the short weekday name (Fri). */
  showShort: boolean;
  /** Show the day-of-month number (27th). */
  showNumber: boolean;
  /** Order the enabled parts render in. */
  order: DayDisplayOrder;
}

interface DayDisplayStore extends DayDisplayConfig {
  updateOption: <K extends keyof DayDisplayConfig>(key: K, value: DayDisplayConfig[K]) => void;
  setOptions: (options: Partial<DayDisplayConfig>) => void;
}

/** Coerce a stored value to a boolean without routing through JSON.parse. */
const toBool = (value: unknown, fallback: boolean): boolean => {
  if (value === true) return true;
  if (value === false) return false;
  if (value === undefined || value === null || value === '') return fallback;
  const s = String(value).trim().toLowerCase();
  return s === '1' || s === 'true';
};

const toOrder = (value: unknown, fallback: DayDisplayOrder): DayDisplayOrder => {
  if (value === 'name_first' || value === 'number_first') return value;
  return fallback;
};

export const useDayDisplayStore = create<DayDisplayStore>((set) => ({
  showFull: false,
  showShort: false,
  showNumber: false,
  order: 'name_first',

  updateOption: (key, value) => set({ [key]: value } as Partial<DayDisplayStore>),

  /**
   * Bulk-load from the database. Only known keys are adopted and every value is
   * coerced, so a stray/corrupt value can never leak into the preview or the
   * saved payload.
   */
  setOptions: (options) =>
    set((state) => ({
      showFull: toBool(options?.showFull, state.showFull),
      showShort: toBool(options?.showShort, state.showShort),
      showNumber: toBool(options?.showNumber, state.showNumber),
      order: toOrder(options?.order, state.order),
    })),
}));

/**
 * Timetable Layout Store
 *
 * Holds the user's timetable layout preferences: layout style
 * (default vs hijri) and which columns are visible. Persisted via
 * the timetable_layout meta key in the database.
 *
 * @module storeTimetableLayout
 */
import { create } from 'zustand';

interface TimetableLayoutOptions {
  layoutType: 'default' | 'hijri';
  showDate: boolean;
  showHijriDate: boolean;
  showSunrise: boolean;
  showBegins: boolean;
  showIqamah: boolean;
  showMidnight: boolean;
  /** Optional second 'Asr (2 Mithl / Hanafi) column — off by default. */
  showAsr2: boolean;
}

interface TimetableLayoutStore extends TimetableLayoutOptions {
  updateOption: <K extends keyof TimetableLayoutOptions>(key: K, value: TimetableLayoutOptions[K]) => void;
  setOptions: (options: Partial<TimetableLayoutOptions>) => void;
}

export const useTimetableLayoutStore = create<TimetableLayoutStore>((set) => ({
  layoutType: 'default',
  showDate: true,
  showHijriDate: true,
  showSunrise: true,
  showBegins: true,
  showIqamah: true,
  showMidnight: true,
  showAsr2: false,

  updateOption: (key, value) => set({ [key]: value }),
  setOptions: (options) => set(options),
}));

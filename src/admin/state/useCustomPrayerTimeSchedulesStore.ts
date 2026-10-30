/**
 * Custom Prayer Time Schedules Store
 *
 * Manages custom prayer time schedules that override the default timetable
 * for specific date ranges and days of the week. Used for Ramadan schedules,
 * holiday adjustments, or any date-specific prayer time overrides.
 *
 * @module useCustomPrayerTimeSchedulesStore
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/** A single custom prayer time schedule with date range and per-prayer overrides */
export interface CustomPrayerTimeSchedule {
  id: string;
  name: string;
  enabled: boolean;
  startDate: string;
  endDate: string;
  prayerTimes: {
    fajr?: string;
    fajrIqamah?: string;
    dhuhr?: string;
    dhuhrIqamah?: string;
    asr?: string;
    asrIqamah?: string;
    maghrib?: string;
    maghribIqamah?: string;
    isha?: string;
    ishaIqamah?: string;
    // Per-date Begins overrides written by the Advanced Schedules editor.
    // They are not shown in the default schedule, but a saved schedule may
    // carry them, so the loader must be able to read them.
    fajrBegins?: string;
    dhuhrBegins?: string;
    asrBegins?: string;
    maghribBegins?: string;
    ishaBegins?: string;
  };
  prayerTimeEnabledFlags?: {
    isFajrEnabled?: boolean;
    isFajrIqamahEnabled?: boolean;
    isDhuhrEnabled?: boolean;
    isDhuhrIqamahEnabled?: boolean;
    isAsrEnabled?: boolean;
    isAsrIqamahEnabled?: boolean;
    isMaghribEnabled?: boolean;
    isMaghribIqamahEnabled?: boolean;
    isIshaEnabled?: boolean;
    isIshaIqamahEnabled?: boolean;
  };
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday, etc.
  dateOverrides?: Record<string, {
    fajrIqamah?: string;
    dhuhrIqamah?: string;
    asrIqamah?: string;
    maghribIqamah?: string;
    ishaIqamah?: string;
    fajrBegins?: string;
    dhuhrBegins?: string;
    asrBegins?: string;
    maghribBegins?: string;
    ishaBegins?: string;
  }>;
}

type State = {
  customSchedules: CustomPrayerTimeSchedule[];
  isCustomSchedulesEnabled: boolean;
};

type UpdateSchedulePayload = Partial<Omit<CustomPrayerTimeSchedule, 'prayerTimes' | 'dateOverrides' | 'prayerTimeEnabledFlags'>> & {
  prayerTimes?: Partial<CustomPrayerTimeSchedule['prayerTimes']>;
  prayerTimeEnabledFlags?: Partial<NonNullable<CustomPrayerTimeSchedule['prayerTimeEnabledFlags']>>;
  dateOverrides?: Record<string, Partial<NonNullable<CustomPrayerTimeSchedule['dateOverrides']>[string]> | null | undefined>;
};

type Action = {
  addSchedule: (schedule: Omit<CustomPrayerTimeSchedule, 'id'>) => void;
  updateSchedule: (id: string, updates: UpdateSchedulePayload) => void;
  removeSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  toggleCustomSchedules: (enabled: boolean) => void;
  setCustomSchedules: (schedules: CustomPrayerTimeSchedule[]) => void;
  setIsCustomSchedulesEnabled: (enabled: boolean) => void;
};

export const useCustomPrayerTimeSchedulesStore = create<State & Action>()(
  devtools(
    (set) => ({
        customSchedules: [],
        isCustomSchedulesEnabled: false,
        addSchedule: (schedule) =>
          set((state) => ({
            customSchedules: [
              ...state.customSchedules,
              { ...schedule, id: Date.now().toString() },
            ],
          })),
        updateSchedule: (id, updates) =>
          set((state) => ({
            customSchedules: state.customSchedules.map((schedule) => {
              if (schedule.id !== id) return schedule;
              // Deep-merge nested prayerTimes and support deletion via undefined
              let mergedPrayerTimes = { ...schedule.prayerTimes } as Record<string, string>;
              if (updates.prayerTimes) {
                for (const [key, val] of Object.entries(updates.prayerTimes)) {
                  if (val === undefined) {
                    delete mergedPrayerTimes[key];
                  } else {
                    mergedPrayerTimes[key] = val as string;
                  }
                }
              }
              // Deep-merge prayerTimeEnabledFlags
              let mergedPrayerTimeEnabledFlags = { ...(schedule.prayerTimeEnabledFlags || {}) } as Record<string, boolean>;
              if (updates.prayerTimeEnabledFlags) {
                for (const [key, val] of Object.entries(updates.prayerTimeEnabledFlags)) {
                  if (val === undefined) {
                    delete mergedPrayerTimeEnabledFlags[key];
                  } else {
                    mergedPrayerTimeEnabledFlags[key] = val as boolean;
                  }
                }
              }
              // Deep-merge dateOverrides (per-date iqamah overrides)
              let mergedDateOverrides = { ...(schedule.dateOverrides || {}) } as Record<string, Record<string, string>>;
              if (updates.dateOverrides) {
                for (const [dateKey, override] of Object.entries(updates.dateOverrides)) {
                  if (override == null) {
                    delete mergedDateOverrides[dateKey];
                    continue;
                  }
                  const existing = mergedDateOverrides[dateKey] || {};
                  const next: Record<string, string> = { ...existing };
                  for (const [k, v] of Object.entries(override)) {
                    if (v === undefined) {
                      delete next[k];
                    } else {
                      next[k] = v as string;
                    }
                  }
                  if (Object.keys(next).length === 0) {
                    delete mergedDateOverrides[dateKey];
                  } else {
                    mergedDateOverrides[dateKey] = next;
                  }
                }
              }
              const { prayerTimes: _ignore, prayerTimeEnabledFlags: _ignoreFlags, ...restUpdates } = updates;
              return {
                ...schedule,
                ...restUpdates,
                prayerTimes: mergedPrayerTimes as CustomPrayerTimeSchedule['prayerTimes'],
                prayerTimeEnabledFlags: Object.keys(mergedPrayerTimeEnabledFlags).length ? mergedPrayerTimeEnabledFlags as CustomPrayerTimeSchedule['prayerTimeEnabledFlags'] : undefined,
                dateOverrides: Object.keys(mergedDateOverrides).length ? mergedDateOverrides as CustomPrayerTimeSchedule['dateOverrides'] : undefined,
              };
            }),
          })),
        removeSchedule: (id) =>
          set((state) => ({
            customSchedules: state.customSchedules.filter(
              (schedule) => schedule.id !== id
            ),
          })),
        toggleSchedule: (id) =>
          set((state) => ({
            customSchedules: state.customSchedules.map((schedule) =>
              schedule.id === id
                ? { ...schedule, enabled: !schedule.enabled }
                : schedule
            ),
          })),
        toggleCustomSchedules: (enabled) =>
          set(() => ({
            isCustomSchedulesEnabled: enabled,
          })),
        setCustomSchedules: (schedules) =>
          set(() => ({
            customSchedules: schedules,
          })),
        setIsCustomSchedulesEnabled: (enabled) =>
          set(() => ({
            isCustomSchedulesEnabled: enabled,
          })),
      }),
    { name: 'storeCustomPrayerTimeSchedules' }
  )
);

/**
 * Whether at least one *enabled* schedule actually overrides an Iqamah time
 * (its Iqamah flag is on and a value is set). This is the condition under which
 * the Unified Method's uniform "Adjust every Iqamah time" must stay off, so the
 * two controls can never fight over the same Iqamah. Mirrors the check used by
 * the Iqamah Delay panel.
 */
export const hasActiveIqamahSchedule = (
  customSchedules: CustomPrayerTimeSchedule[]
): boolean =>
  (customSchedules || []).some((schedule) => {
    if (!schedule.enabled) return false;
    const flags = schedule.prayerTimeEnabledFlags;
    if (!flags) return false;
    const times = (schedule.prayerTimes || {}) as Record<string, string | undefined>;
    return Boolean(
      (flags.isFajrIqamahEnabled && times.fajrIqamah) ||
      (flags.isDhuhrIqamahEnabled && times.dhuhrIqamah) ||
      (flags.isAsrIqamahEnabled && times.asrIqamah) ||
      (flags.isMaghribIqamahEnabled && times.maghribIqamah) ||
      (flags.isIshaIqamahEnabled && times.ishaIqamah)
    );
  });

export const getMatchingSchedule = (
  date: Date,
  schedules: CustomPrayerTimeSchedule[]
): CustomPrayerTimeSchedule | null => {
  const currentDate = new Date(date);
  const dayOfWeek = currentDate.getDay();
  const currentDateStr = currentDate.toISOString().split('T')[0];

  return (
    schedules.find(
      (schedule) =>
        schedule.enabled &&
        currentDateStr >= schedule.startDate &&
        currentDateStr <= schedule.endDate &&
        schedule.daysOfWeek.includes(dayOfWeek)
    ) || null
  );
};

// Function to create a default schedule for the requested date range
export const createDefaultSchedule = (): Omit<CustomPrayerTimeSchedule, 'id'> => {
  return {
    name: 'January 2026 Schedule',
    enabled: true,
    startDate: '2026-01-01',
    endDate: '2026-01-28',
    prayerTimes: {
      fajr: '06:07',
      fajrIqamah: '06:30',
      dhuhr: '11:52',
      dhuhrIqamah: '', // Empty as per requirement
      asr: '',
      asrIqamah: '',
      maghrib: '',
      maghribIqamah: '',
      isha: '',
      ishaIqamah: '',
    },
    prayerTimeEnabledFlags: {
      isFajrEnabled: true,
      isFajrIqamahEnabled: true,
      isDhuhrEnabled: true,
      isDhuhrIqamahEnabled: false, // Disabled as per requirement
      isAsrEnabled: false,
      isAsrIqamahEnabled: false,
      isMaghribEnabled: false,
      isMaghribIqamahEnabled: false,
      isIshaEnabled: false,
      isIshaIqamahEnabled: false,
    },
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days: Sun, Mon, Tue, Wed, Thu, Fri, Sat
  };
};

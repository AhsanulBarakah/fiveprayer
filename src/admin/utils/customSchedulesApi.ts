/**
 * Custom Schedules Persistence
 *
 * Low-level save for the `custom-prayer-time-schedules` meta. Lives here (not
 * inside the manager component) because more than one screen needs to write it:
 *   - CustomPrayerTimeSchedules — CRUD on the schedules themselves
 *   - FeatureSwitchesPanel      — turning the Advanced_Schedules feature off
 *     flips the master switch, which has to reach the database too
 *
 * The expected payload mirrors what the manager has always sent:
 * `{ state: { customSchedules, isCustomSchedulesEnabled }, version: 0 }`.
 *
 * @module utils/customSchedulesApi
 */
import apiFetch from '@wordpress/api-fetch';
import { UseEndPoints } from '../hooks/api/endpoints';
import type { CustomPrayerTimeSchedule } from '../state/useCustomPrayerTimeSchedulesStore';

export interface CustomSchedulesPayload {
  state: {
    customSchedules: CustomPrayerTimeSchedule[];
    isCustomSchedulesEnabled: boolean;
  };
  version: number;
}

/** Build the payload shape the settings meta endpoint expects. */
export const buildCustomSchedulesPayload = (
  customSchedules: CustomPrayerTimeSchedule[],
  isCustomSchedulesEnabled: boolean
): CustomSchedulesPayload => ({
  state: { customSchedules, isCustomSchedulesEnabled },
  version: 0,
});

/**
 * Persist the custom schedules (or just the master on/off flag) to the
 * database. Throws on failure so callers can show their own toast.
 */
export const saveCustomSchedulesToDatabase = async (payload: CustomSchedulesPayload): Promise<void> => {
  await apiFetch({
    path: UseEndPoints() + '/fp_prayersettings_meta',
    method: 'POST',
    data: {
      meta: 'custom-prayer-time-schedules',
      value: payload,
    },
  });
};

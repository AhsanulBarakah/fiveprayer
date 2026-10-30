/**
 * Conditional State Store
 *
 * Manages transient UI state flags for the FivePrayer admin app.
 * These values are NOT persisted — they reset on each page load.
 *
 * @module storeConditional
 */
import { create } from "zustand";
import { devtools } from "zustand/middleware";

/** Ramadan-specific configuration */
interface RamadanState {
  /** Whether the current date falls in Ramadan */
  ramadan: boolean;
  /** Label for Zuhr end time during Ramadan */
  zuhrEnd: string;
  /** Label for Iftar start time during Ramadan */
  iftarStart: string;
  /** Custom Ramadan day number (0 = not custom) */
  ramadan_custom: number;
}

/** State shape for conditional flags */
type State = {
  /** Whether the calendar generator is ready to produce data */
  isReadyGenerator: boolean;
  /** Whether the form is ready to POST to the API */
  isReadyToPost: boolean;
  /** Whether today's date is a Ramadan date */
  isRamadanDate: boolean;
  /** Whether a hijra-related change has occurred */
  isOnChangeInHijra: boolean;
  /** Ramadan configuration state */
  isRamadan: RamadanState;
  /**
   * Monotonic counter bumped each time the user clicks "Generate Calendar".
   * PrayerCalendar listens to it to run generation — decoupled from the
   * isReadyGenerator/isReadyToPost flags (which usePostTune/usePostIqama can
   * reset mid-flight, causing the first click to only save and never generate).
   */
  generateRequestId: number;
};

/** Actions to update conditional flags */
type Action = {
  updateIsReadyGenerator: (v: State["isReadyGenerator"]) => void;
  updateIsReadyToPost: (v: State["isReadyToPost"]) => void;
  /** Signal that the user wants a calendar generation now. */
  requestGenerate: () => void;
  /**
   * Reset the pending generation request after it has been handled.
   * Without this, the elevated request id makes every PrayerCalendar mount
   * (e.g. navigating back to the page) re-trigger a calendar generation.
   */
  clearGenerateRequest: () => void;
  updateIsRamadan: (v: State["isRamadan"]) => void;
  updateIsOnChangeInHijra: (v: State["isOnChangeInHijra"]) => void;
  updateIsRamadanDate: (v: State["isRamadanDate"]) => void;
};

/**
 * Zustand store for transient conditional state.
 * Not persisted — values are reset on page load and set by other stores/hooks.
 */
export const useConditional = create<State & Action>()(
  devtools((set) => ({
    isReadyGenerator: false,
    isReadyToPost: false,
    isRamadanDate: false,
    isOnChangeInHijra: false,
    generateRequestId: 0,
    isRamadan: {
      ramadan: false,
      zuhrEnd: "Zuhr End",
      iftarStart: "Iftar Start",
      ramadan_custom: 0,
    },

    updateIsReadyGenerator: (isReadyGenerator) =>
      set(() => ({ isReadyGenerator })),
    updateIsReadyToPost: (isReadyToPost) =>
      set(() => ({ isReadyToPost })),
    requestGenerate: () =>
      set((state) => ({ generateRequestId: state.generateRequestId + 1 })),
    clearGenerateRequest: () => set({ generateRequestId: 0 }),
    updateIsRamadan: (isRamadan) =>
      set(() => ({ isRamadan })),
    updateIsOnChangeInHijra: (isOnChangeInHijra) =>
      set(() => ({ isOnChangeInHijra })),
    updateIsRamadanDate: (isRamadanDate) =>
      set(() => ({ isRamadanDate })),
  }), { name: "storeConditional" })
);

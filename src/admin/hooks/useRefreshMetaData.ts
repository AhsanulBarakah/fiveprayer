import apiFetch from "@wordpress/api-fetch";
import { useLocationStore, createDefaultExtraPrayers } from "../state/storeLocation";
import { useGetMetaTune } from "./useGetMetaTune";
import { useGetMetaIqama } from "./useGetMetaIqama";
import { useGetMetaPrayerSettings } from "./useGetMetaPrayerSettings";
import type { SelectSchemaValid } from "../validations/locationIsValid";
import { useGetMetaThemeColors } from "./useGetMetaThemeColors";
import { useGetMetaPrinter } from "./useGetMetaPrinter";
import { useGetMetaHijraLocale } from "./useGetMetaHijraLocale";
import useGetMetaRamadan from "./useGetMetaRamadan";
import { useTimeTableColor } from "../state/storeTimeTableColor";
import { useGetUrlLogoPrinter } from "./useGetUrlLogoPrinter";
import { UseEndPoints } from "./api/endpoints";
import { useCustomPrayerTimeSchedulesStore } from "../state/useCustomPrayerTimeSchedulesStore";
import { useTimetableLayoutStore } from "../state/storeTimetableLayout";
import { useVerticalTodayLayoutStore } from "../state/storeVerticalTodayLayout";

type Location = {
  value?: {
    id?: string | undefined;
    name?: string | undefined;
    method?: string | undefined;
  }[];
  "meta-key"?: string | undefined;
  id?: string | undefined;

  country?: string | undefined;
  city?: string | undefined;
  lat?: string | undefined;
  lng?: string | undefined;
};
export const useRefreshMetaData = () => {
  const { tuneMetaUpdate } = useGetMetaTune();
  const { iqamaMetaUpdate } = useGetMetaIqama();
  const { GetMetaPrayerSettings } = useGetMetaPrayerSettings();
  const { metaPrinter } = useGetMetaPrinter();
  const { GetMetaThemeColors } = useGetMetaThemeColors();
  const { updateCustomLocationData } = useLocationStore((state) => state);
  const {
    updateFirstBG,
    updateFirstText,
    updateSecondBG,
    updateSecondText,
    updateEvenBG,
    updateEvenText,
    updateOddBG,
    updateOddText,
    updateLightBG,
    updateLightText,
    updateBorderClr,
    updateHoverBG,
    updateHoverText,
    updateHoverMode,
    updateHoverEnabled,
    updateBorderSize,
    updateBorderStyle,
  } = useTimeTableColor((state) => state);

  const { setCustomSchedules, setIsCustomSchedulesEnabled } = useCustomPrayerTimeSchedulesStore();

  const SetASRCAL = useLocationStore((state) => state.updateSetASRCAL);
  const SetHighLittude = useLocationStore(
    (state) => state.updateSetHighLittude
  );
  const SetRoundingCal = useLocationStore((state) => state.updateSetRoundingCal);
  const updateRoundingCalculationMethods = useLocationStore((state) => state.updateRoundingCalculationMethods);
  const SetMCMode = useLocationStore((state) => state.updateSetMCMode);
  const SetMethodsForCal = useLocationStore(
    (state) => state.updateSetMethodsForCal
  );
  const updateMidnightCalculationModes = useLocationStore((state) => state.updateMidnightCalculationModes);
  const updateAsrCalculationMethods = useLocationStore((state) => state.updateAsrCalculationMethods);
  const updateHigherLatitudeMethods = useLocationStore((state) => state.updateHigherLatitudeMethods);
  const updateMethodsForCalculation = useLocationStore((state) => state.updateMethodsForCalculation);
  const SetSkipIqamahMidnight = useLocationStore(
    (state) => state.updateSetSkipIqamahMidnight
  );
  const { getMetaHijraLocale } = useGetMetaHijraLocale();
  const { getMetaRamadan } = useGetMetaRamadan();
  const updateExtraPrayers = useLocationStore((state) => state.updateExtraPrayers);
  const { fetchPngUrl } = useGetUrlLogoPrinter();
  const defaultsColorTimeTable = () => {
    updateFirstBG({ r: 0, g: 184, b: 29, a: 1 });
    updateFirstText({ r: 255, g: 255, b: 255, a: 1 });
    updateSecondBG({ r: 80, g: 228, b: 19, a: 1 });
    updateSecondText({ r: 30, g: 0, b: 0, a: 1 });
    updateEvenBG({ r: 255, g: 255, b: 255, a: 1 });
    updateEvenText({ r: 3, g: 6, b: 20, a: 1 });
    updateOddBG({ r: 0, g: 138, b: 14, a: 1 });
    updateOddText({ r: 255, g: 255, b: 255, a: 1 });
    updateLightBG({ r: 242, g: 255, b: 0, a: 1 });
    updateLightText({ r: 201, g: 9, b: 9, a: 1 });
    updateBorderClr({ r: 33, g: 76, b: 10, a: 1 });
    updateHoverBG({ r: 0, g: 0, b: 0, a: 0.08 });
    updateHoverText({ r: 0, g: 0, b: 0, a: 0 });
    updateHoverMode("blend");
    updateHoverEnabled(false);
    updateBorderSize(1);
    updateBorderStyle("solid");
  };
  const getPrayerSettingMeta = async () => {
    let roundingFound = false;
    const endpoint = UseEndPoints();
    try {
      const posts: SelectSchemaValid[] = await apiFetch({
        path: `${endpoint}/fp_prayersettings_meta`,
      });
      defaultsColorTimeTable();
      fetchPngUrl();
      for (const meta of posts) {
        if (
          meta["meta-key"] === "midnight_calculation_mode" &&
          meta?.value &&
          typeof meta?.value === "string"
        ) {
          const converter: SelectSchemaValid = {
            id: meta.id,
            "meta-key": meta["meta-key"],
            value: JSON.parse(meta?.value),
          };
          SetMCMode(converter);
          const parsedValue = JSON.parse(meta?.value);
          if (Array.isArray(parsedValue)) {
            updateMidnightCalculationModes(parsedValue);
          }
        }
        if (
          meta["meta-key"] === "Only_affects_Asr_calculation" &&
          meta?.value &&
          typeof meta?.value === "string"
        ) {
          const converter: SelectSchemaValid = {
            id: meta.id,
            "meta-key": meta["meta-key"],
            value: JSON.parse(meta?.value),
          };
          SetASRCAL(converter);
          const parsedValue = JSON.parse(meta?.value);
          if (Array.isArray(parsedValue)) {
            updateAsrCalculationMethods(parsedValue);
          }
        }
        if (
          meta["meta-key"] === "Higher_Latitudes_Methods" &&
          meta?.value &&
          typeof meta?.value === "string"
        ) {
          const converter: SelectSchemaValid = {
            id: meta.id,
            "meta-key": meta["meta-key"],
            value: JSON.parse(meta?.value),
          };
          SetHighLittude(converter);
          const parsedValue = JSON.parse(meta?.value);
          if (Array.isArray(parsedValue)) {
            updateHigherLatitudeMethods(parsedValue);
          }
        }
        if (
          meta["meta-key"] === "Rounding_Method" &&
          meta?.value &&
          typeof meta?.value === "string"
        ) {
          const parsedValue = JSON.parse(meta?.value);
          const converter: SelectSchemaValid = {
            id: meta.id,
            "meta-key": meta["meta-key"],
            value: Array.isArray(parsedValue) ? parsedValue : [],
          };
          SetRoundingCal(converter);
          roundingFound = true;
          if (Array.isArray(parsedValue)) {
            updateRoundingCalculationMethods(parsedValue);
          }
        }
        if (
          meta["meta-key"] === "Methods_For_Calculation" &&
          meta?.value &&
          typeof meta?.value === "string"
        ) {
          const parsedValue = JSON.parse(meta?.value);
          const converter: SelectSchemaValid = {
            id: meta.id,
            "meta-key": meta["meta-key"],
            value: Array.isArray(parsedValue) ? parsedValue : [],
          };
          SetMethodsForCal(converter);
          if (Array.isArray(parsedValue)) {
            // Convert param values to proper format (numbers stay as numbers, strings like "90 min" stay as strings)
            const convertedValue = parsedValue.map((method: any) => {
              if (method.params) {
                const convertedParams: any = {};
                Object.entries(method.params).forEach(([key, value]: [string, any]) => {
                  // Convert numeric strings to numbers
                  if (typeof value === 'string' && value.match(/^\d+(\.\d+)?$/)) {
                    convertedParams[key] = parseFloat(value);
                  } else {
                    convertedParams[key] = value;
                  }
                });
                return { ...method, params: convertedParams };
              }
              return method;
            });

            // Ensure "Unified Method" is always available as a calculation method.
            // If it is missing (older installs), append it with sensible defaults.
            const hasUnified = convertedValue.some(
              (method: any) => String(method?.method || '').toLowerCase() === 'unified_method'
            );
            if (!hasUnified) {
              const nextId = convertedValue.reduce((max: number, m: any) => Math.max(max, Number(m?.id) || 0), 0) + 1;
              const unifiedEntry = {
                id: nextId,
                name: 'Unified Method',
                method: 'UNIFIED_METHOD',
                // East London Mosque / London unified timetable defaults
                params: { fajr: 14.5, isha: '75 min', maghrib: '3 min', asr: 'Standard', midnight: 'Standard', highLats: 'AngleBased', iterations: 2 },
              };
              convertedValue.push(unifiedEntry);
              converter.value = [...(Array.isArray(converter.value) ? converter.value : []), unifiedEntry];
              SetMethodsForCal(converter);
            }

            updateMethodsForCalculation(convertedValue);
          }
        }

        if (
          meta["meta-key"] === "skip_iqamah_midnight" &&
          meta?.value !== undefined
        ) {
          const value = typeof meta?.value === "string" ? meta?.value === "1" || meta?.value === "true" : Boolean(meta?.value);
          SetSkipIqamahMidnight(value);
        }

        if (meta["meta-key"] === "timetable_layout" && meta?.value) {
          try {
            const layoutData = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
            if (layoutData && typeof layoutData === 'object') {
              useTimetableLayoutStore.getState().setOptions(layoutData);

              // Sync layout flags to useLocationStore so all calendars stay consistent
              const locStore = useLocationStore.getState();
              if (typeof layoutData.showIqamah === 'boolean') {
                locStore.updateSetSkipIqamahMidnight(!layoutData.showIqamah);
                locStore.updateSkipIqamah(!layoutData.showIqamah);
              }
              if (typeof layoutData.showMidnight === 'boolean') {
                locStore.updateSkipMidnight(!layoutData.showMidnight);
              }
              if (typeof layoutData.showBegins === 'boolean') {
                locStore.updateSkipBegins(!layoutData.showBegins);
              }
              if (typeof layoutData.showDate === 'boolean') {
                locStore.updateSkipDate(!layoutData.showDate);
              }
              if (typeof layoutData.showSunrise === 'boolean') {
                locStore.updateShowSunrise(layoutData.showSunrise);
              }
              if (typeof layoutData.showHijriDate === 'boolean') {
                locStore.updateShowHijriDate(layoutData.showHijriDate);
              }
            }
          } catch (e) {
            console.error('Error loading timetable_layout:', e);
          }
        }

        if (meta["meta-key"] === "vertical_today_layout" && meta?.value !== undefined) {
          try {
            const layoutData = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;
            if (layoutData && typeof layoutData === 'object') {
              // setOptions coerces every field to a boolean, so a corrupt value
              // can never reach the preview or the saved payload.
              useVerticalTodayLayoutStore.getState().setOptions(layoutData);
            }
          } catch (e) {
            console.error('Error loading vertical_today_layout:', e);
          }
        }

        // Six optional Jumu'ah / Eid style slots — always normalize to the
        // six-slot shape so a short or corrupt stored value can never break
        // the settings panel or the loaded state.
        if (meta["meta-key"] === "extra_prayers" && meta?.value !== undefined) {
          try {
            const parsed = typeof meta.value === "string" ? JSON.parse(meta.value) : meta.value;
            const normalized = createDefaultExtraPrayers().map((fallback, index) => {
              const row = Array.isArray(parsed) ? parsed[index] : undefined;
              return {
                name: typeof row?.name === "string" ? row.name : fallback.name,
                time: typeof row?.time === "string" ? row.time : fallback.time,
                note: typeof row?.note === "string" ? row.note : fallback.note,
              };
            });
            updateExtraPrayers(normalized);
          } catch (e) {
            console.error("Error loading extra_prayers:", e);
          }
        }

        if (meta["meta-key"] === "location_list") {
          const converter: Location = {
            id: meta.id,
            "meta-key": meta["meta-key"],
            value: JSON.parse([meta.value].toString()),
          };
          updateCustomLocationData(converter);
        }

        // Handle custom prayer time schedules
        if (meta["meta-key"] === "custom-prayer-time-schedules" && meta?.value) {
          try {
            const parsedValue = typeof meta.value === 'string' ? JSON.parse(meta.value) : meta.value;

            if (parsedValue && parsedValue.state) {
              // Update the custom schedules in the Zustand store
              if (parsedValue.state.customSchedules) {
                setCustomSchedules(parsedValue.state.customSchedules);
              }

              // Update the enabled status
              if (typeof parsedValue.state.isCustomSchedulesEnabled !== 'undefined') {
                setIsCustomSchedulesEnabled(parsedValue.state.isCustomSchedulesEnabled);
              }
            }
          } catch (error) {
            console.error('Error parsing custom prayer time schedules:', error);
          }
        }

        metaPrinter(meta);
        GetMetaPrayerSettings(meta);
        tuneMetaUpdate(meta);
        iqamaMetaUpdate(meta);
        GetMetaThemeColors(meta);
        getMetaHijraLocale(meta);
        getMetaRamadan(meta);
      }

      // Rounding Method is not stored in the DB yet (older installs) — seed the
      // standard options so the Configure Settings page always has them.
      if (!roundingFound) {
        const roundingDefaults = [
          { id: 24, name: 'Nearest (Standard)', method: 'nearest' },
          { id: 25, name: 'Up (Ceil)', method: 'up' },
          { id: 26, name: 'Down (Floor)', method: 'down' },
          { id: 27, name: 'None (Exact)', method: 'none' },
        ];
        SetRoundingCal({ id: '', 'meta-key': 'Rounding_Method', value: roundingDefaults });
        updateRoundingCalculationMethods(roundingDefaults);
      }
    } catch (error) {
      console.log(error);
    }
  };

  return { getPrayerSettingMeta };
};

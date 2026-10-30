import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { getAllTranslations } from "../hooks/useGetTranslate";
import { sendTranslations } from "../hooks/usePostTranslate";

interface Translation {
  original_text: string;
  translated_text: string;
  language_code: string;
  language_name: string;
}

interface Language {
  code: string;
  language: string;
}

interface HijraLocale {
  isActive: boolean;
  language: string;
  calendarType: string;
  custom: boolean;
  customLan: boolean;
}

/** Translation categories, i.e. every list of Translation rows the store holds. */
export type TranslationCategory =
  | "prayer_names"
  | "gregorian_months"
  | "gregorian_numbers"
  | "hijra_months"
  | "hijra_numbers"
  | "extra_info"
  | "timetable_prayer"
  | "vertical_daily_prayer"
  | "day_names";

export interface TranslationState {
  activeLanguage: string; // Language code (e.g., "en")
  availableLanguages: Language[]; // Array of objects with code and language name
  prayer_names: Translation[];
  gregorian_months: Translation[];
  gregorian_numbers: Translation[];
  hijralocales: HijraLocale;
  hijra_months: Translation[];
  hijra_numbers: Translation[];
  extra_info: Translation[];
  timetable_prayer: Translation[];
  vertical_daily_prayer: Translation[];
  day_names: Translation[];
  loading: boolean;
  fetchTranslations: () => Promise<void>;
  selectLanguage: (language: string) => void;
  updateTranslation: (
    category: TranslationCategory,
    index: number,
    value: string
  ) => void;
  saveTranslations: () => Promise<void>;
  addNewLanguage: (code: string, language: string) => void;
}

const sessionStorageAdapter = {
	getItem: (name: string) => { const v = sessionStorage.getItem(name); return v ? JSON.parse(v) : null; },
	setItem: (name: string, value: any) => sessionStorage.setItem(name, JSON.stringify(value)),
	removeItem: (name: string) => sessionStorage.removeItem(name),
};

export const useTranslationStore = create<TranslationState>()(
  devtools(
    persist(
      (set, get) => ({
      activeLanguage: "en",
      availableLanguages: [{ code: "en", language: "English" }], // Initialize with default language
      prayer_names: [],
      gregorian_months: [],
      gregorian_numbers: [],
      timetable_prayer: [],
      vertical_daily_prayer: [],
      day_names: [],
      hijralocales: {
        isActive: false,
        language: "",
        calendarType: "",
        custom: false,
        customLan: false,
      },
      hijra_months: [],
      hijra_numbers: [],
      extra_info: [],
      loading: false,

      fetchTranslations: async () => {
        set({ loading: true });
        try {
          const translations = await getAllTranslations();
          if (translations) {
            const activeLang = translations.activeLanguage?.[0]?.language_code || "en";

            // Extract available languages with their full names
            const availableLangs = Array.from(
              new Map(
                translations.prayer_names?.map((p: Translation) => [
                  p.language_code, // Use language code as the key to avoid duplicates
                  { code: p.language_code, language: p.language_name },
                ])
              ).values() // Convert Map values back to an array
            );

            set({
              activeLanguage: activeLang,
              availableLanguages: availableLangs,
              prayer_names: translations.prayer_names || [],
              timetable_prayer: translations.timetable_prayer || [],
              vertical_daily_prayer: translations.vertical_daily_prayer || [],
              day_names: translations.day_names || [],
              gregorian_months: translations.gregorian_months || [],
              gregorian_numbers: translations.gregorian_numbers || [],
              hijra_months: translations.hijra_months || [],
              hijra_numbers: translations.hijra_numbers || [],
              extra_info: translations.extra_info || [],
              hijralocales: translations.hijralocale as unknown as HijraLocale || {
                isActive: false,
                language: "",
                calendarType: "",
                custom: false,
                customLan: false,
              },
            });
          }
        } catch (error) {
          console.error("Error fetching translations:", error);
        } finally {
          set({ loading: false });
        }
      },

      selectLanguage: (language) => {
        set({ activeLanguage: language });
      },

      updateTranslation: (category, index, value) => {
        set((state) => {
          const updatedCategory = [...state[category] as Translation[] | Language[]];
          updatedCategory[index] = { ...updatedCategory[index], translated_text: value };
          return { [category]: updatedCategory };
        });
      },

      saveTranslations: async () => {
        set({ loading: true });
        try {
          await sendTranslations({
            prayer_names: get().prayer_names,
            gregorian_months: get().gregorian_months,
            gregorian_numbers: get().gregorian_numbers,
            hijra_months: get().hijra_months,
            hijra_numbers: get().hijra_numbers,
            timetable_prayer: get().timetable_prayer,
            vertical_daily_prayer: get().vertical_daily_prayer,
            day_names: get().day_names,
            extra_info: get().extra_info,

          });

          await sendTranslations({ activeLanguage: [{ language_code: get().activeLanguage }] });

          await get().fetchTranslations();

        } catch (error) {
          console.error("Error saving translations:", error);
        } finally {
          set({ loading: false });
        }
      },

      addNewLanguage: (code, language) => {
        const { availableLanguages, activeLanguage } = get();

        // Check if the language code already exists
        if (availableLanguages.some((lang) => lang.code === code)) {
          console.error("Language already exists!");
          return;
        }

        // Define all categories to update
        const categories = [
          "prayer_names",
          "gregorian_months",
          "gregorian_numbers",
          "hijra_months",
          "hijra_numbers",
          "timetable_prayer",
          "vertical_daily_prayer",
          "day_names",
          "extra_info",
          ] as const;

        // Create new translations for each category
        const newTranslations = categories.reduce((acc, category) => {
          acc[category] = get()[category]
            .filter((item) => item.language_code === activeLanguage) // Use the active language as a template
            .map((item) => ({
              ...item,
              language_code: code,
              language_name: language,
              translated_text: item.original_text, // Use original_text as the default value
            }));
          return acc;
        }, {} as Record<typeof categories[number], Translation[]>);

        // Update the state with the new translations
        set((state) => ({
          ...newTranslations, // Spread the new translations for all categories
          availableLanguages: [...state.availableLanguages, { code, language }], // Add the new language object
        }));

        // Set the new language as active
        get().selectLanguage(code);
      },
    }),
    { name: "storeTranslation", storage: sessionStorageAdapter, partialize: (state) => ({
      activeLanguage: state.activeLanguage,
      availableLanguages: state.availableLanguages,
      prayer_names: state.prayer_names,
      gregorian_months: state.gregorian_months,
      gregorian_numbers: state.gregorian_numbers,
      hijralocales: state.hijralocales,
      hijra_months: state.hijra_months,
      hijra_numbers: state.hijra_numbers,
      extra_info: state.extra_info,
      timetable_prayer: state.timetable_prayer,
      vertical_daily_prayer: state.vertical_daily_prayer,
      day_names: state.day_names,
    }) }
    ),
    { name: "storeTranslation" }
  )
);
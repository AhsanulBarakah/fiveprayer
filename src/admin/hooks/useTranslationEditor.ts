import { useTranslationStore } from "../state/useTranslationStore";
import type { TranslationCategory } from "../state/useTranslationStore";

export const useTranslationEditor = (category: TranslationCategory) => {
  const {
    activeLanguage,
    availableLanguages,
    loading,
    selectLanguage,
    updateTranslation,
    saveTranslations,
    addNewLanguage,
    [category]: translations,
  } = useTranslationStore();

  const handleInputChange = (key: string, value: string) => {
    const index = translations.findIndex(
      (item) =>
        item.original_text === key.split("-")[0] &&
        item.language_code === activeLanguage
    );
    if (index >= 0) {
      updateTranslation(category, index, value);
    }
  };

  const handleAddLanguage = (code: string, lan: string) => {
    addNewLanguage(code, lan);
  };

  return {
    inputValues: translations
      .filter((item) => item.language_code === activeLanguage)
      .reduce((acc, item) => {
        acc[`${item.original_text}-${item.language_code}`] = item.translated_text;
        return acc;
      }, {} as { [key: string]: string }),
    activeLanguage,
    availableLanguages,
    loading,
    handleInputChange,
    handleSelectLanguage: selectLanguage,
    handleSave: saveTranslations,
    handleAddLanguage,
    translations: translations.filter((item) => item.language_code === activeLanguage),
  };
};
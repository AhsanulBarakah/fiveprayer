/**
 * TranslationEditor
 *
 * Shared, modern editor shell used by every translation section. It owns the
 * layout only — all data logic lives in the translation store, so behaviour is
 * identical to the per-page editors it replaces.
 *
 * @module More/translates/TranslationEditor
 */
import React, { useMemo } from 'react';
import { useTranslationStore } from '../../../state/useTranslationStore';
import AddLanguageButton from './AddLanguageButton';
import { getTranslateSection } from './translateSections';
import type { TranslationCategory } from './translateSections';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';
import { FaInfoCircle, FaSave, FaSpinner } from 'react-icons/fa';

interface Translation {
  original_text: string;
  translated_text: string;
  language_code: string;
  language_name: string;
}

type Props = {
  /** Store category to edit */
  category: TranslationCategory;
  /** Page heading */
  title: string;
  /** Optional subtitle, falls back to the section description */
  description?: string;
  /** Map of original text to a shortcode badge */
  shortcodes?: Record<string, string>;
  /**
   * Map of original text to the wording shown above the field. Display only:
   * the stored entry itself keeps its original text, so nothing about the
   * saved translation changes.
   */
  labels?: Record<string, string>;
  /** Toast shown after a successful save */
  successMessage: string;
  /** Toast shown when saving fails */
  errorMessage: string;
};

const TranslationEditor: React.FC<Props> = ({
  category,
  title,
  description,
  shortcodes = {},
  labels = {},
  successMessage,
  errorMessage,
}) => {
  const source = useTranslationStore((state) => state[category]) as Translation[];
  const activeLanguage = useTranslationStore((state) => state.activeLanguage);
  const availableLanguages = useTranslationStore((state) => state.availableLanguages);
  const loading = useTranslationStore((state) => state.loading);
  const selectLanguage = useTranslationStore((state) => state.selectLanguage);
  const updateTranslation = useTranslationStore((state) => state.updateTranslation);
  const saveTranslations = useTranslationStore((state) => state.saveTranslations);
  const addNewLanguage = useTranslationStore((state) => state.addNewLanguage);

  const section = getTranslateSection(category);

  // Fields for the active language, keeping the original store index.
  const fields = useMemo(
    () =>
      source
        .map((item, idx) => ({ ...item, originalIndex: idx }))
        .filter((item) => item.language_code === activeLanguage),
    [source, activeLanguage]
  );

  const handleInputChange = (originalIndex: number, value: string) => {
    if (originalIndex >= 0 && originalIndex < source.length) {
      updateTranslation(category, originalIndex, value);
    }
  };

  const handleSave = async () => {
    try {
      await saveTranslations();
      toast.success(successMessage);
    } catch (error) {
      console.error('Error saving translations:', error);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600 ring-1 ring-emerald-100">
          {section?.icon}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {description || section?.description}
          </p>
        </div>
      </div>

      {/* Setup hint */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        <FaInfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-sm leading-relaxed">
          {__(
            'Please make sure the Hijri Calendar is activated and a language is selected. Click the Hijri Calendar page in the navbar to access the settings. If you are using the translation system, set the Hijri language to Custom Language.',
            'fiveprayer'
          )}
        </p>
      </div>

      {/* Language */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
              {__('Language', 'fiveprayer')}
            </span>
            <div className="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
              {availableLanguages.map((lang) => {
                const isActive = activeLanguage === lang.code;
                // The selected pill mirrors the sidebar's active item
                // (TranslateMoreLinks): light green tint instead of a white card.
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => selectLanguage(lang.code)}
                    className={`rounded-md px-3 py-1.5 text-sm capitalize transition-colors focus:outline-hidden ${
                      isActive
                        ? 'bg-emerald-100 font-medium text-emerald-800'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {lang.language}
                    <span className="ml-1 text-[10px] uppercase text-gray-400">
                      {lang.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AddLanguageButton
            data={source}
            handlerAddLangauge={addNewLanguage}
            disabled={loading}
          />
        </div>
      </div>

      {/* Fields */}
      {fields.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {fields.map((field) => {
            const inputId = `${category}-${field.originalIndex}`;
            const shortcode = shortcodes[field.original_text];
            const label = labels[field.original_text] || field.original_text;
            return (
              <div
                key={inputId}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs transition focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <label
                    htmlFor={inputId}
                    className="text-sm font-medium text-gray-700"
                  >
                    {label}
                  </label>
                  {shortcode ? (
                    <code className="shrink-0 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {shortcode}
                    </code>
                  ) : null}
                </div>
                <input
                  id={inputId}
                  type="text"
                  value={field.translated_text}
                  onChange={(e) =>
                    handleInputChange(field.originalIndex, e.target.value)
                  }
                  disabled={loading}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm transition focus:border-emerald-300 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-sm text-gray-500">
            {__(
              'No entries found for this language. Add a language to get started.',
              'fiveprayer'
            )}
          </p>
        </div>
      )}

      {/* Save action */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {__('Save your translations', 'fiveprayer')}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {__('Editing', 'fiveprayer')}{' '}
              <span className="font-medium text-gray-700">
                {activeLanguage.toUpperCase()}
              </span>{' '}
              · {fields.length} {__('fields', 'fiveprayer')}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-xs transition-colors hover:bg-emerald-700 focus:outline-hidden focus:ring-2 focus:ring-emerald-300 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <FaSpinner className="h-4 w-4 animate-spin" />
                {__('Saving…', 'fiveprayer')}
              </>
            ) : (
              <>
                <FaSave className="h-4 w-4" />
                {__('Save Changes', 'fiveprayer')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationEditor;

/**
 * AutoPrintPageSettings
 *
 * Text input for configuring the auto-print page URL.
 *
 * @module prayerSetting/AutoPrintPageSettings
 */
import React from 'react';
import { usePostControlFromUI } from '../../hooks/usePostControlFromUI';
import { useLocationStore } from '../../state/storeLocation';
import { __ } from '@wordpress/i18n';

const AutoPrintPageSettings = () => {
  const autoPrintPageUrl = useLocationStore((state) => state.autoPrintPageUrl);
  const { updateAutoPrintPageUrl } = usePostControlFromUI();
  const [isSaving, setIsSaving] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(autoPrintPageUrl || '');
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');

  React.useEffect(() => {
    setLocalValue(autoPrintPageUrl || '');
  }, [autoPrintPageUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updateAutoPrintPageUrl(localValue);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setLocalValue(autoPrintPageUrl || '');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleSave();
    }
  };

  return (
    <div className="p-5 space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">{__('Auto-Print Page', 'fiveprayer')}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{__('Set a URL that automatically opens the print dialog when visited', 'fiveprayer')}</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={localValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          placeholder={__('/printer/', 'fiveprayer')}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:outline-hidden transition-all placeholder:text-gray-300 disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || localValue === autoPrintPageUrl}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            isSaving || localValue === autoPrintPageUrl
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800 active:scale-95'
          }`}
        >
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {saveStatus === 'success' && (
        <p className="text-xs text-emerald-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>{__('URL saved successfully', 'fiveprayer')}</p>
      )}
      {saveStatus === 'error' && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>{__('Failed to save URL', 'fiveprayer')}</p>
      )}

      {localValue && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 space-y-1">
          <p className="font-medium flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>{__('How it works', 'fiveprayer')}</p>
          <p>{__('Add ', 'fiveprayer')}<code className="bg-amber-100 px-1 rounded-sm font-mono">{__('[Fp_TimeTable_Monthly]', 'fiveprayer')}</code>{__(' to the page at ', 'fiveprayer')}<code className="bg-amber-100 px-1 rounded-sm font-mono">{localValue}</code></p>
          <p>{__('When visitors go there, the print dialog opens automatically.', 'fiveprayer')}</p>
        </div>
      )}
    </div>
  );
};

export default AutoPrintPageSettings;

/**
 * PrinterButtonUrlSettings
 *
 * Text input for custom printer button URL with toggle.
 *
 * @module prayerSetting/PrinterButtonUrlSettings
 */
import React from 'react';
import { usePostControlFromUI } from '../../hooks/usePostControlFromUI';
import { useLocationStore } from '../../state/storeLocation';
import { __ } from '@wordpress/i18n';

const PrinterButtonUrlSettings = () => {
  const printerButtonUrl = useLocationStore((state) => state.printerButtonUrl);
  const hideCustomUrlButton = useLocationStore((state) => state.hideCustomUrlButton);
  const { updatePrinterButtonUrl, updateHideCustomUrlButton } = usePostControlFromUI();
  const [isSaving, setIsSaving] = React.useState(false);
  const [localValue, setLocalValue] = React.useState(printerButtonUrl || '');
  const [saveStatus, setSaveStatus] = React.useState<'idle' | 'success' | 'error'>('idle');
  const [isToggling, setIsToggling] = React.useState(false);

  React.useEffect(() => {
    setLocalValue(printerButtonUrl || '');
  }, [printerButtonUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await updatePrinterButtonUrl(localValue);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setLocalValue(printerButtonUrl || '');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await updateHideCustomUrlButton(!hideCustomUrlButton);
    } finally {
      setIsToggling(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleSave();
    }
  };

  return (
    <div className="p-5 space-y-4">
      {/* Custom URL Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{__('Custom URL Button', 'fiveprayer')}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{__('Show a custom URL button instead of the default print button on the calendar', 'fiveprayer')}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hideCustomUrlButton}
          onClick={handleToggle}
          disabled={isToggling}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            hideCustomUrlButton ? 'bg-blue-600' : 'bg-gray-200'
          } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${
              hideCustomUrlButton ? 'translate-x-[18px]' : 'translate-x-[2px]'
            }`}
          />
        </button>
      </div>

      {/* URL Input */}
      {hideCustomUrlButton && (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500">{__('Custom URL', 'fiveprayer')}</label>
          <div className="flex gap-2">
            <input
              type="url"
              value={localValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isSaving}
              placeholder={__('https://example.com/print-page', 'fiveprayer')}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 focus:outline-hidden transition-all placeholder:text-gray-300 disabled:bg-gray-100"
            />
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || localValue === printerButtonUrl}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                isSaving || localValue === printerButtonUrl
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

          {/* Shortcode Tips */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-700">{__('Shortcodes:', 'fiveprayer')}</p>
            <p><code className="bg-gray-200 px-1.5 py-0.5 rounded-sm font-mono">{__('[Fp_Printer_Button_URL]', 'fiveprayer')}</code>{__(' — Custom URL button', 'fiveprayer')}</p>
            <p><code className="bg-gray-200 px-1.5 py-0.5 rounded-sm font-mono">{__('[Fp_Printer_Button]', 'fiveprayer')}</code>{__(' — Default print button', 'fiveprayer')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrinterButtonUrlSettings;

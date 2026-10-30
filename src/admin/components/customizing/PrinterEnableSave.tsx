/**
 * PrinterEnableSave
 *
 * Save button that persists all printer customization settings.
 *
 * @module customizing/PrinterEnableSave
 */
import React from 'react'
import { usePrinterExtraStore } from '../../state/storePrinterExtra';
import { usePostMeta } from '../../hooks/usePostMeta';
import { __ } from '@wordpress/i18n';

type Props = {}

const PrinterEnableSave = (props: Props) => {
    const { appendDataPost } = usePostMeta();
    const [isSaving, setIsSaving] = React.useState(false);
    const [showSaved, setShowSaved] = React.useState(false);

  const {
    updateprinter_boolean,
    printer_left1,
    printer_left2,
    printer_left3,
    printer_left4,
    printer_left5,
    printer_left6,
    printer_left7,
    printer_right1,
    printer_right2,
    printer_right3,
    printer_right4,
    printer_right5,
    printer_right6,
    printer_right7,
    printer_boolean,
    printer_logo,
  } = usePrinterExtraStore((state) => state);

  const savePrinterExtra = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const data = {
      meta: "printer",
      value: {
        printer_left1,
        printer_left2,
        printer_left3,
        printer_left4,
        printer_left5,
        printer_left6,
        printer_left7,
        printer_right1,
        printer_right2,
        printer_right3,
        printer_right4,
        printer_right5,
        printer_right6,
        printer_right7,
        printer_boolean,
        printer_logo,
      },
    };
    await appendDataPost(data);
    setIsSaving(false);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Show on Calendar Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">{__('Show on Calendar', 'fiveprayer')}</span>
        <button
          type="button"
          role="switch"
          aria-checked={printer_boolean}
          onClick={() => updateprinter_boolean(!printer_boolean)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            printer_boolean ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${
              printer_boolean ? 'translate-x-[18px]' : 'translate-x-[2px]'
            }`}
          />
        </button>
      </div>

      {/* Save Button */}
      <button
        onClick={savePrinterExtra}
        disabled={isSaving}
        className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          showSaved
            ? 'bg-emerald-500 text-white shadow-xs'
            : isSaving
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-gray-900 text-white hover:bg-gray-800 shadow-xs hover:shadow-sm active:scale-95'
        }`}
      >
        {isSaving ? (
          <>
            <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>{__('Saving...', 'fiveprayer')}</>
        ) : showSaved ? (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>{__('Saved!', 'fiveprayer')}</>
        ) : (
          <>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>{__('Save', 'fiveprayer')}</>
        )}
      </button>
    </div>
  );
}

export default PrinterEnableSave

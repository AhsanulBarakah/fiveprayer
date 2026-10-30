/**
 * HidePrinterButtonSettings
 *
 * Toggle to hide/show the printer button.
 *
 * @module prayerSetting/HidePrinterButtonSettings
 */
import React from 'react';
import { usePostControlFromUI } from '../../hooks/usePostControlFromUI';
import { useLocationStore } from '../../state/storeLocation';
import { __ } from '@wordpress/i18n';

const HidePrinterButtonSettings = () => {
  const hidePrinterButton = useLocationStore((state) => state.hidePrinterButton);
  const { updateHidePrinterButton } = usePostControlFromUI();
  const [isToggling, setIsToggling] = React.useState(false);

  const handleToggle = async () => {
    if (isToggling) return;
    setIsToggling(true);
    try {
      await updateHidePrinterButton(!hidePrinterButton);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="px-5 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{__('Hide Printer Button', 'fiveprayer')}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{__('Hide the printer timetable button from the calendar display', 'fiveprayer')}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={hidePrinterButton}
          onClick={handleToggle}
          disabled={isToggling}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            hidePrinterButton ? 'bg-blue-600' : 'bg-gray-200'
          } ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${
              hidePrinterButton ? 'translate-x-[18px]' : 'translate-x-[2px]'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default HidePrinterButtonSettings;

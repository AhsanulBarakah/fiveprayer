/**
 * DisplaySettingsPage
 *
 * Page composing all display setting toggles.
 *
 * @module More/page/DisplaySettingsPage
 */
import React from 'react';
import HidePrinterButtonSettings from '../../prayerSetting/HidePrinterButtonSettings';
import HideMonthSelectionSettings from '../../prayerSetting/HideMonthSelectionSettings';
import PrinterButtonUrlSettings from '../../prayerSetting/PrinterButtonUrlSettings';
import AutoPrintPageSettings from '../../prayerSetting/AutoPrintPageSettings';
import { __ } from '@wordpress/i18n';

type Props = {};

const DisplaySettingsPage = (props: Props) => {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{__('Display Settings', 'fiveprayer')}</h1>
        <p className="text-sm text-gray-500 mt-1">{__('Customize how prayer timetables appear on your website and when printed.', 'fiveprayer')}</p>
      </div>

      {/* Table Display Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 0v.375" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{__('Table Display', 'fiveprayer')}</h2>
              <p className="text-xs text-gray-500">{__('Control which columns appear in prayer timetable displays', 'fiveprayer')}</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          <HidePrinterButtonSettings />
          <HideMonthSelectionSettings />
        </div>
      </div>

      {/* Printer Button Settings */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{__('Printer Button', 'fiveprayer')}</h2>
              <p className="text-xs text-gray-500">{__('Configure the printer timetable button behavior', 'fiveprayer')}</p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          <PrinterButtonUrlSettings />
          <AutoPrintPageSettings />
        </div>
      </div>
    </div>
  );
};

export default DisplaySettingsPage;

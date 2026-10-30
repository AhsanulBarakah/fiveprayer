/**
 * PrinterTimeTable
 *
 * Top-level printer timetable editor composing all printer components.
 *
 * @module customizing/PrinterTimeTable
 */
import React from "react";
import PrinterLeftTextInput from "./PrinterLeftTextInput";
import PrinterRightTextInput from "./PrinterRightTextInput";
import PrinterCalendar from "./PrinterCalendar";
import PrinterMiddleLogoInput from "./PrinterMiddleLogoInput";
import PrinterEnableSave from "./PrinterEnableSave";
import { __ } from '@wordpress/i18n';

type Props = {};

const PrinterTimeTable = (props: Props) => {
  const [showPreview, setShowPreview] = React.useState(true);

  return (
    <div className="space-y-6">
      {/* Input Controls */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Top bar with Save + Toggle */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{__('Print Header Details', 'fiveprayer')}</h3>
              <p className="text-xs text-gray-500">{__('Configure the header section of your printed timetable', 'fiveprayer')}</p>
            </div>
          </div>
          <PrinterEnableSave />
        </div>

        {/* Three-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
          {/* Left Column */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-sm bg-indigo-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-700">{__('Left Side', 'fiveprayer')}</h4>
            </div>
            <PrinterLeftTextInput />
          </div>

          {/* Center Column - Logo */}
          <div className="p-5 flex flex-col items-center">
            <div className="flex items-center gap-2 mb-4 w-full">
              <div className="w-6 h-6 rounded-sm bg-amber-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-700">{__('Logo', 'fiveprayer')}</h4>
            </div>
            <PrinterMiddleLogoInput />
          </div>

          {/* Right Column */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-sm bg-indigo-100 flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-indigo-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-700">{__('Right Side', 'fiveprayer')}</h4>
            </div>
            <PrinterRightTextInput />
          </div>
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            </div>
            <div className="text-left">
              <h3 className="text-sm font-semibold text-gray-900">{__('Print Preview', 'fiveprayer')}</h3>
              <p className="text-xs text-gray-500">{__('See how your timetable will look when printed', 'fiveprayer')}</p>
            </div>
          </div>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showPreview ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {showPreview && (
          <div className="border-t border-gray-100 p-6">
            <PrinterCalendar />
          </div>
        )}
      </div>
    </div>
  );
};

export default PrinterTimeTable;

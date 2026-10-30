/**
 * WelcomeSettingsNotice
 *
 * Landing hub for the More Settings section: a short welcome plus clickable
 * cards for each settings group.
 *
 * @module More/page/WelcomeSettingsNotice
 */
import React from "react";
import { Link } from "react-router";
import { __ } from '@wordpress/i18n';
import { FaChevronRight, FaCog, FaInfoCircle, FaLanguage, FaTable } from 'react-icons/fa';

const WelcomeSettingsNotice: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600 ring-1 ring-emerald-100">
          <FaCog />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {__('Welcome to Settings', 'fiveprayer')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {__('Pick a section below to get started.', 'fiveprayer')}
          </p>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          to="/moresettings/translate"
          className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-emerald-100"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
            <FaLanguage />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-gray-900">
              {__('Translate', 'fiveprayer')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {__('Translate every label, date and number the plugin displays.', 'fiveprayer')}
            </p>
          </div>
          <FaChevronRight className="mt-1 h-3 w-3 shrink-0 text-gray-300 transition-colors group-hover:text-emerald-500" />
        </Link>

        <Link
          to="/moresettings/displaysettings"
          className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-blue-300 hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-blue-100"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            <FaTable />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-gray-900">
              {__('Display Settings', 'fiveprayer')}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-500">
              {__('Control what appears in the timetable and other display options.', 'fiveprayer')}
            </p>
          </div>
          <FaChevronRight className="mt-1 h-3 w-3 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500" />
        </Link>
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
        <FaInfoCircle className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
        <p className="text-xs leading-relaxed text-gray-500">
          {__('We’re constantly improving — expect more setting options to appear here soon!', 'fiveprayer')}
        </p>
      </div>
    </div>
  );
};

export default WelcomeSettingsNotice;

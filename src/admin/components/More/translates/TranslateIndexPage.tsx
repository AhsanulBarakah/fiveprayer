/**
 * TranslateIndexPage
 *
 * Landing page for the translation section. Gives the whole "Translate" area a
 * clear entry point and a clean, clickable overview of every section.
 *
 * @module More/translates/TranslateIndexPage
 */
import React from 'react';
import { Link } from 'react-router';
import { TRANSLATE_SECTIONS } from './translateSections';
import { __ } from '@wordpress/i18n';
import { FaChevronRight, FaLanguage } from 'react-icons/fa';

const TranslateIndexPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600 ring-1 ring-emerald-100">
          <FaLanguage />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">
            {__('Translate', 'fiveprayer')}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {__(
              'Translate every label, date and number the plugin displays. Pick a section below to start editing.',
              'fiveprayer'
            )}
          </p>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TRANSLATE_SECTIONS.map((section) => (
          <Link
            key={section.key}
            to={`/moresettings/${section.path}`}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-xs transition-all hover:border-emerald-300 hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-emerald-100"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              {section.icon}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-gray-900">
                {section.label}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-gray-500">
                {section.description}
              </p>
            </div>
            <FaChevronRight className="mt-1 h-3 w-3 shrink-0 text-gray-300 transition-colors group-hover:text-emerald-500" />
          </Link>
        ))}
      </div>
    </div>
  );
};

export default TranslateIndexPage;

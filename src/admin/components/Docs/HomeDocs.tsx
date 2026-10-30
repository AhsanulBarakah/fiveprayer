import React from "react";
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';
import { DEPRECATED_SHORTCODES } from './shortcodes/SingleShortCodeDocs';

const HomeDocs = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Intro Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{__('What is the Five Prayer Plugin?', 'fiveprayer')}</h2>
        <p className="text-lg text-gray-700 text-center">{__('The ', 'fiveprayer')}<strong>{__('Five Prayer Plugin', 'fiveprayer')}</strong>{__(' is a dedicated solution for Muslim WordPress websites that need to display accurate daily prayer times. It integrates seamlessly with your site, offering an easy-to-use interface for showing Salah times based on location and calculation methods.', 'fiveprayer')}</p>
      </div>

      {/* Shortcode reference */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{__('Shortcode Reference', 'fiveprayer')}</h2>
        <p className="text-lg text-gray-700 mb-4">
          {__('Every shortcode is listed with a copy button — the single-prayer tags under ', 'fiveprayer')}
          <strong>{__('Single Prayer', 'fiveprayer')}</strong>
          {__(' and the timetable, printer and extra-prayer tags under ', 'fiveprayer')}
          <strong>{__('Timetable', 'fiveprayer')}</strong>
          {__('.', 'fiveprayer')}
        </p>

        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mb-4">
          <p className="text-gray-700">
            {__('Deprecated shortcodes still render: ', 'fiveprayer')}
            <strong>{DEPRECATED_SHORTCODES.length}</strong>
            {__(' tags have been superseded by clearer names. Each is listed with the tag to use instead, and an admin notice flags every page still using an old one.', 'fiveprayer')}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/documentation/singleprayer/shortcodes"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            {__('Single Prayer shortcodes', 'fiveprayer')}
          </Link>
          <Link
            to="/documentation/timetable/shortcodes"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
          >
            {__('Timetable & extra prayers', 'fiveprayer')}
          </Link>
        </div>
      </div>

      {/* Video Section */}
      <div className="w-full flex justify-center mb-6">
        <iframe
          width="100%"
          height="500"
          src="https://www.youtube-nocookie.com/embed/c7MVPIepyVI?si=WTzfLgG8gUzhH1cV"
          title={__('Five Prayer Plugin Introduction', 'fiveprayer')}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="rounded-lg shadow-md"
        ></iframe>
      </div>

      {/* Printer Button Options Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{__('Printer Button Options', 'fiveprayer')}</h2>
        <p className="text-lg text-gray-700 mb-4">{__('Configure the printer timetable button behavior in ', 'fiveprayer')}<strong>{__('Five Prayer > More Settings > Display Settings', 'fiveprayer')}</strong>.
        </p>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{__('Printer Timetable Button URL', 'fiveprayer')}</h3>
            <p className="text-gray-700 mb-2">{__('Enter a custom URL to redirect when the printer timetable button is clicked. Leave empty to use default print functionality.', 'fiveprayer')}</p>
            <code className="bg-gray-200 px-2 py-1 rounded-sm text-sm">{__('Example: https://your-site.com/printer/', 'fiveprayer')}</code>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{__('Show Custom URL Button', 'fiveprayer')}</h3>
            <p className="text-gray-700">{__('Turn on to show your custom URL button on the calendar (this replaces the print button). Turn off to show the print button instead.', 'fiveprayer')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{__('Auto-Print Page URL', 'fiveprayer')}</h3>
            <p className="text-gray-700 mb-2">{__('Enter the URL of the dedicated print page where the print dialog should automatically trigger.', 'fiveprayer')}<strong>{__(' Make sure this page has the timetable calendar shortcode', 'fiveprayer')}</strong>{__(' ([Fp_TimeTable_Monthly] or block). Leave empty to disable.', 'fiveprayer')}</p>
            <code className="bg-gray-200 px-2 py-1 rounded-sm text-sm">{__('Example: /printer/', 'fiveprayer')}</code>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-3">
              <p className="text-gray-700 text-sm mb-2">
                <strong>{__('How it works:', 'fiveprayer')}</strong>
              </p>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>{__('• Make sure your dedicated print page contains the timetable calendar shortcode ([Fp_TimeTable_Monthly] or block).', 'fiveprayer')}</li>
                <li>{__('• When visitors go to ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('/printer/', 'fiveprayer')}</code>{__(', the print dialog will automatically open.', 'fiveprayer')}</li>
                <li>{__('• Use this for dedicated print-only pages.', 'fiveprayer')}</li>
                <li>{__('• Set your custom URL button to redirect to this page for automatic printing.', 'fiveprayer')}</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{__('Usage Notes', 'fiveprayer')}</h3>
            <ul className="text-gray-700 space-y-1">
              <li>{__('• Use shortcode ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('[Fp_Printer_Button_URL]', 'fiveprayer')}</code>{__(' to show a custom URL button that redirects to another page with the selected month.', 'fiveprayer')}</li>
              <li>{__('• Use ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('[Fp_Printer_Button]', 'fiveprayer')}</code>{__(' for the default print button (prints on the same page).', 'fiveprayer')}</li>
              <li>{__('• When "Show Custom URL Button" toggle is enabled, the custom URL button replaces the print button on the calendar. When disabled, the print button shows instead.', 'fiveprayer')}</li>
              <li>{__('• Set your custom URL button to redirect to an auto-print page for seamless printing across pages.', 'fiveprayer')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDocs;

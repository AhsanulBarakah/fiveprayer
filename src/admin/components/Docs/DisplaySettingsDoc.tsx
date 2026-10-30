import React from "react";
import { __ } from '@wordpress/i18n';

const DisplaySettingsDoc = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{__('Display Settings Guide', 'fiveprayer')}</h2>
        <p className="text-lg text-gray-700 text-center">{__('Learn how to configure display options for the prayer timetable in ', 'fiveprayer')}<strong>{__('Five Prayer > More Settings > Display Settings', 'fiveprayer')}</strong>.
        </p>
      </div>

      {/* Overview Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('What are Display Settings?', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('Display Settings allow you to control which columns appear in the monthly prayer timetable and customize the user interface elements.', 'fiveprayer')}</p>
      </div>

      {/* Settings Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Available Settings', 'fiveprayer')}</h3>

        <div className="space-y-4">
          {/* Hide Printer Button */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Hide Printer Button', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('When enabled, the print button will be hidden from the calendar view on the frontend.', 'fiveprayer')}</p>
            <p className="text-gray-700"><strong>{__('Use Case:', 'fiveprayer')}</strong>{__(' Use this if you don\'t want visitors to print the prayer timetable.', 'fiveprayer')}</p>
          </div>

          {/* Hide Month Selection */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Hide Month Selection', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('When enabled, the month selection dropdown will be hidden from the calendar view.', 'fiveprayer')}</p>
            <p className="text-gray-700"><strong>{__('Use Case:', 'fiveprayer')}</strong>{__(' Use this if you want to lock the display to a specific month and prevent visitors from switching months.', 'fiveprayer')}</p>
          </div>

          {/* Printer Button URL */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Printer Button URL', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Enter a custom URL to redirect when the printer button is clicked. Leave empty to use the default print functionality.', 'fiveprayer')}</p>
            <p className="text-gray-700"><strong>{__('Example:', 'fiveprayer')}</strong> <code className="bg-gray-200 px-1 rounded-sm">{__('http://yoursite.com/printer-page/', 'fiveprayer')}</code></p>
          </div>

          {/* Auto-Print Page URL */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Auto-Print Page URL', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Enter the URL of a dedicated print page where the print dialog should automatically trigger when the page loads.', 'fiveprayer')}</p>
            <p className="text-gray-700 mb-2"><strong>{__('Example:', 'fiveprayer')}</strong> <code className="bg-gray-200 px-1 rounded-sm">{__('/printer/', 'fiveprayer')}</code></p>
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-3">
              <p className="text-gray-700 text-sm">
                <strong>{__('⚠️ Important:', 'fiveprayer')}</strong>{__(' Make sure your dedicated print page contains the timetable calendar shortcode (', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('[Fp_TimeTable_Monthly]', 'fiveprayer')}</code>{__(' or block).', 'fiveprayer')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Shortcodes Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Related Shortcodes', 'fiveprayer')}</h3>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Printer Button Shortcodes', 'fiveprayer')}</h4>
            <ul className="text-gray-700 space-y-2">
              <li>• <code className="bg-gray-200 px-2 py-0.5 rounded-sm">{__('[Fp_Printer_Button]', 'fiveprayer')}</code>{__(' – Shows the default print button (prints on the same page).', 'fiveprayer')}</li>
              <li>• <code className="bg-gray-200 px-2 py-0.5 rounded-sm">{__('[Fp_Printer_Button_URL]', 'fiveprayer')}</code>{__(' – Shows a custom URL button that redirects to another page with the selected month.', 'fiveprayer')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-blue-800 mb-3">{__('Tips', 'fiveprayer')}</h3>
        <ul className="text-blue-700 space-y-2">
          <li>{__('• Hiding columns makes the timetable more compact and easier to read on mobile devices.', 'fiveprayer')}</li>
          <li>{__('• Use the Auto-Print Page URL for a seamless printing experience across pages.', 'fiveprayer')}</li>
          <li>{__('• Combine "Hide Month Selection" with a fixed month shortcode for static displays.', 'fiveprayer')}</li>
        </ul>
      </div>
    </div>
  );
};

export default DisplaySettingsDoc;

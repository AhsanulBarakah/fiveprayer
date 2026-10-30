import React from "react";
import { __ } from '@wordpress/i18n';

const CustomTimeSchedulesDoc = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{__('Custom Prayer Time Schedules Guide', 'fiveprayer')}</h2>
        <p className="text-lg text-gray-700 text-center">{__('Learn how to set custom prayer times for specific dates in ', 'fiveprayer')}<strong>{__('Five Prayer > Configure Settings > Advanced Schedules', 'fiveprayer')}</strong>{__(' (enable the feature from ', 'fiveprayer')}<strong>{__('Feature Switches > Advanced Schedules', 'fiveprayer')}</strong>{__(' first).', 'fiveprayer')}</p>
      </div>

      {/* Overview Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('What are Custom Prayer Time Schedules?', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('Custom Prayer Time Schedules allow you to override the calculated prayer times for specific dates or date ranges. This is useful for special occasions, Ramadan, or when your mosque follows a different timetable on certain days.', 'fiveprayer')}</p>
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <p className="text-gray-700 text-sm">
            <strong>{__('How it works:', 'fiveprayer')}</strong>{__(' When a custom schedule is active for a date, it completely overrides the calculated prayer times for that day. The custom times will be displayed in the timetable and used by shortcodes.', 'fiveprayer')}</p>
        </div>
      </div>

      {/* Creating Schedules Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Creating a Custom Schedule', 'fiveprayer')}</h3>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Step 1: Enable Custom Schedules', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Make sure ', 'fiveprayer')}<strong>{__('Advanced Schedules', 'fiveprayer')}</strong>{__(' is switched ON in ', 'fiveprayer')}<strong>{__('Configure Settings > Feature Switches', 'fiveprayer')}</strong>{__(' — that gate hides the card and, when off, stops the overrides from applying. With the card visible, toggle the', 'fiveprayer')}{' '}
              <strong>{__('"Enable Custom Schedules"', 'fiveprayer')}</strong>{__(' switch to ON. This activates the custom schedule system.', 'fiveprayer')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Step 2: Add a New Schedule', 'fiveprayer')}</h4>
            <ol className="text-gray-700 space-y-2 ml-4 list-decimal">
              <li>{__('Click the ', 'fiveprayer')}<strong>{__('"Add New Schedule"', 'fiveprayer')}</strong>{__(' button.', 'fiveprayer')}</li>
              <li>{__('Enter a ', 'fiveprayer')}<strong>{__('Schedule Name', 'fiveprayer')}</strong>{__(' – a descriptive label (e.g., "Ramadan Timetable", "Friday Special Times").', 'fiveprayer')}</li>
              <li>{__('Set the ', 'fiveprayer')}<strong>{__('Start Date', 'fiveprayer')}</strong>{__(' – when the schedule begins.', 'fiveprayer')}</li>
              <li>{__('Set the ', 'fiveprayer')}<strong>{__('End Date', 'fiveprayer')}</strong>{__(' – when the schedule ends (or leave same as start date for a single day).', 'fiveprayer')}</li>
              <li>{__('Enter the ', 'fiveprayer')}<strong>{__('Prayer Times', 'fiveprayer')}</strong>{__(' for each prayer:', 'fiveprayer')}<ul className="ml-6 mt-2 space-y-1">
                  <li>• <strong>{__('Fajr:', 'fiveprayer')}</strong>{__(' e.g., ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">05:30</code></li>
                  <li>• <strong>{__('Sunrise:', 'fiveprayer')}</strong>{__(' e.g., ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">06:45</code></li>
                  <li>• <strong>{__('Dhuhr:', 'fiveprayer')}</strong>{__(' e.g., ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">12:30</code></li>
                  <li>• <strong>{__('Asr:', 'fiveprayer')}</strong>{__(' e.g., ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">15:45</code></li>
                  <li>• <strong>{__('Maghrib:', 'fiveprayer')}</strong>{__(' e.g., ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">18:15</code></li>
                  <li>• <strong>{__('Isha:', 'fiveprayer')}</strong>{__(' e.g., ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">19:45</code></li>
                </ul>
              </li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('"Save"', 'fiveprayer')}</strong>{__(' to add the schedule.', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Step 3: Manage Schedules', 'fiveprayer')}</h4>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>• <strong>{__('Edit:', 'fiveprayer')}</strong>{__(' Click the edit icon to modify a schedule.', 'fiveprayer')}</li>
              <li>• <strong>{__('Delete:', 'fiveprayer')}</strong>{__(' Click the delete icon to remove a schedule.', 'fiveprayer')}</li>
              <li>• <strong>{__('Toggle:', 'fiveprayer')}</strong>{__(' Use the switch to enable/disable individual schedules without deleting them.', 'fiveprayer')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Date Range Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Date Ranges', 'fiveprayer')}</h3>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Single Day Schedule', 'fiveprayer')}</h4>
            <p className="text-gray-700">{__('Set the same date for both Start and End to create a schedule for a single day.', 'fiveprayer')}</p>
            <p className="text-gray-700 mt-1"><strong>{__('Example:', 'fiveprayer')}</strong>{__(' Start: ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">2025-03-15</code>{__(', End: ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">2025-03-15</code></p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Multi-Day Schedule', 'fiveprayer')}</h4>
            <p className="text-gray-700">{__('Set different Start and End dates to create a schedule that spans multiple days.', 'fiveprayer')}</p>
            <p className="text-gray-700 mt-1"><strong>{__('Example:', 'fiveprayer')}</strong>{__(' Start: ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">2025-03-01</code>{__(', End: ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">2025-03-30</code>{__(' (entire month of Ramadan)', 'fiveprayer')}</p>
          </div>
        </div>
      </div>

      {/* Priority Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Schedule Priority', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('When multiple schedules overlap, the system uses the following priority:', 'fiveprayer')}</p>
        <ol className="text-gray-700 space-y-2 ml-4 list-decimal">
          <li><strong>{__('Enabled schedules', 'fiveprayer')}</strong>{__(' take priority over disabled ones.', 'fiveprayer')}</li>
          <li>{__('If multiple schedules are enabled for the same date, the ', 'fiveprayer')}<strong>{__('most recently created', 'fiveprayer')}</strong>{__(' schedule takes priority.', 'fiveprayer')}</li>
          <li>{__('Custom schedules ', 'fiveprayer')}<strong>{__('completely override', 'fiveprayer')}</strong>{__(' calculated prayer times.', 'fiveprayer')}</li>
        </ol>
        <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-3">
          <p className="text-gray-700 text-sm">
            <strong>{__('⚠️ Tip:', 'fiveprayer')}</strong>{__(' Avoid overlapping schedules to prevent unexpected behavior. Use distinct date ranges for each schedule.', 'fiveprayer')}</p>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Troubleshooting', 'fiveprayer')}</h3>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Custom Schedule Not Showing', 'fiveprayer')}</h4>
          <ul className="text-gray-700 space-y-1 ml-4">
            <li>{__('• Make sure the ', 'fiveprayer')}<strong>{__('Advanced Schedules', 'fiveprayer')}</strong>{__(' feature is ON in ', 'fiveprayer')}<strong>{__('Feature Switches', 'fiveprayer')}</strong>.</li>
            <li>{__('• Make sure ', 'fiveprayer')}<strong>{__('"Enable Custom Schedules"', 'fiveprayer')}</strong>{__(' is toggled ON.', 'fiveprayer')}</li>
            <li>{__('• Check that the schedule is ', 'fiveprayer')}<strong>{__('enabled', 'fiveprayer')}</strong>{__(' (toggle switch is ON).', 'fiveprayer')}</li>
            <li>{__('• Verify the ', 'fiveprayer')}<strong>{__('date range', 'fiveprayer')}</strong>{__(' includes the date you\'re viewing.', 'fiveprayer')}</li>
            <li>{__('• Click ', 'fiveprayer')}<strong>{__('"Generate Calendar"', 'fiveprayer')}</strong>{__(' to rebuild the timetable with your custom schedules.', 'fiveprayer')}</li>
          </ul>
        </div>
      </div>

      {/* Tips Section */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-blue-800 mb-3">{__('Tips', 'fiveprayer')}</h3>
        <ul className="text-blue-700 space-y-2">
          <li>{__('• Always click ', 'fiveprayer')}<strong>{__('"Generate Calendar"', 'fiveprayer')}</strong>{__(' after creating or modifying custom schedules.', 'fiveprayer')}</li>
          <li>{__('• Use descriptive schedule names to easily identify them later.', 'fiveprayer')}</li>
          <li>{__('• Test your schedules by viewing the timetable on the frontend before publishing.', 'fiveprayer')}</li>
          <li>{__('• Keep a backup of your custom schedules by noting the times and dates in a separate document.', 'fiveprayer')}</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomTimeSchedulesDoc;

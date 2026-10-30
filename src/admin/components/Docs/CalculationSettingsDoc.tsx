import React from "react";
import { __ } from '@wordpress/i18n';

const CalculationSettingsDoc = () => {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{__('Configure Settings Guide', 'fiveprayer')}</h2>
        <p className="text-lg text-gray-700 text-center">{__('Learn how to configure and manage prayer calculation methods in ', 'fiveprayer')}<strong>{__('Five Prayer > Customizing > Configure Settings', 'fiveprayer')}</strong>.
        </p>
      </div>

      {/* Beta Notice */}
      <div className="bg-yellow-50 border border-yellow-200 p-5 rounded-lg mb-6">
        <p className="text-gray-800">
          <strong>{__('⚠️ Beta Feature:', 'fiveprayer')}</strong>{__(' Configure Settings is currently in beta. If you notice unexpected changes in prayer times after updating, please ', 'fiveprayer')}<strong>{__('reset your settings', 'fiveprayer')}</strong>{__(' via the Data Management tab and reconfigure.', 'fiveprayer')}</p>
      </div>

      {/* Overview Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('What are Configure Settings?', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('Configure Settings define how prayer times are computed for your location. This section allows you to manage the mathematical methods and parameters used to determine when each prayer begins and ends.', 'fiveprayer')}</p>
        <p className="text-gray-700">{__('You can access this section by navigating to ', 'fiveprayer')}<strong>{__('Five Prayer > Customizing > Configure Settings', 'fiveprayer')}</strong>{__(' in your WordPress admin dashboard.', 'fiveprayer')}</p>
      </div>

      {/* Categories Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Settings Categories', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('The Configure Settings page is organized into five main categories:', 'fiveprayer')}</p>

        <div className="space-y-4">
          {/* Prayer Calculation Methods */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('🕌 Prayer Calculation Methods', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Define the methods used to calculate Fajr and Isha prayer times based on the sun\'s angle below the horizon.', 'fiveprayer')}</p>
            <p className="text-gray-700 mb-2"><strong>{__('Common Methods:', 'fiveprayer')}</strong></p>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>• <strong>{__('MWL (Muslim World League):', 'fiveprayer')}</strong>{__(' Fajr: 18°, Isha: 17°', 'fiveprayer')}</li>
              <li>• <strong>{__('ISNA (Islamic Society of North America):', 'fiveprayer')}</strong>{__(' Fajr: 15°, Isha: 15°', 'fiveprayer')}</li>
              <li>• <strong>{__('Egyptian General Authority of Survey:', 'fiveprayer')}</strong>{__(' Fajr: 19.5°, Isha: 17.5°', 'fiveprayer')}</li>
              <li>• <strong>{__('Umm Al-Qura University, Makkah:', 'fiveprayer')}</strong>{__(' Fajr: 18.5°, Isha: 90 min after Maghrib', 'fiveprayer')}</li>
              <li>• <strong>{__('University of Islamic Sciences, Karachi:', 'fiveprayer')}</strong>{__(' Fajr: 18°, Isha: 18°', 'fiveprayer')}</li>
            </ul>
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mt-3">
              <p className="text-gray-700 text-sm mb-3">
                <strong>{__('How to Add a New Method:', 'fiveprayer')}</strong>
              </p>
              <ol className="text-gray-700 text-sm space-y-2 ml-4 list-decimal">
                <li>{__('Click ', 'fiveprayer')}<strong>{__('"Add New"', 'fiveprayer')}</strong>{__(' button at the top of the section.', 'fiveprayer')}</li>
                <li>{__('Enter a ', 'fiveprayer')}<strong>{__('Name', 'fiveprayer')}</strong>{__(' – this is a descriptive label for your method. Examples:', 'fiveprayer')}<ul className="ml-6 mt-1 space-y-1">
                    <li>• <code className="bg-white px-2 py-0.5 rounded-sm border">{__('Muslim World League', 'fiveprayer')}</code></li>
                    <li>• <code className="bg-white px-2 py-0.5 rounded-sm border">{__('ISNA North America', 'fiveprayer')}</code></li>
                    <li>• <code className="bg-white px-2 py-0.5 rounded-sm border">{__('Umm Al-Qura Makkah', 'fiveprayer')}</code></li>
                    <li>• <code className="bg-white px-2 py-0.5 rounded-sm border">{__('Custom UK Method', 'fiveprayer')}</code></li>
                  </ul>
                </li>
                <li>{__('Enter a ', 'fiveprayer')}<strong>{__('Method Code', 'fiveprayer')}</strong>{__(' – a short identifier (no spaces). Examples:', 'fiveprayer')}<ul className="ml-6 mt-1 space-y-1">
                    <li>• <code className="bg-white px-2 py-0.5 rounded-sm border">{__('MWL', 'fiveprayer')}</code></li>
                    <li>• <code className="bg-white px-2 py-0.5 rounded-sm border">{__('ISNA', 'fiveprayer')}</code></li>
                    <li>• <code className="bg-white px-2 py-0.5 rounded-sm border">{__('UMM_ALQURA', 'fiveprayer')}</code></li>
                    <li>• <code className="bg-white px-2 py-0.5 rounded-sm border">{__('CUSTOM_UK', 'fiveprayer')}</code></li>
                  </ul>
                </li>
                <li>{__('Set the ', 'fiveprayer')}<strong>{__('Calculation Parameters', 'fiveprayer')}</strong>:
                  <ul className="ml-6 mt-1 space-y-1">
                    <li>• <strong>{__('Fajr Angle:', 'fiveprayer')}</strong>{__(' Enter degrees, e.g., ', 'fiveprayer')}<code className="bg-white px-2 py-0.5 rounded-sm border">18</code></li>
                    <li>• <strong>{__('Isha Angle:', 'fiveprayer')}</strong>{__(' Enter degrees (e.g., ', 'fiveprayer')}<code className="bg-white px-2 py-0.5 rounded-sm border">17</code>{__(') OR minutes after Maghrib (e.g., ', 'fiveprayer')}<code className="bg-white px-2 py-0.5 rounded-sm border">{__('90 min', 'fiveprayer')}</code>)</li>
                    <li>• <strong>{__('Maghrib:', 'fiveprayer')}</strong>{__(' Enter degrees (e.g., ', 'fiveprayer')}<code className="bg-white px-2 py-0.5 rounded-sm border">4</code>{__(') OR minutes after sunset (e.g., ', 'fiveprayer')}<code className="bg-white px-2 py-0.5 rounded-sm border">{__('4 min', 'fiveprayer')}</code>)</li>
                    <li>• <strong>{__('Dhuhr:', 'fiveprayer')}</strong>{__(' Enter minutes after midday, e.g., ', 'fiveprayer')}<code className="bg-white px-2 py-0.5 rounded-sm border">{__('1 min', 'fiveprayer')}</code></li>
                  </ul>
                </li>
                <li>{__('Click ', 'fiveprayer')}<strong>{__('"Save"', 'fiveprayer')}</strong>{__(' to add the method to your list.', 'fiveprayer')}</li>
              </ol>
              <div className="bg-white p-3 rounded-md border border-blue-100 mt-3">
                <p className="text-gray-700 text-xs mb-2"><strong>{__('📌 Example: Adding MWL (Muslim World League)', 'fiveprayer')}</strong></p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">{__('Name:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('Muslim World League', 'fiveprayer')}</code></div>
                  <div><span className="text-gray-500">{__('Method Code:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('MWL', 'fiveprayer')}</code></div>
                  <div><span className="text-gray-500">{__('Fajr Angle:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">18</code></div>
                  <div><span className="text-gray-500">{__('Isha Angle:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">17</code></div>
                  <div><span className="text-gray-500">{__('Maghrib:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">4</code></div>
                  <div><span className="text-gray-500">{__('Dhuhr:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('1 min', 'fiveprayer')}</code></div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-md border border-blue-100 mt-2">
                <p className="text-gray-700 text-xs mb-2"><strong>{__('📌 Example: Adding Umm Al-Qura (Isha as minutes)', 'fiveprayer')}</strong></p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-500">{__('Name:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('Umm Al-Qura Makkah', 'fiveprayer')}</code></div>
                  <div><span className="text-gray-500">{__('Method Code:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('UMM_ALQURA', 'fiveprayer')}</code></div>
                  <div><span className="text-gray-500">{__('Fajr Angle:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">18.5</code></div>
                  <div><span className="text-gray-500">{__('Isha Angle:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('90 min', 'fiveprayer')}</code></div>
                  <div><span className="text-gray-500">{__('Maghrib:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">4</code></div>
                  <div><span className="text-gray-500">{__('Dhuhr:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('0 min', 'fiveprayer')}</code></div>
                </div>
              </div>
            </div>
          </div>

          {/* Asr Calculation Methods */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('☀️ Asr Calculation Methods', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Choose the Asr calculation method based on your school of thought.', 'fiveprayer')}</p>
            <p className="text-gray-700 mb-2"><strong>{__('Options:', 'fiveprayer')}</strong></p>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>• <strong>{__('Standard:', 'fiveprayer')}</strong>{__(' Used by Shafii, Maliki, and Hanbali schools. Asr begins when the shadow of an object equals its length plus the shadow length at noon.', 'fiveprayer')}</li>
              <li>• <strong>{__('Hanafi:', 'fiveprayer')}</strong>{__(' Used by the Hanafi school. Asr begins when the shadow of an object equals twice its length plus the shadow length at noon (later than Standard).', 'fiveprayer')}</li>
              <li>• <strong>{__('Shafii, Maliki, Jafari, Hanbali and Hanafi (Asr + Hanafi):', 'fiveprayer')}</strong>{__(' The same 1 Mithl ‘Asr as Standard, and Generate also stores the Hanafi 2 Mithl time next to it — pick this when the timetable should carry both ‘Asr times. Choosing it switches the Hanafi column on.', 'fiveprayer')}</li>
            </ul>
            <p className="text-gray-700 mt-2">{__('The optional ', 'fiveprayer')}<strong>{__('Hanafi', 'fiveprayer')}</strong>{__(' column shows the second ‘Asr — the 2 Mithl time — and is filled when you Generate a timetable. If the column is empty for older dates, pick a 1 Mithl option from this list (or the combined Asr + Hanafi one) and click Generate again. When your main Asr is already Hanafi (2 Mithl), the Hanafi column stays empty because both times are the same.', 'fiveprayer')}</p>
          </div>

          {/* Midnight Calculation Modes */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('🌙 Midnight Calculation Modes', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Define how midnight is calculated for determining the end time of Isha prayer.', 'fiveprayer')}</p>
            <p className="text-gray-700 mb-2"><strong>{__('Options:', 'fiveprayer')}</strong></p>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>• <strong>{__('Standard:', 'fiveprayer')}</strong>{__(' Midnight is calculated as the midpoint between sunset and sunrise.', 'fiveprayer')}</li>
              <li>• <strong>{__('Jafari:', 'fiveprayer')}</strong>{__(' Used by Jafari (Shia) followers. Midnight is calculated differently based on Jafari jurisprudence.', 'fiveprayer')}</li>
            </ul>
          </div>

          {/* Higher Latitude Methods */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('🌍 Higher Latitude Methods', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Methods for handling prayer times in high latitude areas where the sun may not set or rise normally during certain times of the year.', 'fiveprayer')}</p>
            <p className="text-gray-700 mb-2"><strong>{__('Options:', 'fiveprayer')}</strong></p>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>• <strong>{__('NightMiddle:', 'fiveprayer')}</strong>{__(' Uses the middle of the night method. Fajr and Isha times are estimated based on the midpoint between sunset and sunrise.', 'fiveprayer')}</li>
              <li>• <strong>{__('AngleBased:', 'fiveprayer')}</strong>{__(' Uses a fixed angle (e.g., 1/7 of the night) to estimate prayer times.', 'fiveprayer')}</li>
              <li>• <strong>{__('UmmAlQura:', 'fiveprayer')}</strong>{__(' Uses the Umm Al-Qura method for high latitudes.', 'fiveprayer')}</li>
            </ul>
          </div>
          {/* Unified Method */}
          <div className="bg-gray-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('⭐ Unified Method', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('The ', 'fiveprayer')}<strong>{__('Unified Method', 'fiveprayer')}</strong>{__(' is a special profile that maps the ', 'fiveprayer')}<em>{__('exact', 'fiveprayer')}</em>{__(' custom criteria of your mosque\'s timetable. It was built for the UK/London unified timetable (used by East London Mosque and the wider London mosque network), where mosques follow a fixed convention that does not match any built-in method (MWL, ISNA, …).', 'fiveprayer')}</p>
            <p className="text-gray-700 mb-2"><strong>{__('How it works:', 'fiveprayer')}</strong></p>
            <ol className="text-gray-700 space-y-1 ml-4 list-decimal">
              <li>{__('Open the ', 'fiveprayer')}<strong>{__('Unified Method', 'fiveprayer')}</strong>{__(' category in the sidebar of the Configure Settings page.', 'fiveprayer')}</li>
              <li>{__('Enter the criteria your mosque publishes: ', 'fiveprayer')}<strong>{__('Fajr', 'fiveprayer')}</strong>, <strong>{__('Isha', 'fiveprayer')}</strong>, <strong>{__('Maghrib', 'fiveprayer')}</strong>{__(' (angle or minutes) and ', 'fiveprayer')}<strong>{__('Iterations', 'fiveprayer')}</strong>{__('. Everything auto-saves.', 'fiveprayer')}</li>
              <li>{__('On the Prayer Settings page, select ', 'fiveprayer')}<strong>{__('Unified Method', 'fiveprayer')}</strong>{__(' in the Calculation Method dropdown.', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' to rebuild the timetable with your criteria.', 'fiveprayer')}</li>
            </ol>
            <p className="text-gray-700 mt-2 mb-2">
              <strong>{__('Angle vs minutes:', 'fiveprayer')}</strong>{__(' Fajr/Isha/Maghrib accept either an angle in degrees (e.g. ', 'fiveprayer')}<code className="bg-white px-1 rounded-sm border">18</code>{__(') or minutes (e.g. ', 'fiveprayer')}<code className="bg-white px-1 rounded-sm border">{__('90 min', 'fiveprayer')}</code>{__(' — minutes are measured after sunset for Isha/Maghrib, and before sunrise for Fajr).', 'fiveprayer')}</p>
            <div className="bg-white border border-purple-200 p-3 rounded-md mt-2">
              <p className="text-gray-700 text-sm mb-2"><strong>{__('📥 Full-year London Unified paste', 'fiveprayer')}</strong></p>
              <p className="text-gray-700 text-sm mb-2">{__('Instead of approximating the table with angles, paste the published year once and every printed minute is pinned exactly.', 'fiveprayer')}</p>
              <ol className="text-gray-700 text-sm space-y-1 ml-4 list-decimal">
                <li>{__('Open ', 'fiveprayer')}<strong>{__('Customizing → Configure Settings → Unified Method', 'fiveprayer')}</strong>{__(' and scroll to ', 'fiveprayer')}<strong>{__('Import a full-year timetable', 'fiveprayer')}</strong>{__(' (inside the London Unified / exact-chart box).', 'fiveprayer')}</li>
                <li>{__('Copy the whole printed year from the London Unified timetable — all 12 month sections, ', 'fiveprayer')}<code className="bg-gray-100 px-1 rounded-sm">{__('JANUARY 2026', 'fiveprayer')}</code>{__(' through ', 'fiveprayer')}<code className="bg-gray-100 px-1 rounded-sm">{__('DECEMBER 2026', 'fiveprayer')}</code>{__(' — and paste it into the box. Either printed layout is read: East London rows such as ', 'fiveprayer')}<code className="bg-gray-100 px-1 rounded-sm">{__('Thu 1 6:26 6:46 8:03 12:09 …', 'fiveprayer')}</code>{__(' (carries the Jamā‘ah columns) or Date/Hijri rows such as ', 'fiveprayer')}<code className="bg-gray-100 px-1 rounded-sm">{__('1Thu 12 Rajab 1447 6:26 AM …', 'fiveprayer')}</code>{__('.', 'fiveprayer')}</li>
                <li>{__('Tick ', 'fiveprayer')}<strong>{__('Also import the Jamā‘ah (congregation) times', 'fiveprayer')}</strong>{__(' only if the printed congregation columns should fill the Iqamah columns, and tick ', 'fiveprayer')}<strong>{__('Also import the second ‘Asr time (2 Mithl / Hanafi)', 'fiveprayer')}</strong>{__(' when the table prints both ‘Asr columns.', 'fiveprayer')}</li>
                <li>{__('Click ', 'fiveprayer')}<strong>{__('Import & save to database', 'fiveprayer')}</strong>{__('. Only the prayer times are read — the Hijri column is skipped — and the 12-hour clock is converted to 24-hour automatically, including the BST/GMT change days.', 'fiveprayer')}</li>
                <li>{__('Click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__('. The pasted days are pinned: no angle, margin or smoothing can move those minutes.', 'fiveprayer')}</li>
              </ol>
              <p className="text-gray-700 text-sm mt-2">{__('The data is stored in your database, not hardcoded, and any month or prayer can still be edited afterwards (24-hour, one time per line). Verified against the East London 2026 table: all 365 days round-trip to the printed minute.', 'fiveprayer')}</p>
              <p className="text-gray-700 text-sm mt-2">{__('Prefer to compute rather than paste? The ', 'fiveprayer')}<strong>{__('London Unified safety margins', 'fiveprayer')}</strong>{__(' section offers both one-click presets: ', 'fiveprayer')}<strong>{__('“↺ Official spec (−3 / +5 / +2)”', 'fiveprayer')}</strong>{__(' for the 2011 agreement values and ', 'fiveprayer')}<strong>{__('“↺ East London printed (−3 / +6 / +1)”', 'fiveprayer')}</strong>{__(' for the sheet as printed.', 'fiveprayer')}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 p-3 rounded-md mt-2">
              <p className="text-gray-700 text-sm mb-2"><strong>{__('📌 Example: East London Mosque (September)', 'fiveprayer')}</strong></p>
              <p className="text-gray-700 text-sm mb-1">{__('Reverse-engineered from their published table — the engine reproduces the whole month when the', 'fiveprayer')}<strong>{__(' London Unified safety margins', 'fiveprayer')}</strong>{__(' are on:', 'fiveprayer')}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">{__('Fajr:', 'fiveprayer')}</span> <code className="bg-white px-1 rounded-sm border">14.5</code></div>
                <div><span className="text-gray-500">{__('Isha:', 'fiveprayer')}</span> <code className="bg-white px-1 rounded-sm border">{__('75 min', 'fiveprayer')}</code></div>
                <div><span className="text-gray-500">{__('Maghrib:', 'fiveprayer')}</span> <code className="bg-white px-1 rounded-sm border">{__('3 min', 'fiveprayer')}</code></div>
                <div><span className="text-gray-500">{__('Sunrise margin:', 'fiveprayer')}</span> <code className="bg-white px-1 rounded-sm border">{__('−3 min', 'fiveprayer')}</code></div>
                <div><span className="text-gray-500">{__('Dhuhr margin:', 'fiveprayer')}</span> <code className="bg-white px-1 rounded-sm border">{__('+6 min', 'fiveprayer')}</code> <span className="text-gray-400">{__('(official spec: +5)', 'fiveprayer')}</span></div>
                <div><span className="text-gray-500">{__('Asr margin:', 'fiveprayer')}</span> <code className="bg-white px-1 rounded-sm border">{__('+1 min', 'fiveprayer')}</code> <span className="text-gray-400">{__('(official spec: +2)', 'fiveprayer')}</span></div>
                <div><span className="text-gray-500">{__('Iterations:', 'fiveprayer')}</span> <code className="bg-white px-1 rounded-sm border">2</code></div>
                <div><span className="text-gray-500">{__('Asr / Midnight / High Lat:', 'fiveprayer')}</span> <code className="bg-white px-1 rounded-sm border">{__('Prayer Settings dropdowns', 'fiveprayer')}</code></div>
              </div>
              <p className="text-gray-700 text-xs mt-2">
                <strong>{__('The official 2011 London Unified specification', 'fiveprayer')}</strong>{__(' calculates the base times at ', 'fiveprayer')}<strong>{__('Charing Cross (51.5073°N, 0.12755°W)', 'fiveprayer')}</strong>{__(' using the Jean Meeus algorithms, then prints four safety margins for the whole M25:', 'fiveprayer')}<strong>{__('Sunrise − 3 min · Zuhr + 5 min · ‘Asr + 2 min · Sunset + 3 min', 'fiveprayer')}</strong>{__(', and uses ', 'fiveprayer')}<strong>{__('UK observational data (Hizbul Ulama)', 'fiveprayer')}</strong>{__(' for Fajr and Isha. The official document itself notes that recalculating in JavaScript instead of Excel can shift times by ~1 minute — which is exactly why this panel offers ', 'fiveprayer')}<em>{__('two', 'fiveprayer')}</em>{__(' one-click presets in the', 'fiveprayer')}<strong>{__(' London Unified safety margins', 'fiveprayer')}</strong>{__(' section:', 'fiveprayer')}</p>
              <ul className="text-gray-700 text-xs space-y-1 ml-4 list-disc mt-1">
                <li><strong>{__('“↺ Official spec (−3 / +5 / +2)”', 'fiveprayer')}</strong>{__(' — the exact margin values published in the 2011 agreement.', 'fiveprayer')}</li>
                <li><strong>{__('“↺ East London printed (−3 / +6 / +1)”', 'fiveprayer')}</strong>{__(' — calibrated on this engine to reproduce the printed East London sheet', 'fiveprayer')}<strong>{__(' to the minute', 'fiveprayer')}</strong>{__(' (the ±1-minute Excel-vs-JavaScript offset the spec mentions, absorbed into the margins).', 'fiveprayer')}</li>
              </ul>
              <p className="text-gray-700 text-xs mt-2">{__('While on, these offsets ', 'fiveprayer')}<strong>{__('replace', 'fiveprayer')}</strong>{__(' the global Tune Prayer values for Sunrise/Dhuhr/Asr during generation — nothing is applied twice.', 'fiveprayer')}</p>
              <p className="text-gray-700 text-xs mt-2 bg-gray-100 p-2 rounded-sm">
                <strong>{__('Expected accuracy (verified against all 30 September days):', 'fiveprayer')}</strong>{__(' with the margins on, ', 'fiveprayer')}<strong>{__('Sunrise, Dhuhr, Asr and Maghrib match the published table to the minute', 'fiveprayer')}</strong>{__('. Fajr and Isha need their ', 'fiveprayer')}<em>{__('chart', 'fiveprayer')}</em>{__(' (their published Fajr angle glides 14.2° → 15.0° → 14.6° through the month — no single angle is exact):', 'fiveprayer')}</p>
              <ul className="text-gray-700 text-xs space-y-1 ml-4 list-disc mt-1">
                <li><strong>{__('Manual / Auto:', 'fiveprayer')}</strong>{__(' Fajr/Isha match within 1–6 minutes (a flat angle can only approximate the chart).', 'fiveprayer')}</li>
                <li><strong>{__('Monthly curve + “Smooth the curve between months”:', 'fiveprayer')}</strong>{__(' interpolates the angle across each month (anchored on the 15th) — matches the chart to ~1–2 minutes all year.', 'fiveprayer')}</li>
                <li><strong>{__('Exact chart mode:', 'fiveprayer')}</strong>{__(' paste your mosque\'s full printed year once (all 12 month sections in the London Unified format) and the ', 'fiveprayer')}<strong>{__('Import & save to database', 'fiveprayer')}</strong>{__(' button reads all six Begins columns, converting the 12-hour clock to 24-hour automatically (BST/GMT change days included). Every printed minute is then pinned ', 'fiveprayer')}<strong>{__('exactly', 'fiveprayer')}</strong>{__(' — verified: 365/365 days of the East London 2026 table round-trip perfectly. Nothing is hardcoded; the pasted data is stored in your database. You can still edit any month/prayer afterwards (24h, one time per line).', 'fiveprayer')}</li>
                <li><strong>{__('Jamā‘ah → Iqamah:', 'fiveprayer')}</strong>{__(' tick ', 'fiveprayer')}<strong>{__('“Also import the Jamā‘ah (congregation) times”', 'fiveprayer')}</strong>{__(' next to Import and the printed congregation columns are captured too. While ', 'fiveprayer')}<strong>{__('Jamā‘ah times → Iqamah columns', 'fiveprayer')}</strong>{__(' is on, every day with an imported value gets that published minute written straight into its Iqamah column (Begins + Iqamah Delay is skipped for those days — nothing is double-applied). Days without a value keep the computed Iqamah. This makes the whole timetable — Begins ', 'fiveprayer')}<em>{__('and', 'fiveprayer')}</em>{__('Iqamah — match the printed sheet exactly. The Iqamah Delay values on the Prayer Settings page are not changed by this.', 'fiveprayer')}</li>
              </ul>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mt-2">
              <p className="text-gray-700 text-sm">
                <strong>{__('⚠️ Note:', 'fiveprayer')}</strong>{__(' If your timetable does not change after generating, check that ', 'fiveprayer')}<strong>{__('Custom Prayer Time Schedules', 'fiveprayer')}</strong>{__(' is not overriding the dates, and that you hard-refreshed the admin page after the last update.', 'fiveprayer')}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-md mt-2">
              <p className="text-gray-700 text-sm">
                <strong>{__('📍 About coordinates:', 'fiveprayer')}</strong>{__(' the official spec anchors on ', 'fiveprayer')}<strong>{__('Charing Cross (51.5073°N, 0.12755°W)', 'fiveprayer')}</strong>{__(' — chosen because it sits mid-way between the M25\'s eastern and western edges (the spec\'s own margin of ~100 seconds across the M25 is absorbed by the −3/+5/+2/+3 safety margins). Verified: the same criteria calculated at Charing Cross and at East London Mosque produce times within 0–1 minutes of each other. Keep your mosque\'s own location; what matters is the criteria (Fajr/Isha/Maghrib + margins + optional chart), which this guide covers.', 'fiveprayer')}</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md mt-2">
              <p className="text-gray-700 text-sm">
                <strong>{__('⚠️ Smoothing vs published tables:', 'fiveprayer')}</strong>{__(' East London\'s printed Fajr moves ~2 minutes per day in September, but the', 'fiveprayer')}<strong>{__(' Day-to-Day Smoothing', 'fiveprayer')}</strong>{__(' cap (default 90 s) intentionally flattens jumps over 90 s. To match a published unified table exactly, either raise/disable that cap or use ', 'fiveprayer')}<strong>{__('Exact chart mode', 'fiveprayer')}</strong>{__(' for Fajr/Isha (pinned days bypass smoothing and rounding).', 'fiveprayer')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Seasonal Switching Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('❄️☀️ Seasonal (Winter/Summer) Auto-Switching', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('Many UK mosques (including the London unified timetable) do ', 'fiveprayer')}<strong>{__('not', 'fiveprayer')}</strong>{__(' use the same criteria all year. In winter the sun drops low enough for the standard 18°/17° angles, but in summer it never does — so mosques switch to time-based criteria such as Fajr ≈ 90 minutes before sunrise and Isha 75 minutes after sunset. With the Unified Method you can configure both profiles once and let the calendar generation pick the right one automatically for every date of the year.', 'fiveprayer')}</p>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('How to enable it', 'fiveprayer')}</h4>
            <ol className="text-gray-700 space-y-1 ml-4 list-decimal">
              <li>{__('Open ', 'fiveprayer')}<strong>{__('Customizing → Configure Settings → Unified Method', 'fiveprayer')}</strong>.</li>
              <li>{__('Set the ', 'fiveprayer')}<strong>{__('base criteria', 'fiveprayer')}</strong>{__(' at the top (these act as the ', 'fiveprayer')}<strong>{__('winter', 'fiveprayer')}</strong>{__(' profile).', 'fiveprayer')}</li>
              <li>{__('In the ', 'fiveprayer')}<strong>{__('Seasonal Auto-Switching', 'fiveprayer')}</strong>{__(' box, set the mode to ', 'fiveprayer')}<strong>{__('Auto', 'fiveprayer')}</strong>.</li>
              <li>{__('Enter the ', 'fiveprayer')}<strong>{__('summer window', 'fiveprayer')}</strong>{__(' as month-day values, e.g. ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">04-01</code>{__(' (starts) and ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">09-30</code>{__(' (ends).', 'fiveprayer')}</li>
              <li>{__('Enter the ', 'fiveprayer')}<strong>{__('summer criteria', 'fiveprayer')}</strong>{__(': Summer Fajr, Summer Isha, Summer Maghrib.', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' — the full year is produced with the correct profile on every date automatically.', 'fiveprayer')}</li>
            </ol>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-3">
              <p className="text-gray-700 text-sm">
                <strong>{__('💡 Live indicator:', 'fiveprayer')}</strong>{__(' The panel shows ', 'fiveprayer')}<strong>{__('"Today is SUMMER"', 'fiveprayer')}</strong>{__(' or ', 'fiveprayer')}<strong>{__('"Today is WINTER"', 'fiveprayer')}</strong>{__(' and the criteria currently in effect, so you always know which profile is being used.', 'fiveprayer')}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('How the dates work', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Dates are compared as ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('MM-DD', 'fiveprayer')}</code>{__('. Any date inside the window (inclusive) uses the summer profile; every other date uses the winter (base) profile. Ranges that cross the new year are supported, e.g.', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">12-01</code>{__(' to ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">03-01</code>{__(' means December 1 – March 1.', 'fiveprayer')}</p>
            <p className="text-gray-700">{__('The seasonal profiles only change ', 'fiveprayer')}<strong>{__('Fajr, Isha and Maghrib', 'fiveprayer')}</strong>{__('. Asr, Midnight, Higher Latitude, Dhuhr and Iterations stay the same all year — Asr, Midnight and Higher Latitude always come from the ', 'fiveprayer')}<strong>{__('Prayer Settings', 'fiveprayer')}</strong>{__(' page dropdowns. Want to keep one criteria all year? Leave the mode on ', 'fiveprayer')}<strong>{__('Manual', 'fiveprayer')}</strong>{__(' — nothing changes for existing setups.', 'fiveprayer')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('📌 Example: London mosque network', 'fiveprayer')}</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-gray-500">{__('Winter (base):', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('Fajr 18°, Isha 17°', 'fiveprayer')}</code></div>
              <div><span className="text-gray-500">{__('Summer:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('Fajr 60 min, Isha 75 min', 'fiveprayer')}</code></div>
              <div><span className="text-gray-500">{__('Window:', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">04-01 → 09-30</code></div>
              <div><span className="text-gray-500">{__('All year (Prayer Settings):', 'fiveprayer')}</span> <code className="bg-gray-100 px-1 rounded-sm">{__('Asr Standard, Higher Lat Angle Based', 'fiveprayer')}</code></div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('📅 Monthly curve — Hizbul Ulama style (per-month Fajr/Isha)', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Instead of just two seasons, the ', 'fiveprayer')}<strong>{__('Monthly curve', 'fiveprayer')}</strong>{__(' mode gives every calendar month its own ', 'fiveprayer')}<strong>{__('Fajr', 'fiveprayer')}</strong>{__(' and', 'fiveprayer')}{' '}
              <strong>{__('Isha', 'fiveprayer')}</strong>{__(' value — the way the Hizbul Ulama / London unified tables are built, where the twilight angle drifts through the year on the official sliding scale (e.g. January ≈15.75°, April ≈13.4°, June–July locked at 12° …). The calculation engine is untouched: each date simply uses that month\'s value. This is now the ', 'fiveprayer')}<strong>{__('default profile', 'fiveprayer')}</strong>{__(' of the Unified Method — selecting it pre-fills the whole curve, so "Generate Calendar" applies the correct angle in every month of the year, not just one.', 'fiveprayer')}</p>
            <ol className="text-gray-700 space-y-1 ml-4 list-decimal mb-3">
              <li>{__('In the ', 'fiveprayer')}<strong>{__('Seasonal / Monthly Criteria', 'fiveprayer')}</strong>{__(' box, set the mode to ', 'fiveprayer')}<strong>{__('Monthly curve', 'fiveprayer')}</strong>{__(' (it is already the default for the Unified Method, pre-filled with the official curve — click ', 'fiveprayer')}<strong>{__('↺ Load Hizbul Ulama curve', 'fiveprayer')}</strong>{__(' anytime to restore it).', 'fiveprayer')}</li>
              <li>{__('Each month takes an angle like ', 'fiveprayer')}<code className="bg-white px-1 rounded-sm border">15</code>{__(' or minutes like', 'fiveprayer')}{' '}
                <code className="bg-white px-1 rounded-sm border">{__('60 min', 'fiveprayer')}</code>{__(' — so summer months can use time-based criteria when the 18° angle is unreachable.', 'fiveprayer')}</li>
              <li>{__('A ', 'fiveprayer')}<strong>{__('blank', 'fiveprayer')}</strong>{__(' cell uses the base Fajr/Isha fields at the top of the panel. ', 'fiveprayer')}<strong>{__('Maghrib', 'fiveprayer')}</strong>{__(' always uses the base Maghrib field — only Fajr and Isha change month to month.', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' — one pass produces the full year with the right value applied in every month.', 'fiveprayer')}</li>
            </ol>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
              <p className="text-gray-700 text-sm">
                <strong>{__('💡 Live indicator:', 'fiveprayer')}</strong>{__(' the panel highlights the current month and shows "Today (SEPTEMBER): Fajr X, Isha Y", so you can always see which cell is in effect today. As with the seasonal mode, Asr, Midnight, Higher Latitude, Dhuhr and Iterations stay fixed all year.', 'fiveprayer')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Rounding Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('🔢 Rounding Method', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('The calculation engine computes each time to the second, then rounds it to a displayed minute. The ', 'fiveprayer')}<strong>{__('Rounding Method', 'fiveprayer')}</strong>{__('category in ', 'fiveprayer')}<strong>{__('Customizing → Configure Settings', 'fiveprayer')}</strong>{__(' controls exactly how that rounding is done — by default the plugin uses', 'fiveprayer')}<strong>{__(' Nearest', 'fiveprayer')}</strong>{__(' (round to the closest minute), but you can switch it at any time.', 'fiveprayer')}</p>

        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Options', 'fiveprayer')}</h4>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>• <strong>{__('Nearest (Standard):', 'fiveprayer')}</strong>{__(' 04:37:40 → 04:38. The default; matches most published timetables.', 'fiveprayer')}</li>
              <li>• <strong>{__('Up (Ceil):', 'fiveprayer')}</strong>{__(' 04:37:10 → 04:38. Always rounds to the next minute (times get slightly later).', 'fiveprayer')}</li>
              <li>• <strong>{__('Down (Floor):', 'fiveprayer')}</strong>{__(' 04:37:40 → 04:37. Always rounds to the previous minute (times get slightly earlier).', 'fiveprayer')}</li>
              <li>• <strong>{__('None (Exact):', 'fiveprayer')}</strong>{__(' keeps the exact computed time without rounding to a minute.', 'fiveprayer')}</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('⏱️ Seconds Threshold (make your own rounding)', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('With ', 'fiveprayer')}<strong>{__('Nearest', 'fiveprayer')}</strong>{__(' you decide exactly where the cutoff is: a time rounds ', 'fiveprayer')}<strong>{__('up', 'fiveprayer')}</strong>{__(' once the seconds reach your ', 'fiveprayer')}<strong>{__('Seconds Threshold', 'fiveprayer')}</strong>{__(' (0–59), and ', 'fiveprayer')}<strong>{__('down', 'fiveprayer')}</strong>{__(' below it. The standard is ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">30</code>{__(' — change it to match your mosque\'s own rounding convention:', 'fiveprayer')}</p>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>{__('• Threshold ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">30</code>{__(': 04:37:29 → 04:37 · 04:37:30 → 04:38 (standard)', 'fiveprayer')}</li>
              <li>{__('• Threshold ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">45</code>: 04:37:44 → 04:37 · 04:37:45 → 04:38</li>
              <li>{__('• Threshold ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">15</code>: 04:37:14 → 04:37 · 04:37:15 → 04:38</li>
              <li>{__('• Threshold ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">0</code>{__(' = always up · ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">59</code>{__(' = almost always down', 'fiveprayer')}</li>
            </ul>
            <p className="text-gray-700 text-sm mt-2">{__('This is where you "make your own time": instead of being stuck with the library\'s fixed cutoff, you control the exact second at which a time rolls over to the next minute.', 'fiveprayer')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('How to change it', 'fiveprayer')}</h4>
            <ol className="text-gray-700 space-y-1 ml-4 list-decimal">
              <li>{__('Open ', 'fiveprayer')}<strong>{__('Customizing → Configure Settings → Rounding Method', 'fiveprayer')}</strong>.</li>
              <li>{__('Pick the method from the ', 'fiveprayer')}<strong>{__('Active Rounding Method', 'fiveprayer')}</strong>{__(' dropdown (the options list below is editable too).', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' — the selection is saved with the generation.', 'fiveprayer')}</li>
            </ol>
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-3">
              <p className="text-gray-700 text-sm">
                <strong>{__('⚠️ Tip:', 'fiveprayer')}</strong>{__(' if your generated times are consistently ', 'fiveprayer')}<em>{__('one minute off', 'fiveprayer')}</em>{__(' from your mosque\'s timetable, rounding is a quick thing to try — but the tune offsets (Tune Prayer) are usually the real cause, so check those first.', 'fiveprayer')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Day-to-Day Smoothing Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('📏 Day-to-Day Smoothing (cap the daily change)', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('The engine computes each day\'s time from the sun\'s actual position, so the change between consecutive days follows the natural astronomical drift — in early September Fajr in London moves ', 'fiveprayer')}<em>{__('later', 'fiveprayer')}</em>{__(' by roughly two minutes per day. If you prefer a smoother timetable where no Begins time jumps more than a set amount from one day to the next, enable ', 'fiveprayer')}<strong>{__('Day-to-Day Smoothing', 'fiveprayer')}</strong>{__(' in', 'fiveprayer')}<strong>{__(' Customizing → Configure Settings → Day-to-Day Smoothing', 'fiveprayer')}</strong>.
        </p>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('How it works', 'fiveprayer')}</h4>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>{__('• Turn smoothing ', 'fiveprayer')}<strong>{__('on', 'fiveprayer')}</strong>{__(' and set the ', 'fiveprayer')}<strong>{__('max change per day', 'fiveprayer')}</strong>{__(' in seconds (default 90).', 'fiveprayer')}</li>
              <li>• <strong>{__('No drift (default):', 'fiveprayer')}</strong>{__(' each day is compared to the previous day\'s ', 'fiveprayer')}<em>{__('true calculated', 'fiveprayer')}</em>{__(' time; if the difference exceeds your cap the day is clamped to exactly the cap, so the times ', 'fiveprayer')}<strong>{__('never drift away', 'fiveprayer')}</strong>{__(' from the real astronomical values — but in steep months consecutive days can still show ~2-minute steps.', 'fiveprayer')}</li>
              <li>• <strong>{__('Strict:', 'fiveprayer')}</strong>{__(' each day is compared to the previous ', 'fiveprayer')}<em>{__('smoothed', 'fiveprayer')}</em>{__(' day, so consecutive days never differ by more than the cap (a perfectly smooth curve) — but during long steep stretches the table can fall behind the true times by many minutes, and recovers once the natural drift slows.', 'fiveprayer')}</li>
              <li>• <strong>{__('Hybrid:', 'fiveprayer')}</strong>{__(' smooth steps like Strict, ', 'fiveprayer')}<em>{__('plus', 'fiveprayer')}</em>{__(' a ', 'fiveprayer')}<strong>{__('max drift', 'fiveprayer')}</strong>{__(' bound (default 180s = 3 minutes): if the curve would fall further than that from the true time, the cap releases just enough to hold it inside the bound — it can never run away by many minutes, and it walks back to the true time at one cap per day when the drift slows.', 'fiveprayer')}</li>
              <li>• <strong>{__('Manual:', 'fiveprayer')}</strong>{__(' type a daily step (seconds; 60 = 1 minute) for ', 'fiveprayer')}<em>{__('each', 'fiveprayer')}</em>{__(' of the six Begins prayers. While the natural drift is steeper than your step, consecutive days move by exactly your typed amount (e.g. Fajr 60 → +1 minute per day in autumn, −1 minute per day in spring automatically); when the drift is gentler the true time is kept. A prayer left at', 'fiveprayer')}{' '}
                <strong>0</strong>{__(' stays on its true time. The ', 'fiveprayer')}<strong>{__('max drift', 'fiveprayer')}</strong>{__(' bound is shared with Hybrid and keeps the curve from falling far behind the real times over long stretches.', 'fiveprayer')}</li>
              <li>{__('• It runs at ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' time, after the calculation and ', 'fiveprayer')}<strong>{__('before', 'fiveprayer')}</strong>{__(' rounding, so your', 'fiveprayer')}{' '}
                <strong>{__('Rounding Method', 'fiveprayer')}</strong>{__(' and ', 'fiveprayer')}<strong>{__('Seconds Threshold', 'fiveprayer')}</strong>{__(' are applied on top of the capped times, and the stored minutes and hover-tooltip seconds both follow the same rule.', 'fiveprayer')}</li>
            </ul>
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-3">
              <p className="text-gray-700 text-sm">
                <strong>{__('📌 Example:', 'fiveprayer')}</strong>{__(' Sept 1 Fajr computes to 04:37:44, Sept 2 to 04:39:52 (a natural +2:08 jump). With a', 'fiveprayer')}{' '}
                <code className="bg-gray-100 px-1 rounded-sm">{__('90s', 'fiveprayer')}</code>{__(' cap, Sept 2 becomes ', 'fiveprayer')}<strong>04:39:14</strong>{__(' — a maximum 90-second step. The cap applies to ', 'fiveprayer')}<strong>{__('Fajr, Sunrise, Dhuhr, Asr, Maghrib and Isha', 'fiveprayer')}</strong>{__(' (the six Begins times). Disable it to keep the exact astronomical values.', 'fiveprayer')}</p>
            </div>
            <p className="text-gray-700 text-sm mt-2">
              <strong>{__('Note:', 'fiveprayer')}</strong>{__(' in ', 'fiveprayer')}<strong>{__('No drift', 'fiveprayer')}</strong>{__(' mode the generated times can never be dragged minutes away from the real calculation — the worst case is a single cap\'s worth of difference. In ', 'fiveprayer')}<strong>{__('Hybrid', 'fiveprayer')}</strong>{__(' and ', 'fiveprayer')}<strong>{__('Manual', 'fiveprayer')}</strong>{__(' modes they stay within your max drift bound. In ', 'fiveprayer')}<strong>{__('Strict', 'fiveprayer')}</strong>{__(' mode they can lag during steep stretches by design. A', 'fiveprayer')}{' '}
              <strong>{__('live preview', 'fiveprayer')}</strong>{__(' at the bottom of the smoothing card shows the real computed seconds (your location/method, current month) for the first days, with natural times struck through and smoothed values in green — so you can see the effect before generating. The calendar hover tooltips show the same ', 'fiveprayer')}<em>{__('natural → smoothed', 'fiveprayer')}</em>{__(' when a cell was changed. All settings are saved with ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(', like the rounding method.', 'fiveprayer')}</p>
          </div>
        </div>
      </div>

      {/* Calendar Type Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('🗓️ Calendar Type (Gregorian, Solar Hijri or Lunar Hijri year)', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('Choose which ', 'fiveprayer')}<strong>{__('year', 'fiveprayer')}</strong>{__(' the full-year timetable is built around. Open', 'fiveprayer')}{' '}
          <strong>{__('Customizing → Configure Settings → Calendar Type', 'fiveprayer')}</strong>{__(' and pick one:', 'fiveprayer')}</p>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Gregorian calendar (solar) — default', 'fiveprayer')}</h4>
            <p className="text-gray-700">{__('Generates the current Gregorian year — 1 January to 31 December — plus 3 extra months. Solar year (365/366 days). This is the behaviour the plugin has always had.', 'fiveprayer')}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Solar Hijri calendar (Persian)', 'fiveprayer')}</h4>
            <p className="text-gray-700">{__('Generates the current ', 'fiveprayer')}<strong>{__('Persian year', 'fiveprayer')}</strong>{__(' — 1 Farvardin to the last day of Esfand (Nowruz, ≈ 21 March) — plus 3 extra months. The Persian calendar is ', 'fiveprayer')}<strong>{__('solar', 'fiveprayer')}</strong>{__(' (365/366 days), so its dates stay aligned with the seasons.', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mt-2">
              <strong>{__('Why the times look the same as Gregorian:', 'fiveprayer')}</strong>{__(' because both are solar calendars, a Persian date falls on the same physical day every year (e.g. 1 Farvardin ≈ 21 March). The sun is in the same place, so the prayer times are nearly identical — only the covered days differ slightly (leap years). That is correct behaviour, not a bug.', 'fiveprayer')}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Lunar Hijri calendar (Islamic)', 'fiveprayer')}</h4>
            <p className="text-gray-700">{__('Generates the current ', 'fiveprayer')}<strong>{__('Hijri year', 'fiveprayer')}</strong>{__(' — 1 Muharram to the last day of Dhu al-Hijjah — plus 3 extra months. The lunar year is ', 'fiveprayer')}<strong>{__('354/355 days', 'fiveprayer')}</strong>{__(' and drifts ~11 days earlier each solar year, so its dates land on ', 'fiveprayer')}<strong>{__('different physical days', 'fiveprayer')}</strong>{__(' — the generated prayer times genuinely differ from the Gregorian table. Prayer times are calculated for every day of that Hijri year, converted to its Gregorian dates. The timetable itself stays labeled with ', 'fiveprayer')}<strong>{__('Gregorian dates', 'fiveprayer')}</strong>{__(' in both the admin preview and the public calendar — only the ', 'fiveprayer')}<em>{__('span of days', 'fiveprayer')}</em>{__(' that get generated follows the Hijri year. The Hijri variant (Umm al-Qura or Civil) is taken from the existing Hijra display settings, so the generated year always matches the Hijri Date column.', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mt-2">
              <strong>{__('Example:', 'fiveprayer')}</strong>{__(' if today is in Hijri year 1448, generating produces the timetable for the roughly June 2026 → September 2027 Gregorian span that makes up Hijri year 1448 — it skips Jan–May 2026 and adds months into 2027, so the times on those rows differ from the Gregorian table.', 'fiveprayer')}</p>
          </div>
          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
            <p className="text-gray-700 text-sm">
              <strong>{__('💡 Note:', 'fiveprayer')}</strong>{__(' the Calendar Type decides ', 'fiveprayer')}<strong>{__('which days', 'fiveprayer')}</strong>{__(' get generated — it does not change how prayer times are calculated for a given day, the rounding, or the smoothing. The setting is saved with ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(', like the other calculation settings.', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mt-2">
              <strong>{__('🗓️ Month display (Persian/Hijri only):', 'fiveprayer')}</strong>{__(' a ', 'fiveprayer')}<strong>{__('Month display', 'fiveprayer')}</strong>{__(' choice appears under the calendar types so you can pick what works for you:', 'fiveprayer')}</p>
            <ul className="text-gray-700 text-sm mt-1 ml-5 list-disc space-y-1">
              <li>
                <strong>{__('Show every month the year touches (recommended)', 'fiveprayer')}</strong>{__(' — the ', 'fiveprayer')}<strong>{__('Month', 'fiveprayer')}</strong>{__(' dropdown keeps ', 'fiveprayer')}<strong>{__('Gregorian month names', 'fiveprayer')}</strong>{__(' and lists every Gregorian month the selected year touches, with its year label — e.g. "March 2026" … "June 2027" for Persian, "June 2026" … "September 2027" for Lunar Hijri — so you can open any month of the generated year (including months that fall in the following Gregorian year). The calendar + hover tooltips show exactly those days.', 'fiveprayer')}</li>
              <li>
                <strong>{__('Always show the 12 Gregorian months of the current year', 'fiveprayer')}</strong>{__(' — the dropdown stays plain January–December; months the generated year skips show an empty table.', 'fiveprayer')}</li>
            </ul>
            <p className="text-gray-700 text-sm mt-2">{__('Switch back to ', 'fiveprayer')}<strong>{__('Gregorian', 'fiveprayer')}</strong>{__(' and the dropdown returns to plain January–December.', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mt-2">
              <strong>{__('✅ How to see the choice working:', 'fiveprayer')}</strong>{__(' pick ', 'fiveprayer')}<strong>{__('Lunar Hijri', 'fiveprayer')}</strong> →{' '}
              <strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' → the month dropdown changes to the Hijri year\'s months (e.g. June 2026 … September 2027). Months the Hijri year skips (January–May 2026) show ', 'fiveprayer')}<strong>{__('empty tables', 'fiveprayer')}</strong>{__(', and months it adds (April–September 2027) are brand new. A purple banner above the admin table states the generated span. Days both years share — e.g. 1 September 2026 — are the same physical days, so their times are identical by design; that is the sun, not the setting.', 'fiveprayer')}</p>
          </div>
        </div>
      </div>

      {/* Parameters Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Understanding Calculation Parameters', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('Each prayer calculation method has parameters that define how prayer times are computed. Here\'s what each parameter means:', 'fiveprayer')}</p>

        <div className="space-y-4">
          {/* Fajr Angle */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Fajr Angle (degrees)', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('The sun\'s angle below the horizon that determines when Fajr begins. This is based on the twilight angle.', 'fiveprayer')}</p>
            <p className="text-gray-700"><strong>{__('Common Values:', 'fiveprayer')}</strong>{__(' 18°, 15°, 12°, 11°, or 19.5°', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mt-1">
              <strong>{__('Note:', 'fiveprayer')}</strong>{__(' Lower angles result in later Fajr times. Higher angles result in earlier Fajr times.', 'fiveprayer')}</p>
          </div>

          {/* Isha Angle */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Isha Angle (degrees)', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('The sun\'s angle below the horizon that determines when Isha begins. Alternatively, you can specify minutes after Maghrib.', 'fiveprayer')}</p>
            <p className="text-gray-700"><strong>{__('Common Values:', 'fiveprayer')}</strong>{__(' 17°, 18°, 15°, 12°, or ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('90 min', 'fiveprayer')}</code></p>
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-3">
              <p className="text-gray-700 text-sm">
                <strong>{__('⚠️ Important:', 'fiveprayer')}</strong>{__(' When entering minutes, use the format ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('90 min', 'fiveprayer')}</code>{__(' (NOT "90 minutes"). The system recognizes "min" as the suffix for minute-based calculations.', 'fiveprayer')}</p>
            </div>
          </div>

          {/* Maghrib */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Maghrib', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Either the twilight angle (in degrees) or minutes after sunset for Maghrib prayer.', 'fiveprayer')}</p>
            <p className="text-gray-700"><strong>{__('Common Values:', 'fiveprayer')}</strong>{__(' 4°, 4.5°, or ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('4 min', 'fiveprayer')}</code></p>
          </div>

          {/* Dhuhr */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Dhuhr', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Minutes to add after solar midday (zenith) to ensure Dhuhr begins after the sun has truly passed its highest point.', 'fiveprayer')}</p>
            <p className="text-gray-700"><strong>{__('Common Values:', 'fiveprayer')}</strong> <code className="bg-gray-200 px-1 rounded-sm">{__('0 min', 'fiveprayer')}</code>{__(' or ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('1 min', 'fiveprayer')}</code></p>
          </div>

          {/* Iterations */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Iterations', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('How many times the engine re-runs the whole prayer-time computation. Each pass uses the previous pass\'s times as the starting point, which refines the position of the sun used for the angles. It is a ', 'fiveprayer')}<strong>{__('precision', 'fiveprayer')}</strong>{__(' setting — it never changes which method or convention is used, only how accurately the same times are calculated.', 'fiveprayer')}</p>
            <p className="text-gray-700 mb-2">
              <strong>{__('Why it matters:', 'fiveprayer')}</strong>{__(' the library starts from approximate seeds (Fajr 05:00, Dhuhr 12:00, …) and the sun\'s declination depends on the time of day, so a couple of passes let each prayer converge on its true value. The difference between 2 and 5 passes is a matter of seconds.', 'fiveprayer')}</p>
            <p className="text-gray-700">
              <strong>{__('Recommended:', 'fiveprayer')}</strong> <code className="bg-gray-200 px-1 rounded-sm">2</code>{__(' for normal use. Only raise it (up to 5) at very high latitudes (e.g. northern UK, Scandinavia) where convergence is slower. The panel clamps the value between 1 and 5.', 'fiveprayer')}</p>
          </div>
        </div>
      </div>

      {/* Managing Settings Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Managing Your Settings', 'fiveprayer')}</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Adding a New Method', 'fiveprayer')}</h4>
            <ol className="text-gray-700 space-y-1 ml-4 list-decimal">
              <li>{__('Select the category you want to add (e.g., Prayer Calculation Methods).', 'fiveprayer')}</li>
              <li>{__('Click the ', 'fiveprayer')}<strong>{__('"Add New"', 'fiveprayer')}</strong>{__(' button.', 'fiveprayer')}</li>
              <li>{__('Enter a ', 'fiveprayer')}<strong>{__('Name', 'fiveprayer')}</strong>{__(' (e.g., "Muslim World League") and a ', 'fiveprayer')}<strong>{__('Method Code', 'fiveprayer')}</strong>{__(' (e.g., "MWL").', 'fiveprayer')}</li>
              <li>{__('Configure the ', 'fiveprayer')}<strong>{__('Calculation Parameters', 'fiveprayer')}</strong>{__(' (Fajr Angle, Isha Angle, Maghrib, Dhuhr).', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('"Save"', 'fiveprayer')}</strong>{__(' to add the method.', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Editing an Existing Method', 'fiveprayer')}</h4>
            <ol className="text-gray-700 space-y-1 ml-4 list-decimal">
              <li>{__('Find the method you want to edit in the list.', 'fiveprayer')}</li>
              <li>{__('Click the ', 'fiveprayer')}<strong>{__('Edit', 'fiveprayer')}</strong>{__(' (pencil) icon.', 'fiveprayer')}</li>
              <li>{__('Update the fields you want to change.', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('"Update"', 'fiveprayer')}</strong>{__(' to save your changes.', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Deleting a Method', 'fiveprayer')}</h4>
            <ol className="text-gray-700 space-y-1 ml-4 list-decimal">
              <li>{__('Find the method you want to delete in the list.', 'fiveprayer')}</li>
              <li>{__('Click the ', 'fiveprayer')}<strong>{__('Delete', 'fiveprayer')}</strong>{__(' (trash) icon.', 'fiveprayer')}</li>
              <li>{__('Confirm the deletion when prompted.', 'fiveprayer')}</li>
            </ol>
            <div className="bg-red-50 p-3 rounded-md border border-red-200 mt-3">
              <p className="text-gray-700 text-sm">
                <strong>{__('⚠️ Warning:', 'fiveprayer')}</strong>{__(' Deleting a method will remove it from your settings. If it\'s currently in use, you\'ll need to select a different method.', 'fiveprayer')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Data Management', 'fiveprayer')}</h3>
        <p className="text-gray-700 mb-4">{__('Use the Data Management tab to export, import, or reset your calculation settings.', 'fiveprayer')}</p>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Export Settings', 'fiveprayer')}</h4>
            <p className="text-gray-700">{__('Download your current calculation settings as a backup file. This is useful for migrating to another site or keeping a backup.', 'fiveprayer')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Import Settings', 'fiveprayer')}</h4>
            <p className="text-gray-700">{__('Restore settings from a previously exported file. Upload the file and click "Import" to apply the settings.', 'fiveprayer')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Reset Settings', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('Clear all calculation settings and start fresh. This is useful if you encounter unexpected behavior after an update.', 'fiveprayer')}</p>
            <div className="bg-yellow-50 p-3 rounded-md border border-yellow-200 mt-3">
              <p className="text-gray-700 text-sm">
                <strong>{__('⚠️ Important:', 'fiveprayer')}</strong>{__(' After resetting, you\'ll need to reconfigure your calculation settings and regenerate your calendar.', 'fiveprayer')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Troubleshooting Section */}
      <div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Troubleshooting', 'fiveprayer')}</h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Prayer Times Changed After Update', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('If you notice unexpected changes in prayer times after updating:', 'fiveprayer')}</p>
            <ol className="text-gray-700 space-y-1 ml-4 list-decimal">
              <li>{__('Go to the ', 'fiveprayer')}<strong>{__('Data Management', 'fiveprayer')}</strong>{__(' tab.', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('Reset', 'fiveprayer')}</strong>{__(' to clear old settings.', 'fiveprayer')}</li>
              <li>{__('Reconfigure your calculation methods.', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('"Generate Calendar"', 'fiveprayer')}</strong>{__(' to rebuild the timetable.', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Invalid Parameter Format', 'fiveprayer')}</h4>
            <p className="text-gray-700 mb-2">{__('If you see an error about invalid parameter format:', 'fiveprayer')}</p>
            <ul className="text-gray-700 space-y-1 ml-4">
              <li>{__('• Make sure you\'re using ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('min', 'fiveprayer')}</code>{__(' NOT ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('minutes', 'fiveprayer')}</code>{__(' for minute-based values.', 'fiveprayer')}</li>
              <li>{__('• Example: Use ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('90 min', 'fiveprayer')}</code>{__(', not ', 'fiveprayer')}<code className="bg-gray-200 px-1 rounded-sm">{__('90 minutes', 'fiveprayer')}</code>.</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-800 mb-2">{__('🕐 Winter times one hour late (or summer one hour early)? Daylight-saving fix', 'fiveprayer')}</h4>
            <p className="text-blue-900 text-sm mb-2">{__('Prayer times are calculated in the ', 'fiveprayer')}<strong>{__('timezone your WordPress site uses', 'fiveprayer')}</strong>{__(' (Settings → General → Timezone). The engine now formats with the site\'s ', 'fiveprayer')}<strong>{__('timezone name', 'fiveprayer')}</strong>{__(' (e.g. ', 'fiveprayer')}<code className="bg-white px-1 rounded-sm border">{__('Europe/London', 'fiveprayer')}</code>{__(') via the browser\'s built-in timezone database, which automatically applies the right offset for every date:', 'fiveprayer')}</p>
            <ul className="text-blue-900 text-sm space-y-1 ml-4 list-disc">
              <li>• <strong>{__('Winter → GMT', 'fiveprayer')}</strong>{__(' (UTC+0) and ', 'fiveprayer')}<strong>{__('summer → BST', 'fiveprayer')}</strong>{__(' (UTC+1) in the UK — no manual switch, no fixed offset.', 'fiveprayer')}</li>
              <li>{__('• The DST change days (clocks go forward/back) are handled automatically by the date itself.', 'fiveprayer')}</li>
              <li>{__('• Older versions used WordPress\'s ', 'fiveprayer')}<code className="bg-white px-1 rounded-sm border">{__('gmt_offset', 'fiveprayer')}</code>{__(' number, which is ', 'fiveprayer')}<strong>{__('frozen at the value from when the timezone was last saved', 'fiveprayer')}</strong>{__(' — so a site saved during British Summer Time kept +1 all year and printed winter times one hour late (and a site saved in winter would print summer times one hour early).', 'fiveprayer')}</li>
            </ul>
            <p className="text-blue-900 text-sm mt-2">
              <strong>{__('What to do:', 'fiveprayer')}</strong>{__(' after updating, click ', 'fiveprayer')}<strong>{__('Generate Calendar', 'fiveprayer')}</strong>{__(' once to rebuild the timetable with the corrected offsets. Nothing else needs changing — the location, method and criteria you already have stay exactly the same. (The printed East London sheets and any ', 'fiveprayer')}<strong>{__('Exact chart mode', 'fiveprayer')}</strong>{__(' import are already local clock times, so they are unaffected.)', 'fiveprayer')}</p>
          </div>
        </div>
      </div>

      {/* Feature Switches Section */}
      <div className="bg-purple-50 border border-purple-200 p-6 rounded-2xl mb-6">
        <h3 className="text-xl font-semibold text-purple-900 mb-3">{__('🕹️ Feature Switches (own page)', 'fiveprayer')}</h3>
        <p className="text-purple-800 text-sm mb-3">{__('The ', 'fiveprayer')}<strong>{__('Feature Switches', 'fiveprayer')}</strong>{__(' entry sits in the sidebar of the Configure Settings page (below the categories, after a divider) and opens its own page. It turns each feature on or off so you only see the settings you actually use:', 'fiveprayer')}</p>
        <ul className="text-purple-800 text-sm space-y-1 ml-4 list-disc">
          <li><strong>{__('Prayer Calculation Methods / Asr / Midnight / Higher Latitudes / Calendar Type:', 'fiveprayer')}</strong>{__(' display-only — turning one off hides its card ', 'fiveprayer')}<em>{__('and', 'fiveprayer')}</em>{__(' the engine falls back to the plain default for that rule (Asr → Standard, Midnight → Standard, Higher Latitudes → no adjustment, Calculation Methods → MWL, Calendar Type → Gregorian year). Your saved dropdown selection is kept but ignored while the feature is off; turn it back on and your previous choice applies again.', 'fiveprayer')}</li>
          <li><strong>{__('Rounding Method / Day-to-Day Smoothing / Unified Method:', 'fiveprayer')}</strong>{__(' engine-backed — turning one off actually disables the behavior (standard nearest rounding, no smoothing, Unified criteria ignored) and hides its card.', 'fiveprayer')}</li>
          <li><strong>{__('TV Display Mode:', 'fiveprayer')}</strong>{__(' the master switch of the TV Display Mode page in the Categories list — the “Enable TV Mode” box in Pages and Posts, plus opening the site from a TV or phone on your Wi-Fi. While it is on, that page is listed and holds its three switches (Pages, Posts and Share on Local Network), which all start off. Turn it off here and all three are switched off with it: no editor shows the box and the site is reachable from this computer only.', 'fiveprayer')}</li>
          <li><strong>{__('Conflicts are flagged:', 'fiveprayer')}</strong>{__(' when two features that don\'t work together are both on (e.g. Unified Method exact-chart days vs Day-to-Day Smoothing), an amber warning at the top of the panel explains which features clash and why.', 'fiveprayer')}</li>
        </ul>
        <p className="text-purple-700 text-xs mt-3">{__('Toggles are independent — switching one off never deletes another feature\'s stored values. The sidebar appearance for turned-off features is your choice (bottom of the Feature Switches page): ', 'fiveprayer')}<strong>{__('Hide them completely', 'fiveprayer')}</strong>{__(' (default) or', 'fiveprayer')}<strong>{__('Show them dimmed with an Off badge', 'fiveprayer')}</strong>{__('. Either way, ', 'fiveprayer')}<strong>{__('Feature Switches', 'fiveprayer')}</strong>{__(' itself is always visible so you can turn things back on, and any page you open for a turned-off feature explains why it is off with a link back to Feature Switches.', 'fiveprayer')}</p>
      </div>

      {/* Need Help Section */}
      <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-blue-800 mb-3">{__('Need More Help?', 'fiveprayer')}</h3>
        <p className="text-blue-700 mb-3">{__('If you have questions or need assistance with Configure Settings, you can:', 'fiveprayer')}</p>
        <ul className="text-blue-700 space-y-1 ml-4">
          <li>{__('• Hover over the ', 'fiveprayer')}<strong>{__('info icons (ℹ️)', 'fiveprayer')}</strong>{__(' next to each setting for quick explanations.', 'fiveprayer')}</li>
          <li>{__('• Check the plugin\'s official documentation and FAQs.', 'fiveprayer')}</li>
          <li>{__('• Reach out to the support team for personalized help.', 'fiveprayer')}</li>
        </ul>
      </div>
    </div>
  );
};

export default CalculationSettingsDoc;

import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { FaChevronDown } from 'react-icons/fa';
import { __ } from '@wordpress/i18n'; // Import the icon

type Props = {};

const TimeTablePrayerDocLinks = (props: Props) => {
  const [isPrayerTimeOpen, setIsPrayerTimeOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative">
      <button
        onClick={() => setIsPrayerTimeOpen(!isPrayerTimeOpen)}
        className={`w-full text-left p-3 mb-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-between text-gray-700 ${
          location.pathname.includes('prayertime') ? 'relative' : ''
        }`}
      >
        {location.pathname.includes('timetable') && (
          <span className="absolute top-1 left-[14px] w-3 h-3 bg-green-500 rounded-full"></span>
        )}
        <span className="ml-4">{__('TimeTable Prayer', 'fiveprayer')}</span>
        <FaChevronDown
          className={`transition-transform ${
            isPrayerTimeOpen ? 'transform rotate-180' : ''
          }`}
        />
      </button>

      {/* Submenu with smoother Tailwind CSS transition */}
      <div
        className={`overflow-hidden px-2 py-1 transition-all duration-300 ease-in-out ${
          isPrayerTimeOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-4">
          <NavLink
            to="timetable/shortcodes"
            className={({ isActive }) =>
              `block p-2 mb-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-sm text-gray-600 ${
                isActive ? 'bg-gray-100 text-gray-900' : ''
              }`
            }
          >{__('Shortcodes', 'fiveprayer')}</NavLink>
          {/* <NavLink
            to="timetable/blocks" // Submenu item 2
            className={({ isActive }) =>
              `block p-2 mb-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 text-sm ${
                isActive ? 'bg-gray-700' : ''
              }`
            }
          >
            Blocks
          </NavLink> */}
        </div>
      </div>
    </div>
  );
};

export default TimeTablePrayerDocLinks;

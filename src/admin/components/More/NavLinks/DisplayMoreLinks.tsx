/**
 * DisplayMoreLinks
 *
 * Collapsible sidebar navigation for display settings.
 *
 * @module More/NavLinks/DisplayMoreLinks
 */
import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { FaChevronDown } from 'react-icons/fa';
import { __ } from '@wordpress/i18n';

const DisplayMoreLinks = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const isActive = location.pathname.includes('displaysettings');

  return (
    <div className="mb-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3 py-2 text-sm font-semibold rounded-lg flex items-center justify-between transition-colors duration-150 focus:outline-hidden focus:shadow-none ${
          isActive
            ? 'text-green-800 bg-green-200'
            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
        }`}
      >
        <span>{__('Display Settings', 'fiveprayer')}</span>
        <FaChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-fit opacity-100 mt-1' : 'max-h-0 opacity-0'
        }`}
      >
        <NavLink
          to="displaysettings"
          className={({ isActive }) =>
            `block ml-3 px-3 py-1.5 text-sm rounded-md transition-colors duration-150 focus:outline-hidden focus:shadow-none ${
              isActive
                ? 'text-green-800 bg-green-100 font-medium'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`
          }
        >{__('Table Display', 'fiveprayer')}</NavLink>
      </div>
    </div>
  );
};

export default DisplayMoreLinks;

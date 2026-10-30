/**
 * TranslateMoreLinks
 *
 * Collapsible sidebar navigation for translation settings. The group label
 * links to the Translate overview page while the chevron toggles the section
 * list, so the landing page is reachable straight from the sidebar.
 *
 * @module More/NavLinks/TranslateMoreLinks
 */
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { FaChevronDown, FaLanguage } from 'react-icons/fa';
import { __ } from '@wordpress/i18n';
import { TRANSLATE_SECTIONS } from '../translates/translateSections';

const TRANSLATE_INDEX_PATH = '/moresettings/translate';

const TranslateMoreLinks = () => {
  const location = useLocation();
  const isActive = location.pathname.includes('/translate');
  const [isOpen, setIsOpen] = useState(isActive);

  // Keep the group open while the user is inside a translate route.
  useEffect(() => {
    if (isActive) {
      setIsOpen(true);
    }
  }, [isActive]);

  return (
    <div className="mb-1">
      <div
        className={`flex items-center rounded-lg transition-colors duration-150 ${
          isActive ? 'bg-emerald-50' : 'hover:bg-gray-100'
        }`}
      >
        <NavLink
          to={TRANSLATE_INDEX_PATH}
          end
          className={({ isActive: linkActive }) =>
            `flex flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors duration-150 focus:outline-hidden focus:shadow-none ${
              linkActive || isActive ? 'text-emerald-700' : 'text-gray-600 hover:text-gray-900'
            }`
          }
        >
          <FaLanguage className="h-4 w-4 opacity-80" />
          <span>{__('Translate', 'fiveprayer')}</span>
        </NavLink>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-label={__('Toggle translation sections', 'fiveprayer')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:text-gray-700 focus:outline-hidden focus:shadow-none"
        >
          <FaChevronDown
            className={`h-3 w-3 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'mt-1 max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-4 space-y-0.5 border-l border-gray-200 pl-2">
          {TRANSLATE_SECTIONS.map(({ key, path, label, icon }) => (
            <NavLink
              key={key}
              to={path}
              className={({ isActive: linkActive }) =>
                `flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors duration-150 focus:outline-hidden focus:shadow-none ${
                  linkActive
                    ? 'bg-emerald-100 font-medium text-emerald-800'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`
              }
            >
              <span className="text-[11px] opacity-70">{icon}</span>
              {label}
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TranslateMoreLinks;

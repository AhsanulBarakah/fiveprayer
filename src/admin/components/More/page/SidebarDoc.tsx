/**
 * SidebarDoc
 *
 * Sidebar navigation panel for the More section.
 *
 * @module More/page/SidebarDoc
 */
import React from 'react';
import { NavLink, useLocation } from 'react-router';
import TranslateMoreLinks from '../NavLinks/TranslateMoreLinks';
import DisplayMoreLinks from '../NavLinks/DisplayMoreLinks';
import { __ } from '@wordpress/i18n';

const SidebarDoc = () => {
  const location = useLocation();

  return (
    <div className="w-60 shrink-0 bg-gray-50 border-r border-gray-200 p-4 space-y-1">
      {/* Header */}
      <NavLink
        to="/moresettings"
        className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-green-700 rounded-lg hover:text-blue-400 transition-colors focus:outline-hidden"
        style={{ outline: 'none', boxShadow: 'none' }}
      >{__('The More Settings', 'fiveprayer')}</NavLink>

      {/* Divider */}
      <div className="h-px bg-gray-200 my-2" />

      {/* Menu Title */}
      <div className="text-2xl font-bold mb-6">{__('Menu', 'fiveprayer')}</div>

      {/* Nav groups. Advanced Schedules is no longer here — it is a feature
          category in Configure Settings (Feature Switches → Advanced
          Schedules). */}
      <DisplayMoreLinks />
      <TranslateMoreLinks />
    </div>
  );
};

export default SidebarDoc;

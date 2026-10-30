import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router';
import TimeTablePrayerDocLinks from '../NavLinks/PrayerTimeDocLinks';
import SinglePrayerDocLinks from '../NavLinks/SinglePrayerDocLinks';
import { apiDocSections } from '../apiDocSections';
import { apiSecurityDocSections } from '../apiSecurityDocSections';
import { __ } from '@wordpress/i18n';

interface SidebarDocProps {
  contentRef?: React.RefObject<HTMLDivElement | null>;
}

const SidebarDoc: React.FC<SidebarDocProps> = ({ contentRef }) => {
  const location = useLocation();
  const isDocumentationPage = location.pathname === '/documentation';
  const isApiDocPage = location.pathname === '/documentation/api';
  const isApiSecurityDocPage = location.pathname === '/documentation/apisecurity';

  // Track which API section is active via IntersectionObserver
  const [activeApiSection, setActiveApiSection] = useState('quick-start');
  const activeButtonRef = useRef<HTMLButtonElement | null>(null);
  const isManualScrollRef = useRef(false);

  // Scroll the active sidebar item into view whenever it changes
  useEffect(() => {
    if (activeButtonRef.current) {
      activeButtonRef.current.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
  }, [activeApiSection]);

  useEffect(() => {
    if (!isApiDocPage && !isApiSecurityDocPage) return;

    const sections = isApiDocPage ? apiDocSections : apiSecurityDocSections;

    const container = contentRef?.current;
    if (!container) return;

    const updateActiveSection = () => {
      if (isManualScrollRef.current) return;

      const containerTop = container.getBoundingClientRect().top;
      const threshold = containerTop + container.clientHeight * 0.2;

      let currentId = sections[0]?.id ?? '';
      let minDistance = Infinity;

      for (const { id } of sections) {
        const el = document.getElementById(id);
        if (!el) continue;

        const rect = el.getBoundingClientRect();
        const elTop = rect.top;
        const distance = threshold - elTop;

        if (distance >= 0 && distance < minDistance) {
          minDistance = distance;
          currentId = id;
        }
      }

      if (currentId) {
        setActiveApiSection(currentId);
      }
    };

    // Throttle scroll handler to ~60fps
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    };

    updateActiveSection();
    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [isApiDocPage, isApiSecurityDocPage, contentRef]);

  const scrollToSection = (id: string) => {
    // Immediately show the clicked section as active
    setActiveApiSection(id);
    const el = document.getElementById(id);
    if (el) {
      isManualScrollRef.current = true;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Re-enable observer after smooth scroll finishes (~500ms)
      window.setTimeout(() => {
        isManualScrollRef.current = false;
      }, 500);
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 p-5 pb-20 shrink-0 sticky top-0 overflow-y-auto sidebar-scroll" style={{ height: 'calc(100vh - 52px)' }}>
        <style>{`
          .sidebar-scroll { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
          .sidebar-scroll::-webkit-scrollbar { width: 4px; }
          .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
          .sidebar-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 8px; }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        `}</style>

        {/* Logo */}
        <div className="mb-6">
          <NavLink to="/documentation" className="flex items-center gap-1 no-underline">
            <span className="text-green-500 text-xl font-thin italic">{__('Five', 'fiveprayer')}</span>
            <span className="text-xl font-bold text-green-600">{__('Prayer', 'fiveprayer')}</span>
          </NavLink>
        </div>

        {/* Menu Links */}
        <div className="space-y-0.5">
          <SinglePrayerDocLinks />
          <TimeTablePrayerDocLinks />
        </div>

        {/* Configure Settings Link */}
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-2 px-3">{__('Settings & Schedules', 'fiveprayer')}</p>
          <nav className="space-y-1">
            <NavLink
              to="/documentation/calculationsettings"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('🕌 Configure Settings', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/displaysettings"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('🖥️ Display Settings', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/tvdisplay"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('📺 TV Display Mode', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/mosquetv"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('🕌 Mosque TV Display', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/localtesting"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('📺 Share on Local Network', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/localtesting-troubleshooting"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('🛠️ Share on Local Network — Issues & Fixes', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/customtimeschedules"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('📅 Custom Time Schedules', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/nextprayercountdown"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('⏳ Next Prayer Countdown', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/prayerhighlight"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('🎯 Highlight Next Prayer', 'fiveprayer')}</NavLink>
            <NavLink
              to="/documentation/cssvariables"
              className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
            >{__('🎨 Theme with CSS Variables', 'fiveprayer')}</NavLink>

            {/* API Documentation - with nested section links when active */}
            <div>
              <NavLink
                to="/documentation/api"
                className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`
              }
              >{__('🔑 API Documentation', 'fiveprayer')}</NavLink>

              {/* Section links - shown only when on the API doc page */}
              {isApiDocPage && (
                <nav className="mt-1 ml-2 space-y-0.5 border-l-2 border-green-300 pl-3">
                  {apiDocSections.map(({ id, label }) => (
                    <button
                      key={id}
                      ref={activeApiSection === id ? activeButtonRef : undefined}
                      onClick={() => scrollToSection(id)}
                      aria-current={activeApiSection === id ? 'location' : undefined}
                      className={ `block w-full text-left py-1.5 px-3 rounded-sm text-sm transition ${
                        activeApiSection === id
                          ? 'bg-green-50 text-green-700 border-l-2 border-green-500 -ml-[14px] pl-3 font-medium'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              )}

              {/* API Security Link */}
              <NavLink
                to="/documentation/apisecurity"
                className={({ isActive }) =>
                `block py-2 px-4 rounded-sm text-sm transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >{__('🔒 API Security', 'fiveprayer')}</NavLink>

              {/* Section links - shown only when on the API Security doc page */}
              {isApiSecurityDocPage && (
                <nav className="mt-1 ml-2 space-y-0.5 border-l-2 border-green-300 pl-3">
                  {apiSecurityDocSections.map(({ id, label }) => (
                    <button
                      key={id}
                      ref={activeApiSection === id ? activeButtonRef : undefined}
                      onClick={() => scrollToSection(id)}
                      aria-current={activeApiSection === id ? 'location' : undefined}
                      className={ `block w-full text-left py-1.5 px-3 rounded-sm text-sm transition ${
                        activeApiSection === id
                          ? 'bg-green-50 text-green-700 border-l-2 border-green-500 -ml-[14px] pl-3 font-medium'
                          : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default SidebarDoc;

/**
 * Navigation Bar Component
 *
 * Top-level navigation bar for the FivePrayer admin React app.
 * Responsive: horizontal links on wide screens (≥1310px), hamburger menu on narrow.
 * Breakpoint matches PrayerSettingsList (1310px) for consistent layout behavior.
 *
 * @module header/NavBar
 */
import React from 'react';
import { NavLink } from 'react-router';
import { __ } from '@wordpress/i18n';

const BREAKPOINT = 1310;

const NavBar = () => {
  const [isWide, setIsWide] = React.useState(
    typeof window !== 'undefined' ? window.innerWidth >= BREAKPOINT : true
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setIsWide(window.innerWidth >= BREAKPOINT);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close mobile menu when switching to desktop
  React.useEffect(() => {
    if (isWide) setMobileOpen(false);
  }, [isWide]);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-roboto text-base py-4 px-1 relative focus:outline-hidden focus:shadow-none transition-colors duration-200 ${
      isActive
        ? 'text-green-600 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:bg-green-600 after:rounded-t'
        : 'text-gray-700 hover:text-green-600'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-3 px-4 text-sm font-medium transition-colors rounded-lg ${
      isActive
        ? 'text-green-600 bg-green-50'
        : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
    }`;

  const closeMobile = () => setMobileOpen(false);

  const logo = (
    <li className="relative m-0 flex mr-4 list-none">
      <p className="text-green-500 text-2xl font-roboto font-thin italic">{__('Five', 'fiveprayer')}</p>
      <p className="text-2xl font-roboto font-bold text-green-600">{__('Prayer', 'fiveprayer')}</p>
    </li>
  );

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="flex items-center h-[52px] px-4 md:px-5">
        {logo}

        {isWide ? (
          <div className="flex items-center gap-6 flex-1">
            <NavLink className={navLinkClass} to="/" end>{__('Welcome', 'fiveprayer')}</NavLink>
            <NavLink className={navLinkClass} to="/prayersettings" end>{__('Prayer Settings', 'fiveprayer')}</NavLink>
            <NavLink className={navLinkClass} to="/hijra">{__('Hijra Calendar', 'fiveprayer')}</NavLink>
            <NavLink className={navLinkClass} to="/customizing">{__('Customizing', 'fiveprayer')}</NavLink>
            <NavLink className={navLinkClass} to="/moresettings">{__('More Settings', 'fiveprayer')}</NavLink>
            <div className="ml-auto mr-3">
              <NavLink className={navLinkClass} to="/documentation">
                <span className="flex items-center gap-1.5">{__('Docs', 'fiveprayer')}<span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                </span>
              </NavLink>
            </div>
          </div>
        ) : (
          <div className="ml-auto">
            <button
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? __('Close menu', 'fiveprayer') : __('Open menu', 'fiveprayer')}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Mobile dropdown menu */}
      {!isWide && mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-3 pb-3">
          <div className="flex flex-col gap-1 pt-2">
            <NavLink className={mobileNavLinkClass} to="/" end onClick={closeMobile}>{__('Welcome', 'fiveprayer')}</NavLink>
            <NavLink className={mobileNavLinkClass} to="/prayersettings" end onClick={closeMobile}>{__('Prayer Settings', 'fiveprayer')}</NavLink>
            <NavLink className={mobileNavLinkClass} to="/hijra" onClick={closeMobile}>{__('Hijra Calendar', 'fiveprayer')}</NavLink>
            <NavLink className={mobileNavLinkClass} to="/customizing" onClick={closeMobile}>{__('Customizing', 'fiveprayer')}</NavLink>
            <NavLink className={mobileNavLinkClass} to="/moresettings" onClick={closeMobile}>{__('More Settings', 'fiveprayer')}</NavLink>
            <NavLink className={mobileNavLinkClass} to="/documentation" onClick={closeMobile}>
              <span className="flex items-center gap-1.5">{__('Docs', 'fiveprayer')}<span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
              </span>
            </NavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;

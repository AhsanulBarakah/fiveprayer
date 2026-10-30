import { NavLink } from 'react-router';
import { __ } from '@wordpress/i18n';

const CustomizeBar = () => {
  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `font-roboto text-sm py-2.5 px-3 relative focus:outline-hidden focus:shadow-none transition-colors duration-200 block ${
      isActive
        ? 'text-green-600 after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[3px] after:bg-green-600 after:rounded-t'
        : 'text-gray-700 hover:text-green-600'
    }`;

  return (
    <nav className="border-b border-gray-200">
      <ul className="pl-3 flex items-center h-[42px] gap-6">
        <li className="relative m-0 flex items-center">
          <NavLink className={tabClass} to={'timetable'} end>{__('TimeTable', 'fiveprayer')}</NavLink>
        </li>
        <li className="relative m-0 flex items-center">
          <NavLink className={tabClass} to={'printerpage'}>{__('PrinterPage', 'fiveprayer')}</NavLink>
        </li>
        <li className="relative m-0 flex items-center">
          <NavLink className={tabClass} to={'location'}>{__('Location', 'fiveprayer')}</NavLink>
        </li>
        <li className="relative m-0 flex items-center">
          <NavLink className={tabClass} to={'settings'}>{__('Configure Settings', 'fiveprayer')}</NavLink>
        </li>
        <li className="relative m-0 flex items-center">
          <NavLink className={tabClass} to={'layout'}>{__('Layout', 'fiveprayer')}</NavLink>
        </li>
      </ul>
    </nav>
  );
};

export default CustomizeBar;

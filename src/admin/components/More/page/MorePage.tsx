/**
 * MorePage
 *
 * Layout shell for the More section with sidebar and router outlet.
 *
 * @module More/page/MorePage
 */
import { Outlet } from 'react-router';
import SidebarDoc from './SidebarDoc';

type Props = {}

const MorePage = (props: Props) => {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <SidebarDoc />
      <div className="flex-1 p-6">
        <Outlet /> 
      </div>
    </div>
  );
}

export default MorePage;

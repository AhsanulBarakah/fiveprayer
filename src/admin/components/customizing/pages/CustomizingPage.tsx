/**
 * CustomizingPage
 *
 * Layout wrapper for the customizing section with CustomizeBar header and router outlet.
 *
 * @module customizing/pages/CustomizingPage
 */
import * as React from "react"
import CustomizeBar from '../../header/CustomizeBar';
import { Outlet } from 'react-router';

const CustomizingPage = () => {
	return (
		<div className=" w-full pl-1">
			<CustomizeBar />
			<Outlet />
		</div>
	);
};

export default CustomizingPage;

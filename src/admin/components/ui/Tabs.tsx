/**
 * Tabs UI Components
 *
 * Simple wrapper components for tab-based layouts. Each component renders
 * its children in a div with optional className/style, or returns children
 * directly if no styling is needed.
 *
 * @module ui/Tabs
 */
import React from 'react';

type Props = {
	children?: React.ReactNode;
	style?: React.CSSProperties;
	className?: string;
};

/** Helper to wrap children in a styled div or return them bare */
const wrap = ({ children, className, style }: Props) =>
	className || style ? (
		<div className={className} style={style}>{children}</div>
	) : (
		<>{children}</>
	);

export const Tabs = (props: Props) => wrap(props);
export const TabList = (props: Props) => wrap(props);
export const Tab = (props: Props) => wrap(props);
export const TabPanels = (props: Props) => wrap(props);
export const TabPanel = (props: Props) => wrap(props);

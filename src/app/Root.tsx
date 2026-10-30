/**
 * App Root Component
 *
 * Top-level layout component for the FivePrayer admin React app.
 * Renders the navigation bar, page outlet (via react-router), and toast notifications.
 * Triggers initial data loading on mount via `useEffect`.
 *
 * @module app/Root
 */
import * as React from 'react';
import { Outlet } from 'react-router';
import NavBar from '../admin/components/header/NavBar';
import { Toaster } from 'sonner';
import { useRefreshMetaData } from '../admin/hooks/useRefreshMetaData';
import { useGetTimeTableYear } from '../admin/hooks/useGetTimeTableYear';
import { useTranslationStore } from '../admin/state/useTranslationStore';

export default function Root() {
	const { getPrayerSettingMeta } = useRefreshMetaData();
	const { reFreshTimeTableYear } = useGetTimeTableYear();
	const { fetchTranslations } = useTranslationStore();

	/** Load all settings, timetable data, and translations on first mount */
	React.useEffect(() => {
		getPrayerSettingMeta();
		reFreshTimeTableYear();
		fetchTranslations();
	}, []);
	
	return (
		<div className="fiveprayer">
			<NavBar />
			<Outlet />
			<Toaster
				richColors
				position="top-right"
				className="mt-4 z-50"
			/>
		</div>
	);
}

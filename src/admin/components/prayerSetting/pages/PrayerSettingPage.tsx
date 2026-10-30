/**
 * Prayer Settings Page
 *
 * Main page for configuring prayer times settings. Renders the settings
 * dropdowns (month, location, calculation method) and the calendar preview.
 *
 * @module prayerSetting/pages/PrayerSettingPage
 */
import * as React from "react"
import PrayerCalendar from '../PrayerCalendar';
import PrayerSettingsList from '../PrayerSettingsList';

const PrayerPage = () => {
	return (
		<div className="max-w-[1600px] mx-auto p-4 space-y-6">
			<PrayerSettingsList />
			<PrayerCalendar show={false} />
		</div>
	);
};

export default PrayerPage;

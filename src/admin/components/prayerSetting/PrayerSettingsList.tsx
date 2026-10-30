/**
 * PrayerSettingsList
 *
 * Responsive layout composing IqamaDelay, PrayerSettings, and TunePrayer.
 *
 * @module prayerSetting/PrayerSettingsList
 */
import React from 'react';
import IqamaDelay from './IqamaDelay';
import PrayerSettings from './PrayerSettings';
import TunePrayer from './TunePrayer';

const PrayerSettingsList = () => {
	const [isWide, setIsWide] = React.useState(window.innerWidth >= 1310);

	React.useEffect(() => {
		const handler = () => setIsWide(window.innerWidth >= 1310);
		window.addEventListener('resize', handler);
		return () => window.removeEventListener('resize', handler);
	}, []);

	return (
		<div className={`grid gap-3 ${isWide ? 'grid-cols-[5fr_3fr_2fr]' : 'grid-cols-1'}`}>
			<PrayerSettings />
			<TunePrayer />
			<IqamaDelay />
		</div>
	);
};

export default PrayerSettingsList;

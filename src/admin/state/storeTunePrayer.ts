import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type State = {
	Generate: string;
	Imsak: string;
	Fajr: string;
	Sunrise: string;
	Dhuhr: string;
	Asr: string;
	Sunset: string;
	Maghrib: string;
	Isha: string;
	Midnight: string;
};

type Action = {
	GenerateClick: ( Generate: State[ 'Generate' ] ) => void;
	Imsak_selected: ( Imsak: State[ 'Imsak' ] ) => void;
	Fajr_selected: ( Fajr: State[ 'Fajr' ] ) => void;
	Sunrise_selected: ( Sunrise: State[ 'Sunrise' ] ) => void;
	Dhuhr_selected: ( Dhuhr: State[ 'Dhuhr' ] ) => void;
	Asr_selected: ( Asr: State[ 'Asr' ] ) => void;
	Sunset_selected: ( Sunset: State[ 'Sunset' ] ) => void;
	Maghrib_selected: ( Maghrib: State[ 'Maghrib' ] ) => void;
	Isha_selected: ( Isha: State[ 'Isha' ] ) => void;
	Midnight_selected: ( Midnight: State[ 'Midnight' ] ) => void;
	updateImsak: ( Imsak: State[ 'Imsak' ] ) => void;
	updateFajr: ( Fajr: State[ 'Fajr' ] ) => void;
	updateSunrise: ( Sunrise: State[ 'Sunrise' ] ) => void;
	updateDhuhr: ( Dhuhr: State[ 'Dhuhr' ] ) => void;
	updateAsr: ( Asr: State[ 'Asr' ] ) => void;
	updateSunset: ( Sunset: State[ 'Sunset' ] ) => void;
	updateMaghrib: ( Maghrib: State[ 'Maghrib' ] ) => void;
	updateIsha: ( Isha: State[ 'Isha' ] ) => void;
	updateMidnight: ( Midnight: State[ 'Midnight' ] ) => void;
};

export const useTuneStore = create< State & Action >()(
	devtools(
		persist(
			( set ) => ( {
				Generate: 'yes',
				Imsak: '0',
				Fajr: '0',
				Sunrise: '0',
				Dhuhr: '0',
				Asr: '0',
				Sunset: '0',
				Maghrib: '0',
				Isha: '0',
				Midnight: '0',
				GenerateClick: ( Generate ) => set( () => ( { Generate: Generate } ) ),
				Imsak_selected: ( Imsak ) => set( () => ( { Imsak: Imsak } ) ),
				Fajr_selected: ( Fajr ) => set( () => ( { Fajr: Fajr } ) ),
				Sunrise_selected: ( Sunrise ) => set( () => ( { Sunrise: Sunrise } ) ),
				Dhuhr_selected: ( Dhuhr ) => set( () => ( { Dhuhr: Dhuhr } ) ),
				Asr_selected: ( Asr ) => set( () => ( { Asr: Asr } ) ),
				Sunset_selected: ( Sunset ) => set( () => ( { Sunset: Sunset } ) ),
				Maghrib_selected: ( Maghrib ) => set( () => ( { Maghrib: Maghrib } ) ),
				Isha_selected: ( Isha ) => set( () => ( { Isha: Isha } ) ),
				Midnight_selected: ( Midnight ) => set( () => ( { Midnight: Midnight } ) ),
				updateImsak: ( Imsak ) => set( () => ( { Imsak: Imsak } ) ),
				updateFajr: ( Fajr ) => set( () => ( { Fajr: Fajr } ) ),
				updateSunrise: ( Sunrise ) => set( () => ( { Sunrise: Sunrise } ) ),
				updateDhuhr: ( Dhuhr ) => set( () => ( { Dhuhr: Dhuhr } ) ),
				updateAsr: ( Asr ) => set( () => ( { Asr: Asr } ) ),
				updateSunset: ( Sunset ) => set( () => ( { Sunset: Sunset } ) ),
				updateMaghrib: ( Maghrib ) => set( () => ( { Maghrib: Maghrib } ) ),
				updateIsha: ( Isha ) => set( () => ( { Isha: Isha } ) ),
				updateMidnight: ( Midnight ) => set( () => ( { Midnight: Midnight } ) ),
			} ),
			{ name: 'storeTunePrayer', storage: { getItem: (name) => { const v = sessionStorage.getItem(name); return v ? JSON.parse(v) : null; }, setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)), removeItem: (name) => sessionStorage.removeItem(name) } }
		),
		{ name: 'storeTunePrayer' }
	)
);

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

type State = {
	IQFajr: string;
	IQDhuhr: string;
	IQAsr: string;
	IQMaghrib: string;
	IQIsha: string;
};

type Action = {
	IQFajr_selected: ( IQFajr: State[ 'IQFajr' ] ) => void;
	IQDhuhr_selected: ( IQDhuhr: State[ 'IQDhuhr' ] ) => void;
	IQAsr_selected: ( IQAsr: State[ 'IQAsr' ] ) => void;
	IQMaghrib_selected: ( IQMaghrib: State[ 'IQMaghrib' ] ) => void;
	IQIsha_selected: ( IQIsha: State[ 'IQIsha' ] ) => void;
	updateIQFajr: ( IQFajr: State[ 'IQFajr' ] ) => void;
	updateIQDhuhr: ( IQDhuhr: State[ 'IQDhuhr' ] ) => void;
	updateIQAsr: ( IQAsr: State[ 'IQAsr' ] ) => void;
	updateIQMaghrib: ( IQMaghrib: State[ 'IQMaghrib' ] ) => void;
	updateIQIsha: ( IQIsha: State[ 'IQIsha' ] ) => void;
};

export const useIqamaStore = create< State & Action >()(
	devtools(
		persist(
			( set ) => ( {
				IQFajr: '0',
				IQDhuhr: '0',
				IQAsr: '0',
				IQMaghrib: '0',
				IQIsha: '0',

				IQFajr_selected: ( IQFajr ) => set( () => ( { IQFajr: IQFajr } ) ),
				IQDhuhr_selected: ( IQDhuhr ) => set( () => ( { IQDhuhr: IQDhuhr } ) ),
				IQAsr_selected: ( IQAsr ) => set( () => ( { IQAsr: IQAsr } ) ),
				IQMaghrib_selected: ( IQMaghrib ) => set( () => ( { IQMaghrib: IQMaghrib } ) ),
				IQIsha_selected: ( IQIsha ) => set( () => ( { IQIsha: IQIsha } ) ),
				updateIQFajr: ( IQFajr ) => set( () => ( { IQFajr: IQFajr } ) ),
				updateIQDhuhr: ( IQDhuhr ) => set( () => ( { IQDhuhr: IQDhuhr } ) ),
				updateIQAsr: ( IQAsr ) => set( () => ( { IQAsr: IQAsr } ) ),
				updateIQMaghrib: ( IQMaghrib ) => set( () => ( { IQMaghrib: IQMaghrib } ) ),
				updateIQIsha: ( IQIsha ) => set( () => ( { IQIsha: IQIsha } ) ),
			} ),
			{ name: 'storeIqamaDelay', storage: { getItem: (name) => { const v = sessionStorage.getItem(name); return v ? JSON.parse(v) : null; }, setItem: (name, value) => sessionStorage.setItem(name, JSON.stringify(value)), removeItem: (name) => sessionStorage.removeItem(name) } }
		),
		{ name: 'storeIqamaDelay' }
	)
);

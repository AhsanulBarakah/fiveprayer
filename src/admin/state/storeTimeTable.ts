import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
type State = {
	isActive: boolean;
	lan?:string;
	calenderType?:string;
	TimeTableMonthFullYear: string[];
	HijraLocale: {
		isActive: boolean;
		lan?:string;
		calenderType?:string;
		customLan?:boolean;
	}
};
type Action = {
	updateISActive: ( isActive: State[ 'isActive' ] ) => void;
	updateTimeTableFullYear: ( TimeTableMonthFullYear: State[ 'TimeTableMonthFullYear' ] ) => void;
	updateHijraLocale: ( HijraLocale: State[ 'HijraLocale' ] ) => void;
	updateHijraLan: ( lan: State[ 'lan' ] ) => void;
	updateHijraCalenderType: ( calenderType: State[ 'calenderType' ] ) => void;
};
const sessionStorageAdapter = {
	getItem: (name: string) => { const v = sessionStorage.getItem(name); return v ? JSON.parse(v) : null; },
	setItem: (name: string, value: any) => sessionStorage.setItem(name, JSON.stringify(value)),
	removeItem: (name: string) => sessionStorage.removeItem(name),
};
export const useTimeTableMonth = create< State & Action >()(
	devtools(
		persist(
			( set ) =>  ( {
				isActive: false,
				lan:"",
				calenderType:"",

				TimeTableMonthFullYear: [],

				HijraLocale: {
					isActive: false,
					lan:"",
					calenderType:"",
					customLan:false
				},

				updateISActive: ( isActive ) =>
					set( () => ( { isActive: isActive } ) ),
				
				updateTimeTableFullYear: ( TimeTableMonthFullYear ) =>
					set( () => ( { TimeTableMonthFullYear: TimeTableMonthFullYear } ) ),

				updateHijraLocale: ( HijraLocale ) =>
					set( () => ( { HijraLocale: HijraLocale } ) ),
				updateHijraLan: ( lan ) =>
					set( () => ( { lan: lan } ) ),
				updateHijraCalenderType: ( calenderType  ) =>
					set( () => ( { calenderType : calenderType  } ) ),

			} ),
			{ name: 'storeTimeTable', storage: sessionStorageAdapter }
		),
		{name:"storeTimeTable"} )
);

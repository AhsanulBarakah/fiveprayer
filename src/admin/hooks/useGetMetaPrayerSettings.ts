/**
 * Prayer Settings Meta Loader
 *
 * Maps API meta responses to Zustand store values for prayer settings.
 * Handles month, calculation method, location, and printer display toggles.
 *
 * Called by `useRefreshMetaData` during the initial data load cycle.
 *
 * @module useGetMetaPrayerSettings
 */
import {
	useLocationStore,
	resolveFeatureToggles,
} from '../state/storeLocation';
import { useCustomPrayerTimeSchedulesStore } from '../state/useCustomPrayerTimeSchedulesStore';
import { useDayDisplayStore } from '../state/storeDayDisplay';

/** Safely parse a meta value — handles JSON strings, plain strings, and booleans */
function safeParse(value: unknown): unknown {
	if (typeof value !== 'string') return value;
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

/**
 * Safely parse a boolean meta value from string ('1', '0', 'true', 'false', or
 * JSON booleans). NOTE: do NOT route through safeParse for '1' — JSON.parse('1')
 * returns the NUMBER 1, which fails `=== '1'` (strict) and made every stored
 * `'1'` load back as false (toggles always came back Disabled on refresh).
 */
function safeBool(value: unknown): boolean {
	if (value === true) return true;
	if (value === false) return false;
	const s = String(value).trim().toLowerCase();
	return s === '1' || s === 'true';
}

export const useGetMetaPrayerSettings = () => {
	const updateMonth = useLocationStore( ( state ) => state.updateMonth );
	const mncm_selected = useLocationStore( ( state ) => state.mncm_selected );
	const oaac_selected = useLocationStore( ( state ) => state.oaac_selected );
	const hlm_selected = useLocationStore( ( state ) => state.hlm_selected );
	const mfc_selected = useLocationStore( ( state ) => state.mfc_selected );
	const rounding_selected_select = useLocationStore( ( state ) => state.rounding_selected_select );
	const updateRoundingEnabled = useLocationStore( ( state ) => state.updateRoundingEnabled );
	const smoothing_selected_update = useLocationStore( ( state ) => state.smoothing_selected_update );
	const updateCalendarType = useLocationStore( ( state ) => state.updateCalendarType );
	const updateCalendarDisplay = useLocationStore( ( state ) => state.updateCalendarDisplay );
	const feature_toggles_set = useLocationStore( ( state ) => state.feature_toggles_set );
	const updateFeatureOffDisplay = useLocationStore( ( state ) => state.updateFeatureOffDisplay );
	const updateNextPrayerCountdown = useLocationStore( ( state ) => state.updateNextPrayerCountdown );
	const cl_selected = useLocationStore( ( state ) => state.cl_selected );
	const updateHidePrinterButton = useLocationStore( ( state ) => state.updateHidePrinterButton );
	const updateHideMonthSelection = useLocationStore( ( state ) => state.updateHideMonthSelection );
	const updatePrinterButtonUrl = useLocationStore( ( state ) => state.updatePrinterButtonUrl );
	const updateHideCustomUrlButton = useLocationStore( ( state ) => state.updateHideCustomUrlButton );
	const updateAutoPrintPageUrl = useLocationStore( ( state ) => state.updateAutoPrintPageUrl );

	/**
	 * Turning a feature OFF must also disable everything inside it. On load the
	 * engine-backed flags are derived from the final toggle map so a stored
	 * "OFF" can never leave the behavior half-on (e.g. Rounding feature off
	 * while a legacy `rounding_enabled: '1'` row is still in the database).
	 */
	const forceEngineFlagsFromToggles = ( toggles: Record<string, boolean> ) => {
		if ( toggles?.['Rounding_Method'] === false ) {
			updateRoundingEnabled( false );
		}
		if ( toggles?.['Day_to_day_Smoothing'] === false ) {
			const current = useLocationStore.getState().smoothing_selected;
			smoothing_selected_update( {
				enabled: false,
				maxSeconds: current?.maxSeconds ?? 90,
				mode: current?.mode ?? 'noDrift',
				driftBudget: current?.driftBudget ?? 180,
				manualSteps: current?.manualSteps ?? {},
			} );
		}
		if ( toggles?.['Advanced_Schedules'] === false ) {
			// The custom-schedules meta keeps its own master switch; when the
			// feature is switched off the date-specific overrides must not stay
			// active just because a legacy row still says enabled. The schedules
			// themselves are untouched.
			useCustomPrayerTimeSchedulesStore.getState().setIsCustomSchedulesEnabled( false );
		}
		if ( toggles?.['Unified_Method_Settings'] === false ) {
			const state = useLocationStore.getState();
			const rawMethods = Array.isArray( state.methodsForCalculation )
				? state.methodsForCalculation
				: [];
			const hasUnified = rawMethods.some(
				( m: any ) => String( m?.method || '' ).toLowerCase() === 'unified_method'
			);
			if ( hasUnified ) {
				state.updateMethodsForCalculation(
					rawMethods.map( ( m: any ) =>
						String( m.method || '' ).toLowerCase() === 'unified_method'
							? { ...m, params: { ...( m.params || {} ), enabled: false } }
							: m
					)
				);
			}
		}
	};

	/**
	 * Map a single API meta item to the corresponding store setter.
	 * @param meta - The meta item from the API response with `meta-key` and `value`
	 */
	const GetMetaPrayerSettings = ( meta: { 'meta-key': string; value?: unknown } ) => {
		const key = meta['meta-key'];
		const val = meta.value;

		switch (key) {
			case 'month':
				updateMonth(safeParse(val) as any);
				break;
			case 'mncm_selected':
				mncm_selected(safeParse(val) as any);
				break;
			case 'oaac_selected':
				oaac_selected(safeParse(val) as any);
				break;
			case 'hlm_selected':
				hlm_selected(safeParse(val) as any);
				break;
			case 'mfc_selected':
				mfc_selected(safeParse(val) as any);
				break;
			case 'rounding_selected':
				rounding_selected_select(safeParse(val) as any);
				break;
			case 'rounding_enabled':
				// If the Rounding Method feature is OFF in the Feature Switches the
				// engine flag stays off no matter what a legacy DB row says.
				if ( useLocationStore.getState().feature_toggles?.['Rounding_Method'] !== false ) {
					updateRoundingEnabled(safeBool(val));
				}
				break;
			case 'smoothing_selected':
				smoothing_selected_update(safeParse(val) as any);
				break;
			case 'calendar_type':
				updateCalendarType(String(safeParse(val) || 'gregorian') as any);
				break;
			case 'calendar_display':
				updateCalendarDisplay(String(safeParse(val) || 'span') as any);
				break;
			case 'feature_off_display':
				updateFeatureOffDisplay(
					String( safeParse( val ) || 'hide' ) === 'badge' ? 'badge' : 'hide'
				);
				break;
			case 'next_prayer_countdown': {
				const parsed = ( safeParse( val ) as any ) || {};
				// `unit`/`rounding` were removed: the countdown simply reports the
				// real remaining time. The free text `prefix`/`suffix`/`now_text`
				// are gone too — the connector words come from the Translate system
				// and are only switched on/off here. Read only the keys we still
				// support so an old database row can never re-introduce the
				// removed options.
				const format = [ 'long', 'short', 'clock' ].includes( String( parsed.format ) )
					? parsed.format
					: 'long';
				updateNextPrayerCountdown( {
					format,
					show_prefix: !! parsed.show_prefix,
					show_suffix: !! parsed.show_suffix,
					show_now: !! parsed.show_now,
					show_seconds: !! parsed.show_seconds,
				} );
				break;
			}
			case 'day_display':
				// Global optional "Day" column / day line config. setOptions coerces
				// every field, so a corrupt value can never reach the preview or a
				// later save.
				useDayDisplayStore.getState().setOptions( ( safeParse( val ) as any ) || {} );
				break;
			case 'feature_toggles':
				// resolveFeatureToggles() adopts the current factory defaults for
				// installs still sitting on the old "everything ON" map, fills in
				// the factory default for any switch the stored map does not carry
				// (Next Prayer Countdown ships OFF), and never reverts a switch the
				// user explicitly turned on.
				{
					const toggles = resolveFeatureToggles( safeParse( val ) );
					feature_toggles_set( toggles );
					forceEngineFlagsFromToggles( toggles );
				}
				break;
			case 'location':
				cl_selected(safeParse(val) as any);
				break;
			case 'hide_printer_button':
				updateHidePrinterButton(safeBool(val));
				break;
			case 'hide_month_selection':
				updateHideMonthSelection(safeBool(val));
				break;
			case 'printer_button_url':
				updatePrinterButtonUrl(String(safeParse(val) || ''));
				break;
			case 'hide_custom_url_button':
				updateHideCustomUrlButton(safeBool(val));
				break;
			case 'auto_print_page_url':
				updateAutoPrintPageUrl(String(safeParse(val) || ''));
				break;
		}
	};

	return { GetMetaPrayerSettings };
};

/**
 * UninstallDataCard
 *
 * The "delete all data when the plugin is uninstalled" opt-in, at the bottom of
 * Customizing → Configure Settings.
 *
 * Uninstalling a WordPress plugin removes its files but not the rows it wrote.
 * That is the right default — a delete-and-reinstall keeps the timetable,
 * locations and every setting — so this switch ships off and only an explicit
 * "on" makes uninstall.php drop the plugin's tables, options, transients, cron
 * events and the generated stylesheet in uploads.
 *
 * Saved through admin-ajax (`fp_save_uninstall_data`) using the nonce the PHP
 * side localized into `window.FivePrayerData.uninstallData`. The handler
 * re-checks the `manage_options` capability and the nonce, so this component is
 * only a convenience on top of a permission that already exists.
 *
 * @module prayerSetting/UninstallDataCard
 */
import React from 'react';
import apiFetch from '@wordpress/api-fetch';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';

type UninstallState = NonNullable<(typeof window)['FivePrayerData']>['uninstallData'];

/** Undefined until the localized data loads (or on non-admin screens). */
const readState = (): UninstallState | undefined =>
	typeof window !== 'undefined' ? window.FivePrayerData?.uninstallData : undefined;

const UninstallDataCard: React.FC = () => {
	const localized = readState();

	// Server state is the source of truth; the component only mirrors the last
	// confirmed answer so the switch can move instantly while saving.
	const [ enabled, setEnabled ] = React.useState<boolean>( localized?.enabled === true );
	const [ saving, setSaving ] = React.useState<boolean>( false );

	React.useEffect( () => {
		if ( localized ) {
			setEnabled( localized.enabled === true );
		}
	}, [ localized?.enabled ] );

	const toggle = async () => {
		if ( ! localized ) return;

		const next = ! enabled;
		setSaving( true );
		try {
			// Form-encoded on purpose: admin-ajax reads `$_POST`, and apiFetch
			// would otherwise JSON-encode `data` and leave `$_POST` empty.
			const response: any = await apiFetch( {
				url: window.FivePrayerData?.ajaxUrl || '',
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: localized.ajaxAction,
					nonce: localized.nonce,
					enabled: next ? '1' : '0',
				} ),
			} );

			const saved = response?.data?.enabled ?? response?.enabled;
			const confirmed = typeof saved === 'boolean' ? saved : next;
			setEnabled( confirmed );

			if ( confirmed ) {
				toast.success( __( 'Data will be deleted on uninstall', 'fiveprayer' ), {
					description: __( 'Deleting the plugin will remove its timetable, locations, settings and API keys. This cannot be undone.', 'fiveprayer' ),
					duration: 8000,
				} );
			} else {
				toast.success( __( 'Data is kept on uninstall', 'fiveprayer' ), {
					description: __( 'Deleting the plugin leaves the timetable, locations and settings in the database.', 'fiveprayer' ),
				} );
			}
		} catch {
			setEnabled( ! next );
			toast.error( __( 'The setting could not be saved', 'fiveprayer' ), {
				description: __( 'Reload the page and try again. If it keeps failing, your WordPress user may not have permission to change site settings.', 'fiveprayer' ),
			} );
		} finally {
			setSaving( false );
		}
	};

	if ( ! localized ) return null;

	return (
		<div
			className={ `flex items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-all ${
				enabled ? 'bg-white border-red-200' : 'bg-gray-50 border-gray-200 opacity-80'
			}` }
		>
			<div className="min-w-0">
				<h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
					{ __( 'Delete all data on uninstall', 'fiveprayer' ) }
					<span className="text-[9px] font-semibold uppercase tracking-wide bg-red-100 text-red-700 px-1.5 py-0.5 rounded-sm">
						{ __( 'cannot be undone', 'fiveprayer' ) }
					</span>
				</h3>
				<p className="text-[11px] mt-0.5 text-gray-500">
					{ enabled
						? __( 'Deleting the plugin removes the timetable, locations, settings, API keys, scheduled tasks and the generated stylesheet.', 'fiveprayer' )
						: __( 'Deleting the plugin keeps its data, so reinstalling it restores the timetable and settings. Switch this on only when you are finished with the plugin.', 'fiveprayer' ) }
				</p>
			</div>

			<button
				type="button"
				onClick={ toggle }
				disabled={ saving }
				aria-pressed={ enabled }
				className={ `h-8 px-3 flex items-center gap-2 rounded-lg border text-xs font-medium transition-all focus:outline-hidden shrink-0 disabled:opacity-60 ${
					enabled
						? 'bg-red-50 border-red-300 text-red-700'
						: 'bg-gray-100 border-gray-200 text-gray-500'
				}` }
			>
				<span>{ enabled ? __( 'On', 'fiveprayer' ) : __( 'Off', 'fiveprayer' ) }</span>
				<span className={ `w-7 h-4 rounded-full relative transition-colors ${ enabled ? 'bg-red-500' : 'bg-gray-300' }` }>
					<span
						className={ `absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${ enabled ? 'left-[15px]' : 'left-0.5' }` }
					/>
				</span>
			</button>
		</div>
	);
};

export default UninstallDataCard;

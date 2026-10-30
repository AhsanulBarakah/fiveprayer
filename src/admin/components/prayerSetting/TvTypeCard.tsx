/**
 * TvTypeCard
 *
 * The row of the TV Display Mode page that asks **which screen the display is
 * built for**: a modern TV / monitor, which shows the whole picture, or an older
 * television, which crops a few percent off every edge (overscan).
 *
 * Why it matters. The scaling engine fits the page to the screen, but it cannot
 * know that an older TV hides the outer band: the picture leaving the computer
 * is not the picture the viewer sees. Choosing **Older TV** keeps the design
 * inside the middle of the screen (about 5% clear on every edge), so the
 * cropping never removes content, and it makes the safe-zone guide in the editor
 * mark that same band. **Modern TV** (the default) uses the whole screen and
 * changes nothing about the finished page.
 *
 * Saved through admin-ajax (`fp_save_tv_tv_type`) with the nonce PHP localized
 * into `window.FivePrayerData.tvDisplay`; the server re-checks `manage_options`
 * and the nonce and stores only the two known values, so this card is only a
 * convenience on top of a permission that already exists. It has no effect on a
 * page that is not a display page.
 *
 * @module prayerSetting/TvTypeCard
 */
import React from 'react';
import apiFetch from '@wordpress/api-fetch';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';

type TvDisplayState = NonNullable<(typeof window)['FivePrayerData']>['tvDisplay'];

/** Undefined until the localized data loads (or on non-admin screens). */
const readState = (): TvDisplayState | undefined =>
	typeof window !== 'undefined' ? window.FivePrayerData?.tvDisplay : undefined;

const TvTypeCard: React.FC = () => {
	const localized = readState();
	const choices = localized?.tvTypeChoices ?? [];

	// Server state is the source of truth; the component only mirrors the last
	// confirmed answer so the choice can move instantly while saving.
	const [ value, setValue ] = React.useState<string>( localized?.tvType ?? 'modern' );
	const [ saving, setSaving ] = React.useState<boolean>( false );

	React.useEffect( () => {
		setValue( localized?.tvType ?? 'modern' );
	}, [ localized?.tvType ] );

	const save = async ( next: string ) => {
		if ( ! localized ) return;

		const previous = value;
		setValue( next );
		setSaving( true );

		try {
			// Form-encoded on purpose: admin-ajax reads `$_POST`, and apiFetch
			// would otherwise JSON-encode `data` and leave `$_POST` empty (the
			// nonce check would then always fail).
			const response: any = await apiFetch( {
				url: window.FivePrayerData?.ajaxUrl || '',
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: localized.tvTypeAjaxAction,
					nonce: localized.nonce,
					tv_type: next,
				} ),
			} );

			const data = response?.data ?? response;
			if ( typeof data?.tvType === 'string' && data.tvType ) {
				setValue( data.tvType );
			}

			toast.success( __( 'TV type saved', 'fiveprayer' ), {
				description:
					typeof data?.message === 'string' && data.message
						? data.message
						: __( 'Reload the display page on the TV to see the new fit.', 'fiveprayer' ),
				duration: 8000,
			} );
		} catch {
			setValue( previous );
			toast.error( __( 'The TV type could not be saved', 'fiveprayer' ), {
				description: __(
					'Reload the page and try again. If it keeps failing, your WordPress user may not have permission to change site settings.',
					'fiveprayer'
				),
			} );
		} finally {
			setSaving( false );
		}
	};

	return (
		<div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<div className="min-w-0">
				<h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
					{ __( 'TV type', 'fiveprayer' ) }
					<span className="text-[9px] font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">
						{ __( 'for the TV screen', 'fiveprayer' ) }
					</span>
				</h3>
				<p className="text-[11px] text-gray-500 mt-0.5">
					{ __(
						'Some televisions cut a few percent off every edge (overscan) so the picture leaving your computer is not quite the picture the viewer sees. Pick the screen the display runs on: a modern TV or monitor uses the whole screen, an older TV keeps your design inside the middle so nothing important is cropped.',
						'fiveprayer'
					) }
				</p>
			</div>

			{ ! localized && (
				<p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
					{ __(
						'The saved value could not be read on this screen, so this choice is read-only. Reload the admin page to manage it.',
						'fiveprayer'
					) }
				</p>
			) }

			<div className="mt-3 grid grid-cols-1 gap-2">
				{ choices.map( ( choice ) => {
					const selected = value === choice.value;
					return (
						<label
							key={ choice.value }
							className={ `flex items-start gap-3 p-3 rounded-lg border transition-all ${
								! localized || saving ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
							} ${
								selected
									? 'border-indigo-400 bg-indigo-50 ring-1 ring-indigo-200'
									: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white'
							}` }
						>
							<input
								type="radio"
								name="fiveprayer_tv_type"
								value={ choice.value }
								checked={ selected }
								disabled={ ! localized || saving }
								onChange={ () => void save( choice.value ) }
								className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 mt-0.5"
							/>
							<div className="min-w-0">
								<span className="text-sm font-medium text-gray-900">{ choice.label }</span>
								{ choice.description && (
									<p className="text-[11px] text-gray-500 mt-0.5">{ choice.description }</p>
								) }
							</div>
						</label>
					);
				} ) }
			</div>

			<p className="text-[10px] text-gray-400 mt-2">
				{ __(
					'Older TV also makes the safe-zone guide in the page builder mark the croppable band, and keeps display pages inside the same safe area. Modern TV is the default and leaves the full screen to your design.',
					'fiveprayer'
				) }
			</p>
		</div>
	);
};

export default TvTypeCard;

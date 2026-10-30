/**
 * TvCanvasWidthCard
 *
 * The fourth row of the TV Display Mode page: the **layout width** a display
 * page is laid out at, which is what decides which of your page builder's
 * breakpoints (desktop / tablet / mobile) is used on the TV.
 *
 * Why it has to exist. A page builder picks its design with CSS media queries,
 * and a media query measures the *browser's* viewport. TV Display Mode only
 * scales the finished page (`transform: scale()`), which never changes that
 * viewport — so on a computer or mini PC the desktop design appears, exactly as
 * designed, while a smart-TV browser (which commonly reports ≈980 px, or 960 px
 * on a 1080p screen with a 2× device pixel ratio) makes the builder show its
 * phone or tablet layout. The breakpoint is not ignored; it is measured against
 * a number the user never chose.
 *
 * The one place that can be fixed is the page's `<meta name="viewport">` tag, so
 * that is what this setting writes: PHP adds a single
 * `<meta name="viewport" content="width=<chosen>">` to the display page and the
 * TV browser fits that canvas to the screen itself. Every builder breakpoint
 * then resolves the same way on any screen, and the scaling engine keeps
 * working, because the layout viewport and `window.innerWidth` stay in
 * agreement.
 *
 * **Auto** (the default, and what the option holds as `0`) leaves the page
 * untouched: the TV's own viewport decides, which is the previous behaviour.
 *
 * Saved through admin-ajax (`fp_save_tv_canvas_width`) with the nonce PHP
 * localized into `window.FivePrayerData.tvDisplay`; the server re-checks
 * `manage_options` and the nonce and clamps the value, so this card is only a
 * convenience on top of a permission that already exists. Choosing a width has
 * no effect on any page that is not a display page.
 *
 * @module prayerSetting/TvCanvasWidthCard
 */
import React from 'react';
import { Link } from 'react-router';
import apiFetch from '@wordpress/api-fetch';
import { toast } from 'sonner';
import { __, sprintf } from '@wordpress/i18n';

type TvDisplayState = NonNullable<(typeof window)['FivePrayerData']>['tvDisplay'];

/** Undefined until the localized data loads (or on non-admin screens). */
const readState = (): TvDisplayState | undefined =>
	typeof window !== 'undefined' ? window.FivePrayerData?.tvDisplay : undefined;

/** One entry of a size list, as PHP sends it. Height 0/absent = not set. */
type Preset = { value: number; label: string; height?: number };

/** A named size while it is being typed, before it is saved. */
type DraftRow = { label: string; value: string; height: string };

const TvCanvasWidthCard: React.FC = () => {
	const localized = readState();
	const min = localized?.canvasMin ?? 320;
	const max = localized?.canvasMax ?? 7680;
	const maxRows = localized?.customPresetsMax ?? 12;

	// Server state is the source of truth for both lists; the component only
	// mirrors the last confirmed answer, so a saved size appears in the picker
	// immediately and a reload shows exactly what was stored.
	const [ options, setOptions ] = React.useState<Preset[]>( localized?.canvasPresets ?? [] );
	const [ rows, setRows ] = React.useState<DraftRow[]>(
		( localized?.customPresets ?? [] ).map( ( preset ) => ( {
			label: String( preset.label ),
			value: String( preset.value ),
			height: preset.height ? String( preset.height ) : '',
		} ) )
	);

	// Once the user has touched this list, the localized data is history: it
	// describes the list as it was when the page loaded, so re-applying it would
	// undo a row that was just added or removed. It is only re-applied while the
	// list is still exactly as the page was served — which is what keeps a late
	// injection of the localized data from leaving the editor empty.
	const touched = React.useRef<boolean>( false );

	React.useEffect( () => {
		if ( touched.current ) return;

		setOptions( localized?.canvasPresets ?? [] );
		setRows(
			( localized?.customPresets ?? [] ).map( ( preset ) => ( {
				label: String( preset.label ),
				value: String( preset.value ),
				height: preset.height ? String( preset.height ) : '',
			} ) )
		);
	}, [ localized?.canvasPresets, localized?.customPresets ] );

	const presetFor = React.useCallback(
		( value: number ): boolean => options.some( ( preset ) => Number( preset.value ) === value ),
		[ options ]
	);

	// Server state is the source of truth; the component only mirrors the last
	// confirmed answer so the list can move instantly while saving.
	const [ width, setWidth ] = React.useState<number>( localized?.canvasWidth ?? 0 );
	const [ saving, setSaving ] = React.useState<boolean>( false );

	React.useEffect( () => {
		setWidth( localized?.canvasWidth ?? 0 );
	}, [ localized?.canvasWidth ] );

	const save = async ( next: string ) => {
		if ( ! localized ) return;

		const previous = width;
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
					action: localized.canvasAjaxAction,
					nonce: localized.nonce,
					width: next,
				} ),
			} );

			const data = response?.data ?? response;
			const confirmed = typeof data?.width === 'number' ? data.width : Number( next ) || 0;

			setWidth( confirmed );

			toast.success( __( 'Layout width saved', 'fiveprayer' ), {
				description:
					typeof data?.message === 'string' && data.message
						? data.message
						: __( 'Open the display page on the TV again to see it at the new width.', 'fiveprayer' ),
				duration: 7000,
			} );
		} catch {
			setWidth( previous );
			toast.error( __( 'The layout width could not be saved', 'fiveprayer' ), {
				description: __(
					'Reload the page and try again. If it keeps failing, your WordPress user may not have permission to change site settings.',
					'fiveprayer'
				),
			} );
		} finally {
			setSaving( false );
		}
	};

	// --- The site's own named sizes -------------------------------------

	const [ savingRows, setSavingRows ] = React.useState<boolean>( false );

	const addRow = () => {
		touched.current = true;

		if ( rows.length >= maxRows ) {
			toast.error( __( 'No more sizes can be added', 'fiveprayer' ), {
				description: __(
					'Remove one first: the list is capped so the pickers stay readable.',
					'fiveprayer'
				),
			} );
			return;
		}

		setRows( [ ...rows, { label: '', value: '', height: '' } ] );
	};

	const updateRow = ( index: number, patch: Partial<DraftRow> ) => {
		touched.current = true;
		setRows( rows.map( ( row, i ) => ( i === index ? { ...row, ...patch } : row ) ) );
	};

	/**
	 * Save one list of sizes and mirror exactly what the server kept.
	 *
	 * Shared by “Save sizes” and by Remove. Removing has to persist on the spot:
	 * this list is what every page editor offers, so a row that only disappeared
	 * from this screen would still be offered everywhere else — and would come
	 * back here on the next load, which reads as “remove does nothing”.
	 *
	 * @param next       The rows to store, in the order they should be offered.
	 * @param title      Toast title for a successful save.
	 * @param serverText Use the message the server sent instead of a fixed line.
	 * @return True when the list was stored.
	 */
	const persistRows = async (
		next: DraftRow[],
		title: string,
		serverText = false
	): Promise<boolean> => {
		if ( ! localized ) return false;

		setSavingRows( true );

		try {
			// Two parallel lists, in the order the rows are shown. Form-encoded for
			// the same reason as every other save here: admin-ajax reads `$_POST`.
			const body = new URLSearchParams();
			body.append( 'action', localized.customPresetsAjaxAction );
			body.append( 'nonce', localized.nonce );
			next.forEach( ( row ) => {
				body.append( 'names[]', row.label );
				body.append( 'widths[]', row.value );
				body.append( 'heights[]', row.height );
			} );

			const response: any = await apiFetch( {
				url: window.FivePrayerData?.ajaxUrl || '',
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body,
			} );

			const data = response?.data ?? response;
			const saved: Preset[] = Array.isArray( data?.presets ) ? data.presets : [];

			// What came back is what was stored: a row the server dropped (no name,
			// no width) disappears here too, instead of looking saved.
			setRows(
				saved.map( ( preset ) => ( {
					label: String( preset.label ),
					value: String( preset.value ),
					height: preset.height ? String( preset.height ) : '',
				} ) )
			);

			if ( Array.isArray( data?.options ) ) {
				setOptions( data.options );
			}

			toast.success( title, {
				description:
					serverText && typeof data?.message === 'string' && data.message
						? data.message
						: __( 'This list is what every page’s “Layout width” list offers.', 'fiveprayer' ),
				duration: 7000,
			} );

			return true;
		} catch {
			toast.error( __( 'The sizes could not be saved', 'fiveprayer' ), {
				description: __(
					'Reload the page and try again. If it keeps failing, your WordPress user may not have permission to change site settings.',
					'fiveprayer'
				),
			} );

			return false;
		} finally {
			setSavingRows( false );
		}
	};

	const saveRows = () => {
		touched.current = true;
		void persistRows( rows, __( 'Sizes saved', 'fiveprayer' ), true );
	};

	const removeRow = ( index: number ) => {
		touched.current = true;

		const previous = rows;
		const next = rows.filter( ( _, i ) => i !== index );

		// Off the screen first, so the click feels immediate, then stored. If the
		// server refuses it the row comes back, rather than the screen claiming a
		// size that is still being offered everywhere.
		setRows( next );

		void persistRows( next, __( 'Size removed', 'fiveprayer' ) ).then( ( saved ) => {
			if ( ! saved ) {
				setRows( previous );
			}
		} );
	};

	return (
		<div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
						{ __( 'Layout width', 'fiveprayer' ) }
						<span className="text-[9px] font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">
							{ __( 'for the TV screen', 'fiveprayer' ) }
						</span>
					</h3>
					<p className="text-[11px] text-gray-500 mt-0.5">
						{ __(
							'Page builders pick their desktop, tablet or mobile design from the width they are shown at. A smart TV usually reports a much narrower width than the screen, which is why a breakpoint can look like it is not working. Set the width you designed for — Full HD normally — and if your page builder lets you add custom breakpoints, add one at that same width (for example 768 px for a tablet-style layout), so the builder switches to that design at exactly the width the TV is laid out at. A vertical (portrait) screen uses a narrow width instead: 480 px or 782 px.',
							'fiveprayer'
						) }{ ' ' }
						<Link
							to="/documentation/tvdisplay"
							className="font-semibold text-indigo-700 underline hover:text-indigo-900"
						>
							{ __( 'Full guide', 'fiveprayer' ) }<span aria-hidden="true"> →</span>
						</Link>
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<select
						value={ String( width ) }
						onChange={ ( event ) => void save( event.target.value ) }
						disabled={ ! localized || saving }
						aria-label={ __( 'Layout width of a display page', 'fiveprayer' ) }
						className="h-8 max-w-[220px] rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-800 focus:outline-hidden disabled:opacity-60"
					>
						{ options.map( ( preset ) => (
							<option key={ preset.value } value={ String( preset.value ) }>
								{ preset.label }
							</option>
						) ) }
						{/* A width stored before it stopped being one of the sizes stays
						    visible and selectable, instead of the list quietly showing Auto
						    for a site that is laid out at a width of its own. */}
						{ width > 0 && ! presetFor( width ) && (
							<option value={ String( width ) }>
								{ sprintf( __( '%d px — not one of your sizes', 'fiveprayer' ), width ) }
							</option>
						) }
					</select>
				</div>
			</div>

			{/* One way in: the list holds the built-in widths and the site's own
			    named sizes, and a width that is not in it is added below. There is no
			    second "type a width" entry here, because it did exactly the same job
			    and left the site with an unnamed width nothing else could refer to. */}
			<p className="text-[10px] text-gray-500 mt-2">
				{ __(
					'This is the site default. To use a width that is not listed, add it under “Your own sizes” below — it then appears here and in every page’s “TV Mode” box.',
					'fiveprayer'
				) }
			</p>

			{/* The site's own sizes. They are saved to the site, not to this page, and
			    they then appear in this list and in the "Layout width" list of every
			    content editor's TV Mode box. */}
			<div className="mt-3 border-t border-gray-100 pt-3">
				<p className="text-[11px] text-gray-500">
					<strong className="font-medium text-gray-700">{ __( 'Your own sizes', 'fiveprayer' ) }</strong>{ ' ' }
					{ __(
						'— name the screens you have (Hall TV, Entrance panel) and add the width each one needs, plus an optional height for its shape. The width picks the page-builder layout (set your page builder’s own custom breakpoint to the same width); the height is what the “Canvas Force” switch of TV Display Mode locks the editor canvas to. A saved size appears in this list and in every page’s “Layout width” list.',
						'fiveprayer'
					) }
				</p>					{ rows.length > 0 && (
						<div className="mt-2 space-y-2">
						{ rows.map( ( row, index ) => (
							<div key={ index } className="flex items-center gap-2">
								<input
									type="text"
									value={ row.label }
									onChange={ ( event ) => updateRow( index, { label: event.target.value } ) }
									placeholder={ __( 'Hall TV', 'fiveprayer' ) }
									maxLength={ localized?.presetLabelMax ?? 40 }
									aria-label={ __( 'Name of this size', 'fiveprayer' ) }
									disabled={ ! localized || savingRows }
									className="h-8 flex-1 min-w-0 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-800 focus:outline-hidden disabled:opacity-60"
								/>
								<input
									type="number"
									inputMode="numeric"
									min={ min }
									max={ max }
									step={ 1 }
									value={ row.value }
									onChange={ ( event ) => updateRow( index, { value: event.target.value } ) }
									placeholder="1920"
									aria-label={ __( 'Width of this size in pixels', 'fiveprayer' ) }
									disabled={ ! localized || savingRows }
									className="h-8 w-24 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-800 focus:outline-hidden disabled:opacity-60"
								/>
								<span className="text-[11px] text-gray-400" aria-hidden="true">{ '×' }</span>
								<input
									type="number"
									inputMode="numeric"
									min={ 1 }
									max={ max }
									step={ 1 }
									value={ row.height }
									onChange={ ( event ) => updateRow( index, { height: event.target.value } ) }
									placeholder="1080"
									aria-label={ __( 'Height of this size in pixels (optional)', 'fiveprayer' ) }
									disabled={ ! localized || savingRows }
									className="h-8 w-24 rounded-lg border border-gray-300 bg-white px-2 text-xs text-gray-800 focus:outline-hidden disabled:opacity-60"
								/>
								<span className="text-[11px] text-gray-500">{ __( 'px', 'fiveprayer' ) }</span>
								<button
									type="button"
									onClick={ () => removeRow( index ) }
									disabled={ ! localized || savingRows }
									title={ __( 'Removes this size and saves the list straight away', 'fiveprayer' ) }
									aria-label={ __( 'Remove this size and save', 'fiveprayer' ) }
									className="h-8 w-auto px-2 shrink-0 whitespace-nowrap rounded-lg border border-gray-200 text-xs text-gray-500 transition-all hover:bg-gray-50 focus:outline-hidden disabled:opacity-60"
								>
									{ __( 'Remove', 'fiveprayer' ) }
								</button>
							</div>
						) ) }
					</div>
				) }				{/* The two buttons keep their natural width (`w-auto shrink-0`) and the
				    explanation sits on its own line below them, so a long sentence can
				    never squeeze or stretch them. `flex-wrap` keeps both buttons on one
				    line in the narrow editor sidebar instead of cutting one in half. */}
				<div className="flex flex-wrap items-center gap-2 mt-2">
					<button
						type="button"
						onClick={ addRow }
						disabled={ ! localized || savingRows }
						className="h-8 w-auto shrink-0 whitespace-nowrap px-3 rounded-lg border border-gray-300 bg-white text-xs font-medium text-gray-700 transition-all hover:bg-gray-50 focus:outline-hidden disabled:opacity-60"
					>
						{ __( 'Add a size', 'fiveprayer' ) }
					</button>
					<button
						type="button"
						onClick={ saveRows }
						disabled={ ! localized || savingRows }
						className="h-8 w-auto shrink-0 whitespace-nowrap px-3 rounded-lg border border-indigo-300 bg-indigo-50 text-xs font-medium text-indigo-700 transition-all hover:bg-indigo-100 focus:outline-hidden disabled:opacity-60"
					>
						{ savingRows ? __( 'Saving…', 'fiveprayer' ) : __( 'Save sizes', 'fiveprayer' ) }
					</button>
				</div>
				<p className="text-[10px] text-gray-400 mt-2">
					{ localized?.canvasRange ??
						__( 'Any width from 320 to 7680 pixels.', 'fiveprayer' ) }{ ' ' }
					{ __(
						'Each saved size also appears in the “Layout width” list of every page’s “TV Mode” box. Remove saves straight away; adding and renaming are stored with “Save sizes”.',
						'fiveprayer'
					) }
				</p>
			</div>

			<p className="text-[10px] text-gray-500 mt-2">
				{ width > 0 ? (
					<>
						{ __( 'Display pages are laid out at', 'fiveprayer' ) }{ ' ' }
						<strong>{ width } px</strong>
						{ '. ' }
					</>
				) : (
					<>
						{ __( 'Auto — display pages use whatever width the TV reports.', 'fiveprayer' ) }{ ' ' }
					</>
				) }
				{ __(
					'One page can override this — open the page and use the “Layout width” list in its “TV Mode” box — and one device can override both, by adding',
					'fiveprayer'
				) }{ ' ' }
				<code className="bg-gray-100 px-1 py-0.5 rounded-sm">
					?fiveprayer_tv_width=480
				</code>{ ' ' }
				{ __(
					'to the address opened on that device. To see what a screen reports, open the display page on it and add',
					'fiveprayer'
				) }{ ' ' }
				<code className="bg-gray-100 px-1 py-0.5 rounded-sm">
					?{ localized?.reportQueryArg ?? 'fiveprayer_tv_report' }
				</code>{ ' ' }
				{ __(
					'to the address: the numbers appear in the corner of the screen.',
					'fiveprayer'
				) }
			</p>
		</div>
	);
};

export default TvCanvasWidthCard;

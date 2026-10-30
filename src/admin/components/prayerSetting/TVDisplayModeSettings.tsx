/**
 * TVDisplayModeSettings
 *
 * The "TV Display Mode" page of Configure Settings (its own entry in the
 * Categories list, next to Feature Switches).
 *
 * Three switches, all off until someone deliberately turns one on, plus one
 * design setting (the layout width a display page is built at, which is what
 * decides which of a page builder's breakpoints the TV gets):
 *   Pages → ON means every Page editor shows the small "TV Mode" box
 *           with the single "Enable TV Mode" checkbox. (The box is titled
 *           "TV Mode" — the short form of the feature name — because it is
 *           read inside a narrow editor sidebar.)
 *   Posts → the same, for posts.
 *   Share on Local Network → ON makes the site answer on the address the request
 *           arrived on ("localhost" → this computer's network IP), so a TV or
 *           phone on the same Wi-Fi can open the display page. Rendered by
 *           {@link LocalNetworkTestingCard}.
 *
 * All three sit behind the **TV Display Mode** master switch in the Feature
 * Switches panel: while that is off this page is not listed in the Categories
 * list, and turning it off resets all its switches to off. TV Display Mode is a
 * **beta** feature, so it ships OFF: a stored toggle map without the key counts
 * as off (see `DEFAULT_FEATURE_TOGGLES`) and nothing here is offered until
 * someone turns it on in Feature Switches.
 *
 * Each is independent, so a mosque that only ever builds display *pages* can
 * leave the post editor completely untouched, and a site that is only ever
 * opened on the computer that runs it can leave the network switch off. Until a
 * switch is on, nothing it controls exists: no box in that editor, and no URL
 * rewriting for other devices. An install that had saved the legacy single
 * switch keeps its answer, so an update never flips a live site.
 *
 * Turning a switch OFF hides that box in the editors of that post type and
 * returns the content that had it on to a normal look. The per-content ticks are
 * kept in the database, so switching it back on restores exactly the same
 * display pages — this page never deletes anything.
 *
 * Pages/Posts are saved through admin-ajax (`fp_save_tv_display_mode`) with the
 * post type as `scope`, using the nonce the PHP side localized into
 * `window.FivePrayerData.tvDisplay`. The server re-checks the `manage_options`
 * capability and the nonce, so this component is only a convenience on top of a
 * permission that already exists. The network switch saves through its own
 * endpoint (`fp_save_local_testing_mode`) behind the same capability check.
 *
 * @module prayerSetting/TVDisplayModeSettings
 */
import React from 'react';
import { Link } from 'react-router';
import apiFetch from '@wordpress/api-fetch';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';
import LocalNetworkTestingCard from './LocalNetworkTestingCard';
import TvTypeCard from './TvTypeCard';
import TvCanvasWidthCard from './TvCanvasWidthCard';

type TvDisplayState = NonNullable<(typeof window)['FivePrayerData']>['tvDisplay'];

/** Undefined until the localized data loads (or on non-admin screens). */
const readState = (): TvDisplayState | undefined =>
	typeof window !== 'undefined' ? window.FivePrayerData?.tvDisplay : undefined;

/**
 * The two editor-only design aids of this page (Canvas Force and the Safe Zone
 * Guide). Localized by `TvCanvasLocker::get_admin_state()`.
 */
type TvCanvasState = NonNullable<(typeof window)['FivePrayerData']>['tvCanvas'];

/** Undefined until the localized data loads (or on non-admin screens). */
const readCanvasState = (): TvCanvasState | undefined =>
	typeof window !== 'undefined' ? window.FivePrayerData?.tvCanvas : undefined;

interface EditorGuideRowProps {
	title: string;
	badge: string;
	description: string;
	/** The line shown under the row while the switch is off. */
	offNote: string;
	on: boolean;
	disabled: boolean;
	onToggle: () => void;
}

/**
 * One of the two editor-guide switches of the TV Display Mode page.
 *
 * Deliberately the same row shape as the Pages / Posts / TV-Phone switches
 * above, because it is the same kind of choice: an opt-in that is off until
 * someone turns it on.
 */
const EditorGuideRow: React.FC<EditorGuideRowProps> = ( {
	title,
	badge,
	description,
	offNote,
	on,
	disabled,
	onToggle,
} ) => (
	<div
		className={ `flex items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-all ${
			on ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-80'
		}` }
	>
		<div className="min-w-0">
			<h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
				{ title }
				<span className="text-[9px] font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">
					{ badge }
				</span>
			</h3>
			<p className="text-[11px] text-gray-500 mt-0.5">{ description }</p>
			{ ! on && <p className="text-[10px] text-amber-700 mt-1">{ offNote }</p> }
		</div>
		<button
			type="button"
			onClick={ onToggle }
			disabled={ disabled }
			aria-pressed={ on }
			className={ `h-8 px-3 flex items-center gap-2 rounded-lg border text-xs font-medium transition-all focus:outline-hidden shrink-0 disabled:opacity-60 ${
				on ? 'bg-green-50 border-green-300 text-green-700' : 'bg-gray-100 border-gray-200 text-gray-500'
			}` }
		>
			<span>{ on ? __( 'On', 'fiveprayer' ) : __( 'Off', 'fiveprayer' ) }</span>
			<span className={ `w-7 h-4 rounded-full relative transition-colors ${ on ? 'bg-green-500' : 'bg-gray-300' }` }>
				<span
					className={ `absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${ on ? 'left-[15px]' : 'left-0.5' }` }
				/>
			</span>
		</button>
	</div>
);

/** Plain-language description of what one switch does, per post type. */
const describe = ( scope: string ): string =>
	scope === 'page'
		? __( 'Show the “Enable TV Mode” box in every Page editor, so any page can be turned into a full-screen display.', 'fiveprayer' )
		: __( 'Show the “Enable TV Mode” box in every Post editor, so any post can be turned into a full-screen display.', 'fiveprayer' );

interface TVDisplayModeSettingsProps {
	title?: string;
	description?: string;
	icon?: React.ReactNode;
}

const TVDisplayModeSettings: React.FC<TVDisplayModeSettingsProps> = ( { title, description, icon } ) => {
	const localized = readState();

	// Server state is the source of truth; the component only mirrors the last
	// confirmed answer so a switch can move instantly while saving.
	const [ map, setMap ] = React.useState<Record<string, boolean>>(
		localized?.enabledMap ?? {}
	);
	const [ saving, setSaving ] = React.useState<string | null>( null );

	React.useEffect( () => {
		if ( localized?.enabledMap ) {
			setMap( localized.enabledMap );
		}
	}, [ localized?.enabledMap ] );

	// The two editor-only design aids (Canvas Force, Safe Zone Guide). They are
	// independent switches, stored in their own options and read from the same
	// localized `tvCanvas` state.
	const canvas = readCanvasState();
	const [ canvasForce, setCanvasForce ] = React.useState<boolean>( canvas?.canvasForce === true );
	const [ safeZone, setSafeZone ] = React.useState<boolean>( canvas?.safeZone === true );
	const [ savingGuide, setSavingGuide ] = React.useState<string | null>( null );

	React.useEffect( () => {
		if ( canvas ) {
			setCanvasForce( canvas.canvasForce === true );
			setSafeZone( canvas.safeZone === true );
		}
	}, [ canvas?.canvasForce, canvas?.safeZone ] );

	/**
	 * Flip one editor guide on or off. Optimistic: the switch moves at once and
	 * rolls back if the save fails, exactly like the post-type switches above.
	 */
	const toggleGuide = async ( guide: string ) => {
		if ( ! canvas ) return;

		const isCanvasForce = guide === ( canvas.canvasForceKey || 'canvas_force' );
		const current = isCanvasForce ? canvasForce : safeZone;
		const next = ! current;
		const setLocal = isCanvasForce ? setCanvasForce : setSafeZone;

		setSavingGuide( guide );
		setLocal( next );

		try {
			// Form-encoded on purpose: admin-ajax reads `$_POST`, and apiFetch
			// would otherwise JSON-encode `data` and leave `$_POST` empty (the
			// nonce check would then always fail).
			const response: any = await apiFetch( {
				url: window.FivePrayerData?.ajaxUrl || '',
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: canvas.ajaxAction,
					nonce: canvas.nonce,
					[ canvas.guideField || 'guide' ]: guide,
					enabled: next ? '1' : '0',
				} ),
			} );

			const data = response?.data ?? response;
			if ( typeof data?.canvasForce === 'boolean' ) setCanvasForce( data.canvasForce );
			if ( typeof data?.safeZone === 'boolean' ) setSafeZone( data.safeZone );

			toast.success(
				isCanvasForce
					? __( 'Canvas Force setting saved', 'fiveprayer' )
					: __( 'Safe Zone Guide setting saved', 'fiveprayer' ),
				{
					description:
						typeof data?.message === 'string' && data.message
							? data.message
							: __( 'Open a display page in your page builder to see it.', 'fiveprayer' ),
					duration: 6000,
				}
			);
		} catch {
			setLocal( current );
			toast.error( __( 'The setting could not be saved', 'fiveprayer' ), {
				description: __(
					'Reload the page and try again. If it keeps failing, your WordPress user may not have permission to change site settings.',
					'fiveprayer'
				),
			} );
		} finally {
			setSavingGuide( null );
		}
	};

	// Only the post types the server says have a switch, in server order.
	const scopes: string[] =
		localized?.postTypes && localized.postTypes.length > 0
			? localized.postTypes
			: [ 'page', 'post' ];

	const labelFor = ( scope: string ): string =>
		localized?.labels?.[scope] ?? ( scope === 'page' ? __( 'Pages', 'fiveprayer' ) : __( 'Posts', 'fiveprayer' ) );

	const toggle = async ( scope: string ) => {
		if ( ! localized ) return;

		const current = map[ scope ] !== false;
		const next = ! current;
		setSaving( scope );
		// Optimistic: move the switch now, roll back if the save fails.
		setMap( ( prev ) => ( { ...prev, [ scope ]: next } ) );

		try {
			// Form-encoded on purpose: admin-ajax reads `$_POST`, and apiFetch
			// would otherwise JSON-encode `data` and leave `$_POST` empty (the
			// nonce check would then always fail).
			const response: any = await apiFetch( {
				url: window.FivePrayerData?.ajaxUrl || '',
				method: 'POST',
				headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
				body: new URLSearchParams( {
					action: localized.ajaxAction,
					nonce: localized.nonce,
					scope,
					enabled: next ? '1' : '0',
				} ),
			} );

			const data = response?.data ?? response;
			const confirmed = typeof data?.enabled === 'boolean' ? data.enabled : next;
			if ( data?.enabledMap ) {
				setMap( data.enabledMap );
			} else {
				setMap( ( prev ) => ( { ...prev, [ scope ]: confirmed } ) );
			}

			toast.success(
				confirmed
					? __( 'TV Display Mode is on for', 'fiveprayer' ) + ' ' + labelFor( scope )
					: __( 'TV Display Mode is off for', 'fiveprayer' ) + ' ' + labelFor( scope ),
				{
					description:
						typeof data?.message === 'string' && data.message
							? data.message
							: describe( scope ),
					duration: 6000,
				}
			);
		} catch {
			setMap( ( prev ) => ( { ...prev, [ scope ]: current } ) );
			toast.error( __( 'The setting could not be saved', 'fiveprayer' ), {
				description: __(
					'Reload the page and try again. If it keeps failing, your WordPress user may not have permission to change site settings.',
					'fiveprayer'
				),
			} );
		} finally {
			setSaving( null );
		}
	};

	return (
		<div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
			<div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
				<div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
					{icon ?? (
						<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
						</svg>
					)}
				</div>
				<div>
					{/* The whole feature is still being improved, so it is labelled as beta
					    here as well as in the Feature Switches list. */}
					<div className="flex flex-wrap items-center gap-2">
						<h2 className="text-sm font-semibold text-gray-900">{title ?? __( 'TV Display Mode', 'fiveprayer' )}</h2>
						<span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">{__( 'Beta', 'fiveprayer' )}</span>
					</div>
					<p className="text-xs text-gray-500">
						{description ?? __( 'Offer the “Enable TV Mode” box in Pages, in Posts, let a TV or phone on the same Wi-Fi open the site, and turn on the two editor-only design aids (Canvas Force, Safe Zone Guide). Every switch starts off — turn on only what you use.', 'fiveprayer' )}
					</p>
				</div>
			</div>

			<div className="p-6">
				{/* Beta notice. The feature is usable, but it is still being improved, so
				    the expectation is set before any switch is touched. */}
				<div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
					<svg
						className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
						fill="none"
						viewBox="0 0 24 24"
						strokeWidth="1.8"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.108-12.25c.866-1.5 3.032-1.5 3.898 0l7.108 12.25ZM12 15.75h.007v.008H12v-.008Z"
						/>
					</svg>
					<p className="text-xs leading-relaxed text-amber-800">
						{__(
							'TV Display Mode is in beta. It works today, but parts of it may still change or need improvement while the feature settles — please try it on your own screen and check the display after every update.',
							'fiveprayer'
						)}
					</p>
				</div>

				{! localized && (
					<p className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
						{__( 'The saved values could not be read on this screen, so the switches are read-only. Reload the admin page to manage them.', 'fiveprayer' )}
					</p>
				)}

				<div className="space-y-3">
					{scopes.map( ( scope ) => {
						// Only an explicit "on" from the server shows as on, so a value
						// the server did not send falls back to OFF rather than pretending
						// the switch is enabled.
						const on = map[ scope ] === true;
						const isSaving = saving === scope;
						const label = labelFor( scope );
						return (
							<div
								key={scope}
								className={ `flex items-start justify-between gap-4 rounded-lg border px-4 py-3 transition-all ${
									on ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200'
								}` }
							>
								<div className="min-w-0">
									<h3 className="text-sm font-medium text-gray-900">{label}</h3>
									<p className="text-[11px] text-gray-500 mt-0.5">{describe( scope )}</p>
									{! on && (
										<p className="text-[10px] text-amber-700 mt-1">
											{__( 'Off — the box is hidden in these editors and display content is back to normal. Your ticks are kept.', 'fiveprayer' )}
										</p>
									)}
								</div>

								<button
									type="button"
									onClick={ () => toggle( scope ) }
									disabled={! localized || isSaving}
									aria-pressed={on}
									aria-label={
										on
											? __( 'Turn off TV Display Mode for', 'fiveprayer' ) + ' ' + label
											: __( 'Turn on TV Display Mode for', 'fiveprayer' ) + ' ' + label
									}
									className={ `h-8 px-3 flex items-center gap-2 rounded-lg border text-xs font-medium transition-all focus:outline-hidden shrink-0 disabled:opacity-60 ${
										on
											? 'bg-green-50 border-green-300 text-green-700'
											: 'bg-gray-100 border-gray-200 text-gray-500'
									}` }
								>
									<span>{on ? __( 'On', 'fiveprayer' ) : __( 'Off', 'fiveprayer' )}</span>
									<span className={ `w-7 h-4 rounded-full relative transition-colors ${on ? 'bg-green-500' : 'bg-gray-300'}` }>
										<span
											className={ `absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${on ? 'left-[15px]' : 'left-0.5'}` }
										/>
									</span>
								</button>
							</div>
						);
					} )}

					{/* Network access — the third switch. Same row shape as the two
					    post-type switches above, because it is the same kind of choice:
					    an opt-in that stays off until someone turns it on. */}
					<LocalNetworkTestingCard />

					{/* The two editor-only design aids. They are not part of what the TV
					    shows — they only change the page builder's canvas while a display
					    page is being designed — so they sit in their own group, each with
					    its own switch. */}
					<div className="mt-5 pt-4 border-t border-gray-100">
						<h3 className="text-sm font-semibold text-gray-900">
							{ __( 'Editor design aids', 'fiveprayer' ) }
						</h3>
						<p className="text-[11px] text-gray-500 mt-0.5">
							{ __(
								'Shown only inside your page builder while you design a display page, never on the finished screen. Each has its own switch.',
								'fiveprayer'
							) }
						</p>

						{ ! canvas && (
							<p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
								{ __(
									'The saved values could not be read on this screen, so these switches are read-only. Reload the admin page to manage them.',
									'fiveprayer'
								) }
							</p>
						) }

						<div className="space-y-3 mt-3">
							<EditorGuideRow
								title={ __( 'Canvas Force', 'fiveprayer' ) }
								badge={ __( 'for the editor', 'fiveprayer' ) }
								description={ __(
									'In the page builder, lock the canvas to the display page’s chosen width × height, so 100%-height and vh elements scale to the TV instead of your laptop.',
									'fiveprayer'
								) }
								offNote={ __(
									'Off — the builder canvas is shown at its own size. The finished page is never changed either way.',
									'fiveprayer'
								) }
								on={ canvasForce }
								disabled={ ! canvas || savingGuide !== null }
								onToggle={ () => void toggleGuide( canvas?.canvasForceKey || 'canvas_force' ) }
							/>
							<EditorGuideRow
								title={ __( 'Safe Zone Guide', 'fiveprayer' ) }
								badge={ __( 'for the editor', 'fiveprayer' ) }
								description={ __(
									'Draw a readable guide over the canvas: the inner dashed frame is the margin a TV can crop, so you can keep text and times inside it.',
									'fiveprayer'
								) }
								offNote={ __( 'Off — no guide is drawn over the canvas.', 'fiveprayer' ) }
								on={ safeZone }
								disabled={ ! canvas || savingGuide !== null }
								onToggle={ () => void toggleGuide( canvas?.safeZoneKey || 'safe_zone' ) }
							/>
						</div>
					</div>

					{/* Not a switch: which screen the display is built for. It decides how
					    much of the design an older TV is allowed to crop, and what the
					    safe-zone guide in the page builder marks. */}
					<TvTypeCard />

					{/* Not a switch: the width a display page is laid out at. It sits with
					    the switches because it is the other half of "what does the TV
					    show" — the switches decide whether a page becomes a display,
					    this decides which layout that display gets. */}
					<TvCanvasWidthCard />
				</div>

				{/* Why the network switch exists. The person installing a TV in the
				    prayer hall is usually not the person who knows what "localhost"
				    means, so the reason is spelled out next to the switch itself. */}
				<div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
					<h3 className="text-sm font-semibold text-indigo-900">
						{__( 'Why “Share on Local Network” has to be switched on', 'fiveprayer' )}
					</h3>
					<p className="text-[11px] text-indigo-800 mt-1">
						{__( 'A site that runs on your own computer has the address http://localhost. On a TV, phone or tablet “localhost” means the device itself, so the page — and with it the colours and the display layout — never loads. Switching this on makes WordPress build every link with the address the request actually arrived on (for example 192.168.1.104) instead. It is done in memory for that one request; the database is never changed.', 'fiveprayer' )}
					</p>
					<ul className="mt-2 space-y-1 text-[11px] text-indigo-800 list-disc pl-4">
						<li>{__( 'Off (the default): nothing is rewritten. Other devices keep receiving localhost links, so the display opens only on this computer.', 'fiveprayer' )}</li>
						<li>{__( 'On: only requests that already arrive on a private/local address are rewritten, and only for that request.', 'fiveprayer' )}</li>
						<li>{__( 'Never on a live website: a public domain is left alone even if the switch is on, so a production site can never be affected.', 'fiveprayer' )}</li>
					</ul>
				</div>

				<p className="text-[11px] text-gray-400 mt-3">
					{__( 'This page is listed while TV Display Mode is on in Feature Switches — switching it off there resets its switches on this page. Enabling a Pages/Posts switch only adds the box to that editor. Nothing changes on the front end until you tick “Enable TV Mode” inside one page or post, and turning a switch off never deletes those ticks. The “Share on Local Network” switch is what lets the TV, phone or tablet on your network open this same site — leave it on for as long as the screen is in use. It writes nothing to the database and is ignored on a real public domain, so it can stay on safely.', 'fiveprayer' )}{' '}
					<Link to="/documentation/tvdisplay" className="font-semibold text-indigo-700 underline hover:text-indigo-900">
						{__( 'Full guide', 'fiveprayer' )}<span aria-hidden="true"> →</span>
					</Link>
				</p>
			</div>
		</div>
	);
};

export default TVDisplayModeSettings;

/**
 * LocalNetworkTestingCard
 *
 * The "share this site with the TV, phone or tablet on your own network"
 * feature, and the third switch of the TV Display Mode page (Pages, Posts,
 * Share on Local Network).
 *
 * It is a real, permanent feature, not a testing helper: a mosque can run
 * FivePrayer on a local machine (LocalWP, Flywheel, MAMP, Docker, wp server, a
 * mini PC or Raspberry Pi in the prayer hall) and have the display page open on
 * the TV, a phone or a tablet on that same network — every device serves from
 * the same site, at the same time. Leaving the switch on is the normal way to
 * run it; the only technical guard is that it does nothing on a public domain.
 *
 * Rendered as one switch row inside the TV Display Mode card of
 * Customizing → Configure Settings → TV Display Mode, right below the Pages and
 * Posts switches, because it is the same kind of choice and belongs with them:
 * it is off by default and the user picks whether to turn it on. The row is
 * deliberately two lines: the title and one line that says what it does —
 * followed by the guide link, which doubles as the "not a private address"
 * warning when the switch is on but the address is not a local one. Everything
 * else (the steps, the address to open on the device, how to find your own IP,
 * the firewall and server-binding fixes) lives on that single documentation
 * page, never here: a row cannot know another machine's address, so printing an
 * example only invites people to type it.
 *
 * The switch is saved through admin-ajax (`fp_save_local_testing_mode`) using
 * the nonce the PHP side localized into `window.FivePrayerData.localTesting`.
 * The server re-checks the `manage_options` capability and the nonce, so this
 * component is only a convenience on top of a permission that already exists.
 * While the stored option is off, {@link \FivePrayer\Core\LocalNetworkRouter}
 * rewrites nothing at all, so the feature is genuinely inert until it is on.
 *
 * @module prayerSetting/LocalNetworkTestingCard
 */
import React from 'react';
import { Link } from 'react-router';
import apiFetch from '@wordpress/api-fetch';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';

type LocalTestingState = NonNullable<(typeof window)['FivePrayerData']>['localTesting'];

/** Undefined until the localized data loads (or on non-admin screens). */
const readState = (): LocalTestingState | undefined =>
	typeof window !== 'undefined' ? window.FivePrayerData?.localTesting : undefined;

const LocalNetworkTestingCard: React.FC = () => {
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

	// The switch is on but this request did not arrive on a private address, so
	// nothing is rewritten and another device would get broken links. Surfaced
	// as the row's second line instead of a line of its own, to keep the row
	// short.
	const notRunning = Boolean( enabled && localized && ! localized.requestIsLocal );

	const toggle = async () => {
		if ( ! localized ) return;

		const next = ! enabled;
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
					action: localized.ajaxAction,
					nonce: localized.nonce,
					enabled: next ? '1' : '0',
				} ),
			} );

			const saved = response?.data?.enabled ?? response?.enabled;
			const confirmed = typeof saved === 'boolean' ? saved : next;
			setEnabled( confirmed );

			if ( confirmed ) {
				toast.success( __( 'Share on Local Network is on', 'fiveprayer' ), {
					description: __( 'The TV, phone or tablet on your network can open this site with this computer’s network address.', 'fiveprayer' ),
					duration: 6000,
				} );
			} else {
				toast.success( __( 'Share on Local Network is off', 'fiveprayer' ), {
					description: __( 'Only this computer can open the site now.', 'fiveprayer' ),
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

	return (
		// Same row markup as the other feature switches, so it reads as one of
		// them instead of a special card of its own.
		<div
			className={ `flex items-start justify-between gap-3 rounded-lg border px-4 py-3 transition-all ${
				enabled ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 opacity-80'
			}` }
		>
			<div className="min-w-0">
				<h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
					{ __( 'Share on Local Network', 'fiveprayer' ) }
					<span className="text-[9px] font-semibold uppercase tracking-wide bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-sm">
						{ __( 'for the TV screen', 'fiveprayer' ) }
					</span>
				</h3>
				{/* Short by design. No address is shown: the row cannot know another
				    machine's address, and an example only invites people to type it
				    instead of opening the guide the line links to. The description
				    line doubles as the one failure a user must notice here: the
				    switch is on, but the address is not a private one. The line
				    below it appears only while the switch is off, matching the
				    Pages/Posts rows above. */}
				<p className={ `text-[11px] mt-0.5 ${ notRunning ? 'text-amber-700' : 'text-gray-500' }` }>
					{ notRunning
						? __( 'Not active on this address — it is not a private/local one.', 'fiveprayer' )
						: __( 'Open this site on a TV, phone or tablet on the same network.', 'fiveprayer' ) }{ ' ' }
					<Link to="/documentation/localtesting" className="font-semibold text-indigo-700 underline hover:text-indigo-900">
						{ __( 'Full guide', 'fiveprayer' ) }<span aria-hidden="true"> →</span>
					</Link>
				</p>
				{/* Same "what off means" line as the Pages/Posts rows, so the three
				    switches of this page read the same way. */}
				{ ! enabled && (
					<p className="text-[10px] text-amber-700 mt-1">
						{ __( 'Off — the site answers only on this computer, so the TV, phone or tablet on your network cannot open it. Switch it on and leave it on to share the display.', 'fiveprayer' ) }
					</p>
				) }
			</div>

			<button
				type="button"
				onClick={ toggle }
				disabled={ saving }
				aria-pressed={ enabled }
				className={ `h-8 px-3 flex items-center gap-2 rounded-lg border text-xs font-medium transition-all focus:outline-hidden shrink-0 disabled:opacity-60 ${
					enabled
						? 'bg-green-50 border-green-300 text-green-700'
						: 'bg-gray-100 border-gray-200 text-gray-500'
				}` }
			>
				<span>{ enabled ? __( 'On', 'fiveprayer' ) : __( 'Off', 'fiveprayer' ) }</span>
				<span className={ `w-7 h-4 rounded-full relative transition-colors ${ enabled ? 'bg-green-500' : 'bg-gray-300' }` }>
					<span
						className={ `absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${ enabled ? 'left-[15px]' : 'left-0.5' }` }
					/>
				</span>
			</button>
		</div>
	);
};

export default LocalNetworkTestingCard;

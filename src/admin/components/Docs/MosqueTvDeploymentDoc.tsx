/**
 * MosqueTvDeploymentDoc
 *
 * Guidance for the most common real-world use of TV Display Mode: a masjid
 * running a prayer display on a screen, with several mosques keeping their own
 * separate websites while sharing the same configuration through the plugin's
 * import/export.
 *
 * The security claims here mirror the actual implementations:
 *  - SettingsAdmin -> SettingsDataManagementTrait (settings export/import)
 *  - SettingsAdmin -> TranslationImportExportTrait (translations export/import)
 *  - LocalNetworkRouter (Share on Local Network — serving the site on the network)
 *
 * @module Docs/MosqueTvDeploymentDoc
 */
import React from 'react';
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';
import { getSiteAddress, EXAMPLE_LAN_HOST, EXAMPLE_LAN_BASE } from '../../utils/siteAddress';

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm text-sm break-all">{children}</code>
);

const Block: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<pre className="bg-gray-950 p-4 overflow-x-auto rounded-lg mt-2"><code className="text-emerald-400 font-mono text-xs leading-relaxed">{children}</code></pre>
);

const Step: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
	<div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
		<span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">{n}</span>
		<div>
			<p className="font-semibold text-gray-800">{title}</p>
			<div className="text-gray-700 text-sm mt-1 space-y-1">{children}</div>
		</div>
	</div>
);

const Link2: React.FC<{ to: string; children: React.ReactNode }> = ({ to, children }) => (
	<Link to={to} className="text-green-700 font-semibold underline">{children}</Link>
);

const MosqueTvDeploymentDoc: React.FC = () => {
	// The TV is a separate device, so it must be given the network address,
	// never the localhost address this admin page may be viewed on.
	const { lanBase, isLoopback } = getSiteAddress();

	return (
		<div className="max-w-6xl mx-auto p-6">
			{/* Header */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{__('Mosque TV Display — Deployment Guide', 'fiveprayer')}</h2>
				<p className="text-lg text-gray-700 text-center">
					{__('For a masjid that wants the prayer timetable on a screen in the prayer hall. Every mosque keeps its own website and its own location, and the shared configuration is copied between them with the plugin’s export and import.', 'fiveprayer')}
				</p>
			</div>

			{/* The idea */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('The idea in one paragraph', 'fiveprayer')}</h3>
				<p className="text-gray-700 text-sm mb-3">
					{__('The display is not a separate product. It is simply a page on the mosque’s own WordPress site with TV Display Mode switched on. The screen — a TV, a monitor or an Android box — opens that page in a browser and shows it full screen.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 text-sm">
					{__('Because each mosque has its own site, each one also has its own address, its own location and its own language. What they can copy from each other is the', 'fiveprayer')}{' '}
					<strong>{__('configuration', 'fiveprayer')}</strong> {__('— the calculation method, the labels and the translations — using the export and import described below.', 'fiveprayer')}
				</p>
			</div>

			{/* Local server, not the live website — the most important decision */}
			<div className="bg-amber-50 border border-amber-300 p-6 rounded-2xl shadow-xs mb-6">
				<h3 className="text-xl font-semibold text-amber-900 mb-3">{__('Run the display on a local server, not your live website', 'fiveprayer')}</h3>
				<p className="text-gray-700 text-sm mb-3">
					{__('A screen in the prayer hall only has to reach the site from inside the mosque. If you switch TV Display Mode on for the mosque’s public website, that display page sits on the internet where anyone can open it, copy it or probe it — and every extra public page is one more thing to keep patched. Put TV Display Mode on a computer or small box that runs the site on the mosque’s own network instead, and leave the live website untouched.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 text-sm mb-3">
					<strong>{__('You get the same display for free.', 'fiveprayer')}</strong>{' '}
					{__('The timetable is identical on both machines because the configuration is a file. Export', 'fiveprayer')} <strong>{__('Settings', 'fiveprayer')}</strong> {__('and', 'fiveprayer')} <strong>{__('Translations', 'fiveprayer')}</strong> {__('from the live site once, import both on the local machine, then set that mosque’s own location there. Nothing on the live site changes, and no visitor ever sees the display page.', 'fiveprayer')}
				</p>
				<div className="bg-white border border-amber-200 rounded-lg p-4">
					<p className="font-semibold text-gray-800 text-sm mb-1">{__('The local display address (example)', 'fiveprayer')}</p>
					<p className="text-gray-700 text-sm">
						{__('On the TV’s browser, open the local server by its network address — for example', 'fiveprayer')}{' '}
						<Code>{EXAMPLE_LAN_BASE}</Code>{__('. That address is only an example: only the IP changes from computer to computer. Find yours with:', 'fiveprayer')}
					</p>
					<Block>{`# Windows (Command Prompt or PowerShell)\nipconfig\n\n# macOS\nipconfig getifaddr en0\n\n# Linux\nhostname -I`}</Block>
					<p className="text-red-700 text-sm mt-2">
						{__('Never type localhost on the TV — localhost on the TV means the TV itself. And do not use the mosque’s public web address for the display.', 'fiveprayer')}
					</p>
				</div>
				<ul className="text-gray-700 text-sm space-y-1 mt-3">
					<li>{__('• Switch “Share on Local Network” on in Configure Settings → TV Display Mode (it is the third switch and is off by default) so the TV can fetch the page by IP.', 'fiveprayer')}</li>
					<li>{__('• While that switch is off, the site keeps building localhost links and the TV cannot load the page at all.', 'fiveprayer')}</li>
					<li>{__('• Any spare computer, mini PC, Raspberry Pi or Android box that can run WordPress locally is enough.', 'fiveprayer')}</li>
					<li>{__('• Add the inbound firewall rule for the local machine’s port, and remove it again when you are done.', 'fiveprayer')}</li>
				</ul>
			</div>

			{/* Setup */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Setting up one mosque', 'fiveprayer')}</h3>
				<div className="space-y-3">
					<Step n="1" title={__('Use the mosque’s own website', 'fiveprayer')}>
						<p>{__('Install FivePrayer on that mosque’s site. Give the mosque its own WordPress administrator account — do not share one login between mosques.', 'fiveprayer')}</p>
					</Step>
					<Step n="2" title={__('Set the mosque’s own location', 'fiveprayer')}>
						<p>{__('Location is per mosque and is never copied from another site. Set the city or the latitude/longitude and timezone for this specific masjid.', 'fiveprayer')}</p>
					</Step>
					<Step n="3" title={__('Choose the calculation method', 'fiveprayer')}>
						<p>{__('Pick the calculation method and the higher-latitude rule the mosque follows. If another mosque already uses the same convention, import their settings file instead of retyping it (see the sharing section).', 'fiveprayer')}</p>
					</Step>
					<Step n="4" title={__('Build the display page', 'fiveprayer')}>
						<p>{__('Create a page and add the timetable shortcode or block. Design it on a 1920 × 1080 canvas for a Full HD TV; the page is scaled to fit the screen (up to a 4K screen) with the layout you built, unchanged.', 'fiveprayer')}</p>
					</Step>
					<Step n="5" title={__('Turn on TV Display Mode for that page', 'fiveprayer')}>
						<p>{__('In the editor, open the', 'fiveprayer')} <strong>{__('“TV Mode”', 'fiveprayer')}</strong> {__('box (the short name for TV Display Mode), tick', 'fiveprayer')} <strong>{__('Enable TV Mode', 'fiveprayer')}</strong> {__('and save. Only that one page changes; the rest of the website stays as it was. First make sure TV Display Mode is on in Configure Settings → Feature Switches (its master switch — while it is off this page is not even listed), then switch on Pages (or Posts) in Configure Settings → TV Display Mode — all three switches start off, and while one is off no editor of that post type shows the checkbox.', 'fiveprayer')}</p>
					</Step>
					<Step n="6" title={__('Put it on the screen', 'fiveprayer')}>
						<p>{__('Open the page on the TV’s browser and go full screen (F11 on Windows, Ctrl + Cmd + F on macOS), or launch the browser in kiosk mode. Disable the screen’s sleep timer.', 'fiveprayer')}</p>
						<p className="text-gray-500">{__('This site’s display page is at:', 'fiveprayer')} <Code>{lanBase}</Code></p>
						{isLoopback ? (
							<p className="text-red-700">{__('Open that address on the TV, not localhost. The TV is a different device, so localhost there means “the TV itself” and the page will not load.', 'fiveprayer')} <Code>{EXAMPLE_LAN_HOST}</Code> {__('in the example is only an example — replace it with this computer’s own network IP (the same IP you use to reach the site from a phone).', 'fiveprayer')}</p>
						) : null}
					</Step>
					<Step n="7" title={__('Open it on your network', 'fiveprayer')}>
						<p>
							{__('Before committing the screen, open the display on a phone or a second computer over the local Wi-Fi using', 'fiveprayer')}{' '}
							<Link2 to="/documentation/localtesting">{__('Share on Local Network', 'fiveprayer')}</Link2>{__('. If something does not load, the', 'fiveprayer')}{' '}
							<Link2 to="/documentation/localtesting-troubleshooting">{__('Issues & Fixes', 'fiveprayer')}</Link2> {__('guide covers every cause we know, including firewalls.', 'fiveprayer')}
						</p>
						<p>{__('For this to work from the phone or TV, the', 'fiveprayer')} <strong>{__('“Share on Local Network”', 'fiveprayer')}</strong> {__('switch in Configure Settings → TV Display Mode must be on — it is off by default, and the page will not load on another device while it is off.', 'fiveprayer')}</p>
						<p>{__('Leave “Share on Local Network” on: it is how this machine serves the display page to the TV, the phone and any other screen on the mosque’s network, all at the same time.', 'fiveprayer')}</p>
					</Step>
				</div>
			</div>

			{/* Sharing */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Several mosques, same data — export and import', 'fiveprayer')}</h3>
				<p className="text-gray-700 text-sm mb-3">
					{__('Go to', 'fiveprayer')} <strong>{__('FivePrayer → Settings → Data Management', 'fiveprayer')}</strong>{__('. There are two independent pairs of buttons, each producing a small JSON file you can email or copy on a USB stick:', 'fiveprayer')}
				</p>
				<div className="space-y-4">
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="font-semibold text-gray-800 mb-1">{__('Export Settings / Import Settings', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">
							{__('The prayer-time calculation configuration: the Asr calculation rule, the calculation method, the midnight mode and the higher-latitude method. File name:', 'fiveprayer')} <Code>fiveprayer-settings-YYYY-MM-DD.json</Code>
						</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="font-semibold text-gray-800 mb-1">{__('Export Translations / Import Translations', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">
							{__('All the wording: prayer names, Gregorian and Hijri month and number translations, the timetable labels, the vertical daily prayer labels and the extra info texts. File name:', 'fiveprayer')} <Code>fiveprayer-translations-YYYYmmdd-HHMMSS.json</Code>
						</p>
					</div>
				</div>

				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
					<p className="font-semibold text-gray-800 text-sm mb-2">{__('What is deliberately NOT copied', 'fiveprayer')}</p>
					<ul className="text-gray-700 text-sm space-y-1">
						<li>{__('• The mosque’s', 'fiveprayer')} <strong>{__('location', 'fiveprayer')}</strong> {__('(city, latitude/longitude, timezone). Every mosque sets its own, so prayer times stay correct for that masjid.', 'fiveprayer')}</li>
						<li>{__('• The', 'fiveprayer')} <strong>{__('active language', 'fiveprayer')}</strong> {__('and the', 'fiveprayer')} <strong>{__('Hijri locale', 'fiveprayer')}</strong> {__('setting. The translation import skips these two keys on purpose, so importing a file can never change the language a mosque has chosen for its own site.', 'fiveprayer')}</li>
					</ul>
				</div>

				<p className="text-gray-700 text-sm mt-4">
					{__('Import', 'fiveprayer')} <strong>{__('merges', 'fiveprayer')}</strong> {__('with what the site already has instead of wiping it — nothing is deleted by an import. A practical workflow:', 'fiveprayer')}
				</p>
				<ol className="text-gray-700 text-sm list-decimal pl-5 space-y-1 mt-2">
					<li>{__('Configure one mosque’s site exactly the way you want it.', 'fiveprayer')}</li>
					<li>{__('Export both files from that site once.', 'fiveprayer')}</li>
					<li>{__('On each other mosque’s site, import both files, then set only that mosque’s own location and language.', 'fiveprayer')}</li>
				</ol>
			</div>

			{/* Security */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Is it secure? — yes, and here is exactly why', 'fiveprayer')}</h3>
				<div className="space-y-3 text-gray-700 text-sm">
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="font-semibold text-gray-800 mb-1">{__('Export and import are administrator-only', 'fiveprayer')}</h4>
						<p>{__('Every one of the four handlers checks the', 'fiveprayer')} <Code>manage_options</Code> {__('capability', 'fiveprayer')} <strong>{__('and', 'fiveprayer')}</strong> {__('a WordPress nonce before doing anything. Uploads are checked with', 'fiveprayer')} <Code>is_uploaded_file()</Code> {__('and validated as JSON; anything else is rejected. A visitor or a subscriber cannot export your data or push a file into your site.', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="font-semibold text-gray-800 mb-1">{__('The files contain configuration, not secrets', 'fiveprayer')}</h4>
						<p>{__('No passwords, no API keys, no administrator accounts and no visitor data are included — only the calculation settings and the wording.', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="font-semibold text-gray-800 mb-1">{__('Sharing a file does not reveal a mosque’s address', 'fiveprayer')}</h4>
						<p>{__('Because the location is excluded from the export, handing your settings file to another mosque does not disclose your city or coordinates.', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="font-semibold text-gray-800 mb-1">{__('An import cannot overwrite another mosque’s identity', 'fiveprayer')}</h4>
						<p>{__('The two keys that define a site’s own configuration —', 'fiveprayer')} <Code>activeLanguage</Code> {__('and', 'fiveprayer')} <Code>hijralocale</Code> {__('— are skipped on import, and existing settings are merged rather than replaced.', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="font-semibold text-gray-800 mb-1">{__('When the display is served on the local network', 'fiveprayer')}</h4>
						<p>{__('Share on Local Network only rewrites URLs when the request arrives on a loopback or private address, and it never writes to the database. That is exactly what lets the mosque’s own TV, phone and tablet open the display while this machine keeps serving it — so leave it on while the screen is in use, on a network you trust (the mosque or home network). It is intentionally inert on a public domain, so a live website is never affected.', 'fiveprayer')}</p>
					</div>
				</div>
			</div>

			{/* Checklist */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Security checklist for the mosque', 'fiveprayer')}</h3>
				<ol className="text-gray-700 space-y-2 text-sm list-decimal pl-5">
					<li>{__('One administrator account per mosque — never share a login between sites.', 'fiveprayer')}</li>
					<li>{__('Switch TV Display Mode on only for the page you designed as the display, and leave it off everywhere else.', 'fiveprayer')}</li>
					<li>{__('Run the display on a local server inside the mosque rather than on the public website, and copy the configuration over with export and import.', 'fiveprayer')}</li>
					<li>{__('Keep the inbound firewall rule for the site port in place while this machine serves the display — the TV and phone need it.', 'fiveprayer')}</li>
					<li>{__('Share on Local Network has no effect on a public website, so there is nothing to switch off there.', 'fiveprayer')}</li>
					<li>{__('Give the TV this computer’s network address, never localhost — localhost on the TV points at the TV.', 'fiveprayer')}</li>
					<li>{__('Only import an export file from a source you trust — it is configuration, but treat it like any settings file.', 'fiveprayer')}</li>
					<li>{__('Do not place private or personal information on the display page; on a public site that page is public.', 'fiveprayer')}</li>
				</ol>
			</div>

			{/* Tips */}
			<div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
				<h3 className="text-xl font-semibold text-blue-800 mb-3">{__('Tips', 'fiveprayer')}</h3>
				<ul className="text-blue-700 space-y-2">
					<li>{__('• Export both files once from a template site and keep them with the mosque onboarding notes — new mosques are then a two-minute job.', 'fiveprayer')}</li>
					<li>{__('• Import before setting the location, so you do not re-enter anything twice.', 'fiveprayer')}</li>
					<li>{__('• Use one page per screen so each display can show different content.', 'fiveprayer')}</li>
					<li>{__('• Open the finished display on a phone over the local network before the screen is installed.', 'fiveprayer')}</li>
					<li>{__('• Put the display on a local server first, then export its Settings and Translations — the next mosque is then a two-minute job with no public exposure.', 'fiveprayer')}</li>
				</ul>
			</div>
		</div>
	);
};

export default MosqueTvDeploymentDoc;

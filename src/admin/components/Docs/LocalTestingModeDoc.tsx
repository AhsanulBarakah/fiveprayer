/**
 * LocalTestingModeDoc
 *
 * In-admin usage guide for Share on Local Network — the "share this site (prayer
 * times, design and all) with the TV, phone or tablet on your own network"
 * feature, which is the third switch of the TV Display Mode page of Configure
 * Settings (next to the Pages and Posts switches). It is a permanent feature for
 * a machine that serves the mosque's own network, not a testing step.
 * Mirrors the structure of the other Docs pages (header card, sections, tips)
 * so it renders identically inside the Documentation screen.
 *
 * @module Docs/LocalTestingModeDoc
 */
import React from 'react';
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';
import { getSiteAddress, EXAMPLE_LAN_HOST } from '../../utils/siteAddress';

/** Configure Settings screen — the panel that hosts the feature switch. */
const settingsPath = '/customizing/settings';

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm text-sm">{children}</code>
);

const Pre: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<pre className="bg-gray-950 p-4 overflow-x-auto rounded-lg mt-2"><code className="text-emerald-400 font-mono text-xs leading-relaxed">{children}</code></pre>
);

const Step: React.FC<{ n: string; title: string; children: React.ReactNode }> = ({ n, title, children }) => (
	<div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
		<span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0">{n}</span>
		<div>
			<p className="font-semibold text-gray-800">{title}</p>
			<div className="text-gray-700 text-sm mt-1 space-y-1">{children}</div>
		</div>
	</div>
);

const LocalTestingModeDoc: React.FC = () => {
	// Resolved from the live admin page so the examples show this
	// installation's own address instead of a hard-coded one.
	const { host, lanBase, isLoopback } = getSiteAddress();

	return (
		<div className="max-w-6xl mx-auto p-6">
			{/* Header */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{__('Share on Local Network Guide', 'fiveprayer')}</h2>
				<p className="text-lg text-gray-700 text-center">
					{__('Share this site — prayer times, design and all — with the TV, phone or tablet on your own network. Perfect for a mosque that runs FivePrayer on a local machine and shows the display on a screen in the prayer hall, without broken links, redirect loops or database changes.', 'fiveprayer')}
				</p>
			</div>

			{/* The single biggest misunderstanding */}
			{isLoopback ? (
				<div className="bg-red-50 border border-red-300 p-5 rounded-2xl mb-6">
					<h3 className="text-lg font-semibold text-red-800 mb-2">{__('Important: never type localhost on the phone or TV', 'fiveprayer')}</h3>
					<p className="text-red-700 text-sm">
						{__('You are currently viewing the admin from', 'fiveprayer')} <Code>{host}</Code>{__('. That address works only on this computer. On a phone, tablet or TV, localhost means “this device”, so it points at the phone itself and the page, its colours and TV Display Mode all fail. On every other device use this computer’s network address instead:', 'fiveprayer')}{' '}
						<Code>{lanBase}</Code>
					</p>
					<p className="text-red-700 text-sm mt-2">
						<strong>{__('That address is only an example.', 'fiveprayer')}</strong>{' '}
						{__('Only the IP changes from computer to computer. Find yours with:', 'fiveprayer')}
					</p>
					<Pre>{`# Windows (Command Prompt or PowerShell)\nipconfig\n\n# macOS\nipconfig getifaddr en0\n\n# Linux\nhostname -I`}</Pre>
					<p className="text-red-700 text-sm mt-2">
						{__('Use the line that starts with', 'fiveprayer')} <Code>192.168.</Code> {__('or', 'fiveprayer')} <Code>10.</Code>{__('. In the example above it is', 'fiveprayer')} <Code>{EXAMPLE_LAN_HOST}</Code>{__(', but yours will be different.', 'fiveprayer')}
					</p>
				</div>
			) : null}

			{/* What it is */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('What is “Share on Local Network”?', 'fiveprayer')}</h3>
				<p className="text-gray-700 mb-3">
					{__('When WordPress is installed locally (LocalWP, MAMP, Docker, XAMPP…), its Site URL is usually set to localhost. If you open the site from your phone using the computer’s network address, WordPress still generates every link pointing back to localhost — a phone cannot reach localhost, so the pages break.', 'fiveprayer')}
				</p>
				<p className="text-gray-700">
					{__('This setting fixes that by routing WordPress to the address your request actually arrived on, in memory, for that one request. Your database is never modified — no permanent URL change, no risk of corrupting your live site.', 'fiveprayer')}
				</p>
			</div>

			{/* Where to find it */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Where to find it', 'fiveprayer')}</h3>
				<ul className="text-gray-700 space-y-2">
					<li>• {__('In the WordPress admin, go to', 'fiveprayer')} <strong>{__('FivePrayer → Customizing → Configure Settings', 'fiveprayer')}</strong>.</li>
					<li>• {__('Make sure', 'fiveprayer')} <strong>{__('TV Display Mode', 'fiveprayer')}</strong> {__('is on in', 'fiveprayer')} <strong>{__('Feature Switches', 'fiveprayer')}</strong> {__('— it is the master switch, and while it is off this TV Display Mode page (and with it this switch) is not listed at all.', 'fiveprayer')}</li>
					<li>• {__('Open the', 'fiveprayer')} <strong>{__('TV Display Mode', 'fiveprayer')}</strong> {__('page. Its three switches are shown together: the box in Pages editors, the box in Posts editors, and opening the site from another device.', 'fiveprayer')}</li>
					<li>• {__('Find', 'fiveprayer')} <strong>{__('“Share on Local Network”', 'fiveprayer')}</strong> {__(', the third switch — off by default — and open this guide from the “Full guide” link on that row.', 'fiveprayer')}</li>
				</ul>
				<Link
					to={settingsPath}
					className="mt-5 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 focus:outline-hidden focus:ring-2 focus:ring-green-400"
				>
					{__('Open Configure Settings', 'fiveprayer')}
				</Link>
			</div>

			{/* Step by step */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Step-by-step: open the display on your phone', 'fiveprayer')}</h3>
				<div className="space-y-3">
					<Step n="1" title={__('Find your computer’s network IP', 'fiveprayer')}>
						<p>{__('On Windows run', 'fiveprayer')} <Code>ipconfig</Code>{__('; on macOS run', 'fiveprayer')} <Code>ipconfig getifaddr en0</Code>{__('; on Linux run', 'fiveprayer')} <Code>hostname -I</Code>{__(', or check the URL your local tool (e.g. LocalWP) shows for “Live Link”. You want the address that starts with', 'fiveprayer')} <Code>192.168.</Code> {__('or', 'fiveprayer')} <Code>10.</Code> {__('For example', 'fiveprayer')} <Code>{EXAMPLE_LAN_HOST}</Code>{__('.', 'fiveprayer')}</p>
					</Step>
					<Step n="2" title={__('Open the TV Display Mode page', 'fiveprayer')}>
						<p>{__('Go to', 'fiveprayer')} <strong>{__('FivePrayer → Customizing → Configure Settings → TV Display Mode', 'fiveprayer')}</strong>{__(' — the page that holds the three TV switches.', 'fiveprayer')}</p>
					</Step>
					<Step n="3" title={__('Turn the third switch on', 'fiveprayer')}>
						<p>{__('Switch on', 'fiveprayer')} <strong>{__('“Share on Local Network”', 'fiveprayer')}</strong>{__(' — it is off by default. It saves immediately and is stored securely as', 'fiveprayer')} <Code>fiveprayer_local_testing_mode</Code>{__('. Only administrators can change it, and the save is protected by a WordPress nonce.', 'fiveprayer')}</p>
						<p>{__('While it is off, nothing is rewritten: the site keeps sending localhost links and the phone or TV cannot open it.', 'fiveprayer')}</p>
					</Step>
					<Step n="4" title={__('Open the site from your phone', 'fiveprayer')}>
						<p>{__('On the other device, browse to your computer’s network address and port — for example', 'fiveprayer')} <Code>{lanBase}</Code>{__('. Both devices must be on the same Wi-Fi network.', 'fiveprayer')}</p>
						<p className="text-red-700">{__('Type the computer’s IP address here, never localhost. If the example above still shows localhost, replace it with the IP you found in step 1.', 'fiveprayer')}</p>
					</Step>
					<Step n="5" title={__('Leave it on for the display', 'fiveprayer')}>
						<p>{__('Nothing else to do: that switch is how this machine keeps serving the display to the TV, the phone and any other screen on the network. Switch it off only if you no longer want other devices on the network to open the site.', 'fiveprayer')}</p>
					</Step>
				</div>
			</div>

			{/* Safety */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Built-in safety', 'fiveprayer')}</h3>
				<ul className="text-gray-700 space-y-2 text-sm">
					<li>• {__('The database is', 'fiveprayer')} <strong>{__('never', 'fiveprayer')}</strong> {__('changed — the Site URL and Home URL are overridden in memory only (via the', 'fiveprayer')} <Code>option_siteurl</Code> / <Code>option_home</Code> {__('filters and the', 'fiveprayer')} <Code>WP_HOME</Code> / <Code>WP_SITEURL</Code> {__('constants).', 'fiveprayer')}</li>
					<li>• {__('The override is', 'fiveprayer')} <strong>{__('disabled on production domains', 'fiveprayer')}</strong>{__(' — it only runs for loopback/private addresses (localhost, 127.0.0.1, 10.x.x.x, 192.168.x.x, 172.16–31.x.x).', 'fiveprayer')}</li>
					<li>• {__('If your wp-config.php already defines', 'fiveprayer')} <Code>WP_HOME</Code> {__('or', 'fiveprayer')} <Code>WP_SITEURL</Code>{__(', that value always wins.', 'fiveprayer')}</li>
					<li>• {__('Saving the toggle is protected by a nonce and requires the', 'fiveprayer')} <Code>manage_options</Code> {__('capability.', 'fiveprayer')}</li>
				</ul>
			</div>

			{/* Troubleshooting */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Troubleshooting', 'fiveprayer')}</h3>
				<div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-4">
					<p className="text-gray-700 text-sm">
						{__('For a complete, ordered list of every known cause (Windows firewall network profiles, guest networks, client isolation, public-IP attempts and more) see the', 'fiveprayer')}{' '}
						<Link to="/documentation/localtesting-troubleshooting" className="text-green-700 font-semibold underline">{__('Share on Local Network — Issues & Fixes', 'fiveprayer')}</Link>{' '}
						{__('guide.', 'fiveprayer')}
					</p>
				</div>
				<div className="space-y-4">
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('The page times out / never loads', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">{__('This means the request never reaches WordPress — the site’s web server is listening only on 127.0.0.1 (localhost) instead of on the network interface, so the LAN IP is unreachable. The server must listen on all interfaces (0.0.0.0) for LAN access; the plugin cannot change this. LocalWP, for example, binds to localhost by default — edit the site’s nginx config to “listen <port>;” (instead of “listen 127.0.0.1:<port>;”) and restart the site. On Windows you may also need to allow inbound connections for the web server through the firewall.', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('The phone still cannot load the site', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">{__('Check that both devices are on the same network and that your computer’s firewall allows incoming connections on the site port. The usual cause is a Windows network profile set to “Public” with inbound blocked — see the', 'fiveprayer')} <Link to="/documentation/localtesting-troubleshooting" className="text-green-700 font-semibold underline">{__('Issues & Fixes', 'fiveprayer')}</Link> {__('guide for the exact fix.', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('The row warns that the current address is not local', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm mb-2">{__('Your environment uses an address that is not recognised as private/local. Add it with this filter (in your theme’s functions.php or a small custom plugin):', 'fiveprayer')}</p>
						<div className="rounded-lg overflow-hidden border border-gray-200">
							<pre className="bg-gray-950 p-4 overflow-x-auto"><code className="text-emerald-400 font-mono text-sm leading-relaxed">{`add_filter( 'fiveprayer_local_testing_allowed_hosts', function ( $patterns ) {\n    $patterns[] = '/^my-dev-box\\.lan(?::\\d+)?$/';\n    return $patterns;\n} );`}</code></pre>
						</div>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('The switch is on but nothing changes', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">{__('The override only applies when the request host is a local/private address. On a real public domain it stays inactive on purpose, so a live website is never affected.', 'fiveprayer')}</p>
					</div>
				</div>
			</div>

			{/* Developer reference */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Developer reference', 'fiveprayer')}</h3>
				<div className="overflow-x-auto">
					<table className="w-full text-sm">
						<tbody>
							{[
								[__('Option name', 'fiveprayer'), 'fiveprayer_local_testing_mode'],
								[__('Stored values', 'fiveprayer'), '1 = on, 0 = off'],
								[__('Admin screen', 'fiveprayer'), 'Customizing → Configure Settings → TV Display Mode'],
								[__('Filter', 'fiveprayer'), 'fiveprayer_local_testing_allowed_hosts'],
								[__('Constants', 'fiveprayer'), 'WP_HOME, WP_SITEURL'],
							].map(([label, value], i) => (
								<tr key={i} className="border-b border-gray-100 last:border-0">
									<td className="py-2 pr-4 font-semibold text-gray-600 whitespace-nowrap">{label}</td>
									<td className="py-2"><Code>{value}</Code></td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
				<p className="text-gray-500 text-xs mt-3">
					{__('The URL override is applied on plugins_loaded priority 1, before any other plugin runs, so every generated link already points at the network address.', 'fiveprayer')}
				</p>
			</div>

			{/* Tips */}
			<div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
				<h3 className="text-xl font-semibold text-blue-800 mb-3">{__('Tips', 'fiveprayer')}</h3>
				<ul className="text-blue-700 space-y-2">						<li>{__('• Leave the setting off on any site that is publicly reachable — it is meant for local networks (a mosque display box, a phone on the same Wi-Fi) only.', 'fiveprayer')}</li>
					<li>{__('• Use your computer’s IP, not its hostname, from the other device.', 'fiveprayer')}</li>
					<li>{__('• Never type localhost on the phone or TV — localhost always means the device you are holding.', 'fiveprayer')}</li>
					<li>{__('• If your local tool offers a “Live Link”, that URL works with this setting too.', 'fiveprayer')}</li>
				</ul>
			</div>
		</div>
	);
};

export default LocalTestingModeDoc;

/**
 * LocalNetworkTroubleshootingDoc
 *
 * Companion to LocalTestingModeDoc. Documents the real-world problems that
 * stop a locally-hosted site from opening on another device (phone, tablet,
 * second computer) and the exact fix for each one.
 *
 * Every example is rendered from the address the user is actually browsing
 * (`getSiteAddress()`), never a hard-coded IP or port, so the instructions stay
 * correct on any machine.
 *
 * @module Docs/LocalNetworkTroubleshootingDoc
 */
import React from 'react';
import { __ } from '@wordpress/i18n';
import { getSiteAddress, EXAMPLE_LAN_HOST } from '../../utils/siteAddress';

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm text-sm break-all">{children}</code>
);

const Block: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
	<div className="rounded-lg overflow-hidden border border-gray-200">
		<div className="bg-gray-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
		<pre className="bg-gray-950 p-4 overflow-x-auto"><code className="text-emerald-400 font-mono text-sm leading-relaxed">{children}</code></pre>
	</div>
);

const Issue: React.FC<{ n: string; title: string; symptom: string; children: React.ReactNode }> = ({ n, title, symptom, children }) => (
	<div className="border border-gray-200 rounded-2xl overflow-hidden">
		<div className="flex items-start gap-3 p-4 bg-gray-50 border-b border-gray-200">
			<span className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-sm shrink-0">{n}</span>
			<div>
				<p className="font-semibold text-gray-800">{title}</p>
				<p className="text-gray-500 text-sm mt-0.5">
					<span className="font-medium text-gray-600">{__('Symptom:', 'fiveprayer')}</span> {symptom}
				</p>
			</div>
		</div>
		<div className="p-4 space-y-3 text-gray-700 text-sm">{children}</div>
	</div>
);

const Fix: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<div className="bg-green-50 border border-green-200 rounded-lg p-3">
		<p className="text-xs font-semibold uppercase tracking-wide text-green-700 mb-1">{__('Fix', 'fiveprayer')}</p>
		<div className="text-gray-700 text-sm space-y-2">{children}</div>
	</div>
);

const LocalNetworkTroubleshootingDoc: React.FC = () => {
	// Resolved from the live admin page, so every example below shows this
	// installation's own address and port.
	// Resolved from the live admin page. `base` is this admin page's address;
	// `lanBase` is the address another device (phone, tablet, TV) must type.
	// Anything the user does on the other device uses `lanBase`, never `base`,
	// because a loopback address cannot be opened from another machine.
	const { base, host, port, subnet, isIpv4, lanBase, lanHost, lanHostPort, isLoopback } =
		getSiteAddress();
	const subnetExample = isIpv4 ? `${subnet}.x` : '<your-subnet>.x';

	return (
		<div className="max-w-6xl mx-auto p-6">
			{/* Header */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{__('Share on Local Network — Issues & Fixes', 'fiveprayer')}</h2>
				<p className="text-lg text-gray-700 text-center">
					{__('The site opens on your computer but not on your phone, tablet or another computer. Every known cause is listed below with the exact fix. Work through them in order — the answer is almost always one of the first three.', 'fiveprayer')}
				</p>
				<div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-3 text-left space-y-1">
					<p className="text-sm text-gray-800">
						{__('On the phone, tablet or TV, open this address — never localhost:', 'fiveprayer')}{' '}
						<Code>{lanBase}</Code>
					</p>
					{isLoopback ? (
						<p className="text-xs text-gray-500">
							{__('You are viewing the admin from', 'fiveprayer')} <Code>{host}</Code>{__(' — that is normal for a local site, but that address only works on this computer. Every example below already uses the network address instead. The', 'fiveprayer')} <Code>{EXAMPLE_LAN_HOST}</Code> {__('in those examples is only an example, so replace it with your own IP from step 1.', 'fiveprayer')}
						</p>
					) : (
						<p className="text-xs text-gray-500">
							{__('This is already a network address, so the examples below match your setup exactly.', 'fiveprayer')}
						</p>
					)}
				</div>
			</div>

			{/* Firewall — the question everyone asks */}
			<div className="bg-amber-50 border border-amber-300 p-6 rounded-2xl shadow-xs mb-6">
				<h3 className="text-xl font-semibold text-amber-900 mb-3">{__('Do I need to allow anything in my firewall?', 'fiveprayer')}</h3>
				<p className="text-gray-700 text-sm mb-3">
					{__('On Windows, usually yes. Your phone or tablet connects', 'fiveprayer')} <strong>{__('to', 'fiveprayer')}</strong> {__('this computer, so Windows Firewall needs an', 'fiveprayer')} <strong>{__('inbound', 'fiveprayer')}</strong> {__('allow rule for the site port. The plugin cannot open the firewall for you — it runs inside the web server, after the connection has already been accepted.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 text-sm mb-3">
					{__('There are two separate things to check, and the second one catches almost everybody:', 'fiveprayer')}
				</p>
				<div className="bg-white border border-amber-200 rounded-lg p-3 mb-4">
					<p className="text-gray-700 text-sm">
						<strong>{__('Which port?', 'fiveprayer')}</strong>{' '}
						{__('The port your site is served on — the number after the', 'fiveprayer')} <Code>:</Code> {__('in your site address', 'fiveprayer')} <Code>{base}</Code>{__('. For this site that is', 'fiveprayer')} <Code>{port}</Code>{__('. If your address has no', 'fiveprayer')} <Code>:</Code> {__('at all, the site uses the default web port and there is usually nothing to add — and if you serve the site on a different port, use that number instead of the one in the commands below.', 'fiveprayer')}
					</p>
				</div>
				<ol className="text-gray-700 text-sm list-decimal pl-5 space-y-1 mb-4">
					<li>{__('The port has an allow rule for incoming TCP.', 'fiveprayer')}</li>
					<li>{__('The network profile is not set to “block all incoming connections”. Windows can be set to ignore the allowed list entirely, which silently defeats step 1 — see Issue 2.', 'fiveprayer')}</li>
				</ol>
				<div className="space-y-3">
					<Block label={__('Allow the site port (elevated PowerShell)', 'fiveprayer')}>{`netsh advfirewall firewall add rule name="FivePrayer Local ${port}" dir=in action=allow protocol=TCP localport=${port} profile=domain,private,public`}</Block>
					<Block label={__('Check what your network is doing', 'fiveprayer')}>{`# Which network category is active, and what is its name?
Get-NetConnectionProfile

# If this prints BlockInboundAlways, inbound allow rules are IGNORED.
netsh advfirewall show publicprofile`}</Block>
					<Block label={__('Fix the “block all incoming” case (elevated)', 'fiveprayer')}>{`# Use the InterfaceAlias shown by Get-NetConnectionProfile above.
Set-NetConnectionProfile -InterfaceAlias "<your-wifi-name>" -NetworkCategory Private`}</Block>
					<Block label={__('Remove the rule again later (elevated)', 'fiveprayer')}>{`netsh advfirewall firewall delete rule name="FivePrayer Local ${port}"`}</Block>
				</div>
				<p className="text-gray-700 text-sm mt-4">
					{__('macOS usually needs nothing for a local dev server. On Linux, if you run ufw:', 'fiveprayer')} <Code>{`sudo ufw allow ${port}/tcp`}</Code>
				</p>
				<p className="text-gray-700 text-sm mt-2">
					{__('Using a third-party firewall manager (for example Malwarebytes Windows Firewall Control)? It can override these rules and re-apply its own — see Issue 3.', 'fiveprayer')}
				</p>
			</div>

			{/* How to tell where it breaks */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('First: find out where the request stops', 'fiveprayer')}</h3>
				<p className="text-gray-700 mb-3 text-sm">
					{__('Everything below is easier once you know whether the request reaches the web server at all. Run these on the computer that hosts the site.', 'fiveprayer')}
				</p>
				<div className="space-y-3">
					<Block label={__('1. What is my local IP?', 'fiveprayer')}>{`# Windows (Command Prompt or PowerShell)
ipconfig

# macOS
ipconfig getifaddr en0

# Linux
hostname -I`}</Block>
					<Block label={__('2. Is the web server listening on the network (not just localhost)?', 'fiveprayer')}>{`# Windows
netstat -ano | findstr :${port}

# macOS / Linux
lsof -nP -iTCP:${port} -sTCP:LISTEN`}</Block>
					<Block label={__('3. Does the site answer on this address from the computer itself?', 'fiveprayer')}>{`# Use PowerShell, NOT curl (see Issue 5)
Invoke-WebRequest ${lanBase}/ -UseBasicParsing | Select-Object StatusCode`}</Block>
				</div>
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
					<p className="text-sm text-gray-700">
						<strong>{__('Reading the result:', 'fiveprayer')}</strong>{' '}
						{__('if step 2 shows only', 'fiveprayer')} <Code>127.0.0.1:{port}</Code> {__('or', 'fiveprayer')} <Code>[::1]:{port}</Code>{__(', the server is localhost-only → Issue 1. If step 3 fails on the computer itself, the problem is the server or your firewall → Issue 1. If step 3 works but the phone still fails, the phone is not reaching the computer → Issues 2 and 3.', 'fiveprayer')}
					</p>
				</div>
			</div>

			{/* Issues */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Known issues and fixes', 'fiveprayer')}</h3>
				<div className="space-y-4">

					<Issue
						n="1"
						title={__('The web server only listens on localhost', 'fiveprayer')}
						symptom={__('the page times out on the phone and never loads; step 2 above shows only a loopback address.', 'fiveprayer')}
					>
						<p>
							{__('A local tool that binds only to loopback is physically unreachable from other devices. The plugin cannot change this — it only runs after the request reaches WordPress.', 'fiveprayer')}
						</p>
						<Fix>
							<p>{__('Make the site listen on all interfaces (0.0.0.0).', 'fiveprayer')}</p>
							<Block label={__('LocalWP — edit the site’s nginx config', 'fiveprayer')}>{`# conf/nginx/site.conf.hbs
# change:
listen 127.0.0.1:{{port}};
# to:
listen {{port}};`}</Block>
							<p>{__('Then restart the site in your local tool and re-check with', 'fiveprayer')} <Code>{`netstat -ano | findstr :${port}`}</Code>{__(', you want to see', 'fiveprayer')} <Code>0.0.0.0:{port}</Code>{__('.', 'fiveprayer')}</p>
						</Fix>
					</Issue>

					<Issue
						n="2"
						title={__('Windows Firewall is silently dropping every inbound connection', 'fiveprayer')}
						symptom={__('the site works in your browser on the computer, but every other device times out — even though you already added an “allow” rule for the port.', 'fiveprayer')}
					>
						<p>
							{__('This is the most common cause and the most confusing one. On Windows, the active network profile matters. If your Wi-Fi is classified as a', 'fiveprayer')}{' '}
							<strong>{__('Public', 'fiveprayer')}</strong> {__('network and the Public profile is set to', 'fiveprayer')}{' '}
							<Code>BlockInboundAlways</Code>{__(', Windows blocks', 'fiveprayer')}{' '}
							<strong>{__('all incoming connections including the ones in the allowed list', 'fiveprayer')}</strong>
							{__(' — so your allow rule for the site port is ignored. Note also that Windows gives', 'fiveprayer')}{' '}
							<strong>{__('Block rules priority over Allow rules', 'fiveprayer')}</strong>{__('.', 'fiveprayer')}
						</p>
						<Block label={__('Check which profile you are on and what it does', 'fiveprayer')}>{`# Which category is my Wi-Fi using?
Get-NetConnectionProfile

# What is the Public profile policy?
netsh advfirewall show publicprofile
# Look for: Firewall Policy  BlockInboundAlways,BlockOutbound
# BlockInboundAlways  ->  inbound allow rules are IGNORED`}</Block>
						<Fix>
							<p>{__('Classify the network as Private (recommended, and it only affects this one Wi-Fi network). Run in an elevated PowerShell window, using the InterfaceAlias from above:', 'fiveprayer')}</p>
							<Block label={__('Recommended fix', 'fiveprayer')}>{`Set-NetConnectionProfile -InterfaceAlias "<your-wifi-name>" -NetworkCategory Private`}</Block>
							<p>{__('If you prefer to keep the network Public, change the Public policy instead (this is broader — it applies to every public network your PC joins):', 'fiveprayer')}</p>
							<Block label={__('Alternative (less precise)', 'fiveprayer')}>{`netsh advfirewall set publicprofile firewallpolicy blockinbound,allowoutbound`}</Block>
							<p>{__('Then confirm the site port is actually allowed, on the profiles you use:', 'fiveprayer')}</p>
							<Block label={__('Allow the site port (elevated)', 'fiveprayer')}>{`netsh advfirewall firewall add rule name="FivePrayer Local ${port}" dir=in action=allow protocol=TCP localport=${port} profile=domain,private,public`}</Block>
							<p className="text-gray-500">{__('To undo the network change later:', 'fiveprayer')} <Code>{`Set-NetConnectionProfile -InterfaceAlias "<your-wifi-name>" -NetworkCategory Public`}</Code></p>
						</Fix>
						<p>
							{__('Confirmed with:', 'fiveprayer')} <Code>netsh advfirewall show privateprofile</Code> {__('showing', 'fiveprayer')} <Code>BlockInbound,BlockOutbound</Code> {__('(normal — Allow rules are honoured) rather than', 'fiveprayer')} <Code>BlockInboundAlways</Code>{__('.', 'fiveprayer')}
						</p>
					</Issue>

					<Issue
						n="3"
						title={__('A third-party firewall manager is overriding Windows Firewall', 'fiveprayer')}
						symptom={__('rules you add disappear, are duplicated, or appear to be ignored.', 'fiveprayer')}
					>
						<p>
							{__('Tools such as', 'fiveprayer')} <strong>{__('Malwarebytes Windows Firewall Control', 'fiveprayer')}</strong> {__('manage the Windows firewall for you. They can set the outbound policy to “Block”, create their own Block rules, and re-apply them after you change something manually. Rules created by these tools show up with a', 'fiveprayer')} <Code>Grouping</Code> {__('such as “Windows Firewall Control”.', 'fiveprayer')}
						</p>
						<Fix>
							<p>{__('Open the tool and check two things:', 'fiveprayer')}</p>
							<ul className="list-disc pl-5 space-y-1">
								<li>{__('Its', 'fiveprayer')} <strong>{__('inbound', 'fiveprayer')}</strong> {__('policy for the active network profile must not be “Block all”.', 'fiveprayer')}</li>
								<li>{__('There must be no', 'fiveprayer')} <strong>{__('Block', 'fiveprayer')}</strong> {__('rule for your web server executable (nginx.exe / httpd.exe) or for the site port.', 'fiveprayer')}</li>
							</ul>
							<Block label={__('List any Block rules that could interfere', 'fiveprayer')}>{`Get-NetFirewallRule -Direction Inbound -Action Block -Enabled True |
  Where-Object { $_.DisplayName -match 'nginx|${port}|LocalWP|fiveprayer' } |
  Select-Object DisplayName`}</Block>
							<p>{__('If a Block rule appears, disable it in the tool (or with', 'fiveprayer')} <Code>Disable-NetFirewallRule</Code>{__(') and retry.', 'fiveprayer')}</p>
						</Fix>
					</Issue>

					<Issue
						n="4"
						title={__('The phone is on a different network, a guest network, or behind client isolation', 'fiveprayer')}
						symptom={__('the site works from the computer, but the phone cannot reach it at all; it may also silently fall back to mobile data.', 'fiveprayer')}
					>
						<p>{__('Check these in order:', 'fiveprayer')}</p>
						<ul className="list-disc pl-5 space-y-1">
							<li>{__('On the phone: Settings → About phone → Status → IP address. It must be in the', 'fiveprayer')} <strong>{__('same subnet', 'fiveprayer')}</strong> {__('as the computer (here that means', 'fiveprayer')} <Code>{subnetExample}</Code>{__(').', 'fiveprayer')}</li>
							<li>{__('Turn', 'fiveprayer')} <strong>{__('mobile data off', 'fiveprayer')}</strong> {__('while you check it, so the phone cannot route the request over 4G.', 'fiveprayer')}</li>
							<li>{__('The Wi-Fi name (SSID) must be', 'fiveprayer')} <strong>{__('exactly the same', 'fiveprayer')}</strong> {__('as the computer’s — a “-Guest”, “_5G” or extender SSID is usually a separate network.', 'fiveprayer')}</li>
							<li>{__('If the phone is on the same subnet but still cannot connect, the router has', 'fiveprayer')} <strong>{__('AP isolation / client isolation', 'fiveprayer')}</strong> {__('enabled. Turn it off in the router’s wireless settings and disable any Guest Network.', 'fiveprayer')}</li>
						</ul>
						<Fix>
							<p>{__('Prove it from the computer. Replace the address with the one your phone reports; if the computer can reach the phone, the LAN path is fine and the problem is the firewall (Issue 2), not isolation:', 'fiveprayer')}</p>
							<Block label={__('From the computer', 'fiveprayer')}>{`ping <phone-ip>
arp -a      # is the phone listed?`}</Block>
							<p>{__('Note: modern Android and iOS devices use a', 'fiveprayer')} <strong>{__('randomised MAC address', 'fiveprayer')}</strong> {__('per Wi-Fi network, so the phone can look like an unfamiliar device in the router’s client list.', 'fiveprayer')}</p>
						</Fix>
					</Issue>

					<Issue
						n="5"
						title={__('Command-line tests wrongly report the site as dead', 'fiveprayer')}
						symptom={__('curl prints 000, or “connect ... failed: Bad access”.', 'fiveprayer')}
					>
						<p>
							{__('“Bad access” is Windows error', 'fiveprayer')} <Code>WSAEACCES</Code>{__(' — a firewall is blocking the', 'fiveprayer')} <strong>{__('tool', 'fiveprayer')}</strong>{__(', not the site. Windows Firewall Control, for example, ships a Block rule for', 'fiveprayer')} <Code>curl.exe</Code>{__(', so every curl-based test fails even when the site is perfectly reachable. This wastes a lot of time if you trust the output.', 'fiveprayer')}
						</p>
						<Fix>
							<p>{__('Use PowerShell for diagnostics instead, or remove the Block rule for curl.exe:', 'fiveprayer')}</p>
							<Block label={__('Reliable checks that ignore the curl block', 'fiveprayer')}>{`Invoke-WebRequest ${lanBase}/ -UseBasicParsing | Select-Object StatusCode
Test-NetConnection ${lanHost} -Port ${port}`}</Block>
						</Fix>
					</Issue>

					<Issue
						n="6"
						title={__('Trying to reach the site over the public (WAN) IP', 'fiveprayer')}
						symptom={__('the public address with the site port never loads, from any device.', 'fiveprayer')}
					>
						<p>{__('Using your public IP instead of the LAN address usually cannot work, for three independent reasons:', 'fiveprayer')}</p>
						<ul className="list-disc pl-5 space-y-1">
							<li>{__('The router must forward WAN port', 'fiveprayer')} <Code>{port}</Code> {__('to this computer — it is not enabled by default.', 'fiveprayer')}</li>
							<li>{__('Even with forwarding, most home routers do not support', 'fiveprayer')} <strong>{__('NAT loopback (hairpin)', 'fiveprayer')}</strong>{__(', so a device on the same Wi-Fi cannot reach the public IP.', 'fiveprayer')}</li>
							<li>{__('If your ISP uses', 'fiveprayer')} <strong>{__('CGNAT', 'fiveprayer')}</strong>{__(', inbound port forwarding is impossible.', 'fiveprayer')}</li>
						</ul>
						<Fix>
							<p>
								{__('On top of that, the plugin’s override only runs for', 'fiveprayer')} <strong>{__('loopback / private', 'fiveprayer')}</strong> {__('hosts (localhost, 127.0.0.1, 10.x, 192.168.x, 172.16–31.x, *.local, *.test). A public address is intentionally ignored, so links would still point at the wrong URL even if the request arrived.', 'fiveprayer')}
							</p>
							<p>{__('Use the LAN address, or a tunnel such as LocalWP’s Live Link or a secure tunnel service, and give the tunnel host its own pattern if you need the override:', 'fiveprayer')}</p>
							<Block label={__('functions.php or a small custom plugin', 'fiveprayer')}>{`add_filter( 'fiveprayer_local_testing_allowed_hosts', function ( $patterns ) {
    $patterns[] = '/^my-tunnel\\.example\\.com(?::\\d+)?$/';
    return $patterns;
} );`}</Block>
						</Fix>
					</Issue>

					<Issue
						n="7"
						title={__('The card warns that the current address is not local', 'fiveprayer')}
						symptom={__('the “Share on Local Network” row on the TV Display Mode page says the current address is not recognised as local.', 'fiveprayer')}
					>
						<p>{__('Your environment uses a host that is not in the built-in list. Add it with the filter:', 'fiveprayer')}</p>
						<Block label={__('functions.php or a small custom plugin', 'fiveprayer')}>{`add_filter( 'fiveprayer_local_testing_allowed_hosts', function ( $patterns ) {
    $patterns[] = '/^my-dev-box\\.lan(?::\\d+)?$/';
    return $patterns;
} );`}</Block>
					</Issue>

					<Issue
						n="8"
						title={__('The toggle is on but nothing changes', 'fiveprayer')}
						symptom={__('links still point at localhost after enabling the setting.', 'fiveprayer')}
					>
						<p>{__('The override only applies when the request host is itself a local/private address. On a real domain it is intentionally inactive. It also never overrides', 'fiveprayer')} <Code>WP_HOME</Code> {__('or', 'fiveprayer')} <Code>WP_SITEURL</Code> {__('if you defined them in wp-config.php — those always win.', 'fiveprayer')}</p>
						<p>{__('Also make sure you are actually opening the site through the LAN address and not through localhost:', 'fiveprayer')} <Code>{lanBase}</Code></p>
					</Issue>

					<Issue
						n="9"
						title={__('The phone browser breaks the URL', 'fiveprayer')}
						symptom={__('the phone shows a certificate warning, an HTTPS error, or a captive-portal page.', 'fiveprayer')}
					>
						<p>{__('Local sites are served over plain HTTP. The phone must not be forcing HTTPS, and it must not be using a Wi-Fi proxy.', 'fiveprayer')}</p>
						<Fix>
							<ul className="list-disc pl-5 space-y-1">
								<li>{__('Type the URL with the', 'fiveprayer')} <Code>http://</Code> {__('prefix explicitly, and use the network address — not localhost:', 'fiveprayer')} <Code>{lanBase}</Code></li>
								<li>{__('Android: Settings → Network & internet → Wi-Fi → (your network) → Advanced →', 'fiveprayer')} <strong>{__('Proxy: None', 'fiveprayer')}</strong></li>
								<li>{__('If the browser keeps upgrading to HTTPS, try a private/incognito tab.', 'fiveprayer')}</li>
							</ul>
						</Fix>
					</Issue>

					<Issue
						n="10"
						title={__('The page loads, but the plugin’s colours and TV Display Mode do nothing on the phone', 'fiveprayer')}
						symptom={__('the phone shows the page but with no colours at all, and TV Display Mode has no effect, while the same page looks correct on the computer.', 'fiveprayer')}
					>
						<p>
							{__('The request reaches WordPress, so the page renders, but the assets the plugin adds are still addressed to the host the site was installed on — for example', 'fiveprayer')}{' '}
							<Code>{`http://<your-old-host>:${port}/wp-content/uploads/fiveprayer-cache/fiveprayer-combined-....css`}</Code>{__(', usually a', 'fiveprayer')}{' '}
							<Code>localhost</Code>{__('URL. A phone cannot resolve that host, so every one of those files fails and the page falls back to unstyled output. That bundle carries the colours (odd/even rows, header, highlight/today row, border), and', 'fiveprayer')}{' '}
							<Code>tv-display.js</Code> {__('is what makes a TV page scale to fill the screen.', 'fiveprayer')}
						</p>
						<p>
							{__('The cause is that WordPress defines the', 'fiveprayer')} <Code>WP_CONTENT_URL</Code> {__('constant from the stored Site URL', 'fiveprayer')}{' '}
							<strong>{__('before plugins load', 'fiveprayer')}</strong>{__(', so', 'fiveprayer')} <Code>plugins_url()</Code>{__(',', 'fiveprayer')} <Code>wp_upload_dir()</Code> {__('and the theme URL builder keep returning the old host even though the page links themselves are already correct.', 'fiveprayer')}
						</p>
						<Fix>
							<p>
								{__('Share on Local Network rewrites these URLs too. To confirm it is working, open the page source on the phone: every', 'fiveprayer')} <Code>fiveprayer</Code> {__('asset URL must start with', 'fiveprayer')} <Code>{lanHostPort}</Code>{__(' and not localhost, and the stylesheet itself must return', 'fiveprayer')} <Code>200</Code>{__(':', 'fiveprayer')}
							</p>
							<Block label={__('Verify an asset URL is reachable', 'fiveprayer')}>{`Invoke-WebRequest ${lanBase}/wp-content/uploads/fiveprayer-cache/<file>.css -UseBasicParsing | Select-Object StatusCode`}</Block>
							<p>
								{__('If the URLs still say localhost, Share on Local Network is off, or the request is not arriving on a private address — see the', 'fiveprayer')} <strong>{__('Share on Local Network', 'fiveprayer')}</strong> {__('guide.', 'fiveprayer')}
							</p>
						</Fix>
					</Issue>

				</div>
			</div>

			{/* Order of operations */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('The 5-minute checklist', 'fiveprayer')}</h3>
				<ol className="text-gray-700 space-y-2 text-sm list-decimal pl-5">
					<li>{__('Confirm the server listens on', 'fiveprayer')} <Code>0.0.0.0:{port}</Code> {__('(Issue 1).', 'fiveprayer')}</li>
					<li>{__('Confirm the Wi-Fi network is', 'fiveprayer')} <strong>{__('Private', 'fiveprayer')}</strong>{__(':', 'fiveprayer')} <Code>Get-NetConnectionProfile</Code> {__('(Issue 2).', 'fiveprayer')}</li>
					<li>{__('Confirm the Public profile is not', 'fiveprayer')} <Code>BlockInboundAlways</Code> {__('and that an inbound allow rule exists for port', 'fiveprayer')} <Code>{port}</Code> {__('(Issues 2 & 3).', 'fiveprayer')}</li>
					<li>{__('Confirm the phone is on the same subnet with mobile data off (Issue 4).', 'fiveprayer')}</li>
					<li>{__('Confirm the phone has no Wi-Fi proxy and you typed', 'fiveprayer')} <Code>http://</Code> {__('(Issue 9).', 'fiveprayer')}</li>
					<li>{__('Confirm the plugin’s CSS/JS on the phone use', 'fiveprayer')} <Code>{lanHostPort}</Code>{__(', not localhost (Issue 10).', 'fiveprayer')}</li>
				</ol>
			</div>

			{/* Tips */}
			<div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
				<h3 className="text-xl font-semibold text-blue-800 mb-3">{__('Tips', 'fiveprayer')}</h3>
				<ul className="text-blue-700 space-y-2">
					<li>{__('• The LAN address is an IP, so DNS settings on the phone are irrelevant — there is nothing to change there.', 'fiveprayer')}</li>
					<li>{__('• Always open it from the other device with this computer’s network address, never localhost:', 'fiveprayer')} <Code>{lanBase}</Code></li>
					<li>{__('• Prefer PowerShell over curl for Windows diagnostics — third-party firewall tools commonly block curl.exe.', 'fiveprayer')}</li>
					<li>{__('• Turn the setting off when you are finished; nothing was written to the database, so there is nothing to clean up.', 'fiveprayer')}</li>
					<li>{__('• Never enable this on a site that is publicly reachable — it is a local-development tool.', 'fiveprayer')}</li>
				</ul>
			</div>
		</div>
	);
};

export default LocalNetworkTroubleshootingDoc;

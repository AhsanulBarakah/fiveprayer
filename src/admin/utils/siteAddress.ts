/**
 * Site address helper.
 *
 * Admin help screens need to show the user's *real* address and port in their
 * examples (firewall commands, netstat checks, URLs). Hard-coding values such
 * as `http://192.168.1.104:10010` is wrong for anybody else's machine, so the
 * address is resolved at runtime from the value the plugin localizes into
 * `window.FivePrayerData.siteUrl`, falling back to the current window origin.
 *
 * The helper deliberately exposes two addresses:
 *
 *  - `base`    — the address this admin page is being viewed on. It is
 *                perfectly normal for this to be `http://localhost:10010`
 *                when the site is installed locally.
 *  - `lanBase` — the address **another device** (phone, tablet, TV) must type.
 *                It is identical to `base` when the site is already being
 *                viewed over a network address, but when `base` is a loopback
 *                address it becomes an example such as
 *                `http://192.168.1.104:10010`, whose only variable part is the
 *                computer's own IP.
 *
 * Help screens that describe something the user does *on the phone or TV* must
 * use `lanBase` / `lanHost` / `lanHostPort`, never `base`: `localhost` always
 * means "this device", so on a phone it points at the phone itself and every
 * link, stylesheet and TV Display Mode script fails.
 *
 * @module utils/siteAddress
 */

export interface SiteAddress {
	/** Normalised base URL of this admin page, e.g. `http://localhost:10010`. */
	base: string;
	/** Host without the port, e.g. `192.168.1.104` or `localhost`. */
	host: string;
	/** Host including the port, e.g. `192.168.1.104:10010`. */
	hostPort: string;
	/** Effective port, e.g. `10010` (falls back to 80/443 when implicit). */
	port: string;
	/** The port exactly as written in the address, or '' when it has none. */
	explicitPort: string;
	/** `/24` prefix when the host is an IPv4 literal, otherwise the host. */
	subnet: string;
	/** Whether the host is an IPv4 literal (so `subnet` is meaningful). */
	isIpv4: boolean;
	/** Whether `base` is a loopback address that only works on this computer. */
	isLoopback: boolean;
	/** Host another device must use: the real host, or the example IP. */
	lanHost: string;
	/** `host:port` another device must use. */
	lanHostPort: string;
	/** Full URL another device must use, e.g. `http://192.168.1.104:10010`. */
	lanBase: string;
}

/**
 * IP shown in the help screens when the real one cannot be resolved because
 * the admin is being viewed over a loopback address.
 *
 * A concrete example (`192.168.1.104`) is used on purpose: users follow an
 * example far more reliably than an abstract placeholder, and every screen
 * that prints it also says plainly that it is only an example and shows how to
 * find the real IP for Windows, macOS and Linux. Only the middle numbers ever
 * change, so the address stays recognisable.
 */
export const EXAMPLE_LAN_HOST = '192.168.1.104';

/** Example address used in the help screens, e.g. `192.168.1.104:10010`. */
export const EXAMPLE_LAN_BASE = `http://${EXAMPLE_LAN_HOST}:10010`;

/** Hosts that can only ever be reached from the computer itself. */
const LOOPBACK_HOSTS = ['localhost', '127.0.0.1', '::1'];

/**
 * Is this host a loopback address (only valid on the computer itself)?
 *
 * @param host Hostname or IP literal, without the port.
 * @return True for `localhost`, `127.0.0.0/8` and `::1`.
 */
const isLoopbackHost = (host: string): boolean =>
	LOOPBACK_HOSTS.includes(host.toLowerCase()) || /^127\./.test(host);

/**
 * Resolve the address the site is currently being viewed on.
 *
 * Never throws: an unparseable or missing value degrades to a readable
 * placeholder so the surrounding instructions stay usable.
 *
 * @return Resolved address components.
 */
export const getSiteAddress = (): SiteAddress => {
	let candidate = '';

	if (typeof window !== 'undefined') {
		const localized = (window as any).FivePrayerData?.siteUrl;
		candidate =
			typeof localized === 'string' && localized !== ''
				? localized
				: window.location?.origin || '';
	}

	let url: URL | null = null;
	if (candidate !== '') {
		try {
			url = new URL(candidate);
		} catch {
			url = null;
		}
	}

	const host = url?.hostname || EXAMPLE_LAN_HOST;
	const explicitPort = url?.port || '';
	const port = explicitPort || (url?.protocol === 'https:' ? '443' : '80');
	const hostPort = url?.host || `${host}:${port}`;
	const isIpv4 = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host);
	const subnet = isIpv4 ? host.split('.').slice(0, 3).join('.') : host;

	// The address another device must use. A loopback admin address cannot be
	// typed on a phone or TV, so it is replaced with an example IP the user
	// swaps for their computer's own network IP. The port is kept, because the
	// site is still served on that same port.
	const loopback = isLoopbackHost(host);
	const lanHost = loopback ? EXAMPLE_LAN_HOST : host;
	const lanHostPort = loopback
		? `${lanHost}${explicitPort ? `:${explicitPort}` : ''}`
		: hostPort;
	const lanBase = loopback
		? `${url?.protocol ?? 'http:'}//${lanHostPort}`
		: url
			? `${url.protocol}//${url.host}`
			: `http://${lanHostPort}`;

	return {
		base: url ? `${url.protocol}//${url.host}` : `http://${hostPort}`,
		host,
		hostPort,
		port,
		explicitPort,
		subnet,
		isIpv4,
		isLoopback: loopback,
		lanHost,
		lanHostPort,
		lanBase,
	};
};

export default getSiteAddress;

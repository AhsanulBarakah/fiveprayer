import React from 'react';
import { __ } from '@wordpress/i18n';

const ApiSecurityDocs: React.FC = () => {
  return (
    <div className="font-sans">
      {/* ===== OVERVIEW ===== */}
      <div id="overview" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h1 className="text-2xl font-bold mb-2">{__('FivePrayer API Security', 'fiveprayer')}</h1>
        <p className="mb-4 text-gray-700">{__('The FivePrayer API Security system protects your external API endpoints from abuse by detecting and blocking brute force attacks. When an IP address makes too many failed API key attempts, it is temporarily blocked. The system also supports email notifications so you can stay informed about security events.', 'fiveprayer')}</p>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="font-semibold text-gray-800 mb-1">{__('Quick Access', 'fiveprayer')}</p>
          <p className="text-gray-700 text-sm">{__('Navigate to ', 'fiveprayer')}<strong>{__('WordPress Admin → FivePrayer → API Security', 'fiveprayer')}</strong>{__(' to configure all settings.', 'fiveprayer')}</p>
        </div>
      </div>

      {/* ===== BRUTE FORCE PROTECTION ===== */}
      <div id="brute-force" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Brute Force Protection', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('The brute force protection system tracks failed API key attempts per IP address. When the configured threshold is reached, the IP is temporarily blocked from making further API requests.', 'fiveprayer')}</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-semibold text-gray-700">{__('Setting', 'fiveprayer')}</th>
                <th className="p-3 text-left font-semibold text-gray-700">{__('Description', 'fiveprayer')}</th>
                <th className="p-3 text-left font-semibold text-gray-700">{__('Default', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Enable brute force protection', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Toggles the entire brute force protection system on/off', 'fiveprayer')}</td>
                <td className="p-3"><span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-sm font-semibold">{__('Enabled', 'fiveprayer')}</span></td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Max Failed Attempts', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Number of failed API key attempts before an IP is blocked', 'fiveprayer')}</td>
                <td className="p-3">10</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Lockout Duration (minutes)', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('How long an IP remains blocked after reaching the max failed attempts', 'fiveprayer')}</td>
                <td className="p-3">15</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold text-gray-800 mb-2">{__('How It Works', 'fiveprayer')}</p>
          <ol className="text-gray-700 space-y-2 text-sm ml-4 list-decimal">
            <li>{__('Each failed API key attempt increments a counter for the requesting IP address', 'fiveprayer')}</li>
            <li>{__('The counter expires after the lockout duration — entry stays visible with ', 'fiveprayer')}<strong>{__('Expired', 'fiveprayer')}</strong>{__(' status until manually unblocked', 'fiveprayer')}</li>
            <li>{__('When the counter reaches the max failed attempts threshold, the IP is blocked', 'fiveprayer')}</li>
            <li>{__('Blocked IPs receive a ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('403 Forbidden', 'fiveprayer')}</code>{__(' response on subsequent API requests', 'fiveprayer')}</li>
            <li>{__('Once the lockout duration expires, the status changes to ', 'fiveprayer')}<strong>{__('Expired', 'fiveprayer')}</strong>{__(' but the entry stays visible in the list. Click ', 'fiveprayer')}<strong>{__('Unblock', 'fiveprayer')}</strong>{__(' to remove it manually', 'fiveprayer')}</li>
          </ol>
        </div>
      </div>

      {/* ===== BLOCKED / TRACKED IPS ===== */}
      <div id="tracked-ips" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Blocked / Tracked IPs Table', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('The ', 'fiveprayer')}<strong>{__('Blocked / Tracked IPs', 'fiveprayer')}</strong>{__(' section displays all IPs currently being monitored:', 'fiveprayer')}</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-semibold text-gray-700">{__('Column', 'fiveprayer')}</th>
                <th className="p-3 text-left font-semibold text-gray-700">{__('Description', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('IP Address', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('The tracked IP address', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Failed Attempts', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Current count of failed attempts', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Status', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-sm">{__('Blocked', 'fiveprayer')}</span>{__(' (at threshold) or ', 'fiveprayer')}<span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-sm">{__('Tracking', 'fiveprayer')}</span>{__(' (below threshold)', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Expires', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Time remaining before the tracking data expires. When expired, the entry stays visible with ', 'fiveprayer')}<strong>{__('Expired', 'fiveprayer')}</strong>{__(' status until manually unblocked', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Actions', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700"><code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('Unblock', 'fiveprayer')}</code>{__(' button (real IPs), or ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('Reset', 'fiveprayer')}</code> + <code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('Expire', 'fiveprayer')}</code>{__(' buttons (email cooldown)', 'fiveprayer')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-3">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Unblocking an IP', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm">{__('Click the ', 'fiveprayer')}<strong>{__('Unblock', 'fiveprayer')}</strong>{__(' button next to any blocked IP to immediately remove its tracking data and failed attempts counter. This allows the IP to resume making API requests.', 'fiveprayer')}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Reset vs Expire (Email Cooldown)', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('The table also shows an ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('email_cooldown', 'fiveprayer')}</code>{__(' entry when the notification cooldown is active:', 'fiveprayer')}</p>
            <ul className="text-gray-700 text-sm space-y-1">
              <li><strong>{__('Reset', 'fiveprayer')}</strong>{__(' — Clears the cooldown timer AND resets the escalation level back to Level 0. Use this when you want notifications to start fresh.', 'fiveprayer')}</li>
              <li><strong>{__('Expire', 'fiveprayer')}</strong>{__(' — Clears the cooldown timer only, keeping the escalation level intact. Use this to advance to the next escalation level without waiting for the timer to expire.', 'fiveprayer')}</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Global Reset Cooldown Button', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm">{__('When the escalating cooldown is active (a level badge is shown), a ', 'fiveprayer')}<strong>{__('Reset Cooldown', 'fiveprayer')}</strong>{__(' button also appears at the top of the card. This provides quick access to reset the cooldown even if the ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('email_cooldown', 'fiveprayer')}</code>{__(' table row has already been expired or removed.', 'fiveprayer')}</p>
          </div>
        </div>
      </div>

      {/* ===== PROXIES & CLOUDFLARE ===== */}
      <div id="proxies-cloudflare" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Proxies & Cloudflare', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('Brute force protection, per-key IP restrictions and the audit log all need the visitor\'s real IP address. FivePrayer uses the direct connection address, and only looks at forwarding headers when the request actually arrived through a proxy it can verify.', 'fiveprayer')}</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-semibold text-gray-700">{__('Feature', 'fiveprayer')}</th>
                <th className="p-3 text-left font-semibold text-gray-700">{__('Why the IP matters', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Brute force protection', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Failed attempts are counted per IP. If every visitor looks like the same proxy address, one attacker can lock out everyone.', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('API key IP restrictions', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('A key limited to an address or CIDR range only matches when the real client address is known.', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Blocked / Tracked IPs table and logs', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Shows which IP was blocked — a proxy address there makes the list hard to interpret and unblocking ineffective.', 'fiveprayer')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Cloudflare — detected automatically', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('If your site is behind the Cloudflare proxy (the orange-cloud setting in DNS), there is nothing to configure. Requests arrive from a Cloudflare edge address, FivePrayer recognises Cloudflare\'s published IPv4 and IPv6 ranges and uses the visitor address Cloudflare provides with the request.', 'fiveprayer')}</p>
            <ul className="text-gray-700 text-sm ml-4 list-disc space-y-1">
              <li>{__('Works on every Cloudflare plan, with or without caching', 'fiveprayer')}</li>
              <li>{__('Supports both IPv4 and IPv6 edge addresses', 'fiveprayer')}</li>
              <li>{__('Sites set to ', 'fiveprayer')}<strong>{__('DNS only', 'fiveprayer')}</strong>{__(' (grey cloud) are not proxied, so the visitor address is already visible — also no setup', 'fiveprayer')}</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Other proxies, load balancers and CDNs', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('A reverse proxy such as Nginx or HAProxy in front of PHP, a hosting load balancer, or a CDN other than Cloudflare must be listed once with the ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('fiveprayer_trusted_proxy_ips', 'fiveprayer')}</code>{__(' filter:', 'fiveprayer')}</p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono overflow-x-auto mb-2">{`add_filter('fiveprayer_trusted_proxy_ips', function () {
    return [
        '203.0.113.10',      // a single proxy address
        '10.0.0.0/8',        // or a whole range in CIDR notation
        '2001:db8::/32',     // IPv6 is supported too
    ];
});`}</pre>
            <p className="text-gray-700 text-sm mb-2">{__('Add it to a file in ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('wp-content/mu-plugins/', 'fiveprayer')}</code>{__(' or to your child theme\'s ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('functions.php', 'fiveprayer')}</code>{__(', so it survives plugin updates. Ask your host which address your site sees as the direct connection if you are unsure.', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm">{__('Using Cloudflare Tunnel (cloudflared)? The request then reaches your server from the tunnel itself, so add ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('127.0.0.1', 'fiveprayer')}</code>{__(' and ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('::1', 'fiveprayer')}</code>{__(' once — Cloudflare is still detected from its headers after that.', 'fiveprayer')}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">{__('Why forwarding headers are not trusted by default', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('Headers such as ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('X-Forwarded-For', 'fiveprayer')}</code>{__(' are written by whoever sends the request. Trusting them everywhere would let any visitor choose the address a failed attempt is blamed on — locking out an unrelated IP, or dodging the lockout entirely.', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm">{__('That is why they are only read when the direct connection is a known proxy, and why the address chain is read from the proxy end: a prefix added by the client is ignored.', 'fiveprayer')}</p>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Turning Cloudflare detection off', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('Only needed in unusual setups — for example when your site is not behind Cloudflare but receives traffic from an address inside Cloudflare\'s ranges. Return ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('false', 'fiveprayer')}</code>{__(' from this filter:', 'fiveprayer')}</p>
            <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono overflow-x-auto">{`add_filter('fiveprayer_trust_cloudflare_proxies', '__return_false');`}</pre>
          </div>
        </div>
      </div>

      {/* ===== EMAIL NOTIFICATIONS ===== */}
      <div id="email-notifications" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Email Notifications', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('When an IP address reaches the max failed attempts threshold and gets blocked, the system can send an email notification to alert you.', 'fiveprayer')}</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-semibold text-gray-700">{__('Setting', 'fiveprayer')}</th>
                <th className="p-3 text-left font-semibold text-gray-700">{__('Description', 'fiveprayer')}</th>
                <th className="p-3 text-left font-semibold text-gray-700">{__('Default', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Send email when IP is blocked', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Toggles email alerts on/off', 'fiveprayer')}</td>
                <td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-sm font-semibold">{__('Disabled', 'fiveprayer')}</span></td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Notification Email', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Email address to receive block notifications', 'fiveprayer')}</td>
                <td className="p-3">{__('WordPress admin email', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Global Notification Cooldown', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Minimum time between any email notifications to prevent spam', 'fiveprayer')}</td>
                <td className="p-3">{__('60 minutes', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Enable escalating cooldown', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Automatically increases cooldown: 10 min → 30 min → 60 min', 'fiveprayer')}</td>
                <td className="p-3"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-sm font-semibold">{__('Disabled', 'fiveprayer')}</span></td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('From Name', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Custom sender name shown on alert emails', 'fiveprayer')}</td>
                <td className="p-3 text-gray-400">{__('(empty)', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('From Email', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Custom sender email address for alert emails', 'fiveprayer')}</td>
                <td className="p-3 text-gray-400">{__('(empty)', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('Email Subject', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('Custom subject with ', 'fiveprayer')}<code className="bg-gray-200 px-1 py-0.5 rounded-sm">{'{sitename}'}</code>{__(' support', 'fiveprayer')}</td>
                <td className="p-3 text-gray-400">{__('(empty)', 'fiveprayer')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="font-semibold text-gray-800 mb-2">{__('How It Works', 'fiveprayer')}</p>
          <ol className="text-gray-700 space-y-2 text-sm ml-4 list-decimal">
            <li>{__('An IP reaches the max failed attempts threshold', 'fiveprayer')}</li>
            <li>{__('If notifications are enabled, an email is sent to the configured address', 'fiveprayer')}</li>
            <li>{__('After sending, a cooldown timer starts to prevent email flooding', 'fiveprayer')}</li>
            <li>{__('During the cooldown period, no further notification emails are sent (even if other IPs get blocked)', 'fiveprayer')}</li>
          </ol>
        </div>
      </div>

      {/* ===== FIXED COOLDOWN ===== */}
      <div id="fixed-cooldown" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Fixed Cooldown (Default)', 'fiveprayer')}</h2>
        <p className="text-gray-700">{__('The default behavior uses a single, fixed cooldown duration (default: 60 minutes). Every email sent triggers the same cooldown period regardless of how many times it happens.', 'fiveprayer')}</p>
      </div>

      {/* ===== ESCALATING COOLDOWN ===== */}
      <div id="escalating-cooldown" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Escalating Cooldown (Recommended for High-Risk Sites)', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('When ', 'fiveprayer')}<strong>{__('Enable escalating cooldown', 'fiveprayer')}</strong>{__(' is checked, the cooldown duration increases automatically with each notification:', 'fiveprayer')}</p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left font-semibold text-gray-700">{__('Notification', 'fiveprayer')}</th>
                <th className="p-3 text-left font-semibold text-gray-700">{__('Cooldown', 'fiveprayer')}</th>
                <th className="p-3 text-left font-semibold text-gray-700">{__('What Happens', 'fiveprayer')}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('1st', 'fiveprayer')}</td>
                <td className="p-3">{__('10 minutes', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('IP blocked email sent as normal', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('2nd', 'fiveprayer')}</td>
                <td className="p-3">{__('30 minutes', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('IP blocked email sent — cooldown increases', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('3rd', 'fiveprayer')}</td>
                <td className="p-3">{__('60 minutes', 'fiveprayer')}</td>
                <td className="p-3 text-gray-700">{__('IP blocked email sent + ', 'fiveprayer')}<strong>{__('Notifications Paused', 'fiveprayer')}</strong>{__(' alert sent', 'fiveprayer')}</td>
              </tr>
              <tr className="border-t border-gray-200">
                <td className="p-3 font-semibold">{__('4th+', 'fiveprayer')}</td>
                <td className="p-3"><span className="text-red-500 font-bold">{__('Stopped', 'fiveprayer')}</span></td>
                <td className="p-3 text-gray-700">{__('No emails sent until admin resets the cooldown', 'fiveprayer')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="font-semibold text-gray-800 mb-1">{__('How It Protects You', 'fiveprayer')}</p>
          <ul className="text-gray-700 text-sm space-y-1">
            <li><strong>{__('Low volume attacks:', 'fiveprayer')}</strong>{__(' Each wave of IPs still triggers an email after the cooldown expires', 'fiveprayer')}</li>
            <li><strong>{__('Sustained attacks:', 'fiveprayer')}</strong>{__(' The system automatically throttles and eventually pauses notifications to prevent inbox flooding', 'fiveprayer')}</li>
          </ul>
        </div>

        {/* Notifications Paused Alert */}
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 mt-4">
          <p className="font-semibold text-gray-800 mb-1">{__('Notifications Paused Alert', 'fiveprayer')}</p>
          <p className="text-gray-700 text-sm mb-2">{__('When the escalation reaches its max level (60 min), the system sends a special ', 'fiveprayer')}<strong>{__('Notifications Paused', 'fiveprayer')}</strong>{__(' email:', 'fiveprayer')}</p>
          <blockquote className="bg-white p-3 rounded-lg text-sm text-gray-600 italic border-l-4 border-red-400">{__('"FivePrayer API Security has temporarily paused email notifications due to a high volume of blocked IP addresses... To resume notifications, go to FivePrayer → API Security and click the Reset button on the cooldown entry..."', 'fiveprayer')}</blockquote>
          <p className="text-gray-700 text-sm mt-2">{__('After this, no further alert emails are sent until an admin manually resets the cooldown from the admin panel.', 'fiveprayer')}</p>
        </div>
      </div>

      {/* ===== COOLDOWN LEVEL BADGE ===== */}
      <div id="cooldown-badge" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Cooldown Level Indicator', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('When escalating cooldown is enabled and has been activated, a ', 'fiveprayer')}<strong>{__('Cooldown Level Badge', 'fiveprayer')}</strong>{__(' appears below the checkbox showing:', 'fiveprayer')}</p>
        <ul className="text-gray-700 space-y-2 text-sm ml-4 list-disc mb-4">
          <li>{__('Current escalation level: ', 'fiveprayer')}<span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-sm font-semibold">{__('Level 1', 'fiveprayer')}</span>, <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-sm font-semibold">{__('Level 2', 'fiveprayer')}</span>{__(', or ', 'fiveprayer')}<span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-sm font-semibold">{__('Level 3', 'fiveprayer')}</span></li>
          <li>{__('The next cooldown duration: ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('(next: 30 min)', 'fiveprayer')}</code></li>
          <li><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-sm font-semibold">{__('Paused (high volume)', 'fiveprayer')}</span>{__(' when notifications have been stopped', 'fiveprayer')}</li>
        </ul>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <p className="text-gray-700 text-sm">{__('The badge is visible only when escalating cooldown is enabled and a cooldown level has been set. When the level is ', 'fiveprayer')}<strong>{__('None', 'fiveprayer')}</strong>{__(' (Level 0), the badge is hidden.', 'fiveprayer')}</p>
        </div>
      </div>

      {/* ===== TEST EMAIL ===== */}
      <div id="test-email" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Test Email', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('Use the ', 'fiveprayer')}<strong>{__('Send Test Email', 'fiveprayer')}</strong>{__(' button to verify that your email configuration is working correctly:', 'fiveprayer')}</p>
        <ol className="text-gray-700 space-y-2 text-sm ml-4 list-decimal mb-4">
          <li>{__('Configure your notification email address in the settings', 'fiveprayer')}</li>
          <li>{__('Set up an SMTP plugin if needed (see Email Setup Guide below)', 'fiveprayer')}</li>
          <li>{__('Click ', 'fiveprayer')}<strong>{__('Send Test Email', 'fiveprayer')}</strong></li>
          <li>{__('Check the configured email inbox for the test message', 'fiveprayer')}</li>
          <li>{__('The email content is also logged to the WordPress debug log for inspection', 'fiveprayer')}</li>
        </ol>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-gray-700 text-sm">{__('The test email uses the same email template as a real block notification but includes a ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('[TEST]', 'fiveprayer')}</code>{__(' prefix in the subject line, making it easy to distinguish from real alerts.', 'fiveprayer')}</p>
        </div>
      </div>

      {/* ===== CUSTOMIZING EMAILS ===== */}
      <div id="customizing-emails" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Customizing Emails', 'fiveprayer')}</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">{__('From Name & From Email', 'fiveprayer')}</p>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>{__('Set a custom sender name (e.g., ', 'fiveprayer')}<strong>{__('FivePrayer Alerts', 'fiveprayer')}</strong>{__(') and email address (e.g., ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('noreply@yourdomain.com', 'fiveprayer')}</code>)</li>
              <li>{__('Leave empty to use the default WordPress ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('wordpress@yourdomain.com', 'fiveprayer')}</code></li>
              <li>{__('If you use an SMTP plugin, configure sender details there instead for more options', 'fiveprayer')}</li>
              <li>{__('After saving, the test email will show ', 'fiveprayer')}<strong>{__('From: Your Name <your@email.com>', 'fiveprayer')}</strong>{__(' at the top', 'fiveprayer')}</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">{__('Custom Subject', 'fiveprayer')}</p>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>{__('Set a custom subject line for both real block notifications and test emails', 'fiveprayer')}</li>
              <li>{__('Use ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{'{sitename}'}</code>{__(' as a placeholder — it will be replaced with your actual site name', 'fiveprayer')}</li>
              <li><strong>{__('Example:', 'fiveprayer')}</strong> <code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">⚠️ {'{sitename}'}{__(' — Brute Force Alert', 'fiveprayer')}</code>{__(' becomes ', 'fiveprayer')}<strong>{__('⚠️ My Mosque — Brute Force Alert', 'fiveprayer')}</strong></li>
              <li>{__('Leave empty to use the default subject: ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('[Site Name] API Security Alert: IP Blocked', 'fiveprayer')}</code></li>
              <li>{__('When sending a test email with a custom subject, ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('[TEST]', 'fiveprayer')}</code>{__(' is prepended for clarity', 'fiveprayer')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ===== SUBJECT PREVIEW ===== */}
      <div id="subject-preview" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Live Subject Preview', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('When you type in the ', 'fiveprayer')}<strong>{__('Email Subject', 'fiveprayer')}</strong>{__(' field, a live preview shows instantly below the field:', 'fiveprayer')}</p>
        <div className="space-y-2">
          <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-600 w-24">{__('Block alert:', 'fiveprayer')}</span>
            <code className="bg-gray-200 px-2 py-1 rounded-sm text-sm flex-1">{__('[My Mosque] API Security Alert: IP Blocked', 'fiveprayer')}</code>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg flex items-center gap-2">
            <span className="font-semibold text-sm text-gray-600 w-24">{__('Test email:', 'fiveprayer')}</span>
            <code className="bg-gray-200 px-2 py-1 rounded-sm text-sm flex-1">{__('[TEST] [My Mosque] API Security Alert: IP Blocked Notification Test', 'fiveprayer')}</code>
          </div>
        </div>
      </div>

      {/* ===== EMAIL SETUP GUIDE ===== */}
      <div id="email-setup-guide" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Email Setup Guide', 'fiveprayer')}</h2>
        <p className="text-gray-700 mb-4">{__('This plugin uses WordPress\'s built-in ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('wp_mail()', 'fiveprayer')}</code>{__(' function. Delivery depends on your server environment.', 'fiveprayer')}</p>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">{__('Local Development (localhost)', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('Most local environments cannot send emails by default. Two options:', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li><strong>{__('Recommended:', 'fiveprayer')}</strong>{__(' Install a free SMTP plugin like FluentSMTP or SureMail, configure with your email provider', 'fiveprayer')}</li>
              <li><strong>{__('No SMTP:', 'fiveprayer')}</strong>{__(' Click ', 'fiveprayer')}<strong>{__('Send Test Email', 'fiveprayer')}</strong>{__(' — content is logged to the debug log', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">{__('Production Server', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li><strong>{__('With SMTP plugin:', 'fiveprayer')}</strong>{__(' Install a free SMTP plugin (FluentSMTP, SureMail, etc.) and configure with any provider', 'fiveprayer')}</li>
              <li><strong>{__('Without SMTP plugin:', 'fiveprayer')}</strong>{__(' Some hosts support PHP ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('mail()', 'fiveprayer')}</code>{__('. Click ', 'fiveprayer')}<strong>{__('Send Test Email', 'fiveprayer')}</strong>{__(' to check. If you receive it, no SMTP plugin needed!', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-semibold text-gray-800 mb-2">{__('Free SMTP Plugins', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('There are many free SMTP plugins to choose from — pick the one that works best for you:', 'fiveprayer')}</p>
            <ul className="text-gray-700 text-sm ml-4 list-disc space-y-1">
              <li><strong>{__('FluentSMTP', 'fiveprayer')}</strong>{__(' — Free, modern UI, supports many providers', 'fiveprayer')}</li>
              <li><strong>{__('SureMail', 'fiveprayer')}</strong>{__(' — Free, lightweight, simple setup', 'fiveprayer')}</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-semibold text-gray-800 mb-2">{__('Debug Log (No Config Needed)', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('If ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('WP_DEBUG', 'fiveprayer')}</code>{__(' is enabled (already active on this site), no need to edit wp-config.php.', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('When you click ', 'fiveprayer')}<strong>{__('Send Test Email', 'fiveprayer')}</strong>{__(', the full email content goes to:', 'fiveprayer')}</p>
            <code className="block bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono mb-2">{__('/wp-content/debug-*.log', 'fiveprayer')}</code>
            <p className="text-gray-600 text-xs">{__('If debug is not enabled, install the free ', 'fiveprayer')}<strong>{__('WP Debugging', 'fiveprayer')}</strong>{__(' plugin — it enables logging without editing any core files.', 'fiveprayer')}</p>
          </div>
        </div>
      </div>

      {/* ===== USE CASES ===== */}
      <div id="use-cases" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Use Cases', 'fiveprayer')}</h2>
        
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Scenario 1: Protecting Against Brute Force Attacks', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li>{__('Enable brute force protection', 'fiveprayer')}</li>
              <li>{__('Set max failed attempts to a reasonable number (10 is recommended)', 'fiveprayer')}</li>
              <li>{__('Set lockout duration to how long you want to block offenders (15 minutes recommended)', 'fiveprayer')}</li>
              <li>{__('Enable email notifications to be alerted when attacks occur', 'fiveprayer')}</li>
              <li>{__('Monitor the Blocked / Tracked IPs table for suspicious activity', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Scenario 2: Testing Email Configuration', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li>{__('Enter your email address in the Notification Email field', 'fiveprayer')}</li>
              <li>{__('Ensure your server can send emails (install an SMTP plugin if needed)', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('Send Test Email', 'fiveprayer')}</strong></li>
              <li>{__('Check your inbox and the debug log for the test message', 'fiveprayer')}</li>
              <li>{__('If the test succeeds, real block notifications will work when triggered', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Scenario 3: Manual IP Unblocking', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li>{__('Go to the Blocked / Tracked IPs table', 'fiveprayer')}</li>
              <li>{__('Identify blocked IPs that you want to unblock', 'fiveprayer')}</li>
              <li>{__('Click the ', 'fiveprayer')}<strong>{__('Unblock', 'fiveprayer')}</strong>{__(' button next to each IP', 'fiveprayer')}</li>
              <li>{__('The IP\'s tracking data is immediately cleared', 'fiveprayer')}</li>
              <li>{__('The IP can now make API requests again', 'fiveprayer')}</li>
            </ol>
          </div>
        </div>
      </div>

      {/* ===== TROUBLESHOOTING ===== */}
      <div id="troubleshooting" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Troubleshooting', 'fiveprayer')}</h2>

        <div className="space-y-4">
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Emails are not being sent', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li>{__('Verify that ', 'fiveprayer')}<strong>{__('Send email notification when an IP is blocked', 'fiveprayer')}</strong>{__(' is enabled', 'fiveprayer')}</li>
              <li>{__('Verify the notification email address is correct', 'fiveprayer')}</li>
              <li>{__('Click ', 'fiveprayer')}<strong>{__('Send Test Email', 'fiveprayer')}</strong>{__(' to test email delivery', 'fiveprayer')}</li>
              <li>{__('Check the WordPress debug log for the email content (', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('/wp-content/debug-*.log', 'fiveprayer')}</code>)</li>
              <li>{__('Install an SMTP plugin if your server does not support PHP mail', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Cannot unblock an IP', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li>{__('Click the ', 'fiveprayer')}<strong>{__('Unblock', 'fiveprayer')}</strong>{__(' button next to the IP in the Blocked / Tracked IPs table', 'fiveprayer')}</li>
              <li>{__('The IP should immediately disappear from the list', 'fiveprayer')}</li>
              <li>{__('If not, refresh the page and check again', 'fiveprayer')}</li>
              <li>{__('If the issue persists, clear any server-side caching', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Too many false positives', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li>{__('Increase the ', 'fiveprayer')}<strong>{__('Max Failed Attempts', 'fiveprayer')}</strong>{__(' value to allow more retries before blocking', 'fiveprayer')}</li>
              <li>{__('Ensure your API consumers are using correct API keys', 'fiveprayer')}</li>
              <li>{__('Check that API keys have not expired', 'fiveprayer')}</li>
            </ol>
          </div>

          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="font-semibold text-gray-800 mb-1">{__('Every API client gets blocked at the same time', 'fiveprayer')}</p>
            <p className="text-gray-700 text-sm mb-2">{__('This happens when the site sits behind a proxy that is not recognised, so all traffic is counted under one address. Ten bad attempts from a single attacker then lock out everybody using that proxy.', 'fiveprayer')}</p>
            <ol className="text-gray-700 text-sm ml-4 list-decimal space-y-1">
              <li>{__('Check the Blocked / Tracked IPs table — if the blocked addresses belong to Cloudflare or your host, FivePrayer is seeing the proxy, not the visitor', 'fiveprayer')}</li>
              <li>{__('Cloudflare is detected automatically, so this should only happen with a different proxy', 'fiveprayer')}</li>
              <li>{__('List that proxy with the ', 'fiveprayer')}<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm">{__('fiveprayer_trusted_proxy_ips', 'fiveprayer')}</code>{__(' filter — see Proxies & Cloudflare above', 'fiveprayer')}</li>
              <li>{__('Unblock the affected IPs after making the change', 'fiveprayer')}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiSecurityDocs;

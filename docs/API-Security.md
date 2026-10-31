# FivePrayer API Security

## Overview

The FivePrayer API Security system protects your external API endpoints from abuse by detecting and blocking brute force attacks. When an IP address makes too many failed API key attempts, it is temporarily blocked. The system also supports email notifications so you can stay informed about security events.

## Scope and limits

- **IPv6 is counted per /64.** One client normally controls a whole /64, so
  counting single addresses would let it rotate through the block with a new
  source address per request. The tracked entry is the /64 network.
- **The tracked-address list is capped** (500 entries). The oldest entries are
  pruned when the cap is reached, so an address-cycling attack cannot grow
  `wp_options` without bound.
- **“Stopped” escalation resets itself after 24 hours.** When the escalating
  cooldown reaches its last level, alerts pause; after one day the level clears
  and alerts resume automatically. The manual Reset button still clears it
  immediately.
- **Counters are atomic when a persistent object cache is available.** With
  Redis/Memcached, failed-attempt and per-key rate counters use
  `wp_cache_incr()`; without one, the transient is the only available store.

## Allowed Domains is a convenience filter, not a security control

The **Allowed Domains** field compares the `Origin` or `Referer` header. Any
non-browser client — `curl`, a script, a server integration — can send those
headers itself, so the check only filters casual cross-origin browser use. It
cannot authenticate where a request came from.

**Use Allowed IPs for server-to-server integrations.** The client address is
not chosen by the caller (beyond trusted-proxy configuration the site already
controls), so it is the restriction that actually holds. Every API key and
endpoint also requires the secret key itself; Allowed Domains is an additional
convenience on top, never a substitute.

## Access

Navigate to **WordPress Admin → FivePrayer → API Security**

## Features

### Brute Force Protection

The brute force protection system tracks failed API key attempts per IP address. When the configured threshold is reached, the IP is temporarily blocked from making further API requests.

#### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable brute force protection** | Toggles the entire brute force protection system on/off | Enabled |
| **Max Failed Attempts** | Number of failed API key attempts before an IP is blocked | 10 |
| **Lockout Duration (minutes)** | How long an IP remains blocked after reaching the max failed attempts | 15 |

**How it works:**

1. Each failed API key attempt increments a counter for the requesting IP address
2. The counter expires after the lockout duration — entry stays visible with **Expired** status until manually unblocked
3. When the counter reaches the max failed attempts threshold, the IP is blocked
4. Blocked IPs receive a `403 Forbidden` response on subsequent API requests
5. Once the lockout duration expires, the status changes to **Expired** but the entry stays visible in the table. Click **Unblock** to remove it manually

#### Blocked / Tracked IPs Table

The **Blocked / Tracked IPs** section displays all IPs currently being monitored:

| Column | Description |
|--------|-------------|
| **IP Address** | The tracked IP address |
| **Failed Attempts** | Current count of failed attempts |
| **Status** | `Blocked` (at threshold) or `Tracking` (below threshold) |
| **Expires** | Time remaining before the tracking data expires. When expired, the entry stays visible with **Expired** status until manually unblocked |
| **Actions** | `Unblock` button (real IPs), or `Reset` + `Expire` buttons (email cooldown) |

**Unblocking an IP:** Click the "Unblock" button next to any blocked IP to immediately remove its tracking data and failed attempts counter. This allows the IP to resume making API requests.

**Resetting the Cooldown:** The table also shows an `email_cooldown` entry when the notification cooldown is active. Two buttons are available:

- **Reset** — Clears the cooldown timer AND resets the escalation level back to Level 0. Use this when you want notifications to start fresh.
- **Expire** — Clears the cooldown timer only, keeping the escalation level intact. Use this to advance to the next escalation level without waiting for the timer to expire.

**Global Reset Cooldown button:** When the escalating cooldown is active (i.e., a level badge is shown), a **Reset Cooldown** button also appears at the top of the Blocked / Tracked IPs card header. This provides quick access to reset the cooldown even if the `email_cooldown` table row has already been expired or removed.

### Proxies & Cloudflare

Brute force protection, per-key IP restrictions and the audit log all need the visitor's real IP address. FivePrayer uses the direct connection address, and only looks at forwarding headers when the request actually arrived through a proxy it can verify.

| Feature | Why the IP matters |
|---------|--------------------|
| **Brute force protection** | Failed attempts are counted per IP. If every visitor looks like the same proxy address, one attacker can lock out everyone. |
| **API key IP restrictions** | A key limited to an address or CIDR range only matches when the real client address is known. |
| **Blocked / Tracked IPs table and logs** | Shows which IP was blocked — a proxy address there makes the list hard to interpret and unblocking ineffective. |

#### Cloudflare — detected automatically

If your site is behind the Cloudflare proxy (the orange-cloud setting in DNS), there is nothing to configure. Requests arrive from a Cloudflare edge address, FivePrayer recognises Cloudflare's published IPv4 and IPv6 ranges and uses the visitor address Cloudflare provides with the request.

- Works on every Cloudflare plan, with or without caching
- Supports both IPv4 and IPv6 edge addresses
- Sites set to **DNS only** (grey cloud) are not proxied, so the visitor address is already visible — also no setup

#### Other proxies, load balancers and CDNs

A reverse proxy such as Nginx or HAProxy in front of PHP, a hosting load balancer, or a CDN other than Cloudflare must be listed once with the `fiveprayer_trusted_proxy_ips` filter:

```php
add_filter('fiveprayer_trusted_proxy_ips', function () {
    return [
        '203.0.113.10',      // a single proxy address
        '10.0.0.0/8',        // or a whole range in CIDR notation
        '2001:db8::/32',     // IPv6 is supported too
    ];
});
```

Add it to a file in `wp-content/mu-plugins/` or to your child theme's `functions.php`, so it survives plugin updates. Ask your host which address your site sees as the direct connection if you are unsure.

Using Cloudflare Tunnel (cloudflared)? The request then reaches your server from the tunnel itself, so add `127.0.0.1` and `::1` once — Cloudflare is still detected from its headers after that.

#### Why forwarding headers are not trusted by default

Headers such as `X-Forwarded-For` are written by whoever sends the request. Trusting them everywhere would let any visitor choose the address a failed attempt is blamed on — locking out an unrelated IP, or dodging the lockout entirely.

That is why they are only read when the direct connection is a known proxy, and why the address chain is read from the proxy end: a prefix added by the client is ignored.

#### Turning Cloudflare detection off

Only needed in unusual setups — for example when your site is not behind Cloudflare but receives traffic from an address inside Cloudflare's ranges. Return `false` from this filter:

```php
add_filter('fiveprayer_trust_cloudflare_proxies', '__return_false');
```

### Email Notifications

When an IP address reaches the max failed attempts threshold and gets blocked, the system can send an email notification to alert you.

#### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Send email notification when an IP is blocked** | Toggles email alerts on/off | Disabled |
| **Notification Email** | Email address to receive block notifications | WordPress admin email |
| **Global Notification Cooldown (minutes)** | Minimum time between any email notifications to prevent spam | 60 |
| **Enable escalating cooldown** | When enabled, the cooldown escalates: 10 min → 30 min → 60 min | Disabled |
| **From Name** | Custom sender name shown on alert emails. Leave empty for the default WordPress name | *(empty)* |
| **From Email** | Custom sender email address for alert emails. Leave empty for the default WordPress address | *(empty)* |
| **Email Subject** | Custom subject line for alert emails. Use `{sitename}` to insert your site name dynamically | *(empty — uses default)* |

**How it works:**

When an IP reaches the max failed attempts threshold, the system checks if notifications are enabled:

1. If enabled, an email is sent to the configured notification email address
2. After sending, a cooldown timer starts to prevent email flooding
3. During the cooldown period, no further notification emails are sent (even if other IPs get blocked)

#### Fixed Cooldown (Default)

The default behavior uses a single, fixed cooldown duration (default: 60 minutes). Every email sent triggers the same cooldown period regardless of how many times it happens.

#### Escalating Cooldown (Recommended for High-Risk Sites)

When **Enable escalating cooldown** is checked, the cooldown duration increases automatically with each notification that gets sent after a cooldown expires:

| Notification # | Cooldown Duration | What Happens |
|:--------------:|:-----------------:|:------------|
| **1st** | **10 minutes** | IP blocked email sent as normal |
| **2nd** *(after 10 min cooldown expires)* | **30 minutes** | IP blocked email sent — cooldown increases |
| **3rd** *(after 30 min cooldown expires)* | **60 minutes** | IP blocked email sent + **"Notifications Paused"** alert sent |
| **4th+** | ❌ **Stopped** | No emails sent until admin resets the cooldown |

This escalation protects you in two ways:
- **Low volume attacks:** Each wave of IPs still triggers an email after the cooldown expires
- **Sustained attacks:** The system automatically throttles and eventually pauses notifications to prevent inbox flooding

#### "Notifications Paused" Alert

When the escalation reaches its max level (60 min), the system sends a special **"Notifications Paused"** email to the notification address:

> *"FivePrayer API Security has temporarily paused email notifications due to a high volume of blocked IP addresses... To resume notifications, go to FivePrayer → API Security and click the Reset button on the cooldown entry..."*

After this, no further alert emails are sent until an admin manually resets the cooldown from the admin panel.

#### Cooldown Level Indicator

When escalating cooldown is enabled and has been activated, a **Cooldown Level Badge** appears below the checkbox showing:
- Current escalation level (Level 1, Level 2, or Level 3)
- The next cooldown duration (e.g., "next: 30 min")
- "Paused (high volume)" when notifications have been stopped

#### Test Email

Use the **Send Test Email** button to verify that your email configuration is working correctly:

1. Configure your notification email address in the settings
2. Set up an SMTP plugin if needed (see Email Setup Guide below)
3. Click "Send Test Email"
4. Check the configured email inbox for the test message
5. The email content is also logged to the WordPress debug log for inspection

The test email uses the same email template as a real block notification but includes a `[TEST]` prefix in the subject line so you can easily distinguish it from real alerts.

#### Customizing Emails

You can customize how alert emails look to recipients:

**From Name & From Email:**
- Set a custom sender name (e.g., "FivePrayer Alerts") and email address (e.g., `noreply@yourdomain.com`)
- Leave empty to use the default WordPress `wordpress@yourdomain.com`
- If you use an SMTP plugin, configure sender details there instead for more options
- After saving, the test email will show "From: Your Name <your@email.com>" at the top

**Custom Subject:**
- Set a custom subject line for both real block notifications and test emails
- Use `{sitename}` as a placeholder — it will be replaced with your actual site name
- **Example:** `⚠️ {sitename} — Brute Force Alert` becomes `⚠️ My Mosque — Brute Force Alert`
- Leave empty to use the default subject: `[Site Name] API Security Alert: IP Blocked`
- When sending a test email with a custom subject, `[TEST]` is prepended so you know it's a test

**Live Subject Preview:**
When you type in the Email Subject field, a live preview shows instantly below the field:
- **Block alert** — shows how the real notification subject will look (with `{sitename}` resolved)
- **Test email** — shows how the test email subject will look (with `[TEST]` prefix)

### Email Setup Guide

The Email Setup Guide on the API Security page provides practical guidance for configuring email delivery:

#### Local Development (localhost)

Most local development environments (Local by FlyWheel, XAMPP, MAMP) cannot send emails by default. You have two options:

- **Recommended:** Install a free SMTP plugin (FluentSMTP, SureMail, etc.) and configure it with your email provider (Gmail, Outlook, etc.)
- **No SMTP:** Click "Send Test Email" — the email content is logged to the WordPress debug log so you can inspect what would have been sent without actually sending it

#### Production Server

Email delivery depends on your hosting provider:

- **With SMTP plugin:** Install a free SMTP plugin (FluentSMTP, SureMail, etc.) and configure it with any email provider
- **Without SMTP plugin:** Some hosting providers support PHP's built-in `mail()` function. Click "Send Test Email" to check. If you receive it, no SMTP plugin is needed. If not, your host may block PHP mail (common with modern hosts) and you will need an SMTP plugin

#### Debug Log

When you click "Send Test Email", the full email content (To, Subject, Body) is written to:

```
/wp-content/debug-*.log
```

If `WP_DEBUG` and `WP_DEBUG_LOG` are enabled, you can view the email content directly in the debug log file without needing to actually send the email. This is particularly useful for local development.

## Admin Interface

### Access
Navigate to **WordPress Admin → FivePrayer → API Security**

### Page Layout

The API Security page is split into two columns:

| Left Column | Right Column |
|-------------|--------------|
| Brute Force Protection Settings | Blocked / Tracked IPs |
| *(empty)* | Email Setup Guide |

## API Rate Limiting & Blocking

When an IP is blocked due to brute force protection:

- All authenticated endpoints return a `403 Forbidden` status for blocked IPs
- The `/test` endpoint is exempt from brute force protection as it does not require an API key
- The response includes an error message indicating the IP is temporarily blocked
- The blocking is based on IP address only, not API key
- Blocked IPs can still access the WordPress admin (blocking only applies to the external REST API)

## Use Cases

### Scenario 1: Protecting Against Brute Force Attacks

1. Enable brute force protection
2. Set max failed attempts to a reasonable number (10 is recommended)
3. Set lockout duration to how long you want to block offenders (15 minutes recommended)
4. Enable email notifications to be alerted when attacks occur
5. Monitor the Blocked / Tracked IPs table for suspicious activity

### Scenario 2: Testing Email Configuration

1. Enter your email address in the Notification Email field
2. Ensure your server can send emails (install an SMTP plugin if needed)
3. Click "Send Test Email"
4. Check your inbox and the debug log for the test message
5. If the test succeeds, real block notifications will work when triggered

### Scenario 3: Manual IP Unblocking

1. Go to the Blocked / Tracked IPs table
2. Identify blocked IPs that you want to unblock
3. Click the "Unblock" button next to each IP
4. The IP's tracking data is immediately cleared
5. The IP can now make API requests again

## Troubleshooting

### Emails are not being sent

1. Verify that "Send email notification when an IP is blocked" is enabled
2. Verify the notification email address is correct
3. Click "Send Test Email" to test email delivery
4. Check the WordPress debug log for the email content (`/wp-content/debug-*.log`)
5. Install an SMTP plugin if your server does not support PHP mail

### Cannot unblock an IP

1. Click the "Unblock" button next to the IP in the Blocked / Tracked IPs table
2. The IP should immediately disappear from the list
3. If not, refresh the page and check again
4. If the issue persists, clear any server-side caching

### Too many false positives

1. Increase the "Max Failed Attempts" value to allow more retries before blocking
2. Ensure your API consumers are using correct API keys
3. Check that API keys have not expired

### Every API client gets blocked at the same time

This happens when the site sits behind a proxy that is not recognised, so all traffic is counted under one address. Ten bad attempts from a single attacker then lock out everybody using that proxy.

1. Check the Blocked / Tracked IPs table — if the blocked addresses belong to Cloudflare or your host, FivePrayer is seeing the proxy, not the visitor
2. Cloudflare is detected automatically, so this should only happen with a different proxy
3. List that proxy with the `fiveprayer_trusted_proxy_ips` filter — see [Proxies & Cloudflare](#proxies--cloudflare) above
4. Unblock the affected IPs after making the change

## Version History

- **v2.5.0**: Initial release of brute force protection and email notification features

## Related Documentation

- [API Documentation](API-Documentation.md) — External API endpoints and usage
- [Core Files Documentation](core-files-documentation.md) — Overview of core plugin files

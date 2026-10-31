# Share on Local Network (sharing the site on your network)

Share a locally-hosted WordPress site — the prayer times, the design and all —
with the TV, phone or another computer on the same network, without broken
links, redirect loops or database changes.

This is a **feature, not a test step**: a mosque that runs FivePrayer on a local
machine (LocalWP, Flywheel, MAMP, Docker, `wp server`, a mini PC or Raspberry Pi
in the prayer hall) leaves the switch **on**, and every screen on that network
opens the same display at the same time. The only technical guard is that it
does nothing on a public domain.

## Which request hosts are accepted

Behind a reverse proxy, `REMOTE_ADDR` is the proxy's private address for every
request, so the client-address check alone cannot tell a TV from an internet
visitor. The `Host` header is chosen by the visitor as well. Sharing therefore
only activates when the request host is one of:

- the addresses saved in **TV Display Mode → Share on Local Network →
  “Addresses allowed to activate sharing”**, or
- one of this server's own addresses (`SERVER_ADDR`, the hostname's resolved
  address, or loopback).

A request with any other `Host` header never activates the router, whatever its
`REMOTE_ADDR` says. Save the address or hostname the TV actually uses (for
example `192.168.1.104:10010` or `my-mosque.local`) when it is not one of the
server's own addresses. The environment check uses
`wp_get_environment_type()`: a site that reports `production` stays inert even
when it happens to be reachable on a private address.

> **Never type `localhost` on the phone, tablet or TV.** `localhost` always
> means *the device you are holding*, so on a phone or TV it points at that
> device itself and nothing loads. Always use this computer's network address
> instead, for example `http://192.168.1.104:10010` (your own IP and port).
> `localhost` is only ever correct in the browser on the computer that runs the
> site, such as when you open `/wp-admin` there.

## The problem

When WordPress runs locally (LocalWP, Flywheel, MAMP, Docker, XAMPP, `wp server`), its
**Site Address** and **WordPress Address** usually point at `http://localhost`
or `http://localhost:<port>`. If you open the site from another device using the
computer's network IP (for example `http://<your-ip>:<port>`), WordPress
still builds every link around `localhost`. A phone cannot resolve `localhost`,
so the site appears broken.

## The solution

A single switch, `fiveprayer_local_testing_mode`, that overrides the WordPress
Home/Site URL **in memory only** — never in the database — so the site resolves
to whichever local address the request arrived on.

## Where to find it (admin)

**FivePrayer → Customizing → Configure Settings → TV Display Mode →
“Share on Local Network”.**

It is not a separate "Developer Tools" page: the switch is the third switch of
the **TV Display Mode** page — right below **Pages** and **Posts** — named after
what it does, because anyone serving a display to their own network needs it.
All three switches start **off**, and each one only switches on the part it
names.

The row links to this guide from “Full guide” and warns when the override is not
running for the current request. The explanation of *why* the switch is needed
is printed on the page itself, next to the three switches.

**While the switch is off, the feature does nothing at all.** The request URL is
not rewritten, so a TV or phone keeps receiving `localhost` links and the page
will not load there. Nothing else on the site is affected either way.

## Step-by-step

1. Find your computer's network IP: `ipconfig` (Windows),
   `ipconfig getifaddr en0` (macOS), or the "Live Link" URL of your local tool.
   It starts with `192.168.` or `10.`.
2. Open **FivePrayer → Customizing → Configure Settings → TV Display Mode**.
3. Switch **“Share on Local Network”** on (it is off by default). It saves
   immediately.
4. On the other device, open the computer's network address — for example
   `http://192.168.1.104:10010`, using your own IP and port. Never type
   `localhost` there. Both devices must share the network.
5. Leave the switch **on**: that is how this machine keeps serving the display to
   the TV, the phone and any other screen on the network. Nothing is written to
   the database, so there is nothing to clean up and nothing that can go stale.

## How it works

| Component | Name | Purpose |
| --- | --- | --- |
| Option | `fiveprayer_local_testing_mode` | `1` = on, `0` = off (autoloaded). |
| Runtime class | `FivePrayer\Core\LocalNetworkRouter` | Reads the option and injects the request host. |
| Admin class | `FivePrayer\Core\Admin\LocalTestingMode` | Exposes the switch state and securely saves it (admin-ajax + nonce + `manage_options`). |
| Admin screen | Customizing → Configure Settings → TV Display Mode | Rendered by `TVDisplayModeSettings` / `LocalNetworkTestingCard`. |
| Filter | `fiveprayer_local_testing_allowed_hosts` | Add custom local host patterns. |

On `plugins_loaded` priority `1`, `LocalNetworkRouter::bootstrap()`:

1. Reads `$_SERVER['HTTP_HOST']` defensively (empty/unset arrays are handled).
2. Fails immediately unless the host is a loopback/private address
   (`localhost`, `127.0.0.1`, `[::1]`, `10.x.x.x`, `192.168.x.x`,
   `172.16–31.x.x`, or a `*.local` / `*.test` host).
3. Fails unless the option is enabled.
4. Defines `WP_HOME` and `WP_SITEURL` for this request only (guarded with
   `! defined()`, so `wp-config.php` values always win) and filters
   `option_home` / `option_siteurl` so `home_url()` / `site_url()` return the
   network address.

## Safety guarantees

- **Zero permanent database alterations.** `update_option('siteurl')` and
  `update_option('home')` are never called. The DB is untouched.
- **Fail-safe on production.** The override only runs when the request host is
  itself local/private. A public domain is always a no-op, even if the option
  is left enabled. A site declaring `WP_ENVIRONMENT_TYPE = 'production'` is
  additionally excluded.
- **wp-config always wins.** Existing `WP_HOME` / `WP_SITEURL` constants are
  respected.
- **Secure admin.** Saving requires the `manage_options` capability and is
  protected by a nonce verified with `check_admin_referer()`. Values are
  sanitised with `sanitize_text_field()` / `absint()` and output escaped.

## Troubleshooting

- **The page times out / never loads** — the request is not reaching WordPress.
  The site's web server is listening only on `127.0.0.1` (localhost), so the LAN
  IP is unreachable. It must listen on all interfaces (`0.0.0.0`) instead.
  Confirm with `netstat -ano | grep <port>`: if the only bindings are
  `127.0.0.1:<port>` / `[::1]:<port>`, LAN access is impossible. For LocalWP,
  change `listen 127.0.0.1:{{port}};` to `listen {{port}};` in the site's
  `conf/nginx/site.conf.hbs`, then restart the site in Local. On Windows you may
  also need to allow inbound connections for the web server through the firewall.
  The plugin cannot fix this — it only runs after the request reaches WordPress.
- **The card warns that the current address is not a private/local one** —
  add your host pattern:
  ```php
  add_filter( 'fiveprayer_local_testing_allowed_hosts', function ( $patterns ) {
      $patterns[] = '/^my-dev-box\.lan(?::\d+)?$/';
      return $patterns;
  } );
  ```
- **Phone still can't load the site** — usually the Windows firewall is
  dropping the request. If your Wi-Fi is classified as a **Public** network and
  the Public profile is `BlockInboundAlways`, Windows blocks all incoming
  connections *including* the allowed ones. See the detailed section below.
- **Enabled but nothing changes** — the request host is not local/private; the
  feature is intentionally inactive on real domains.

## Issues & fixes (detailed)

> In the WordPress admin the same guide is available as
> **FivePrayer → Documentation → 🛠️ Share on Local Network — Issues & Fixes**.

Work through these in order. The first one you hit is almost always the answer.

### Where does the request stop?

Run these on the computer that hosts the site:

```bash
# 1. What is my local IP?
ipconfig                        # Windows
ipconfig getifaddr en0          # macOS

# 2. Is the web server listening on the network, not just localhost?
netstat -ano | findstr :<port>   # Windows
lsof -nP -iTCP:<port> -sTCP:LISTEN   # macOS / Linux

# 3. Does it answer on the LAN address from the computer itself?
#    Use PowerShell, NOT curl (see Issue 5).
Invoke-WebRequest http://<your-ip>:<port>/ -UseBasicParsing | Select-Object StatusCode
```

- Step 2 shows only `127.0.0.1:<port>` / `[::1]:<port>` → **Issue 1**.
- Step 3 fails on the computer itself → **Issue 1** or **Issue 2**.
- Step 3 works but the phone fails → **Issues 2 and 3**.

### Issue 1 — the web server only listens on localhost

A tool that binds to loopback only is physically unreachable from other
devices. The plugin cannot change this — it runs only after the request reaches
WordPress. Make the site listen on all interfaces (`0.0.0.0`). For LocalWP, edit
`conf/nginx/site.conf.hbs` and change the `listen` directive from
`127.0.0.1:<port>` to just `<port>`, then restart the site. Re-check with
`netstat`: you want to see `0.0.0.0:<port>`.

### Issue 2 — Windows Firewall silently drops every inbound connection

The site works in the computer's browser, but every other device times out —
even after adding an allow rule for the port. The usual cause: the Wi-Fi is
classified as a **Public** network and the Public profile is set to
`BlockInboundAlways`, which **blocks all incoming connections including those in
the allowed list**. Windows also gives **Block rules priority over Allow rules**.

```powershell
# Which category is this network using?
Get-NetConnectionProfile

# What is the Public profile policy?
netsh advfirewall show publicprofile
# Firewall Policy  BlockInboundAlways,BlockOutbound  ->  inbound rules are IGNORED
```

Recommended fix (elevated PowerShell; affects only this Wi-Fi network):

```powershell
Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
```

Alternative if you must stay on Public (broader — applies to every public
network your PC joins):

```powershell
netsh advfirewall set publicprofile firewallpolicy blockinbound,allowoutbound
```

Then make sure the port itself is allowed on the profiles you use:

```powershell
netsh advfirewall firewall add rule name="FivePrayer Local <port>" dir=in action=allow protocol=TCP localport=<port> profile=domain,private,public
```

Verify with `netsh advfirewall show privateprofile` — it should read
`BlockInbound,BlockOutbound` (normal, Allow rules honoured), not
`BlockInboundAlways`. Undo the network change with
`Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Public`.

### Issue 3 — a third-party firewall manager overrides Windows Firewall

Tools such as **Malwarebytes Windows Firewall Control** manage the firewall for
you. They can force the outbound policy to "Block", create their own Block
rules, and re-apply them after manual changes. Such rules carry a `Grouping`
like "Windows Firewall Control". Check that its inbound policy for the active
profile is not "Block all", and that no Block rule covers your web server
executable (`nginx.exe` / `httpd.exe`) or the site port:

```powershell
Get-NetFirewallRule -Direction Inbound -Action Block -Enabled True | Where-Object { $_.DisplayName -match 'nginx|<port>|LocalWP|fiveprayer' } | Select-Object DisplayName
```

If a Block rule appears, disable it in the tool and retry.

### Issue 4 — phone on a different network, guest network, or client isolation

- On the phone, check **Settings → About phone → Status → IP address**. It must
  be in the **same subnet** as the computer (e.g. both `192.168.1.x`).
- Turn **mobile data off** while you check it, so the request cannot go over 4G.
- The Wi-Fi **SSID must match exactly** — a `-Guest`, `_5G` or extender SSID is
  usually a separate network.
- Same subnet but still no connection → the router has **AP / client isolation**
  enabled. Disable it (and any Guest Network) in the router's wireless settings.

Prove it from the computer — if it can reach the phone, the LAN is fine and the
problem is the firewall (Issue 2), not isolation:

```bash
ping <phone-ip>
arp -a      # is the phone listed?
```

Modern Android/iOS devices use a **randomised MAC address** per Wi-Fi network,
so the phone may look like an unfamiliar device in the router's client list.

### Issue 5 — curl reports "Bad access" (a false negative)

`connect ... failed: Bad access` is Windows error `WSAEACCES` — a firewall is
blocking the **tool**, not the site. Windows Firewall Control, for example,
ships a Block rule for `curl.exe`, so every curl-based test fails even when the
site is perfectly reachable. Use PowerShell instead:

```powershell
Invoke-WebRequest http://<your-ip>:<port>/ -UseBasicParsing | Select-Object StatusCode
Test-NetConnection <your-ip> -Port <port>
```

### Issue 6 — trying to reach the site over the public (WAN) IP

`http://<your-public-ip>:<port>` usually cannot work:

1. The router must forward WAN port <port> to this computer (not enabled by
   default).
2. Even with forwarding, most home routers do not support **NAT loopback
   (hairpin)**, so a device on the same Wi-Fi cannot reach the public IP.
3. If the ISP uses **CGNAT**, inbound port forwarding is impossible.

On top of that, the plugin's override only runs for **loopback / private** hosts
(`localhost`, `127.0.0.1`, `10.x`, `192.168.x`, `172.16–31.x`, `*.local`,
`*.test`), so a public address is intentionally ignored and links would still be
wrong. Use the LAN IP, or a tunnel (LocalWP Live Link), and allow the tunnel host
through the `fiveprayer_local_testing_allowed_hosts` filter (example above) if
you need the override.

### Issue 7 — the card warns that the current address is not local

Your environment uses an unrecognised host. Add it with the filter shown in the
Troubleshooting list above.

### Issue 8 — the toggle is on but nothing changes

The request host is not local/private, so the feature is intentionally inactive.
It also never overrides `WP_HOME` / `WP_SITEURL` defined in `wp-config.php` —
those always win. Make sure you are opening the LAN address, not `localhost`.

### Issue 9 — the phone browser breaks the URL

Local sites are served over plain HTTP. Type the `http://` prefix explicitly and
make sure the phone is not forcing HTTPS or using a Wi-Fi proxy:

- **Android:** Settings → Network & internet → Wi-Fi → (your network) →
  Advanced → **Proxy: None**
- If the browser keeps upgrading to HTTPS, try a private/incognito tab.

### Issue 10 — the page loads, but colours and TV Display Mode do nothing on the phone

This is the subtlest one because the page itself renders: the request reaches
WordPress, but every asset the plugin adds is still addressed to the original
host, e.g.
`http://localhost:<port>/wp-content/uploads/fiveprayer-cache/fiveprayer-combined-….css`.
A phone cannot resolve `localhost`, so **all** of them fail and the page falls
back to unstyled output. The combined bundle carries the colours (odd/even rows,
header, highlight/today row, border) and `tv-display.js` is what scales a TV
page — hence "no colours" and "TV mode does nothing" at the same time.

The cause: WordPress defines the `WP_CONTENT_URL` constant from the stored Site
URL **before plugins load**, so `plugins_url()`, `wp_upload_dir()` and the theme
URL builder keep returning the old host even though the page links themselves
are already correct.

**Fix:** no manual steps — Share on Local Network rewrites these URLs too
(the `plugins_url`, `upload_dir` and `theme_root_uri` filters).

Verify from the phone by viewing the page source: every FivePrayer asset URL
must begin with the computer's IP, and the stylesheet must return `200`:

```powershell
Invoke-WebRequest http://<your-ip>:<port>/wp-content/uploads/fiveprayer-cache/<file>.css -UseBasicParsing | Select-Object StatusCode
```

If the URLs still say `localhost`, the Share on Local Network switch is off, or the
request is not arriving on a private address.

## The 5-minute checklist

1. Server listens on `0.0.0.0:<port>` (Issue 1).
2. Wi-Fi network category is **Private** — `Get-NetConnectionProfile` (Issue 2).
3. Public profile is not `BlockInboundAlways` and no Block rule covers the port
   (Issues 2 & 3).
4. Phone is on the same subnet with mobile data off (Issue 4).
5. Phone has no Wi-Fi proxy and you typed `http://` (Issue 9).
6. The plugin's CSS/JS URLs on the phone use your IP, not `localhost` (Issue 10).

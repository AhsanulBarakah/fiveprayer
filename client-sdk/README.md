# iFiiri Client SDK

Drop-in opt-in telemetry for premium WordPress plugins, reporting to your own iFiiri server.
No Composer, no build step, no external service — four PHP classes, one CSS file, one JS file.

```
client-sdk/
├── ifiiri-client.php              loader: copy the folder, require this one file
├── includes/
│   ├── class-client.php           registry + activation hooks + heartbeat cron
│   ├── class-product.php          per-plugin config, consent state, payloads
│   ├── class-transport.php        HMAC-signed HTTP (the secret never leaves PHP)
│   ├── class-consent.php          opt-in modal / notice + AJAX handler
│   ├── class-deactivation.php     deactivation feedback handler
│   └── class-privacy.php          WordPress "Export/Erase Personal Data" tools
└── assets/                        modal CSS/JS
```

---

## 1. Install (per premium plugin)

1. Copy the whole `client-sdk` folder into the premium plugin, e.g.
   `fiveprayer/client-sdk/` — or `cp -r wp-content/plugins/ifiiri/client-sdk wp-content/plugins/fiveprayer/`.
   (Your iFiiri dashboard has the same instructions, with the code already filled in, under
   **iFiiri → How to use**.)
2. Grab the credentials from your master site: **iFiiri → Clients → Create client**
   (the secret is shown once).
3. Load the SDK and register the product from the plugin's main file:

```php
require_once __DIR__ . '/client-sdk/ifiiri-client.php';

\iFiiri\SDK\Client::register(
	'fiveprayer',
	array(
		'endpoint'    => 'https://your-master-site.com/wp-json/ifiiri/v1/',
		'client_id'   => 'fiv_0123456789ab',
		'secret'      => 'paste-the-secret',
		'version'     => defined( 'FIVEPRAYER_VERSION' ) ? FIVEPRAYER_VERSION : '3.0.0',
		'plugin_file' => __FILE__,
		'plugin_name' => 'FivePrayer',
		'text_domain' => 'fiveprayer',
		'license_key' => static function () {
			return (string) get_option( 'fiveprayer_license_key', '' );
		},
	)
);
```

That is the entire integration. The call wires up the opt-in prompt, the deactivation modal, the daily
heartbeat and the privacy tools.

### Configuration keys

| Key | Required | Notes |
|---|---|---|
| `endpoint` | yes | REST namespace base URL. Get it from **iFiiri → Clients** (works with pretty *and* plain permalinks) |
| `client_id` | yes | Public identifier from the dashboard |
| `secret` | yes | Keep it out of version control if possible |
| `version` | yes | The plugin version reported to the server |
| `plugin_file` | yes | `__FILE__` of the main plugin file — used for the activation hook |
| `plugin_name` | no | Pretty name used in the prompts (defaults to the slug) |
| `text_domain` | no | Text domain recorded for this product. The SDK's own strings are compiled against the host plugin's literal text domain so the i18n tooling can extract them |
| `license_key` | no | String or callable returning the site's licence key |
| `heartbeat` | no | Seconds between heartbeats (minimum 3600, default daily) |
| `ask_for_consent` | no | Set `false` only for an internal/agency plugin where asking is not appropriate |

Requires WordPress 6.2+ and PHP 7.4+.

---

## 2. Strict opt-in, in detail

* On activation, consent is `pending`: **no request of any kind is made.**
* An admin (`manage_options`) sees a modal on the next screen explaining exactly what would be sent.
  Three choices: **Opt in**, **No thanks**, **Ask me later**. "Later" downgrades the modal to a slim
  notice — it never disappears silently and never sends anything.
* Only `yes` flips the gate. `Client::send()` returns a `WP_Error` (`ifiiri_sdk_no_consent`) for any
  product that has not opted in, so a bug elsewhere in the plugin cannot leak data.
* The server enforces the same rule independently: a heartbeat without consent writes nothing.

### Collected (only after opt-in)

Plugin / WordPress / PHP versions · site URL · locale · multisite flag · an anonymous installation
UUID · deactivation reason + comment, **only if the user chooses to submit it**.

### Never collected

Admin or user emails · names · passwords · customer or order data · post content · database
credentials · raw IP addresses (the server stores a keyed hash for rate limiting only).

### Changing the decision later

```php
$product = \iFiiri\SDK\Client::product( 'fiveprayer' );

$product->consent();               // 'yes' | 'no' | 'pending'
$product->is_tracking_allowed();   // bool - the only gate that matters
$product->set_consent( 'no' );     // withdraw: all further reports stop immediately
$product->forget();                // erase every option the SDK stored
```

Withdrawing also discards any report still waiting in the retry queue (section 4), so a queued event
can never outlive the permission that produced it.

Expose `set_consent()` behind your own settings toggle if you want a visible opt-out switch. The
"Erase Personal Data" tool does the same thing for a data-subject request.

---

## 3. Deactivation modal

On **Plugins → Installed Plugins**, the SDK intercepts the *Deactivate* link for its own plugins (it
matches the row's `data-plugin` basename) and shows a modal with:

* **Found a better plugin**, **Temporary deactivation**, **Plugin didn't work**, **It broke my site**,
  **Too hard to set up**, **No longer need it**, **Other** (which reveals a comment box),
* **Submit & Deactivate** and a prominent **Skip & Deactivate**.

Guideline compliance:

* submitting is optional, and **Skip sends nothing at all** — no reason, no feedback, no event,
* the modal never blocks deactivation: the AJAX call races a 1.5 s timeout and the browser navigates
  either way, so a slow or unreachable server cannot trap a user on the page,
* no nagging: once declined, the prompt is gone for good.

If a plugin is deleted instead of deactivated, nothing is sent — that is exactly why the server flags
installations `stale` after a grace period instead of trusting "active" forever.

Server-side slugs are whitelisted, so a modified browser cannot store arbitrary values or markup.
Keep this list in sync with `iFiiri\Reasons` on the server if you add reasons.

---

## 4. Reports that could not be sent (retry queue)

A report that fails — master unreachable, DNS hiccup, host firewall, timeout, non-2xx answer — is
**not lost**. It goes into a small per-product queue (option `ifiiri_{slug}_queue`, never autoloaded)
and is tried again on the next admin page load, with the daily heartbeat as the backstop for sites
nobody logs into.

```php
$product = \iFiiri\SDK\Client::product( 'fiveprayer' );

\iFiiri\SDK\Queue::count( $product );   // how many reports are waiting
\iFiiri\SDK\Queue::all( $product );     // the queued items, payload included
\iFiiri\SDK\Queue::flush( $product );   // try to deliver them now
\iFiiri\SDK\Queue::clear( $product );   // discard them
```

Limits, so an unreachable server can neither bloat the site nor spam yours:

| Rule | Value |
|---|---|
| Items kept per product | 5 — the oldest is dropped |
| Attempts per item | 5, then abandoned |
| Maximum age | 7 days |
| Flush order | oldest first, stopping at the first failure |

A stored payload is the one that was attempted, verbatim — including the deactivation reason and
comment — and the retry is signed exactly like any first attempt. Front-end requests never flush, so a
visitor never waits on your telemetry.

Two consequences worth knowing:

* **Consent still rules.** Nothing is queued while consent is `pending` or `no`, a queued report is
  never transmitted after consent is withdrawn, and both the "No thanks" handler and
  `Product::forget()` (the eraser) clear the queue.
* **A deactivation report queued at deactivation time has nowhere to be flushed from** — the plugin is
  inactive from the next request onwards, so it is only delivered if the plugin is activated again.
  The deferred send in section 3 is what keeps this rare.

---

## 5. Privacy tools

The SDK registers one exporter and one eraser per product:

* **Export Personal Data** — lists the local record: plugin name, installation id, consent state,
  last report time, licence status, and a plain statement of whether data is being sent.
* **Erase Personal Data** — deletes those options and stops the heartbeat cron once no product is
  still opted in. It also tells the admin that server-side removal is available via the **Erase**
  action on the master site's Installations screen.

Plus suggested text for the client site's privacy policy via `wp_add_privacy_policy_content()`.

For WordPress.org submissions, add this to your readme's privacy section:

```markdown
## Privacy Policy

FivePrayer can share anonymous usage data with its developer, but only if you opt in. Before you
opt in, nothing is sent. After you opt in, the plugin sends your plugin, WordPress and PHP versions,
your site URL and locale, whether the site is multisite, and the deactivation reason and comment if
you choose to submit them when deactivating. It never sends email addresses, user names, passwords,
content, order data, database details or your IP address. You can withdraw consent at any time, and
the WordPress "Erase Personal Data" tool clears the local record.
```

---

## 6. Multiple iFiiri plugins on one site

Each plugin calls `Client::register()` with its own slug; one SDK instance serves them all. Consent,
installation ids and licence state are stored per product, so a "no" on one plugin is not inherited by
another. If two plugins bundle different SDK versions, the copy that loads first wins — keep bundled
copies in sync (the `IFI_SDK_VERSION` guard stops a second copy from redeclaring classes).

---

## 7. How the signing works

```
canonical = "POST\nifiiri/v1/heartbeat\n<timestamp>\n<nonce>\n<sha256 of raw body>"
signature = hash_hmac( 'sha256', canonical, secret )
```

Sent as `X-iFiiri-Client`, `X-iFiiri-Timestamp`, `X-iFiiri-Nonce` and `X-iFiiri-Signature`, with the
JSON body as sent. The route string is derived from the endpoint URL, so both permalink styles work.

Some hosts strip unknown `X-` headers. If the server answers `ifiiri_missing_credentials`, the
transport retries once with the same signed values in the query string and remembers that choice for
the product — no configuration needed.

**If the retry then fails with the same answer**, the master has its query-string fallback disabled
(it is off by default — enable **Allow signed credentials in the query string** under
iFiiri → Settings → Request security). The transport treats that as final: it switches the product's
delivery state to `disabled`, drains the retry queue, shows an admin notice with the exact fix, and
re-probes once a week in case the server has since been fixed. Delivery also surfaces ordinary
failures (unreachable, 401, 429) as a persistent admin notice — it deliberately has **no mute
button**: a silent dashboard is exactly how undelivered reports went unnoticed, so the notice stays
until delivery actually works again.

### Loopback endpoints and containerised local dev (Local / LocalWP)

If the endpoint points at `localhost` or `127.0.0.1` and PHP cannot open a connection at all
(cURL error 6/7/28), the transport retries the same signed request against **the site's own URL**
first, then any bases listed under the product's `fallback_endpoints` config key. This covers
development stacks where the PHP container cannot reach the host's published port (e.g. Local, where
the master runs on `localhost:10010` in the browser but port 80 of the site's own domain inside the
container).

The secret is **never exposed to JavaScript**: the browser calls `admin-ajax.php` on the local site
(with a nonce), and PHP performs the signed request.

---

## 8. Debugging

### Delivery states

The SDK records the last delivery outcome per product (option `ifiiri_{slug}_delivery`, never
autoloaded, nothing but state/reason/timestamps stored):

| State | Meaning | Notice? |
|---|---|---|
| `ok` | Last signed request was delivered | no |
| `degraded` | Last attempt failed; the retry queue still holds copies | yes |
| `broken` | Last attempt failed and nothing is queued (the report was dropped) | yes |
| `disabled` | The master rejects the transport for an unfixable reason (query auth disabled server-side); sending stops and re-probes weekly | yes, persistent |

```php
$product = \iFiiri\SDK\Client::product( 'fiveprayer' );

\iFiiri\SDK\Delivery::status( $product );   // state, reason, message, code, failed_at, succeeded_at
\iFiiri\SDK\Delivery::is_disabled( $product );
\iFiiri\SDK\Delivery::reset( $product );     // clear it after fixing the cause; sending resumes immediately
```

A failed opt-in now reports the real reason in the modal (for example the query-auth message above)
instead of a generic "will be sent later".

```php
add_action(
	'ifiiri_sdk_request_failed',
	static function ( $product, $code, $body ) {
		// $code is 0 when the request never reached the server.
		error_log( sprintf( 'iFiiri %s failed with %s', $product->slug(), (string) $code ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	},
	10,
	3
);
```

Still stuck? Copy `diagnostics.php` from this folder into the plugin's own folder on the affected site, open it in the browser once while logged in as an administrator (`https://yoursite.com/wp-content/plugins/fiveprayer/diagnostics.php`), and read the report: it shows the consent state, the retry queue, an outbound reachability check, and a real signed test report with the master's exact response. **Delete the file afterwards.**

| Symptom | Likely cause |
|---|---|
| Nothing in the master dashboard | Consent still `pending`, or the plugin was never deactivated-and-reactivated after the SDK was added |
| Works locally, never from production | Production host blocks outbound HTTP, strips `X-` headers (see section 7), or its clock is outside the 300 s skew window |
| `401` responses | Wrong `secret`, or it was rotated in the dashboard |
| `429` responses | Server rate limit — check **Settings → Request security** |
| No heartbeat after a week | WP-Cron needs traffic; add a real server cron for the client site |
| A report turned up minutes later | The retry queue delivered it: the master was unreachable when the event happened (section 4) |
| Consent prompt never appears | You are logged in as a user without `manage_options`, or `ask_for_consent` is `false` |

=== FivePrayer ===
Contributors: Jamaaldev,AhsanulBarakah
Tags: prayer, Muslim, salat, quran, islamic
Donate link: https://www.buymeacoffee.com/jamaaldev
Requires at least: 6.7
Tested up to: 7.1
Stable tag: 3.0.0
Requires PHP: 7.4
License: GPLv3 or later
License URI: https://www.gnu.org/licenses/gpl-3.0.txt

Five Prayer displays accurate Muslim prayer times and full-year timetables inside WordPress.

== Description ==
**Five Prayer** shows prayer times and a full-year timetable on any WordPress site, with any theme and any page builder.

Version **3.0.0** is compatible with **WordPress 7.1**.

**Download:** [latest release](https://github.com/AhsanulBarakah/fiveprayer/releases/latest) — install `fiveprayer-x.y.z.zip` from the Releases page.

**Try it without installing:** [open the live preview](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/AhsanulBarakah/fiveprayer/main/playground/blueprint.json) — WordPress Playground boots in your browser with FivePrayer already activated.

Ideal for mosques, Islamic centers, community masjids and prayer halls.

See **changelog.txt** for what each feature does.

[![Checks](https://github.com/AhsanulBarakah/fiveprayer/actions/workflows/checks.yml/badge.svg?branch=main)](https://github.com/AhsanulBarakah/fiveprayer/actions/workflows/checks.yml)
[![Security](https://github.com/AhsanulBarakah/fiveprayer/actions/workflows/security.yml/badge.svg?branch=main)](https://github.com/AhsanulBarakah/fiveprayer/actions/workflows/security.yml)
[![Verify release](https://github.com/AhsanulBarakah/fiveprayer/actions/workflows/verify-release.yml/badge.svg?branch=main)](https://github.com/AhsanulBarakah/fiveprayer/actions/workflows/verify-release.yml)
[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/AhsanulBarakah/fiveprayer/releases/latest)
[![License: GPLv3](https://img.shields.io/badge/license-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.txt)
[![Live preview](https://img.shields.io/badge/Playground-live%20preview-3858e9.svg)](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/AhsanulBarakah/fiveprayer/main/playground/blueprint.json)

== Live Preview ==
Click **[open FivePrayer in WordPress Playground](https://playground.wordpress.net/?blueprint-url=https://raw.githubusercontent.com/AhsanulBarakah/fiveprayer/main/playground/blueprint.json)** to run the plugin in a sandbox WordPress inside your browser — nothing to install and nothing to clean up. The blueprint in `playground/blueprint.json` installs the release zip, activates FivePrayer and opens it in the admin sidebar.

The preview downloads the asset straight from the Releases page, so it always runs the version published there.

== Features ==
* Full-year prayer timetable
* Monthly timetable printing
* Timetable styles, print header text and logo
* Custom location
* Hijri Calendar
* Ramadan start adjustment
* Custom Translation
* Iqama delay
* Tune offsets
* Table Display Options
* Timetable Layout customizer
* Feature Switches
* Configure Settings
* Custom prayer calculation methods (MWL, ISNA, Umm Al-Qura and your own)
* Unified Method (custom criteria and seasonal switching)
* London Unified Prayer Times — paste the full printed year (all 12 months) into Unified Method, or apply the built-in London Unified / East London printed safety margins
* Rounding method (nearest / up / down / none)
* Day-to-Day Smoothing
* Calendar Type (Gregorian, Hijri or Persian year)
* Asr calculation by school (1 Mithl or 2 Mithl)
* Second Asr (2 Mithl) column, shortcode and builder field
* Advanced Schedules (beta)
* Next Prayer Countdown
* Extra Prayers
* Day Display
* Next-prayer highlight
* TV Display Mode (beta)
* Share on Local Network
* Display Settings
* Public REST API
* API Management
* API Security
* Import, export and reset settings
* Page builder support
* Gutenberg blocks
* Caching plugin compatibility

== Shortcodes ==
The complete shortcode list is in **Docs**; see **changelog.txt** for what each one does.

* `[Fp_TimeTable_Monthly]` — the printed timetable
* `[Fp_Vertical_Daily_Prayer]` — today's prayers, stacked
* `[Fp_Single_Next_Prayer_Remaining]` — countdown to the next prayer
* `[Fp_Extra_Prayer_1]` … `[Fp_Extra_Prayer_6]` — the optional extra prayers
* `[Fp_Printer_Button]` and `[Fp_Printer_Button_URL]`
* `[Fp_Single_CurrentDate]`, `[Fp_Single_CurrentTime]` and `[Fp_Single_Hijra_Date]`
* `[Fp_Single_Asr_2_Begins_time]` — the second Asr (2 Mithl / Hanafi)
* Per-prayer `_Name`, `_Begins_time` and `_Iqamah_time`

== Installation ==
= Automatic Installation =
1. Go to **Plugins > Add New**.
2. Search for **Five Prayer**.
3. Click **Install Now**, then activate.

= Manual Installation =
1. Upload the **Five Prayer** folder to `/wp-content/plugins/`.
2. Activate **Five Prayer** from the **Plugins** menu.

== After Activation ==
Five steps turn a fresh install into a working timetable. Each one is shown in **Screenshots** below.

1. **Set the timezone** — Settings > General > Timezone, choose your city and click Save Changes. Prayer times are local clock times, so this comes first.
2. **Add your location** — FivePrayer > Customizing > Location: Country, City, Latitude and Longitude, then Add Location. Saved locations are what the "Location, City" field lists.
3. **Fill in Prayer Settings** — FivePrayer > Prayer Settings: the Month you want to print, the saved Location, City, Higher Latitude Adjustment, Calculation Method, Asr Calculation and Midnight Calculation Mode. Tune Prayer and Iqamah Delay are optional.
4. **Generate the calendar** — click Generate Calendar in the Tune Prayer card. It saves every setting and builds the whole year, so the table appears underneath.
5. **Check the timetable** — Customizing > TimeTable shows the generated month; colours, headers and rows are stored with Save Colors.

== Upgrade Notice ==
= 3.0.0 =
Compatible with WordPress 7.1. Back up before upgrading from 2.4.x; **changelog.txt** lists every new and changed feature.

== Frequently Asked Questions ==
= Does it work with caching plugins? =
Yes.

= How do I clear the cache? =
Click **Generate Calendar** in Prayer Settings.

= What is TV Display Mode? =
An opt-in full-screen display for a mosque TV. See **changelog.txt**.

= Does Five Prayer have an API? =
Yes. See **changelog.txt**.

= Does it collect any data? =
No. The plugin sends no data anywhere — not to us, not to any third party.

== Screenshots ==
FivePrayer 3.0.0 on WordPress 7.1.4, captured in WordPress Playground, in the order you meet them. One image per line.

= 1. Set the timezone =
Settings > General, Timezone set to your city.

![Timezone under Settings > General](screenshots/setup-01-timezone.png)

= 2. Add your location =
Customizing > Location, showing the saved location that the Prayer Settings field lists.

![Adding a location](screenshots/setup-02-location.png)

= 3. Fill in Prayer Settings before generating =
Month, Location, City, Higher Latitude, Calculation Method, Asr Calculation and Midnight Calculation Mode chosen; tuning fields left at 0.

![Prayer Settings filled in](screenshots/setup-03-prayer-settings.png)

= 4. Generate the calendar =
Generate Calendar builds the year and the table appears underneath it.

![Generate Calendar](screenshots/setup-04-generate.png)

= 5. Check the generated timetable =
Customizing > TimeTable with the generated month.

![The generated timetable](screenshots/setup-05-timetable.png)

== Changelog ==
= 3.0.0 =
Compatible with WordPress 7.1. See **changelog.txt** for the complete version history, or read it online at https://fiveprayer.com/changelog.

== Contributors ==
* [@jamaaldev](https://github.com/jamaaldev) — owner and original author
* [@AhsanulBarakah](https://github.com/AhsanulBarakah) — contributor and maintainer

== Development ==
Requirements: Node 22+, pnpm, PHP 8.3+ and Composer.

1. `pnpm install` — installs dependencies and enables the pre-commit hook from `.githooks/pre-commit`.
2. `npm run hooks:install` — re-enables that hook by hand in a fresh clone.
3. `npm run build` — production build; `npm test` — unit, JS and PHP suites.

Commit messages carry no AI attribution — see `AGENTS.md` for that and the other repository conventions.

The hook lints staged PHP, typechecks, and runs the unit and TV-display suites before every commit. Skip it deliberately with `SKIP_CHECKS=1 git commit` or `git commit --no-verify`. GitHub runs the same checks, plus the production build and the WordPress-backed PHP tests, on every push and pull request — see `.github/workflows/checks.yml` and the badges above. The Security workflow adds three more: a dependency audit (`pnpm audit`), the PHP security scan (`npm run lint:php-security`, which fails on `eval()`, shell execution, `unserialize()`, variable includes and SQL built from request data) and the WordPress hardening suite.

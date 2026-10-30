/**
 * TVDisplayModeDoc
 *
 * In-admin usage guide for the TV Display Mode feature. Mirrors the structure
 * of the other Docs pages (header card, sections, tips) so it renders
 * identically inside the Documentation screen.
 *
 * @module Docs/TVDisplayModeDoc
 */
import React from 'react';
import { Link } from 'react-router';
import { __ } from '@wordpress/i18n';

const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
	<code className="bg-gray-200 px-1.5 py-0.5 rounded-sm text-sm">{children}</code>
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

const TVDisplayModeDoc: React.FC = () => {
	return (
		<div className="max-w-6xl mx-auto p-6">
			{/* Header */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h2 className="text-2xl font-bold text-gray-800 text-center mb-4">{__('TV Display Mode Guide', 'fiveprayer')}</h2>
				<p className="text-lg text-gray-700 text-center">
					{__('Turn any page into a full-screen digital display for your mosque. The page scales to fit any screen — from a small monitor to a 4K TV — with no scrollbars, and hides the site chrome: the theme header, footer, sidebars and the page title.', 'fiveprayer')}
				</p>
				<div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
					<p className="text-sm text-gray-700 text-center">
						{__('Setting this up for a masjid? See the', 'fiveprayer')}{' '}
						<Link to="/documentation/mosquetv" className="text-green-700 font-semibold underline">{__('Mosque TV Display — Deployment Guide', 'fiveprayer')}</Link>{' '}
						{__('for the screen setup and how several mosques share the same data securely.', 'fiveprayer')}
					</p>
				</div>
			</div>

			{/* Beta notice */}
			<div className="bg-amber-50 border border-amber-200 p-5 rounded-lg mb-6">
				<p className="text-gray-800">
					<strong>{__('⚠️ Beta Feature:', 'fiveprayer')}</strong>{__(' TV Display Mode is currently in beta. It is usable, but parts of it may still change or need improvement — check how the display looks on your own screen after every update, and ', 'fiveprayer')}<strong>{__('switch TV Display Mode off', 'fiveprayer')}</strong>{__(' if you need the page to behave like a normal page again. Your ticks in the pages and posts are kept, so switching it back on restores the same displays.', 'fiveprayer')}
				</p>
			</div>

			{/* What it is */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('What is TV Display Mode?', 'fiveprayer')}</h3>
				<p className="text-gray-700 mb-3">
					{__('TV Display Mode is an opt-in setting on a single page. When it is enabled, that page automatically scales to fill the screen and hides site chrome. When it is disabled, the page behaves exactly like a normal website page.', 'fiveprayer')}
				</p>
				<p className="text-gray-700">
					{__('It works on top of any page builder that renders a normal page (Gutenberg, Elementor, Divi, Brizy, Beaver Builder, Bricks, Breakdance, the classic editor) without changing what you designed: the whole layout is measured and scaled as a single unit, so colours, widths, spacing, columns, backgrounds and images all stay exactly as you built them.', 'fiveprayer')}
				</p>
			</div>

			{/* Where to find it */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Where to find it', 'fiveprayer')}</h3>
				<ul className="text-gray-700 space-y-2">
					<li>• {__('Check that', 'fiveprayer')} <strong>{__('TV Display Mode', 'fiveprayer')}</strong> {__('is switched on in', 'fiveprayer')} <strong>{__('FivePrayer → Customizing → Configure Settings → Feature Switches', 'fiveprayer')}</strong>{__(' — it is the master switch of this feature, and while it is off the TV Display Mode page is not listed in the Categories list at all. Switch it on there and the page appears; turn it off again and its three switches are switched off with it.', 'fiveprayer')}</li>
					<li>• {__('Then switch on the post type you are editing in', 'fiveprayer')} <strong>{__('FivePrayer → Customizing → Configure Settings → TV Display Mode', 'fiveprayer')}</strong>{__(' — the page has three switches, one for Pages, one for Posts and one for opening the site from a TV or phone on your Wi-Fi, and all three start off.', 'fiveprayer')}</li>
					<li>• {__('Only installing the display on a computer or box that runs the site, with the screen on that same machine? Leave the third switch,', 'fiveprayer')} <strong>{__('“Share on Local Network,”', 'fiveprayer')}</strong> {__('off — it is only needed when the TV or phone is another device on the network.', 'fiveprayer')}</li>
					<li>• {__('Go to', 'fiveprayer')} <strong>{__('Pages', 'fiveprayer')}</strong> {__('or', 'fiveprayer')} <strong>{__('Posts', 'fiveprayer')}</strong> {__('in the WordPress admin and open (or create) the page you want to use as the TV display.', 'fiveprayer')}</li>
					<li>• {__('Look for the box titled', 'fiveprayer')} <strong>{__('“TV Mode”', 'fiveprayer')}</strong> {__('— the short name for TV Display Mode, used because the box is read in the narrow editor sidebar.', 'fiveprayer')}</li>
					<li>• {__('Classic Editor: it is in the right-hand sidebar.', 'fiveprayer')}</li>
					<li>• {__('Block Editor (Gutenberg): open the Settings sidebar (⚙ gear, top-right); if you do not see it there, scroll to the bottom of the editor below the content.', 'fiveprayer')}</li>
				</ul>
			</div>

			{/* Step by step */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Step-by-step: enable it', 'fiveprayer')}</h3>
				<div className="space-y-3">
					<Step n="1" title={__('Build the page', 'fiveprayer')}>
						<p>{__('Create or open the page (or post) and design it the way you want it to appear on the TV — a 1920 × 1080 canvas matches a Full HD TV. The finished page is scaled to fit the screen, so the layout you design is the layout the screen shows.', 'fiveprayer')}</p>
					</Step>
					<Step n="2" title={__('Open the TV settings panel', 'fiveprayer')}>
						<p>{__('Find the “TV Mode” box (right sidebar in Classic, bottom of the editor in Gutenberg).', 'fiveprayer')}</p>
					</Step>
					<Step n="3" title={__('Tick the checkbox', 'fiveprayer')}>
						<p>{__('Enable', 'fiveprayer')} <strong>{__('“Enable TV Mode.”', 'fiveprayer')}</strong></p>
					</Step>
					<Step n="4" title={__('Save the page', 'fiveprayer')}>
						<p>{__('Click', 'fiveprayer')} <strong>{__('Publish', 'fiveprayer')}</strong> {__('or', 'fiveprayer')} <strong>{__('Update', 'fiveprayer')}</strong>{__('. The setting is saved securely to the page.', 'fiveprayer')}</p>
					</Step>
					<Step n="5" title={__('Preview', 'fiveprayer')}>
						<p>{__('Click', 'fiveprayer')} <strong>{__('View Page', 'fiveprayer')}</strong>{__('. The page should fill the whole viewport with no scrollbars, and the theme header, footer, sidebar and page title hidden.', 'fiveprayer')}</p>
					</Step>
				</div>
			</div>

			{/* Put it on the TV */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Put it on the TV (kiosk mode)', 'fiveprayer')}</h3>
				<div className="space-y-3 text-gray-700">
					<p>{__('1. Open the page URL in the TV’s browser.', 'fiveprayer')}</p>
					<p>{__('2. Press F11 (Windows) or Ctrl + Cmd + F (macOS) to go full screen, or use the browser’s kiosk mode.', 'fiveprayer')}</p>
					<p>{__('3. For a permanently installed display, launch the browser directly in kiosk mode:', 'fiveprayer')}</p>
					<div className="rounded-lg overflow-hidden border border-gray-200">
						<pre className="bg-gray-950 p-4 overflow-x-auto"><code className="text-emerald-400 font-mono text-sm leading-relaxed">{`chrome --kiosk --app="https://your-site.com/tv-page/"\nmsedge --kiosk "https://your-site.com/tv-page/"`}</code></pre>
					</div>
					<p>{__('4. Disable the screensaver / sleep on the TV device. The page re-scales automatically if the resolution changes.', 'fiveprayer')}</p>
					<p className="text-red-700 text-sm">{__('Open the page with the computer’s network address on the TV — for example', 'fiveprayer')} <Code>http://192.168.1.104:10010/timetable/</Code> {__('— never localhost. localhost on the TV means the TV itself, so the page will not load and TV Display Mode cannot run. The address must be the same IP you use to reach the site from a phone.', 'fiveprayer')}</p>
					<p className="text-gray-700">{__('For that address to work from another device, turn on the', 'fiveprayer')} <strong>{__('“Share on Local Network”', 'fiveprayer')}</strong> {__('switch in Configure Settings → TV Display Mode. It is off by default, and while it is off the site keeps building every link for localhost, so the TV and phone cannot load the page at all.', 'fiveprayer')}</p>
				</div>
			</div>

			{/* What gets hidden */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('What gets hidden on a TV page', 'fiveprayer')}</h3>
				<p className="text-gray-700 mb-3">{__('Only on the opted-in page, and only site chrome. It is done by structure: the script hides everything around your content, so the theme header, the footer, the sidebars, the page title and any widget another plugin floats over the page all disappear without needing to know your theme’s class names. The common containers are also named in the stylesheet:', 'fiveprayer')}</p>
				<ul className="text-gray-700 space-y-1 text-sm">
					<li>• {__('Theme header and footer —', 'fiveprayer')} <Code>&lt;header&gt;</Code> / <Code>&lt;footer&gt;</Code> {__('at body level,', 'fiveprayer')} <Code>#masthead</Code>, <Code>#colophon</Code>, <Code>.site-header</Code>, <Code>.site-footer</Code>, <Code>#main-header</Code>, <Code>#main-footer</Code></li>
					<li>• {__('Headers and footers built with a theme builder —', 'fiveprayer')} <Code>.elementor-location-header</Code>, <Code>.et-l--header</Code> {__('(Divi)', 'fiveprayer')}, <Code>.fl-theme-builder-header</Code> {__('(Beaver Themer)', 'fiveprayer')}</li>
					<li>• {__('Block-theme header and footer template parts —', 'fiveprayer')} <Code>header.wp-block-template-part</Code>, <Code>footer.wp-block-template-part</Code></li>
					<li>• {__('Navigation and sidebars —', 'fiveprayer')} <Code>.site-navigation</Code>, <Code>.main-navigation</Code>, <Code>#secondary</Code>, <Code>.widget-area</Code>, <Code>#footer-widgets</Code>, <Code>.skip-link</Code></li>
					<li>• {__('The page title your theme prints automatically —', 'fiveprayer')} <Code>.entry-header</Code>, <Code>.entry-title</Code>, <Code>.page-title</Code>, <Code>.wp-block-post-title</Code></li>
					<li>• <Code>#wpadminbar</Code> {__('(WordPress admin bar)', 'fiveprayer')}</li>
				</ul>
				<p className="text-gray-700 text-sm mt-3">
					{__('A heading you placed yourself in the builder is not touched — only the title the theme prints on its own is hidden. To show that title again, add this in Appearance → Customize → Additional CSS:', 'fiveprayer')} <Code>{'body.fiveprayer-tv-active .entry-title { display: block !important; }'}</Code>
				</p>
				<p className="text-gray-700 mt-4">
					{__('To hide any other element, add the CSS class', 'fiveprayer')} <Code>fiveprayer-tv-hide</Code> {__('to it. Content you designed inside the page is never removed — a header or footer section you built inside the page is your design, so it stays and can be hidden with the same class if you want it gone.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mt-3">
					{__('The empty space a theme adds around your content is removed too. Themes wrap content in their own boxes and give them margins, paddings and borders you never designed; on a TV those show up as empty bands around the page. On the TV page the content wrapper and every container above it have those three properties set to zero. Only margin, padding and border are touched — never width or max-width — and the pass stops at the content wrapper, so your design gets the full width the theme was eating while everything your page builder or Gutenberg created keeps its spacing exactly as designed. One exception, and it only applies while Canvas Force is on: the cap a theme puts on the design wrapper itself (a block theme’s Content width) is lifted, so the page keeps the same width the canvas box gives it instead of arriving on the device as a narrower column with bands left and right.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mt-3">
					{__('Block themes print the page title inside the content wrapper, with spacer blocks around it, and give their wrappers a top margin. Since that title is hidden on a TV page, the top of the page is flushed: the top edge only (top margin, padding and border) of the content wrapper and every wrapper above it is zeroed, and leading boxes that hold no visible text and paint nothing — the spacer blocks and the group that framed the hidden title — are removed. A leading box that paints a background or border, or holds text, is kept.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mt-3">
					{__('That pass also stops at the content wrapper, so your own blocks are untouched: a spacer block you placed at the top of the page stays exactly where you put it (delete it in the editor if you do not want it), and no section padding or block gap is changed. If a page should be inset from the top, put it back with', 'fiveprayer')} <Code>{'body.fiveprayer-tv-active .fiveprayer-tv-trim { padding-top: 40px !important; }'}</Code>
				</p>
				<p className="text-gray-700 mt-3">
					{__('Nothing else is touched. TV Display Mode does not resize, restyle or repaint the content: the page keeps the widths, spacing and backgrounds your design gave it, and is then scaled as one unit to fit the screen. That is why the TV shows the same layout you see in the builder canvas — at the same width, too: while Canvas Force is on, the theme’s cap on the design wrapper is lifted in both places (see above). When the page’s chosen size carries a height, that canvas box is what gets scaled to the screen. A page that grows taller than the box is fitted by its own height instead of running past the bottom edge, because the display page cannot be scrolled and anything below the edge of the screen could never be seen — every row of the design stays on the screen, at a slightly smaller scale. The last thing the page shows also keeps a small clearance below it — three per cent of the screen height, between 12 and 60 px — so a panel that crops its edges cannot cut the last row. The clearance is measured against what the page actually shows, so a page that already leaves space under its content is not shrunk for it.', 'fiveprayer')}
				</p>
			</div>

			{/* Layout width / breakpoints */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Which breakpoint the TV gets (Layout width)', 'fiveprayer')}</h3>
				<p className="text-gray-700 mb-3">
					{__('A page builder decides which of its designs to show — desktop, tablet or mobile — with CSS media queries, and a media query measures the browser’s viewport width, not the scale TV Display Mode applies. A smart-TV browser usually reports a much narrower width than the screen (≈980 px, or ≈960 px on a 1080p screen), so the builder shows its tablet or mobile layout and the desktop breakpoint looks like it is being ignored. The builder is not ignoring it: it is measuring a number nobody chose.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mb-3">
					{__('The “Layout width” row on this settings page (Configure Settings → TV Display Mode) settles it: it writes the width into the display page’s viewport tag, so the TV lays the page out at exactly that width and fits that canvas to the screen itself. Every breakpoint then resolves the same way on every screen.', 'fiveprayer')}
				</p>
				<ul className="text-gray-700 space-y-1 text-sm">
					<li>• <strong>{__('Auto (default)', 'fiveprayer')}</strong> {__('— the page is left exactly as your theme printed it and the TV’s own width decides, which is how it worked before this setting existed.', 'fiveprayer')}</li>
					<li>• <strong>{__('Full HD — 1920 px (recommended)', 'fiveprayer')}</strong> {__('— the setting to use when you designed the page at 1920 and the TV shows a narrower layout. It is the same for a 4K TV: the design is enlarged to the screen by the TV itself.', 'fiveprayer')}</li>
					<li>• <strong>{__('A width that is not in the list', 'fiveprayer')}</strong> {__('— the list holds the built-in widths and your own named sizes only, so a width that is missing (1440, 1850, anything) is added once under “Your own sizes” below and then appears here and in every page’s “Layout width” list. A width smaller than the screen is allowed and useful: 1280 on a Full HD TV gives you the builder’s smaller-desktop layout, still fitted to the screen.', 'fiveprayer')}</li>
				</ul>
				<p className="text-gray-700 mt-3 text-sm">
					{__('Screens of different shapes never need different pages, and the same page can serve both. The width is chosen at three levels: a width in the address (', 'fiveprayer')}<Code>?fiveprayer_tv_width=480</Code>{__(') applies to that one device only and is stored nowhere, the', 'fiveprayer')} <strong>{__('Layout width', 'fiveprayer')}</strong> {__('list in that page’s “TV Mode” box applies to that one page, and this row is the default for every display page.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mt-3 text-sm">
					<strong>{__('Your own sizes.', 'fiveprayer')}</strong>{' '}{__('The list of widths is not fixed: name the screens you have under “Your own sizes” (for example Hall TV — 1920, Entrance panel — 1440) and every name appears in this list and in the “Layout width” list of every page’s “TV Mode” box, so a screen is picked by name instead of a number. Up to 12 sizes, a name up to 40 characters, and a name given to a built-in width replaces the built-in label for it. A typed width has to be saved with a name to stay in the list, and the address argument still takes a plain number.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mt-3 text-sm">
					{__('A vertical (portrait) screen wants a narrow width — that is what makes the page use the design you built for it. WordPress switches design at 782 px (tablet) and 480 px (phone), so choose 480 for a phone-style column or 782 for a tablet-style one. Build that narrow layout on the same page (Styles → the Desktop / Tablet / Mobile switcher); the page is still fitted to the panel, so nothing is stretched.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mt-3 text-sm">
					{__('It changes nothing inside the page — no element is resized, re-spaced or restyled. It only states the width the page is laid out at, exactly as a browser window of that width would. To see which width a screen actually reports, open the display page on it and add', 'fiveprayer')} <Code>?fiveprayer_tv_report</Code> {__('to the address: a small panel appears in the corner with the reported size, the pixel ratio and the canvas in use. Reload without it and the panel is gone.', 'fiveprayer')}
				</p>
			</div>

			{/* TV type: modern TV vs older TV */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Which screen it is built for (TV type)', 'fiveprayer')}</h3>
				<p className="text-gray-700 mb-3">
					{__('Televisions do not all show the same picture. A modern TV or a computer monitor shows everything your page draws. Many older televisions crop a few percent off every edge — called overscan — so the outer band never reaches the viewer and text close to the edge is cut. That happens inside the television, after the page has left the computer, so no CSS on the page can prevent it.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mb-3">
					{__('The “TV type” row on Configure Settings → TV Display Mode tells the site which screen it drives:', 'fiveprayer')}
				</p>
				<ul className="text-gray-700 space-y-1 text-sm">
					<li>• <strong>{__('Modern TV / monitor', 'fiveprayer')}</strong> {__('(the default) — the display uses the whole screen, exactly as before this setting existed.', 'fiveprayer')}</li>
					<li>• <strong>{__('Older TV', 'fiveprayer')}</strong> {__('— the display keeps your design inside the middle 90% of the screen, so the television’s cropping never removes it, and the safe-zone guide in the page builder marks that same 5% band.', 'fiveprayer')}</li>
				</ul>
				<p className="text-gray-700 mt-3 text-sm">
					{__('One number is used (about 5% per edge) because that is the usual overscan and the broadcast safe-area convention. With Modern TV the safe area is the whole screen, so nothing moves — which is why it is the default.', 'fiveprayer')}
				</p>
			</div>

			{/* Editor design aids: Canvas Force + Safe Zone Guide */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Designing at the TV’s size (Canvas Force & Safe Zone Guide)', 'fiveprayer')}</h3>
				<p className="text-gray-700 mb-3">
					{__('A page builder decides what “100% height” and “vh” mean from the browser window it is shown in — your laptop, not the TV. A section styled height: 100vh therefore shrinks to the laptop and looks broken on the screen even though the design is right. Two editor-only switches on Configure Settings → TV Display Mode, under “Editor design aids”, fix that inside the builder without touching the finished page.', 'fiveprayer')}
				</p>
				<ul className="text-gray-700 space-y-1 text-sm">
					<li>• <strong>{__('Canvas Force', 'fiveprayer')}</strong> {__('— locks the builder’s editing canvas to the display page’s chosen width × height, so 100%-height and vh elements scale to the TV layout instead of your laptop.', 'fiveprayer')}</li>
					<li>• <strong>{__('Safe Zone Guide', 'fiveprayer')}</strong> {__('— draws a read-only guide over the canvas: the inner dashed frame is the band a TV can crop, taken from the “TV type” row above (5% per edge for an older TV, none for a modern one). Keep text and times inside it. The size and meaning of the frames are shown in a badge just above the canvas, outside it, so it never covers your design. The guide ignores the pointer, so it never blocks a click or drag.', 'fiveprayer')}</li>
				</ul>
				<p className="text-gray-700 mt-3 text-sm">
					{__('The two switches are independent and both start off. They need a size that carries a height — pick or name one under “Your own sizes” on this page (for example Hall TV — 1920 × 1080). With the default Auto width there is no height to lock to, so nothing is injected. Editor only: the finished, front-end display page is never changed.', 'fiveprayer')}
				</p>
				<p className="text-gray-700 mt-3 text-sm">
					<strong>{__('Controlling it while you edit.', 'fiveprayer')}</strong>{' '}{__('Open the display page in your page builder and a small “TV canvas” button appears in the bottom-left of the canvas. Click it once to turn the canvas lock and the guide off together, and again to bring them back — the quick way to see the plain page. When both halves are turned on here, a small caret beside the button uncovers a switch for each, so you can toggle them separately. A half that is switched off here is not shown in the button at all. This only affects the editor session you are in; it never changes the saved setting, so reloading the editor returns to it.', 'fiveprayer')}
				</p>
			</div>

			{/* Turn off */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Turn it off', 'fiveprayer')}</h3>
				<p className="text-gray-700">
					{__('Open the page, untick “Enable TV Mode” in the “TV Mode” box, and click Update. The page immediately returns to normal. The toggle only ever affects that single page. To remove the checkbox from every editor of one post type at once, switch Pages or Posts off in Configure Settings → TV Display Mode — your ticks are kept, so switching it back on restores the same display pages. Switch “Share on Local Network” off as well when you no longer need to open the site from another device: with it off, the network address stops being rewritten, so only this computer serves the site.', 'fiveprayer')}
				</p>
			</div>

			{/* Troubleshooting */}
			<div className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-6">
				<h3 className="text-xl font-semibold text-gray-800 mb-4">{__('Troubleshooting', 'fiveprayer')}</h3>
				<div className="space-y-4">
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('Page does not fill the screen / text is tiny', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm mb-2">{__('The scaling engine could not find the right content wrapper. Tell it which wrapper to use with this filter (in your theme’s functions.php or a small custom plugin):', 'fiveprayer')}</p>
						<div className="rounded-lg overflow-hidden border border-gray-200">
							<pre className="bg-gray-950 p-4 overflow-x-auto"><code className="text-emerald-400 font-mono text-sm leading-relaxed">{`add_filter( 'fiveprayer_tv_display_content_selectors', function ( $selectors ) {\n    array_unshift( $selectors, '.my-builder-wrapper' );\n    return $selectors;\n} );`}</code></pre>
						</div>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('My page builder’s breakpoint is not being used on the TV', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">{__('A smart-TV browser usually reports a much narrower width than the screen (≈980 px, or ≈960 px on a 1080p screen), so your builder renders its tablet or mobile design even though the TV is Full HD. Set', 'fiveprayer')} <strong>{__('Layout width', 'fiveprayer')}</strong> {__('to the width you designed for — Full HD (1920 px) for most installations — on Configure Settings → TV Display Mode. On a computer or mini PC that drives the screen this is rarely needed, because the browser reports the real window width and the desktop breakpoint already applies.', 'fiveprayer')}</p>
						<p className="text-gray-700 text-sm mt-2">{__('Not sure which width a screen reports? Open the display page on it with', 'fiveprayer')} <Code>?fiveprayer_tv_report</Code> {__('and read the panel in the corner.', 'fiveprayer')}</p>
						<p className="text-gray-700 text-sm mt-2">{__('If the same page runs on screens of two shapes, override the width where they differ instead of making a second page: the “Layout width” list in that page’s “TV Mode” box, or', 'fiveprayer')} <Code>?fiveprayer_tv_width=480</Code> {__('in the address opened on the vertical one. A vertical panel wants a narrow width (480 for the phone layout, 782 for the tablet layout).', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('The screen layout does not match my page builder', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">{__('TV Display Mode measures the layout your builder produced and scales it as a whole, so nothing inside the page moves — the cause is outside this feature. Two things are worth checking:', 'fiveprayer')}</p>
						<ul className="text-gray-700 text-sm mt-2 space-y-1">
							<li>• <strong>{__('The screen is a different size than the canvas you designed on.', 'fiveprayer')}</strong> {__('The whole page is scaled to fit, so text and images change size together — the arrangement of the page does not.', 'fiveprayer')}</li>
							<li>• <strong>{__('Your builder switched to its tablet or mobile layout.', 'fiveprayer')}</strong> {__('Page builders define a separate layout per breakpoint, chosen by the browser window width. A window narrower than the builder’s tablet breakpoint shows the tablet design — on any page of the site, TV mode or not. Open the page in a window as wide as the TV’s resolution to see it at 100%.', 'fiveprayer')}</li>
						</ul>
						<p className="text-gray-700 text-sm mt-2">{__('If it still differs, another plugin or your child theme is overriding your builder’s CSS. Test the page with those disabled, then fix the rule that conflicts.', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('My page builder canvas looks like a normal page', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">{__('That is on purpose, not a bug: Elementor, Divi, Brizy, Bricks, Builderius, Beaver Builder, Oxygen, WPBakery, Breakdance, Thrive and the WordPress customizer all open the real front-end URL inside their editor, so the signage treatment is deliberately switched off while you design — you get a normal page with the theme header, footer and sidebars, and no scaling. The TV look appears when the page is opened normally, including View Page and Preview. If your builder uses a different address argument for its canvas, add it with the', 'fiveprayer')} <Code>fiveprayer_tv_display_design_query_args</Code> {__('filter.', 'fiveprayer')}</p>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('There is a band of empty space at the top of the page', 'fiveprayer')}</h4>
						<ul className="text-gray-700 text-sm space-y-1">
							<li>• {__('The top of a display page is flushed automatically: the theme’s top margin on the content wrapper and the spacer blocks that framed the theme’s hidden page title are removed. If a band is left, it is almost always a spacer block or a group with top padding at the top of your own page content — open the page in the block editor and remove or shrink it. The plugin never changes spacing inside your content, so that one is yours to delete. The fit-to-screen scaling never leaves its leftover above the design either — the box is anchored to the top of the screen — so a band at the top is always content spacing.', 'fiveprayer')}</li>
							<li>• {__('If the theme’s page title is still visible, or another plugin adds an announcement bar above the content, give that element the class', 'fiveprayer')} <Code>fiveprayer-tv-hide</Code>{__('.', 'fiveprayer')}</li>
							<li>• {__('A design that is meant to be inset from the top needs one line back:', 'fiveprayer')} <Code>{'body.fiveprayer-tv-active .fiveprayer-tv-trim { padding-top: 40px !important; }'}</Code></li>
						</ul>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('There is still empty space around or inside the page', 'fiveprayer')}</h4>
						<ul className="text-gray-700 text-sm space-y-1">
							<li>• <strong>{__('Empty space around the page', 'fiveprayer')}</strong> {__('(bands of background colour) is the fit-to-screen scaling plus the boxed content width your theme or Gutenberg uses. That width is kept on purpose so your design is not resized, and the theme’s own margins and paddings are already removed. On a page whose chosen size carries a height (your own sizes, or a preset with one) the shape of that canvas box against the screen is what the bands are — they don’t change when your content gets longer, because the box, not the content, is what gets fitted. Sideways that space is centred; vertically it stays below the design, because the box is anchored to the top of the screen and nothing is ever left above it. A page with no chosen height is fitted whole, so a very large element inside it makes the page appear smaller instead.', 'fiveprayer')}</li>
							<li>• <strong>{__('Empty space inside the page', 'fiveprayer')}</strong> {__('comes from your own layout: block gaps, group padding, section padding, and Gutenberg’s content width (Site Editor → Styles → Layout → Content width). Change those where you designed them, as on any normal page.', 'fiveprayer')}</li>
							<li>• {__('To see which rule is winning, open the TV page, right-click the gap and inspect it: a rule from', 'fiveprayer')} <Code>tv-display.css</Code> {__('is theme spacing the cleaning pass has missed — that is worth reporting.', 'fiveprayer')}</li>
						</ul>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('I still see the header, the footer or the page title', 'fiveprayer')}</h4>
						<ul className="text-gray-700 text-sm space-y-1">
							<li>• {__('If it is a header or footer you built inside the page itself, it is part of your design and is kept. Hide it with the class', 'fiveprayer')} <Code>fiveprayer-tv-hide</Code>{__('.', 'fiveprayer')}</li>
							<li>• {__('If another plugin adds it after the page has loaded (a chat bubble, an announcement bar, a cookie banner), nothing can detect it up front: give it the same class, or hide it with', 'fiveprayer')} <Code>body.fiveprayer-tv-active .that-element {'{'} display: none !important; {'}'}</Code></li>
							<li>• {__('If it is the browser’s own title bar or tab, that is the browser, not the page — launch the display in kiosk mode instead.', 'fiveprayer')}</li>
							<li>• {__('If it is a cached copy, purge the page cache or CDN for that page.', 'fiveprayer')}</li>
						</ul>
					</div>
					<div className="bg-gray-50 p-4 rounded-lg">
						<h4 className="text-lg font-semibold text-gray-800 mb-2">{__('The settings panel does not appear', 'fiveprayer')}</h4>
						<p className="text-gray-700 text-sm">{__('Three things must be true: TV Display Mode must be on in Configure Settings → Feature Switches, the Pages (or Posts) switch must be on in Configure Settings → TV Display Mode, and you must be editing a page or a post. Custom post types and the media library never show the panel.', 'fiveprayer')}</p>
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
								[__('Post meta key', 'fiveprayer'), '_fiveprayer_tv_mode'],
								[__('Stored values', 'fiveprayer'), "'1' = on, '0' = off"],
								[__('Body class', 'fiveprayer'), 'fiveprayer-tv-active'],
								[__('Staged wrapper class', 'fiveprayer'), 'fiveprayer-tv-stage'],
								[__('Cleaned wrapper class', 'fiveprayer'), 'fiveprayer-tv-clean'],
								[__('Top-edge trim class', 'fiveprayer'), 'fiveprayer-tv-trim'],
								[__('Leading empty boxes class', 'fiveprayer'), 'fiveprayer-tv-trim-hide'],
								[__('Scale variable', 'fiveprayer'), '--fiveprayer-tv-scale'],
								[__('Style handle', 'fiveprayer'), 'fiveprayer-tv-display'],
								[__('Script handle', 'fiveprayer'), 'fiveprayer-tv-display'],
								[__('Layout width option', 'fiveprayer'), 'fiveprayer_tv_display_canvas_width'],
								[__('Layout width save action', 'fiveprayer'), 'fp_save_tv_canvas_width'],
								[__('Layout width for one page', 'fiveprayer'), '_fiveprayer_tv_canvas_width'],
								[__('Layout width for one device', 'fiveprayer'), '?fiveprayer_tv_width=<n> or auto'],
								[__('Your own sizes option', 'fiveprayer'), 'fiveprayer_tv_display_canvas_presets'],
								[__('Your own sizes save action', 'fiveprayer'), 'fp_save_tv_canvas_presets (names[], widths[])'],
								[__('Most of your own sizes', 'fiveprayer'), '12 — name up to 40 characters'],
								[__('Layout width precedence', 'fiveprayer'), 'address → page → site setting'],
								[__('TV type option', 'fiveprayer'), 'fiveprayer_tv_display_tv_type'],
								[__('TV type save action', 'fiveprayer'), 'fp_save_tv_tv_type'],
								[__('Croppable band', 'fiveprayer'), '5% per edge on Older TV, 0 on Modern'],
								[__('Canvas Force option', 'fiveprayer'), 'fiveprayer_tv_canvas_force'],
								[__('Safe Zone Guide option', 'fiveprayer'), 'fiveprayer_tv_safe_zone_guide'],
								[__('Editor guides save action', 'fiveprayer'), 'fp_save_tv_editor_guide (guide, enabled)'],
								[__('Screen report argument', 'fiveprayer'), '?fiveprayer_tv_report'],
								[__('Viewport tag written', 'fiveprayer'), '<meta name="viewport" content="width=<layout width>" />'],
								[__('Report badge class', 'fiveprayer'), 'fiveprayer-tv-report'],
								[__('Filter', 'fiveprayer'), 'fiveprayer_tv_display_content_selectors'],
								[__('JS API', 'fiveprayer'), 'window.FivePrayerTV.refresh()'],
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
					{__('The TV stylesheet and script are loaded only on the opted-in page and are intentionally kept out of the plugin’s combined bundles so they can never affect other pages.', 'fiveprayer')}
				</p>
			</div>

			{/* Tips */}
			<div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
				<h3 className="text-xl font-semibold text-blue-800 mb-3">{__('Tips', 'fiveprayer')}</h3>
				<ul className="text-blue-700 space-y-2">						<li>{__('• Design the page on a 1920 × 1080 canvas for a Full HD / 4K TV. TV Display Mode only scales what you built — it never changes the layout — so the screen shows your design the way it looks in the builder.', 'fiveprayer')}</li>
						<li>{__('• Set “Layout width” to Full HD (1920 px) when a smart TV shows a narrower layout than you designed: that row decides which of your builder’s breakpoints the TV gets.', 'fiveprayer')}</li>
						<li>{__('• Design in whichever builder you like with the theme’s normal look: the builder canvas is never given the signage treatment, the TV look starts on the page itself (View Page or Preview).', 'fiveprayer')}</li>
					<li>{__('• Use one page per TV so each display can show different content.', 'fiveprayer')}</li>						<li>{__('• Combine with the timetable or countdown shortcodes to build a live prayer display.', 'fiveprayer')}</li>
						<li>{__('• A screen that is not attached to this computer? Turn on “Share on Local Network” and leave it on — that is what serves the display to the TV, phone and tablet on your network. It never affects a public website.', 'fiveprayer')}</li>
				</ul>
			</div>
		</div>
	);
};

export default TVDisplayModeDoc;

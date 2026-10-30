/**
 * FivePrayer - TV Display Mode auto-scaling engine.
 *
 * This file is enqueued only on the front-end page where TV Display Mode is
 * enabled (the body carries `fiveprayer-tv-active`). It has exactly one job: to
 * make the page that the theme and the page builder already produced fit the
 * screen, by scaling that page's own layout with a CSS transform.
 *
 * Fidelity rules — why the TV page looks like the builder canvas:
 *
 *  - The engine never invents a width. Whatever the theme or the page builder
 *    laid out is what is measured, and that same box is what is scaled. Forcing
 *    a fixed 1920px stage used to stretch boxed containers, gutters and
 *    full-bleed sections that the builder had designed narrower — while colours
 *    and text inside them still looked right, which is exactly the "my colours
 *    apply but my layout does not" symptom.
 *  - Every measurement is taken with all previous staging removed, so the
 *    numbers always describe the page as it was designed, never a box this
 *    script imposed on it.
 *  - The only properties this file ever writes are the stage box (frozen to the
 *    size it just measured), the transform, and the `--fiveprayer-tv-scale`
 *    custom property — plus one `max-width` on the stage itself while the editor
 *    canvas is locked (`CANVAS_FORCE`), which lifts the cap the **theme** puts
 *    around the design so the screen shows the design at the width the canvas
 *    gave it (see `measure()`). Nothing else in the page is restyled, and no
 *    stylesheet rule of the theme or the builder is overridden. The one element this file
 *    *creates* is the opt-in screen report (`?fiveprayer_tv_report`), which is
 *    kept out of the page's own tree and styles itself inline.
 *
 * Breakpoints:
 *  - A page builder chooses its desktop/tablet/mobile design with CSS media
 *    queries, which measure the browser's viewport — not the scale factor this
 *    file applies. Nothing here can change that: the layout viewport is decided
 *    by the page's `<meta name="viewport">` tag, which PHP writes when a layout
 *    width is chosen in the settings (see TVDisplayMode::build_viewport_meta()).
 *    The engine therefore keeps working unchanged: `width=<n>` makes the layout
 *    viewport (and `window.innerWidth`) exactly `n` while the browser fits it to
 *    the screen, so the "contain" maths below still describes what is visible.
 *  - Works the same on top of any builder that renders a normal front-end page:
 *    Elementor, Divi, Beaver Builder, Bricks, Breakdance, Gutenberg/block
 *    themes and classic themes, with the wrapper list coming from PHP so it can
 *    be extended with a filter.
 *  - Theme chrome is removed by structure, not by a list of theme class names:
 *    the engine walks up from the stage and hides every sibling of that chain
 *    (see `hideChrome()`), which is what takes out the header, the footer, the
 *    sidebars, the page title and any widget another plugin floats over the
 *    page. Nothing inside the content wrapper is ever hidden.
 *  - The theme's own wrapper spacing is stripped the same way (see
 *    `cleanSpacing()`): the stage and its ancestors lose their margins,
 *    paddings and borders, so the canvas is the design you built rather than
 *    the design plus the theme's empty bands. Nothing inside the content is
 *    touched, so builder and Gutenberg spacing is kept, and no width is ever
 *    changed, so the layout is not resized.
 *  - The band that a *block theme* leaves at the top is removed by
 *    `trimLeadingSpace()`: those themes print the page title inside the content
 *    wrapper between Gutenberg spacer blocks, and give `main` (and the post
 *    content wrapper) a top margin. Hiding the title therefore left the title's
 *    spacers and those margins behind as empty space above the design. The pass
 *    zeroes the **top** edge only — margin, padding and border — from the content
 *    wrapper up to the stage, and hides leading subtrees that hold no visible
 *    text and paint nothing. It stops at the content wrapper, so the spacing of
 *    your own blocks (including a spacer you placed yourself) is never touched.
 *
 * Scaling strategy:
 *  - Find the main content wrapper (see {@see contentSelectors}).
 *  - Measure its natural size.
 *  - When the site chose a screen size that carries a height, **that box is what
 *    the screen presents**: the frame is the chosen width x height — the same box
 *    the editor locked and the safe-zone guide drew — so a design shorter than
 *    the box is shown at the size it was designed at, never enlarged until it
 *    fills the screen.
 *  - The box's height is a floor, not a ceiling. The display page is
 *    scroll-locked, because a television has no pointer, so anything the fit
 *    leaves past the bottom edge of the screen can never be reached — on this
 *    plugin's own display page the last rows of the timetable simply were not
 *    on the TV. When the page's real content is taller than the chosen box, the
 *    fit therefore uses the real height and the whole page lands on the screen,
 *    a little smaller, instead of running off it. The width is untouched, so a
 *    page that fits its box keeps the box's scale exactly.
 *  - scale = min(safeWidth / boxWidth, safeHeight / boxHeight)
 *    (i.e. "contain"): the box the designer chose always fits the screen, from a
 *    small monitor to a 4K TV, and the layout keeps its proportions because a
 *    single uniform scale is the only thing applied.
 *  - Pages with no chosen size keep the measured-fit behaviour: the measured
 *    design (overflow included) is fitted, so nothing on such a page is ever cut.
 *  - `safeWidth` / `safeHeight` are the **safe area** of the viewport — the whole
 *    screen for a modern TV, or the middle of it (one overscan margin in from
 *    every edge, chosen as the TV type on the TV Display Mode page) for an older
 *    TV that crops, so the cropping never removes any of the design.
 *  - Anchor the stage at the top-left corner; the letterboxing is centred
 *    horizontally and the vertical leftover stays **below** the design, inside
 *    the safe area, so nothing is ever centred above it (a box shorter than the
 *    screen used to float in the middle, with a band of nothing above the
 *    design and the same band below). On a television whose shape matches the
 *    chosen size there is no letterboxing at all, so the screen shows the editor
 *    canvas and nothing else. "Top-left" is asserted, not assumed: the offsets
 *    are written for that corner and the origin is written with them, so a
 *    builder's own reset on its wrapper cannot re-anchor the scale and shift the
 *    canvas off one edge.
 *
 * Performance:
 *  - All work is debounced through requestAnimationFrame, so a burst of resize
 *    events results in a single layout pass per frame.
 *  - Only form-factor changes (resize / orientation / fullscreen) and DOM
 *    changes trigger recalculation; no timers run in the background.
 *
 * @since 3.0.0
 */
(function () {
	'use strict';

	// The finished signage page is always the **top-level** document. Anything
	// that arrived inside a frame is a page builder's editing canvas, an editor's
	// device preview or some other embed — never the screen itself — and scaling
	// it there would shrink the design while it is being edited. Bail out, and
	// undo the TV look in case it was applied to the `<body>` before we ran.
	try {
		if (window.self !== window.top) {
			var restore = function () {
				if (document.body) {
					document.body.classList.remove('fiveprayer-tv-active');
				}

				document.documentElement.classList.remove('fiveprayer-tv-js');
				document.documentElement.classList.remove('fiveprayer-tv-scroll-lock');
			};

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', restore);
			} else {
				restore();
			}

			return;
		}
	} catch (frameError) {
		// A cross-origin parent means we are framed: do nothing at all.
		return;
	}

	var config = window.fiveprayerTV || {};

	// Design box used only when the wrapper cannot be measured at all (hidden or
	// not yet laid out). It is never used to override a size the page has.
	var FALLBACK_WIDTH = Number(config.baselineWidth) || 1920;
	var FALLBACK_HEIGHT = Number(config.baselineHeight) || 1080;

	// The screen height the page was designed at, when the site chose a size that
	// carries one (`0` = Auto, i.e. no size chosen). While a height is chosen the
	// editor locked the builder canvas to the chosen width × height and drew the
	// safe-zone guide on it, so the screen must present the same box: the design
	// fills the frame instead of sitting as a shorter page centred in the middle
	// of the television with empty bands above and below it.
	//
	// The height is a floor, not a ceiling. A page shorter than the box keeps the
	// box's scale (it is not enlarged to fill the screen), but a page that grew
	// taller than the box (an extra row, an extra section) is fitted by its real
	// height instead: the display page is scroll-locked, so content pushed past
	// the bottom edge of the screen is content the viewer can never see. Fitting
	// the overflow costs some scale and some side banding when the page is much
	// taller than the box; hiding rows of the timetable costs the display its
	// job.
	//
	// Only the height is framed. The width needs no framing — the viewport tag
	// PHP writes already lays the page out at the chosen width — while forcing a
	// width here would be the very override this engine exists to avoid.
	//
	// A `max-width` that caps the wrapper does have to go, though, or the width
	// the box is computed for is a width that never rendered: a block theme
	// prints a content-size cap on the content wrapper's children (Twenty
	// Twenty-Five's `--wp--style--global--content-size`, 645px here), which held
	// the stage far below the chosen width. The canvas lifts that cap while it is
	// locked, so the screen lifts it too (see `measure()`), and the design then
	// arrives on the screen at the width the canvas gave it instead of as a
	// narrow column with bands left and right.
	var FRAME_HEIGHT = Number(config.canvasHeight) || 0;

	// Whether the editor canvas is locked to the page's box (**Canvas Force**).
	// While it is, the canvas the designer works against is the chosen box, and
	// the screen presents that same box — including the width. `wp_localize_script`
	// writes a boolean as `'1'` / `''`, so it is read the same way the canvas
	// locker reads its own switch.
	var CANVAS_FORCE = config.canvasForce === '1' || config.canvasForce === 1 || config.canvasForce === true;

	// Percent of each edge the screen can crop — `0` for a modern TV (the whole
	// screen is visible) or 5 for an older one that overscans, as chosen on the TV
	// Display Mode page. While it is set the design is fitted inside the *safe
	// area* — the middle of the screen — so the TV's cropping never removes any of
	// it. At 0 the safe area is the whole screen and this changes nothing.
	var OVERSCAN = Number(config.overscanPercent) || 0;
	if (!isFinite(OVERSCAN) || OVERSCAN < 0 || OVERSCAN >= 50) {
		OVERSCAN = 0;
	}

	// Clearance kept under the last thing the page actually shows, as a percent
	// of the screen height (clamped, so it is sensible on any panel). A fit that
	// is driven by the page's height ends the design exactly on the bottom edge
	// of the screen — which is fine on a computer, and a cut-off row on a
	// television, where the panel crops a few per cent of every edge and the page
	// cannot be scrolled to see the rest. The inset is measured against the
	// page's **content** (see `contentBottom()`), not its box, so a page that
	// already leaves space under its last row is not shrunk for nothing. It costs
	// about 3% of the scale on a page that does reach the bottom edge.
	var BOTTOM_INSET_PERCENT = 3;
	var BOTTOM_INSET_MIN = 12;
	var BOTTOM_INSET_MAX = 60;

	var BODY_CLASS = 'fiveprayer-tv-active';
	var STAGE_CLASS = 'fiveprayer-tv-stage';
	var LOCK_CLASS = 'fiveprayer-tv-scroll-lock';
	var READY_CLASS = 'fiveprayer-tv-ready';

	// Added to <html> by the one-line inline script in the head, before the first
	// paint. Section 5 of tv-display.css hides the canvas on this class until
	// READY_CLASS lands, which is what `isBootHidden()` reads.
	var JS_CLASS = 'fiveprayer-tv-js';

	// The class tv-display.css hides on sight. It doubles as the documented way
	// for a user to hide one more element by hand.
	var HIDE_CLASS = 'fiveprayer-tv-hide';

	// The class tv-display.css zeroes margin / padding / border on. The engine
	// puts it on the wrappers around the content — never inside it.
	var CLEAN_CLASS = 'fiveprayer-tv-clean';

	// Class of the opt-in screen report (see `renderReport()`). It is created by
	// this file only, lives outside the page's own tree and must never be treated
	// as theme chrome.
	var REPORT_CLASS = 'fiveprayer-tv-report';

	// Classes of the leading-space pass (see `trimLeadingSpace()`): the top-edge
	// trim on the wrappers above the content, and the leading empty subtrees that
	// are hidden outright. Both are defined in tv-display.css.
	var TRIM_CLASS = 'fiveprayer-tv-trim';
	var TRIM_HIDE_CLASS = 'fiveprayer-tv-trim-hide';

	// Last-resort reveal. The canvas is held invisible until the engine reports
	// it has positioned everything, so if anything below throws, stalls or never
	// completes, the page must still become visible rather than stay blank.
	var READY_TIMEOUT = 1500;

	/**
	 * Selectors tried in order. The first visible match becomes the stage.
	 * Mirrors the PHP default list and can be overridden via wp_localize.
	 *
	 * Each entry names the element the *builder* puts around one design. Brizy's
	 * marker is the one that needs a modifier: every Brizy root container carries
	 * `brz-root__container` (a page canvas, a story and an embedded block all
	 * match it), and only the page canvas adds `-page`. Asking for `-page` keeps a
	 * Brizy story or a block placed inside a normal page from being mistaken for
	 * the display page's own canvas.
	 */
	var DEFAULT_SELECTORS = [
		'.elementor',           // Elementor full-page canvas.
		'#et-boc .et-l',        // Divi builder layout.
		'#et-boc',              // Divi builder wrapper.
		'.fl-builder-content',  // Beaver Builder rows.
		'#brx-content',         // Bricks content area.
		'.breakdance',          // Breakdance canvas.
		'.brz-root__container-page', // Brizy page canvas (see the note above).
		'.wp-site-blocks',      // Block theme wrapper.
		'.entry-content',       // Classic + Gutenberg post content.
		'main',
		'#content',
		'#primary'
	];

	var SELECTORS = (config.contentSelectors && config.contentSelectors.length)
		? config.contentSelectors
		: DEFAULT_SELECTORS;

	var stage = null;
	var frameId = 0;
	var observer = null;

	// The viewport and the content box the current fit was calculated from, and
	// the pending cheap height check (see `handleMutations()`). While the stage
	// is applied its box is frozen, so a recalculation that finds all of these
	// unchanged cannot produce a different fit (see `applyScale()`).
	var stagedHeight = -1;
	var stagedWidth = -1;
	var stagedViewportWidth = -1;
	var stagedViewportHeight = -1;
	var heightFrameId = 0;

	// Chrome this engine labelled itself, so a later pass unmarks exactly those
	// elements and never a class a user set by hand.
	var markedChrome = [];

	// Wrappers this engine cleaned, tracked for the same reason.
	var markedSpacing = [];

	// The screen-report element, created once and then only updated.
	var reportEl = null;

	// Wrappers this engine trimmed, and leading subtrees it hid, tracked so a
	// later pass unmarks exactly what it marked.
	var markedLeading = [];

	/**
	 * Return the current scaling stage, resolving it again if it was detached.
	 *
	 * @return {Element} The content wrapper to scale.
	 */
	function resolveStage() {
		if (stage && document.body && document.body.contains(stage)) {
			return stage;
		}

		for (var i = 0; i < SELECTORS.length; i++) {
			var candidate = document.querySelector(SELECTORS[i]);
			if (candidate && candidate.offsetWidth > 0 && candidate.offsetHeight > 0) {
				stage = candidate;
				return stage;
			}
		}

		stage = document.body;
		return stage;
	}

	/**
	 * Reveal the canvas by flagging the document as ready.
	 *
	 * Called once the stage has actually been positioned, and again from the
	 * safety net if the engine fails. Idempotent.
	 */
	function markReady() {
		if (document.documentElement) {
			document.documentElement.classList.add(READY_CLASS);
		}
	}

	/**
	 * Hide every part of the page that is not the page content.
	 *
	 * The theme header, footer, sidebars, breadcrumbs, the page title and any
	 * widget another plugin floats over the page (chat button, cookie banner,
	 * back-to-top) are all *siblings* of the chain that leads from <body> down to
	 * the content wrapper — or they sit inside the wrapper (a block theme's
	 * header/footer template parts). So instead of guessing at theme class names,
	 * walk up from the stage and label every sibling along the way with
	 * `fiveprayer-tv-hide`, which the stylesheet hides. What is left visible is
	 * only the ancestors of the content, the content itself and the page
	 * background.
	 *
	 * This walk never reaches inside the stage, so a builder's own markup — even
	 * its own <header> or <footer> element — is untouched. (The few pieces of
	 * chrome that live *inside* a block theme's content wrapper, such as its
	 * header and footer template parts, are named in tv-display.css instead.)
	 *
	 * The stage and its ancestors are left alone; a sibling that already carries
	 * the class (set by the user, or by the theme) is skipped and never
	 * unmarked.
	 *
	 * @param {Element} element The staging element.
	 */
	function hideChrome(element) {
		var i;

		for (i = 0; i < markedChrome.length; i++) {
			markedChrome[i].classList.remove(HIDE_CLASS);
		}
		markedChrome = [];

		var node = element;
		while (node && node.parentElement && node.parentElement !== document.documentElement) {
			var siblings = node.parentElement.children;

			for (i = 0; siblings && i < siblings.length; i++) {
				var sibling = siblings[i];

				if (
					sibling === node ||
					sibling.classList.contains(HIDE_CLASS) ||
					sibling.classList.contains(REPORT_CLASS)
				) {
					continue;
				}

				sibling.classList.add(HIDE_CLASS);
				markedChrome.push(sibling);
			}

			node = node.parentElement;
		}
	}

	/**
	 * Strip the theme's own spacing from the wrappers around the content.
	 *
	 * A theme surrounds the content with its own boxes — `.site-content`,
	 * `.site-main`, `.container`, `#page` and friends — and gives them margins,
	 * padding and borders that the page builder never designed. On a normal page
	 * that spacing is welcome; on a signage screen it is empty bands of nothing
	 * around the design, and it shows up in the measured box as well.
	 *
	 * So the stage and every ancestor up to <body> is labelled with
	 * `fiveprayer-tv-clean`, which the stylesheet uses to zero margin, padding and
	 * border — and nothing else. Widths, max-widths and display are untouched on
	 * purpose: the boxed content width a theme (or Gutenberg) set is part of the
	 * layout, and changing it would resize the design. This walk also never
	 * reaches inside the stage, so the spacing you set in the builder or in
	 * Gutenberg — block gaps, container padding, section margins — is untouched.
	 *
	 * @param {Element} element The staging element.
	 */
	function cleanSpacing(element) {
		var i;

		for (i = 0; i < markedSpacing.length; i++) {
			markedSpacing[i].classList.remove(CLEAN_CLASS);
		}
		markedSpacing = [];

		var node = element;
		while (node && node !== document.documentElement) {
			if (!node.classList.contains(CLEAN_CLASS)) {
				node.classList.add(CLEAN_CLASS);
				markedSpacing.push(node);
			}

			node = node.parentElement;
		}
	}

	/**
	 * Whether the engine's own no-flash boot is still holding the canvas hidden.
	 *
	 * Until the first fit is applied, `html.fiveprayer-tv-js:not(.fiveprayer-tv-ready)`
	 * keeps the whole canvas at `visibility: hidden` (section 5 of tv-display.css).
	 * Every element inside therefore reports `hidden` during the measurement that
	 * runs before the reveal — a fact about this engine, not about the page.
	 *
	 * @return {boolean} True while the boot rule is hiding the canvas.
	 */
	function isBootHidden() {
		var root = document.documentElement;

		return !!root && root.classList.contains(JS_CLASS) && !root.classList.contains(READY_CLASS);
	}

	/**
	 * Whether the element currently has a box (so it could be seen at all).
	 *
	 * `offsetWidth` is 0 for `display: none` boxes and for elements with no
	 * layout, which is exactly the set the leading-space pass must ignore.
	 *
	 * @param {Element} element Element to test.
	 * @return {boolean} True when the element occupies a box.
	 */
	function isShown(element) {
		if (!element || !element.offsetWidth) {
			return false;
		}

		var view = window.getComputedStyle ? window.getComputedStyle(element) : null;

		if (!view || 'none' === view.display) {
			return false;
		}

		// `visibility` is inherited, so while the no-flash boot has the canvas
		// hidden every element reports `hidden` whether the page hid it or not.
		// Reading it as the page's own hiding made the leading-space trim find no
		// content root on the first pass and run on the first *restage* instead:
		// the trim's margins only collapsed then, so the timetable settled by 19px
		// a second after the screen had already shown it. The trim has to see the
		// real layout while the page is still held invisible.
		return 'hidden' !== view.visibility || isBootHidden();
	}

	/**
	 * How far down the page its *content* actually reaches, in the element's own
	 * (unscaled) pixels.
	 *
	 * Used for the bottom clearance: `scrollHeight` is the page's box, and a box
	 * may be padding below the last row, while what a viewer can be cut off from
	 * seeing is the last thing drawn. Only leaves are visited — an element with
	 * children is a wrapper, and its own box may be the empty space inside it —
	 * and a leaf counts when it has text of its own or paints a background or a
	 * border.
	 *
	 * @param {Element} element The staged element.
	 * @param {number} scale The scale currently applied to it.
	 * @return {number} The content's bottom edge relative to the stage's top, or
	 *                  0 when the page shows nothing measurable.
	 */
	function contentBottom(element, scale) {
		if (!element || !element.querySelectorAll) {
			return 0;
		}

		var nodes = element.querySelectorAll('*');
		var stageTop = element.getBoundingClientRect().top;
		var factor = scale > 0 ? scale : 1;
		var bottom = 0;

		for (var i = 0; i < nodes.length; i++) {
			var node = nodes[i];

			if (node.children && node.children.length) {
				continue;
			}

			var tag = node.nodeName ? String(node.nodeName).toLowerCase() : '';
			if ('style' === tag || 'script' === tag || 'template' === tag || 'noscript' === tag) {
				continue;
			}

			if (!isShown(node)) {
				continue;
			}

			var rect = node.getBoundingClientRect();
			if (rect.height < 1) {
				continue;
			}

			var text = node.textContent ? node.textContent.replace(/\s+/g, '') : '';

			if (!text) {
				if (!window.getComputedStyle) {
					continue;
				}

				var view = window.getComputedStyle(node);
				var background = view.backgroundColor || '';
				var paints =
					(background && 'transparent' !== background && -1 === background.indexOf('rgba(0, 0, 0, 0)')) ||
					(view.backgroundImage && 'none' !== view.backgroundImage) ||
					parseFloat(view.borderBottomWidth) > 0;

				if (!paints) {
					continue;
				}
			}

			var nodeBottom = (rect.bottom - stageTop) / factor;
			if (nodeBottom > bottom) {
				bottom = nodeBottom;
			}
		}

		return bottom;
	}

	/**
	 * Whether any *visible* text lives inside the element.
	 *
	 * Text is read from `childNodes` rather than from `textContent` on purpose:
	 * a wrapper that only holds a hidden page title has a non-empty
	 * `textContent` but nothing a viewer can see, and that is precisely the box
	 * the leading-space pass is about. `<style>`/`<script>`/`<template>` content
	 * is not text either.
	 *
	 * @param {Element} element Element to inspect.
	 * @return {boolean} True when visible text is found.
	 */
	function hasText(element) {
		var nodes = element && element.childNodes;
		if (!nodes) {
			return false;
		}

		for (var i = 0; i < nodes.length; i++) {
			var child = nodes[i];

			if (3 === child.nodeType) {
				if (child.nodeValue && child.nodeValue.replace(/\s+/g, '')) {
					return true;
				}
				continue;
			}

			if (1 !== child.nodeType) {
				continue;
			}

			var tag = child.nodeName ? String(child.nodeName).toLowerCase() : '';
			if ('style' === tag || 'script' === tag || 'template' === tag || 'noscript' === tag) {
				continue;
			}

			if (isShown(child) && hasText(child)) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Whether the element, or anything inside it, paints itself.
	 *
	 * A background or a border is visible design even without any text, so a
	 * leading box that paints is left alone: a coloured bar, a divider or a
	 * background image is something the page meant to show.
	 *
	 * @param {Element} element Element to inspect.
	 * @return {boolean} True when the element or a descendant paints.
	 */
	function paintsSomething(element) {
		if (!window.getComputedStyle || !element) {
			return true; // Cannot tell: assume it paints, and keep it.
		}

		var stack = [element];

		while (stack.length) {
			var current = stack.pop();

			if (!isShown(current)) {
				continue;
			}

			var view = window.getComputedStyle(current);
			var background = view.backgroundColor || '';

			if (view.backgroundImage && 'none' !== view.backgroundImage) {
				return true;
			}

			if (background && 'transparent' !== background && -1 === background.indexOf('rgba(0, 0, 0, 0)')) {
				return true;
			}

			if (
				parseFloat(view.borderTopWidth) > 0 ||
				parseFloat(view.borderRightWidth) > 0 ||
				parseFloat(view.borderBottomWidth) > 0 ||
				parseFloat(view.borderLeftWidth) > 0
			) {
				return true;
			}

			for (var i = 0; i < current.children.length; i++) {
				stack.push(current.children[i]);
			}
		}

		return false;
	}

	/**
	 * The element that holds the page's own content inside the stage.
	 *
	 * Uses the same selector list, in the same priority order, that picked the
	 * stage — so on a block theme this finds `.entry-content` inside
	 * `.wp-site-blocks`, and on a builder it usually finds nothing (the stage is
	 * already the canvas), in which case the leading-space pass does nothing.
	 *
	 * @param {Element} element The staging element.
	 * @return {Element|null} The content wrapper, or null when there is none.
	 */
	function findContentRoot(element) {
		for (var i = 0; i < SELECTORS.length; i++) {
			var found = null;

			try {
				found = element.querySelector(SELECTORS[i]);
			} catch (error) {
				found = null;
			}

			if (found && isShown(found)) {
				return found;
			}
		}

		return null;
	}

	/**
	 * Flush the canvas: remove the empty band above the first real content.
	 *
	 * A block theme prints the page title *inside* the content wrapper, with
	 * Gutenberg spacer blocks around it, and gives `main` and the post-content
	 * wrapper a top margin. TV Display Mode hides that title (section 2 of
	 * tv-display.css), which leaves its spacers and those margins behind as an
	 * empty band at the top of the screen — visible space that belongs to the
	 * theme, not to the page.
	 *
	 * Two things are therefore marked, and only outside the page's own content:
	 *
	 *  - `fiveprayer-tv-trim` on the content wrapper and every wrapper above it up
	 *    to the stage. The stylesheet zeroes **only the top side** there —
	 *    margin, padding and border — so left, right and bottom spacing is kept.
	 *  - `fiveprayer-tv-trim-hide` on leading subtrees that hold no visible text
	 *    and paint nothing, i.e. the spacer blocks and the group that only framed
	 *    the hidden title. A leading box that paints (a coloured bar, a divider, a
	 *    background image) is kept.
	 *
	 * The walk stops at the content wrapper, so everything the page builder or
	 * Gutenberg created — including a spacer block you placed yourself — keeps its
	 * spacing. With no content wrapper inside the stage (a builder canvas, or the
	 * content being the stage itself) the pass does nothing at all.
	 *
	 * @param {Element} element The staging element.
	 */
	function trimLeadingSpace(element) {
		var i;

		for (i = 0; i < markedLeading.length; i++) {
			markedLeading[i].classList.remove(TRIM_CLASS);
			markedLeading[i].classList.remove(TRIM_HIDE_CLASS);
		}
		markedLeading = [];

		// Never trim the stage itself: `cleanSpacing()` already owns that box.
		if (!element) {
			return;
		}

		var root = findContentRoot(element);
		if (!root) {
			return;
		}

		// 1. The top edge, from the content wrapper up to the stage.
		var node = root;
		while (node && node !== element) {
			if (!node.classList.contains(TRIM_CLASS)) {
				node.classList.add(TRIM_CLASS);
				markedLeading.push(node);
			}

			node = node.parentElement;
		}

		// 2. Leading siblings that hold nothing, at every level above the content.
		node = root;
		while (node && node !== element) {
			var parent = node.parentElement;
			if (!parent) {
				break;
			}

			var siblings = parent.children;
			for (i = 0; siblings && i < siblings.length; i++) {
				var sibling = siblings[i];

				if (sibling === node) {
					break;
				}

				if (sibling.classList.contains(TRIM_HIDE_CLASS)) {
					continue;
				}

				if (!isShown(sibling) || hasText(sibling) || paintsSomething(sibling)) {
					continue;
				}

				sibling.classList.add(TRIM_HIDE_CLASS);
				markedLeading.push(sibling);
			}

			node = parent;
		}
	}

	/**
	 * Measure the stage in the page's own layout.
	 *
	 * Any staging written by a previous pass is removed first: `position: fixed`
	 * and an explicit width would otherwise feed this engine's own box back into
	 * the numbers instead of describing what the builder designed. The class and
	 * the style writes below are undone or re-applied within the same animation
	 * frame as the reads, so nothing is ever painted in the measured state.
	 *
	 * The width written by a previous pass is cleared *before* measuring, because
	 * a `position: fixed` element is shrink-to-fit: without the freeze applied by
	 * `applyScale()` the layout would collapse the moment it was staged.
	 *
	 * @return {{element: Element, width: number, height: number}} Stage metrics.
	 */
	function measure() {
		var element = resolveStage();
		if (!element) {
			return null;
		}

		// Clear the theme's chrome and its own wrapper spacing before measuring:
		// both change how wide and tall the content wrapper is, and the numbers
		// must describe the layout that will actually be on the screen.
		hideChrome(element);
		cleanSpacing(element);
		trimLeadingSpace(element);

		element.classList.remove(STAGE_CLASS);
		element.style.transform = 'none';
		element.style.width = '';
		element.style.height = '';
		// The anchor is staging too: it is only meaningful while this engine's
		// transform is on the element, so it is removed with the transform and
		// written again by `applyScale()`.
		element.style.removeProperty('transform-origin');

		// The cap a theme puts on the content wrapper (`max-width: 645px` for a
		// block theme's content size, a boxed `max-width` for a classic theme) is
		// the theme's own box around the design, not part of the design, and it
		// would leave the design narrower than the canvas the editor locked. The
		// canvas lock lifts it there, so the screen lifts it here — but only while
		// the canvas is actually locked, so a page whose box the editor never drew
		// keeps the theme's width exactly as before.
		//
		// The lift is written *before* the box is measured because the box is the
		// width the design actually renders at, and it is only ever written when
		// the gate is on: on every other page this line does not run at all, so a
		// `max-width` a builder put on its own wrapper inline is never removed.
		// Only this wrapper's own cap is lifted — a boxed width the builder or the
		// user set on a container *inside* the design is the design, and is kept.
		if (CANVAS_FORCE && FRAME_HEIGHT > 0) {
			element.style.maxWidth = 'none';
		}

		// The wrapper's own box is the width it was laid out with. `scrollWidth`
		// grows with anything that overflows it (a section or an image wider than the
		// page box), which does not make the design wider — it overflows the box,
		// exactly as it overflows the canvas box in the builder. Measuring the
		// overflow also re-laid the frozen stage out at that inflated width, so the
		// screen showed a layout the builder never produced.
		var width = element.offsetWidth || 0;
		if (!width) {
			width = element.scrollWidth || 0;
		}
		var height = element.scrollHeight || element.offsetHeight || 0;
		var measuredHeight = height;

		// A page with **no** chosen size keeps the older, more forgiving reading:
		// its overflow is measured too, so a wider element is fitted to the screen
		// rather than cut. Nothing about such a page changes.
		if (FRAME_HEIGHT <= 0 && element.scrollWidth > width) {
			width = element.scrollWidth;
		}

		// A hidden or not-yet-laid-out wrapper has no box to measure. Fall back to
		// the documented design box so the page is still framed rather than left
		// unscaled; a page that does have a box is never overridden.
		if (!width) {
			width = FALLBACK_WIDTH;
		}
		if (!height) {
			height = FALLBACK_HEIGHT;
		}

		// A chosen screen size is the box the screen presents — the canvas the editor
		// locked and the guide drew — so a page **shorter** than the box occupies the
		// whole box at the box's scale: without this the fit would be computed from
		// the page's own height, and a 1000px-tall design on a 1080px screen would be
		// enlarged until it filled the screen, i.e. every item on it resized, which
		// is exactly what the editor canvas does not do.
		//
		// A page **taller** than the box is the other half of that rule, and it is
		// the one that matters on a television: the display page is scroll-locked
		// (there is no pointer to scroll it with), so any content the fit leaves
		// past the bottom edge of the screen can never be seen. Measured on this
		// plugin's own display page at 1920x1080, the page is 1230px tall against a
		// 1024px box, which left Dhuhr, Asr, Maghrib and Isha off the screen. The
		// box is therefore a floor for the height used by the fit, not a ceiling:
		// the page's real height wins when it is the bigger number, so the design
		// lands on the screen whole, a little smaller, instead of running off it.
		// The width is not involved, so a page that fits its box keeps the box's
		// scale exactly as before.
		if (FRAME_HEIGHT > 0) {
			height = measuredHeight > 0 ? Math.max(FRAME_HEIGHT, measuredHeight) : FRAME_HEIGHT;
		}

		return { element: element, width: width, height: height };
	}

	/**
	 * Print the numbers that decide which page-builder breakpoint is active.
	 *
	 * Shown only when the display page was opened with `?fiveprayer_tv_report`
	 * (PHP passes that flag in). A signage screen cannot be inspected with
	 * developer tools, and the width a TV browser reports is exactly what decides
	 * whether the builder renders its desktop, tablet or mobile design: the
	 * number belongs on the screen, next to the TV. Nothing is written to the
	 * page's own markup — the badge is a child of `<html>`, so the chrome walk,
	 * the cleaning pass and the scaling stage never see it, and it carries its
	 * styling inline so no theme or builder rule can change it.
	 */
	function renderReport() {
		if (!config.report) {
			return;
		}

		if (!reportEl) {
			reportEl = document.createElement('div');
			reportEl.className = REPORT_CLASS;
			reportEl.setAttribute(
				'style',
				'position:fixed;right:12px;bottom:12px;z-index:2147483647;' +
					'pointer-events:none;background:rgba(0,0,0,.78);color:#fff;' +
					'font:12px/1.5 ui-monospace,Menlo,Consolas,monospace;' +
					'padding:6px 10px;border-radius:6px;white-space:pre-line;text-align:right'
			);
			document.documentElement.appendChild(reportEl);
		}

		var canvas = Number(config.canvasWidth) || 0;
		var width = window.innerWidth || document.documentElement.clientWidth || 0;

		reportEl.textContent =
			(config.reportLabel || 'TV screen report') + '\n' +
			width + ' \u00d7 ' + (window.innerHeight || 0) +
			' \u00b7 DPR ' + (window.devicePixelRatio || 1) + '\n' +
			'canvas ' + (canvas > 0 ? canvas + 'px' : 'auto') +
			' \u2192 breakpoint ' + (canvas > 0 ? canvas : width) + 'px';
	}

	/**
	 * Measure, scale and position the stage for the current viewport.
	 */
	function applyScale() {
		frameId = 0;

		// Keep the opt-in screen report current: it describes the viewport, so it is
		// refreshed on every recalculation (resize, orientation, fullscreen).
		renderReport();

		// Cheap gate, before anything is un-staged. While the stage is applied
		// its box is frozen at the width it was measured with, so a recalculation
		// can only produce a different fit when the viewport or the content box
		// changed. A page whose clock, countdown or dynamic content rewrites
		// itself from a timer used to restage the whole page on every tick — a
		// full relayout plus a full re-raster of the scaled layer, with the row
		// hover and every other interaction stalled behind that work. The two
		// reads below are a layout *read*: no un-staging, no transform rewrite,
		// no re-raster, and the page keeps the scale it already has.
		var staged = resolveStage();

		if (staged && staged.classList.contains(STAGE_CLASS)) {
			var gateWidth = window.innerWidth || document.documentElement.clientWidth;
			var gateHeight = window.innerHeight || document.documentElement.clientHeight;

			if (
				gateWidth === stagedViewportWidth &&
				gateHeight === stagedViewportHeight &&
				(staged.scrollHeight || staged.offsetHeight || 0) === stagedHeight &&
				(staged.scrollWidth || 0) <= stagedWidth
			) {
				return;
			}
		}

		// Lock the document scroller first: a classic scrollbar takes up layout
		// space, so measuring before the lock would freeze a box one scrollbar
		// narrower than the screen. The lock is removed again below whenever the
		// page cannot be scaled, so a failure always leaves a normal page.
		document.documentElement.classList.add(LOCK_CLASS);

		var metrics = measure();

		var element = metrics && metrics.element;
		var designWidth = metrics ? metrics.width : 0;
		var designHeight = metrics ? metrics.height : 0;

		var viewportWidth = window.innerWidth || document.documentElement.clientWidth;
		var viewportHeight = window.innerHeight || document.documentElement.clientHeight;

		if (!element || !viewportWidth || !viewportHeight || !designWidth || !designHeight) {
			// Nothing to scale: reveal the page as a normal, scrollable page.
			document.documentElement.classList.remove(LOCK_CLASS);
			markReady();
			return;
		}

		// Freeze the box that was just measured, then take the stage out of the
		// flow. The value is the page's own width, so the builder's layout is
		// carried over untouched — it only stops `position: fixed` from making
		// the element shrink to fit its content.
		element.style.width = designWidth + 'px';
		element.classList.add(STAGE_CLASS);

		// The box the design must stay inside: the whole screen for a modern TV,
		// or the middle of it (one overscan margin in from every edge) for an older
		// TV that crops. `safe` is the usable fraction of each axis.
		var safe = 1 - (2 * OVERSCAN) / 100;
		var safeWidth = viewportWidth * safe;
		var safeHeight = viewportHeight * safe;
		var marginX = Math.max(0, (viewportWidth - safeWidth) / 2);
		var marginY = Math.max(0, (viewportHeight - safeHeight) / 2);

		// One uniform scale for both axes: proportions are preserved exactly, so
		// a design made in Elementor (or any other builder) looks the same here
		// as it does in its canvas — just sized to the safe area.
		var scale = Math.min(safeWidth / designWidth, safeHeight / designHeight);
		if (!isFinite(scale) || scale <= 0) {
			scale = 1;
		}

		// Any letterboxed space left by the "contain" fit is centred horizontally,
		// inside the safe area, so the croppable band stays clear on every side.
		var offsetX = Math.max(0, marginX + (safeWidth - designWidth * scale) / 2);

		// Vertically it is *not* shared out above the design. The box is anchored to
		// the top edge of the screen (plus the overscan inset) and the leftover sits
		// below it, because centring opened a band above the design whenever the
		// chosen box was shorter than the screen: a 768x1024 canvas on a 1080x1920
		// panel left 448px of nothing above it and 448px below, a 1920x1080 box on a
		// 1920x1080 screen left 28px — the same "empty space at the edge" the
		// horizontal side of this engine had to be fixed for, on the other axis. The
		// top edge is where the design is read from, and it is the edge the rest of
		// this file already flushes (the theme's title space is trimmed, section 3b
		// of tv-display.css), while content that grows past the box already runs off
		// the bottom edge — so the leftover belongs there. Nothing is cropped: the
		// whole box is still on screen, just no longer floating in the middle of it.
		var offsetY = marginY;

		// The offsets above are measured from the element's **top-left** corner, so
		// that is where the transform has to be anchored. The stylesheet says so
		// too, but a page builder's own reset on its wrapper can outweigh it —
		// Brizy publishes `.brz .brz-reset-all { transform-origin: 50% 50% }` on the
		// wrapper this engine stages — and with a centred origin the same transform
		// moves the canvas by `(1 - scale) x size / 2` down and to the right, which
		// eats the band on one side and pushes the design off the screen on a
		// screen narrower than its box. Written inline (the way the canvas locker
		// locks its own boxes) so nothing a theme or builder declares can beat it,
		// and only while the element is staged.
		element.style.setProperty('transform-origin', 'top left', 'important');

		element.style.transform =
			'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';

		// Expose the scale and the design box for page builders / custom CSS that
		// may need them.
		element.style.setProperty('--fiveprayer-tv-scale', String(scale));
		element.style.setProperty('--fiveprayer-tv-design-width', designWidth + 'px');
		element.style.setProperty('--fiveprayer-tv-design-height', designHeight + 'px');

		// The fit above was computed from the box measured *before* it was staged,
		// and staging changes the containing block (`position: fixed`, an explicit
		// width): on the display page the frozen box lays out a few pixels taller
		// than the same content did in the page's own flow, which left the last of
		// it just past the bottom edge — unreachable, because the document is
		// scroll-locked. Re-reading the staged height and taking it into the fit
		// when it asks for a smaller scale costs one layout read and is what makes
		// "the whole page fits the screen" true rather than nearly true.
		var stagedContentHeight = element.scrollHeight || 0;

		if (stagedContentHeight > 0 && stagedContentHeight * scale > safeHeight) {
			var fittedScale = safeHeight / stagedContentHeight;

			if (isFinite(fittedScale) && fittedScale > 0 && fittedScale < scale) {
				scale = fittedScale;

				// The horizontal offset is the letterboxing of the narrower design, so
				// it moves with the scale; the vertical anchor does not.
				offsetX = Math.max(0, marginX + (safeWidth - designWidth * scale) / 2);

				element.style.transform =
					'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
				element.style.setProperty('--fiveprayer-tv-scale', String(scale));
			}
		}

		// Keep the last thing the page shows clear of the bottom edge (see
		// BOTTOM_INSET_* above). A fit driven by the page's height ends the design
		// exactly on the screen's bottom edge, where an older panel's overscan
		// crops it — and the page is scroll-locked, so nothing can bring it back.
		// Measured against the content rather than the box, so a page that already
		// leaves space under its last row keeps its scale.
		var inset = Math.min(
			BOTTOM_INSET_MAX,
			Math.max(BOTTOM_INSET_MIN, Math.round((viewportHeight * BOTTOM_INSET_PERCENT) / 100))
		);

		// The overscan band is clearance of the same kind, so whatever part of the
		// inset it already covers is not asked for twice: with 5% overscan the safe
		// area's own bottom band is wider than any inset this could add, and the
		// page keeps the scale it had.
		inset = Math.max(0, inset - marginY);

		var shownBottom = contentBottom(element, scale);
		var bottomLimit = viewportHeight - marginY - inset;

		if (inset > 0 && shownBottom > 0 && offsetY + shownBottom * scale > bottomLimit) {
			var clearScale = (bottomLimit - offsetY) / shownBottom;

			if (isFinite(clearScale) && clearScale > 0 && clearScale < scale) {
				scale = clearScale;

				// The horizontal offset is the letterboxing of the narrower design, so
				// it moves with the scale; the vertical anchor does not.
				offsetX = Math.max(0, marginX + (safeWidth - designWidth * scale) / 2);

				element.style.transform =
					'translate(' + offsetX + 'px, ' + offsetY + 'px) scale(' + scale + ')';
				element.style.setProperty('--fiveprayer-tv-scale', String(scale));
			}
		}

		// Remember the box this fit describes, so the next recalculation can tell
		// at a glance whether anything that decides the scale has changed.
		stagedViewportWidth = viewportWidth;
		stagedViewportHeight = viewportHeight;
		stagedWidth = designWidth;
		stagedHeight = element.scrollHeight || element.offsetHeight || 0;

		// The page is positioned: reveal it. This is the only place the canvas
		// becomes visible, so the first thing the screen ever shows is the
		// finished, correctly scaled layout.
		markReady();
	}

	/**
	 * Schedule a single recalculation on the next animation frame.
	 */
	function schedule() {
		if (frameId) {
			return;
		}
		frameId = window.requestAnimationFrame(applyScale);
	}

	/**
	 * Schedule a recalculation now and twice more shortly after, to catch page
	 * builders, webfonts and images that finish settling after the first paint.
	 */
	function scheduleWithRetry() {
		schedule();
		window.setTimeout(schedule, 400);
		window.setTimeout(schedule, 1200);
	}

	/**
	 * Whether one mutation changed the page's structure rather than only its text.
	 *
	 * The live clock (`.fiveprayer-live-time`), the next-prayer countdown and the dynamic
	 * content loader all rewrite their own label from a one-second timer. That
	 * write removes and adds text nodes only; it cannot add a section, a wrapper
	 * or any other element the chrome / spacing / trim passes have to visit.
	 *
	 * It used to be treated as a layout change, which restaged the whole page
	 * once a second: `measure()` un-stages the wrapper, so every tick cost a full
	 * relayout of the page plus a full re-raster of the scaled layer. Everything
	 * else on the display page — the row hover, the month list — had to wait for
	 * that work, which is the slowness a TV page showed with TV mode on and the
	 * same page never showed with it off.
	 *
	 * @param {MutationRecord} mutation One record from the observer.
	 * @return {boolean} True when an element was added or removed.
	 */
	function isStructuralMutation(mutation) {
		var lists = [mutation.addedNodes, mutation.removedNodes];

		for (var i = 0; i < lists.length; i++) {
			var nodes = lists[i];

			if (!nodes) {
				continue;
			}

			for (var j = 0; j < nodes.length; j++) {
				if (nodes[j].nodeType === 1) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * Recalculate only if a text-only change actually made the page taller.
	 *
	 * The staged wrapper's box is frozen, so the only thing a text change can do
	 * to the fit is change the content height. Reading it is one layout read —
	 * no un-staging, no transform rewrite, no re-raster — and the page keeps the
	 * scale it already has when the number is unchanged.
	 */
	function scheduleHeightCheck() {
		if (heightFrameId) {
			return;
		}

		heightFrameId = window.requestAnimationFrame(function () {
			heightFrameId = 0;

			var element = resolveStage();

			// Nothing staged (yet, or any more): no frozen box to compare, so take
			// the full path.
			if (!element || !element.classList.contains(STAGE_CLASS)) {
				schedule();
				return;
			}

			if ((element.scrollHeight || element.offsetHeight || 0) !== stagedHeight) {
				schedule();
			}
		});
	}

	/**
	 * Decide how much work a batch of DOM changes needs.
	 *
	 * @param {MutationRecord[]} mutations The observer's batch.
	 */
	function handleMutations(mutations) {
		for (var i = 0; i < mutations.length; i++) {
			if (isStructuralMutation(mutations[i])) {
				schedule();
				return;
			}
		}

		scheduleHeightCheck();
	}

	/**
	 * Watch the DOM for late-rendered builder content and rescale when it lands.
	 */
	function observeContent() {
		if (typeof MutationObserver === 'undefined') {
			return;
		}

		observer = new MutationObserver(handleMutations);

		// `childList`/`subtree` only: the class and style writes made by this
		// script are attribute changes, so they can never re-trigger the
		// observer and there is no feedback loop.
		observer.observe(document.body, { childList: true, subtree: true });
	}

	/**
	 * Boot the engine once the DOM is ready.
	 */
	function init() {
		// Safety net: never run on pages that did not opt in.
		if (!document.body || !document.body.classList.contains(BODY_CLASS)) {
			return;
		}

		// The canvas starts hidden (see the no-flash rules in tv-display.css), so
		// guarantee a reveal even if the work below never completes.
		window.setTimeout(markReady, READY_TIMEOUT);

		try {
			applyScale();

			window.addEventListener('resize', schedule, { passive: true });
			window.addEventListener('orientationchange', scheduleWithRetry, { passive: true });
			window.addEventListener('load', scheduleWithRetry);
			document.addEventListener('fullscreenchange', schedule);

			observeContent();

			// Recalculate once fonts and images have settled.
			scheduleWithRetry();
		} catch (error) {
			// Never leave the signage screen blank because of a scripting error.
			markReady();
		}
	}

	// Public hook so other scripts can force a recalculation on demand.
	window.FivePrayerTV = {
		refresh: scheduleWithRetry
	};

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}
})();

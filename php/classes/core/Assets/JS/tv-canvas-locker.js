/**
 * FivePrayer — TV Mode editor guides: Canvas Force & Safe Zone Guide.
 *
 * Enqueued only while at least one of the two editor guides of the TV Display
 * Mode page is on — **Canvas Force** (lock the canvas) or **Safe Zone Guide**
 * (draw the overscan frame) — on a display page, for two surfaces (both fed by
 * one code path):
 *
 *  - the **Block Editor**, via `enqueue_block_editor_assets` — this script runs
 *    in the admin document, so it locates the editor canvas (which may live in an
 *    iframe since WordPress 6.3) and injects into it; and
 *  - **any builder that loads the real front-end URL into its editing iframe**
 *    (Elementor, Divi, Brizy, Bricks, Builderius, Beaver, Breakdance, Oxygen,
 *    WPBakery …) —
 *    here the
 *    script is already running *inside* the canvas document, so it injects into
 *    the document it finds.
 *
 * What each switch does, inside the editing canvas only (they are independent,
 * so either can be used on its own):
 *   1. **Canvas Force** locks the canvas wrapper to the display page's chosen
 *      **width × height** in pixels (`width/height: Npx !important`) and centres
 *      it in the workspace, so `100%` height and `vh` elements scale to the TV
 *      layout instead of the laptop and the canvas sits where the television
 *      will show it rather than against the left edge. Content taller than the
 *      box is left visible (the parent scrolls) — the lock measures the TV box,
 *      it must not silently trim the page. The width is the chosen size only
 *      while the preview can hold it: in a preview *narrower* than the chosen
 *      width (a builder's Mobile preview on a page built for a wide screen) the
 *      box takes the preview's own width, so the canvas never sticks out of the
 *      surface it is drawn on and no space is left where the preview refused it
 *      (see `boxWidth`). The height is always the chosen height, because that is
 *      what `vh` and `100%` read;
 *   2. **Safe Zone Guide** appends a read-only overlay (outer frame = screen,
 *      inner dashed frame = the band a TV can crop) that is `pointer-events:
 *      none`, so it never blocks a click, drag or selection underneath. The band
 *      comes from the TV type chosen on the TV Display Mode page: 5% for an
 *      older TV, nothing for a modern one (then no inner frame is drawn at all).
 *      With Canvas Force off it still draws over the canvas, which is made a
 *      positioning context of its own so the overlay anchors to it. The
 *      information badge (size + what the frames mean) is *not* part of that
 *      overlay: it is drawn just **above** the canvas, so the reading is
 *      available without covering the design;
 *   3. **In-editor control.** a small floating pill (bottom-left of the canvas)
 *      expands into one switch per half, so the canvas can be unlocked or the
 *      guide hidden while designing and put straight back — without leaving the
 *      editor and without changing the saved setting. The override lasts for the
 *      current editing session only; reload the editor to return to the setting.
 *
 *   4. **One guide per page.** A builder may keep more than one canvas of the
 *      same display page open at a time (a canvas per preview variant, a hidden
 *      prefetch frame), and each of those documents is a design-time request of
 *      its own. Only the canvas on screen that claims the page draws the lock
 *      and the guide; the others hand it over, so the guide can never appear
 *      twice on the screen. Two canvases of *different* pages both keep theirs.
 *
 * It is purely visual and in-memory: the finished front-end page is never
 * touched and nothing is written anywhere. Builders re-render their canvas often,
 * so the lock is re-applied on a MutationObserver plus a few timed retries.
 */
(function () {
	'use strict';

	var config = window.fiveprayerCanvasLocker || {};

	var WIDTH = parseInt(config.width, 10) || 0;
	var HEIGHT = parseInt(config.height, 10) || 0;

	// The two independent switches, as chosen on the TV Display Mode page. They
	// are the *starting* state; the in-editor control below can flip either half
	// for the current editing session without changing the saved setting.
	var CANVAS_FORCE = isFlag(config.canvasForce);
	var SAFE_ZONE = isFlag(config.safeZone);

	// Neither switch on: nothing to do (the controller should not have been
	// enqueued at all, but a stale page is not worth breaking over).
	if (!CANVAS_FORCE && !SAFE_ZONE) {
		return;
	}

	// Both halves need the chosen size to mean anything (e.g. the default "Auto"
	// width carries no height). Without it the control still appears, but says so
	// instead of pretending to do something.
	var HAS_SIZE = WIDTH > 0 && HEIGHT > 0;

	// Live state for this editing session, seeded from the setting. The control
	// flips these and re-applies at once.
	var active = {
		canvasForce: CANVAS_FORCE,
		safeZone: SAFE_ZONE
	};

	// Only the halves the settings page has switched on are offered by the
	// in-editor control. A half that is off in the settings is not shown at all —
	// so there is never a switch for a feature the site has not turned on.
	var halves = [];

	if (CANVAS_FORCE) {
		halves.push({
			key: 'canvasForce',
			guide: 'canvas_force',
			label: config.forceLabel || 'Canvas Force'
		});
	}

	if (SAFE_ZONE) {
		halves.push({
			key: 'safeZone',
			guide: 'safe_zone',
			label: config.zoneLabel || 'Safe Zone Guide'
		});
	}

	/**
	 * Read one of the switch flags. PHP may hand the value over as a boolean, a
	 * `1` or a `"true"`; anything else (false, 0, "", "0") counts as off.
	 */
	function isFlag(value) {
		return value === true || value === 1 || value === '1' || value === 'true';
	}

	// The croppable band the guide marks, from the TV type chosen on the TV
	// Display Mode page: 5 for an older TV, 0 for a modern one (the whole screen
	// is visible, so the safe area is the full canvas).
	var MARGIN = parseFloat(config.marginPercent);
	if (!isFinite(MARGIN) || MARGIN < 0 || MARGIN >= 50) {
		MARGIN = 0;
	}

	var LOCK_CLASS = 'fiveprayer-canvas-locked';
	var HOST_CLASS = 'fiveprayer-safe-zone-host';
	var ZONE_CLASS = 'fiveprayer-safe-zone';
	var CONTROL_CLASS = 'fiveprayer-locker-ui';
	var STYLE_ID = 'fiveprayer-canvas-locker-css';

	// Property name of the per-page claim table this script keeps on the editor's
	// top window, so canvases of the same display page agree on which one of them
	// draws the guide (see ownsCanvas). Namespaced, and only ever read by us.
	var CLAIMS_KEY = '__fiveprayerCanvasClaims';

	// The information badge is a sibling of the overlay, not a child of it, so it
	// is not clipped by it and can sit above the canvas. `--inside` is the
	// fallback used when the canvas starts at the very top of the document and
	// there is no room above it: the badge then drops back onto the canvas's top
	// edge rather than being pushed off-screen.
	var BADGE_CLASS = ZONE_CLASS + '__badge';
	var BADGE_INSIDE_CLASS = BADGE_CLASS + '--inside';

	// Canvas wrappers, most specific first. The first one that exists in the
	// target document is locked; `body` is the last resort.
	var WRAPPER_SELECTORS = [
		'[data-fiveprayer-canvas]',
		'.editor-styles-wrapper',   // Block Editor (also non-iframed WordPress).
		'#brx-content',             // Bricks.
		'.brx-body',                // Bricks (body wrapper).
		'#et-boc .et-l',            // Divi builder layout.
		'#et-boc',                  // Divi builder wrapper.
		'.fl-builder-content',      // Beaver Builder.
		'.breakdance',              // Breakdance.
		'.brz-root__container-page', // Brizy: `-page` is its page canvas (`brz-root__container` alone is also a story or a block).
		'#ct-viewport',             // Oxygen.
		'.ct-viewport',             // Oxygen (older).
		'.elementor',               // Elementor canvas.
		'.wp-block-post-content',   // Block-theme content wrapper.
		'.entry-content',           // Classic-theme content wrapper.
		'main'
	];

	// The canvas often finishes settling after first paint (builders, webfonts,
	// the Block Editor's iframe), so the lock is re-applied a few times.
	var RETRY_DELAYS = [200, 600, 1500, 3000];

	// How many times a canvas that handed the guide over to another canvas of the
	// same page re-checks whether that claim has been given up. The canvas that
	// holds it can be replaced while a builder switches its preview, and nothing
	// in *this* document changes when that happens. Bounded, so a document that
	// never draws costs nothing after the first few seconds.
	var HANDOVER_CHECKS = 5;
	var handoverChecks = 0;

	var scheduled = false;
	var applying = false;
	var observedDoc = null;
	var observer = null;

	/**
	 * The document the canvas lives in.
	 *
	 * For the Block Editor that is the editor-canvas iframe when the editor has
	 * one (same-origin, so its `contentDocument` is reachable); otherwise the
	 * admin document itself. A builder's design-time page is the current document.
	 */
	function targetDocument() {
		if (config.blockEditor) {
			var frame = document.querySelector('iframe[name="editor-canvas"], iframe.edit-post-visual-editor__content-area');
			if (frame) {
				try {
					if (frame.contentDocument && frame.contentDocument.body) {
						return frame.contentDocument;
					}
				} catch (e) {
					// Cross-origin or not ready yet; fall through to this document.
				}
			}
		}

		return document;
	}

	/**
	 * Make sure the overlay stylesheet exists in the target document.
	 *
	 * The enqueued stylesheet is already active in the document this script runs
	 * in; a Block Editor canvas iframe does not receive it on its own, so the
	 * link is added there explicitly. Idempotent.
	 */
	function ensureStylesheet(doc) {
		if (doc === document || !config.cssUrl || !doc.head) {
			return;
		}

		if (doc.getElementById(STYLE_ID)) {
			return;
		}

		var link = doc.createElement('link');
		link.id = STYLE_ID;
		link.rel = 'stylesheet';
		link.href = config.cssUrl;
		doc.head.appendChild(link);
	}

	/**
	 * The element to lock: the first known canvas wrapper in the document.
	 */
	function findWrapper(doc) {
		for (var i = 0; i < WRAPPER_SELECTORS.length; i++) {
			var element = doc.querySelector(WRAPPER_SELECTORS[i]);
			if (element && element !== doc.body) {
				return element;
			}
		}

		// Last resort: the canvas document itself, which is what a builder's
		// editing iframe is. The Block Editor's admin document has no canvas of
		// its own (the canvas lives in its iframe), so it must never be locked —
		// that would freeze the whole admin UI. Returning null keeps the
		// controller waiting for the iframe instead.
		if (doc === document && config.blockEditor) {
			return null;
		}

		return doc.body || null;
	}

	/**
	 * The display page this canvas is showing, as its own address names it.
	 *
	 * Two preview variants of one page (a prod and a dev canvas, a device panel
	 * and a prefetch frame) share the key; two different display pages do not.
	 */
	function claimKey() {
		return window.location.origin + window.location.pathname;
	}

	/**
	 * The claim store of the editor window, or null when this document cannot
	 * coordinate: it *is* the editor document, or the editor around it is another
	 * origin (or frame access is blocked). Without a store every canvas draws,
	 * which is the behaviour an uncoordinated editor keeps.
	 */
	function claimStore() {
		try {
			var top = window.top;
			if (!top || top === window) {
				return null;
			}

			void top.document; // Throws when the editor around this frame is another origin.

			if (!top[CLAIMS_KEY]) {
				top[CLAIMS_KEY] = {};
			}

			return top[CLAIMS_KEY];
		} catch (e) {
			return null;
		}
	}

	/**
	 * Whether a frame is provably off screen: its `<iframe>` exists but lays out no
	 * box (a hidden preview variant). Anything that cannot be measured counts as
	 * on screen, so a claim is never taken from a canvas we cannot see into.
	 */
	function frameHidden(win) {
		try {
			if (!win || win === window) {
				return false;
			}

			var el = win.frameElement;
			if (!el) {
				return false;
			}

			return el.getClientRects().length === 0 || el.offsetWidth === 0 || el.offsetHeight === 0;
		} catch (e) {
			return false;
		}
	}

	/**
	 * Whether this document is the one that draws the guide for its page.
	 *
	 * A builder is free to canvass the *same* display page more than once at a
	 * time — Builderius keeps a canvas per preview variant, and editors that
	 * prefetch or keep a hidden preview frame do the same — and every one of those
	 * documents is a separate design-time request. Each would draw its own
	 * overlay, which is what puts the same safe-zone guide on the screen twice.
	 *
	 * The editor's top document is the only place that can see all of them, so the
	 * claim for a page is kept there: the first canvas claims it, a second canvas
	 * of the same page finds it taken and hands the drawing over. A claim is only
	 * ever held by a canvas that is on screen, and it is released when that canvas
	 * unloads, so the guide follows the canvas the designer is actually looking at.
	 *
	 * @returns {boolean} True when this document should draw the lock and guide.
	 */
	function ownsCanvas() {
		var store = claimStore();

		if (!store) {
			return true;
		}

		var key = claimKey();
		var owner = store[key];
		var mine;

		if (!owner || owner === window) {
			mine = true;
		} else {
			// The claimant is a hidden variant beside this canvas: take it over.
			mine = frameHidden(owner);
		}

		if (mine && frameHidden(window)) {
			// A canvas that is not on screen never holds the claim, so the visible
			// canvas beside it can take the guide instead.
			mine = false;
		}

		if (mine) {
			store[key] = window;
		} else if (owner === window) {
			delete store[key];
		}

		return mine;
	}

	/**
	 * Give up the claim for this page when this canvas goes away.
	 */
	function releaseClaim() {
		var store = claimStore();

		if (store) {
			var key = claimKey();
			if (store[key] === window) {
				delete store[key];
			}
		}
	}

	/**
	 * Keep exactly one lock and one guide in a canvas document.
	 *
	 * Builders re-render their canvas, and a re-render can leave the element we
	 * locked behind (a replaced wrapper, a second content box); its overlay would
	 * then still sit on the page next to the new one. Everything that is not the
	 * canvas being drawn on now is undone. One control per document is kept — the
	 * one that is already there, so an open panel survives a re-render.
	 *
	 * @param {Document} doc     Canvas document.
	 * @param {Element}  wrapper Element to keep the marks on.
	 */
	function clearGuide(doc, wrapper) {
		var guides = doc.querySelectorAll('.' + ZONE_CLASS + ', .' + BADGE_CLASS);
		for (var i = 0; i < guides.length; i++) {
			if (guides[i].parentNode && guides[i].parentNode !== wrapper) {
				guides[i].parentNode.removeChild(guides[i]);
			}
		}

		var hosts = doc.querySelectorAll('.' + LOCK_CLASS + ', .' + HOST_CLASS);
		for (var j = 0; j < hosts.length; j++) {
			if (hosts[j] !== wrapper) {
				unlockWrapper(hosts[j]);
				hosts[j].classList.remove(HOST_CLASS);
			}
		}

		var controls = doc.querySelectorAll('.' + CONTROL_CLASS);
		for (var k = 1; k < controls.length; k++) {
			if (controls[k].parentNode) {
				controls[k].parentNode.removeChild(controls[k]);
			}
		}
	}

	/**
	 * Undo everything this document drew.
	 *
	 * Used when the guide is handed to another canvas of the same page, so the
	 * document that steps back leaves no lock, overlay and control of its own
	 * behind.
	 *
	 * @param {Document} doc Canvas document.
	 */
	function teardown(doc) {
		clearGuide(doc, null);

		var controls = doc.querySelectorAll('.' + CONTROL_CLASS);
		for (var i = 0; i < controls.length; i++) {
			if (controls[i].parentNode) {
				controls[i].parentNode.removeChild(controls[i]);
			}
		}
	}

	window.addEventListener('pagehide', releaseClaim);

	/**
	 * Force the wrapper to the chosen pixel size and make it a positioning
	 * context for the overlay. `!important` inline values win over the builder's
	 * own styles; the parent keeps scrolling normally.
	 *
 * The auto side margins centre the canvas in the workspace when it is narrower
 * than the preview (a wide monitor, a maximised browser), which is where the
 * tv-display engine also puts it on the screen. They are `!important` inline
 * values because a builder is free to have written its own `margin-left: 0` on
 * the same element, and that would win otherwise. Only the horizontal pair is
 * set: `auto` top/bottom margins cannot centre a normal-flow block, and writing
 * them would just compress a tall canvas.
 *
 * @param {Element} wrapper Element to lock.
 * @param {number}  width   Width to force, from {@see boxWidth}.
 */
function lockWrapper(wrapper, width) {
	wrapper.style.setProperty('width', width + 'px', 'important');
		wrapper.style.setProperty('height', HEIGHT + 'px', 'important');
		// Deliberately *not* `overflow: hidden`: the safe-zone overlay clips
		// itself, so clipping the canvas here would only cut a page that is taller
		// than the TV box and hide the very content the designer is checking.
		wrapper.style.setProperty('overflow', 'visible', 'important');
		wrapper.style.setProperty('margin-left', 'auto', 'important');
		wrapper.style.setProperty('margin-right', 'auto', 'important');
		wrapper.classList.add(LOCK_CLASS);
	}

/**
 * The width the canvas box may take: the chosen size, or less when the surface
 * the canvas is drawn on cannot hold it.
 *
 * The chosen width is the box the television shows, so that is what the lock
 * asks for — but a builder's device preview can be *narrower* than it (its
 * Mobile preview is 375px while the page is built for a 768px screen, and the
 * block editor previews at 360). Forcing the chosen width there pushes the
 * canvas out of the preview: part of the design is off the edge of the canvas,
 * and the strip the preview refused reads as space the plugin added. The same
 * numbers decide which of the builder's breakpoints is active, because a media
 * query measures the document, not the wrapper — so a box wider than the
 * document would show a small-screen design inside a large box.
 *
 * Two caps, both taken from the surface the canvas is shown on: the wrapper's
 * containing block (what the builder sized for the device being previewed) and
 * the canvas document itself. A parent that cannot be measured (detached,
 * hidden, no box yet) leaves the chosen width in place, so the lock never
 * silently shrinks on a surface it could not read.
 *
 * @param {Element} wrapper Element about to be locked.
 * @return {number} Width in pixels to force on the wrapper.
 */
function boxWidth(wrapper) {
	var doc = wrapper.ownerDocument || document;
	var view = doc.defaultView;
	var widths = [WIDTH];

	var parent = wrapper.parentElement;
	var cs = parent && view ? view.getComputedStyle(parent) : null;

	if (cs) {
		// `clientWidth` is the parent's padding box, so what the wrapper may
		// occupy is that box minus the padding this element sits inside.
		var padding = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
		var space = parent.clientWidth - (isFinite(padding) ? padding : 0);

		if (isFinite(space) && space > 0) {
			widths.push(Math.floor(space));
		}
	}

	if (view && view.innerWidth > 0) {
		widths.push(view.innerWidth);
	}

	return Math.max(0, Math.min.apply(null, widths));
}

/**
 * Undo {@see lockWrapper}: remove the forced size and let the builder show
 * the canvas at its own size again (the in-editor control switched Canvas
 * Force off for this session).
 */
	function unlockWrapper(wrapper) {
		wrapper.style.removeProperty('width');
		wrapper.style.removeProperty('height');
		wrapper.style.removeProperty('overflow');
		wrapper.style.removeProperty('margin-left');
		wrapper.style.removeProperty('margin-right');
		wrapper.classList.remove(LOCK_CLASS);
	}

	/**
	 * Position one of the frames with explicit pixel edges.
	 */
	function setFrame(el, top, right, bottom, left) {
		el.style.setProperty('top', top + 'px', 'important');
		el.style.setProperty('right', right + 'px', 'important');
		el.style.setProperty('bottom', bottom + 'px', 'important');
		el.style.setProperty('left', left + 'px', 'important');
	}

	/**
	 * Size the guide to the canvas *as it is right now*.
	 *
	 * The insets are measured in pixels from the wrapper's own current box
	 * (`clientWidth`/`clientHeight`) rather than left to percentage CSS, so the
	 * top and bottom bands are exactly equal and the guide always matches the
	 * canvas on screen — including after the builder changes its preview size
	 * (device switcher) or the window is resized. The size badge reports the same
	 * measured box, so it can never drift from what is shown.
	 */
	function sizeZone(wrapper, zone) {
		var width = wrapper.clientWidth || WIDTH;
		var height = wrapper.clientHeight || HEIGHT;

		var insetX = Math.round((width * MARGIN) / 100);
		var insetY = Math.round((height * MARGIN) / 100);

		// Percentage fallback, in case a later pass runs before this one.
		zone.style.setProperty('--fiveprayer-safe-zone-inset', MARGIN + '%');

		// Outer frame = the whole current canvas.
		var outer = zone.querySelector('.' + ZONE_CLASS + '__outer');
		if (outer) {
			setFrame(outer, 0, 0, 0, 0);
		}

		// Inner frame = the safe area, one overscan margin in from every edge. A
		// modern TV crops nothing, so there is no inner frame to draw at all.
		var inner = zone.querySelector('.' + ZONE_CLASS + '__inner');
		if (inner) {
			if (MARGIN > 0) {
				inner.style.removeProperty('display');
				setFrame(inner, insetY, insetX, insetY, insetX);
			} else {
				inner.style.setProperty('display', 'none', 'important');
			}
		}

		// The badge (outside the canvas) describes the canvas actually on screen.
		var heading = wrapper.querySelector('.' + ZONE_CLASS + '__heading');
		if (heading) {
			heading.textContent = (config.heading || 'TV canvas') + ' — ' + width + ' × ' + height + ' px';
		}

		placeBadge(wrapper);
	}

	/**
	 * Keep the information badge on screen. It is drawn just *above* the canvas
	 * so it never covers the design, but a canvas that starts at the very top of
	 * the document leaves no room there — the badge would be pushed off the top
	 * edge and lost. Measure the space above the wrapper and fall back to the
	 * canvas's own top edge when there is not enough of it.
	 *
	 * The measurement is taken in document coordinates (the wrapper's viewport
	 * position plus the scroll offset), so it does not change as the editor is
	 * scrolled: the badge cannot flip between the two positions while scrolling.
	 */
	function placeBadge(wrapper) {
		var badge = wrapper.querySelector('.' + BADGE_CLASS);
		if (!badge) {
			return;
		}

		var doc = wrapper.ownerDocument || document;
		var view = doc.defaultView || window;
		var canvasTop = wrapper.getBoundingClientRect().top + (view.pageYOffset || 0);

		// The gap the stylesheet leaves between the badge and the canvas top.
		var gap = 6;
		var outside = canvasTop >= badge.offsetHeight + gap;

		if (outside) {
			badge.classList.remove(BADGE_INSIDE_CLASS);
		} else {
			badge.classList.add(BADGE_INSIDE_CLASS);
		}
	}

	/**
	 * Draw (or refresh) the safe-zone guide inside the locked wrapper.
	 */
	function drawZone(wrapper, doc) {
		var zone = wrapper.querySelector('.' + ZONE_CLASS);

		if (!zone) {
			zone = doc.createElement('div');
			zone.className = ZONE_CLASS;
			zone.setAttribute('aria-hidden', 'true');
			zone.setAttribute('data-fiveprayer-safe-zone', '1');

			var outer = doc.createElement('div');
			outer.className = ZONE_CLASS + '__outer';

			var inner = doc.createElement('div');
			inner.className = ZONE_CLASS + '__inner';

			zone.appendChild(outer);
			zone.appendChild(inner);

			// Appended *inside* the locked wrapper, on top of the design. The
			// overlay clips itself to the canvas, so the frames never spill out.
			wrapper.appendChild(zone);
		}

		// The information badge is a sibling of the overlay, not a child: it must
		// sit *outside* the canvas, just above its top edge, so it never covers
		// the design or the safe-zone frames.
		if (!wrapper.querySelector('.' + BADGE_CLASS)) {
			var badge = doc.createElement('div');
			badge.className = BADGE_CLASS;
			badge.setAttribute('aria-hidden', 'true');
			badge.setAttribute('data-fiveprayer-safe-zone-badge', '1');

			var heading = doc.createElement('span');
			heading.className = ZONE_CLASS + '__heading';

			var hint = doc.createElement('span');
			hint.className = ZONE_CLASS + '__hint';
			hint.textContent = MARGIN > 0
				? 'Dashed frame = ' + MARGIN + '% a TV can crop. Keep text and times inside it.'
				: 'Modern TV — the whole screen is visible, so nothing is cropped.';

			badge.appendChild(heading);
			badge.appendChild(hint);

			wrapper.appendChild(badge);
		}

		sizeZone(wrapper, zone);

		return zone;
	}

	/**
	 * Remove the safe-zone guide, if it is currently drawn.
	 */
	function removeZone(wrapper) {
		var zone = wrapper.querySelector('.' + ZONE_CLASS);
		if (zone && zone.parentNode) {
			zone.parentNode.removeChild(zone);
		}

		// The information badge lives outside the overlay and is removed with it.
		var badge = wrapper.querySelector('.' + BADGE_CLASS);
		if (badge && badge.parentNode) {
			badge.parentNode.removeChild(badge);
		}
	}

	/**
	 * One switch row of the in-editor control.
	 */
	function makeControlRow(doc, guide, text) {
		var row = doc.createElement('label');
		row.className = CONTROL_CLASS + '__row';

		var input = doc.createElement('input');
		input.type = 'checkbox';
		input.setAttribute('data-guide', guide);
		input.disabled = !HAS_SIZE;

		var span = doc.createElement('span');
		span.textContent = text;

		row.appendChild(input);
		row.appendChild(span);

		return row;
	}

	/**
	 * Whether any of the offered halves is currently applied.
	 */
	function anyHalfActive() {
		for (var i = 0; i < halves.length; i++) {
			if (active[halves[i].key]) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Keep the control's switches and its pill in step with the live state.
	 */
	function syncControl(ui) {
		var inputs = ui.querySelectorAll('input[data-guide]');
		for (var i = 0; i < inputs.length; i++) {
			var guide = inputs[i].getAttribute('data-guide');
			inputs[i].checked = guide === 'canvas_force' ? active.canvasForce : active.safeZone;
			inputs[i].disabled = !HAS_SIZE;
		}

		var on = anyHalfActive();
		ui.setAttribute('data-active', on ? '1' : '0');

		var button = ui.querySelector('.' + CONTROL_CLASS + '__button');
		if (button) {
			button.setAttribute('aria-pressed', on ? 'true' : 'false');
			button.title = on
				? (config.turnOffLabel || 'Turn the TV canvas off')
				: (config.turnOnLabel || 'Turn the TV canvas on');
		}
	}

	/**
	 * Create (or refresh) the small floating control in the canvas.
	 *
	 * Appended to the canvas document's `<body>` rather than to the locked
	 * wrapper, so it is never clipped by the wrapper's `overflow: hidden` and is
	 * never counted as page content. The pill (always shown) is a one-click
	 * master switch — it hides every half at once and brings it back. When the
	 * site has both halves on, a caret beside it uncovers one switch per half for
	 * separate control. A half that is off in the settings is never shown.
	 * Whatever is flipped here changes only this editing session — the saved
	 * setting on the TV Display Mode page is untouched.
	 */
	function ensureControl(doc) {
		var ui = doc.querySelector('.' + CONTROL_CLASS);

		if (ui) {
			syncControl(ui);
			return ui;
		}

		if (!doc.body) {
			return null;
		}

		ui = doc.createElement('div');
		ui.className = CONTROL_CLASS;
		ui.setAttribute('data-fiveprayer-locker-ui', '1');

		var bar = doc.createElement('div');
		bar.className = CONTROL_CLASS + '__bar';

		// The pill itself is the one-click master switch: it hides every offered
		// half at once (and brings them straight back) without opening anything.
		var button = doc.createElement('button');
		button.type = 'button';
		button.className = CONTROL_CLASS + '__button';

		var dot = doc.createElement('span');
		dot.className = CONTROL_CLASS + '__dot';

		var buttonLabel = doc.createElement('span');
		buttonLabel.textContent = config.controlLabel || 'TV canvas';

		button.appendChild(dot);
		button.appendChild(buttonLabel);
		bar.appendChild(button);

		// The individual switches, and only when there is more than one half to
		// choose between — with a single half the pill already does the job.
		var panel = null;
		var caret = null;

		if (halves.length > 1) {
			caret = doc.createElement('button');
			caret.type = 'button';
			caret.className = CONTROL_CLASS + '__caret';
			caret.setAttribute('aria-expanded', 'false');
			caret.setAttribute('aria-label', config.moreLabel || 'Individual switches');
			caret.textContent = '\u2304';
			bar.appendChild(caret);

			panel = doc.createElement('div');
			panel.className = CONTROL_CLASS + '__panel';
			panel.hidden = true;

			halves.forEach(function (half) {
				panel.appendChild(makeControlRow(doc, half.guide, half.label));
			});

			if (!HAS_SIZE) {
				var note = doc.createElement('p');
				note.className = CONTROL_CLASS + '__hint';
				note.textContent = config.sizeHint
					|| 'Choose a size (width × height) for this display page first.';
				panel.appendChild(note);
			}
		}

		ui.appendChild(bar);

		if (panel) {
			ui.appendChild(panel);
		}

		// One click on the pill: hide every offered half, or bring them all back.
		button.addEventListener('click', function (event) {
			event.preventDefault();
			event.stopPropagation();

			var next = !anyHalfActive();
			halves.forEach(function (half) {
				active[half.key] = next;
			});

			apply();
		});

		// Expanding/collapsing the individual switches.
		if (caret && panel) {
			caret.addEventListener('click', function (event) {
				event.preventDefault();
				event.stopPropagation();
				panel.hidden = !panel.hidden;
				caret.setAttribute('aria-expanded', panel.hidden ? 'false' : 'true');
				caret.textContent = panel.hidden ? '\u2304' : '\u2303';
			});
		}

		// Keep the builder's own canvas from reacting to clicks on the control.
		['click', 'mousedown', 'pointerdown', 'touchstart'].forEach(function (type) {
			ui.addEventListener(type, function (event) {
				event.stopPropagation();
			});
		});

		// Flip one half for this session and re-apply immediately.
		if (panel) {
			panel.addEventListener('change', function (event) {
				var input = event.target;
				if (!input || !input.getAttribute) {
					return;
				}

				var guide = input.getAttribute('data-guide');
				if (guide === 'canvas_force') {
					active.canvasForce = !!input.checked;
				} else if (guide === 'safe_zone') {
					active.safeZone = !!input.checked;
				} else {
					return;
				}

				apply();
			});
		}

		doc.body.appendChild(ui);
		syncControl(ui);

		return ui;
	}

	/**
	 * Apply the lock and the guide once. Idempotent, so it is safe to call on
	 * every mutation and retry.
	 */
	function apply() {
		if (applying) {
			return;
		}

		applying = true;

		try {
			var doc = targetDocument();
			if (!doc || !doc.body) {
				return;
			}

			ensureStylesheet(doc);

			var wrapper = findWrapper(doc);

			// In the Block Editor the admin document has no canvas of its own;
			// `findWrapper` returns null there, and the control must NOT be
			// injected into the whole admin UI while we wait for the iframe.
			if (!wrapper) {
				return;
			}

			// One guide per display page per editor window. When a builder canvasses
			// the same page more than once at a time (a canvas per preview variant,
			// a hidden prefetch frame), one document draws and the others hand it
			// over, so the same safe-zone guide cannot appear twice on the screen.
			if (!ownsCanvas()) {
				teardown(doc);
				observeDocument(doc);

				if (handoverChecks < HANDOVER_CHECKS) {
					handoverChecks++;
					window.setTimeout(schedule, 1500);
				}

				return;
			}

			handoverChecks = 0;

			// A re-render can leave the wrapper we locked behind with its overlay
			// still on it; only the canvas drawn on now may carry the marks.
			clearGuide(doc, wrapper);

			// The control appears as soon as the canvas exists — even before a size
			// is chosen — so the two halves can always be switched.
			ensureControl(doc);

			if (HAS_SIZE) {
				// "Inject global CSS variables using the chosen dimensions" — any
				// rule in the canvas can read these.
				doc.documentElement.style.setProperty('--fiveprayer-canvas-width', WIDTH + 'px');
				doc.documentElement.style.setProperty('--fiveprayer-canvas-height', HEIGHT + 'px');

				if (active.canvasForce) {
					lockWrapper(wrapper, boxWidth(wrapper));
				} else {
					unlockWrapper(wrapper);
				}

				if (active.safeZone) {
					// The overlay is absolutely positioned, so the wrapper has to be
					// a positioning context. `lockWrapper` already makes it one; with
					// Canvas Force off this class does it on its own, and it is
					// harmless when both halves are on.
					wrapper.classList.add(HOST_CLASS);
					drawZone(wrapper, doc);
				} else {
					removeZone(wrapper);
					wrapper.classList.remove(HOST_CLASS);
				}
			}

			observeDocument(doc);
			watchResize(doc);
		} catch (e) {
			// Never let a design aid break the editor: swallow and let the next
			// scheduled pass try again.
		} finally {
			applying = false;
		}
	}

	/**
	 * Watch a document for the canvas being re-rendered, and re-apply.
	 */
	function observeDocument(doc) {
		if (observedDoc === doc || !doc.body || typeof MutationObserver === 'undefined') {
			return;
		}

		if (observer) {
			observer.disconnect();
		}

		observedDoc = doc;
		observer = new MutationObserver(function () {
			schedule();
		});

		// Only structural changes (a builder re-rendering its canvas). Attribute
		// watching is deliberately left off: the lock itself writes inline styles,
		// which would otherwise re-trigger this observer.
		observer.observe(doc.body, {
			childList: true,
			subtree: true
		});
	}

	/**
	 * Re-measure (and re-draw) when the canvas changes size.
	 *
	 * The builder's device switcher resizes the preview, and a browser resize
	 * changes the workspace; both fire a `resize` on the window the canvas lives
	 * in. Watching it keeps the guide sized to the canvas that is on screen.
	 */
	var watchedResize = [];

	function watchResize(doc) {
		var candidates = [doc.defaultView];

		if (typeof window !== 'undefined' && window !== doc.defaultView) {
			candidates.push(window);
		}

		candidates.forEach(function (win) {
			if (win && watchedResize.indexOf(win) === -1) {
				watchedResize.push(win);
				win.addEventListener('resize', schedule);
			}
		});
	}

	/**
	 * Re-apply on the next frame, coalescing bursts of mutations.
	 */
	function schedule() {
		if (scheduled) {
			return;
		}

		scheduled = true;

		window.requestAnimationFrame(function () {
			scheduled = false;
			apply();
		});
	}

	/**
	 * Wait until the canvas exists, then lock it.
	 */
	function boot() {
		apply();

		RETRY_DELAYS.forEach(function (delay) {
			window.setTimeout(apply, delay);
		});

		// The Block Editor's canvas iframe appears after the admin document is
		// ready, so watch for it and apply once it exists (and again when it
		// loads). This observer intentionally does NOT re-apply on every admin
		// mutation — the admin app re-renders constantly, and the canvas's own
		// observer (observeDocument) already handles re-renders inside it.
		if (config.blockEditor) {
			var watchIframe = function () {
				var frame = document.querySelector('iframe[name="editor-canvas"]');
				if (frame && !frame.dataset.fiveprayerLockerWatched) {
					frame.dataset.fiveprayerLockerWatched = '1';
					frame.addEventListener('load', function () {
						window.setTimeout(apply, 50);
					});
					// The iframe may already be loaded by the time we see it.
					window.setTimeout(apply, 50);
				}
			};

			watchIframe();

			if (typeof MutationObserver !== 'undefined') {
				new MutationObserver(watchIframe).observe(document.documentElement, {
					childList: true,
					subtree: true
				});
			}
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', boot);
	} else {
		boot();
	}
})();

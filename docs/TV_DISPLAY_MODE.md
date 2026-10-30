# FivePrayer — TV Display Mode (User Guide)

TV Display Mode turns **one WordPress page or post** into a full-screen digital
signage screen for a mosque (a "TV display"). When enabled, that page
automatically scales to fit any screen — from a small monitor to a 4K TV —
without scrollbars, and hides the theme's header, footer and sidebars. When
disabled, the page is a completely normal website page.

It is **opt-in per page**: enabling it on one page never changes any other page.

> **Beta.** TV Display Mode is still being improved. It is usable as it stands,
> but parts of it may change or be reworked in a later release — the settings
> screens and the editor's **TV Mode** box say so too. Check each display page on
> the screen it runs on after every plugin update.

Everything sits behind one master switch, **TV Display Mode** in
**Customizing → Configure Settings → Feature Switches**. It ships **off** — like
every other optional feature, and deliberately so while it is in beta — so turn
it on there before anything else. While it is **on**, the **TV Display Mode**
page is listed in the **Categories** list; turn the master off and that page
disappears (or stays dimmed with an *Off* badge if you chose that sidebar style)
and its three switches are switched off with it.

Three switches live on **Customizing → Configure Settings → TV Display Mode**,
and **all three start off** — you turn on exactly the ones you use:

| Switch | What it turns on | Default |
|--------|------------------|---------|
| **Pages** on/off | The **TV Mode** box in Page editors | **Off** |
| **Posts** on/off | The same box in Post editors | **Off** |
| **Share on Local Network** on/off | Opening the site from a TV, phone or tablet on the same network (`localhost` → this computer's network IP). Leave it on while a screen is in use. See [Share on Local Network](LOCAL_NETWORK_TESTING.md) | **Off** |

Two further layers decide what actually shows: the per-content opt-in (the
**Enable TV Mode** box inside one page or post) and, for a page that is
only ever opened on the computer that runs it, the display works without the
network switch.

The three switches are independent: turn **Pages** off and only Page editors
lose the box, while Posts keep working (and the other way round); turn **TV /
Phone Display** off and the site behaves exactly as before for other devices.
Turning a switch **off** returns the content that had it on to a normal look;
the per-page ticks are **kept in the database**, so switching it back on
restores exactly the same display pages. Nothing works while its switch is off.

---

## 1. Where is the feature?

| Item | Location |
|------|----------|
| Master switch | **Customizing → Configure Settings → Feature Switches → TV Display Mode** (off ⇒ the switch page below is not listed and all three of its switches are forced off) |
| Switch page | **Customizing → Configure Settings → TV Display Mode** (three switches: Pages, Posts, Share on Local Network) |
| Master switch key | `feature_toggles['TV_Display_Mode']` (`true` = on; a map without the key counts as **off**, because this is a beta feature and ships opt-in) |
| Pages switch option | `fiveprayer_tv_display_mode_page` |
| Posts switch option | `fiveprayer_tv_display_mode_post` |
| Network switch option | `fiveprayer_local_testing_mode` |
| Layout width option | `fiveprayer_tv_display_canvas_width` (`0` = Auto; otherwise the width in px, 320–7680) |
| Layout width — one page | Post meta `_fiveprayer_tv_canvas_width` on that page (missing = site setting, `0` = Auto for that page, otherwise the width in px). Chosen in the page's **"TV Mode"** box |
| Layout width — one device | `?fiveprayer_tv_width=<n>` (or `auto` / `0`) added to the address opened on that screen |
| Named sizes option | `fiveprayer_tv_display_canvas_presets` — a list of `{value (width), label}` records, up to 12, in the order they were saved |
| Named sizes save action | `fp_save_tv_canvas_presets` (fields `names[]` and `widths[]`, `manage_options` + the settings nonce) |
| Per-content toggle | Any **Page** or **Post** → editor → **"TV Mode"** box (the short name of TV Display Mode) |
| Menu location | WordPress Admin → **Pages** / **Posts** → open/create one |
| Stored value | Post meta key `_fiveprayer_tv_mode` (`'1'` = on, `'0'` = off) |
| Front-end marker | Body class `fiveprayer-tv-active` |
| Stylesheet | `php/classes/core/Assets/CSS/tv-display.css` |
| Script | `php/classes/core/Assets/JS/tv-display.js` |
| Core class | `php/classes/core/Admin/TVDisplayMode.php` |

Nothing appears in your site's front end unless the switch for that content's
post type is on **and** the content itself is ticked.

---

## 2. Step-by-step: enable TV Display Mode on a page

### 2.1 Create or open the page
1. Log in to WordPress admin.
2. Go to **Pages** (or **Pages → Add New Page**).
3. Build the page with your normal builder (Gutenberg/Block Editor, Elementor,
   Divi, classic editor, etc.). Design it as you want it to look on the TV.

> Tip: Design the page the way it should look on the TV — a **1920 × 1080**
> canvas is the typical Full HD TV. The finished page is scaled to fit the
> screen, so the layout you design is the layout the screen shows.

### 2.2 Find the settings panel
First make sure **TV Display Mode** is switched on in **Configure Settings →
Feature Switches** (it is the master switch and ships **off** — it is a beta
feature, so turn it on there first), then switch on the
post type you are editing in
**Customizing → Configure Settings → TV Display Mode**. All three switches start
**off**, so nothing appears in any editor until you turn on Pages, Posts, or
both; while a switch is off, the box is not rendered in that post type's
editors. (The third switch, **Share on Local Network**, only matters when the TV or
phone is another device on your Wi-Fi — see
[Share on Local Network](LOCAL_NETWORK_TESTING.md).)

- **Classic Editor:** look in the **right-hand sidebar** for the box titled
  **"TV Mode"**.
- **Block Editor (Gutenberg):** open the **Settings sidebar** (click the ⚙ gear
  top-right). The plugin's metaboxes appear in the panel; if you don't see it,
  scroll to the **bottom of the editor** under the content — classic meta boxes
  render there in the block editor.

The box is titled **"TV Mode"** — the short form of TV Display Mode, because the
heading has to be read in a narrow editor sidebar. It contains one checkbox and
nothing else:

> ☐ **Enable TV Mode**

### 2.3 Switch it on
4. Tick **"Enable TV Mode"**.
5. Click **Publish** or **Update** to save.

That's it. The setting is saved securely (nonce-checked, page-edit capability
checked) and stored in `_fiveprayer_tv_mode`.

### 2.4 Designing it in a page builder

The page builder's editing canvas is **never** given the TV treatment: you design
the page as a normal page, with the theme header, footer and sidebars visible
and no scaling. The signage look appears only when the page is opened normally —
including **View Page** and WordPress **Preview**.

That is deliberate. Builders open the real front-end URL inside the editor, so
without this guard the header/footer would vanish and the canvas would be scaled
to a fixed screen while you were still designing.

Built in: Elementor, Beaver Builder, Divi, Brizy, Bricks, Builderius, Oxygen,
WPBakery, Breakdance, Thrive Architect, Bold Builder, SiteOrigin live editor,
and the WordPress customizer.

Brizy's canvas is the one builder here whose argument is not in the list of
editing addresses: its editor loads the page with `?is-editor-iframe=<time>`,
so that argument is named as well, *and* the canvas is an iframe, which the
frame rule below already covers.

It is also detected **generically**: a request that arrives *inside a frame* is
never the screen, because a television loads the page as a top-level document.
Browsers label this (`Sec-Fetch-Dest`), so every builder's canvas — including
its Desktop / Tablet / Mobile device previews, and any builder whose query
argument is not in the list — is left as a normal, editable page. That is what
stops the canvas from being scaled to the screen while you design.

If your builder uses a different argument, add it anyway (the list is a
fallback for the rare browser that sends no frame information):

```php
add_filter( 'fiveprayer_tv_display_design_query_args', function ( $args ) {
    $args[] = 'my_builder_preview';
    return $args;
} );
```

### 2.5 Preview it
6. Click **View Page** (or **Preview**).
7. You should see the page fill the whole viewport with **no scrollbars**, and
   the theme header/footer/sidebar hidden.

### 2.6 Editor design aids: Canvas Force & Safe Zone Guide

Two **editor-only** switches on the TV Display Mode page (Configure Settings →
TV Display Mode, under **Editor design aids**) help you design the page at the
size the TV will show. Neither one changes the finished page: they inject into
the **page builder's editing canvas** only, never into the served display page.

| Switch | What it does in the builder | When off (default) |
|--------|-----------------------------|--------------------|
| **Canvas Force** | Locks the editing canvas to the display page's chosen **width × height** (`width/height: Npx`), so `height: 100%` and `vh` elements scale to the TV box instead of the designer's laptop. Content taller than the box stays visible (the workspace scrolls) rather than being silently cut off. The **height is always the chosen height** (that is what `vh` and `100%` read); the **width is the chosen width only while the preview can hold it** — in a preview narrower than the page's size (a Mobile preview, a 375 px phone mock-up, the block editor's 360 px) the box takes the preview's own width instead, so the canvas never sticks out of the preview and no strip is left looking like space the plugin added. | The canvas is shown at its own size, exactly as before. |
| **Safe Zone Guide** | Draws a read-only overlay over the canvas — an outer frame for the screen and an inner dashed frame for the band a TV can crop. That band comes from the **TV type** chosen above (§4.3): 5% per edge for an older TV, none for a modern one (then no inner frame is drawn). The frames are measured from the canvas's **actual current size**, so the top and bottom bands are exactly equal and follow the canvas when the builder resizes its preview (device switcher) or the window. It ignores the pointer, so it never blocks a click, drag or selection. Alongside the frames, an **information badge** reports the box on screen (`TV canvas — 1280 × 720 px`) with a one-line reminder of what the frames mean; it is drawn just **above** the canvas, outside it, left-aligned with the canvas edge, so it never covers the design or the frames themselves. | No overlay is drawn. |

A builder may keep more than one canvas of the same display page open at once (a
canvas per preview variant, or a hidden frame it prefetches ahead of time). Only
the canvas that is **on screen** draws the lock and the guide — the others hand
it over — so the guide appears **once** per page. Two canvases of two different
display pages each keep their own.

The two are independent: you can lock the canvas without the guide, or draw the
guide over an unlocked canvas. Both need a size that carries a **height** (a
named size, or a preset with one — see
[Layout width](#42-which-breakpoint-the-tv-gets--the-layout-width)); with the
default **Auto** width there is no height to lock to, so nothing is injected.

**What the space around the locked canvas is.** The lock draws the box the
screen will show, so when the builder's preview is *wider* than the page's size
the canvas is smaller than the workspace and the leftover is the canvas itself —
the same empty banding the television adds when the screen's shape differs from
the chosen box. Nothing is added by the plugin there, and nothing inside the
canvas is respaced: the design keeps the spacing you gave it. To see the canvas
fill the surface instead, switch the builder to a preview of the page's own size
(or use **Tablet** on a page built at 768), and use the pill's one click to drop
the lock for a moment when you want the plain workspace.

| Item | Value |
|------|-------|
| Canvas Force option | `fiveprayer_tv_canvas_force` (`0` = off, `1` = on) |
| Safe Zone Guide option | `fiveprayer_tv_safe_zone_guide` (`0` = off, `1` = on) |
| Save action | `fp_save_tv_editor_guide` (field `guide` = `canvas_force` \| `safe_zone`, field `enabled`; `manage_options` + the settings nonce) |
| Safe-zone margin | 5% of each edge |
| Safe-zone badge | `.fiveprayer-safe-zone__badge` (above the canvas); `.fiveprayer-safe-zone__badge--inside` is the fallback used only when the canvas starts at the very top of the document and there is no room above it |
| Editor assets | `php/classes/core/Assets/JS/tv-canvas-locker.js`, `php/classes/core/Assets/CSS/tv-canvas-locker.css` |

The controller is enqueued in the **Block Editor** (`enqueue_block_editor_assets`)
and on a **builder's design-time request** (the same
`is_design_time_request()` guard that keeps the canvas looking normal), and only
while at least one of the two switches is on.

**Controlling it from inside the editor.** While you are designing a display
page, a small **TV canvas** pill appears in the bottom-left of the canvas.

- **One click on the pill** turns the whole thing off — the canvas lock and the
  guide together — and one more click brings it straight back. That is the quick
  way to drop back to the plain canvas for a moment.
- If the site has **both** halves turned on, a small caret beside the pill
  uncovers one switch per half, so the lock and the guide can be toggled
  separately.
- A half that is **off** in the settings above is not shown in the control at
  all — there is never a switch for a feature the site has not turned on.

Either way the override is for the current editing session only: it changes
nothing in the database, so reloading the editor returns to the saved setting.

---

## 3. Put it on the TV (kiosk / full-screen)

TV Display Mode makes the page fill the screen, but you also want the browser to
run without tabs and toolbars:

1. Open the page URL in the TV's browser (Chrome/Edge/Firefox).
2. Press **F11** (Windows) or **Ctrl + Cmd + F** (macOS) for full screen, or use
   the browser's Kiosk mode.
3. For a permanently installed display, launch the browser in kiosk mode
   pointing at the page URL, for example:
   - Chrome: `chrome --kiosk --app="https://your-site.com/tv-page/"`
   - Edge: `msedge --kiosk "https://your-site.com/tv-page/"`
4. Disable the screensaver / sleep on the TV device.

The page will automatically re-scale if the screen resolution changes (for
example if the TV is switched or the browser window is resized).

---

## 4. How the scaling works

- The page is laid out exactly as the theme and the page builder built it.
  TV Display Mode **never** resizes or repaints the content: no container
  width, `max-width`, margin, padding or background of the page is overridden.
  The one deliberate exception is the `max-width` a **theme** puts around the
  design wrapper while the canvas is locked — without that lift the screen put
  the design in a narrower column than the editor canvas does (see the box-width
  bullet below).
- On each resize — and whenever the page's markup changes — the script finds the
  page's main content wrapper, measures its **natural** size and applies
  `transform: translate(...) scale(...)` with `transform-origin: top left`.
  The offsets are written for that corner, so the corner is **asserted**, not
  assumed: the stylesheet says `top left !important` and the script writes the
  same value inline on the element while it is staged (and removes it during
  measurement). A page builder that anchors its own wrapper differently — Brizy
  ships `.brz .brz-reset-all { transform-origin: 50% 50% }` on the element this
  feature stages — would otherwise move the whole canvas by
  `(1 − scale) × size ÷ 2` towards the bottom-right: measured on a Brizy display
  page, a 37 px band on the left became 0 px on the right and the top edge sat
  14 px down instead of flush, and on a screen narrower than the design box that
  displacement puts part of the design off the screen.
- The width it freezes on the stage is the width it just measured, i.e. the
  width the builder gave the page. Boxed containers stay boxed, full-bleed
  sections stay full-bleed, and every column, gutter and section keeps the
  geometry it was designed with.
- When a screen size that carries a **height** is chosen for the page, **that box
  is what the screen presents**: the frame is the chosen width × height — the
  canvas the editor locked and the safe-zone guide drew — so a design that fits
  the box is shown at the size it was designed at. A shorter page still fills
  the box (the frame is not lowered for it).

  The box's height is a **floor, not a ceiling**. A display page is
  scroll-locked — a television has no pointer — so anything the fit leaves past
  the bottom edge of the screen can never be reached. Measured on this plugin's
  own display page at 1920 × 1080: the page is 1230 px tall against a 1024 px
  box, which left Dhuhr, Asr, Maghrib and Isha off the screen. So when the page's
  real content is **taller** than the chosen box, the fit uses that real height
  and the whole page lands on the screen, a little smaller, instead of running
  off it. Nothing else changes: the width is not involved, and a page that fits
  its box keeps the box's scale exactly.

  The scale is checked once more against the **staged** box, because
  `position: fixed` changes the containing block and can lay the same content
  out a few pixels taller (15 px on the display page above). The smaller of the
  two scales wins, so the last row of a table can never sit just past the edge.

- **The design gets that box's width too.** Themes cap the content: a block
  theme prints its *Content width* (`Site Editor → Styles → Layout`) as a
  `max-width` on the children of the content wrapper — 645 px in Twenty
  Twenty-Five — and a classic theme caps its content area the same way. The builder canvas
  already lifts that cap while it is locked (that is part of how the canvas
  shows a design flush to the box edges), so the screen lifts the same cap on
  the same element. Before, the cap stayed in place on the screen: on the same
  page the canvas gave the design 768 px and the television gave it 645 px, i.e.
  the *"no space in the editor, space left and right on the device"* difference.
  Only the **wrapper's own** cap is lifted, and only while Canvas Force is on for
  the page:

  - a boxed width a builder or Gutenberg set on a container **inside** the design
    (`Alignwide`, an Elementor boxed section, a Divi row) is your design, and is
    kept exactly;
  - with **Canvas Force off** nothing is lifted, so the screen keeps the theme's
    width exactly as before — which is what an unlocked canvas shows as well.

  The width is framed the same way: it is the width the page was laid out with,
  not its scroll width, so an element that overflows the page box (an image wider
  than the canvas) no longer enlarges the measurement and shrinks the whole page
  to fit itself — it overflows the box, exactly as it does outside the canvas box
  in the builder.

  With no height chosen (the default **Auto** width) none of this applies: the
  page is measured on its own — overflow included — and fitted, so everything on
  such a page stays visible. Choose a size without a height when you want a long
  page shrunk to fit rather than shown as the box you designed.
- The scale is one number for both axes:
  `min(safe_width / box_width, safe_height / box_height)` — "contain". The box
  always fits the screen with no scrollbars, and the proportions never change.
- **The last thing the page shows keeps a distance from the bottom edge.** A fit
  driven by the page's height otherwise ends the design exactly on the screen's
  bottom edge, where an older panel's overscan crops it — and the page is
  scroll-locked, so nothing can bring it back. Three per cent of the screen
  height (never less than 12 px, never more than 60 px) is therefore kept clear
  under the page's last drawn element: its last row, caption or image.

  It is measured against what the page **shows**, not against its box, so a page
  that already leaves space under its content — a bottom padding or margin, or
  the fit's own leftover — keeps its scale; only a page that would otherwise
  touch the edge is adjusted, and then by about 3 %. Nothing inside the design
  is moved or restyled: this is one extra term in the fit, nothing more. With
  **Older TV (~5% overscan)** chosen, the safe area's own band already is that
  clearance, so nothing is added on top of it and the page keeps its scale.
- Any extra space between the box and the screen is left around the box rather
  than cropped. Sideways it is centred; **above the design there is never any** —
  the box is anchored to the top edge of the screen and the leftover sits below
  it, because the top edge is where the design is read from (the theme's own top
  spacing is already trimmed there, section 4.1). That is what keeps a box shorter
  than the screen from floating in the middle of it: a 768 × 1024 canvas on a
  1080 × 1920 panel used to put 448 px of nothing above the design and the same
  below it, and a 1920 × 1080 box on a 1920 × 1080 screen left 28 px above. The
  leftover space is black, while a background you set on the page itself still
  shows. A screen taller than the box shows the box's frame; a page taller than
  the box is fitted by its own height, so the design is on the screen whole
  rather than cut off at its bottom edge.
- The calculation is debounced with `requestAnimationFrame`, so a burst of
  resize events only triggers one layout pass per frame.

> **Design tip:** because the content is only scaled, what you see in the
> builder's canvas is what appears on the TV — the same layout, just fitted to
> the screen. A page designed 1920px wide shows at 100% on a Full HD screen and
> is scaled proportionally on anything else (4K, HD, a smaller monitor).
> A page whose content is narrower than the screen is enlarged to fill it, still
> without changing a single relationship inside the layout.

### 4.1 A clean canvas: the theme's own spacing is removed

A theme wraps your content in its own boxes — `#page`, `.site-content`,
`.site-main`, `.content-area`, `.container`, `.entry-content` — and gives those
boxes margins, paddings and borders that your page builder never designed. On a
normal website that spacing is exactly right. On a signage screen it is empty
bands of nothing around your design, and it also makes the measured canvas
bigger than the design.

On the TV page, those wrappers are therefore cleaned: margin, padding and border
are set to `0` for the content wrapper and every container above it, up to
`<body>`. Only those three properties are touched — **width, `max-width` and
display are never changed** — with the single exception of the theme's own
`max-width` cap on the design wrapper while the canvas is locked, which the
screen lifts so the design arrives at the width the editor canvas gave it (see
section 4). Everything else keeps the width and `max-width` the theme or the
builder set, so nothing is resized or re-flowed.

What is **kept**:

- every margin, padding and border set **inside** your content, i.e. everything
your page builder or Gutenberg created — block gaps, group/section padding,
container spacing, columns, rows;
- Gutenberg's own content width (`Site Editor → Styles → Layout → Content width`)
and the alignments you chose. If a block page still looks narrow with wide empty
sides, that width is the setting to change — it is your design, not theme
spacing;
- the theme's boxed content width, so the design keeps the geometry it had in
the builder's canvas — unless the editor canvas is locked to this page's box
  (**Canvas Force**), where the canvas lifts that cap and the screen lifts it
  with it (section 4).

> Want the theme's spacing back on the TV screen? Override it for the element you
> want with **Appearance → Customize → Additional CSS** (custom CSS prints after
> this plugin's stylesheet):
>
> ```css
> body.fiveprayer-tv-active .fiveprayer-tv-clean { padding: 40px !important; }
> ```

#### The empty band at the top of the page

A block theme prints the page title **inside** the content wrapper, with Gutenberg
spacer blocks around it, and gives `main` and the post-content wrapper a top
margin. TV Display Mode hides that title (section 6), so before this pass the
spacers and margins that framed it stayed behind as an empty band at the top of
the screen — space belonging to the theme, not to your page. (The same band is
visible in the block editor, where the title and its spacers sit, which is why it
can look as if the header is adding it.)

Display pages are therefore **flushed at the top**:

- the **top edge only** of the content wrapper and every wrapper above it is
  zeroed — top margin, top padding, top border. Left, right and bottom spacing,
  section paddings and block gaps are untouched;
- leading boxes that hold **no visible text and paint nothing** — the spacer
  blocks and the group that only framed the hidden title — are hidden outright.
  A leading box that paints (a coloured bar, a divider, a background image) is
  kept, and so is anything with text in it.

The pass stops at the content wrapper, so **everything you built is safe**: a
spacer block you placed yourself inside the page is not touched, and neither is
any other block spacing. If a page is meant to be inset from the top, put it back
for that page with custom CSS:

```css
body.fiveprayer-tv-active .fiveprayer-tv-trim { padding-top: 40px !important; }
```

### 4.2 Which breakpoint the TV gets — the **Layout width**

A page builder (Elementor, Divi, Bricks, Breakdance, Gutenberg, …) decides which
of its designs to show — desktop, tablet or mobile — with **CSS media queries**,
and a media query measures the **browser's viewport**, not the scale this feature
applies. Scaling never changes that viewport, so the breakpoint a TV gets is
whatever the TV's browser reports:

| Where the page is opened | Viewport the builder is measured against | Design it shows |
|---|---|---|
| A computer or mini PC at Full HD, full screen | ≈1920 px | desktop (what you designed) |
| A smart-TV browser | ≈980 px — or ≈960 px on a 1080p screen with a 2× pixel ratio | its tablet or mobile layout |

That is the whole reason a breakpoint can look like it is being ignored: the
builder is not ignoring it, it is measuring a number nobody chose.

**Layout width** — the fourth row of **Customizing → Configure Settings → TV
Display Mode** — fixes it at the only place it can be fixed, the page's
`<meta name="viewport">` tag:

- **Auto (the default)** — the page is left exactly as the theme printed it, no
  buffering, no rewriting, and the TV's own viewport decides. This is the
  behaviour of every earlier version.
- **A chosen width (recommended: Full HD, 1920 px)** — on display pages only, the
  plugin writes one tag and removes the theme's own:

  ```html
  <meta name="viewport" content="width=1920" />
  ```

  The TV browser then lays the page out at exactly 1920 CSS pixels and zooms that
  canvas to fill the screen itself, so every breakpoint resolves the same way on
  every screen: a design built for Full HD always gets the Full HD design, on a
  4K TV, an HD TV, a monitor or a mini PC.

**Match your page builder's breakpoint to the width.** The Layout width states
the width the page is laid out at, but the design it gets is still chosen by your
page builder's own breakpoints. If the builder lets you create custom
breakpoints, add one at the **same width** you chose here — for example a
**768 px** breakpoint for a tablet-style layout — so the builder switches to that
design at exactly the width the TV is laid out at. A breakpoint set to some other
number only ever shows a different design than the one the screen is laid out
for.

What it does **not** do: it never resizes, re-spaces or restyles a single element
inside the page. It only states which width the page is laid out at — the same
thing a browser window of that width states. The scaling engine keeps working
unchanged, because the layout viewport and the reported window size stay in
agreement whatever the tag says.

#### Any screen, any shape — the width can be chosen three levels deep

A mosque with two differently *shaped* screens — a landscape TV in the hall and
a **vertical (portrait)** panel by the door — does not need two pages and does
not have to choose one width for the whole site. One display page carries every
design, and each screen picks the one it should show. Three levels, narrowest
last:

| Chosen where | Wins over | Use it for |
|---|---|---|
| **The address** — `?fiveprayer_tv_width=480` on the display page | both of the others | **one device only**: the TV's bookmark, a kiosk's shortcut, the phone in the corridor. Nothing is saved anywhere |
| **The page** — the **Layout width** list inside that page's **"TV Mode"** box | the site setting | a page built for one kind of screen |
| **The site setting** — Customizing → Configure Settings → TV Display Mode → **Layout width** | — | the default for every display page |

`auto` (or `0`) in the address means "use whatever width this screen reports",
which is the one-line way to undo a pinned width on a single device.

#### Your own named sizes

The sizes offered in those lists are not fixed. **Customizing → Configure
Settings → TV Display Mode → Layout width → “Your own sizes”** keeps a list the
site names itself — for example `Hall TV — 1920 × 1080`, `Entrance panel
(vertical) — 1440 × 2560` — and every name then appears in *every* width list:
that settings row and the **“Layout width”** list of every page's **“TV Mode”**
box. Naming a screen once means picking it by name in the editor instead of
remembering a number.

Each size is a **width**: the number of pixels the page is laid out at, which
decides which of your page builder's designs (desktop, tablet, phone) the screen
gets. Set that builder's own custom breakpoint to the same width, so it switches
to that design at exactly the width the TV is laid out at.

The settings row itself offers the built-in widths and the sizes you have named —
nothing else. A width that is missing (1440, 1850, anything) is added here once,
with a name; it then appears in the row, in every page's **“Layout width”** list,
and can still be opened by number on any device.

- Up to **12** sizes; a name may be up to **40** characters.
- A width is a number in the same **320–7680** range and is clamped like any
  other, so a typo lands on the nearest usable width instead of being lost.
- A row needs **both** a name and a width. A row without a name or a width is
  dropped when you save, and the editor then shows exactly what was stored — not
  what was typed.
- Two rows with the same width keep the **first** name, so saving a screen twice
  cannot silently rename it.
- A name you give to a built-in width **replaces the built-in label** for that
  width: with `Hall TV — 1920` saved, `1920` reads “Hall TV” everywhere instead
  of “Full HD TV — 1920 px (recommended)”. The built-in ladder itself is never
  changed, and **Auto** always stays first.
- The address argument still takes a **plain number** (`?fiveprayer_tv_width=1440`),
  because a name is a label for a width, not a different kind of value. That also
  means the list can be edited freely without breaking a TV that already opens a
  width by number.

**Vertical (portrait) screens.** WordPress itself decides desktop / tablet /
phone from the page's width — its breakpoints are **782 px** and **480 px**:

| Width in force | Design that is used |
|---|---|
| more than 782 px (1920, 1280, …) | desktop |
| 481–782 px (pick **782**) | tablet |
| 480 px or less (pick **480**) | phone |

So a vertical screen is set up by picking the **narrow** width that matches the
design you built for it: **480 px** for a phone-style column, **782 px** for a
tablet-style one. The page is laid out at exactly that width and then fitted to
the panel as one unit — enlarged until it touches the screen, never stretched and
never distorted. If the design's proportions do not match the panel's, the
leftover space is left around the box (the same fit-to-screen behaviour as
everywhere else in this feature) — below the design, never above it — so a design
built tall arrives tall rather than distorted. When the page's width is one of your own sizes with a
**height**, that box is what is fitted — and a design taller than the box is fitted
by its own height, so the whole page stays on the screen instead of running off the
bottom of it. Build that narrow layout on the same page (in the editor: **Styles** →
the **Desktop / Tablet / Mobile** switcher), then open the display page on the
panel with the width chosen for it. Both screens then show their own layout, from
one page.

The screen report below prints the width actually in force, whichever level
chose it, so the choice can always be confirmed on the screen itself.

#### See what a screen actually reports

Open the display page on that screen with `?fiveprayer_tv_report` added to the
address:

```
http://192.168.1.104:10010/timetable/?fiveprayer_tv_report
```

A small black panel appears in the corner with the width and height the device
reports, the device pixel ratio and the canvas in use — the three numbers that
decide the breakpoint. Reload the address without the argument and the panel is
gone. It is never shown on a normal visit, it is read-only, and it changes
nothing about the page.

> A width *smaller* than the screen is legitimate, not a mistake: 1280 on a Full
> HD TV makes the TV fit that whole canvas to the screen, so the builder's
> smaller-desktop breakpoint is used. The page is still scaled to fit, exactly as
> described above.

### 4.3 Which screen it is built for — the **TV type**

Televisions do not all show the same picture. A **modern TV** or a computer
monitor shows everything the page draws. Many **older televisions crop** a few
percent off every edge — *overscan* — so the outer band of the picture never
reaches the viewer, and text close to the edge is cut. That happens in the
television itself, after the page has left the computer, so no CSS on the page
can see it.

The **TV type** row (Configure Settings → TV Display Mode) tells the site which
screen it is driving, and it changes two things at once:

| Choice | Finished display page | Safe-zone guide in the editor |
|--------|-----------------------|-------------------------------|
| **Modern TV / monitor** (default) | Uses the whole screen — exactly as before this setting existed. | Marks the whole canvas; no inner frame is drawn. |
| **Older TV (crops ~5%)** | The design is fitted inside the **safe area** — the middle 90% of the screen — so the television's cropping never removes any of it. | Draws the inner dashed frame on that same 5% band, so you can keep text and times inside it. |

Only one number is used (about **5%** per edge), because that is the usual
overscan and the broadcast safe-area convention. The scaling maths stay exactly
as described in §4 — only the box they contain the design in changes from the
whole viewport to the safe area:

```
safeWidth  = viewportWidth  × (1 − 2 × overscan)
safeHeight = viewportHeight × (1 − 2 × overscan)
scale      = min(safeWidth / contentWidth, safeHeight / frameHeight)
```

With **Modern TV** the safe area *is* the whole viewport, so the formula reduces
to the previous `min(viewportWidth / …, viewportHeight / …)` and nothing moves —
which is why it is the default.

| Item | Value |
|------|-------|
| Option (site-wide) | `fiveprayer_tv_display_tv_type` — `modern` (default) or `old` |
| Save action | `fp_save_tv_tv_type` (field `tv_type`, `manage_options` + the settings nonce) |
| Croppable band | 5% of each edge on `old`, 0 on `modern` |
| Editor guide | Uses the same number, so the frame and the screen always agree |

---

## 5. Turn TV Display Mode off

1. Open the page in the editor.
2. Untick **"Enable TV Mode"** in the **"TV Mode"** box.
3. Click **Update**.

The page immediately behaves like a normal website page again. The toggle only
ever affects that single page.

To remove the checkbox from every editor of one post type at once, turn
**Pages** or **Posts** off in **Customizing → Configure Settings → TV Display
Mode**. Nothing is deleted: the per-page ticks stay in the database, so
switching that switch back on restores exactly the display pages you had before.

---

## 6. What gets hidden on a TV page

Only the opted-in page is affected, and only "site chrome" — never the content
you designed.

**How it works.** The script walks up from your content wrapper to `<body>` and
hides every *sibling* of that chain. Anything that is neither the content, an
ancestor of it, nor a child of it is therefore removed — what is left on screen
is your page and the page background. No theme class names are needed, so this
works on any theme and any page builder.

On top of that, the stylesheet names the common containers so the same result
holds even with JavaScript unavailable:

| Hidden | Examples |
|--------|----------|
| Theme header / footer | `<header>` / `<footer>` at body level, `#header`, `#footer`, `#masthead`, `#colophon`, `.site-header`, `.site-footer`, `#main-header`, `#main-footer` |
| Theme-builder headers / footers | `.elementor-location-header` / `-footer` (Elementor Pro), `.et-l--header` / `.et-l--footer` (Divi), `.fl-theme-builder-header` / `-footer` (Beaver Themer), `.fusion-header-wrapper` / `.fusion-footer` (Avada) |
| Block (FSE) themes | `header.wp-block-template-part`, `footer.wp-block-template-part`, `.wp-site-blocks > header` / `> footer` — these sit **inside** the content wrapper, so they are named explicitly |
| Navigation and sidebars | `.site-navigation`, `.main-navigation`, `#secondary`, `.widget-area`, `#footer-widgets`, `.skip-link` |
| The automatic page title | `.entry-header`, `.entry-title`, `.page-header`, `.page-title`, `.wp-block-post-title` |
| WordPress admin bar | `#wpadminbar` |

> A heading you placed yourself in a builder (`.elementor-heading-title`,
> `.wp-block-heading`, …) is **not** touched — only the title your theme prints
> automatically is hidden. If you want that title back, add this to
> **Appearance → Customize → Additional CSS** (custom CSS prints after the
> plugin's stylesheet, so it wins):
>
> ```css
> body.fiveprayer-tv-active .entry-title { display: block !important; }
> ```

**To hide one more element**, add the class **`fiveprayer-tv-hide`** to it —
TV pages hide it automatically.

> Content you designed inside the page is **never** removed: nothing *inside*
the content wrapper is touched by the structural pass (a builder's own
`<header>` or `<footer>` inside the page stays). This keeps the feature safe on
top of Elementor, Divi, Beaver Builder, Bricks, Breakdance, Gutenberg and
classic themes.

> The browser's own title bar or tab is browser chrome, not part of the page.
> Launch the display in kiosk mode or with `--app=` (section 3) and it is gone
too.

---

## 7. Troubleshooting

### The page doesn't fill the screen / text is tiny
The scaler could not find the right content wrapper, so it fell back to
`<body>`. Tell it which wrapper to use with the filter below (add to your theme's
`functions.php` or a small custom plugin):

```php
add_filter( 'fiveprayer_tv_display_content_selectors', function ( $selectors ) {
    // Put the correct wrapper selector for your builder first.
    array_unshift( $selectors, '.my-builder-wrapper' );
    return $selectors;
} );
```

The default selector chain (in priority order) is:
`.elementor`, `#et-boc .et-l`, `#et-boc`, `.fl-builder-content`, `#brx-content`,
`.breakdance`, `.brz-root__container-page`, `.wp-site-blocks`, `.entry-content`,
`main`, `#content`, `#primary`.

Brizy is the one entry that needs a modifier: every Brizy root container (a page
canvas, a *story*, a block placed inside a normal page) carries
`brz-root__container`, and only the page canvas adds `-page` — so the chain names
`-page` and never mistakes a story or an embedded block for the display page.

The same chain picks the wrapper the editor canvas is locked to, so the box the
designer works against and the box on the screen are the same element.

### There is a band of empty space at the top of the page
The top of a display page is flushed automatically (section 4.1): the theme's top
margin on `main` and on the content wrapper is zeroed and the spacer blocks that
framed the theme's hidden page title are removed. If you still see a band, it is
one of these:

- **A spacer block (or a group with top padding) at the top of your own page
  content.** Open the page in the block editor and delete or shrink it — the
  plugin deliberately never touches spacing *inside* your content, so this one is
  yours.
- **The theme's title is still visible** (it should be hidden — see section 6),
  or another plugin added an announcement bar above the content. Give that
  element the class `fiveprayer-tv-hide`.
- **Another plugin's fixed overlay** sits at the top of the screen. Same fix:
  `fiveprayer-tv-hide`, or custom CSS.

Because the flush is applied to the top edge only, a design that is *meant* to be
inset from the top needs one line of custom CSS back on that page:
`body.fiveprayer-tv-active .fiveprayer-tv-trim { padding-top: 40px !important; }`

### There is still empty space, or big gaps around/in the page
- Space **around** the page (bands of the background colour) is the leftover of
  the fit-to-screen scale. The theme's own margins and paddings are removed
  (section 4.1), and so is the theme's cap on the design wrapper while Canvas
  Force is on (section 4) — so the width in the canvas is the width on the
  screen. On a page with a chosen size what is left is the difference between the
  **shape** of your canvas box and the shape of the screen: a 768 × 1024 box on a
  1366 × 768 laptop has room at the sides, because the design is fitted whole and
  never stretched or cropped. Vertically the box is anchored to the top of the
  screen, so **nothing is ever left above the design** — if you see a band at the
  top of the page it is inside your own content (see the previous item).
  The bands don't change when your content gets longer, because the box, not the
  content, is what is fitted, and a boxed width you set *inside* your design is
  kept on purpose so the design is not resized. On a page with no chosen size the
  engine fits the whole page instead, so nothing there is cut (and a page with a
  very large element inside is shown smaller to keep it all visible).
- Space **inside** the page is your own layout: block gaps, group padding,
  section padding and Gutenberg's content width. Change it in the builder or in
  the Site Editor, exactly as you would on a normal page.
- If you want to know which rule wins, open the TV page, right-click the gap and
  inspect it: a rule from this plugin's `tv-display.css` means theme spacing that
  escaped the cleaning pass — report the selector; anything else is theme or
  builder CSS.

### I can still see the header, the footer or the page title
TV Display Mode hides the whole chain of chrome around your content (see section
6). If something still shows, it is one of these:

- **It is inside your page content.** A builder's own header/footer section that
  you added to the page is part of your design, so it is deliberately kept.
  Delete it in the builder, or add the class `fiveprayer-tv-hide` to it.
- **Another plugin injected it after the page loaded** (a fixed overlay, a chat
  bubble, an announcement bar). It is not known when the page is rendered, so
  give it the class `fiveprayer-tv-hide`, or hide it with custom CSS:
  `body.fiveprayer-tv-active .that-thing { display: none !important; }`
- **It is the browser's own title bar or tab**, not the page. Use kiosk mode or
  `--app=` (section 3); a web page cannot remove browser chrome.
- **A cache is serving the previous stylesheet/script.** Both are versioned by
  file modification time, but a page cache or CDN can still hold the old copy —
  purge it for that page.

### My page builder's breakpoint is not being used on the TV
A smart-TV browser usually reports a much narrower viewport than the screen
(≈980 px, or ≈960 px on a 1080p screen with a 2× pixel ratio), so the builder
shows its tablet or mobile design even though the TV is Full HD. Set **Layout
width** to the width you designed for — **Full HD (1920 px)** for most
installations — in **Customizing → Configure Settings → TV Display Mode**
(section 4.2).

When the *same* page runs on screens of two different shapes, set the site-wide
width to the common case and override it where it differs: **Layout width** in
that page's **"TV Mode"** box for a page built for one kind of screen, or
`?fiveprayer_tv_width=480` in the address opened on that one device. A vertical
panel wants a narrow width (**480** for the phone layout, **782** for the tablet
layout), not the Full HD one (section 4.2).

On a computer or mini PC that drives the screen this is rarely needed: the
browser reports the real window width, so the desktop breakpoint already
applies. Not sure which number a screen is on? Open the display page on it with
`?fiveprayer_tv_report` and read the panel in the corner (section 4.2).

### The page looks different from the builder canvas
That should not happen: TV Display Mode measures the layout your builder
produced and applies a single uniform scale to it, so nothing inside the page
moves. If it does happen, the cause is one of these:

- **Another plugin or your child theme overrides the builder's CSS.** Check with
  the TV page open and those plugins disabled.
- **The screen is a different size than the canvas you designed on.** The page is
  scaled to fit, so text and images change size together — the arrangement of
  the page does not. To see the design at exactly 100%, open the page in a
  browser window as wide as the TV's resolution.
- **The builder's own responsive breakpoints kicked in.** Layouts are defined per
  breakpoint (desktop / tablet / mobile) by the *browser window* width, exactly
  as they are on an ordinary page. A window under the tablet breakpoint shows the
  tablet layout. This is the builder's behaviour, not TV Display Mode's — and if
  the screen is a TV whose browser reports a narrow viewport, "Layout width"
  (section 4.2) is the setting that tells it which design to use.

TV Display Mode itself adds nothing to the page except:
`fiveprayer-tv-active` on `<body>`, the `fiveprayer-tv-*` classes it needs on
`<html>` and on the one staged wrapper, and a `transform` on that wrapper.
Everything it touches can be inspected in the browser's element inspector.

### My theme header is still visible
Add the class `fiveprayer-tv-hide` to that header element (Builder → element →
CSS classes), or hide it with custom CSS:

```css
body.fiveprayer-tv-active .my-custom-header { display: none !important; }
```

### There is a sliver of scroll / a gap at the top
Make sure no other plugin adds a fixed offset. The plugin already neutralises the
admin-bar offset with:

```css
html.fiveprayer-tv-scroll-lock { margin-top: 0 !important; }
```

### The setting panel doesn't appear
Two conditions: the **Pages** (or **Posts**) switch must be on in
**Customizing → Configure Settings → TV Display Mode**, and you must be editing
a **Page** or a **Post**. Custom post types are left out by design, so the panel
never appears there.

### Changes don't show after editing the CSS
The TV stylesheet and script are versioned by file modification time, so a hard
refresh (Ctrl+F5) is usually enough. If your site uses an aggressive page cache
or CDN, purge it for the page.

---

## 8. Developer reference

### Post meta

| Key | Type | Values |
|-----|------|--------|
| `_fiveprayer_tv_mode` | string | `'1'` enabled, `'0'` disabled |

### Body class

```
fiveprayer-tv-active
```

### Classes added at runtime by the script

| Class | Added to | Meaning |
|-------|----------|---------|
| `fiveprayer-tv-js` | `<html>` | The engine will run. Added *before the first paint*, and it is what holds the canvas invisible until then. |
| `fiveprayer-tv-ready` | `<html>` | The canvas has been measured and positioned and may be shown. |
| `fiveprayer-tv-scroll-lock` | `<html>` | The viewport is locked to the screen (no scrollbars). Also the only place the black signage background is set. |
| `fiveprayer-tv-stage` | the content wrapper | The single wrapper that carries the transform. Its inline `width` is the width the page already had. |
| `fiveprayer-tv-clean` | the content wrapper **and every ancestor up to `<body>`** | Zeroes margin, padding and border on the theme's own wrappers. Never anything inside the content. |
| `fiveprayer-tv-trim` | the content wrapper **and every wrapper above it, up to the stage** | Zeroes the **top** edge only (top margin, top padding, top border), so the canvas starts at your content instead of at the theme's title area. |
| `fiveprayer-tv-trim-hide` | leading boxes above the content that hold no visible text and paint nothing | The hidden page title's spacer blocks and wrapper group, i.e. the empty band they left behind. Never anything inside the content. |
| `fiveprayer-tv-report` | its own `<div>`, added as a child of `<html>` | The opt-in screen report (`?fiveprayer_tv_report` only). Outside the page's own tree, so the chrome walk, the cleaning pass and the scaling stage never see it. |

### Asset handles

| Handle | Type | Loaded |
|--------|------|--------|
| `fiveprayer-tv-display` | style | Only on the opted-in page |
| `fiveprayer-tv-display` | script | Only on the opted-in page |

The script receives a localized object `fiveprayerTV`:

```js
window.fiveprayerTV = {
  baselineWidth: 1920,
  baselineHeight: 1080,
  contentSelectors: [ /* ... */ ],
  canvasWidth: 0,        // the Layout width option; 0 = Auto
  canvasHeight: 0,       // the height that width carries; 0 = not chosen
  report: false,         // true only with ?fiveprayer_tv_report
  reportLabel: 'TV screen report'
};
```

The breakpoint itself is settled before the page is parsed, by the viewport tag
PHP writes (see below — the engine cannot influence a media query), and
`canvasWidth` is also what the screen report prints. `canvasHeight` is the
**design frame** used for the scale (§4): it is only applied while it is set, so
an unconfigured site (Auto width, height `0`) keeps the measure-only behaviour.

Both are resolved through the same precedence — the address's own argument, then
the page's own width, then the site-wide setting — so the screen, the editor lock
and the safe-zone guide always describe the same box.

Note that `wp_localize_script` serialises booleans and numbers as **strings**, so
in the real page this object looks like `canvasWidth: "1920"` and
`report: "1"` (or `""`). The engine reads both with truthiness and `Number()`, so
neither shape is a special case.

`baselineWidth` / `baselineHeight` are only the **fallback** design box, used
when the content wrapper cannot be measured at all (for example because it is
hidden). They never override a size the page itself has — the stage is sized to
the page's own measured width.

The live numbers are exposed on the staged element: `--fiveprayer-tv-scale`
(the current scale factor), `--fiveprayer-tv-design-width` and
`--fiveprayer-tv-design-height` (the design frame the scale was calculated
from).

### Layout width (breakpoints)

| Item | Value |
|------|-------|
| Option (site-wide) | `fiveprayer_tv_display_canvas_width` (`0` = Auto, else 320–7680 px, clamped) |
| Ajax action (site-wide) | `fp_save_tv_canvas_width` (field `width`, `manage_options` + the settings nonce) |
| Page override (meta) | `_fiveprayer_tv_canvas_width` on one page: missing = site setting, `0` = Auto for that page, else 320–7680 px. Saved with the **"TV Mode"** box (field `fiveprayer_tv_mode_width`, the same nonce, `edit_post` on that page); a width the page already holds that is not in the list is offered as an extra option, so an unchanged box saves the same value back |
| Device override (address) | `?fiveprayer_tv_width=<n>` — or `auto` / `0` / `device` for "the screen decides". Unparsable values are ignored, out-of-range values are clamped |
| Precedence | address → page → site setting, resolved once per request by `get_effective_canvas_width()` (so the buffered page cannot change layout halfway through) |
| Viewport tag written | `<meta name="viewport" content="width=<n>" />` — exactly one, inserted right after `<head>`; every other viewport tag in the head is removed |
| Screen report | `?fiveprayer_tv_report` on the display page (read-only; adds the badge and nothing else) and shows the width actually in force |
| Default | `0` (Auto) — the document is not buffered and no tag is touched |
| Published widths | 3840, 2560, 1920 (recommended), 1600, 1366, 1280, then **782** (tablet / vertical) and **480** (phone / vertical) |
| Named sizes (site-defined) | Option `fiveprayer_tv_display_canvas_presets` — up to 12 pairs `{ value: int 320–7680, label: string ≤ 40 chars }`, in saved order. A name replaces the built-in label for the same width; the ladder keeps its order and `Auto` stays first |
| Named sizes save action | `fp_save_tv_canvas_presets` (fields `names[]` and `widths[]`, parallel lists in row order; `manage_options` + the settings nonce) |
| Lists a width picker offers | `get_all_canvas_presets()` — the built-in ladder plus the site's named sizes; `get_canvas_presets()` still returns the ladder alone |

Why the tag and not the engine: CSS media queries measure the browser's **layout
viewport**, which only the viewport tag can set. The engine's `transform:
scale()` happens after that and never changes it. With `width=<n>` and no
`initial-scale`, the browser sizes the layout viewport to `n` and fits it to the
screen itself, so `window.innerWidth` is `n` while the whole canvas stays
visible — which is why the scaling maths above needs no special case.

### Filters

| Filter | Purpose |
|--------|---------|
| `fiveprayer_tv_display_content_selectors` | Override/insert the content-wrapper selectors used by the scaling engine. |
| `fiveprayer_tv_display_design_query_args` | Add the query argument your page builder uses for its editing canvas (see below). |
| `fiveprayer_tv_display_frames_are_editors` | Whether a request inside a frame is treated as a builder's canvas (default `true`). Return `false` to let a framed page — a signage player that embeds the display page, for example — receive the TV treatment. |

### Public JavaScript API

```js
// Force a recalculation on demand (e.g. after injecting content).
window.FivePrayerTV.refresh();
```

### Isolation guarantees (why this is safe)

- The meta box is registered only for the `page` and `post` post types, and only
  while that post type's own switch (`fiveprayer_tv_display_mode_page` or
  `fiveprayer_tv_display_mode_post`) is on.
- The body class, stylesheet and script are emitted **only** when the viewed
  page's meta equals `'1'` *and* the switch for that post type is on.
- The TV stylesheet and script are deliberately **excluded from the plugin's
  combined CSS/JS bundles** so the chrome-stripping rules can never leak onto
  other pages. They load as standalone, conditionally-enqueued assets.
- The stylesheet hides chrome, locks the viewport and positions the stage — it
  never sizes, spaces or paints the page's content, so the layout a theme or
  page builder produced is carried to the screen unchanged. The script freezes
  the stage to the width it just measured (never to a width of its own), so
  making the page fit cannot move anything inside it.
- The top flush (section 4.1) has the same boundary: it zeroes the **top** edge of
  the wrappers above the content only, and hides leading boxes that hold no
  visible text and paint nothing. It never looks inside the content wrapper, so
  no block spacer, group padding or block gap you placed is ever changed or
  hidden. With no content wrapper inside the stage (a builder canvas, or a theme
  whose content wrapper *is* the stage) the pass does nothing at all.
- The **Layout width** setting touches only the document's `<head>`, and only on
  the opted-in page, and only while a width is chosen: one viewport tag in, the
  theme's own tag out. It never buffers or rewrites anything for **Auto**, and a
  fragment without `</head>` is returned byte for byte unchanged. It cannot
  resize or restyle page content, because a viewport tag describes the viewport,
  not the layout.
- All saves are nonce-verified: the per-page toggle behind
  `current_user_can('edit_post')` (i.e. `edit_page` for pages, `edit_post` for
  posts) and each switch behind `current_user_can('manage_options')`. A switch
  save must also name its post type (`scope`), so a malformed request is
  rejected instead of flipping the wrong switch.
- The two switches and the ajax endpoint are all `FivePrayer\\Core\\Admin\\TVDisplayMode`
  (`ajaxAction: fp_save_tv_display_mode`).
- The Pages and Posts switches default to **off**: an install where neither
  option was ever saved shows the box in no editor until someone turns a switch
  on. A site that had saved the legacy single switch (`fiveprayer_tv_display_mode`)
  keeps that answer instead, so upgrading never flips a live site.
- The **Canvas Force** and **Safe Zone Guide** switches
  (`fiveprayer_tv_canvas_force`, `fiveprayer_tv_safe_zone_guide`) both default to
  **off**. They are enqueued **only in the editor** (the Block Editor and a
  builder's design-time request) and never on the finished display page, so the
  served signage is untouched by design. While neither is on, nothing of
  `TvCanvasLocker` is enqueued anywhere.
- The **Share on Local Network** switch (`fiveprayer_local_testing_mode`) also
  defaults to **off**, and while it is off
  `FivePrayer\Core\LocalNetworkRouter` rewrites nothing: the site is only
  reachable from the computer that runs it.
- Turning a switch off never deletes a per-page tick.

---

## 9. Quick checklist

- [ ] Check **TV Display Mode** is on in **Configure Settings → Feature Switches**.
- [ ] Check the **Pages** switch is on in **Configure Settings → TV Display Mode**.
- [ ] Switching on a TV or phone on the same Wi-Fi? Turn on **TV / Phone
      Display** on the same page first — it is off by default.
- [ ] Open the page (or post) → **TV Mode** box → tick **Enable TV Mode** → Update.
- [ ] Visit the page and confirm no scrollbars + header/footer hidden.
- [ ] Open it on the TV in kiosk/full-screen mode.
- [ ] Is the TV a smart TV whose browser reports a narrow width (so the
      tablet/mobile design appears)? Set **Layout width** to **Full HD
      (1920 px)** on the TV Display Mode settings page (section 4.2).
- [ ] Untick the box to revert the page to normal whenever needed.

---

## 10. Mosque deployment: one screen, many mosques

The usual real-world setup is a masjid running the timetable on a screen in the
prayer hall, with each mosque owning a **separate website**.

- The display is just a page on that mosque's site with TV Display Mode on. The
  screen (TV, monitor or Android box) opens it full-screen / kiosk.
- Each site keeps its **own location** (city / latitude-longitude / timezone),
  its own address and its own language.
- What can be copied between mosques is the **configuration**, using
  **FivePrayer → Settings → Data Management**:

| Buttons | File | Contains |
| --- | --- | --- |
| Export / Import Settings | `fiveprayer-settings-YYYY-MM-DD.json` | Asr calculation rule, calculation method, midnight mode, higher-latitude method |
| Export / Import Translations | `fiveprayer-translations-YYYYmmdd-HHMMSS.json` | Prayer names, Gregorian + Hijri months/numbers, timetable labels, vertical daily prayer labels, extra info |

Deliberately **not** copied:

- the mosque's **location** — so prayer times stay correct for each masjid;
- the **active language** and the **Hijri locale** — the translation import
  skips the `activeLanguage` and `hijralocale` keys, so importing a file can
  never change the language a mosque chose for its own site.

An import **merges** with the existing data; nothing is deleted.

### Run the display on a local server, not the live website

Put TV Display Mode on a computer or small box that runs the site on the
mosque's **own network**, not on the public website. A screen in the prayer hall
only needs to reach the site locally, and a display page on the live site would
be public: anyone could open it, copy it or probe it, and every extra public
page is one more thing to keep patched.

Nothing is lost by doing this — the timetable is identical on both machines
because the configuration travels as a file:

1. On the live site, use **FivePrayer → Settings → Data Management** to
   **Export Settings** and **Export Translations**.
2. On the local machine, **Import** both files.
3. Set that mosque's own location on the local machine.

The live site is never changed, and no visitor ever sees the display page.

On the TV, open the local server by its network address — for example
`http://192.168.1.104:10010/timetable/`. That address is only an example: only
the IP changes from computer to computer. Find yours with:

```bash
# Windows (Command Prompt or PowerShell)
ipconfig

# macOS
ipconfig getifaddr en0

# Linux
hostname -I
```

Never type `localhost` on the TV (it means the TV itself), and do not use the
mosque's public web address for the display.

### Why sharing the file is safe

- All four handlers require the `manage_options` capability **and** a valid
  nonce, and uploads are checked with `is_uploaded_file()` and parsed as JSON,
  so a visitor or subscriber can neither export nor push data into the site.
- The files hold **configuration only** — no passwords, API keys, administrator
  accounts or visitor data.
- The location is excluded, so a shared file does not reveal a mosque's address.
- Importing cannot overwrite another mosque's identity: the language and Hijri
  locale keys are skipped and settings are merged, not replaced.

### Suggested workflow

1. Configure one mosque's site exactly the way you want it.
2. Export both files once and keep them with the mosque onboarding notes.
3. On every other site: import both files, then set only that mosque's own
   location and language.

### Sharing the display on the network

Turn on the third switch of this page — **Share on Local Network** — and leave it on:
that is what serves the display to the TV, phone or tablet on the mosque's
own network. It is **off by default**, and while it is off the site still builds
every link for `localhost`, so the display opens only on the computer that runs
it. Full walkthrough: [Share on Local Network](LOCAL_NETWORK_TESTING.md).
On the TV, tablet or phone, open the display with the computer's network address
(for example `http://192.168.1.104:10010/timetable/`), never `localhost`:
`localhost` on the TV means the TV itself, so the page, its colours and TV
Display Mode all fail.
It is intentionally inert on a public domain, so it can be left on. While it is
on, the site is reachable by other devices on that network — that is the whole
point — so run it on a network you trust (the mosque's own network).

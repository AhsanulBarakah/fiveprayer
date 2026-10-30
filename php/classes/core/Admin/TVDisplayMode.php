<?php

namespace FivePrayer\Core\Admin;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\PathService;
use FivePrayer\Core\Security\SecurityHelper;

/**
 * TV Display Mode.
 *
 * Turns a standard WordPress page or post into a full-screen digital signage
 * display for a mosque. Three layers of switches control it:
 *
 * 0. The **TV Display Mode** master switch in the Feature Switches panel
 *    (Configure Settings → Feature Switches, `feature_toggles` key
 *    {@see self::FEATURE_KEY}). While it is off, nothing of this feature is
 *    offered anywhere: no meta box, and the TV Display Mode page disappears
 *    from the Categories list. Turning it off also resets the switches below.
 * 1. One site-wide switch per post type, on the "TV Display Mode" page of
 *    FivePrayer → Customizing → Configure Settings (options
 *    {@see self::OPTION_NAMES}): Pages and Posts are enabled separately, so a
 *    site can offer the checkbox on pages only, posts only, both or neither.
 *    The third switch on that page is the TV / Phone network switch
 *    ({@see \FivePrayer\Core\Admin\LocalTestingMode}).
 * 2. The per-content toggle in the "TV Mode" meta box ({@see
 *    self::META_KEY}), which opts one page or post in. Only when the switch for
 *    that post type and this meta are both on does anything change on the front
 *    end.
 *
 * Isolation guarantees:
 * - Both layers default to off/opt-in: a post type only ever sees the meta box
 *   while its own switch is on, and only the meta box touches content.
 * - The body class, stylesheet and script are only emitted when the viewed
 *   page's {@see self::META_KEY} meta is exactly '1' and the switch for that
 *   post type is on.
 * - No theme, builder or plugin output is removed from the database; theme
 *   chrome is only hidden visually on the opted-in page.
 * - The layout produced by the theme or the page builder is never rewritten.
 *   The stylesheet only hides chrome, zeroes the theme's own wrapper spacing,
 *   locks the viewport and positions the stage, and the script only measures
 *   that layout and scales it uniformly. Widths, backgrounds, colours and
 *   container boxes stay exactly as designed, so the screen shows what the
 *   builder's canvas showed. The stage width the script freezes is the width it
 *   just measured, never a size of this plugin's choosing.
 * - Only two things are normalised, and both stop at the content wrapper: the
 *   chrome around the content is hidden, and margin/padding/border on the
 *   wrappers *around* the content (never inside it) are zeroed. Everything the
 *   page builder or the block editor created keeps its own spacing, and no rule
 *   in this feature ever sets width, max-width or display on content.
 * - Turning a switch off never deletes a per-page tick: switching it back on
 *   restores exactly the pages that were display screens before.
 *
 * Breakpoints (the "Layout width" setting):
 * - A page builder's responsive design is chosen by **CSS media queries**, and a
 *   media query measures the *browser's* viewport — which this feature's
 *   `transform: scale()` deliberately never changes. On a computer or a mini PC
 *   that is exactly what a designer wants (a 1920 px screen gets the desktop
 *   design), but a smart-TV browser commonly reports a much narrower viewport
 *   (≈980 px, or 960 px on a 1080p screen with a 2× device pixel ratio), so the
 *   builder shows its phone/tablet layout on the screen and the desktop
 *   breakpoint appears to "not work".
 * - The **Layout width** setting (`{@see self::CANVAS_OPTION}`) fixes that at the
 *   only place it can be fixed: the `<meta name="viewport">` tag, which decides
 *   the layout viewport every media query is measured against. When a width is
 *   chosen, this class emits exactly one viewport meta for the opted-in page
 *   (`width=<canvas>`), replacing whatever the theme printed, and the TV browser
 *   fits that canvas to the screen itself — so the builder is always in the
 *   breakpoint the user picked, on any TV browser.
 * - With the default, **Auto** (0), no tag is touched and no buffer is opened:
 *   the device's own viewport decides, which is the previous behaviour.
 * - The tag only ever describes the *viewport*; it cannot resize, re-space or
 *   restyle a single element inside the page. The scaling engine keeps working
 *   unchanged, because the layout viewport and the reported window size stay in
 *   agreement with each other whatever the tag says.
 * - The sizes offered in every width list are not fixed: the site can keep its
 *   own **named sizes** (`{@see self::PRESETS_OPTION}`, e.g. “Hall TV — 1920”)
 *   beside the built-in ladder, and those names then appear in the settings row
 *   *and* in every content editor's TV Mode box. A stored width used through the
 *   address argument is still a plain number, so a named size is a label for a
 *   width, never a new kind of value.
 * - The width is chosen at three levels so that one page serves screens of
 *   different shapes without being duplicated: the request's own argument
 *   (`{@see self::CANVAS_QUERY_ARG}`, e.g. `?fiveprayer_tv_width=480`) wins, then
 *   the page's own width (`{@see self::META_CANVAS_KEY}`, chosen in the content's
 *   own TV Mode box), then the site-wide setting. A landscape TV in the hall and
 *   a vertical panel by the door can therefore open the *same* page, each in the
 *   layout it was designed for — the device's address carries the choice, so
 *   nothing is stored per screen and nothing is duplicated.
 *
 * @since 3.0.0
 * @package FivePrayer\Core\Admin
 */
class TVDisplayMode
{
    /**
     * Post meta key holding the on/off state ('1' = enabled, '0' = disabled).
     *
     * @var string
     */
    public const META_KEY = '_fiveprayer_tv_mode';

    /**
     * Feature Switches key of the master on/off switch for this whole feature.
     *
     * Stored inside the `feature_toggles` settings row, which is what the
     * Feature Switches panel of Configure Settings writes.
     *
     * @var string
     */
    public const FEATURE_KEY = 'TV_Display_Mode';

    /**
     * Nonce action used when saving the meta box.
     *
     * @var string
     */
    public const NONCE_ACTION = 'fiveprayer_tv_mode_save';

    /**
     * Nonce field name rendered in the meta box.
     *
     * @var string
     */
    public const NONCE_NAME = 'fiveprayer_tv_mode_nonce';

    /**
     * Checkbox field name submitted with the meta box.
     *
     * @var string
     */
    public const FIELD_NAME = 'fiveprayer_tv_mode';

    /**
     * Body class added on the front end when TV mode is enabled.
     *
     * @var string
     */
    public const BODY_CLASS = 'fiveprayer-tv-active';

    /**
     * Design baseline width in pixels. This maps to a 100% scale.
     *
     * @var int
     */
    public const BASELINE_WIDTH = 1920;

    /**
     * Design baseline height in pixels. This maps to a 100% scale.
     *
     * @var int
     */
    public const BASELINE_HEIGHT = 1080;

    /**
     * Option holding the layout width the page builder's breakpoints are
     * evaluated against on a TV page.
     *
     * `0` means **Auto**: the document is left exactly as the theme printed it
     * and the TV's own viewport decides which breakpoint applies. Any other
     * value is a width in pixels that is written into a `<meta name="viewport">`
     * tag on the opted-in page only, so the page builder is always in the
     * breakpoint the user picked — whatever the TV browser would have reported.
     *
     * @var string
     */
    public const CANVAS_OPTION = 'fiveprayer_tv_display_canvas_width';

    /**
     * Smallest layout width the setting accepts, in pixels.
     *
     * Below this a "TV page" could not hold a prayer timetable, so a smaller
     * value is read as a typo and clamped rather than honoured.
     *
     * @var int
     */
    public const CANVAS_MIN = 320;

    /**
     * Largest layout width the setting accepts, in pixels (8K).
     *
     * @var int
     */
    public const CANVAS_MAX = 7680;

    /**
     * Option holding the kind of screen the display is built for.
     *
     * Televisions differ in how much of the picture they show: a modern TV or a
     * computer monitor shows everything, while an older television **crops** a
     * few percent off every edge (overscan) — so a design that fills the screen
     * loses its outer band, and text close to the edge is cut. This option lets
     * the user say which they have, and it drives two things: the overscan margin
     * the editor's safe-zone guide draws, and whether the finished display page
     * is fitted inside the safe area ({@see self::get_overscan_percent()}).
     *
     * @var string
     */
    public const TV_TYPE_OPTION = 'fiveprayer_tv_display_tv_type';

    /**
     * {@see self::TV_TYPE_OPTION} value: a modern TV / monitor (no cropping).
     *
     * @var string
     */
    public const TV_TYPE_MODERN = 'modern';

    /**
     * {@see self::TV_TYPE_OPTION} value: an older TV that crops the edges.
     *
     * @var string
     */
    public const TV_TYPE_OLD = 'old';

    /**
     * Percent of each edge an older TV is assumed to crop.
     *
     * Real overscan is usually "about 5%", which is also the broadcast safe-area
     * convention (90% of the picture is considered safe). Only ever applied while
     * {@see self::TV_TYPE_OLD} is chosen.
     *
     * @var float
     */
    public const OLD_TV_OVERSCAN_PERCENT = 5.0;

    /**
     * `wp_ajax_*` action used to persist the screen type.
     *
     * @var string
     */
    public const AJAX_TV_TYPE_ACTION = 'fp_save_tv_tv_type';

    /**
     * Post meta key holding one display page's *own* layout width.
     *
     * Values: missing (or empty) means "use the site-wide setting"; `0` means
     * Auto for this page, i.e. leave its viewport alone even when the site-wide
     * setting pins one; any other number is that width in pixels.
     *
     * This is what makes the setting per content instead of site-wide: a page
     * built for a vertical panel can ask for a narrow width while every other
     * display page keeps the wide one.
     *
     * @var string
     */
    public const META_CANVAS_KEY = '_fiveprayer_tv_canvas_width';

    /**
     * Request argument that pins the layout width for the device it is opened on.
     *
     * The same display page often has to run on two screens of different shapes
     * at once — a landscape TV in the prayer hall and a vertical panel (or a
     * phone in a corridor) — and every one of them gets the layout it was
     * designed for by adding this argument to the address used on that device,
     * e.g. `?fiveprayer_tv_width=480`. `auto` (or `0`) means "use the width this
     * screen reports", which is also the way to preview a narrow layout in a
     * desktop browser.
     *
     * Read-only, sanitised and clamped like every other width, and it only ever
     * has an effect on a page that already has TV Display Mode ticked.
     *
     * @var string
     */
    public const CANVAS_QUERY_ARG = 'fiveprayer_tv_width';

    /**
     * Meta box field holding the page's own width choice; empty means "site
     * setting".
     *
     * @var string
     */
    public const WIDTH_FIELD_NAME = 'fiveprayer_tv_mode_width';

    /**
     * Option holding the site's own named sizes, shown in every width list.
     *
     * A list of pairs — `label` (what the user called the size, e.g. “Hall TV”)
     * and `value` (its width in pixels) — in the order the user arranged them, so
     * the lists read the way the site's own screens are described rather than the
     * way a fixed ladder happens to be sorted.
     *
     * @var string
     */
    public const PRESETS_OPTION = 'fiveprayer_tv_display_canvas_presets';

    /**
     * `wp_ajax_*` action used to persist the named sizes.
     *
     * @var string
     */
    public const AJAX_PRESETS_ACTION = 'fp_save_tv_canvas_presets';

    /**
     * Most named sizes one site may keep.
     *
     * A ceiling rather than a design decision: a select has to stay readable, and
     * a signage install needs a handful of screen sizes at most. Further rows are
     * ignored, and the saved list is always what the screen shows.
     *
     * @var int
     */
    public const MAX_CUSTOM_PRESETS = 12;

    /**
     * Longest name a user-defined size may carry.
     *
     * Long enough for “Hall TV (portrait)” and short enough for a select in a
     * narrow editor sidebar.
     *
     * @var int
     */
    public const PRESET_LABEL_MAX = 40;

    /**
     * `wp_ajax_*` action used to persist the layout width.
     *
     * @var string
     */
    public const AJAX_CANVAS_ACTION = 'fp_save_tv_canvas_width';

    /**
     * Request argument that turns on the on-screen screen report.
     *
     * Presence of `?fiveprayer_tv_report` on the display page makes the engine
     * print the numbers that decide which breakpoint is active (viewport,
     * device pixel ratio and the chosen canvas) in the corner of the screen, so
     * the setting can be chosen by looking at the TV itself. It is read-only and
     * adds nothing to the page otherwise.
     *
     * @var string
     */
    public const REPORT_QUERY_ARG = 'fiveprayer_tv_report';

    /**
     * Post types that can carry the meta box at all.
     *
     * Pages and posts are both supported, so any single piece of content can be
     * turned into a display screen — each behind its own switch in the settings
     * page. Custom post types stay out on purpose: most of them are not designed
     * to be shown full screen.
     *
     * @var string[]
     */
    public const POST_TYPES = ['page', 'post'];

    /**
     * Request arguments that mean "a page builder is drawing its editing
     * canvas".
     *
     * Every visual builder opens the real front-end URL inside its editor, so
     * `is_admin()` is false there and the TV treatment would otherwise apply
     * while the user is still designing: the theme header/footer would vanish
     * and the canvas would be scaled to a fixed 100vw × 100vh stage. These
     * arguments identify that request, so design-time always looks like a
     * normal page.
     *
     * Presence of the argument is enough — builders pass values as varied as
     * `?fl_builder` (empty), `?bricks=run`, `?et_fb=1`,
     * `?builderius_inner_preview=1&entity_id=…` or Brizy's
     * `?is-editor-iframe=<time>` (which it also sets when the canvas is loaded
     * outside a frame, so the frame rule below is not the only guard).
     *
     * Every one of these arguments names the *canvas* of a builder, so a
     * request carrying one is always a design-time page and never the finished
     * signage screen — which is what the Canvas Force / Safe Zone Guide need in
     * order to load inside that canvas (see {@see TvCanvasLocker}).
     *
     * WordPress' own `?preview=true` is deliberately NOT in this list: preview
     * is how a user checks the finished signage page, so it keeps the TV
     * treatment. Filter `fiveprayer_tv_display_design_query_args` to add your
     * builder.
     *
     * @var string[]
     */
    private const DESIGN_MODE_QUERY_ARGS = [
        'elementor-preview',             // Elementor editor canvas.
        'elementor-preview-editor',      // Elementor (older editors).
        'fl_builder',                    // Beaver Builder.
        'et_fb',                         // Divi Visual Builder.
        'et_pb_preview',                 // Divi layout preview.
        'bricks',                        // Bricks builder (?bricks=run).
        'builderius_inner_preview',      // Builderius canvas (?builderius_inner_preview=1&entity_id=…).
        'ct_builder',                    // Oxygen.
        'oxygen_iframe',                 // Oxygen canvas iframe.
        'vc_editable',                   // WPBakery front-end editor.
        'breakdance',                    // Breakdance.
        'is-editor-iframe',              // Brizy canvas (its editor loads the page in an iframe with this argument).
        'tve',                           // Thrive Architect.
        'bt_bb_builder',                 // Bold Builder.
        'siteorigin_panels_live_editor', // SiteOrigin live editor.
        'customize_changeset_uuid',      // Core customizer preview.
    ];

    /**
     * One option per post type, each holding that type's on/off state.
     *
     * Pages and posts are switched on and off independently, so a site that
     * only ever builds display *pages* can leave the post editor completely
     * untouched (and the other way round).
     *
     * Defaults to OFF when never saved, so the box never appears in an editor
     * until someone deliberately switches it on for that post type. An install
     * that had saved the legacy single switch keeps its answer instead (see
     * {@see self::is_enabled_for()}), so upgrading never flips a live site.
     *
     * @var array<string, string>
     */
    public const OPTION_NAMES = [
        'page' => 'fiveprayer_tv_display_mode_page',
        'post' => 'fiveprayer_tv_display_mode_post',
    ];

    /**
     * Legacy single switch, kept only to migrate installs that saved it before
     * Pages and Posts were split apart. Never written any more.
     *
     * @var string
     */
    public const OPTION_NAME = 'fiveprayer_tv_display_mode';

    /**
     * Ajax request field naming the post type a switch belongs to.
     *
     * @var string
     */
    public const AJAX_SCOPE_FIELD = 'scope';

    /**
     * Nonce action used when saving a switch.
     *
     * @var string
     */
    public const NONCE_ACTION_SETTING = 'fiveprayer_tv_display_mode_save';

    /**
     * Ajax request field carrying the switch nonce.
     *
     * @var string
     */
    public const AJAX_NONCE_NAME = 'nonce';

    /**
     * `wp_ajax_*` action used to persist a switch.
     *
     * @var string
     */
    public const AJAX_ACTION = 'fp_save_tv_display_mode';

    /**
     * Shortcut to the settings screen that hosts the switches.
     *
     * @var string
     */
    public const SETTINGS_HASH = '/customizing/settings';

    /**
     * Relative path of the front-end stylesheet.
     *
     * @var string
     */
    private const STYLE_REL_PATH = 'php/classes/core/Assets/CSS/tv-display.css';

    /**
     * Relative path of the front-end script.
     *
     * @var string
     */
    private const SCRIPT_REL_PATH = 'php/classes/core/Assets/JS/tv-display.js';

    /**
     * Path service used to resolve plugin file paths and URLs.
     *
     * @var PathService
     */
    private PathService $paths;

    /**
     * Layout width resolved for the request being buffered.
     *
     * Resolved once in {@see self::start_viewport_filter()} and read by the
     * buffer callback, which runs after the template has rendered and must not
     * re-resolve against query state that could have moved on. `null` means the
     * callback should resolve it itself (the tag printed in `wp_head` does not go
     * through the buffer).
     *
     * @var int|null
     */
    private ?int $viewport_width = null;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->paths = new PathService();
    }

    /**
     * Register every WordPress hook owned by this feature.
     *
     * @return void
     */
    public function register(): void
    {
        add_action('add_meta_boxes', [$this, 'register_meta_box']);
        add_action('save_post', [$this, 'save_meta_box'], 10, 2);
        add_filter('body_class', [$this, 'filter_body_class']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('wp_ajax_' . self::AJAX_ACTION, [$this, 'handle_ajax_save']);
        add_action('wp_ajax_' . self::AJAX_CANVAS_ACTION, [$this, 'handle_ajax_save_canvas']);
        add_action('wp_ajax_' . self::AJAX_PRESETS_ACTION, [$this, 'handle_ajax_save_presets']);
        add_action('wp_ajax_' . self::AJAX_TV_TYPE_ACTION, [$this, 'handle_ajax_save_tv_type']);

        // Layout width (breakpoints). Very early in `wp_head`, so the tag is
        // present even if nothing below can buffer the template; the buffer
        // opened on `template_redirect` then deletes every other viewport tag on
        // the page and keeps exactly one, so a theme's own `device-width` tag can
        // never win the race.
        add_action('wp_head', [$this, 'render_viewport_meta'], 1);
        add_action('template_redirect', [$this, 'start_viewport_filter'], 99);
    }

    /**
     * Human labels for each switchable post type.
     *
     * @return array<string, string>
     */
    public static function get_post_type_labels(): array
    {
        return [
            'page' => __('Pages', 'fiveprayer'),
            'post' => __('Posts', 'fiveprayer'),
        ];
    }

    /**
     * Whether the feature is switched on for one post type.
     *
     * Read directly from the option on every call (never cached in a static),
     * because `handle_ajax_save()` flips it inside the same request that the
     * editor meta box already ran in.
     *
     * @param string $post_type Post type to test, e.g. `page` or `post`.
     * @return bool True when that post type's switch is on.
     */
    public static function is_enabled_for(string $post_type): bool
    {
        if (!isset(self::OPTION_NAMES[$post_type])) {
            return false;
        }

        $option = self::OPTION_NAMES[$post_type];
        $stored = get_option($option, null);

        if (null === $stored) {
            // Never saved on this install. Fall back to the legacy single
            // switch so an upgraded site that had explicitly saved it keeps
            // its display pages exactly as they were before Pages and Posts
            // were split apart. Fresh installs have never saved it either, so
            // they get the default: OFF.
            return 0 !== (int) get_option(self::OPTION_NAME, 0);
        }

        return 0 !== (int) $stored;
    }

    /**
     * Whether the "TV Display Mode" master switch is on in Feature Switches.
     *
     * The key is deliberately read as **"missing means OFF"**: this is a beta
     * feature, so it is opt-in. A fresh install, and any install whose stored
     * `feature_toggles` map predates the key, both start with the feature
     * completely off — no meta box in any editor, no TV Display Mode page in the
     * Categories list and no scaling on the front end. Only an explicit `true`
     * (what the Feature Switches panel writes when the user turns it on) enables
     * it. This matches the admin bundle's factory default in
     * `DEFAULT_FEATURE_TOGGLES` and the stored default in
     * FivePrayer_DatabaseMetaSettings.
     *
     * @return bool True while the feature is allowed to be used.
     */
    public static function is_feature_enabled(): bool
    {
        $raw     = PrayerDataCache::getSingleMetaValue('feature_toggles');
        $toggles = json_decode((string) $raw, true);

        if (!is_array($toggles) || !array_key_exists(self::FEATURE_KEY, $toggles)) {
            return false;
        }

        // Anything other than a clear "on" counts as off, so a stray `0` or
        // `"0"` written by an older build cannot leave the feature half-on.
        $value = $toggles[self::FEATURE_KEY];

        return true === $value || 1 === $value || '1' === $value || 'true' === $value;
    }

    /**
     * Whether any post type has the feature switched on.
     *
     * @return bool True when at least one switch is on.
     */
    public static function is_enabled(): bool
    {
        foreach (array_keys(self::OPTION_NAMES) as $post_type) {
            if (self::is_enabled_for($post_type)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Map of post type => switch state, in the order the switches are shown.
     *
     * @return array<string, bool>
     */
    public static function get_enabled_map(): array
    {
        $map = [];
        foreach (array_keys(self::OPTION_NAMES) as $post_type) {
            $map[$post_type] = self::is_enabled_for($post_type);
        }

        return $map;
    }

    /**
     * State handed to the admin JavaScript bundle.
     *
     * Exposes nothing a viewer of the settings screen could not read already:
     * the two switch states, the post types they apply to, their labels, the
     * layout width of a display page and a save nonce.
     *
     * @return array<string, mixed>
     */
    public static function get_admin_state(): array
    {
        return [
            'enabledMap'       => self::get_enabled_map(),
            'postTypes'        => self::POST_TYPES,
            'labels'           => self::get_post_type_labels(),
            'nonce'            => wp_create_nonce(self::NONCE_ACTION_SETTING),
            'ajaxAction'       => self::AJAX_ACTION,
            'optionNames'      => self::OPTION_NAMES,
            'scopeField'       => self::AJAX_SCOPE_FIELD,
            'settingsHash'     => self::SETTINGS_HASH,
            // Layout width the page builder's breakpoints are measured against
            // on a display page. `0` = Auto (leave the page alone).
            'canvasWidth'      => self::get_canvas_width(),
            // Every size a width list offers (the built-in ladder plus the site's
            // own named sizes), the named sizes on their own for the small editor
            // of that list, and the action plus the limits that save them.
            'canvasPresets'           => self::get_all_canvas_presets(),
            'canvasBuiltinPresets'    => self::get_canvas_presets(),
            'customPresets'           => self::get_custom_canvas_presets(),
            'customPresetsAjaxAction' => self::AJAX_PRESETS_ACTION,
            'customPresetsMax'        => self::MAX_CUSTOM_PRESETS,
            'presetLabelMax'          => self::PRESET_LABEL_MAX,
            'presetsOption'           => self::PRESETS_OPTION,
            'canvasAjaxAction' => self::AJAX_CANVAS_ACTION,
            'canvasOption'     => self::CANVAS_OPTION,
            'canvasMin'        => self::CANVAS_MIN,
            'canvasMax'        => self::CANVAS_MAX,
            // One finished sentence rather than three fragments around two
            // numbers, so translators get a whole sentence and the range always
            // matches the constants that enforce it.
            'canvasRange'      => sprintf(
                /* translators: 1: minimum layout width in pixels, 2: maximum layout width in pixels. */
                __('Any width from %1$d to %2$d pixels.', 'fiveprayer'),
                self::CANVAS_MIN,
                self::CANVAS_MAX
            ),
            'reportQueryArg'   => self::REPORT_QUERY_ARG,
            // The kind of screen the display is built for: Modern (the whole
            // screen is visible) or Older TV (it crops about 5% off each edge).
            // `overscanPercent` is what both the editor's safe-zone guide and the
            // display engine keep the design inside of.
            'tvType'             => self::get_tv_type(),
            'tvTypeChoices'      => self::get_tv_type_choices(),
            'tvTypeAjaxAction'   => self::AJAX_TV_TYPE_ACTION,
            'tvTypeOption'       => self::TV_TYPE_OPTION,
            'overscanPercent'    => self::get_overscan_percent(),
        ];
    }

    /**
     * The widths offered in the settings screen, in the order they are shown.
     *
     * `0` is Auto and comes first because it is the default; the fixed widths
     * run from the largest down, so the list reads as a ladder of screens. Every
     * value is a plain number of pixels — the setting exists so the page builder
     * lands in a known breakpoint, and what a builder calls its breakpoints
     * differs from builder to builder.
     *
     * @return array<int, array<string, mixed>> Pairs of value (width), label and
     *                                           height (`0` when not set).
     */
    public static function get_canvas_presets(): array
    {
        return [
            [
                'value'  => 0,
                'label'  => __('Auto — use what the TV reports', 'fiveprayer'),
                'height' => 0,
            ],
            [
                'value'  => 3840,
                'label'  => __('4K TV — 3840 px', 'fiveprayer'),
                'height' => 2160,
            ],
            [
                'value'  => 2560,
                'label'  => __('2K / QHD — 2560 px', 'fiveprayer'),
                'height' => 1440,
            ],
            [
                'value'  => 1920,
                'label'  => __('Full HD TV — 1920 px (recommended)', 'fiveprayer'),
                'height' => 1080,
            ],
            [
                'value'  => 1600,
                'label'  => __('1600 px', 'fiveprayer'),
                'height' => 900,
            ],
            [
                'value'  => 1366,
                'label'  => __('1366 px', 'fiveprayer'),
                'height' => 768,
            ],
            [
                'value'  => 1280,
                'label'  => __('HD — 1280 px', 'fiveprayer'),
                'height' => 720,
            ],
            // The two narrow widths are the page editor's tablet and phone
            // breakpoints in WordPress itself (`480px < width <= 782px` and
            // `width <= 480px`), so a vertical screen can be put into the narrow
            // design it was built with instead of the wide one. Their heights are
            // portrait shapes, because that is the screen these widths describe —
            // the canvas locker locks exactly this width × height in the editor.
            [
                'value'  => 782,
                'label'  => __('782 px — tablet layout (vertical screens)', 'fiveprayer'),
                'height' => 1024,
            ],
            [
                'value'  => 480,
                'label'  => __('480 px — phone layout (vertical screens)', 'fiveprayer'),
                'height' => 854,
            ],
        ];
    }

    /**
     * Whether a width is one of the offered presets.
     *
     * Used by the page's TV Mode box to decide whether the stored width has to be
     * added to the list as an extra option, so the box shows the width that is
     * actually stored instead of quietly showing "site setting".
     *
     * @param int $width Width in pixels.
     * @return bool True when the width appears in {@see self::get_canvas_presets()}.
     */
    public static function is_canvas_preset(int $width): bool
    {
        foreach (self::get_all_canvas_presets() as $preset) {
            if ((int) $preset['value'] === $width) {
                return true;
            }
        }

        return false;
    }

    /**
     * The site's own named sizes, sanitised and in the order they were saved.
     *
     * @return array<int, array<string, mixed>> Pairs of value and label.
     */
    public static function get_custom_canvas_presets(): array
    {
        return self::sanitize_custom_presets(get_option(self::PRESETS_OPTION, []));
    }

    /**
     * Normalise a list of named sizes.
     *
     * Deliberately forgiving, because the rows arrive one form field at a time:
     * a row without a usable name or without a width above zero is dropped (Auto
     * is the absence of a size, not a size), a width is clamped into the accepted
     * range, a repeated width keeps its first name, and the list is cut at
     * {@see self::MAX_CUSTOM_PRESETS}. Rows are accepted with either `label` or
     * `name`, and either `value` or `width`, so a stored list and a submitted one
     * go through the same door.
     *
     * @param mixed $raw Value as submitted or stored.
     * @return array<int, array<string, mixed>> Clean pairs of value, label and height.
     */
    public static function sanitize_custom_presets($raw): array
    {
        if (!is_array($raw)) {
            return [];
        }

        $names = [];

        foreach ($raw as $row) {
            if (!is_array($row)) {
                continue;
            }

            $label  = $row['label'] ?? ($row['name'] ?? '');
            $value  = $row['value'] ?? ($row['width'] ?? null);
            $height = $row['height'] ?? null;

            $width = self::sanitize_canvas_width($value);
            if ($width < self::CANVAS_MIN) {
                continue;
            }

            $label = self::sanitize_preset_label($label);
            if ('' === $label) {
                continue;
            }

            // First name wins for a repeated width, so saving the screen twice
            // cannot silently rename a size.
            if (isset($names[$width])) {
                continue;
            }

            $names[$width] = [
                'label'  => $label,
                'height' => self::sanitize_canvas_height($height),
            ];

            if (count($names) >= self::MAX_CUSTOM_PRESETS) {
                break;
            }
        }

        $presets = [];
        foreach ($names as $width => $name) {
            $presets[] = [
                'value'  => $width,
                'label'  => $name['label'],
                'height' => $name['height'],
            ];
        }

        return $presets;
    }

    /**
     * Normalise one name given to a size.
     *
     * @param mixed $label Name as submitted or stored.
     * @return string Clean name, or an empty string when it is unusable.
     */
    public static function sanitize_preset_label($label): string
    {
        if (is_array($label) || is_object($label)) {
            return '';
        }

        // A name is printed in every width list and in the messages about them,
        // so it is stripped exactly like any other setting.
        $label = trim(sanitize_text_field((string) $label));

        if ('' === $label) {
            return '';
        }

        if (function_exists('mb_substr')) {
            return mb_substr($label, 0, self::PRESET_LABEL_MAX);
        }

        return substr($label, 0, self::PRESET_LABEL_MAX);
    }

    /**
     * Store the site's own named sizes.
     *
     * @param mixed $rows Rows as submitted.
     * @return array<int, array<string, mixed>> The list that was stored.
     */
    public static function save_custom_canvas_presets($rows): array
    {
        $clean = self::sanitize_custom_presets($rows);

        update_option(self::PRESETS_OPTION, $clean);

        return $clean;
    }

    /**
     * Every size offered in a width list: the built-in ladder plus the site's own
     * named sizes.
     *
     * A name the user gave to a width replaces the built-in label for that same
     * width, because that is the name they will look for in the editor. The
     * built-in ladder keeps its order and **Auto** stays first, so every list
     * reads the same way whatever a site has added.
     *
     * @return array<int, array<string, mixed>> Pairs of value (width), label and
     *                                           height (`0` when not set).
     */
    public static function get_all_canvas_presets(): array
    {
        $merged = [];

        foreach (self::get_canvas_presets() as $preset) {
            $merged[(int) $preset['value']] = [
                'label'  => (string) $preset['label'],
                'height' => (int) ($preset['height'] ?? 0),
            ];
        }

        // A named size replaces the built-in label for that same width, because
        // that is the name the user will look for in the editor.
        foreach (self::get_custom_canvas_presets() as $preset) {
            $width  = (int) $preset['value'];
            $height = (int) ($preset['height'] ?? 0);

            // A named size that shares a built-in width keeps that built-in
            // height when no height of its own was given, so renaming a width
            // never silently drops the shape the canvas locker locks.
            if ($height <= 0 && isset($merged[$width])) {
                $height = (int) $merged[$width]['height'];
            }

            $merged[$width] = [
                'label'  => (string) $preset['label'],
                'height' => $height,
            ];
        }

        $presets = [];
        foreach ($merged as $value => $size) {
            $presets[] = [
                'value'  => $value,
                'label'  => $size['label'],
                'height' => $size['height'],
            ];
        }

        return $presets;
    }

    /**
     * The layout width a display page is laid out at, in pixels.
     *
     * @return int Width in pixels, or 0 for Auto (the device decides).
     */
    public static function get_canvas_width(): int
    {
        return self::sanitize_canvas_width(get_option(self::CANVAS_OPTION, 0));
    }

    /**
     * Normalise a submitted screen type.
     *
     * Only the two known values are kept; anything else falls back to Modern, so
     * a stale or malformed request can never silently crop a display.
     *
     * @param mixed $raw Value as submitted or stored.
     * @return string Either {@see self::TV_TYPE_OLD} or {@see self::TV_TYPE_MODERN}.
     */
    public static function sanitize_tv_type($raw): string
    {
        $value = is_string($raw) ? strtolower(trim($raw)) : '';

        return self::TV_TYPE_OLD === $value ? self::TV_TYPE_OLD : self::TV_TYPE_MODERN;
    }

    /**
     * The kind of screen the display is built for.
     *
     * Defaults to **Modern** (no cropping), which is also the behaviour an
     * install had before this setting existed: nothing about the finished page
     * changes until someone deliberately picks an older TV.
     *
     * @return string Either {@see self::TV_TYPE_OLD} or {@see self::TV_TYPE_MODERN}.
     */
    public static function get_tv_type(): string
    {
        return self::sanitize_tv_type(get_option(self::TV_TYPE_OPTION, self::TV_TYPE_MODERN));
    }

    /**
     * Percent of each edge the chosen screen is assumed to crop.
     *
     * `0.0` for a modern TV / monitor (the whole screen is visible) and
     * {@see self::OLD_TV_OVERSCAN_PERCENT} for an older TV. This single number is
     * what the editor's safe-zone guide insets by and what the display engine
     * keeps the design inside of.
     *
     * @return float Croppable margin per edge, as a percentage.
     */
    public static function get_overscan_percent(): float
    {
        return self::TV_TYPE_OLD === self::get_tv_type() ? self::OLD_TV_OVERSCAN_PERCENT : 0.0;
    }

    /**
     * The screen types offered on the settings screen, in the order shown.
     *
     * @return array<int, array<string, string>> Pairs of value, label and description.
     */
    public static function get_tv_type_choices(): array
    {
        return [
            [
                'value'       => self::TV_TYPE_MODERN,
                'label'       => __('Modern TV / monitor — the whole screen is visible', 'fiveprayer'),
                'description' => __('Most TVs today, and any computer monitor: nothing is cropped. The display uses the full screen and the safe-zone guide marks the whole canvas.', 'fiveprayer'),
            ],
            [
                'value'       => self::TV_TYPE_OLD,
                'label'       => __('Older TV — crops the outer edge (about 5%)', 'fiveprayer'),
                'description' => __('An older television cuts a few percent off every side (overscan). The display keeps your design inside the middle 90%, so the TV’s cropping never removes important content, and the safe-zone guide marks that 5% band.', 'fiveprayer'),
            ],
        ];
    }

    /**
     * Read a page-or-request width value.
     *
     * @param mixed $raw Stored meta value or submitted/query value.
     * @return int|null Width in pixels (`0` = Auto for this page), or `null` when
     *                  the value is absent and the site-wide setting applies.
     */
    public static function parse_page_canvas_width($raw): ?int
    {
        if (is_array($raw) || is_object($raw)) {
            return null;
        }

        if ('' === trim((string) $raw)) {
            return null;
        }

        return self::sanitize_canvas_width($raw);
    }

    /**
     * The layout width a specific piece of content asked for.
     *
     * @param int $post_id Post ID to read.
     * @return int|null Width in pixels, or `null` when the content uses the
     *                  site-wide setting.
     */
    public static function get_page_canvas_width(int $post_id): ?int
    {
        if ($post_id <= 0) {
            return null;
        }

        return self::parse_page_canvas_width(get_post_meta($post_id, self::META_CANVAS_KEY, true));
    }

    /**
     * The width the current address asked for, if any.
     *
     * Read-only: the argument never turns TV Display Mode on (the per-content
     * tick does that) and nothing is written anywhere.
     *
     * @return int|null Width in pixels, or `null` when the address says nothing.
     */
    public static function get_request_canvas_width(): ?int
    {
        if (!isset($_GET[self::CANVAS_QUERY_ARG])) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only display choice made by the visitor's own address.
            return null;
        }

        $raw = trim(sanitize_text_field(wp_unslash($_GET[self::CANVAS_QUERY_ARG]))); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only display choice made by the visitor's own address.

        // An empty argument says nothing, and junk is ignored rather than read as
        // Auto: a mistyped address should show the page's normal layout, not
        // silently drop the width that page was designed for.
        if ('' === $raw) {
            return null;
        }

        if (in_array(strtolower($raw), ['auto', 'device', '0'], true)) {
            return 0;
        }

        if (!is_numeric($raw)) {
            return null;
        }

        return self::sanitize_canvas_width($raw);
    }

    /**
     * The layout width to use for the page actually being viewed.
     *
     * Precedence, narrowest first: the address's own argument, then the page's own
     * width, then the site-wide setting. The last two are only consulted on a
     * singular request, because that is the only place a per-page answer exists.
     *
     * @return int Width in pixels, or 0 for Auto (the device decides).
     */
    public static function get_effective_canvas_width(): int
    {
        $requested = self::get_request_canvas_width();
        if (null !== $requested) {
            return $requested;
        }

        if (is_singular()) {
            $page_width = self::get_page_canvas_width((int) get_queried_object_id());
            if (null !== $page_width) {
                return $page_width;
            }
        }

        return self::get_canvas_width();
    }

    /**
     * The screen size to lock a page builder's canvas to on a design-time
     * request: the same width precedence as {@see self::get_effective_canvas_width()},
     * paired with the height the chosen size carries.
     *
     * @return array{width: int, height: int} Width/height in pixels (0 = Auto).
     */
    public static function get_effective_canvas_size(): array
    {
        return self::get_canvas_size_for_width(self::get_effective_canvas_width());
    }

    /**
     * Normalise a submitted layout width.
     *
     * Anything that is not a positive number is Auto (`0`) — including an empty
     * string, `auto`, and junk from a stale form. A number outside the accepted
     * range is clamped rather than thrown away, so a typo lands on the nearest
     * usable width and the settings screen shows what was stored.
     *
     * @param mixed $raw Value as submitted or stored.
     * @return int Sanitised width in pixels, or 0 for Auto.
     */
    public static function sanitize_canvas_width($raw): int
    {
        if (is_array($raw) || is_object($raw)) {
            return 0;
        }

        $raw = trim((string) $raw);

        if ('' === $raw || !is_numeric($raw)) {
            return 0;
        }

        $width = (int) $raw;

        if ($width <= 0) {
            return 0;
        }

        return max(self::CANVAS_MIN, min(self::CANVAS_MAX, $width));
    }

    /**
     * Normalise a submitted screen height.
     *
     * A height is optional: an empty or unusable value is stored as `0`, which
     * means "not set". A usable number is clamped into the same 0–7680 range as a
     * width, so a typo lands on the nearest usable height instead of being lost.
     *
     * @param mixed $raw Value as submitted or stored.
     * @return int Sanitised height in pixels, or 0 when not set.
     */
    public static function sanitize_canvas_height($raw): int
    {
        if (is_array($raw) || is_object($raw)) {
            return 0;
        }

        $raw = trim((string) $raw);

        if ('' === $raw || !is_numeric($raw)) {
            return 0;
        }

        $height = (int) $raw;

        if ($height <= 0) {
            return 0;
        }

        return max(1, min(self::CANVAS_MAX, $height));
    }

    /**
     * The screen size (width and height) registered for one layout width.
     *
     * The width is what the viewport tag and the page builder's breakpoints use;
     * the height is the shape the canvas locker locks in the editor and the
     * safe-zone guide draws. A width that has no height returns `0` for it.
     *
     * @param int $width Width in pixels, or 0 for Auto.
     * @return array{width: int, height: int} The size, height 0 when unknown.
     */
    public static function get_canvas_size_for_width(int $width): array
    {
        foreach (self::get_all_canvas_presets() as $preset) {
            if ((int) $preset['value'] === $width) {
                return [
                    'width'  => $width,
                    'height' => (int) ($preset['height'] ?? 0),
                ];
            }
        }

        return [
            'width'  => $width,
            'height' => 0,
        ];
    }

    /**
     * Human label for a stored layout width.
     *
     * @param int $width Width in pixels, or 0 for Auto.
     * @return string Label shown in the settings screen and in messages.
     */
    public static function get_canvas_width_label(int $width): string
    {
        foreach (self::get_all_canvas_presets() as $preset) {
            if ((int) $preset['value'] === $width) {
                return (string) $preset['label'];
            }
        }

        return sprintf(
            /* translators: %d: layout width in pixels. */
            __('%d px (custom)', 'fiveprayer'),
            $width
        );
    }

    /**
     * Whether this request asked for the on-screen screen report.
     *
     * Read-only: the argument never turns TV Display Mode on (the per-content
     * tick does that) and nothing is written anywhere.
     *
     * @return bool True when the report should be shown on the display page.
     */
    public function is_report_requested(): bool
    {
        return isset($_GET[self::REPORT_QUERY_ARG]); // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only display of the visitor's own screen.
    }

    /**
     * Persist one switch.
     *
     * Runs the same security gauntlet as every other settings save: capability
     * check, nonce verification and strict sanitisation. The request must name
     * the post type it is switching (`scope`); anything else is rejected rather
     * than silently defaulting, so a malformed request can never flip the wrong
     * switch. Only the exact value `1` (or its string equivalents) enables the
     * feature.
     *
     * @return void
     */
    public function handle_ajax_save(): void
    {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(
                ['message' => __('You do not have sufficient permissions to change this setting.', 'fiveprayer')],
                403
            );
        }

        check_ajax_referer(self::NONCE_ACTION_SETTING, self::AJAX_NONCE_NAME);

        $scope = isset($_POST[self::AJAX_SCOPE_FIELD])
            ? sanitize_key(wp_unslash($_POST[self::AJAX_SCOPE_FIELD]))
            : '';

        if (!isset(self::OPTION_NAMES[$scope])) {
            wp_send_json_error(
                ['message' => __('Unknown post type for this setting.', 'fiveprayer')],
                400
            );
        }

        $raw     = isset($_POST['enabled']) ? sanitize_text_field(wp_unslash($_POST['enabled'])) : '0';
        $enabled = in_array($raw, ['1', 'true', 'on', 'yes'], true) ? 1 : 0;

        // Never let an old editor tab switch a per-type box back on after the
        // master switch was turned off: turning the master off resets all three
        // switches, and this keeps them reset. Turning one off is always allowed.
        if (1 === $enabled && !self::is_feature_enabled()) {
            wp_send_json_error(
                ['message' => __('TV Display Mode is switched off in Feature Switches. Turn it on there first.', 'fiveprayer')],
                400
            );
        }

        update_option(self::OPTION_NAMES[$scope], $enabled);

        $labels = self::get_post_type_labels();
        $label  = $labels[$scope] ?? $scope;

        wp_send_json_success([
            'scope'      => $scope,
            'enabled'    => 1 === $enabled,
            'enabledMap' => self::get_enabled_map(),
            'message'    => $enabled
                ? sprintf(
                    /* translators: 1: post type label, e.g. "Pages". 2: lower-case post type label, e.g. "pages". */
                    __('TV Display Mode is on for %1$s. Open any %2$s and switch it on with the “Enable TV Mode” checkbox.', 'fiveprayer'),
                    $label,
                    strtolower($label)
                )
                : sprintf(
                    /* translators: 1: post type label, e.g. "Pages". 2: the same post type label. */
                    __('TV Display Mode is off for %1$s. %2$s you had set up behave like normal content until you switch it back on.', 'fiveprayer'),
                    $label,
                    $label
                ),
        ]);
    }

    /**
     * Persist the layout width used for a display page.
     *
     * Same security gauntlet as the switches: `manage_options`, a verified
     * nonce and strict sanitisation. `0` (or anything unusable) stores Auto,
     * which leaves the page's viewport exactly as the theme printed it.
     *
     * @return void
     */
    public function handle_ajax_save_canvas(): void
    {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(
                ['message' => __('You do not have sufficient permissions to change this setting.', 'fiveprayer')],
                403
            );
        }

        check_ajax_referer(self::NONCE_ACTION_SETTING, self::AJAX_NONCE_NAME);

        $raw   = isset($_POST['width']) ? sanitize_text_field(wp_unslash($_POST['width'])) : '';
        $width = self::sanitize_canvas_width($raw);

        update_option(self::CANVAS_OPTION, $width);

        wp_send_json_success([
            'width'   => $width,
            'label'   => self::get_canvas_width_label($width),
            'message' => $width > 0
                ? sprintf(
                    /* translators: %d: layout width in pixels. */
                    __('Display pages are now laid out at %d px, so your page builder uses the breakpoint for that width. Reload the page on the TV to see it.', 'fiveprayer'),
                    $width
                )
                : __('Display pages now use whatever width the TV reports. Reload the page on the TV to see it.', 'fiveprayer'),
        ]);
    }

    /**
     * Persist the kind of screen the display is built for.
     *
     * Same security gauntlet as the other saves: `manage_options` and the
     * settings nonce. Only the two known values are stored, so a malformed
     * request falls back to Modern rather than cropping a live display.
     *
     * @return void
     */
    public function handle_ajax_save_tv_type(): void
    {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(
                ['message' => __('You do not have sufficient permissions to change this setting.', 'fiveprayer')],
                403
            );
        }

        check_ajax_referer(self::NONCE_ACTION_SETTING, self::AJAX_NONCE_NAME);

        $raw  = isset($_POST['tv_type']) ? sanitize_text_field(wp_unslash($_POST['tv_type'])) : '';
        $type = self::sanitize_tv_type($raw);

        update_option(self::TV_TYPE_OPTION, $type);

        wp_send_json_success([
            'tvType'          => $type,
            'overscanPercent' => self::get_overscan_percent(),
            'message'         => self::TV_TYPE_OLD === $type
                ? __('Older TV saved. Display pages now keep your design inside the middle of the screen, so the TV’s cropping never cuts it, and the safe-zone guide in the editor marks the croppable 5% band. Reload the display page on the TV to see it.', 'fiveprayer')
                : __('Modern TV saved. The display now uses the whole screen, and the safe-zone guide marks the full canvas. Reload the display page on the TV to see it.', 'fiveprayer'),
        ]);
    }

    /**
     * Persist the site's own named sizes.
     *
     * Same security gauntlet as the other two saves: `manage_options` and the
     * settings nonce. The rows arrive as two parallel lists — `names` and
     * `widths`, in the order they are shown on screen — and go through
     * {@see self::sanitize_custom_presets()}, so even a malformed request stores
     * a usable list rather than failing.
     *
     * @return void
     */
    public function handle_ajax_save_presets(): void
    {
        if (!current_user_can('manage_options')) {
            wp_send_json_error(
                ['message' => __('You do not have sufficient permissions to change this setting.', 'fiveprayer')],
                403
            );
        }

        check_ajax_referer(self::NONCE_ACTION_SETTING, self::AJAX_NONCE_NAME);

        $names   = SecurityHelper::get_sanitized_post_array('names');
        $widths  = SecurityHelper::get_sanitized_post_array('widths');
        $heights = SecurityHelper::get_sanitized_post_array('heights');

        $rows = [];
        foreach ($widths as $index => $width) {
            $rows[] = [
                'value'  => $width,
                'label'  => isset($names[$index]) ? $names[$index] : '',
                'height' => isset($heights[$index]) ? $heights[$index] : '',
            ];
        }

        $saved = self::save_custom_canvas_presets($rows);

        wp_send_json_success([
            'presets' => $saved,
            'options' => self::get_all_canvas_presets(),
            'message' => $saved
                ? sprintf(
                    /* translators: %d: number of named sizes the site has saved. */
                    _n(
                        '%d size saved. It now appears in every “Layout width” list.',
                        '%d sizes saved. They now appear in every “Layout width” list.',
                        count($saved),
                        'fiveprayer'
                    ),
                    count($saved)
                )
                : __('Your sizes were cleared. The built-in widths are still offered.', 'fiveprayer'),
        ]);
    }

    /**
     * Register the "TV Mode" meta box.
     *
     * The box is titled "TV Mode" on purpose: it has to be read in a narrow
     * editor sidebar, and the short name is unambiguous next to the one checkbox
     * it holds. The settings page keeps the full feature name, "TV Display
     * Mode".
     *
     * The whole box is skipped while that post type's switch is off, so turning
     * Pages off in the settings page really takes the box out of every page
     * editor (and leaves the post editor alone). The box opts into the Block
     * Editor via the `__block_editor_compatible_meta_box` flag, so the same
     * panel is shown in both the Classic Editor and Gutenberg without any
     * JavaScript component.
     *
     * @param string $post_type Post type currently being edited.
     * @return void
     */
    public function register_meta_box(string $post_type): void
    {
        if (!in_array($post_type, self::POST_TYPES, true)) {
            return;
        }

        // Master switch first: while TV Display Mode is off in Feature Switches
        // the box is offered nowhere, whatever the per-type switches say.
        if (!self::is_feature_enabled()) {
            return;
        }

        if (!self::is_enabled_for($post_type)) {
            return;
        }

        add_meta_box(
            'fiveprayer-tv-display',
            __('TV Mode', 'fiveprayer'),
            [$this, 'render_meta_box'],
            $post_type,
            'side',
            'default',
            [
                // Tells Gutenberg to render this classic meta box as well.
                '__block_editor_compatible_meta_box' => true,
            ]
        );
    }

    /**
     * Render the TV Mode panel.
     *
     * Deliberately one checkbox and nothing else. The long "what it does"
     * paragraph used to sit here, but a single switch is all a user needs to act
     * on; the detail belongs in the documentation page the settings page links
     * to, not in a sidebar that is read once.
     *
     * @param \WP_Post $post Post object for the current editor screen.
     * @return void
     */
    public function render_meta_box(\WP_Post $post): void
    {
        // Nonce ties the submitted value to this editor screen and user.
        wp_nonce_field(self::NONCE_ACTION, self::NONCE_NAME);

        $enabled = '1' === (string) get_post_meta($post->ID, self::META_KEY, true);

        // The page's own layout width. `null` = follow the site-wide setting.
        $page_width   = self::get_page_canvas_width($post->ID);
        $select_value = null === $page_width ? '' : (string) $page_width;

        // A width this page was given while it was one of the sizes, or one it
        // was given by address. It is listed as its own option so the select can
        // show it and save it back: removing a size from the list in the settings
        // screen must not silently move a live display page.
        $off_list_width = (null !== $page_width && $page_width > 0 && !self::is_canvas_preset($page_width))
            ? (string) $page_width
            : '';
        ?>
        <p>
            <label for="<?php echo esc_attr(self::FIELD_NAME); ?>">
                <input
                    type="checkbox"
                    id="<?php echo esc_attr(self::FIELD_NAME); ?>"
                    name="<?php echo esc_attr(self::FIELD_NAME); ?>"
                    value="1"
                    <?php checked($enabled); ?>
                />
                <?php esc_html_e('Enable TV Mode', 'fiveprayer'); ?>
            </label>
        </p>

        <?php /* The feature is still being improved, so the box says so where the
                 switch actually is; the settings page and the feature list carry
                 the same notice. Plain description markup, so it looks the same
                 in the Classic Editor and in Gutenberg. */ ?>
        <p class="description">
            <strong><?php esc_html_e('Beta:', 'fiveprayer'); ?></strong>
            <?php esc_html_e('TV Display Mode is still being improved, so the display may change in an update. Check this page on the screen after updating the plugin.', 'fiveprayer'); ?>
        </p>

        <?php /* Which of the builder's designs this page uses on the screen. One
                 list, holding the same sizes as the settings screen — no
                 JavaScript, so it behaves identically in the Classic Editor and
                 in Gutenberg. There is deliberately no second "type a width"
                 field here: it did exactly the same job as the list and left the
                 page pinned to an unnamed width nothing else could refer to. To
                 use a width that is not listed, add it under "Your own sizes" in
                 the settings screen. */ ?>
        <p class="description">
            <?php esc_html_e('Layout width — which of your designs (desktop, tablet, phone) this page uses on the screen. Leave it alone unless this page is for one kind of screen.', 'fiveprayer'); ?>
        </p>
        <p>
            <label class="screen-reader-text" for="<?php echo esc_attr(self::WIDTH_FIELD_NAME); ?>">
                <?php esc_html_e('Layout width for this page', 'fiveprayer'); ?>
            </label>
            <select
                name="<?php echo esc_attr(self::WIDTH_FIELD_NAME); ?>"
                id="<?php echo esc_attr(self::WIDTH_FIELD_NAME); ?>"
                class="widefat"
            >
                <option value="" <?php selected($select_value, ''); ?>>
                    <?php
                    echo esc_html(
                        sprintf(
                            /* translators: %s: the site-wide layout width, e.g. "Full HD TV — 1920 px (recommended)" or "Auto — use what the TV reports". */
                            __('Site setting — %s', 'fiveprayer'),
                            self::get_canvas_width_label(self::get_canvas_width())
                        )
                    );
                    ?>
                </option>
                <?php foreach (self::get_all_canvas_presets() as $preset) : ?>
                    <?php
                    $preset_value = (string) (int) $preset['value'];
                    $preset_label = 0 === (int) $preset['value']
                        ? __('Auto — this page uses the width the screen reports', 'fiveprayer')
                        : (string) $preset['label'];
                    ?>
                    <option value="<?php echo esc_attr($preset_value); ?>" <?php selected($select_value, $preset_value); ?>>
                        <?php echo esc_html($preset_label); ?>
                    </option>
                <?php endforeach; ?>
                <?php /* The width this page already holds, when it is not in the
                         list. Kept as an option so the box shows the truth and
                         the next save does not drop it. */ ?>
                <?php if ('' !== $off_list_width) : ?>
                    <option value="<?php echo esc_attr($off_list_width); ?>" <?php selected($select_value, $off_list_width); ?>>
                        <?php
                        echo esc_html(
                            sprintf(
                                /* translators: %d: layout width in pixels. */
                                __('%d px — not one of your sizes', 'fiveprayer'),
                                (int) $off_list_width
                            )
                        );
                        ?>
                    </option>
                <?php endif; ?>
            </select>
        </p>
        <p class="description">
            <?php esc_html_e('A vertical (portrait) screen uses a narrow width: 480 px shows the phone layout, 782 px the tablet layout. In an address, ?fiveprayer_tv_width=480 does the same for one device only.', 'fiveprayer'); ?>
        </p>
        <?php
    }

    /**
     * Persist the TV Display toggle.
     *
     * Runs a full set of guards before touching the database: autosave and
     * revision skips, post type check, nonce verification and the `edit_post`
     * capability on the specific post — which maps to `edit_page` for pages and
     * `edit_post` for posts, so one check covers both.
     *
     * @param int      $post_id Post ID being saved.
     * @param \WP_Post $post    Post object being saved.
     * @return void
     */
    public function save_meta_box(int $post_id, \WP_Post $post): void
    {
        // Ignore autosaves and revisions; the user did not intend to save.
        if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
            return;
        }

        if (wp_is_post_revision($post_id) || wp_is_post_autosave($post_id)) {
            return;
        }

        // Only ever touch our own post types.
        if (!in_array($post->post_type, self::POST_TYPES, true)) {
            return;
        }

        // The meta box must actually have been submitted. The nonce is
        // verified immediately below; the ignore keeps WPCS from flagging the
        // superglobal access itself.
        if (!isset($_POST[self::NONCE_NAME])) { // phpcs:ignore WordPress.Security.NonceVerification.Missing
            return;
        }

        $nonce = sanitize_text_field(wp_unslash($_POST[self::NONCE_NAME])); // phpcs:ignore WordPress.Security.NonceVerification.Missing
        if (!wp_verify_nonce($nonce, self::NONCE_ACTION)) {
            return;
        }

        // Capability check scoped to this exact post (`edit_page` for pages,
        // `edit_post` for posts).
        if (!current_user_can('edit_post', $post_id)) {
            return;
        }

        $raw = isset($_POST[self::FIELD_NAME])
            ? sanitize_text_field(wp_unslash($_POST[self::FIELD_NAME])) // phpcs:ignore WordPress.Security.NonceVerification.Missing
            : '';
        $enabled = ('1' === $raw) ? '1' : '0';

        update_post_meta($post_id, self::META_KEY, $enabled);

        // The page's own layout width, chosen from the list in the meta box. The
        // select always carries the page's current width — including a width that
        // is not one of the sizes — so an unchanged box saves the same value back.
        // An empty value stores "follow the site-wide setting" by deleting the
        // meta, which is what an install upgrading into this feature looks like
        // anyway.
        $selected = isset($_POST[self::WIDTH_FIELD_NAME])
            ? sanitize_text_field(wp_unslash($_POST[self::WIDTH_FIELD_NAME])) // phpcs:ignore WordPress.Security.NonceVerification.Missing
            : '';

        $parsed       = self::parse_page_canvas_width($selected);
        $stored_width = null === $parsed ? null : $parsed;

        if (null === $stored_width) {
            delete_post_meta($post_id, self::META_CANVAS_KEY);
        } else {
            update_post_meta($post_id, self::META_CANVAS_KEY, (string) $stored_width);
        }
    }

    /**
     * Append the TV mode body class on the opted-in front-end page.
     *
     * @param string[] $classes Existing body classes.
     * @return string[] Body classes, with `fiveprayer-tv-active` appended when active.
     */
    public function filter_body_class(array $classes): array
    {
        if ($this->is_tv_mode_active()) {
            $classes[] = self::BODY_CLASS;
        }

        return $classes;
    }

    /**
     * Determine whether the currently queried page has TV mode enabled.
     *
     * Both layers must be on: the switch for this content's post type and the
     * per-content meta. The meta is only *read* here, never cleared, so turning
     * the switch back on restores the same display pages.
     *
     * @return bool True when the post type's switch and the page meta are both on.
     */
    public function is_tv_mode_active(): bool
    {
        // Never leak the front-end treatment into the admin screens.
        if (is_admin()) {
            return false;
        }

        // Never leak it into a page builder's editing canvas either. Builders
        // render the real front-end URL, so `is_admin()` is false there: without
        // this the theme chrome would disappear and the canvas would be scaled
        // while the user is still designing the page.
        if (self::is_design_time_request()) {
            return false;
        }

        if (!is_singular()) {
            return false;
        }

        $post_id = get_queried_object_id();
        if (!$post_id) {
            return false;
        }

        $post_type = get_post_type($post_id);
        if (!$post_type || !self::is_enabled_for($post_type)) {
            return false;
        }

        if ('1' !== (string) get_post_meta($post_id, self::META_KEY, true)) {
            return false;
        }

        // Master switch last, so the settings-table read only happens on the
        // one page or post that is actually ticked. While TV Display Mode is off
        // in Feature Switches, even a tick left in the database renders nothing.
        return self::is_feature_enabled();
    }

    /**
     * Whether this request is a page builder (or the customizer) drawing its
     * design-time canvas rather than showing the finished page to a viewer.
     *
     * Cheap on purpose: one loop over the small argument list plus the
     * customizer check, so it can run on every front-end request.
     *
     * @return bool True when the request must stay a normal, editable page.
     */
    public static function is_design_time_request(): bool
    {
        // Anything loaded inside a frame is not the signage screen: it is a page
        // builder's editing canvas, an editor's device preview, or some other
        // embed. Modern browsers label every request with `Sec-Fetch-Dest`, so
        // this recognises **every** builder — including one whose query argument
        // is not in the list below, and each of its device previews — without
        // naming any of them. The television loads the page as a top-level
        // document (`document`), so this never fires for the real screen.
        $frame_dest = isset($_SERVER['HTTP_SEC_FETCH_DEST'])
            ? strtolower((string) sanitize_text_field(wp_unslash($_SERVER['HTTP_SEC_FETCH_DEST'])))
            : '';

        /**
         * Filter whether a request that arrived inside a frame counts as a
         * builder's editing canvas.
         *
         * Return false to let a framed page receive the TV treatment — for a
         * signage player that embeds the display page in an iframe, for example.
         *
         * @since 3.0.0
         *
         * @param bool   $frames_are_editors True when frames are treated as editors.
         * @param string $frame_dest         The `Sec-Fetch-Dest` value, or ''.
         */
        $frames_are_editors = (bool) apply_filters(
            'fiveprayer_tv_display_frames_are_editors',
            true,
            $frame_dest
        );

        if ($frames_are_editors && in_array($frame_dest, ['iframe', 'frame', 'embed', 'object'], true)) {
            return true;
        }

        if (function_exists('is_customize_preview') && is_customize_preview()) {
            return true;
        }

        /**
         * Filter the request arguments that identify a builder's canvas.
         *
         * @since 3.0.0
         *
         * @param string[] $args Query-string keys; presence in $_GET is enough.
         */
        $args = (array) apply_filters(
            'fiveprayer_tv_display_design_query_args',
            self::DESIGN_MODE_QUERY_ARGS
        );

        foreach ($args as $arg) {
            if (!is_string($arg) || '' === $arg) {
                continue;
            }

            if (SecurityHelper::has_query_arg($arg)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Print the viewport tag that decides which breakpoint a display page uses.
     *
     * Runs at the very top of `wp_head` so the tag is present even when the
     * template cannot be buffered ({@see self::start_viewport_filter()}). The
     * buffered pass removes every viewport tag from the finished page — this one
     * included — and re-inserts exactly one, so this is a safety net rather than
     * a duplicate.
     *
     * Nothing is printed for **Auto** (the default): the page's own viewport, and
     * therefore the builder's own breakpoint, is left exactly as it was.
     *
     * @return void
     */
    public function render_viewport_meta(): void
    {
        $width = self::get_effective_canvas_width();

        if ($width <= 0 || !$this->is_tv_mode_active()) {
            return;
        }

        echo self::build_viewport_meta($width) . "\n"; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- fixed markup, integer cast.
    }

    /**
     * Start buffering the front-end template of a display page.
     *
     * A theme (and WordPress itself, on a block theme) prints its own
     * `<meta name="viewport" content="width=device-width, initial-scale=1">`,
     * and browsers apply the tag they find — leaving two on the page would make
     * the result depend on the browser. The only place that can be corrected is
     * the finished template, so on the opted-in page, and only while a layout
     * width is chosen, the whole page is buffered and
     * {@see self::filter_viewport_in_head()} rewrites its head.
     *
     * The buffer is scoped to that one page: for **Auto** nothing is buffered at
     * all, so every other request keeps behaving exactly as before.
     *
     * @return void
     */
    public function start_viewport_filter(): void
    {
        // Resolved once, here, and handed to the callback below: the callback
        // runs when the template has already rendered, so it must not depend on
        // query state that could have moved on by then.
        $this->viewport_width = self::get_effective_canvas_width();

        if ($this->viewport_width <= 0 || !$this->is_tv_mode_active()) {
            $this->viewport_width = null;

            return;
        }

        ob_start([$this, 'filter_viewport_in_head']);
    }

    /**
     * Replace the viewport declaration of a rendered page with the chosen width.
     *
     * Only the document's head is examined, and only `<meta name="viewport">`
     * tags inside it: every one is removed and a single tag for the chosen width
     * is inserted right after `<head>`, which is where themes put theirs. The
     * body — the actual page — is returned byte for byte unchanged.
     *
     * A fragment (no `</head>`) is returned untouched, so a partial render can
     * never be rewritten into something the theme did not produce.
     *
     * @param string $html Buffered template output.
     * @return string Template output with exactly one viewport tag.
     */
    public function filter_viewport_in_head(string $html): string
    {
        $width = null !== $this->viewport_width
            ? $this->viewport_width
            : self::get_effective_canvas_width();

        if ($width <= 0) {
            return $html;
        }

        $head_end = stripos($html, '</head>');
        if (false === $head_end) {
            return $html;
        }

        $head = substr($html, 0, $head_end);
        $rest = substr($html, $head_end);

        // Drop every viewport declaration in the head, whoever printed it.
        // Quoted and unquoted names are both accepted, and so is any casing or
        // attribute order, because themes and SEO plugins differ on all three.
        $clean = preg_replace(
            '/<meta\b[^>]*\bname\s*=\s*(?:"viewport"|\'viewport\'|viewport(?=[\s\/>]))[^>]*>\s*/i',
            '',
            $head
        );

        if (is_string($clean)) {
            $head = $clean;
        }

        $skipped = 0;
        $with    = preg_replace('/<head\b[^>]*>/i', '$0' . "\n\t" . self::build_viewport_meta($width), $head, 1, $skipped);

        if (is_string($with) && $skipped > 0) {
            $head = $with;
        } else {
            // No usable <head> opening tag: place the tag at the end of the head
            // instead, which is still inside <head>.
            $head .= self::build_viewport_meta($width) . "\n";
        }

        return $head . $rest;
    }

    /**
     * The viewport tag used to pin the layout viewport to the chosen width.
     *
     * `width=<n>` on its own is deliberate: the browser then sizes the layout
     * viewport to exactly `n` CSS pixels and chooses the initial zoom that fits
     * those `n` pixels to the screen, which is the same "fit the screen" idea as
     * this feature's scaling engine — but done by the browser, before media
     * queries are evaluated, which is what makes the builder's breakpoints
     * predictable. Adding `initial-scale` would pin the zoom to 1 and could crop
     * the page on a screen narrower than `n`, so it is left out.
     *
     * @param int $width Layout width in pixels.
     * @return string The meta tag, unescaped-safe (integer cast).
     */
    public static function build_viewport_meta(int $width): string
    {
        return '<meta name="viewport" content="width=' . (int) $width . '" />';
    }

    /**
     * Enqueue the TV Display stylesheet and script, but only when active.
     *
     * Both assets live in the plugin directory and are versioned by file
     * modification time so browsers always fetch the latest build after an
     * update. Queuing happens on `wp_enqueue_scripts`, scoped to the single
     * page or post where the feature is enabled.
     *
     * @return void
     */
    public function enqueue_assets(): void
    {
        if (!$this->is_tv_mode_active()) {
            return;
        }

        // The TV stylesheet is part of the plugin's single combined stylesheet
        // (see fiveprayer_initialize_asset_manager()), so a display page loads
        // that one bundle instead of a second file. The file is still enqueued
        // directly when the bundle could not be registered, so the screen is
        // never left unstyled.
        if (wp_style_is('fiveprayer-default-style', 'registered')) {
            wp_enqueue_style('fiveprayer-default-style');
        } else {
            $style_path = $this->paths->getFileFullPath(self::STYLE_REL_PATH);
            if (file_exists($style_path)) {
                wp_enqueue_style(
                    'fiveprayer-tv-display',
                    $this->paths->getFileUrl(self::STYLE_REL_PATH),
                    [],
                    (string) filemtime($style_path)
                );
            }
        }

        $script_path = $this->paths->getFileFullPath(self::SCRIPT_REL_PATH);
        if (file_exists($script_path)) {
            // Printed in the head, not the footer, together with the marker
            // below. The engine already waits for DOMContentLoaded, so nothing
            // is lost by loading it earlier — and booting from the head is what
            // lets the page be positioned before it is ever painted.
            wp_enqueue_script(
                'fiveprayer-tv-display',
                $this->paths->getFileUrl(self::SCRIPT_REL_PATH),
                [],
                (string) filemtime($script_path),
                false
            );

            // Marks the document as JavaScript-capable *before the first paint*.
            // The stylesheet keys off this class to hold the canvas invisible
            // until the scaling engine has positioned it, which is what stops
            // the page from painting once at its natural size and then jumping
            // to the fitted scale. Because the class is added by script it can
            // never be present without JavaScript, so a visitor with scripts
            // disabled still gets a normal, visible page.
            //
            // The timer is a second safety net that does not depend on the
            // external file above: the engine's own timeout only runs once that
            // file has executed, so without this a failed/blocked request would
            // leave the canvas hidden and the screen blank. Whichever fires
            // first wins and the other is a harmless no-op.
            wp_add_inline_script(
                'fiveprayer-tv-display',
                'document.documentElement.classList.add( "fiveprayer-tv-js" );'
                . 'window.setTimeout( function () {'
                . ' document.documentElement.classList.add( "fiveprayer-tv-ready" );'
                . ' }, 2500 );',
                'before'
            );

            // The screen size chosen for this page, resolved through the same
            // precedence the viewport tag uses (address argument, page meta,
            // site setting), so the screen presents the same canvas the editor
            // locked while the page was being designed. The height is `0` unless
            // the chosen width maps to a size that carries one, and the engine
            // only frames the screen while a height is known.
            $canvas_size = self::get_effective_canvas_size();

            wp_localize_script(
                'fiveprayer-tv-display',
                'fiveprayerTV',
                [
                    'baselineWidth'    => self::BASELINE_WIDTH,
                    'baselineHeight'   => self::BASELINE_HEIGHT,
                    'contentSelectors' => $this->get_content_selectors(),
                    // Layout width in force for this page (0 = Auto). Resolved
                    // through the same precedence the viewport tag uses, so the
                    // report always describes what the screen is actually
                    // getting.
                    'canvasWidth'      => $canvas_size['width'],
                    // Screen height that width carries (0 = not chosen). The
                    // engine frames the screen to it, i.e. to the same box the
                    // editor locked and the safe-zone guide drew.
                    'canvasHeight'     => $canvas_size['height'],
                    // Whether the editor canvas is locked to this page's box
                    // (**Canvas Force**). The screen presents the design the same
                    // way the canvas does: while the canvas draws the chosen box
                    // it lifts the theme's cap on the design wrapper, so the
                    // screen lifts it too and the design is shown at the same
                    // width in both places.
                    'canvasForce'      => TvCanvasLocker::is_canvas_force_enabled(),
                    // The opt-in screen report (`?fiveprayer_tv_report`): the
                    // numbers that decide which builder breakpoint is active.
                    'report'           => $this->is_report_requested(),
                    'reportLabel'      => __('TV screen report', 'fiveprayer'),
                    // Percent of each edge the chosen screen can crop. `0` for a
                    // modern TV (the whole screen is visible) or 5 for an older
                    // one; the engine keeps the design inside the safe area by
                    // this much on every side, so the TV never cuts it.
                    'overscanPercent'  => self::get_overscan_percent(),
                ]
            );
        }
    }

    /**
     * Resolve the ordered list of content-wrapper selectors.
     *
     * The script uses the first selector that matches a visible element, which
     * makes the scaling engine work on top of any page builder that renders a
     * normal front-end page (Elementor, Divi, Brizy, Beaver Builder, Bricks,
     * Breakdance, block themes, classic themes) without modifying their markup.
     *
     * That wrapper is only ever measured and scaled: the engine freezes its
     * measured width and applies a uniform `transform: scale()`, so the layout
     * the builder produced is carried to the screen unchanged. Nothing in this
     * list may be used to resize or restyle the page's own containers.
     *
     * @return string[] Candidate CSS selectors, in priority order.
     */
    private function get_content_selectors(): array
    {
        $selectors = [
            '.elementor',          // Elementor full-page canvas.
            '#et-boc .et-l',       // Divi builder layout.
            '#et-boc',             // Divi builder wrapper.
            '.fl-builder-content', // Beaver Builder rows.
            '#brx-content',        // Bricks content area.
            '.breakdance',         // Breakdance canvas.
            // Brizy: every Brizy root container (page canvas, story, block)
            // carries `brz-root__container`; only the page canvas adds `-page`,
            // which is the one that is the display page's design wrapper.
            '.brz-root__container-page',
            '.wp-site-blocks',     // Block theme wrapper.
            '.entry-content',      // Classic + Gutenberg post content.
            'main',
            '#content',
            '#primary',
        ];

        /**
         * Filter the selectors used to locate the page's main content wrapper.
         *
         * @since 3.0.0
         *
         * @param string[] $selectors Candidate CSS selectors, in priority order.
         */
        return (array) apply_filters('fiveprayer_tv_display_content_selectors', $selectors);
    }
}

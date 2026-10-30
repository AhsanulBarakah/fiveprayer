<?php

namespace FivePrayer\Core\Admin;

defined('ABSPATH') || exit;

use FivePrayer\Core\PathService;

/**
 * TV Mode editor guides: Canvas Force & Safe Zone Guide.
 *
 * Two **editor-only** design aids for the TV Display Mode feature, each with its
 * own On/Off switch on the TV Display Mode page. A page builder
 * (Elementor, Bricks, Divi, Brizy, Builderius, Gutenberg, Beaver, Breakdance, Oxygen,
 * WPBakery …)
 * decides what `100%` height and `vh` mean from the **browser viewport it is
 * shown in** — which is the designer's laptop, not the TV the page is built for.
 * A block or section styled `height: 100vh` therefore shrinks to the laptop and
 * the layout looks broken on the screen even though the design is correct.
 *
 * Two independent switches on the **TV Display Mode** page of the Configure
 * Settings screen turn this on — **Canvas Force** (lock the canvas) and
 * **Safe Zone Guide** (draw the overscan frame), each with its own On/Off — and
 * this class then fixes the laptop-viewport problem inside the editor only:
 *
 *  1. **Canvas lock.** The builder's editing-canvas wrapper is forced to the
 *     display page's chosen **width × height** in pixels
 *     (`width/height: Npx !important`), so every `100%`/`vh` element scales to the
 *     chosen TV layout instead of the laptop. Content taller than the box stays
 *     visible and the wrapper's parent keeps scrolling, so nothing is silently
 *     trimmed while designing.
 *
 *     The width is the chosen size only while the surface the canvas is drawn on
 *     can hold it. A builder's device preview can be narrower than the page's
 *     chosen width — its Mobile preview is 375px while the page is built for a
 *     768px screen — and forcing the chosen width there pushes part of the canvas
 *     off the preview and leaves the refused strip looking like space this plugin
 *     added. The height is always the chosen height, because that is what `vh` and
 *     `100%` read; the width falls back to the preview's own width only when the
 *     preview is the smaller of the two.
 *
 *     The lock also neutralises the `max-width` a theme puts on that wrapper
 *     (see `tv-canvas-locker.css`), because a cap there would hold the locked
 *     box narrower than the chosen size. The display page mirrors that lift
 *     while this switch is on ({@see Assets/JS/tv-display.js}, `measure()`), so
 *     the design is not the chosen width in the canvas and a narrower column on
 *     the screen — the "no space in the editor, space on the device"
 *     difference.
 *  2. **Safe-zone guide.** A read-only overlay is appended *inside* the locked
 *     canvas: an outer frame at the full size and an inner frame inset by the
 *     TV overscan margin — 5% per edge for an older TV, none for a modern one,
 *     as chosen on the TV Display Mode page ({@see TVDisplayMode::get_overscan_percent()}).
 *     It is `pointer-events: none` with a high `z-index`, so it never blocks a
 *     click, drag or selection underneath. The information badge that reports
 *     the box on screen is deliberately **not** part of that overlay: it is
 *     drawn just *above* the canvas, outside it, so the reading is available
 *     without covering the design.
 *
 * Two front doors, one code path:
 *  - **Gutenberg** — `enqueue_block_editor_assets`, because the block editor
 *    canvas lives in the admin document (or its own iframe); the controller
 *    finds it and injects the lock + guide there.
 *  - **Every builder that loads the real front-end URL into its editing iframe**
 *    (Elementor, Divi, Brizy, Bricks, Builderius, Beaver, Breakdance, Oxygen, WPBakery …)
 *    — the
 *    script is enqueued on that *design-time* request, so it already runs
 *    **inside** the builder's canvas document and needs no cross-frame work.
 *    The same {@see TVDisplayMode::is_design_time_request()} list that keeps the
 *    design-time page looking normal identifies the request.
 *
 * Isolation guarantees:
 * - Both switches ship **OFF**; while neither is on nothing is enqueued
 *   anywhere.
 * - It is only ever offered on a page that is already a display page (the post
 *   type's switch is on and the content is ticked in TV Mode).
 * - It is **editor-only**: nothing here writes to the front-end display page, and
 *   the scaling engine works the same with the switch off. The one thing the
 *   screen reads from this switch is its state: while Canvas Force is on, the
 *   display page lifts the theme's `max-width` cap on the design wrapper
 *   exactly as the lock does in the canvas, so the width in the editor is the
 *   width on the screen. With the switch off the screen keeps the theme's width,
 *   which is what the unlocked canvas shows too.
 * - Nothing is written to the database; the lock is applied in memory in the
 *   browser and disappears the moment the switch is turned off.
 * - **One lock and one guide per display page**, however many canvases of that
 *   page a builder keeps open at a time (a canvas per preview variant, a hidden
 *   frame it prefetches): the canvas on screen draws them, the others hand them
 *   over. Canvases of two different display pages each keep their own.
 *
 * @since 3.0.0
 * @package FivePrayer\Core\Admin
 */
class TvCanvasLocker
{
    /**
     * Option holding the on/off state of the **Canvas Force** switch.
     *
     * The lock half of the feature: it forces the page builder's editing canvas
     * to the display page's chosen width × height. Stored as its own option (not
     * inside `feature_toggles`) because it is a switch of the TV Display Mode
     * page, exactly like the Pages, Posts and TV / Phone switches. Missing means
     * **OFF**: this is a design aid nobody was using before, so an install that
     * has never seen it must not suddenly get a locked canvas.
     *
     * @var string
     */
    public const CANVAS_FORCE_OPTION = 'fiveprayer_tv_canvas_force';

    /**
     * Option holding the on/off state of the **Safe Zone Guide** switch.
     *
     * The guide half of the feature: it draws the read-only overscan frame over
     * the canvas. Kept as its own switch so a designer can have the lock without
     * the overlay, or the overlay without the lock. Missing means **OFF**, for
     * the same reason as {@see self::CANVAS_FORCE_OPTION}.
     *
     * @var string
     */
    public const SAFE_ZONE_OPTION = 'fiveprayer_tv_safe_zone_guide';

    /**
     * `wp_ajax_*` action used to persist either switch.
     *
     * @var string
     */
    public const AJAX_ACTION = 'fp_save_tv_editor_guide';

    /**
     * Nonce action used when saving a switch.
     *
     * @var string
     */
    public const NONCE_ACTION = 'fiveprayer_tv_editor_guide_save';

    /**
     * Ajax request field carrying the nonce.
     *
     * @var string
     */
    public const NONCE_NAME = 'nonce';

    /**
     * Ajax field naming which of the two guides a save applies to.
     *
     * @var string
     */
    public const AJAX_GUIDE_FIELD = 'guide';

    /**
     * Value of {@see self::AJAX_GUIDE_FIELD} for the Canvas Force switch.
     *
     * @var string
     */
    public const GUIDE_CANVAS_FORCE = 'canvas_force';

    /**
     * Value of {@see self::AJAX_GUIDE_FIELD} for the Safe Zone Guide switch.
     *
     * @var string
     */
    public const GUIDE_SAFE_ZONE = 'safe_zone';

    /**
     * Relative path of the editor stylesheet.
     *
     * @var string
     */
    private const STYLE_REL_PATH = 'php/classes/core/Assets/CSS/tv-canvas-locker.css';

    /**
     * Relative path of the editor controller.
     *
     * @var string
     */
    private const SCRIPT_REL_PATH = 'php/classes/core/Assets/JS/tv-canvas-locker.js';

    /**
     * Script handle shared by the block-editor and design-time enqueues.
     *
     * @var string
     */
    private const HANDLE = 'fiveprayer-tv-canvas-locker';

    /**
     * Path service used to resolve plugin file paths and URLs.
     *
     * @var PathService
     */
    private PathService $paths;

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
        // Gutenberg: the block editor's own asset hook.
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_block_editor_assets']);

        // Every builder that opens the real front-end URL inside its editing
        // canvas (Elementor, Divi, Brizy, Bricks, Builderius, Beaver, Breakdance, Oxygen,
        // WPBakery…):
        // the controller is enqueued on that design-time request, so it runs
        // inside the canvas document itself.
        add_action('wp_enqueue_scripts', [$this, 'maybe_enqueue_design_time'], 20);

        // The two switches live on the TV Display Mode page of Configure
        // Settings; this endpoint saves them.
        add_action('wp_ajax_' . self::AJAX_ACTION, [$this, 'handle_ajax_save']);
    }

    /**
     * Whether the **Canvas Force** switch is on.
     *
     * Read directly from its option on every call (never cached), because the
     * TV Display Mode page flips it and an editor tab should pick the new answer
     * up on the next load.
     *
     * @return bool True when the builder canvas should be locked.
     */
    public static function is_canvas_force_enabled(): bool
    {
        return 0 !== (int) get_option(self::CANVAS_FORCE_OPTION, 0);
    }

    /**
     * Whether the **Safe Zone Guide** switch is on.
     *
     * @return bool True when the overscan guide should be drawn.
     */
    public static function is_safe_zone_enabled(): bool
    {
        return 0 !== (int) get_option(self::SAFE_ZONE_OPTION, 0);
    }

    /**
     * Whether either editor guide is switched on.
     *
     * The two switches are independent, but they share one controller, so the
     * controller is only enqueued when at least one of them is on.
     *
     * @return bool True when a canvas lock and/or a safe-zone guide is offered.
     */
    public static function is_enabled(): bool
    {
        return self::is_canvas_force_enabled() || self::is_safe_zone_enabled();
    }

    /**
     * Whether this content is a display page that can be locked.
     *
     * Requires all the layers the front end requires: the feature is on, the
     * post type's switch is on and the content is ticked in TV Mode.
     *
     * @param int $post_id Post ID to test.
     * @return bool True when the content is a TV display page.
     */
    public static function is_locked_post(int $post_id): bool
    {
        if ($post_id <= 0 || !self::is_enabled() || !TVDisplayMode::is_feature_enabled()) {
            return false;
        }

        $post_type = get_post_type($post_id);
        if (!$post_type || !TVDisplayMode::is_enabled_for($post_type)) {
            return false;
        }

        return '1' === (string) get_post_meta($post_id, TVDisplayMode::META_KEY, true);
    }

    /**
     * Enqueue the controller in the Block Editor.
     *
     * Runs in the admin document even when the block editor renders its canvas
     * in an iframe; the controller finds that canvas and injects into it.
     *
     * @return void
     */
    public function enqueue_block_editor_assets(): void
    {
        if (!self::is_enabled() || !TVDisplayMode::is_feature_enabled()) {
            return;
        }

        $post_id = $this->current_editor_post_id();
        if (!self::is_locked_post($post_id)) {
            return;
        }

        $size = $this->resolve_size($post_id);
        if ($size['width'] <= 0 || $size['height'] <= 0) {
            return;
        }

        $this->enqueue($size, true);
    }

    /**
     * Enqueue the controller on a builder's design-time request.
     *
     * The request *is* the editing canvas (the builder loaded this URL into its
     * iframe), so this only ever fires while a display page is being designed,
     * never on the finished signage page: {@see TVDisplayMode::is_design_time_request()}
     * is what separates the two.
     *
     * @return void
     */
    public function maybe_enqueue_design_time(): void
    {
        if (!self::is_enabled() || !TVDisplayMode::is_feature_enabled()) {
            return;
        }

        if (!TVDisplayMode::is_design_time_request()) {
            return;
        }

        if (!is_singular()) {
            return;
        }

        $post_id = (int) get_queried_object_id();
        if (!self::is_locked_post($post_id)) {
            return;
        }

        $size = $this->resolve_size($post_id);
        if ($size['width'] <= 0 || $size['height'] <= 0) {
            return;
        }

        $this->enqueue($size, false);
    }

    /**
     * State handed to the admin JavaScript bundle.
     *
     * Read by the two switch rows of the TV Display Mode page. Exposes nothing a
     * viewer of that screen could not read already: the two switch states, the
     * overscan margin and the nonce and action that save them.
     *
     * @return array<string, mixed>
     */
    public static function get_admin_state(): array
    {
        return [
            'canvasForce'   => self::is_canvas_force_enabled(),
            'safeZone'      => self::is_safe_zone_enabled(),
            'nonce'         => wp_create_nonce(self::NONCE_ACTION),
            'ajaxAction'    => self::AJAX_ACTION,
            'guideField'    => self::AJAX_GUIDE_FIELD,            'canvasForceKey' => self::GUIDE_CANVAS_FORCE,
            'safeZoneKey'    => self::GUIDE_SAFE_ZONE,
            // The band the guide marks comes from the TV type chosen on the TV
            // Display Mode page: 5% for an older TV, 0 for a modern one.
            'marginPercent'  => TVDisplayMode::get_overscan_percent(),
        ];
    }

    /**
     * Persist one of the two switches.
     *
     * Runs the same security gauntlet as the other switches of the TV Display
     * Mode page: `manage_options`, a verified nonce and strict sanitisation. The
     * field `guide` names which switch is being changed; anything else is
     * rejected rather than guessed.
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

        check_ajax_referer(self::NONCE_ACTION, self::NONCE_NAME);

        $guide = isset($_POST[self::AJAX_GUIDE_FIELD])
            ? sanitize_key(wp_unslash($_POST[self::AJAX_GUIDE_FIELD]))
            : '';

        $options = [
            self::GUIDE_CANVAS_FORCE => self::CANVAS_FORCE_OPTION,
            self::GUIDE_SAFE_ZONE    => self::SAFE_ZONE_OPTION,
        ];

        if (!isset($options[$guide])) {
            wp_send_json_error(
                ['message' => __('Unknown editor guide for this setting.', 'fiveprayer')],
                400
            );
        }

        $raw     = isset($_POST['enabled']) ? sanitize_text_field(wp_unslash($_POST['enabled'])) : '0';
        $enabled = in_array($raw, ['1', 'true', 'on', 'yes'], true) ? 1 : 0;

        // Both switches belong to the TV Display Mode page, so that feature's
        // master switch governs them too: while TV Display Mode is off in
        // Feature Switches, an old tab must not switch a guide back on. Turning
        // one off is always allowed.
        if (1 === $enabled && !TVDisplayMode::is_feature_enabled()) {
            wp_send_json_error(
                ['message' => __('TV Display Mode is switched off in Feature Switches. Turn it on there first.', 'fiveprayer')],
                400
            );
        }

        update_option($options[$guide], $enabled);

        $is_canvas_force = self::GUIDE_CANVAS_FORCE === $guide;

        wp_send_json_success([
            'guide'       => $guide,
            'enabled'     => 1 === $enabled,
            'canvasForce' => self::is_canvas_force_enabled(),
            'safeZone'    => self::is_safe_zone_enabled(),
            'message'     => $enabled
                ? ($is_canvas_force
                    ? __('Canvas Force is on. Open a display page in your page builder: its canvas is locked to the size you chose for that page.', 'fiveprayer')
                    : __('Safe Zone Guide is on. Open a display page in your page builder to see the overscan guide.', 'fiveprayer'))
                : ($is_canvas_force
                    ? __('Canvas Force is off. The builder canvas is shown at its own size again.', 'fiveprayer')
                    : __('Safe Zone Guide is off. The guide is no longer drawn.', 'fiveprayer')),
        ]);
    }

    /**
     * The post being edited on an admin editor screen.
     *
     * @return int Post ID, or 0 when the screen is not a post editor.
     */
    private function current_editor_post_id(): int
    {
        if (function_exists('get_current_screen')) {
            $screen = get_current_screen();
            if ($screen && isset($screen->post_type) && !in_array($screen->post_type, TVDisplayMode::POST_TYPES, true)) {
                // A different (or non) post type screen: not a display page here.
                return 0;
            }
        }

        $post = function_exists('get_post') ? get_post() : null;
        if ($post instanceof \WP_Post) {
            return (int) $post->ID;
        }

        if (isset($GLOBALS['post_ID'])) {
            return (int) $GLOBALS['post_ID'];
        }

        return 0;
    }

    /**
     * The size to lock the canvas to, resolved exactly like the layout width:
     * the address's own argument, then the page's own width, then the site-wide
     * setting — paired with the height that chosen size carries.
     *
     * @param int $post_id Post ID being edited.
     * @return array{width: int, height: int} Width/height in pixels.
     */
    private function resolve_size(int $post_id): array
    {
        $requested = TVDisplayMode::get_request_canvas_width();
        if (null !== $requested) {
            return TVDisplayMode::get_canvas_size_for_width($requested);
        }

        $page_width = TVDisplayMode::get_page_canvas_width($post_id);
        if (null !== $page_width) {
            return TVDisplayMode::get_canvas_size_for_width($page_width);
        }

        return TVDisplayMode::get_canvas_size_for_width(TVDisplayMode::get_canvas_width());
    }

    /**
     * Enqueue the stylesheet and controller, and hand the controller its size.
     *
     * Nothing is emitted when the asset files are missing, so a partial deploy
     * degrades to "no lock" rather than to a broken editor.
     *
     * @param array{width: int, height: int} $size           Chosen size in pixels.
     * @param bool                           $is_block_editor True for the Block Editor.
     * @return void
     */
    private function enqueue(array $size, bool $is_block_editor): void
    {
        $style_path = $this->paths->getFileFullPath(self::STYLE_REL_PATH);
        if (file_exists($style_path)) {
            wp_enqueue_style(
                self::HANDLE,
                $this->paths->getFileUrl(self::STYLE_REL_PATH),
                [],
                (string) filemtime($style_path)
            );
        }

        $script_path = $this->paths->getFileFullPath(self::SCRIPT_REL_PATH);
        if (!file_exists($script_path)) {
            return;
        }

        wp_enqueue_script(
            self::HANDLE,
            $this->paths->getFileUrl(self::SCRIPT_REL_PATH),
            [],
            (string) filemtime($script_path),
            true
        );

        wp_localize_script(
            self::HANDLE,
            'fiveprayerCanvasLocker',
            [
                'width'         => (int) $size['width'],
                'height'        => (int) $size['height'],
                // The band the guide marks: 5% for an older TV, 0 for a modern
                // one (see TVDisplayMode::get_overscan_percent()).
                'marginPercent' => TVDisplayMode::get_overscan_percent(),
                // The two independent switches. The controller locks the canvas
                // only when `canvasForce` is on, and draws the guide only when
                // `safeZone` is on, so either can be used on its own.
                'canvasForce'   => self::is_canvas_force_enabled(),
                'safeZone'      => self::is_safe_zone_enabled(),
                // The block editor keeps its canvas in the admin document (or an
                // iframe the controller has to reach into); a builder's canvas is
                // the document the script is already running in.
                'blockEditor'   => $is_block_editor,
                // Injected into a block-editor canvas iframe, which does not
                // receive the enqueued stylesheet on its own.
                'cssUrl'        => $this->paths->getFileUrl(self::STYLE_REL_PATH),
                // Shown on the guide so the locked size is always readable.
                'heading'       => $size['width'] > 0
                    /* translators: %s: the layout width label, e.g. "Full HD TV — 1920 px (recommended)". */
                    ? sprintf(__('TV canvas — %s', 'fiveprayer'), TVDisplayMode::get_canvas_width_label((int) $size['width']))
                    : __('TV canvas', 'fiveprayer'),
                // The small in-editor control that flips each half on and off
                // for the current editing session (it never saves anything).
                'controlLabel'  => __('TV canvas', 'fiveprayer'),
                'forceLabel'    => __('Canvas Force', 'fiveprayer'),
                'zoneLabel'     => __('Safe Zone Guide', 'fiveprayer'),
                // Tooltips on the pill, which is a one-click master switch.
                'turnOffLabel'  => __('Turn the TV canvas off', 'fiveprayer'),
                'turnOnLabel'   => __('Turn the TV canvas on', 'fiveprayer'),
                'moreLabel'     => __('Individual switches', 'fiveprayer'),
                'sizeHint'      => __('Choose a size (width × height) for this display page first.', 'fiveprayer'),
            ]
        );
    }
}

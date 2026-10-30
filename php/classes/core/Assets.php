<?php

namespace FivePrayer\Core;

use FivePrayer\Core\Traits\BlockEditorAssetsTrait;
use FivePrayer\Core\Traits\AdminAssetsTrait;
use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

use FivePrayer\Core\initRegister;
use FivePrayer\Core\PathService;

class Assets
{
    use BlockEditorAssetsTrait;
    use AdminAssetsTrait;

    /**
     * Text domain used by every user facing string in the plugin, read by
     * AdminAssetsTrait.
     *
     * Declared on the class rather than inside the trait because constants in
     * traits require PHP 8.2, while this plugin supports PHP 7.4.
     */
    private const TEXT_DOMAIN = 'fiveprayer';

    private $path_service;
    private static $liveTimeInitialized = false;

    public function __construct()
    {
        $this->path_service = new PathService();
        // register() is called explicitly by Plugin::initializeComponents()
    }

    public function register(): void
    {
        add_action('wp_enqueue_scripts', [$this, 'enqueue_public_assets']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_generic_admin_assets']);
        add_action('enqueue_block_assets', [$this, 'enqueue_block_editor_assets']);
        new initRegister();
    }
    
    public function enqueue_public_assets(): void
    {
        $has_shortcode = function_exists('fiveprayer_has_shortcode_on_page')
            && fiveprayer_has_shortcode_on_page();

        // The next-prayer highlight can be placed in any page builder's HTML/Code
        // element without a FivePrayer shortcode, so its own `.fiveprayer_highlight`
        // marker also counts as plugin output on the page. This is what makes the
        // highlight (and its combined JS/CSS) load on builder pages too.
        //
        // Only scanned when no shortcode was found: fiveprayer_has_shortcode_on_page()
        // already scans the post content and builder meta, so on a normal prayer page
        // there is no second pass over the same meta.
        $has_highlight = !$has_shortcode
            && function_exists('fiveprayer_post_has_highlight')
            && fiveprayer_post_has_highlight();

        if (!$has_shortcode && !$has_highlight) {
            return;
        }

        // The highlighter is initialized whenever the page holds a shortcode or
        // the highlight marker; it enqueues the combined bundle itself.
        new \FivePrayer\Core\Helpers\FivePrayer_Highlighter();

        if ($has_shortcode && !self::$liveTimeInitialized) {
            new \FivePrayer\Core\Helpers\LiveTimeFormatted();
            self::$liveTimeInitialized = true;
        }
    }
    
    public function enqueue_generic_admin_assets(): void
    {
        // Optional: enqueue shared admin styles here
    }
}

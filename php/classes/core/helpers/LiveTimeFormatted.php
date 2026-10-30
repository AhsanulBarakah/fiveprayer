<?php
namespace FivePrayer\Core\Helpers;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\LiveTimeFormatted\Traits\TranslationLoaderTrait;
use FivePrayer\Core\Helpers\LiveTimeFormatted\Traits\ScriptRegistrarTrait;

class LiveTimeFormatted {
    use TranslationLoaderTrait;
    use ScriptRegistrarTrait;

    private $pathService;

    public function __construct() {
        $this->pathService = new \FivePrayer\Core\PathService();
        $this->pluginRootPath = $this->pathService->getPluginDir();

        add_action('wp_enqueue_scripts', [$this, 'enqueueScripts'], 20);
        add_action('enqueue_block_assets', [$this, 'enqueueBlockEditorAssets'], 20);
    }
}

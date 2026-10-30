<?php
namespace FivePrayer\Core\Assets;

defined('ABSPATH') || exit;

use FivePrayer\Core\Assets\Traits\ESIHandlerTrait;
use FivePrayer\Core\Assets\Traits\ESIContentGeneratorTrait;
use FivePrayer\Core\Logging\Logger;

class ESIDynamicContentHandler {
    use ESIHandlerTrait;
    use ESIContentGeneratorTrait;

    private static $instance = null;

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Initialize ESI handling
     */
    public function init() {
        add_action('init', [$this, 'handleESIRequest'], 1);
        add_action('send_headers', [$this, 'addESIHeaders']);
    }

    /**
     * Add ESI headers for dynamic content
     */
    public function addESIHeaders() {
        if ($this->isESIEnabled() && !is_admin() && !wp_doing_ajax()) {
            header('X-Includes: ESI/1.0');
        }
    }
}

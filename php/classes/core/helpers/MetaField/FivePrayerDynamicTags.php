<?php

namespace FivePrayer\Core\Helpers\MetaField;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Security\SecurityHelper;
use FivePrayer\Core\Helpers\MetaField\Elementor\FivePrayerElementorDynamicTags;

/**
 * Main FivePrayer Dynamic Tags Class
 * Coordinates the registration of all dynamic tags with Elementor
 */
class FivePrayerDynamicTags {
    /**
     * Register all dynamic tags with Elementor
     */
    public function register_all_tags($dynamic_tags): void {
        try {
            FivePrayerElementorDynamicTags::register($dynamic_tags);
        } catch (\Exception $e) {
            Logger::error('Error in FivePrayerDynamicTags register_all_tags: ' . $e->getMessage(), 'FivePrayerDynamicTags');
            SecurityHelper::log_security_event('Failed to register dynamic tags: ' . $e->getMessage(), 'error');
        }
    }
}

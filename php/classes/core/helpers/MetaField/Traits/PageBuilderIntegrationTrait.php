<?php

namespace FivePrayer\Core\Helpers\MetaField\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Logging\Logger;

trait PageBuilderIntegrationTrait
{
    /**
     * Register Elementor dynamic tags with security
     */
    public function register_elementor_tags($dynamic_tags): void
    {
        try {
            if (defined('ELEMENTOR_VERSION') && class_exists('\Elementor\Core\DynamicTags\Manager')) {
                $fiveprayer_tags = new \FivePrayer\Core\Helpers\MetaField\FivePrayerDynamicTags();
                $fiveprayer_tags->register_all_tags($dynamic_tags);
            }
        } catch (\Exception $e) {
            Logger::error('Error registering Elementor tags: ' . $e->getMessage(), 'PageBuilderCompat');
            \FivePrayer\Core\Security\SecurityHelper::log_security_event('Elementor tag registration failed: ' . $e->getMessage(), 'error');
        }
    }

    /**
     * Add compatibility for various page builders with security
     */
    private function add_secure_page_builder_compatibilities(): void
    {
        $this->add_secure_oxygen_compatibility();
        $this->add_secure_divi_compatibility();
        $this->add_secure_vc_compatibility();
        $this->add_secure_beaver_builder_compatibility();
        $this->add_secure_fusion_builder_compatibility();
    }

    /**
     * Add Divi Builder compatibility with security
     */
    private function add_secure_divi_compatibility(): void
    {
        if (class_exists('ET_Builder_Module')) {
            // Divi can access our meta fields directly through its custom field system
        }
    }

    /**
     * Add WPBakery/Visual Composer compatibility with security
     */
    private function add_secure_vc_compatibility(): void
    {
        if (defined('WPB_VC_VERSION')) {
            // WPBakery can access our meta fields through its param system
        }
    }

    /**
     * Add Beaver Builder compatibility with security
     */
    private function add_secure_beaver_builder_compatibility(): void
    {
        if (class_exists('FLBuilder')) {
            // Beaver Builder can access our meta fields through its dynamic fields
        }
    }

    /**
     * Add Fusion Builder (Avada) compatibility with security
     */
    private function add_secure_fusion_builder_compatibility(): void
    {
        if (class_exists('FusionBuilder')) {
            // Fusion Builder can access our meta fields through its dynamic system
        }
    }

    /**
     * Add Elementor dynamic tags compatibility with security
     */
    private function add_secure_elementor_compatibility(): void
    {
        if (defined('ELEMENTOR_VERSION') && class_exists('\Elementor\Core\DynamicTags\Manager')) {
            add_action('elementor/dynamic_tags/register', [$this, 'register_elementor_tags']);
        }
    }

    /**
     * Add Oxygen Builder compatibility with unique category registration
     */
    private function add_secure_oxygen_compatibility(): void
    {
        if (defined('OXYGEN_VERSION')) {
            if (!did_action('fiveprayer_oxygen_elements_registered')) {
                add_action('init', function () {
                    // Placeholder for Oxygen element registration
                }, 20);

                do_action('fiveprayer_oxygen_elements_registered');
            }
        }
    }
}

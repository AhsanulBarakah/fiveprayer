<?php

namespace FivePrayer\Core\Assets\Traits;

defined('ABSPATH') || exit;

trait ESIHandlerTrait
{
    /**
     * Check if ESI is supported and enabled
     */
    public function isESIEnabled()
    {
        $has_lite_speed_cache = defined('LSCWP_V') || defined('LITESPEED_SERVER_VERSION');
        $is_esi_request = $this->isESIRequest();
        $has_esi_support = $this->hasESISupport();

        $has_esi_indicator = isset($_SERVER['HTTP_X_LITESPEED_CACHE_CONTROL']) ||
                            isset($_SERVER['HTTP_X_LSCACHE']) ||
                            isset($_SERVER['HTTP_X_LIVESPEED_ESI']);

        return $has_lite_speed_cache || $is_esi_request || $has_esi_support || $has_esi_indicator;
    }

    /**
     * Check if this is an ESI request
     */
    public function isESIRequest()
    {
        return isset($_SERVER['HTTP_X_LITESPEED_ESI']) ||
               (\FivePrayer\Core\Security\SecurityHelper::has_query_arg('esi') &&
                \FivePrayer\Core\Security\SecurityHelper::get_sanitized_get_input('esi') === '1');
    }

    /**
     * Check for ESI support in the environment
     */
    private function hasESISupport()
    {
        return function_exists('do_action') &&
               (defined('LSCWP_V') ||
                class_exists('\LiteSpeed\Purge') ||
                $this->checkServerSupportsESI());
    }

    /**
     * Check if server supports ESI
     */
    private function checkServerSupportsESI()
    {
        $server_software = sanitize_text_field(wp_unslash($_SERVER['SERVER_SOFTWARE'] ?? ''));
        return stripos($server_software, 'litespeed') !== false;
    }

    /**
     * Wrap dynamic content for ESI
     */
    public function wrapDynamicContent($content, $shortcode_type, $atts = [])
    {
        if (!$this->isESIEnabled()) {
            return $content;
        }

        $esi_id = md5($shortcode_type . serialize($atts) . get_current_user_id());

        $esi_url = $this->generateESIURL($shortcode_type, $atts, $esi_id);

        return "<esi:include src=\"{$esi_url}\" />";
    }

    /**
     * Generate ESI URL for dynamic content
     */
    private function generateESIURL($shortcode_type, $atts, $esi_id)
    {
        $params = [
            'fiveprayer_esi' => 1,
            'type' => $shortcode_type,
            'id' => $esi_id,
            'nonce' => wp_create_nonce('fiveprayer_esi_' . $esi_id),
            'cb' => time()
        ];

        if (!empty($atts)) {
            $params['atts'] = urlencode(base64_encode(json_encode($atts)));
        }

        return add_query_arg($params, home_url('/'));
    }
}

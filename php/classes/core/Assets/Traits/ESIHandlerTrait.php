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
     * Content types an ESI fragment may ask for.
     *
     * Anything else is refused, so a URL that is somehow signed cannot be
     * pointed at a renderer that was never meant to be addressable.
     *
     * @return string[]
     */
    private function getESIAllowedTypes()
    {
        return [
            'current_time',
            'next_prayer',
            'single_prayer',
            'daily_prayer_table',
            'monthly_prayer_table',
        ];
    }

    /**
     * Signature for one ESI request.
     *
     * Covers the type, the attributes and the id together. Signing only the id
     * let anyone who copied one ESI URL from a public page swap `type` and
     * `atts` and have the fragment render any shortcode with any arguments.
     *
     * wp_hash() is keyed on the site's salts and, unlike a nonce, does not
     * expire: a page cached for a week must keep working, and an expired nonce
     * answered 403 to every visitor until the cache was purged.
     *
     * @param string $shortcode_type Content type requested.
     * @param string $atts_encoded   Encoded attributes exactly as they appear in
     *                               the URL, or an empty string when there are none.
     * @param string $esi_id         Fragment id.
     * @return string
     */
    private function generateESISignature($shortcode_type, $atts_encoded, $esi_id)
    {
        return wp_hash($shortcode_type . '|' . $atts_encoded . '|' . $esi_id);
    }

    /**
     * Generate ESI URL for dynamic content
     */
    private function generateESIURL($shortcode_type, $atts, $esi_id)
    {
        // The signature is computed over the raw base64. The URL carries the
        // urlencoded form because add_query_arg() does not encode values
        // itself, and PHP hands the decoded value back on the way in — signing
        // the encoded form would fail on every request that has attributes.
        $atts_encoded = !empty($atts)
            ? base64_encode((string) wp_json_encode($atts))
            : '';

        $params = [
            'fiveprayer_esi' => 1,
            'type' => $shortcode_type,
            'id' => $esi_id,
            'sig' => $this->generateESISignature($shortcode_type, $atts_encoded, $esi_id),
            'cb' => time()
        ];

        if ('' !== $atts_encoded) {
            $params['atts'] = urlencode($atts_encoded);
        }

        return add_query_arg($params, home_url('/'));
    }
}

<?php
/**
 * FivePrayer Shortcodes Module
 * 
 * This file handles shortcode-related functionality for the FivePrayer plugin.
 * 
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

/**
 * Check if this is an ESI request context
 */
function fiveprayer_is_esi_request() {
    return isset($_SERVER['HTTP_X_LITESPEED_ESI']) ||
        (\FivePrayer\Core\Security\SecurityHelper::has_query_arg('esi') &&
         \FivePrayer\Core\Security\SecurityHelper::get_sanitized_get_input('esi') === '1');
}
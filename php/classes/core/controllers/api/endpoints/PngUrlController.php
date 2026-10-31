<?php

namespace FivePrayer\Core\Controllers\API\EndPoints;

use FivePrayer\Core\Logging\Logger;
use FivePrayer\Core\Media\ImageUploader;
use WP_Error;
use WP_REST_Response;

defined('ABSPATH') || exit;

/**
 * PNG URL Controller class for handling PNG URL endpoints
 */
class PngUrlController
{
    /**
     * @var ImageUploader
     */
    private $image_uploader;

    public function __construct()
    {
        $this->image_uploader = new ImageUploader();
    }

    public function register_routes(): void
    {
        register_rest_route('fiveprayer/v1', '/png-url', [
            'methods'  => 'GET',
            'callback' => [$this, 'get_png_url'],
            'permission_callback' => [$this, 'check_permission'],
            'args' => [
                'nonce' => [
                    'required' => false,
                    'validate_callback' => [$this, 'validate_nonce']
                ],
                '_locale' => [
                    'required' => false,
                    'validate_callback' => function($param) {
                        return in_array($param, ['user', 'interface', 'admin']);
                    }
                ]
            ]
        ]);
    }

    public function check_permission($request)
    {
        // This route can create a Media Library attachment as a side effect of
        // a GET, so it is administrator-only. The previous `read` capability
        // let every logged-in subscriber trigger the upload path.
        if (!current_user_can('manage_options')) {
            return false;
        }

        $nonce = sanitize_text_field((string) filter_input(INPUT_GET, 'nonce'));

        // The editor sends a nonce; an administrator session without one is
        // still accepted because the capability check above already gates it.
        if ('' !== $nonce && !wp_verify_nonce($nonce, 'fiveprayer_png')) {
            return false;
        }

        return true;
    }

    public function validate_nonce($nonce)
    {
        if (empty($nonce)) {
            return false;
        }
        
        // Verify nonce for admin operations
        if (current_user_can('manage_options')) {
            return wp_verify_nonce($nonce, 'fiveprayer_png');
        }
        
        return true;
    }

    public function get_png_url($request)
    {
        try {
            // Ensure the image exists and get its URL
            $image_url = $this->image_uploader->getImageUrl();
            
            if (empty($image_url)) {
                return new WP_Error('image_not_found', 'Default image not found', ['status' => 404]);
            }

            // Return the image URL with cache control headers
            $response = new WP_REST_Response($image_url, 200);
            
            // Set cache headers (1 day cache)
            $response->header('Cache-Control', 'public, max-age=86400');
            $response->header('Access-Control-Allow-Origin', '*');
            
            return $response;
        } catch (\Exception $e) {
            Logger::error('PNG URL Error: ' . $e->getMessage(), 'PngUrlController');
            return new WP_Error('internal_error', 'Internal server error', ['status' => 500]);
        }
    }
}


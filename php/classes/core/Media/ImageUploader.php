<?php
namespace FivePrayer\Core\Media;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

use FivePrayer\Core\PathService;

class ImageUploader {
    /**
     * @var string The path to the default image file
     */
    private $default_image_path;
    
    /**
     * @var string The transient name for storing the attachment ID
     */
    private $transient_name = 'fiveprayer_default_image_id';

    /**
     * Constructor
     */
    public function __construct() {
        $path_service = new \FivePrayer\Core\PathService();
        $this->default_image_path = $path_service->getFileFullPath('php/classes/core/Assets/images/png/image-empty.png');
    }

    /**
     * Check if an attachment file exists
     * 
     * @param int $attachment_id The attachment ID
     * @return bool True if the file exists, false otherwise
     */
    private function attachmentFileExists($attachment_id) {
        $file = get_attached_file($attachment_id);
        return $file && file_exists($file);
    }
    
    /**
     * Ensure the default image exists in the media library
     * 
     * @return int|false The attachment ID or false on failure
     */
    public function ensureImageExists() {
        // Check if the file exists in the filesystem
        if (!file_exists($this->default_image_path)) {
            Logger::error('Default image not found at ' . $this->default_image_path, 'ImageUploader');
            return false;
        }
        
        // Get existing attachment ID if it exists in the transient
        $existing_id = get_transient($this->transient_name);
        
        // If we have an ID, verify the attachment and its file still exist
        if ($existing_id) {
            $attachment = get_post($existing_id);
            
            // If attachment exists and file exists, return the ID
            if ($attachment && 'attachment' === $attachment->post_type && $this->attachmentFileExists($existing_id)) {
                return $existing_id;
            }
            
            // If we get here, the attachment or its file is missing
            if ($attachment) {
                // Clean up the broken attachment
                wp_delete_attachment($existing_id, true);
            }
            
            // Clear the transient since it's no longer valid
            delete_transient($this->transient_name);
        }
        
        // If we get here, either we didn't have an ID or the attachment was invalid
        // So we need to upload the file to the media library
        return $this->uploadImage();
    }
    
    /**
     * Create a temporary copy of the default image
     * 
     * @return string|false Path to the temporary file or false on failure
     */
    private function createTempImageCopy() {
        $upload_dir = wp_upload_dir();
        $temp_dir = trailingslashit($upload_dir['basedir']) . 'fiveprayer-temp/';
        
        // Create the directory if it doesn't exist
        if (!file_exists($temp_dir)) {
            wp_mkdir_p($temp_dir);
        }
        
        $temp_file = $temp_dir . 'image-empty-' . time() . '.png';
        
        // Create a copy of the original file
        if (!copy($this->default_image_path, $temp_file)) {
            Logger::error('Failed to create temporary copy of the image', 'ImageUploader');
            return false;
        }
        
        return $temp_file;
    }
    
    /**
     * Clean up temporary files
     * 
     * @param string $temp_file Path to the temporary file
     */
    private function cleanupTempFile($temp_file) {
        if (file_exists($temp_file)) {
            wp_delete_file($temp_file);
            
            // Try to remove the directory if it's empty
            $temp_dir = dirname($temp_file);
            if (is_dir($temp_dir) && count(scandir($temp_dir)) <= 2) {
                // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir -- Removing the empty temp directory created for this import; WP_Filesystem is not initialised here.
                @rmdir($temp_dir);
            }
        }
    }
    
    /**
     * Check if an image with the same filename already exists in the media library
     * 
     * @return int|false The existing attachment ID or false if not found
     */
    private function findExistingImage() {
        global $wpdb;
        
        $filename = 'image-empty.png';
        
        // Search for an existing attachment with the same filename.
        // Deliberately uncached: this runs once while the plugin sets up its
        // placeholder image, and a stale "not found" result would make the next
        // run create a duplicate attachment.
        $attachment = $wpdb->get_row($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
            "SELECT post_id FROM {$wpdb->postmeta} 
             WHERE meta_key = '_wp_attached_file' 
             AND meta_value LIKE %s 
             ORDER BY post_id DESC 
             LIMIT 1",
            '%/' . $filename
        ));
        
        if ($attachment && $attachment->post_id) {
            $attachment_id = $attachment->post_id;
            // Verify the attachment still exists and has a valid file
            if ($this->attachmentFileExists($attachment_id)) {
                return $attachment_id;
            }
        }
        
        return false;
    }
    
    /**
     * Upload the default image to the media library
     * 
     * @return int|false The attachment ID or false on failure
     */
    private function uploadImage() {
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');
        
        // First, check if an image with the same filename already exists
        $existing_id = $this->findExistingImage();
        if ($existing_id) {
            Logger::info('Using existing image with ID: ' . $existing_id, 'ImageUploader');
            // Store the existing ID in our transient
            set_transient($this->transient_name, $existing_id, 0);
            return $existing_id;
        }
        
        // Create a temporary copy of the image
        $temp_file = $this->createTempImageCopy();
        if (!$temp_file) {
            Logger::error('Failed to create temporary copy of the image', 'ImageUploader');
            return false;
        }
        
        $file_array = [
            'name'     => 'image-empty.png',
            'tmp_name' => $temp_file,
            'error'    => 0,
            'size'     => filesize($temp_file)
        ];
        
        // Do the validation and storage stuff
        $attachment_id = media_handle_sideload($file_array, 0, 'fiveprayer-default-image');
        
        // Clean up the temporary file
        $this->cleanupTempFile($temp_file);
        
        // If error storing permanently
        if (is_wp_error($attachment_id)) {
            Logger::error('Error uploading image: ' . $attachment_id->get_error_message(), 'ImageUploader');
            return false;
        }
        
        // Store the attachment ID in a transient
        set_transient($this->transient_name, $attachment_id, 0);
        
        return $attachment_id;
    }
    
    /**
     * Get the URL of the default image
     * 
     * @return string|false The image URL or false on failure
     */
    public function getImageUrl() {
        $attachment_id = $this->getImageId();
        return $attachment_id ? wp_get_attachment_url($attachment_id) : false;
    }
    
    /**
     * Get the attachment ID of the default image
     * 
     * @return int|false The attachment ID or false on failure
     */
    public function getImageId() {
        $attachment_id = get_transient($this->transient_name);
        
        // If we don't have a valid attachment ID, try to ensure the image exists
        if (!$attachment_id || !get_post($attachment_id)) {
            $attachment_id = $this->ensureImageExists();
        }
        
        return $attachment_id ?: false;
    }
    
    /**
     * Clean up when the plugin is uninstalled
     */
    public static function uninstall() {
        $transient_name = 'fiveprayer_default_image_id';
        $attachment_id = get_transient($transient_name);
        
        if ($attachment_id) {
            wp_delete_attachment($attachment_id, true);
            delete_transient($transient_name);
        }
    }
}

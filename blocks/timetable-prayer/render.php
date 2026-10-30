<?php
// phpcs:disable WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedVariableFound -- Template file: included inside a function, so these are local variables, not globals.
/**
 * @see https://github.com/WordPress/gutenberg/blob/trunk/docs/reference-guides/block-api/block-metadata.md#render
 */
if (!defined('ABSPATH')) {
    exit;
}

use FivePrayer\Core\Calendar\CalendarGenerator;
use FivePrayer\Core\ShortCodes\Managers\StyleManager;

$wrapper_attributes = get_block_wrapper_attributes();
?>

<p <?php echo $wrapper_attributes; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
    <?php
    global $post;

    // Always render in admin/editor; on frontend, only render if the block is present
    if (is_admin() || (is_a($post, 'WP_Post') && has_block('fiveprayer/timetable-prayer'))) {
        $short = new CalendarGenerator();
        // Render only needs the requested month; skip the full-year load.
        $short->dynamic_generate_calendar([], false, false);

        // Enqueue the dynamic content loader script for time-sensitive timetable blocks
        $script_path = dirname(__FILE__, 2) . '/php/classes/core/Assets/JS/dynamic-content-loader.js';
        $script_url = plugins_url('php/classes/core/Assets/JS/dynamic-content-loader.js', dirname(__FILE__, 3) . '/Fiveprayer.php');

        if (!wp_script_is('fiveprayer-dynamic-content-loader', 'registered')) {
            $version = file_exists($script_path) ? filemtime($script_path) : time();
            wp_register_script(
                'fiveprayer-dynamic-content-loader',
                $script_url,
                [],
                $version,
                true
            );
        }

        // Use the central function to enqueue combined scripts
        fiveprayer_enqueue_combined_scripts();
    }
    ?>
</p>

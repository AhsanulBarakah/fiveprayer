<?php
namespace FivePrayer\Core\Helpers\MetaField\Elementor\DynamicTags;

defined('ABSPATH') || exit;

/**
 * Second ‘Asr (2 Mithl / Hanafi) begins time.
 *
 * Reads the optional `asr_second_begins` column, which generation fills with
 * the 2 Mithl time for the 1 Mithl schools (and which an imported printed
 * table can also carry). Days with no stored second ‘Asr resolve to an empty
 * value rather than a wrong time.
 */
class Asr2BeginsTag extends AbstractFieldTag {
    protected static function get_field_key(): string {
        return 'asr_second_begins';
    }

    protected static function get_tag_name(): string {
        return 'fiveprayer_asr_2_begins_time';
    }

    /**
     * What Elementor's tag picker lists. The tag *name* above is what saved
     * widgets reference, so it keeps its original spelling; only this label
     * follows the column's new name.
     */
    protected static function get_tag_title(): string {
        return 'FivePrayer - Hanafi Begins Time (2 Mithl)';
    }
}

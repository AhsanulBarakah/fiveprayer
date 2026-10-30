<?php
/**
 * The shortcodes the README documents have to be registered after activation.
 *
 * A shortcode that disappears is a silent breakage on every page that used it:
 * the tag renders as literal text instead of prayer times.
 *
 * @package FivePrayer
 */

/**
 * Registered shortcodes and their output.
 */
final class ShortcodesTest extends FivePrayerTestCase
{
    /**
     * Shortcodes the plugin's README promises.
     *
     * @return array<string, array{0: string}>
     */
    public static function documentedShortcodes(): array
    {
        $tags = [
            'Fp_TimeTable_Monthly',
            'Fp_Vertical_Daily_Prayer',
            'Fp_Single_Next_Prayer_Remaining',
            'Fp_Printer_Button',
            'Fp_Printer_Button_URL',
            'Fp_Single_CurrentDate',
            'Fp_Single_CurrentTime',
            'Fp_Single_Hijra_Date',
            'Fp_Single_Asr_2_Begins_time',
            'Fp_Extra_Prayer_1',
            'Fp_Extra_Prayer_6',
        ];

        $cases = [];
        foreach ($tags as $tag) {
            $cases[$tag] = [$tag];
        }

        return $cases;
    }

    /**
     * @dataProvider documentedShortcodes
     */
    public function test_shortcode_is_registered(string $tag): void
    {
        $this->assertTrue(shortcode_exists($tag), "[{$tag}] should be registered after activation.");
    }

    public function test_current_time_renders_something(): void
    {
        $output = do_shortcode('[Fp_Single_CurrentTime]');

        $this->assertNotSame('', trim(wp_strip_all_tags($output)), '[Fp_Single_CurrentTime] should render a time.');
    }

    public function test_unknown_shortcode_is_not_swallowed(): void
    {
        $output = do_shortcode('[Fp_Not_A_Real_Shortcode]');

        $this->assertSame('[Fp_Not_A_Real_Shortcode]', trim($output), 'An unregistered tag must stay literal, not render empty.');
    }
}

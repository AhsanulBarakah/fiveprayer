<?php

namespace FivePrayer\Core\ShortCodes\Renderers\Traits;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

trait HijriDateTrait
{
    protected function renderHijriDate(): string
    {
        try {
            $today = current_time('Y-m-d');

            if (!isset($this->hijra) || !is_object($this->hijra)) {
                $this->hijra = new \FivePrayer\Core\Calendar\Hijra();
            }

            $hijri_date = $this->hijra->hijra($today);

            $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
            $customLan = $getMetaFromDB->get_meta_key("hijralocale");
            $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;

            // Hide the Hijri date entirely when the Hijri calendar is inactive
            if (!$hijraIsActive) {
                return '';
            }

            // Do NOT normalize the Hijri date to English here. Hijra::hijra()
            // already returns the date localized through the database-driven
            // translation system (hijra_months / hijra_numbers via
            // DateFormatted::hijra_format()). A previous hardcoded
            // Arabic-to-English conversion here overwrote that translated
            // output, which is why [Fp_Single_Hijra_Date] stayed English even
            // when another language was active.

            if (!empty($hijri_date) && $hijri_date !== 'Invalid date: ' . $today) {
                return '<span class="fiveprayer-hijri-date">' . esc_html($hijri_date) . '</span>';
            }

            return '<span class="fiveprayer-hijri-date">' . esc_html__('Hijri date not available', 'fiveprayer') . '</span>';
        } catch (\Exception $e) {
            \FivePrayer\Core\Logging\Logger::error('Error in renderHijriDate: ' . $e->getMessage(), 'PrayerTimeRenderer');
            return '<span class="fiveprayer-hijri-date">' . esc_html__('Hijri date not available', 'fiveprayer') . '</span>';
        }
    }

    protected function getFallbackHijriDate($date): string
    {
        try {
            $hijri = new \FivePrayer\Core\Calendar\Hijra();
            $hijri->clearCache();

            $result = $hijri->hijra($date);

            if (!empty($result) && $result !== 'Invalid date: ' . $date) {
                return $result;
            }

            $today = current_time('Y-m-d');
            if ($today !== $date) {
                $result = $hijri->hijra($today);
                if (!empty($result) && $result !== 'Invalid date: ' . $today) {
                    return $result;
                }
            }

            return gmdate('j F Y', strtotime($date));
        } catch (\Exception $e) {
            \FivePrayer\Core\Logging\Logger::error('Fallback Hijri date generation failed: ' . $e->getMessage(), 'PrayerTimeRenderer');
            return esc_html__('Hijri date not available', 'fiveprayer');
        }
    }
}

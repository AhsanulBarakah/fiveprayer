<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use WP_REST_Request;
use FivePrayer\Core\Helpers\PrayerDataCache;

/**
 * Trait MosqueInfoEndpointTrait
 *
 * Handles mosque information API endpoints.
 * Extracted from ExternalApiController.php for code organization.
 *
 * @package FivePrayer\Core\Controllers\API\EndPoints
 */
trait MosqueInfoEndpointTrait
{
    /**
     * Get mosque information.
     */
    public function get_mosque_info(WP_REST_Request $request)
    {
        $resolved = $this->resolve_language_params($request);
        if (is_wp_error($resolved)) {
            return $resolved;
        }
        [$language, $selected_languages] = $resolved;

        $mosque_info = $this->get_mosque_info_data($language, $selected_languages);
        $mosque_info['language'] = $language ?: '';
        if ($selected_languages) {
            $mosque_info['languages'] = $selected_languages;
        }
        $mosque_info['timestamp'] = time();

        return rest_ensure_response($mosque_info);
    }

    /**
     * Get mosque information data.
     */
    private function get_mosque_info_data(?string $language_code = null, ?array $selected_languages = null): array
    {
        if ($selected_languages && count($selected_languages) > 1) {
            $mosque_names = [];
            $locations = [];

            foreach ($selected_languages as $lang) {
                $translationManager = $this->get_translation_manager($lang);
                $mosque_names[$lang] = $translationManager->getTranslatedLabel('Masjid Name');
                $locations[$lang] = $translationManager->getTranslatedLabel('Current Location');
            }

            $result = [
                'name' => $mosque_names,
                'location' => $locations,
            ];

            $mosque_address = get_option('fp_mosque_address', '');
            if (!empty($mosque_address)) {
                $result['address'] = $mosque_address;
            }

            $mosque_phone = get_option('fp_mosque_phone', '');
            if (!empty($mosque_phone)) {
                $result['phone'] = $mosque_phone;
            }

            $mosque_website = get_option('fp_mosque_website', '');
            if (!empty($mosque_website)) {
                $result['website'] = $mosque_website;
            }

            $result['extra_prayers'] = $this->get_extra_prayers_data($language_code, $selected_languages);

            return $result;
        }

        $target_lang = $selected_languages ? $selected_languages[0] : $language_code;
        $translationManager = $this->get_translation_manager($target_lang);

        $mosque_name = $translationManager->getTranslatedLabel('Masjid Name');
        $location = $translationManager->getTranslatedLabel('Current Location');

        $result = [
            'name' => $mosque_name,
            'location' => $location,
        ];

        $mosque_address = get_option('fp_mosque_address', '');
        if (!empty($mosque_address)) {
            $result['address'] = $mosque_address;
        }

        $mosque_phone = get_option('fp_mosque_phone', '');
        if (!empty($mosque_phone)) {
            $result['phone'] = $mosque_phone;
        }

        $mosque_website = get_option('fp_mosque_website', '');
        if (!empty($mosque_website)) {
            $result['website'] = $mosque_website;
        }

        $result['extra_prayers'] = $this->get_extra_prayers_data($language_code, $selected_languages);

        return $result;
    }

    /**
     * Build the optional "extra prayers" block (Jumu'ah / Eid style prayers a
     * mosque prays on top of the five daily prayers).
     *
     * Only returned while the Extra_Prayers feature switch is on — the same
     * switch that gates the [Fp_Extra_Prayer_*] shortcodes. The key is always
     * present (an empty array when off or unconfigured) so the response shape
     * stays stable.
     *
     * Each entry is:
     *   [
     *     'index' => 1,                                        // slot 1..6
     *     'name'  => 'Jumu’ah 1',                              // translated name
     *     'time'  => '13:30',                                  // stored, 24h HH:MM
     *     'note'  => 'Khutbah',                                // translated, optional
     *   ]
     * With ?langs=en,ar the `name` and `note` values become per-language maps.
     *
     * @return array<int, array<string, mixed>>
     */
    private function get_extra_prayers_data(?string $language_code = null, ?array $selected_languages = null): array
    {
        $raw = PrayerDataCache::getSingleMetaValue('extra_prayers');
        if (empty($raw)) {
            return [];
        }

        if (!$this->is_extra_prayers_enabled()) {
            return [];
        }

        $slots = json_decode($raw, true);
        if (!is_array($slots)) {
            return [];
        }

        $multilingual = $selected_languages && count($selected_languages) > 1;
        $target_lang = $selected_languages ? $selected_languages[0] : $language_code;

        $result = [];
        foreach (array_values($slots) as $index => $slot) {
            if (!is_array($slot)) {
                continue;
            }

            $name = isset($slot['name']) ? trim((string) $slot['name']) : '';
            $note = isset($slot['note']) ? trim((string) $slot['note']) : '';
            $time = isset($slot['time']) ? trim((string) $slot['time']) : '';

            if ($name === '' && $note === '' && $time === '') {
                continue;
            }

            $entry = [
                'index' => $index + 1,
                'name' => '',
                'time' => $time,
            ];

            if ($multilingual) {
                $names = [];
                $notes = [];
                foreach ($selected_languages as $lang) {
                    $translationManager = $this->get_translation_manager($lang);
                    $names[$lang] = $name !== '' ? $translationManager->getTranslatedLabel($name) : '';
                    $notes[$lang] = $note !== '' ? $translationManager->getTranslatedLabel($note) : '';
                }
                $entry['name'] = $names;
                if ($note !== '') {
                    $entry['note'] = $notes;
                }
            } else {
                $translationManager = $this->get_translation_manager($target_lang);
                $entry['name'] = $name !== '' ? $translationManager->getTranslatedLabel($name) : '';
                if ($note !== '') {
                    $entry['note'] = $translationManager->getTranslatedLabel($note);
                }
            }

            $result[] = $entry;
        }

        return $result;
    }

    /**
     * Whether the Extra_Prayers feature switch is on.
     */
    private function is_extra_prayers_enabled(): bool
    {
        $toggles = json_decode(PrayerDataCache::getSingleMetaValue('feature_toggles') ?: '[]', true);
        if (!is_array($toggles)) {
            return false;
        }

        return isset($toggles['Extra_Prayers']) && $toggles['Extra_Prayers'] === true;
    }
}

<?php

namespace FivePrayer\Core\Controllers\API\EndPoints;
defined('ABSPATH') || exit;

use WP_REST_Request;
use WP_Error;
use FivePrayer\Core\Controllers\API\RestControllerBase;
use FivePrayer\Core\Database\FivePrayer_DatabaseTranslations;
use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\Logging\Logger;

class TranslateController extends RestControllerBase
{
    /**
     * Translation collections this endpoint is allowed to write.
     *
     * The REST route used to accept any `meta-key`, which let a caller write
     * rows for unrelated settings (feature switches, printer options, …) into
     * the settings table. Keeping the list here means the endpoint can only
     * ever touch the collections the Translate screen owns.
     *
     * @var string[]
     */
    private const TRANSLATION_KEYS = [
        'prayer_names',
        'gregorian_months',
        'gregorian_numbers',
        'hijra_months',
        'hijra_numbers',
        'activeLanguage',
        'hijralocale',
        'timetable_prayer',
        'vertical_daily_prayer',
        'day_names',
        'extra_info',
    ];

    /** Fields a translation entry may contain. */
    private const TRANSLATION_ENTRY_FIELDS = [
        'original_text',
        'translated_text',
        'language_code',
        'language_name',
    ];

    private $table_name;

    public function __construct()
    {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'fp_prayer_settings_meta';
        // Routes are registered by ApiControllerRegistrar.
    }

    public function register_routes(): void
    {
        register_rest_route($this->get_namespace(), '/translations/', [
            'methods' => 'POST',
            'callback' => [$this, 'store_translations'],
            // Translations are site-wide settings: they change what every
            // visitor sees, so writing them needs the same capability as every
            // other FivePrayer settings route. `edit_posts` let any Contributor
            // or Author overwrite them.
            'permission_callback' => function () {
                return current_user_can('manage_options');
            },
        ]);

        register_rest_route($this->get_namespace(), '/translations/', [
            'methods' => 'GET',
            'callback' => [$this, 'get_translations'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function store_translations(WP_REST_Request $request)
    {
        global $wpdb;
        $translations = $request->get_json_params();
        if (!is_array($translations)) {
            return new WP_Error('invalid_data', 'Invalid translation data', ['status' => 400]);
        }

        foreach ($translations as $meta_key => $entries) {
            if (!is_string($meta_key) || !in_array($meta_key, self::TRANSLATION_KEYS, true)) {
                // Unknown / non-translation keys are ignored rather than
                // written, so this route cannot be used to change settings it
                // does not own.
                continue;
            }

            $entries = $this->sanitize_translation_entries($entries);
            if (null === $entries) {
                continue;
            }

            $id_cache_key     = 'fiveprayer_translation_row_id_' . md5($meta_key);
            $value_cache_key  = 'fiveprayer_translation_row_value_' . md5($meta_key);

            // Each save looks up the existing row and value before writing, so
            // both lookups are cached and dropped after the write below.
            $existing_id = wp_cache_get($id_cache_key, 'fiveprayer');

            if (false === $existing_id) {
                $existing_id = $wpdb->get_var($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    "SELECT id FROM %i WHERE `meta-key` = %s", $this->table_name, $meta_key
                ));
                wp_cache_set($id_cache_key, $existing_id, 'fiveprayer', 300);
            }

            if ($meta_key === 'activeLanguage' || $meta_key === 'hijralocale') {
                if ($existing_id) {
                    $wpdb->delete($this->table_name, ['id' => $existing_id]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                }
                $wpdb->insert($this->table_name, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    'meta-key' => $meta_key,
                    'value' => wp_json_encode($entries, JSON_UNESCAPED_UNICODE)
                ]);

                wp_cache_delete($id_cache_key, 'fiveprayer');
                wp_cache_delete($value_cache_key, 'fiveprayer');
                wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');
                continue;
            }

            $existing = wp_cache_get($value_cache_key, 'fiveprayer');

            if (false === $existing) {
                $existing = $wpdb->get_var($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    "SELECT value FROM %i WHERE `meta-key` = %s", $this->table_name, $meta_key
                ));
                wp_cache_set($value_cache_key, $existing, 'fiveprayer', 300);
            }

            $value = $existing ? json_decode($existing, true) : [];
            $value = is_array($value) ? $value : [];

            foreach ($entries as &$new_item) {
                $found = false;
                foreach ($value as &$existing_item) {
                    if (!is_array($existing_item)
                        || !isset($existing_item['original_text'], $existing_item['language_code'], $new_item['original_text'], $new_item['language_code'], $new_item['translated_text'])) {
                        continue;
                    }

                    if ($existing_item['original_text'] === $new_item['original_text'] &&
                        $existing_item['language_code'] === $new_item['language_code']) {
                        $existing_item['translated_text'] = $new_item['translated_text'];
                        $found = true;
                        break;
                    }
                }

                if (!$found) {
                    $value[] = $new_item;
                }
            }

            // Renamed keys (the short-lived “Asr 2”) are not shown in the editor
            // any more; a save drops them instead of writing them back.
            if ('prayer_names' === $meta_key) {
                $value = FivePrayer_DatabaseTranslations::withoutRetiredPrayerNames($value);
            }

            if ($existing_id) {
                $wpdb->update($this->table_name, ['value' => wp_json_encode($value, JSON_UNESCAPED_UNICODE)], ['id' => $existing_id]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            } else {
                $wpdb->insert($this->table_name, ['meta-key' => $meta_key, 'value' => wp_json_encode($value, JSON_UNESCAPED_UNICODE)]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            }

            wp_cache_delete($id_cache_key, 'fiveprayer');
            wp_cache_delete($value_cache_key, 'fiveprayer');
            wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');
        }
        PrayerDataCache::invalidateAll();

        // Also purge external cache plugins to ensure changes are visible immediately
        $this->purge_external_caches();

        return rest_ensure_response(['success' => true, 'message' => 'Translations saved successfully']);
    }

    /**
     * Normalise one translation collection supplied over REST.
     *
     * Only the known scalar fields of each entry are kept, every string is
     * passed through sanitize_text_field(), and non-array entries are dropped.
     * Returns null when the payload is not a list at all.
     *
     * @param mixed $entries Raw collection from the request.
     * @return array<int, array<string, string>>|null
     */
    private function sanitize_translation_entries($entries): ?array
    {
        if (!is_array($entries)) {
            return null;
        }

        // `hijralocale` is a single object (isActive, language, calendarType,
        // custom, customLan), not a list of translation entries.
        if (isset($entries['isActive']) || isset($entries['customLan']) || isset($entries['calendarType'])) {
            $locale = [];

            foreach (['isActive', 'custom', 'customLan'] as $flag) {
                if (isset($entries[$flag])) {
                    $locale[$flag] = (bool) $entries[$flag];
                }
            }

            foreach (['language', 'calendarType'] as $text) {
                if (isset($entries[$text]) && is_scalar($entries[$text])) {
                    $locale[$text] = sanitize_text_field((string) $entries[$text]);
                }
            }

            // A payload with keys but no usable ones must not blank the setting.
            if (empty($locale) && !empty($entries)) {
                return null;
            }

            return $locale;
        }

        $clean = [];

        foreach ($entries as $entry) {
            if (!is_array($entry)) {
                continue;
            }

            $item = [];

            foreach (self::TRANSLATION_ENTRY_FIELDS as $field) {
                if (isset($entry[$field]) && is_scalar($entry[$field])) {
                    $item[$field] = sanitize_text_field((string) $entry[$field]);
                }
            }

            // `activeLanguage` entries only carry a language code; the other
            // collections are useless without their two text fields.
            if (empty($item)) {
                continue;
            }

            $clean[] = $item;
        }

        // A non-empty collection with no valid entries is a malformed request,
        // not a request to delete every translation. Only an explicitly empty
        // list clears the collection.
        if (empty($clean) && !empty($entries)) {
            return null;
        }

        return $clean;
    }

    private function purge_external_caches() {
        // WP Rocket
        if (function_exists('rocket_clean_domain')) {
            rocket_clean_domain();
        }

        // LiteSpeed
        if (function_exists('do_action')) {
            // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Third-party LiteSpeed Cache hook.
            do_action('litespeed_purge_all');
        }

        // W3 Total Cache
        if (function_exists('w3tc_flush_all')) {
            w3tc_flush_all();
        }

        // WP Super Cache
        if (function_exists('wp_cache_clear_cache')) {
            wp_cache_clear_cache();
        }

        // WP Fastest Cache
        if (function_exists('wpfc_clear_all_cache')) {
            wpfc_clear_all_cache(true); // true for clear all sites in multisite
        }

        // Clear transients
        wp_cache_flush();
    }

    public function get_translations()
    {
        $keys = ['prayer_names', 'gregorian_months', 'gregorian_numbers', 'hijra_months', 'hijra_numbers', 'activeLanguage', 'hijralocale', 'timetable_prayer', 'vertical_daily_prayer', 'day_names', 'extra_info'];

        // The translation keys the admin UI polls are rows of the settings meta
        // table, which PrayerDataCache already loads once per request and keeps
        // in the object cache, so there is no need for a query of our own here.
        $rows = PrayerDataCache::getMetaData();
        $response = [];

        foreach ($rows as $row) {
            $row_key = $row->{'meta-key'} ?? '';

            if (!in_array($row_key, $keys, true)) {
                continue;
            }

            $decoded_value = json_decode($row->value, true);
            // Check if JSON decoding was successful
            if (json_last_error() !== JSON_ERROR_NONE) {
                Logger::error('FivePrayer Translation JSON decode error for key ' . $row_key . ': ' . json_last_error_msg(), 'TranslateController');
                $decoded_value = []; // Use empty array as fallback
            }
            $response[$row_key] = $decoded_value;
        }

        $response = $this->register_countdown_phrases($response);
        $response = $this->register_extra_prayer_phrases($response);
        $response = $this->remove_retired_prayer_names($response);

        return rest_ensure_response($response);
    }

    /**
     * Drop prayer-name entries whose key was renamed.
     *
     * An install that merged the short-lived “Asr 2” default kept listing it
     * beside “Hanafi” even though nothing reads it any more. The entry is
     * removed from the editor payload (and pruned on the next save/merge), so
     * Prayer Names shows one field for the second ‘Asr.
     *
     * @param array<string, mixed> $response Translation response keyed by meta key.
     * @return array<string, mixed>
     */
    private function remove_retired_prayer_names(array $response): array
    {
        if (empty($response['prayer_names']) || !is_array($response['prayer_names'])) {
            return $response;
        }

        $response['prayer_names'] = FivePrayer_DatabaseTranslations::withoutRetiredPrayerNames($response['prayer_names']);

        return $response;
    }

    /**
     * Offer the configured "extra prayer" names and notes for translation.
     *
     * The names/notes a mosque types into Configure Settings → Extra Prayers
     * are free text, so they only become translatable once they are listed in
     * the `extra_info` collection. This injects one entry per configured slot
     * value per known language (defaulting the translation to the original
     * text) so they show up in More → Translate → Extra Info. Nothing is
     * written here — the editor persists them when the admin saves.
     *
     * @param array<string, mixed> $response Translation response keyed by meta key.
     * @return array<string, mixed>
     */
    private function register_extra_prayer_phrases(array $response): array
    {
        $raw = PrayerDataCache::getSingleMetaValue('extra_prayers');
        if (empty($raw)) {
            return $response;
        }

        $slots = json_decode($raw, true);
        if (!is_array($slots)) {
            return $response;
        }

        // Collect the unique, non-empty labels (name + note) across the slots.
        $phrases = [];
        foreach ($slots as $slot) {
            if (!is_array($slot)) {
                continue;
            }
            foreach (['name', 'note'] as $field) {
                $text = isset($slot[$field]) ? trim((string) $slot[$field]) : '';
                if ($text !== '' && !in_array($text, $phrases, true)) {
                    $phrases[] = $text;
                }
            }
        }

        if (empty($phrases)) {
            return $response;
        }

        $entries = isset($response['extra_info']) && is_array($response['extra_info'])
            ? $response['extra_info']
            : [];

        // Language code => display name, taken from the entries already present.
        $languages = [];
        foreach ($response as $rows) {
            if (!is_array($rows)) {
                continue;
            }
            foreach ($rows as $row) {
                if (isset($row['language_code'])) {
                    $languages[(string) $row['language_code']] = (string) ($row['language_name'] ?? $row['language_code']);
                }
            }
        }
        if (empty($languages)) {
            $languages = ['en' => 'English'];
        }

        $existing = [];
        foreach ($entries as $entry) {
            if (isset($entry['original_text'], $entry['language_code'])) {
                $existing[$entry['original_text'] . '|' . $entry['language_code']] = true;
            }
        }

        foreach ($phrases as $phrase) {
            foreach ($languages as $code => $name) {
                $key = $phrase . '|' . $code;
                if (isset($existing[$key])) {
                    continue;
                }
                $entries[] = [
                    'original_text' => $phrase,
                    'translated_text' => $phrase,
                    'language_code' => $code,
                    'language_name' => $name,
                ];
                $existing[$key] = true;
            }
        }

        $response['extra_info'] = $entries;

        return $response;
    }

    /**
     * Offer the next-prayer countdown connector words for translation.
     *
     * The countdown uses the fixed phrases "in" / "remaining" (and "Now") and
     * resolves them through the translate collection, so they must always be
     * listed here. They ship in the translation defaults, but this guarantees
     * they appear (one per known language) even on an install where the
     * defaults have not been merged yet. Nothing is written here — the editor
     * persists them when the admin saves.
     *
     * @param array<string, mixed> $response Translation response keyed by meta key.
     * @return array<string, mixed>
     */
    private function register_countdown_phrases(array $response): array
    {
        if (!class_exists('\FivePrayer\Core\Daily\NextPrayerCountdown')) {
            return $response;
        }

        $phrases = \FivePrayer\Core\Daily\NextPrayerCountdown::translatablePhrases();
        if (empty($phrases)) {
            return $response;
        }

        $entries = isset($response['vertical_daily_prayer']) && is_array($response['vertical_daily_prayer'])
            ? $response['vertical_daily_prayer']
            : [];

        // Language code => display name, taken from the entries already present.
        $languages = [];
        foreach ($response as $rows) {
            if (!is_array($rows)) {
                continue;
            }
            foreach ($rows as $row) {
                if (isset($row['language_code'])) {
                    $languages[(string) $row['language_code']] = (string) ($row['language_name'] ?? $row['language_code']);
                }
            }
        }
        if (empty($languages)) {
            $languages = ['en' => 'English'];
        }

        $existing = [];
        foreach ($entries as $entry) {
            if (isset($entry['original_text'], $entry['language_code'])) {
                $existing[$entry['original_text'] . '|' . $entry['language_code']] = true;
            }
        }

        foreach ($phrases as $phrase) {
            foreach ($languages as $code => $name) {
                $key = $phrase . '|' . $code;
                if (isset($existing[$key])) {
                    continue;
                }
                $entries[] = [
                    'original_text' => $phrase,
                    'translated_text' => $phrase,
                    'language_code' => $code,
                    'language_name' => $name,
                ];
                $existing[$key] = true;
            }
        }

        $response['vertical_daily_prayer'] = $entries;

        return $response;
    }
}

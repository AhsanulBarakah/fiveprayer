<?php
/**
 * Checks that the optional second ‘Asr label is part of the translation system.
 *
 * Run from the WordPress root:
 *
 *   php wp-content/plugins/fiveprayer/tests/php/test-asr2-translation.php
 *
 * The second ‘Asr is the Hanafi (2 Mithl) time, printed as “Hanafi”. That label
 * used to be hardcoded, so a mosque printing a translated timetable had no way
 * to rename it. It is now a prayer name:
 *
 *   1. the shipped defaults carry “Hanafi” for English and Arabic, so a new
 *      install can edit it from More → Translate → Prayer Names;
 *   2. an install created before the entry existed gains it from the ordinary
 *      additive merge, without losing the mosque's own wording for the other
 *      prayer names;
 *   3. the REST translations payload the editor reads lists it;
 *   4. the monthly timetable and the Vertical Today table actually print the
 *      edited label — and print “Hanafi” when the custom language is off.
 *
 * @package FivePrayer
 */

// The file is a CLI test; it must never be reachable over HTTP.
if (!defined('ABSPATH') && 'cli' !== PHP_SAPI) {
    exit;
}

$fiveprayer_wp_root = dirname(__DIR__, 5);

if (!file_exists($fiveprayer_wp_root . '/wp-load.php')) {
    // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite -- CLI test diagnostics, not a web response.
    fwrite(STDERR, "Could not find wp-load.php. Run this file from the plugin's tests/php directory.\n");
    exit(1);
}

require_once $fiveprayer_wp_root . '/wp-load.php';

// Belt and braces for static analysis: after wp-load.php, ABSPATH is defined.
defined('ABSPATH') || exit;

$fiveprayer_asr2_failures = 0;

/**
 * Assert a condition and print the result.
 *
 * @param bool   $condition Condition to assert.
 * @param string $message   Description of the invariant.
 * @return void
 */
function fiveprayer_asr2_assert($condition, $message) {
    global $fiveprayer_asr2_failures;

    if ($condition) {
        echo esc_html("PASS: {$message}\n");
        return;
    }

    ++$fiveprayer_asr2_failures;
    echo esc_html("FAIL: {$message}\n");
}

/**
 * Print a check that could not be completed in this environment.
 *
 * @param string $message Why the check could not run.
 * @return void
 */
function fiveprayer_asr2_skip($message) {
    echo esc_html("SKIP: {$message}\n");
}

/**
 * Drop the per-request meta caches so a setting changed mid-process is read
 * again. Production never needs this (a request reads a setting once), but this
 * test changes translations and layouts and re-renders in the same process.
 *
 * @return void
 */
function fiveprayer_asr2_clear_meta_cache() {
    \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
    \FivePrayer\Core\Helpers\MetaCache::invalidate_cache();

    $fiveprayer_reflection = new \ReflectionClass(\FivePrayer\Core\Helpers\GetMeta::class);
    if ($fiveprayer_reflection->hasProperty('metaCache')) {
        $fiveprayer_property = $fiveprayer_reflection->getProperty('metaCache');
        $fiveprayer_property->setAccessible(true);
        $fiveprayer_property->setValue(null, []);
    }
}

/**
 * Read one stored settings row.
 *
 * @param string $key Meta key.
 * @return array{id:int,value:mixed}|null Row id and decoded value.
 */
function fiveprayer_asr2_read_meta($key) {
    global $wpdb;

    $fiveprayer_table = $wpdb->prefix . 'fp_prayer_settings_meta';
    $fiveprayer_row   = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $wpdb->prepare('SELECT id, value FROM %i WHERE `meta-key` = %s ORDER BY id ASC LIMIT 1', $fiveprayer_table, $key)
    );

    if (!$fiveprayer_row) {
        return null;
    }

    return [
        'id'    => (int) $fiveprayer_row->id,
        'value' => json_decode((string) $fiveprayer_row->value, true),
    ];
}

/**
 * Write one stored settings row back, keeping its id.
 *
 * @param string $key   Meta key.
 * @param mixed  $value Decoded value.
 * @return void
 */
function fiveprayer_asr2_write_meta($key, $value) {
    global $wpdb;

    $fiveprayer_table = $wpdb->prefix . 'fp_prayer_settings_meta';
    $fiveprayer_json  = wp_json_encode($value, JSON_UNESCAPED_UNICODE);
    $fiveprayer_row   = fiveprayer_asr2_read_meta($key);

    if ($fiveprayer_row) {
        $wpdb->update($fiveprayer_table, ['value' => $fiveprayer_json], ['id' => $fiveprayer_row['id']]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    } else {
        $wpdb->insert($fiveprayer_table, ['meta-key' => $key, 'value' => $fiveprayer_json]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    }

    fiveprayer_asr2_clear_meta_cache();
}

/**
 * Find one entry in a translation collection.
 *
 * @param array  $entries Translation entries.
 * @param string $text    original_text to look for.
 * @param string $lang    Language code.
 * @return array|null The matching entry.
 */
function fiveprayer_asr2_find_entry($entries, $text, $lang) {
    foreach ((array) $entries as $fiveprayer_entry) {
        if (!is_array($fiveprayer_entry)) {
            continue;
        }
        if (($fiveprayer_entry['original_text'] ?? null) === $text
            && ($fiveprayer_entry['language_code'] ?? null) === $lang) {
            return $fiveprayer_entry;
        }
    }

    return null;
}

/**
 * Return translation entries unchanged unless they are the Hanafi key.
 *
 * @param array       $entries Translation entries.
 * @param string|null $lang    Language code; null for every language.
 * @param string      $text    Replacement translated text, or '' to drop the entry.
 * @return array
 */
function fiveprayer_asr2_with_label($entries, $lang, $text) {
    $fiveprayer_kept = [];

    foreach ((array) $entries as $fiveprayer_entry) {
        if (!is_array($fiveprayer_entry)) {
            continue;
        }

        $fiveprayer_is_asr2 = ($fiveprayer_entry['original_text'] ?? '') === 'Hanafi';

        if ($fiveprayer_is_asr2 && (null === $lang || ($fiveprayer_entry['language_code'] ?? '') === $lang)) {
            if ('' === $text) {
                continue;
            }
            $fiveprayer_entry['translated_text'] = $text;
        }

        $fiveprayer_kept[] = $fiveprayer_entry;
    }

    return $fiveprayer_kept;
}

// ── 1. The shipped defaults carry the Hanafi name ──────────────────────────
$fiveprayer_defaults = \FivePrayer\Core\Database\FivePrayer_DatabaseTranslations::getTranslations();
$fiveprayer_default_names = $fiveprayer_defaults['prayer_names'] ?? [];

$fiveprayer_default_en = fiveprayer_asr2_find_entry($fiveprayer_default_names, 'Hanafi', 'en');
fiveprayer_asr2_assert(
    is_array($fiveprayer_default_en) && '' !== (string) ($fiveprayer_default_en['translated_text'] ?? ''),
    'the shipped prayer names offer “Hanafi” in English'
);

fiveprayer_asr2_assert(
    null === fiveprayer_asr2_find_entry($fiveprayer_default_names, 'Asr 2', 'en'),
    'the defaults no longer ship the old “Asr 2” key, so the column reads “Hanafi”'
);

$fiveprayer_default_ar = fiveprayer_asr2_find_entry($fiveprayer_default_names, 'Hanafi', 'ar');
fiveprayer_asr2_assert(
    is_array($fiveprayer_default_ar) && '' !== (string) ($fiveprayer_default_ar['translated_text'] ?? ''),
    'the shipped prayer names offer “Hanafi” in Arabic'
);

fiveprayer_asr2_assert(
    is_array($fiveprayer_default_en) && is_array($fiveprayer_default_ar)
        && $fiveprayer_default_en['translated_text'] !== $fiveprayer_default_ar['translated_text'],
    'the Arabic Hanafi default is translated, not a copy of the English one'
);


// ── 2. An older install gains the entry without losing its wording ─────────
$fiveprayer_stored = fiveprayer_asr2_read_meta('prayer_names');

if (!$fiveprayer_stored || !is_array($fiveprayer_stored['value'])) {
    fiveprayer_asr2_skip('no stored prayer_names row to merge into');
} else {
    $fiveprayer_original_names = $fiveprayer_stored['value'];
    $fiveprayer_active_row     = fiveprayer_asr2_read_meta('activeLanguage');
    $fiveprayer_active_lang    = (string) ($fiveprayer_active_row['value'][0]['language_code'] ?? 'en');

    // What an install saved before this change: no Hanafi entry at all, and the
    // mosque renamed plain ‘Asr.
    $fiveprayer_old_names = fiveprayer_asr2_with_label($fiveprayer_original_names, null, '');
    foreach ($fiveprayer_old_names as &$fiveprayer_entry) {
        if (($fiveprayer_entry['original_text'] ?? '') === 'Asr'
            && ($fiveprayer_entry['language_code'] ?? '') === 'en') {
            $fiveprayer_entry['translated_text'] = 'Asr (mosque wording)';
        }
    }
    unset($fiveprayer_entry);

    try {
        fiveprayer_asr2_write_meta('prayer_names', $fiveprayer_old_names);

        // The same additive merge the plugin runs for an upgrade: nothing the
        // user edited is replaced, missing defaults are added.
        (new \FivePrayer\Core\Database\SchemaHelper())->insertDefaultTranslations();

        $fiveprayer_merged = fiveprayer_asr2_read_meta('prayer_names');
        $fiveprayer_merged_names = is_array($fiveprayer_merged['value'] ?? null) ? $fiveprayer_merged['value'] : [];

        $fiveprayer_merged_asr = fiveprayer_asr2_find_entry($fiveprayer_merged_names, 'Asr', 'en');
        fiveprayer_asr2_assert(
            'Asr (mosque wording)' === (string) ($fiveprayer_merged_asr['translated_text'] ?? ''),
            "the merge keeps a mosque's own Asr wording"
        );

        fiveprayer_asr2_assert(
            is_array(fiveprayer_asr2_find_entry($fiveprayer_merged_names, 'Hanafi', 'en'))
                && is_array(fiveprayer_asr2_find_entry($fiveprayer_merged_names, 'Hanafi', 'ar')),
            'an existing install gains “Hanafi” (English and Arabic) without a reset'
        );

        // The editor reads this payload, so the entry has to be in it.
        $fiveprayer_request  = new \WP_REST_Request('GET', '/fiveprayer/v1/translations');
        $fiveprayer_response = rest_do_request($fiveprayer_request)->get_data();
        $fiveprayer_rest_names = $fiveprayer_response['prayer_names'] ?? [];

        fiveprayer_asr2_assert(
            is_array(fiveprayer_asr2_find_entry($fiveprayer_rest_names, 'Hanafi', 'en')),
            'the translations payload lists “Hanafi” for the editor'
        );

        fiveprayer_asr2_assert(
            is_array(fiveprayer_asr2_find_entry($fiveprayer_rest_names, 'Hanafi', 'ar')),
            'the translations payload lists the Arabic “Hanafi” too'
        );
    } finally {
        fiveprayer_asr2_write_meta('prayer_names', $fiveprayer_original_names);
    }

    // ── 2b. The retired “Asr 2” row is not offered and gets pruned ─────────
    // An install that merged the short-lived “Asr 2” default still has that row
    // in the collection. Nothing reads it (every renderer asks for “Hanafi”), so
    // the editor must not list it, and a merge/save must remove it.
    $fiveprayer_stale_names = $fiveprayer_original_names;
    foreach (['en', 'ar'] as $fiveprayer_stale_lang) {
        $fiveprayer_stale_names[] = [
            'original_text'   => 'Asr 2',
            'translated_text' => 'Asr 2',
            'language_code'   => $fiveprayer_stale_lang,
            'language_name'   => 'en' === $fiveprayer_stale_lang ? 'English' : 'Arabic',
        ];
    }

    try {
        fiveprayer_asr2_write_meta('prayer_names', $fiveprayer_stale_names);

        $fiveprayer_stale_response = rest_do_request(
            new \WP_REST_Request('GET', '/fiveprayer/v1/translations')
        )->get_data();
        $fiveprayer_stale_listed = $fiveprayer_stale_response['prayer_names'] ?? [];

        fiveprayer_asr2_assert(
            null === fiveprayer_asr2_find_entry($fiveprayer_stale_listed, 'Asr 2', 'en')
                && null === fiveprayer_asr2_find_entry($fiveprayer_stale_listed, 'Asr 2', 'ar'),
            'the Prayer Names payload no longer lists the retired “Asr 2” field'
        );

        fiveprayer_asr2_assert(
            is_array(fiveprayer_asr2_find_entry($fiveprayer_stale_listed, 'Hanafi', 'en')),
            'the payload still lists “Hanafi” after the retired entry is dropped'
        );

        // The next defaults merge (activation, upgrade, reset) removes the row.
        (new \FivePrayer\Core\Database\SchemaHelper())->insertDefaultTranslations();
        $fiveprayer_pruned = fiveprayer_asr2_read_meta('prayer_names');
        $fiveprayer_pruned_names = is_array($fiveprayer_pruned['value'] ?? null) ? $fiveprayer_pruned['value'] : [];

        fiveprayer_asr2_assert(
            null === fiveprayer_asr2_find_entry($fiveprayer_pruned_names, 'Asr 2', 'en')
                && null === fiveprayer_asr2_find_entry($fiveprayer_pruned_names, 'Asr 2', 'ar'),
            'the translation merge removes the stored “Asr 2” row'
        );
        fiveprayer_asr2_assert(
            is_array(fiveprayer_asr2_find_entry($fiveprayer_pruned_names, 'Hanafi', 'en')),
            'the merge keeps the Hanafi entry it replaced it with'
        );

        // A save from the editor must not write the retired key back either.
        wp_set_current_user(1);
        $fiveprayer_post = new \WP_REST_Request('POST', '/fiveprayer/v1/translations');
        $fiveprayer_post->set_header('content-type', 'application/json');
        $fiveprayer_post->set_body(wp_json_encode([
            'prayer_names' => array_merge($fiveprayer_pruned_names, [[
                'original_text'   => 'Asr 2',
                'translated_text' => 'Written back by the editor',
                'language_code'   => 'en',
                'language_name'   => 'English',
            ]]),
        ]));
        $fiveprayer_post_status = rest_do_request($fiveprayer_post)->get_status();

        $fiveprayer_after_post = fiveprayer_asr2_read_meta('prayer_names');
        $fiveprayer_after_names = is_array($fiveprayer_after_post['value'] ?? null) ? $fiveprayer_after_post['value'] : [];

        fiveprayer_asr2_assert(
            200 === $fiveprayer_post_status,
            'an administrator can save the prayer names'
        );
        fiveprayer_asr2_assert(
            null === fiveprayer_asr2_find_entry($fiveprayer_after_names, 'Asr 2', 'en'),
            'saving the prayer names does not write the retired “Asr 2” row back'
        );
    } finally {
        fiveprayer_asr2_write_meta('prayer_names', $fiveprayer_original_names);
        wp_set_current_user(0);
    }

    // ── 2c. The merge keeps the chosen language and reaches every language ──
    // `activeLanguage` is one saved choice, not a list of entries, and a
    // language the mosque added itself only carries the names that existed
    // when it was created. The additive merge used to lose both, leaving the
    // timetable in English while the Translate screen said otherwise.
    $fiveprayer_language_saved = fiveprayer_asr2_read_meta('activeLanguage');

    if (!$fiveprayer_language_saved || !is_array($fiveprayer_original_names)) {
        fiveprayer_asr2_skip('no activeLanguage / prayer_names rows to check the merge against');
    } else {
        try {
            // An install that added Urdu before the Hanafi name shipped: every
            // other name has an Urdu row, “Hanafi” does not.
            $fiveprayer_multilingual = [];
            foreach ($fiveprayer_original_names as $fiveprayer_entry) {
                $fiveprayer_multilingual[] = $fiveprayer_entry;

                $fiveprayer_is_hanafi = 0 === strcasecmp((string) ($fiveprayer_entry['original_text'] ?? ''), 'Hanafi');
                if ('en' === ($fiveprayer_entry['language_code'] ?? '') && !$fiveprayer_is_hanafi) {
                    $fiveprayer_multilingual[] = [
                        'original_text'   => $fiveprayer_entry['original_text'],
                        'translated_text' => $fiveprayer_entry['original_text'],
                        'language_code'   => 'ur',
                        'language_name'   => 'Urdu',
                    ];
                }
            }

            fiveprayer_asr2_write_meta('prayer_names', $fiveprayer_multilingual);
            fiveprayer_asr2_write_meta('activeLanguage', [['language_code' => 'ur']]);

            (new \FivePrayer\Core\Database\SchemaHelper())->insertDefaultTranslations();

            $fiveprayer_language_after = fiveprayer_asr2_read_meta('activeLanguage');
            $fiveprayer_names_after   = fiveprayer_asr2_read_meta('prayer_names');
            $fiveprayer_after_list    = is_array($fiveprayer_names_after['value'] ?? null)
                ? $fiveprayer_names_after['value']
                : [];

            fiveprayer_asr2_assert(
                'ur' === (string) ($fiveprayer_language_after['value'][0]['language_code'] ?? ''),
                'the defaults merge keeps the language the mosque chose'
            );

            fiveprayer_asr2_assert(
                is_array(fiveprayer_asr2_find_entry($fiveprayer_after_list, 'Hanafi', 'ur')),
                'a language added before the name shipped gains the Hanafi entry'
            );

            fiveprayer_asr2_assert(
                is_array(fiveprayer_asr2_find_entry($fiveprayer_after_list, 'Hanafi', 'en'))
                    && is_array(fiveprayer_asr2_find_entry($fiveprayer_after_list, 'Hanafi', 'ar')),
                'the shipped English and Arabic Hanafi rows survive the merge'
            );

            fiveprayer_asr2_assert(
                is_array(fiveprayer_asr2_find_entry($fiveprayer_after_list, 'Asr', 'ur')),
                "every name the mosque's language already had is still there"
            );
        } finally {
            fiveprayer_asr2_write_meta('prayer_names', $fiveprayer_original_names);
            fiveprayer_asr2_write_meta('activeLanguage', $fiveprayer_language_saved['value']);
            fiveprayer_asr2_clear_meta_cache();
        }
    }

    // ── 3. The rendered tables print the edited label ──────────────────────
    require_once __DIR__ . '/fixtures/timetable-fixture.php';

    $fiveprayer_today   = wp_date('Y-m-d');
    $fiveprayer_month   = (int) wp_date('n');
    $fiveprayer_table   = fiveprayer_fixture_timetable_table();
    global $wpdb;

    $fiveprayer_seeded  = fiveprayer_fixture_seed_month($fiveprayer_month);
    $fiveprayer_today_row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $wpdb->prepare('SELECT * FROM %i WHERE date = %s', $fiveprayer_table, $fiveprayer_today)
    );
    $fiveprayer_today_added = false;

    if (!$fiveprayer_today_row) {
        // The fixture seeds the 1st and 2nd; the Vertical Today table needs the
        // current date, so copy one seeded day onto today and remove it after.
        $fiveprayer_clone = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $wpdb->prepare('SELECT * FROM %i ORDER BY date ASC LIMIT 1', $fiveprayer_table)
        );

        if ($fiveprayer_clone) {
            $fiveprayer_clone = (array) $fiveprayer_clone;
            unset($fiveprayer_clone['id']);
            $fiveprayer_clone['date']               = $fiveprayer_today;
            $fiveprayer_clone['asr_second_begins']  = '16:44:00';
            $wpdb->insert($fiveprayer_table, $fiveprayer_clone); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $fiveprayer_today_added = true;
            fiveprayer_asr2_clear_meta_cache();
        }
    }

    /**
     * Render the Vertical Today table with a fresh instance.
     *
     * Production reads the translations once per request (the shortcode object
     * is built at bootstrap), so the label follows whatever was stored at the
     * start of the request. This test changes them mid-process, so it rebuilds
     * the object — and the settings singleton it reads — to imitate the next
     * request rather than a stale one.
     *
     * @return string Rendered markup.
     */
    $fiveprayer_render_vertical = static function () {
        \FivePrayer\Core\ShortCodes\ShortCodesSinglePrayers::resetInstance();

        $fiveprayer_vdp = new \FivePrayer\Core\ShortCodes\ShortCodeVerticalDailyPrayer();
        add_shortcode('Fp_Vertical_Daily_Prayer', [$fiveprayer_vdp, 'renderPrayerTable']);

        return do_shortcode('[Fp_Vertical_Daily_Prayer]');
    };

    $fiveprayer_locale_row    = fiveprayer_asr2_read_meta('hijralocale');
    $fiveprayer_layout_row    = fiveprayer_asr2_read_meta('timetable_layout');
    $fiveprayer_vertical_row  = fiveprayer_asr2_read_meta('vertical_today_layout');
    // A never-saved install stores an empty activeLanguage; selecting one is
    // what the Translate screen does on save, and the readers need it.
    $fiveprayer_language_row  = fiveprayer_asr2_read_meta('activeLanguage');
    $fiveprayer_label         = 'Hanafi (custom)';
    $fiveprayer_custom_names  = fiveprayer_asr2_with_label(
        is_array($fiveprayer_original_names) ? $fiveprayer_original_names : [],
        $fiveprayer_active_lang,
        $fiveprayer_label
    );

    try {
        $fiveprayer_locale = is_array($fiveprayer_locale_row['value'] ?? null) ? $fiveprayer_locale_row['value'] : [];
        $fiveprayer_locale['isActive']  = true;
        $fiveprayer_locale['customLan'] = true;

        $fiveprayer_layout = is_array($fiveprayer_layout_row['value'] ?? null) ? $fiveprayer_layout_row['value'] : [];
        $fiveprayer_layout['showAsr2'] = true;

        $fiveprayer_vertical = is_array($fiveprayer_vertical_row['value'] ?? null) ? $fiveprayer_vertical_row['value'] : [];
        $fiveprayer_vertical['showAsr2'] = true;

        fiveprayer_asr2_write_meta('prayer_names', $fiveprayer_custom_names);
        fiveprayer_asr2_write_meta('activeLanguage', [['language_code' => $fiveprayer_active_lang]]);
        fiveprayer_asr2_write_meta('hijralocale', $fiveprayer_locale);
        fiveprayer_asr2_write_meta('timetable_layout', $fiveprayer_layout);
        fiveprayer_asr2_write_meta('vertical_today_layout', $fiveprayer_vertical);

        $fiveprayer_month_html = do_shortcode('[Fp_TimeTable_Monthly]');
        fiveprayer_asr2_assert(
            false !== strpos($fiveprayer_month_html, esc_html($fiveprayer_label)),
            'the monthly timetable prints the translated Hanafi column label'
        );

        $fiveprayer_vertical_html = $fiveprayer_render_vertical();
        fiveprayer_asr2_assert(
            false !== strpos($fiveprayer_vertical_html, esc_html($fiveprayer_label)),
            'the Vertical Today table prints the translated Hanafi row label'
        );
        fiveprayer_asr2_assert(
            false === strpos($fiveprayer_vertical_html, '>Hanafi<'),
            'the Vertical Today table no longer prints the untranslated Hanafi label'
        );

        // With the custom language off the label is the untranslated “Hanafi”.
        $fiveprayer_locale['customLan'] = false;
        fiveprayer_asr2_write_meta('hijralocale', $fiveprayer_locale);

        $fiveprayer_fallback_html = do_shortcode('[Fp_TimeTable_Monthly]');
        fiveprayer_asr2_assert(
            false !== strpos($fiveprayer_fallback_html, '>Hanafi<'),
            'the monthly timetable prints “Hanafi” when the custom language is off'
        );

        $fiveprayer_default_vertical = $fiveprayer_render_vertical();
        fiveprayer_asr2_assert(
            false !== strpos($fiveprayer_default_vertical, '>Hanafi<'),
            'the Vertical Today table prints “Hanafi” when the custom language is off'
        );
    } finally {
        fiveprayer_asr2_write_meta('prayer_names', $fiveprayer_original_names);

        if ($fiveprayer_language_row) {
            fiveprayer_asr2_write_meta('activeLanguage', $fiveprayer_language_row['value']);
        }
        if ($fiveprayer_locale_row) {
            fiveprayer_asr2_write_meta('hijralocale', $fiveprayer_locale_row['value']);
        }
        if ($fiveprayer_layout_row) {
            fiveprayer_asr2_write_meta('timetable_layout', $fiveprayer_layout_row['value']);
        }
        if ($fiveprayer_vertical_row) {
            fiveprayer_asr2_write_meta('vertical_today_layout', $fiveprayer_vertical_row['value']);
        } else {
            $wpdb->delete($wpdb->prefix . 'fp_prayer_settings_meta', ['meta-key' => 'vertical_today_layout']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            fiveprayer_asr2_clear_meta_cache();
        }

        if ($fiveprayer_today_added) {
            $wpdb->delete($fiveprayer_table, ['date' => $fiveprayer_today]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        }
        if (!empty($fiveprayer_seeded)) {
            fiveprayer_fixture_remove_rows($fiveprayer_seeded);
        }
    }
}

echo $fiveprayer_asr2_failures > 0
    ? esc_html("\nFAILED: {$fiveprayer_asr2_failures} check(s)\n")
    : esc_html("\nPASS: all Hanafi translation checks\n");

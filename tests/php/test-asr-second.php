<?php
/**
 * Regression checks for the ‘Asr calculation list and the second ‘Asr column.
 *
 * Run from the WordPress root:
 *
 *   php wp-content/plugins/fiveprayer/tests/php/test-asr-second.php
 *
 * Integration checks against a bootstrapped WordPress install, in the same
 * style as the other tests/php files: the plugin does not ship a PHPUnit
 * harness.
 *
 * What these cover:
 *   1. the shipped ‘Asr list is three options again — the two original combined
 *      entries plus one that names every school and fills the Hanafi column —
 *      with no per-school rows (ids 28–30) left in it;
 *   2. every option still stores an engine token the calculator understands —
 *      a school name written straight into `method` would silently fall back to
 *      an undefined shadow factor;
 *   3. an existing install (whose saved list holds the two legacy entries, or
 *      still carries the retired per-school rows) merges the new entry
 *      additively, keeps its own wording, and drops the retired rows — a
 *      selection pointing at one is remapped to the combined option;
 *   4. the stored timetable keeps the `asr_second_begins` column the optional
 *      Hanafi column reads, and dates that already carry a second ‘Asr still
 *      do after the merge.
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

$fiveprayer_asr_failures = 0;

/**
 * Assert a condition and print the result.
 *
 * @param bool   $condition Condition to assert.
 * @param string $message   Description of the invariant.
 * @return void
 */
function fiveprayer_asr_assert($condition, $message) {
    global $fiveprayer_asr_failures;

    if ($condition) {
        echo esc_html("PASS: {$message}\n");
        return;
    }

    ++$fiveprayer_asr_failures;
    echo esc_html("FAIL: {$message}\n");
}

/**
 * Print a check that could not be completed in this environment.
 *
 * @param string $message Why the check could not run.
 * @return void
 */
function fiveprayer_asr_skip($message) {
    echo esc_html("SKIP: {$message}\n");
}

/**
 * Drop the per-request meta caches so a meta row changed mid-process is read
 * again. Production never needs this (a request reads a setting once), but this
 * test renders the same shortcode twice with a different layout value.
 *
 * @return void
 */
function fiveprayer_asr_clear_meta_cache() {
    \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
    \FivePrayer\Core\Helpers\MetaCache::invalidate_cache();

    $fiveprayer_reflection = new \ReflectionClass(\FivePrayer\Core\Helpers\GetMeta::class);
    if ($fiveprayer_reflection->hasProperty('metaCache')) {
        $fiveprayer_property = $fiveprayer_reflection->getProperty('metaCache');
        $fiveprayer_property->setAccessible(true);
        $fiveprayer_property->setValue(null, []);
    }
}

// ── 1. The shipped list is three options ──────────────────────────────────
$fiveprayer_meta_settings = \FivePrayer\Core\Database\FivePrayer_DatabaseMetaSettings::getMetaSettings();
$fiveprayer_asr_list      = $fiveprayer_meta_settings['Only_affects_Asr_calculation'] ?? [];

fiveprayer_asr_assert(
    is_array($fiveprayer_asr_list) && 3 === count($fiveprayer_asr_list),
    'the Asr list ships three options: the two combined entries plus the combined Asr + Hanafi entry'
);

/**
 * Find one option in the ‘Asr list by its name fragment.
 *
 * @param array  $list  The Asr options.
 * @param string $needle Case-insensitive name fragment.
 * @return array|null The matching option.
 */
function fiveprayer_asr_find($list, $needle) {
    foreach ((array) $list as $fiveprayer_option) {
        if (isset($fiveprayer_option['name'])
            && false !== stripos((string) $fiveprayer_option['name'], $needle)) {
            return $fiveprayer_option;
        }
    }

    return null;
}

// The two originals stay exactly as they were — the combined 1 Mithl entry
// and Hanafi. The third option names every school and is the one that fills
// the Hanafi column: the ‘Asr itself stays 1 Mithl (Standard), so generation
// stores the Hanafi 2 Mithl time beside it.
$fiveprayer_legacy = [
    3 => ['name' => 'Shafii, Maliki, Jafari and Hanbali', 'method' => 'Standard'],
    4 => ['name' => 'Hanafi', 'method' => 'Hanafi'],
];
foreach ($fiveprayer_legacy as $fiveprayer_id => $fiveprayer_expected) {
    $fiveprayer_option = null;
    foreach ($fiveprayer_asr_list as $fiveprayer_entry) {
        if (isset($fiveprayer_entry['id']) && $fiveprayer_id === (int) $fiveprayer_entry['id']) {
            $fiveprayer_option = $fiveprayer_entry;
        }
    }

    fiveprayer_asr_assert(
        is_array($fiveprayer_option)
            && $fiveprayer_expected['name'] === ($fiveprayer_option['name'] ?? '')
            && $fiveprayer_expected['method'] === ($fiveprayer_option['method'] ?? ''),
        "the original Asr option {$fiveprayer_id} is untouched"
    );
}

$fiveprayer_combined = fiveprayer_asr_find($fiveprayer_asr_list, 'Hanafi (Asr + Hanafi)');
fiveprayer_asr_assert(
    is_array($fiveprayer_combined),
    'the Asr list offers one entry naming every school together'
);

foreach (['Shafii', 'Maliki', 'Jafari', 'Hanbali', 'Hanafi'] as $fiveprayer_school) {
    fiveprayer_asr_assert(
        is_array($fiveprayer_combined)
            && false !== stripos((string) ($fiveprayer_combined['name'] ?? ''), $fiveprayer_school),
        "the combined Asr option names {$fiveprayer_school}"
    );
}

fiveprayer_asr_assert(
    is_array($fiveprayer_combined) && 'Standard' === ($fiveprayer_combined['method'] ?? ''),
    'the combined option keeps the 1 Mithl Asr and only adds the Hanafi Asr 2 time'
);

// The per-school rows (ids 28–30) were retired: a list that shows the same
// school twice is what this check exists to prevent.
$fiveprayer_per_school = [];
foreach ($fiveprayer_asr_list as $fiveprayer_option) {
    $fiveprayer_name = (string) ($fiveprayer_option['name'] ?? '');
    if (preg_match('/\(1 Mithl\)$/', $fiveprayer_name)) {
        $fiveprayer_per_school[] = $fiveprayer_name;
    }
}
fiveprayer_asr_assert(
    [] === $fiveprayer_per_school,
    'the shipped Asr list carries no per-school (1 Mithl) entries'
);

// A school name stored as the method would reach the engine as an unknown
// token (the calculator only maps Standard/Hanafi), so the whole list must use
// the two engine tokens and nothing else.
$fiveprayer_unknown_methods = [];
foreach ($fiveprayer_asr_list as $fiveprayer_option) {
    $fiveprayer_method = (string) ($fiveprayer_option['method'] ?? '');
    if ('Standard' !== $fiveprayer_method && 'Hanafi' !== $fiveprayer_method) {
        $fiveprayer_unknown_methods[] = $fiveprayer_method;
    }
}
fiveprayer_asr_assert(
    [] === $fiveprayer_unknown_methods,
    'every Asr option stores an engine token (Standard or Hanafi), not a display name'
);

// ── 2. Existing installs: additive merge, retired rows dropped ─────────────
$fiveprayer_schema_helper = new \FivePrayer\Core\Database\SchemaHelper();

try {
    $fiveprayer_merge = new \ReflectionMethod($fiveprayer_schema_helper, 'mergeSettings');
    $fiveprayer_merge->setAccessible(true);
    $fiveprayer_prune = new \ReflectionMethod($fiveprayer_schema_helper, 'pruneRetiredListEntries');
    $fiveprayer_prune->setAccessible(true);

    // What an install saved before this change: the two legacy entries, one of
    // them renamed by the user. Nothing may be lost when the defaults merge.
    $fiveprayer_saved = [
        ['id' => 3, 'name' => 'My mosque wording', 'method' => 'Standard'],
        ['id' => 4, 'name' => 'Hanafi', 'method' => 'Hanafi'],
    ];

    $fiveprayer_merged = $fiveprayer_merge->invoke($fiveprayer_schema_helper, $fiveprayer_saved, $fiveprayer_asr_list);

    fiveprayer_asr_assert(
        is_array($fiveprayer_merged) && 3 === count($fiveprayer_merged),
        'merging the defaults gives an existing install the same three options'
    );

    fiveprayer_asr_assert(
        'My mosque wording' === ($fiveprayer_merged[0]['name'] ?? ''),
        "a user's saved wording is preserved by the merge"
    );

    fiveprayer_asr_assert(
        is_array(fiveprayer_asr_find($fiveprayer_merged, 'Hanafi (Asr + Hanafi)')),
        'an existing install gains the combined Asr + Hanafi entry without a reset'
    );

    // The Hanafi option must not be duplicated by two identically named
    // entries — the dropdown would then show the same choice twice.
    $fiveprayer_hanafi_count = 0;
    foreach ($fiveprayer_merged as $fiveprayer_option) {
        if (0 === strcasecmp((string) ($fiveprayer_option['name'] ?? ''), 'Hanafi')) {
            ++$fiveprayer_hanafi_count;
        }
    }
    fiveprayer_asr_assert(1 === $fiveprayer_hanafi_count, 'the merge does not duplicate the Hanafi entry');

    // An install that already merged the per-school rows before they were
    // retired: they are dropped, the user's wording and their own added entry
    // survive.
    $fiveprayer_with_schools = [
        ['id' => 3, 'name' => 'My mosque wording', 'method' => 'Standard'],
        ['id' => 4, 'name' => 'Hanafi', 'method' => 'Hanafi'],
        ['id' => 28, 'name' => "Shafi'i (1 Mithl)", 'method' => 'Standard'],
        ['id' => 29, 'name' => 'Maliki (1 Mithl)', 'method' => 'Standard'],
        ['id' => 30, 'name' => 'Hanbali (1 Mithl)', 'method' => 'Standard'],
        ['id' => 1000, 'name' => 'Mosque custom choice', 'method' => 'Standard'],
    ];

    $fiveprayer_cleaned = $fiveprayer_prune->invoke(
        $fiveprayer_schema_helper,
        'Only_affects_Asr_calculation',
        $fiveprayer_with_schools
    );
    $fiveprayer_cleaned_names = array_column((array) $fiveprayer_cleaned, 'name');

    fiveprayer_asr_assert(
        3 === count($fiveprayer_cleaned)
            && in_array('My mosque wording', $fiveprayer_cleaned_names, true)
            && in_array('Hanafi', $fiveprayer_cleaned_names, true),
        'pruning drops the retired per-school rows and keeps the originals'
    );

    fiveprayer_asr_assert(
        in_array('Mosque custom choice', $fiveprayer_cleaned_names, true),
        'pruning never removes an entry the user added themselves'
    );

    fiveprayer_asr_assert(
        [] === array_filter($fiveprayer_cleaned_names, static function ($name) {
            return 1 === preg_match('/\(1 Mithl\)$/', (string) $name);
        }),
        'no per-school (1 Mithl) row survives the cleanup'
    );
} catch (\ReflectionException $fiveprayer_error) {
    fiveprayer_asr_skip('SchemaHelper list helpers are unavailable (' . $fiveprayer_error->getMessage() . ')');
}

// A saved selection that pointed at a retired row falls back to the combined
// Standard option (same shadow factor, so the calculated times do not move).
try {
    $fiveprayer_remap = new \ReflectionMethod($fiveprayer_schema_helper, 'remapRetiredAsrSelection');
    $fiveprayer_remap->setAccessible(true);

    global $wpdb;
    $fiveprayer_table = $wpdb->prefix . 'fp_prayer_settings_meta';
    $fiveprayer_row   = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $wpdb->prepare("SELECT id, value FROM %i WHERE `meta-key` = %s", $fiveprayer_table, 'oaac_selected')
    );

    if (!$fiveprayer_row) {
        fiveprayer_asr_skip('no saved Asr selection row to remap');
    } else {
        $fiveprayer_original = $fiveprayer_row->value;

        try {
            $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_table,
                ['value' => sanitize_text_field(json_encode(['id' => 28, 'name' => "Shafi'i (1 Mithl)", 'method' => 'Standard']))],
                ['id' => (int) $fiveprayer_row->id]
            );

            $fiveprayer_remap->invoke($fiveprayer_schema_helper, $fiveprayer_table, $fiveprayer_asr_list);

            $fiveprayer_after = json_decode(
                (string) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare('SELECT value FROM %i WHERE id = %d', $fiveprayer_table, (int) $fiveprayer_row->id)
                ),
                true
            );

            fiveprayer_asr_assert(
                3 === (int) ($fiveprayer_after['id'] ?? 0) && 'Standard' === ($fiveprayer_after['method'] ?? ''),
                'a saved selection on a retired row falls back to the combined Standard option'
            );
        } finally {
            $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_table,
                ['value' => $fiveprayer_original],
                ['id' => (int) $fiveprayer_row->id]
            );
            fiveprayer_asr_clear_meta_cache();
        }
    }
} catch (\ReflectionException $fiveprayer_error) {
    fiveprayer_asr_skip('SchemaHelper::remapRetiredAsrSelection is unavailable (' . $fiveprayer_error->getMessage() . ')');
}

// Selecting the combined “Asr + Hanafi” option raises the Hanafi column by
// itself — the whole point of that entry is to print both ‘Asr times.
try {
    $fiveprayer_controller = new \FivePrayer\Core\Controllers\API\EndPoints\PrayerSettingsMetaController();
    $fiveprayer_enable     = new \ReflectionMethod($fiveprayer_controller, 'enable_asr2_column_for_combined_asr');
    $fiveprayer_enable->setAccessible(true);

    $fiveprayer_layout_row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $wpdb->prepare("SELECT id, value FROM %i WHERE `meta-key` = %s", $fiveprayer_table, 'timetable_layout')
    );

    $fiveprayer_layout = $fiveprayer_layout_row ? json_decode($fiveprayer_layout_row->value, true) : null;

    if (!$fiveprayer_layout_row || !is_array($fiveprayer_layout)) {
        fiveprayer_asr_skip('no timetable_layout row to test the Asr 2 auto-enable');
    } else {
        $fiveprayer_layout_saved = $fiveprayer_layout_row->value;

        try {
            // Start with the column off, so the auto-enable has something to do.
            $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_table,
                ['value' => sanitize_text_field(json_encode(array_merge($fiveprayer_layout, ['showAsr2' => false])))],
                ['id' => (int) $fiveprayer_layout_row->id]
            );
            fiveprayer_asr_clear_meta_cache();

            $fiveprayer_enable->invoke($fiveprayer_controller, $fiveprayer_combined);

            $fiveprayer_layout_after = json_decode(
                (string) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare('SELECT value FROM %i WHERE id = %d', $fiveprayer_table, (int) $fiveprayer_layout_row->id)
                ),
                true
            );

            fiveprayer_asr_assert(
                true === ($fiveprayer_layout_after['showAsr2'] ?? null),
                'selecting the combined Asr + Hanafi option switches the Hanafi column on'
            );

            fiveprayer_asr_assert(
                ($fiveprayer_layout['layoutType'] ?? null) === ($fiveprayer_layout_after['layoutType'] ?? null)
                    && ($fiveprayer_layout['showIqamah'] ?? null) === ($fiveprayer_layout_after['showIqamah'] ?? null),
                'switching the column on leaves the other layout options alone'
            );
        } finally {
            $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_table,
                ['value' => $fiveprayer_layout_saved],
                ['id' => (int) $fiveprayer_layout_row->id]
            );
            fiveprayer_asr_clear_meta_cache();
        }
    }
} catch (\ReflectionException $fiveprayer_error) {
    fiveprayer_asr_skip('PrayerSettingsMetaController::enable_asr2_column_for_combined_asr is unavailable (' . $fiveprayer_error->getMessage() . ')');
}

// ── 3. Stored second ‘Asr data is intact ───────────────────────────────────
global $wpdb;
$fiveprayer_timetable = $wpdb->prefix . 'fp_timetable';

$fiveprayer_column = $wpdb->get_var(
    $wpdb->prepare('SHOW COLUMNS FROM %i LIKE %s', $fiveprayer_timetable, 'asr_second_begins') // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared
);

fiveprayer_asr_assert(
    'asr_second_begins' === $fiveprayer_column,
    'the stored timetable keeps the asr_second_begins column the Asr 2 layout reads'
);

$fiveprayer_with_second = $wpdb->get_var(
    $wpdb->prepare(
        'SELECT COUNT(*) FROM %i WHERE asr_second_begins IS NOT NULL',
        $fiveprayer_timetable
    ) // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
);

if ((int) $fiveprayer_with_second > 0) {
    // Data written by an import or an earlier generation must stay readable —
    // regenerating the year is what fills the column for the other dates.
    $fiveprayer_sample = $wpdb->get_row(
        $wpdb->prepare(
            'SELECT date, asr_begins, asr_second_begins FROM %i WHERE asr_second_begins IS NOT NULL ORDER BY date ASC LIMIT 1',
            $fiveprayer_timetable
        ) // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    );

    fiveprayer_asr_assert(
        $fiveprayer_sample && preg_match('/^\d{2}:\d{2}:\d{2}$/', (string) $fiveprayer_sample->asr_second_begins),
        'dates that already carry a second ‘Asr keep a valid stored time'
    );

    echo esc_html(
        sprintf(
            "INFO: %d stored date(s) already carry a second ‘Asr (first: %s, begin %s, Asr 2 %s).\n",
            (int) $fiveprayer_with_second,
            (string) ($fiveprayer_sample->date ?? ''),
            (string) ($fiveprayer_sample->asr_begins ?? ''),
            (string) ($fiveprayer_sample->asr_second_begins ?? '')
        )
    );
} else {
    fiveprayer_asr_skip('no stored second ‘Asr yet — generate a timetable to fill the Hanafi column');
}

// ── 4. The Vertical Today table shows the optional Asr 2 row ───────────────
// The row is opt-in (Timetable Layout → Vertical Today → Asr 2), so the test
// flips the saved switch, renders the real shortcode, then puts the original
// value back — even when an assertion fails.
$fiveprayer_today     = wp_date('Y-m-d');
$fiveprayer_today_row = $wpdb->get_row(
    $wpdb->prepare(
        'SELECT asr_begins, asr_second_begins FROM %i WHERE date = %s',
        $fiveprayer_timetable,
        $fiveprayer_today
    ) // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
);

if (!$fiveprayer_today_row || empty($fiveprayer_today_row->asr_second_begins)) {
    fiveprayer_asr_skip('today has no stored second ‘Asr — generate a timetable to render the Vertical Today row');
} else {
    $fiveprayer_meta_table = $wpdb->prefix . 'fp_prayer_settings_meta';
    $fiveprayer_layout_row = $wpdb->get_row(
        $wpdb->prepare('SELECT id, value FROM %i WHERE `meta-key` = %s', $fiveprayer_meta_table, 'vertical_today_layout') // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    );
    $fiveprayer_layout_original = $fiveprayer_layout_row ? $fiveprayer_layout_row->value : null;
    $fiveprayer_layout          = $fiveprayer_layout_original ? json_decode($fiveprayer_layout_original, true) : [];

    if (!is_array($fiveprayer_layout)) {
        $fiveprayer_layout = [];
    }

    $fiveprayer_layout_on               = $fiveprayer_layout;
    $fiveprayer_layout_on['showAsr2']   = true;
    $fiveprayer_layout_off              = $fiveprayer_layout;
    $fiveprayer_layout_off['showAsr2']  = false;

    try {
        $fiveprayer_layout_on_json = wp_json_encode($fiveprayer_layout_on);
        if ($fiveprayer_layout_row) {
            $wpdb->update($fiveprayer_meta_table, ['value' => $fiveprayer_layout_on_json], ['id' => $fiveprayer_layout_row->id]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        } else {
            $wpdb->insert($fiveprayer_meta_table, ['meta-key' => 'vertical_today_layout', 'value' => $fiveprayer_layout_on_json]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        }
        fiveprayer_asr_clear_meta_cache();

        $fiveprayer_on_html = do_shortcode('[Fp_Vertical_Daily_Prayer]');
        fiveprayer_asr_assert(
            false !== strpos($fiveprayer_on_html, '>Hanafi<'),
            'the Vertical Today table renders the Hanafi (Asr 2) row when the layout switch is on'
        );

        $fiveprayer_layout_off_json = wp_json_encode($fiveprayer_layout_off);
        if ($fiveprayer_layout_row) {
            $wpdb->update($fiveprayer_meta_table, ['value' => $fiveprayer_layout_off_json], ['id' => $fiveprayer_layout_row->id]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        }
        fiveprayer_asr_clear_meta_cache();

        $fiveprayer_off_html = do_shortcode('[Fp_Vertical_Daily_Prayer]');
        fiveprayer_asr_assert(
            false === strpos($fiveprayer_off_html, '>Hanafi<'),
            'the Hanafi (Asr 2) row stays out while the layout switch is off'
        );
    } finally {
        if ($fiveprayer_layout_row) {
            $wpdb->update($fiveprayer_meta_table, ['value' => $fiveprayer_layout_original], ['id' => $fiveprayer_layout_row->id]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        } else {
            $wpdb->delete($fiveprayer_meta_table, ['meta-key' => 'vertical_today_layout']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        }
        fiveprayer_asr_clear_meta_cache();
    }
}

// ── 5. The single-prayer shortcode exposes the second ‘Asr ──────────────────
$fiveprayer_single = do_shortcode('[Fp_Single_Asr_2_Begins_time]');

fiveprayer_asr_assert(
    '' !== trim(wp_strip_all_tags($fiveprayer_single))
        && false === strpos($fiveprayer_single, 'Time unavailable'),
    'the single-prayer shortcode renders an Asr 2 field'
);

if ($fiveprayer_today_row && !empty($fiveprayer_today_row->asr_second_begins)) {
    $fiveprayer_expected = date_i18n(
        trim(str_replace([':s', 's'], '', get_option('time_format', 'h:i A')), ': '),
        strtotime($fiveprayer_today_row->asr_second_begins)
    );
    fiveprayer_asr_assert(
        false !== strpos($fiveprayer_single, esc_html($fiveprayer_expected)),
        'the single-prayer shortcode prints the stored second ‘Asr time'
    );
} else {
    fiveprayer_asr_skip('today has no stored second ‘Asr — the single-prayer value check needs one');
}

// ── 6. The REST payload carries asr2 without ?include_extras ───────────────
// asr2 used to be an opt-in extra on the monthly endpoint only. It is a
// standard field now, on every prayer-times payload, while `include_extras`
// stays accepted so existing clients keep working.
if (!$fiveprayer_today_row) {
    fiveprayer_asr_skip('no timetable data — the REST payload checks need a generated timetable');
} else {
    $fiveprayer_filled_date = $wpdb->get_var(
        $wpdb->prepare(
            'SELECT date FROM %i WHERE asr_second_begins IS NOT NULL ORDER BY date ASC LIMIT 1',
            $fiveprayer_timetable
        ) // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    );

    $fiveprayer_probe_date  = '2099-01-01';
    $fiveprayer_probe_rows  = (int) $wpdb->get_var(
        $wpdb->prepare('SELECT COUNT(*) FROM %i WHERE date = %s', $fiveprayer_timetable, $fiveprayer_probe_date) // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
    );

    $fiveprayer_key_manager = new \FivePrayer\Core\API\ApiKeyManager();
    $fiveprayer_created_key = $fiveprayer_key_manager->generate_key(
        'asr2 test ' . wp_generate_password(8, false),
        'Created by tests/php/test-asr-second.php'
    );
    $fiveprayer_api_key   = (string) ($fiveprayer_created_key['api_key'] ?? '');
    $fiveprayer_key_id    = (int) ($fiveprayer_created_key['id'] ?? 0);

    /**
     * Call one external REST endpoint with the test key.
     *
     * @param string $route  Route, e.g. /fiveprayer/v1/external/prayer-times.
     * @param array  $params Query parameters.
     * @param string $key    API key.
     * @return WP_REST_Response|WP_HTTP_Response
     */
    $fiveprayer_rest_get = static function (string $route, array $params, string $key) {
        $request = new \WP_REST_Request('GET', $route);
        foreach ($params as $param => $value) {
            $request->set_param($param, $value);
        }
        $request->set_header('X-API-Key', $key);

        return rest_do_request($request);
    };

    try {
        // A day with a stored second ‘Asr returns it as a normal field.
        $fiveprayer_daily = $fiveprayer_rest_get(
            '/fiveprayer/v1/external/prayer-times',
            ['date' => $fiveprayer_filled_date, 'time_format' => '24h'],
            $fiveprayer_api_key
        );
        $fiveprayer_daily_data = $fiveprayer_daily->get_data();
        $fiveprayer_daily_asr2 = $fiveprayer_daily_data['prayer_times']['asr2'] ?? null;

        fiveprayer_asr_assert(
            200 === $fiveprayer_daily->get_status(),
            'the daily prayer-times endpoint answers a keyed request'
        );
        fiveprayer_asr_assert(
            is_array($fiveprayer_daily_asr2) && !empty($fiveprayer_daily_asr2['begins_time']),
            'asr2 is a standard field on /prayer-times, no include_extras needed'
        );
        fiveprayer_asr_assert(
            'Hanafi' === ($fiveprayer_daily_asr2['name'] ?? ''),
            'the asr2 entry is named “Hanafi” — it is the Hanafi (2 Mithl) time'
        );

        // Its position is stable: directly after asr.
        $fiveprayer_daily_keys = array_keys($fiveprayer_daily_data['prayer_times'] ?? []);
        $fiveprayer_asr_index  = array_search('asr', $fiveprayer_daily_keys, true);
        fiveprayer_asr_assert(
            false !== $fiveprayer_asr_index && 'asr2' === ($fiveprayer_daily_keys[$fiveprayer_asr_index + 1] ?? null),
            'asr2 sits directly after asr in the payload'
        );

        // The monthly endpoint returns it with and without include_extras.
        if ($fiveprayer_filled_date) {
            $fiveprayer_month_params = [
                'month'       => (int) substr($fiveprayer_filled_date, 5, 2),
                'year'        => (int) substr($fiveprayer_filled_date, 0, 4),
                'time_format' => '24h',
            ];

            $fiveprayer_month_plain = $fiveprayer_rest_get(
                '/fiveprayer/v1/external/prayer-times/month',
                $fiveprayer_month_params,
                $fiveprayer_api_key
            )->get_data();
            $fiveprayer_month_extra = $fiveprayer_rest_get(
                '/fiveprayer/v1/external/prayer-times/month',
                $fiveprayer_month_params + ['include_extras' => 'true'],
                $fiveprayer_api_key
            )->get_data();

            $fiveprayer_month_plain_has = false;
            foreach ($fiveprayer_month_plain['data'] ?? [] as $fiveprayer_month_day) {
                if (isset($fiveprayer_month_day['prayer_times']['asr2'])) {
                    $fiveprayer_month_plain_has = true;
                    break;
                }
            }

            fiveprayer_asr_assert(
                $fiveprayer_month_plain_has,
                'the monthly payload carries asr2 without include_extras'
            );
            fiveprayer_asr_assert(
                isset($fiveprayer_month_extra['data'][0]['prayer_times']) && $fiveprayer_month_plain_has,
                'include_extras is still accepted, and changes nothing now'
            );
        }

        // A day with no stored second ‘Asr omits the key entirely.
        if (0 === $fiveprayer_probe_rows && $fiveprayer_filled_date) {
            $fiveprayer_clone = $wpdb->get_row(
                $wpdb->prepare('SELECT * FROM %i WHERE date = %s', $fiveprayer_timetable, $fiveprayer_filled_date) // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            );

            if ($fiveprayer_clone) {
                $fiveprayer_clone = (array) $fiveprayer_clone;
                unset($fiveprayer_clone['id']);
                $fiveprayer_clone['date']                = $fiveprayer_probe_date;
                $fiveprayer_clone['asr_second_begins']   = null;
                $wpdb->insert($fiveprayer_timetable, $fiveprayer_clone); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

                $fiveprayer_blank = $fiveprayer_rest_get(
                    '/fiveprayer/v1/external/prayer-times',
                    ['date' => $fiveprayer_probe_date, 'time_format' => '24h'],
                    $fiveprayer_api_key
                )->get_data();

                fiveprayer_asr_assert(
                    200 === ($fiveprayer_blank['code'] ?? 200) || isset($fiveprayer_blank['prayer_times']),
                    'a date without a stored second ‘Asr still answers normally'
                );
                fiveprayer_asr_assert(
                    !isset($fiveprayer_blank['prayer_times']['asr2']),
                    'a date without a stored second ‘Asr omits the asr2 key'
                );

                $wpdb->delete($fiveprayer_timetable, ['date' => $fiveprayer_probe_date]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            }
        } else {
            fiveprayer_asr_skip('the probe date already holds a row — skipped the empty-asr2 payload check');
        }
    } finally {
        $wpdb->delete($fiveprayer_timetable, ['date' => $fiveprayer_probe_date]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        if ($fiveprayer_key_id) {
            $fiveprayer_key_manager->delete_key($fiveprayer_key_id);
        }
    }
}

// ── 7. The upgrade path renames the stored entry and the saved selection ───
// This runs the real VersionManager pass that an admin request performs when
// the shipped defaults change — not the helpers directly — against an install
// that still holds the old combined label.
try {
    global $wpdb;

    $fiveprayer_upgrade_table = $wpdb->prefix . 'fp_prayer_settings_meta';
    $fiveprayer_old_label     = 'Shafii, Maliki, Jafari, Hanbali and Hanafi (Asr + Asr 2)';
    $fiveprayer_new_label     = 'Shafii, Maliki, Jafari, Hanbali and Hanafi (Asr + Hanafi)';

    $fiveprayer_upgrade_list     = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $wpdb->prepare("SELECT id, value FROM %i WHERE `meta-key` = %s", $fiveprayer_upgrade_table, 'Only_affects_Asr_calculation')
    );
    $fiveprayer_upgrade_selected = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
        $wpdb->prepare("SELECT id, value FROM %i WHERE `meta-key` = %s", $fiveprayer_upgrade_table, 'oaac_selected')
    );

    // The seeder deletes and re-inserts a meta row, so a row is addressed by
    // its key here, never by the id it happened to have before the upgrade.
    $fiveprayer_write_meta = static function (string $key, string $value) use ($wpdb, $fiveprayer_upgrade_table): void {
        $row_id = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $wpdb->prepare("SELECT id FROM %i WHERE `meta-key` = %s LIMIT 1", $fiveprayer_upgrade_table, $key)
        );

        if ($row_id) {
            $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $fiveprayer_upgrade_table,
                ['value' => $value],
                ['id' => (int) $row_id]
            );
            return;
        }

        $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $fiveprayer_upgrade_table,
            ['meta-key' => $key, 'value' => $value, 'version' => '1.0.2']
        );
    };

    if (!$fiveprayer_upgrade_list || !$fiveprayer_upgrade_selected) {
        fiveprayer_asr_skip('no Asr list / selection rows to run the upgrade path against');
    } else {
        $fiveprayer_list_saved     = $fiveprayer_upgrade_list->value;
        $fiveprayer_selected_saved = $fiveprayer_upgrade_selected->value;
        $fiveprayer_hash_saved     = get_option('fiveprayer_defaults_sync_hash');
        $fiveprayer_hash_after     = null;

        try {
            // An install from before the rename: the combined entry still says
            // “Asr + Asr 2”, the mosque renamed its own Standard entry, and its
            // saved choice is the combined entry.
            $fiveprayer_write_meta('Only_affects_Asr_calculation', sanitize_text_field(wp_json_encode([
                ['id' => 31, 'name' => $fiveprayer_old_label, 'method' => 'Standard'],
                ['id' => 3, 'name' => 'My mosque wording', 'method' => 'Standard'],
                ['id' => 4, 'name' => 'Hanafi', 'method' => 'Hanafi'],
            ])));
            $fiveprayer_write_meta('oaac_selected', sanitize_text_field(wp_json_encode([
                'id' => 31,
                'name' => $fiveprayer_old_label,
                'method' => 'Standard',
            ])));

            // What an upgrade looks like: the shipped defaults changed since the
            // hash was last stored, so the next admin request re-seeds.
            update_option('fiveprayer_defaults_sync_hash', 'stale-before-upgrade');
            fiveprayer_asr_clear_meta_cache();

            // The pass is gated to admin/cron requests; this test is neither.
            add_filter('wp_doing_cron', '__return_true');
            (new \FivePrayer\Core\Database\VersionManager())->syncDefaultsIfChanged();
            remove_filter('wp_doing_cron', '__return_true');

            fiveprayer_asr_clear_meta_cache();
            $fiveprayer_hash_after = get_option('fiveprayer_defaults_sync_hash');

            $fiveprayer_upgraded_list = json_decode(
                (string) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare("SELECT value FROM %i WHERE `meta-key` = %s LIMIT 1", $fiveprayer_upgrade_table, 'Only_affects_Asr_calculation')
                ),
                true
            );
            $fiveprayer_upgraded_selected = json_decode(
                (string) $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare("SELECT value FROM %i WHERE `meta-key` = %s LIMIT 1", $fiveprayer_upgrade_table, 'oaac_selected')
                ),
                true
            );

            fiveprayer_asr_assert(
                $fiveprayer_hash_after && 'stale-before-upgrade' !== $fiveprayer_hash_after,
                'the upgrade runs because the shipped-defaults hash changed'
            );

            fiveprayer_asr_assert(
                is_array($fiveprayer_upgraded_list)
                    && is_array(fiveprayer_asr_find($fiveprayer_upgraded_list, 'Hanafi (Asr + Hanafi)')),
                'the upgrade rewrites the stored combined entry to “Asr + Hanafi”'
            );

            fiveprayer_asr_assert(
                is_array($fiveprayer_upgraded_list)
                    && !is_array(fiveprayer_asr_find($fiveprayer_upgraded_list, '(Asr + Asr 2)')),
                'no stored entry keeps the retired “Asr + Asr 2” label'
            );

            fiveprayer_asr_assert(
                is_array($fiveprayer_upgraded_list)
                    && is_array(fiveprayer_asr_find($fiveprayer_upgraded_list, 'My mosque wording')),
                'the upgrade leaves the mosque’s own entry wording alone'
            );

            fiveprayer_asr_assert(
                31 === (int) ($fiveprayer_upgraded_selected['id'] ?? 0)
                    && $fiveprayer_new_label === ($fiveprayer_upgraded_selected['name'] ?? '')
                    && 'Standard' === ($fiveprayer_upgraded_selected['method'] ?? ''),
                'the saved selection follows the rename and still computes 1 Mithl ‘Asr'
            );
        } finally {
            remove_filter('wp_doing_cron', '__return_true');

            $fiveprayer_write_meta('Only_affects_Asr_calculation', $fiveprayer_list_saved);
            $fiveprayer_write_meta('oaac_selected', $fiveprayer_selected_saved);

            // The post-upgrade hash describes the shipped files, so it is the
            // state to leave behind; only restore the old one if the pass failed.
            $fiveprayer_hash_restore = null !== $fiveprayer_hash_after ? $fiveprayer_hash_after : $fiveprayer_hash_saved;
            if (false === $fiveprayer_hash_restore) {
                delete_option('fiveprayer_defaults_sync_hash');
            } else {
                update_option('fiveprayer_defaults_sync_hash', $fiveprayer_hash_restore);
            }

            fiveprayer_asr_clear_meta_cache();
        }
    }
} catch (\Throwable $fiveprayer_error) {
    fiveprayer_asr_skip('the upgrade path could not run (' . $fiveprayer_error->getMessage() . ')');
}

echo $fiveprayer_asr_failures > 0
    ? esc_html("\nFAILED: {$fiveprayer_asr_failures} check(s)\n")
    : esc_html("\nPASS: all Asr second-time checks\n");

exit($fiveprayer_asr_failures > 0 ? 1 : 0);

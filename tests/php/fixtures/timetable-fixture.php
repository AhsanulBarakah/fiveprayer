<?php
/**
 * Minimal timetable fixture for the PHP integration suites.
 *
 * A fresh WordPress — CI, or a newly installed local site — has no rows in the
 * timetable table. The monthly template then returns before it renders its
 * table, so every check that needs a rendered month (the month switch and the
 * heading colours) could only be skipped.
 *
 * This seeds the smallest useful month: two days of plausible times. Rows are
 * only added to a month that has none, so a site that already carries a
 * timetable is left exactly as it is, and the dates that were added are handed
 * back so the caller can remove them again.
 *
 * @package FivePrayer
 */

defined('ABSPATH') || exit;

/**
 * The name of the timetable table, with the site's own prefix.
 *
 * @return string
 */
function fiveprayer_fixture_timetable_table() {
    global $wpdb;

    return $wpdb->prefix . 'fp_timetable';
}

/**
 * The two dates a seeded month gets: the 1st and the 2nd.
 *
 * @param int $month Month number, 1-12.
 * @return string[] Dates in Y-m-d form.
 */
function fiveprayer_fixture_month_dates($month) {
    $fiveprayer_year = (int) wp_date('Y');

    return [
        sprintf('%04d-%02d-01', $fiveprayer_year, $month),
        sprintf('%04d-%02d-02', $fiveprayer_year, $month),
    ];
}

/**
 * Seed two days into a month that has no rows yet.
 *
 * @param int $month Month number, 1-12.
 * @return string[] The dates that were added (empty when nothing was added).
 */
function fiveprayer_fixture_seed_month($month) {
    global $wpdb;

    if ($month < 1 || $month > 12) {
        return [];
    }

    $fiveprayer_table = fiveprayer_fixture_timetable_table();

    // Without the plugin's table there is nothing to seed, and the suites keep
    // their own skips for that environment.
    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared -- SHOW TABLES has no user input.
    if ($wpdb->get_var($wpdb->prepare('SHOW TABLES LIKE %s', $fiveprayer_table)) !== $fiveprayer_table) {
        return [];
    }

    $fiveprayer_dates = fiveprayer_fixture_month_dates($month);
    $fiveprayer_start = $fiveprayer_dates[0];
    $fiveprayer_end   = gmdate('Y-m-d', strtotime($fiveprayer_start . ' +1 month'));

    // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.PreparedSQL.NotPrepared -- Prepared on the same line.
    $fiveprayer_existing = (int) $wpdb->get_var(
        $wpdb->prepare(
            'SELECT COUNT(*) FROM %i WHERE date >= %s AND date < %s',
            $fiveprayer_table,
            $fiveprayer_start,
            $fiveprayer_end
        )
    );

    if ($fiveprayer_existing > 0) {
        return [];
    }

    $fiveprayer_added = [];

    foreach ($fiveprayer_dates as $fiveprayer_date) {
        $fiveprayer_row = [
            'date'                 => $fiveprayer_date,
            'currentDate'          => gmdate('j F Y', strtotime($fiveprayer_date)),
            'hijri_date'           => '',
            'fajr_begins'          => '05:29:00',
            'fajr_iqamah'          => '05:45:00',
            'fajr_masjid_jamaah'   => '05:45:00',
            'sunrise'              => '07:01:00',
            'dhuhr_begins'         => '12:50:00',
            'dhuhr_iqamah'         => '13:10:00',
            'asr_begins'           => '15:56:00',
            'asr_second_begins'    => '16:44:00',
            'asr_iqamah'           => '16:15:00',
            'maghrib_begins'       => '18:38:00',
            'maghrib_iqamah'       => '18:43:00',
            'isha_begins'          => '20:10:00',
            'isha_iqamah'          => '20:30:00',
            'midnight'             => '00:10:00',
        ];

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Test fixture, not a runtime query.
        if ($wpdb->insert($fiveprayer_table, $fiveprayer_row)) {
            $fiveprayer_added[] = $fiveprayer_date;
        }
    }

    if (!empty($fiveprayer_added)) {
        \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
    }

    return $fiveprayer_added;
}

/**
 * Remove the rows seeded by fiveprayer_fixture_seed_month().
 *
 * @param string[] $dates Dates returned by the seed function.
 * @return void
 */
function fiveprayer_fixture_remove_rows($dates) {
    global $wpdb;

    if (empty($dates)) {
        return;
    }

    $fiveprayer_table = fiveprayer_fixture_timetable_table();

    foreach ($dates as $fiveprayer_date) {
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Test fixture, not a runtime query.
        $wpdb->delete($fiveprayer_table, ['date' => $fiveprayer_date]);
    }

    \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
}

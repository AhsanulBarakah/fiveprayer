<?php
/**
 * The schema a fresh activation leaves behind.
 *
 * These are the columns the always-run migrations are responsible for. They
 * exist only if activation adds them *after* dbDelta creates the tables — the
 * order that used to be wrong — so the suite fails if that regresses.
 *
 * @package FivePrayer
 */

/**
 * Activation and migration results.
 */
final class SchemaTest extends FivePrayerTestCase
{
    public function test_timetable_table_exists(): void
    {
        $this->assertNotEmpty($this->columnsOf($this->tableName('fp_timetable')), 'wp_fp_timetable should exist after activation.');
    }

    public function test_timetable_carries_the_migrated_columns(): void
    {
        $columns = $this->columnsOf($this->tableName('fp_timetable'));

        $this->assertContains('asr_second_begins', $columns, 'The second Asr column is added by a migration after the table is created.');
        $this->assertContains('hijri_date', $columns, 'The Hijri date column is added by a migration after the table is created.');
        $this->assertContains('is_ramadan', $columns, 'The Ramadan flag is added by a migration after the table is created.');
    }

    public function test_api_keys_table_carries_the_usage_columns(): void
    {
        $columns = $this->columnsOf($this->tableName('fp_api_keys'));

        foreach (['last_used_ip', 'last_used_user_agent', 'last_used_referer', 'allowed_domains', 'allowed_ips', 'allowed_endpoints', 'rate_limit_per_hour', 'permission_level', 'created_by'] as $column) {
            $this->assertContains($column, $columns, "wp_fp_api_keys should carry {$column}.");
        }
    }

    public function test_settings_table_exists(): void
    {
        $this->assertNotEmpty($this->columnsOf($this->tableName('fp_prayer_settings_meta')));
    }
}

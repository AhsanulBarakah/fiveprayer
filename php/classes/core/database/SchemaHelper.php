<?php

namespace FivePrayer\Core\Database;

use FivePrayer\Core\Logging\Logger;

defined('ABSPATH') || exit;

class SchemaHelper
{
    /**
     * Object cache group shared by the whole plugin.
     */
    private const CACHE_GROUP = 'fiveprayer';

    /**
     * Short TTL for schema introspection. The result must be allowed to change
     * during the same request because this class performs DDL itself, so every
     * statement that alters the schema deletes its own introspection entry.
     */
    private const SCHEMA_CACHE_TTL = 60;

    /**
     * TTL for cached settings rows.
     */
    private const DATA_CACHE_TTL = 300;

    /**
     * Object cache key holding the column list of a table.
     */
    private static function columns_cache_key(string $table): string
    {
        return 'fiveprayer_table_columns_' . md5($table);
    }

    /**
     * Object cache key holding the index list of a table.
     */
    private static function indexes_cache_key(string $table): string
    {
        return 'fiveprayer_table_indexes_' . md5($table);
    }

    /**
     * Object cache key holding the existence check of a table.
     */
    private static function table_exists_cache_key(string $table): string
    {
        return 'fiveprayer_table_exists_' . md5($table);
    }

    /**
     * Whether a table exists, cached for the life of the schema introspection.
     *
     * The maybe* helpers use this to stay silent while a table is still
     * missing: running SHOW COLUMNS or ALTER against it logs a database error,
     * which is what every fresh activation used to write to debug.log.
     */
    private function tableExists(string $table): bool
    {
        global $wpdb;

        $cache_key = self::table_exists_cache_key($table);
        $cached    = wp_cache_get($cache_key, self::CACHE_GROUP);

        // Only a positive cache entry is trusted. A "not there yet" answer goes
        // stale within the same request: createTables() runs these migrations
        // both before and after the dbDelta that makes the table, and the other
        // maybe* helpers cache the same negative key.
        if ($cached === $table) {
            return true;
        }

        $exists = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery

        if (null !== $exists) {
            wp_cache_set($cache_key, $exists, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }

        return $exists === $table;
    }

    /**
     * Return the cached column list of a table, querying only on a cache miss.
     *
     * @return array<string>
     */
    private function getTableColumns(string $table): array
    {
        global $wpdb;

        $cache_key = self::columns_cache_key($table);
        $columns   = wp_cache_get($cache_key, self::CACHE_GROUP);

        if (!is_array($columns)) {
            $columns = $wpdb->get_col($wpdb->prepare("SHOW COLUMNS FROM %i", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($cache_key, $columns, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }

        return is_array($columns) ? $columns : [];
    }

    /**
     * Add a column to a table if it doesn't exist.
     */
    public function maybeAddColumn($table, $column, $alter_ddl): void
    {
        global $wpdb;

        // The CREATE TABLE that makes the table also declares the column, so
        // there is nothing to add until the table exists.
        if (!$this->tableExists($table)) {
            return;
        }

        $columns = $this->getTableColumns($table);
        if (!in_array($column, $columns, true)) {
            $wpdb->query($alter_ddl); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,PluginCheck.Security.DirectDB.UnescapedDBParameter -- DDL statements cannot be prepared
            wp_cache_delete(self::columns_cache_key($table), self::CACHE_GROUP);
        }
    }

    /**
     * Return the cached index names of a table, querying only on a cache miss.
     *
     * @return array<string>
     */
    private function getTableIndexes(string $table): array
    {
        global $wpdb;

        $cache_key = self::indexes_cache_key($table);
        $indexes   = wp_cache_get($cache_key, self::CACHE_GROUP);

        if (!is_array($indexes)) {
            // SHOW INDEX returns one row per indexed column; the Key_name column
            // holds the index name. get_col() would return the first column
            // (Table), so the rows are plucked explicitly.
            $rows    = $wpdb->get_results($wpdb->prepare("SHOW INDEX FROM %i", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $indexes = is_array($rows) ? array_values(array_unique(array_map(static function ($row) {
                return $row->Key_name ?? '';
            }, $rows))) : [];
            wp_cache_set($cache_key, $indexes, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }

        return is_array($indexes) ? $indexes : [];
    }

    /**
     * Add an index to a table if an index with the same name does not exist.
     *
     * @param string $table      Fully-prefixed table name.
     * @param string $index_name Index name to check for.
     * @param string $alter_ddl  ALTER TABLE ... ADD INDEX DDL to run on a miss.
     */
    public function maybeAddIndex($table, $index_name, $alter_ddl): void
    {
        global $wpdb;

        // Skip silently while the table does not exist yet — the CREATE TABLE
        // that creates it is responsible for declaring its indexes.
        $exists_cache_key = self::table_exists_cache_key($table);
        $table_check      = wp_cache_get($exists_cache_key, self::CACHE_GROUP);

        if (false === $table_check) {
            $table_check = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($exists_cache_key, $table_check, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }

        if ($table_check !== $table) {
            return;
        }

        $indexes = $this->getTableIndexes($table);
        if (!in_array($index_name, $indexes, true)) {
            $wpdb->query($alter_ddl); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,PluginCheck.Security.DirectDB.UnescapedDBParameter -- DDL statements cannot be prepared
            wp_cache_delete(self::indexes_cache_key($table), self::CACHE_GROUP);
        }
    }

    /**
     * Whether a named index exists on an existing table.
     *
     * Returns false when the table itself is missing so callers never trigger
     * a "table doesn't exist" database error through SHOW INDEX.
     */
    public function indexExists($table, $index_name): bool
    {
        global $wpdb;

        $exists_cache_key = self::table_exists_cache_key($table);
        $table_check      = wp_cache_get($exists_cache_key, self::CACHE_GROUP);

        if (false === $table_check) {
            $table_check = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($exists_cache_key, $table_check, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }

        if ($table_check !== $table) {
            return false;
        }

        return in_array($index_name, $this->getTableIndexes($table), true);
    }

    /**
     * Create a table if it does not already exist.
     *
     * Uses a SHOW TABLES LIKE check first (fast on repeated calls), then
     * delegates to dbDelta() which safely applies CREATE TABLE DDL. Returns
     * true if a new table was created, false if it already existed or the
     * DDL failed.
     */
    public function maybeCreateTable(string $table, string $create_ddl): bool
    {
        global $wpdb;

        $exists_cache_key = self::table_exists_cache_key($table);
        $table_check      = wp_cache_get($exists_cache_key, self::CACHE_GROUP);

        if (false === $table_check) {
            $table_check = $wpdb->get_var($wpdb->prepare("SHOW TABLES LIKE %s", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($exists_cache_key, $table_check, self::CACHE_GROUP, self::SCHEMA_CACHE_TTL);
        }

        if ($table_check === $table) {
            Logger::debug('Table already exists, skipping CREATE: ' . $table, 'SchemaHelper');
            return false;
        }

        // dbDelta requires upgrade.php
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        $result = dbDelta($create_ddl);

        // The schema changed, so drop the cached introspection for this table.
        wp_cache_delete($exists_cache_key, self::CACHE_GROUP);
        wp_cache_delete(self::columns_cache_key($table), self::CACHE_GROUP);

        if (!empty($wpdb->last_error)) {
            Logger::error('Failed to create table ' . $table . ': ' . $wpdb->last_error, 'SchemaHelper');
            return false;
        }

        Logger::info('Created table: ' . $table, 'SchemaHelper');
        return true;
    }

    /**
     * Modify a column's definition (e.g., increase size) if it already exists in the table.
     */
    public function maybeModifyColumn($table, $column, $alter_ddl): void
    {
        global $wpdb;

        // Same as maybeAddColumn: a missing table has no column to modify, and
        // asking for one would only log a database error.
        if (!$this->tableExists($table)) {
            return;
        }

        $columns = $this->getTableColumns($table);
        if (in_array($column, $columns, true)) {
            $wpdb->query($alter_ddl); // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared,WordPress.DB.DirectDatabaseQuery.DirectQuery,PluginCheck.Security.DirectDB.UnescapedDBParameter -- DDL statements cannot be prepared
            wp_cache_delete(self::columns_cache_key($table), self::CACHE_GROUP);
        }
    }

    /**
     * Insert default meta settings.
     */
    public function insertDefaultSettings(): void
    {
        global $wpdb;
        $meta_table_name = $wpdb->prefix . 'fp_prayer_settings_meta';
        $meta_settings = FivePrayer_DatabaseMetaSettings::getMetaSettings();
        $current_version = VersionManager::getCurrentPluginVersion();

        Logger::info('Starting insertDefaultSettings', 'SchemaHelper');
        Logger::debug('Current version: ' . $current_version, 'SchemaHelper');
        Logger::debug('Meta settings count: ' . count($meta_settings), 'SchemaHelper');

        foreach ($meta_settings as $key => $value) {
            // Fetch ALL existing rows for this meta-key
            $rows_cache_key = self::meta_rows_cache_key($meta_table_name, $key);
            $all_rows       = wp_cache_get($rows_cache_key, self::CACHE_GROUP);

            if (!is_array($all_rows)) {
                $all_rows = $wpdb->get_results($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    "SELECT id, value FROM %i WHERE `meta-key` = %s",
                    $meta_table_name,
                    $key
                ));
                wp_cache_set($rows_cache_key, $all_rows, self::CACHE_GROUP, self::DATA_CACHE_TTL);
            }

            Logger::debug('Processing setting: ' . $key, 'SchemaHelper');
            Logger::debug('Found existing rows: ' . count($all_rows), 'SchemaHelper');

            if (empty($all_rows)) {
                // No rows exist, insert new setting
                $wpdb->insert($meta_table_name, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    'meta-key' => $key,
                    'value' => sanitize_text_field(json_encode($value)),
                    'version' => $current_version
                ]);
                Logger::info('Inserted new setting: ' . $key, 'SchemaHelper');
            } else {
                // Merge all existing rows together first. A single row may hold
                // a scalar (string/bool/number) rather than an array, so it is
                // passed through as-is; only duplicate rows are array-merged.
                if (count($all_rows) === 1) {
                    $merged_data = json_decode($all_rows[0]->value, true);
                } else {
                    $merged_data = [];
                    foreach ($all_rows as $row) {
                        $row_value = json_decode($row->value, true);
                        if (is_array($row_value)) {
                            $merged_data = array_merge($merged_data, $row_value);
                        }
                    }
                }

                // Deduplicate and merge with new defaults. This is additive:
                // new default keys/entries are added while the user's saved
                // values are preserved, so a code update can ship new fields
                // without forcing the user to reset the data.
                $final_value = $this->mergeSettings($merged_data, $value);
                // Additive merges never remove anything, so entries that a
                // later release retired have to be dropped explicitly.
                if ('Only_affects_Asr_calculation' === $key) {
                    $final_value = $this->pruneRetiredListEntries($key, $final_value);
                    $final_value = $this->refreshRenamedListEntries($key, $final_value);
                    $this->remapRetiredAsrSelection($meta_table_name, $final_value);
                    $this->resyncAsrSelectionLabels($meta_table_name, $final_value);
                }

                // Delete ALL existing rows for this key
                $wpdb->delete($meta_table_name, ['meta-key' => $key]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                wp_cache_delete($rows_cache_key, self::CACHE_GROUP);

                // Insert fresh single row with merged deduplicated data
                $wpdb->insert($meta_table_name, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    'meta-key' => $key,
                    'value' => sanitize_text_field(json_encode($final_value)),
                    'version' => $current_version
                ]);

                if (count($all_rows) > 1) {
                    Logger::info('Replaced ' . count($all_rows) . ' duplicate rows for: ' . $key, 'SchemaHelper');
                } else {
                    Logger::info('Updated existing setting: ' . $key, 'SchemaHelper');
                }
            }
        }

        // Ensure timetable_layout has a default (insert-only, never overwrite user settings)
        $this->ensureDefaultMetaValue($meta_table_name, 'timetable_layout', [
            'layoutType' => 'default',
            'showDate' => true,
            'showHijriDate' => true,
            'showSunrise' => true,
            'showIqamah' => true,
            'showMidnight' => true,
            'showBegins' => true,
            // Optional second 'Asr column (2 Mithl / Hanafi) — off by default.
            'showAsr2' => false,
        ], $current_version);

        // Ensure vertical_today_layout has a default (insert-only, never overwrite user settings)
        $this->ensureDefaultMetaValue($meta_table_name, 'vertical_today_layout', [
            'showTime' => true,
            'showDate' => true,
            'showHijriDate' => true,
            // Optional second ‘Asr (2 Mithl / Hanafi) row — off by default.
            'showAsr2' => false,
        ], $current_version);

        // Global optional "Day" display config, shared by the monthly timetable
        // column and the Vertical Today header line. Gated by the `Day_Display`
        // feature switch. All parts off by default; name-first ordering.
        $this->ensureDefaultMetaValue($meta_table_name, 'day_display', [
            'showFull' => false,
            'showShort' => false,
            'showNumber' => false,
            'order' => 'name_first',
        ], $current_version);

        // Ensure skip_iqamah_midnight has a default
        $this->ensureDefaultMetaValue($meta_table_name, 'skip_iqamah_midnight', 'false', $current_version);

        // Ensure the next-prayer countdown customization has a default (insert-only).
        // The value is the real remaining time (no rounding); live minute ticking is
        // the default so the number visibly changes. The connector words
        // ("in" / "remaining" / "Now") come from the Translate system and are
        // switched on/off here, so all three start off.
        $this->ensureDefaultMetaValue($meta_table_name, 'next_prayer_countdown', [
            'format' => 'long',
            'show_prefix' => false,
            'show_suffix' => false,
            'show_now' => false,
            'show_seconds' => false,
        ], $current_version);

        // Update all records to current version if they're below minimum version
        $wpdb->query($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            "UPDATE %i SET version = %s WHERE version < %s",
            $meta_table_name,
            $current_version,
            VersionManager::getMinimumVersion()
        ));

        // The whole meta table was rewritten, so drop its caches.
        $this->flushMetaCaches();

        Logger::debug('Final update query executed', 'SchemaHelper');
    }

    /**
     * Insert a meta value only if it doesn't already exist.
     * Used for new settings that should not overwrite user customizations.
     */
    private function ensureDefaultMetaValue(string $table, string $key, $default, string $version): void
    {
        global $wpdb;

        $rows_cache_key = self::meta_rows_cache_key($table, $key);
        $exists         = wp_cache_get($rows_cache_key, self::CACHE_GROUP);

        if (false === $exists) {
            $exists = $wpdb->get_var($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                "SELECT id FROM %i WHERE `meta-key` = %s LIMIT 1",
                $table,
                $key
            ));
            wp_cache_set($rows_cache_key, $exists, self::CACHE_GROUP, self::DATA_CACHE_TTL);
        }

        if (!$exists) {
            $wpdb->insert($table, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                'meta-key' => $key,
                'value' => sanitize_text_field(json_encode($default)),
                'version' => $version,
            ]);
            wp_cache_delete($rows_cache_key, self::CACHE_GROUP);
            wp_cache_delete('fiveprayer_all_settings_meta', self::CACHE_GROUP);

            Logger::info('Inserted default value for: ' . $key, 'SchemaHelper');
        }
    }

    /**
     * Object cache key for all rows sharing one meta-key.
     */
    private static function meta_rows_cache_key(string $table, string $meta_key): string
    {
        return 'fiveprayer_meta_rows_' . md5($table . '|' . $meta_key);
    }

    /**
     * Drop the cached copies of the settings meta table after a bulk write.
     */
    private function flushMetaCaches(): void
    {
        wp_cache_delete('fiveprayer_all_settings_meta', self::CACHE_GROUP);

        if (class_exists('\\FivePrayer\\Core\\Helpers\\PrayerDataCache')) {
            \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
        }
    }

    /**
     * Drop list entries a later release retired from the shipped defaults.
     *
     * The ‘Asr list briefly carried one entry per school (ids 28–30). Those were
     * folded back into a single combined option, so installs that already merged
     * them in have to lose them. Matching is by id only — user-added entries are
     * numbered from 1000 and must survive.
     *
     * @param string $key   Meta key being seeded.
     * @param mixed  $value Merged value.
     * @return mixed Value without the retired entries.
     */
    private function pruneRetiredListEntries(string $key, $value)
    {
        $retired = 'Only_affects_Asr_calculation' === $key ? [28, 29, 30] : [];

        if (empty($retired) || !is_array($value)) {
            return $value;
        }

        return array_values(array_filter($value, static function ($item) use ($retired) {
            return !(is_array($item) && isset($item['id']) && in_array((int) $item['id'], $retired, true));
        }));
    }

    /**
     * Shipped list labels that a later release renamed, by meta key.
     *
     * Map of “label an install may still hold” => the id it belongs to. The new
     * wording is read from the shipped defaults, so the label lives here once.
     */
    private const RENAMED_LIST_ENTRIES = [
        'Only_affects_Asr_calculation' => [
            'Shafii, Maliki, Jafari, Hanbali and Hanafi (Asr + Asr 2)' => 31,
        ],
    ];

    /**
     * Give a shipped list entry the label the current release uses.
     *
     * An additive merge keeps the entry that is already stored, which is what
     * should happen for anything the user wrote, but it also means a shipped
     * label would keep its old wording forever. Only a saved name that is still
     * exactly a previously shipped one is replaced — a mosque's own wording is
     * never touched.
     *
     * @param string $key   Meta key being seeded.
     * @param mixed  $value Merged value.
     * @return mixed Value with renamed shipped entries.
     */
    private function refreshRenamedListEntries(string $key, $value)
    {
        $renamed = self::RENAMED_LIST_ENTRIES[$key] ?? [];

        if (empty($renamed) || !is_array($value)) {
            return $value;
        }

        $defaults = FivePrayer_DatabaseMetaSettings::getMetaSettings()[$key] ?? [];
        $by_id    = [];
        foreach ($defaults as $default) {
            if (is_array($default) && isset($default['id'])) {
                $by_id[(int) $default['id']] = $default;
            }
        }

        foreach ($value as $index => $item) {
            if (!is_array($item) || !isset($item['name']) || !isset($renamed[$item['name']])) {
                continue;
            }

            $target_id = (int) $renamed[$item['name']];
            if ((int) ($item['id'] ?? 0) !== $target_id || !isset($by_id[$target_id]['name'])) {
                continue;
            }

            $value[$index]['name']   = $by_id[$target_id]['name'];
            $value[$index]['method'] = $by_id[$target_id]['method'] ?? ($item['method'] ?? 'Standard');
        }

        return $value;
    }

    /**
     * Point a saved ‘Asr selection that referenced a retired entry at the
     * combined “Shafii, Maliki, Jafari and Hanbali” option instead.
     *
     * Both use the Standard (1 Mithl) shadow factor, so the calculated times do
     * not move — only the label the dropdown shows.
     *
     * @param string $meta_table_name Settings table name.
     * @param array  $asr_options     Pruned ‘Asr list.
     */
    private function remapRetiredAsrSelection(string $meta_table_name, array $asr_options): void
    {
        global $wpdb;

        $fallback = null;
        foreach ($asr_options as $option) {
            if (is_array($option) && isset($option['id']) && 3 === (int) $option['id']) {
                $fallback = $option;
                break;
            }
        }

        if (null === $fallback) {
            return;
        }

        $row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $wpdb->prepare(
                "SELECT id, value FROM %i WHERE `meta-key` = %s",
                $meta_table_name,
                'oaac_selected'
            )
        );

        if (!$row) {
            return;
        }

        $selected = json_decode($row->value, true);
        if (!is_array($selected) || !isset($selected['id']) || !in_array((int) $selected['id'], [28, 29, 30], true)) {
            return;
        }

        $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $meta_table_name,
            ['value' => sanitize_text_field(json_encode($fallback))],
            ['id' => (int) $row->id]
        );
        wp_cache_delete(self::meta_rows_cache_key($meta_table_name, 'oaac_selected'), self::CACHE_GROUP);
    }

    /**
     * Keep a stored ‘Asr selection’s label in step with the list it came from.
     *
     * `oaac_selected` stores a copy of the chosen option, so renaming a shipped
     * entry in the list would leave the dropdown showing the old wording. The
     * entry is looked up by id, so a user's own entry keeps whatever wording
     * their list carries.
     *
     * @param string $meta_table_name Settings table name.
     * @param array  $asr_options     Merged ‘Asr list.
     */
    private function resyncAsrSelectionLabels(string $meta_table_name, array $asr_options): void
    {
        global $wpdb;

        $row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            $wpdb->prepare(
                "SELECT id, value FROM %i WHERE `meta-key` = %s",
                $meta_table_name,
                'oaac_selected'
            )
        );

        if (!$row) {
            return;
        }

        $selected = json_decode($row->value, true);
        if (!is_array($selected) || !isset($selected['id'])) {
            return;
        }

        $selected_id = (int) $selected['id'];

        foreach ($asr_options as $option) {
            if (!is_array($option) || (int) ($option['id'] ?? 0) !== $selected_id) {
                continue;
            }

            if (($option['name'] ?? null) === ($selected['name'] ?? null)
                && ($option['method'] ?? null) === ($selected['method'] ?? null)) {
                return;
            }

            $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $meta_table_name,
                ['value' => sanitize_text_field(json_encode(array_merge($selected, [
                    'name'   => $option['name'] ?? '',
                    'method' => $option['method'] ?? '',
                ])))],
                ['id' => (int) $row->id]
            );
            wp_cache_delete(self::meta_rows_cache_key($meta_table_name, 'oaac_selected'), self::CACHE_GROUP);

            return;
        }
    }

    /**
     * Merge new settings entries with existing ones.
     * Adds new entries that don't exist in the current data.
     * Deduplicates by unique ID (or method/name for backward compatibility).
     * Auto-assigns unique IDs to any items missing IDs (for existing sites).
     *
     * @param array $existing Existing settings
     * @param array $new New settings from defaults
     * @return array Merged settings
     */
    private function mergeSettings($existing, $new)
    {
        // Scalar defaults (e.g. calendar_type, feature_off_display,
        // rounding_enabled): keep the value the user already saved and only
        // fall back to the shipped default when nothing is stored yet.
        if (!is_array($new)) {
            return ($existing === null || $existing === '') ? $new : $existing;
        }

        // If existing is not an array, return new
        if (!is_array($existing)) {
            return $new;
        }

        // For indexed array of objects (like calculation methods)
        if (isset($new[0]) && is_array($new[0])) {
            $unique_map = [];
            $next_id = 1000; // Start assigning IDs from 1000 for user-added items

            // First pass: Deduplicate existing entries by ID, method, or name
            foreach ($existing as $item) {
                $key = null;
                
                // Prefer ID if available
                if (isset($item['id'])) {
                    $key = $item['id'];
                } elseif (isset($item['method'])) {
                    // Fallback: deduplicate by method (for old data without IDs)
                    $key = 'method:' . $item['method'];
                } elseif (isset($item['name'])) {
                    // Last resort: deduplicate by name
                    $key = 'name:' . $item['name'];
                }

                if ($key !== null) {
                    // If item has no ID, assign one
                    if (!isset($item['id'])) {
                        $item['id'] = $next_id++;
                    }
                    // Keep first occurrence (deduplicates duplicates)
                    if (!isset($unique_map[$key])) {
                        $unique_map[$key] = $item;
                    }
                }
            }

            // Second pass: Add new default entries that don't exist (by ID)
            foreach ($new as $item) {
                if (isset($item['id']) && !isset($unique_map[$item['id']])) {
                    $unique_map[$item['id']] = $item;
                }
            }

            // Sort by ID and return
            ksort($unique_map);
            return array_values($unique_map);
        }

        // Associative array settings: merge recursively so new default keys
        // (new features) are added while the user's saved values survive.
        return $this->mergeAssociativeSettings($existing, $new);
    }

    /**
     * Recursively merge an associative default array into the stored value.
     * Existing keys keep their saved value; missing keys are filled from the
     * defaults; nested arrays are merged the same way. This makes the seeder
     * additive, so installing/replacing plugin files never requires a manual
     * settings reset to pick up newly added fields.
     *
     * @param mixed $existing Saved value (may be a scalar).
     * @param array $new      Shipped default value.
     * @return mixed Merged value.
     */
    private function mergeAssociativeSettings($existing, $new)
    {
        if (!is_array($existing)) {
            return $new;
        }

        $merged = $existing;

        foreach ($new as $key => $value) {
            if (!array_key_exists($key, $merged)) {
                $merged[$key] = $value;
                continue;
            }

            $current = $merged[$key];

            if (is_array($current) && is_array($value)) {
                if (isset($value[0]) && is_array($value[0])) {
                    // List of objects (e.g. nested method config): keep the
                    // existing entries and append any missing defaults.
                    $merged[$key] = $this->mergeSettings($current, $value);
                } else {
                    $merged[$key] = $this->mergeAssociativeSettings($current, $value);
                }
            }
            // Scalar values already stored by the user are kept as-is.
        }

        return $merged;
    }

    /**
     * Insert default translations.
     */
    public function insertDefaultTranslations(): void
    {
        global $wpdb;
        $meta_table_name = $wpdb->prefix . 'fp_prayer_settings_meta';
        $default_translations = FivePrayer_DatabaseTranslations::getTranslations();
        $current_version = VersionManager::getCurrentPluginVersion();

        Logger::info('Starting insertDefaultTranslations', 'SchemaHelper');
        Logger::debug('Current version: ' . $current_version, 'SchemaHelper');
        Logger::debug('Translations count: ' . count($default_translations), 'SchemaHelper');

        foreach ($default_translations as $key => $translations) {
            // Fetch ALL rows with this translation key
            $rows_cache_key = self::meta_rows_cache_key($meta_table_name, $key);
            $all_rows       = wp_cache_get($rows_cache_key, self::CACHE_GROUP);

            if (!is_array($all_rows)) {
                $all_rows = $wpdb->get_results($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    "SELECT id, value FROM %i WHERE `meta-key` = %s ORDER BY id ASC",
                    $meta_table_name,
                    $key
                ));
                wp_cache_set($rows_cache_key, $all_rows, self::CACHE_GROUP, self::DATA_CACHE_TTL);
            }

            Logger::debug('Processing translation: ' . $key, 'SchemaHelper');
            Logger::debug('Found rows: ' . count($all_rows), 'SchemaHelper');

            if (empty($all_rows)) {
                // No rows exist, insert new translation
                $wpdb->insert($meta_table_name, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    'meta-key' => $key,
                    'value' => json_encode($translations, JSON_UNESCAPED_UNICODE),
                    'version' => $current_version
                ]);
                Logger::info('Inserted new translation: ' . $key, 'SchemaHelper');
            } else {
                // Merge all existing rows together
                $merged_data = [];
                foreach ($all_rows as $row) {
                    $row_value = json_decode($row->value, true);
                    if (is_array($row_value)) {
                        $merged_data = array_merge($merged_data, $row_value);
                    }
                }

                // Deduplicate and merge with new defaults
                $final_value = $this->mergeTranslations($merged_data, $translations);

                // Renamed keys (the short-lived “Asr 2”) are not read any more;
                // the merge adds the Hanafi entry but never removes anything.
                if ('prayer_names' === $key) {
                    $final_value = FivePrayer_DatabaseTranslations::withoutRetiredPrayerNames($final_value);
                }

                // Update the first row with merged data
                $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $meta_table_name,
                    [
                        'value' => json_encode($final_value, JSON_UNESCAPED_UNICODE),
                        'version' => $current_version
                    ],
                    ['id' => $all_rows[0]->id]
                );
                wp_cache_delete($rows_cache_key, self::CACHE_GROUP);

                // Delete all other duplicate rows (if any)
                if (count($all_rows) > 1) {
                    $ids_to_delete = array_slice(array_column($all_rows, 'id'), 1);
                    $placeholders = implode(',', array_fill(0, count($ids_to_delete), '%d'));
                    // phpcs:disable WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $placeholders is a generated list of %d placeholders.
                    $wpdb->query($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                        "DELETE FROM %i WHERE id IN ($placeholders)",
                        array_merge([$meta_table_name], $ids_to_delete)
                    ));
                    // phpcs:enable WordPress.DB.PreparedSQL.InterpolatedNotPrepared
                    Logger::info('Deleted ' . (count($all_rows) - 1) . ' duplicate translation rows for: ' . $key, 'SchemaHelper');
                } else {
                    Logger::info('Updated existing translation: ' . $key, 'SchemaHelper');
                }
            }
        }

        // Update all translation records to current version if they're below minimum version
        $wpdb->query($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            "UPDATE %i SET version = %s WHERE version < %s",
            $meta_table_name,
            $current_version,
            VersionManager::getMinimumVersion()
        ));

        // The whole meta table was rewritten, so drop its caches.
        $this->flushMetaCaches();

        Logger::debug('Final translation update query executed', 'SchemaHelper');
    }

    /**
     * Merge new translation entries with existing ones.
     * Adds new entries that don't exist in the current data.
     *
     * @param array $existing Existing translation entries
     * @param array $new New translation entries from defaults
     * @return array Merged translation entries
     */
    private function mergeTranslations($existing, $new)
    {
        // If existing is not an array, return new
        if (!is_array($existing)) {
            return $new;
        }

        // A collection such as `activeLanguage` is one saved choice, not a list
        // of translatable entries. Rebuilding it through the map below replaced
        // the saved language with an empty list, so after any defaults sync the
        // front end fell back to English and every timetable label stopped
        // following the language the mosque picked. Keep it exactly as stored.
        if (!$this->isTranslationEntryList($existing) && !$this->isTranslationEntryList($new)) {
            return empty($existing) ? $new : $existing;
        }

        // Create a map of existing entries by original_text and language_code
        $existing_map = [];
        foreach ($existing as $item) {
            if (isset($item['original_text'], $item['language_code'])) {
                $key = $item['original_text'] . '|' . $item['language_code'];
                $existing_map[$key] = $item;
            }
        }

        // Add new entries that don't exist
        foreach ($new as $item) {
            if (isset($item['original_text'], $item['language_code'])) {
                $key = $item['original_text'] . '|' . $item['language_code'];
                if (!isset($existing_map[$key])) {
                    // New entry, add it
                    $existing_map[$key] = $item;
                }
            }
        }

        // A name ships in the languages the defaults were written in. A mosque
        // that added its own language before a name shipped never received that
        // name: Prayer Names showed no field for it and the front end fell back
        // to the English key while every other name followed the language. Give
        // every language the install already uses the new entry, plain, so it
        // can be translated.
        $languages = [];
        foreach ($existing as $item) {
            if (!is_array($item) || !isset($item['language_code']) || !is_scalar($item['language_code'])) {
                continue;
            }

            $code = (string) $item['language_code'];
            if ('' === $code) {
                continue;
            }

            if (!isset($languages[$code]) || '' === $languages[$code]) {
                $languages[$code] = isset($item['language_name']) && is_scalar($item['language_name'])
                    ? (string) $item['language_name']
                    : $code;
            }
        }

        foreach ($new as $item) {
            if (!is_array($item) || !isset($item['original_text']) || !is_scalar($item['original_text'])) {
                continue;
            }

            foreach ($languages as $code => $name) {
                $key = $item['original_text'] . '|' . $code;
                if (isset($existing_map[$key])) {
                    continue;
                }

                $existing_map[$key] = [
                    'original_text'   => (string) $item['original_text'],
                    'translated_text' => (string) $item['original_text'],
                    'language_code'   => (string) $code,
                    'language_name'   => $name,
                ];
            }
        }

        // Convert map back to array
        return array_values($existing_map);
    }

    /**
     * Whether a value is a list of translation entries (original text plus a
     * language), rather than a single saved choice such as `activeLanguage`.
     *
     * @param mixed $value Stored or shipped value.
     * @return bool
     */
    private function isTranslationEntryList($value): bool
    {
        if (!is_array($value) || [] === $value) {
            return false;
        }

        foreach ($value as $entry) {
            if (!is_array($entry) || !isset($entry['original_text'], $entry['language_code'])) {
                return false;
            }
        }

        return true;
    }
}

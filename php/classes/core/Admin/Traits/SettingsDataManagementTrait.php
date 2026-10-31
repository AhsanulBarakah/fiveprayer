<?php
namespace FivePrayer\Core\Admin\Traits;

defined('ABSPATH') || exit;

/** Prayer calculation settings import, export, and reset handlers. */
trait SettingsDataManagementTrait
{
    public function handle_export_settings(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_export_settings');

        global $wpdb;
        $meta_table_name = $wpdb->prefix . 'fp_prayer_settings_meta';

        $settings_keys = $this->getExportableSettingKeys();

        $export_data = [];
        foreach ($settings_keys as $key) {
            // Rows of the settings meta table are cached individually by key, so
            // the export does not need its own query for each setting.
            $row_cache_key = 'fiveprayer_meta_row_' . md5($meta_table_name . '|' . $key);
            $row           = wp_cache_get($row_cache_key, 'fiveprayer');

            if (false === $row) {
                $row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare(
                        "SELECT `meta-key`, value FROM %i WHERE `meta-key` = %s",
                        $meta_table_name,
                        $key
                    )
                );
                wp_cache_set($row_cache_key, $row, 'fiveprayer', 300);
            }

            if ($row) {
                $export_data[$row->{'meta-key'}] = json_decode($row->value, true);
            }
        }

        set_transient('fiveprayer_export_notice', __('Settings exported successfully. Download will start automatically.', 'fiveprayer'), 60);

        $filename = 'fiveprayer-settings-' . gmdate('Y-m-d') . '.json';
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Pragma: no-cache');
        header('Expires: 0');
        echo json_encode($export_data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        exit;
    }

    public function handle_import_settings(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_import_settings');

        if (!isset($_FILES['settings_json']['error'], $_FILES['settings_json']['tmp_name']) || $_FILES['settings_json']['error'] !== UPLOAD_ERR_OK) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', 'upload_failed', 'data_management');
            return;
        }

        $uploaded_file = sanitize_text_field(wp_unslash($_FILES['settings_json']['tmp_name']));
        if (!is_uploaded_file($uploaded_file)) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', 'upload_invalid', 'data_management');
            return;
        }

        // A settings file is a few kilobytes. Anything near a megabyte is not
        // one, and reading it into memory on an admin request is not worth it.
        $max_import_bytes = 1024 * 1024;

        if (filesize($uploaded_file) > $max_import_bytes) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', 'settings_upload_too_large', 'data_management');
            return;
        }

        $file_content = file_get_contents($uploaded_file);
        $import_data = json_decode($file_content, true);

        if (!is_array($import_data)) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', 'upload_invalid_json', 'data_management');
            return;
        }

        $this->import_settings_data($import_data);
        $this->redirect_with_notice('fiveprayer-settings', 'updated', 'settings_imported', 'data_management');
    }

    public function handle_reset_settings_defaults(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_reset_settings_defaults');

        global $wpdb;
        $meta_table_name = $wpdb->prefix . 'fp_prayer_settings_meta';

        $settings_keys = [
            'Only_affects_Asr_calculation',
            'Methods_For_Calculation',
            'midnight_calculation_mode',
            'Higher_Latitudes_Methods',
            'timetable_layout',
            'vertical_today_layout',
            'skip_iqamah_midnight',
            // The six extra-prayer slots (Jumu'ah / Eid names, times, notes).
            // Deleting the row lets insertDefaultSettings() below recreate it as
            // the empty default, which is what "reset" has to mean here —
            // insertDefaultSettings() alone is additive and would keep the
            // saved names and times forever.
            'extra_prayers',
        ];

        foreach ($settings_keys as $key) {
            $wpdb->delete($meta_table_name, ['meta-key' => $key]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_delete('fiveprayer_meta_row_' . md5($meta_table_name . '|' . $key), 'fiveprayer');
            // SchemaHelper::insertDefaultSettings() below reads its own *plural*
            // rows key for each setting. While that stale list is still cached
            // it takes the "merge with existing data" branch and writes the just
            // deleted settings straight back in — the reset then looks like it
            // did nothing. Drop it so the defaults are re-seeded instead.
            wp_cache_delete('fiveprayer_meta_rows_' . md5($meta_table_name . '|' . $key), 'fiveprayer');
        }

        // The whole meta table was rewritten; drop the cached row list too.
        wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');

        $schema_helper = new \FivePrayer\Core\Database\SchemaHelper();
        $schema_helper->insertDefaultSettings();

        if (class_exists('FivePrayer\\Core\\Helpers\\PrayerDataCache')) {
            \FivePrayer\Core\Helpers\PrayerDataCache::invalidateAll();
        }

        $this->redirect_with_notice('fiveprayer-settings', 'updated', 'settings_reset', 'data_management');
    }

    public function handle_reset_settings_defaults_soft(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('You do not have sufficient permissions to access this page.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_reset_settings_defaults_soft');

        try {
            global $wpdb;
            $meta_table_name = $wpdb->prefix . 'fp_prayer_settings_meta';

            $default_settings = \FivePrayer\Core\Database\FivePrayer_DatabaseMetaSettings::getMetaSettings();
            if (empty($default_settings)) {
                $this->redirect_with_notice('fiveprayer-settings', 'error', 'defaults_load_failed', 'data_management');
                return;
            }

            $default_ids = [];
            foreach ($default_settings as $items) {
                if (!is_array($items)) {
                    // Scalar defaults (rounding_enabled, calendar_type, …) hold
                    // no entries to index.
                    continue;
                }
                foreach ($items as $item) {
                    if (is_array($item) && isset($item['id'])) {
                        $default_ids[$item['id']] = true;
                    }
                }
            }

            $current_version = \FivePrayer\Core\Database\VersionManager::getCurrentPluginVersion();

            foreach ($default_settings as $key => $default_items) {
                $rows_cache_key = 'fiveprayer_meta_rows_' . md5($meta_table_name . '|' . $key);
                $all_rows       = wp_cache_get($rows_cache_key, 'fiveprayer');

                if (!is_array($all_rows)) {
                    $all_rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                        $wpdb->prepare(
                            "SELECT id, value FROM %i WHERE `meta-key` = %s",
                            $meta_table_name,
                            $key
                        )
                    );
                    wp_cache_set($rows_cache_key, $all_rows, 'fiveprayer', 300);
                }

                $custom_entries = [];
                foreach ($all_rows as $row) {
                    $row_value = json_decode($row->value, true);
                    if (is_array($row_value)) {
                        foreach ($row_value as $entry) {
                            if (is_array($entry)) {
                                $entry_id = isset($entry['id']) ? (int) $entry['id'] : null;
                                if ($entry_id === null || !isset($default_ids[$entry_id])) {
                                    $custom_entries[] = $entry;
                                }
                            }
                        }
                    }
                }

                // Only entry lists whose defaults carry an `id` can meaningfully
                // keep user-added entries. Everything else is replaced by the
                // default, because merging it is wrong or fatal:
                // - the extra-prayer slots are a fixed six positions with no id,
                //   so every saved slot counted as user data and was appended
                //   after the defaults (6 slots became 12, and the saved
                //   Jumu'ah / Eid names and times were never actually cleared);
                // - scalar defaults such as rounding_enabled made array_merge()
                //   throw a TypeError, aborting the whole reset before it
                //   reached newer settings like the prayer slots.
                $keeps_custom_entries = is_array($default_items) && isset($default_items[0]['id']);

                $merged = $keeps_custom_entries
                    ? array_merge($default_items, $custom_entries)
                    : $default_items;
                $wpdb->delete($meta_table_name, ['meta-key' => $key]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $wpdb->insert($meta_table_name, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    'meta-key' => $key,
                    'value' => $this->encode_settings_value($merged),
                    'version' => $current_version
                ]);

                wp_cache_delete($rows_cache_key, 'fiveprayer');
                wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');
            }

            $this->bust_caches();

            // Ensure all meta values (including timetable_layout) have defaults
            $schema_helper = new \FivePrayer\Core\Database\SchemaHelper();
            $schema_helper->insertDefaultSettings();

            $this->redirect_with_notice('fiveprayer-settings', 'updated', 'settings_soft_reset', 'data_management');
        } catch (\Throwable $e) {
            \FivePrayer\Core\Logging\Logger::error('Soft settings reset failed: ' . $e->getMessage(), 'SettingsAdmin');
            $this->redirect_with_notice('fiveprayer-settings', 'error', 'reset_failed', 'data_management');
        }
    }

    /**
     * Encode a settings value for storage.
     *
     * The array is sanitised first and the JSON is produced afterwards, which
     * is the order import_settings_data uses. Calling sanitize_text_field() on
     * the encoded string (the old behaviour) stripped quotes and turned `%20`
     * into `20`, corrupting the stored JSON.
     *
     * @param mixed $value Settings value.
     * @return string JSON safe to store.
     */
    private function encode_settings_value($value): string
    {
        // Defaults and rows read back from the table were sanitised when they
        // were written; encoding them again must not run text sanitising over
        // the JSON itself.
        $json = wp_json_encode($value, JSON_UNESCAPED_UNICODE);

        return is_string($json) ? $json : '[]';
    }

    /**
     * The settings keys a settings file carries.
     *
     * Export writes these and import accepts nothing else, so a crafted file
     * cannot overwrite an unrelated setting or skip the sanitising a normal
     * save applies.
     *
     * @return string[]
     */
    private function getExportableSettingKeys(): array
    {
        return [
            'Only_affects_Asr_calculation',
            'Methods_For_Calculation',
            'midnight_calculation_mode',
            'Higher_Latitudes_Methods',
        ];
    }

    /**
     * Clean an imported value the way a settings save would.
     *
     * @param mixed $value Value read from the uploaded file.
     * @return mixed
     */
    private function sanitizeImportedValue($value)
    {
        if (is_array($value)) {
            foreach ($value as $key => $item) {
                $value[$key] = $this->sanitizeImportedValue($item);
            }

            return $value;
        }

        if (is_string($value)) {
            return sanitize_text_field($value);
        }

        if (is_int($value) || is_float($value) || is_bool($value) || null === $value) {
            return $value;
        }

        return null;
    }

    private function import_settings_data(array $import_data): void
    {
        global $wpdb;
        $meta_table_name = $wpdb->prefix . 'fp_prayer_settings_meta';
        $current_version = \FivePrayer\Core\Database\VersionManager::getCurrentPluginVersion();

        foreach ($this->getExportableSettingKeys() as $key) {
            $value = isset($import_data[$key]) ? $import_data[$key] : null;

            if (!is_array($value)) {
                continue;
            }

            $value = $this->sanitizeImportedValue($value);

            $rows_cache_key = 'fiveprayer_meta_rows_' . md5($meta_table_name . '|' . $key);
            $existing_rows  = wp_cache_get($rows_cache_key, 'fiveprayer');

            if (!is_array($existing_rows)) {
                $existing_rows = $wpdb->get_results( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare(
                        "SELECT id, value FROM %i WHERE `meta-key` = %s",
                        $meta_table_name,
                        $key
                    )
                );
                wp_cache_set($rows_cache_key, $existing_rows, 'fiveprayer', 300);
            }

            if (empty($existing_rows)) {
                $wpdb->insert($meta_table_name, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    'meta-key' => $key,
                    'value' => wp_json_encode($value, JSON_UNESCAPED_UNICODE),
                    'version' => $current_version
                ]);
                wp_cache_delete($rows_cache_key, 'fiveprayer');
                wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');
            } else {
                $merged_data = [];
                foreach ($existing_rows as $row) {
                    $row_value = json_decode($row->value, true);
                    if (is_array($row_value)) {
                        $merged_data = array_merge($merged_data, $row_value);
                    }
                }

                $final_data = $this->merge_settings_arrays($merged_data, $value);

                $wpdb->delete($meta_table_name, ['meta-key' => $key]); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $wpdb->insert($meta_table_name, [ // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    'meta-key' => $key,
                    // Stored as JSON, not through sanitize_text_field(): that
                    // strips quotes and percent sequences out of the payload.
                    'value' => wp_json_encode($final_data, JSON_UNESCAPED_UNICODE),
                    'version' => $current_version
                ]);

                wp_cache_delete($rows_cache_key, 'fiveprayer');
                wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');
            }
        }
    }

    private function merge_settings_arrays(array $existing, array $incoming): array
    {
        if (!isset($existing[0]) || !is_array($existing[0])) {
            return $incoming;
        }

        $unique_map = [];
        $next_id = 1000;

        foreach ($existing as $item) {
            if (isset($item['id'])) {
                $unique_map[$item['id']] = $item;
            } elseif (isset($item['method'])) {
                if (!isset($item['id'])) {
                    $item['id'] = $next_id++;
                }
                $unique_map['method:' . $item['method']] = $item;
            }
        }

        foreach ($incoming as $item) {
            if (isset($item['id']) && isset($unique_map[$item['id']])) {
                $unique_map[$item['id']] = $item;
            } elseif (isset($item['id'])) {
                $unique_map[$item['id']] = $item;
            } elseif (isset($item['method'])) {
                if (!isset($item['id'])) {
                    $item['id'] = $next_id++;
                }
                $unique_map['method:' . $item['method']] = $item;
            }
        }

        ksort($unique_map);
        return array_values($unique_map);
    }
}

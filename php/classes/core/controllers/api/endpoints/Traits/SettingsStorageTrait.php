<?php

namespace FivePrayer\Core\Controllers\API\EndPoints\Traits;

defined('ABSPATH') || exit;

use Exception;
use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\Security\SecurityHelper;

trait SettingsStorageTrait
{
    protected function upsertSetting(string $meta_key, $value): array
    {
        global $wpdb;

        $uses_new_column = $this->detectTableColumnUsesNewName();

        // The row id is looked up on every settings save, so it is cached and
        // dropped again right after the write below. Both column spellings
        // resolve to the same row, so they share one cache entry.
        $id_cache_key = 'fiveprayer_setting_id_' . md5($this->table_name . '|' . $meta_key);
        $existing_id  = wp_cache_get($id_cache_key, 'fiveprayer');

        if (false === $existing_id) {
            if ($uses_new_column) {
                $existing_id = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare(
                        "SELECT id FROM %i WHERE `meta_key` = %s",
                        $this->table_name,
                        $meta_key
                    )
                );
            } else {
                $existing_id = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare(
                        "SELECT id FROM %i WHERE `meta-key` = %s",
                        $this->table_name,
                        $meta_key
                    )
                );
            }

            wp_cache_set($id_cache_key, $existing_id, 'fiveprayer', 300);
        }

        $value_to_store = $this->prepareValueForStorage($meta_key, $value);

        if ($existing_id) {
            $result = $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $this->table_name,
                ['value' => $value_to_store],
                ['id' => $existing_id],
                ['%s'],
                ['%d']
            );

            // The stored value and the row id lookup are both stale now.
            wp_cache_delete($id_cache_key, 'fiveprayer');
            wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');

            if ($result === false) {
                throw new Exception(esc_html("Failed to update setting: " . $wpdb->last_error));
            }
        } else {
            $data = $uses_new_column
                ? ['meta_key' => $meta_key, 'value' => $value_to_store] // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key
                : ['meta-key' => $meta_key, 'value' => $value_to_store]; // phpcs:ignore WordPress.DB.SlowDBQuery.slow_db_query_meta_key

            $result = $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $this->table_name,
                $data,
                ['%s', '%s']
            );

            // A new row changes the cached row list for this key.
            wp_cache_delete($id_cache_key, 'fiveprayer');
            wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');

            if ($result === false) {
                throw new Exception(esc_html("Failed to insert setting: " . $wpdb->last_error));
            }
        }

        PrayerDataCache::invalidateAll();
        $this->fiveprayer_purge_all_caches();

        // Clear Ramadan cache when related settings change so the next calendar load gets fresh data
        $ramadan_keys = ['ramadan', 'hijralocale', 'activeLanguage', 'hijra_months', 'hijra_numbers'];
        if (in_array($meta_key, $ramadan_keys, true)) {
            $current_year = intval(wp_date('Y', null, wp_timezone()));
            delete_transient('fiveprayer_ramadan_days_' . $current_year);
            delete_transient('fiveprayer_ramadan_state_' . $current_year);
            wp_cache_delete('fiveprayer_ramadan_timetable_' . $current_year, 'fiveprayer');
        }

        SecurityHelper::log_security_event('Setting saved successfully: ' . $meta_key, 'info');

        return [
            'success' => true,
            'meta' => $meta_key,
            'value' => $value
        ];
    }

    /**
     * Read one stored setting value, still JSON-encoded when the row holds an
     * array. Returns null when nothing is stored under that key.
     *
     * @param string $meta_key Meta key to read.
     * @return string|null
     */
    protected function getStoredSettingValue(string $meta_key): ?string
    {
        global $wpdb;

        // Both column spellings exist across installs; read the one this
        // install actually has, the same way upsertSetting() looks up its id.
        if ($this->detectTableColumnUsesNewName()) {
            $value = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $wpdb->prepare("SELECT value FROM %i WHERE `meta_key` = %s", $this->table_name, $meta_key)
            );
        } else {
            $value = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                $wpdb->prepare("SELECT value FROM %i WHERE `meta-key` = %s", $this->table_name, $meta_key)
            );
        }

        return null === $value ? null : (string) $value;
    }

    /**
     * Switch the Hanafi column on when the combined ‘Asr choice is selected.
     *
     * “Shafii, Maliki, Jafari, Hanbali and Hanafi (Asr + Hanafi)” exists so a
     * mosque prints both ‘Asr times, so picking it raises the column without a
     * second stop in Timetable Layout. The flag is only ever raised: a user who
     * turns the column off afterwards keeps it off.
     *
     * @param mixed $value Saved `oaac_selected` value.
     */
    protected function enable_asr2_column_for_combined_asr($value): void
    {
        if (!is_array($value)) {
            return;
        }

        $id   = isset($value['id']) ? (int) $value['id'] : 0;
        $name = isset($value['name']) ? (string) $value['name'] : '';
        // The id is what identifies the entry; the names are only a fallback for
        // a stored selection saved by a release that used the older wording.
        if (31 !== $id
            && false === stripos($name, '(Asr + Hanafi)')
            && false === stripos($name, '(Asr + Asr 2)')) {
            return;
        }

        $layout  = $this->getStoredSettingValue('timetable_layout');
        $options = is_string($layout) ? json_decode($layout, true) : $layout;
        if (!is_array($options)) {
            $options = [];
        }

        if (true === ($options['showAsr2'] ?? false)) {
            return;
        }

        $options['showAsr2'] = true;
        $this->upsertSetting('timetable_layout', $options);
    }

    private function prepareValueForStorage(string $meta_key, $value): string
    {
        if (in_array($meta_key, ['skip_iqamah_midnight', 'hide_month_selection', 'hide_custom_url_button', 'hover_enabled'])) {
            return $value ? '1' : '0';
        }

        if (in_array($meta_key, ['printer_button_url', 'auto_print_page_url'])) {
            return (string) $value;
        }

        return is_array($value) || is_object($value)
            ? wp_json_encode($value, JSON_UNESCAPED_UNICODE)
            : $value;
    }
}

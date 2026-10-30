<?php
namespace FivePrayer\Core\Admin\Traits;

defined('ABSPATH') || exit;

use FivePrayer\Core\Database\FivePrayer_DatabaseTranslations;

/** Translation import, export, and reset handlers for admin settings. */
trait TranslationImportExportTrait
{
    public function handle_import(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_import_translations');

        if (!isset($_FILES['translations_json']['tmp_name'])) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', __('No file uploaded.', 'fiveprayer'), 'translations');
            return;
        }

        $uploaded_file = sanitize_text_field(wp_unslash($_FILES['translations_json']['tmp_name']));
        if (!is_uploaded_file($uploaded_file)) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', __('Invalid upload.', 'fiveprayer'), 'translations');
            return;
        }

        $contents = file_get_contents($uploaded_file);
        $decoded  = json_decode($contents, true);
        if (json_last_error() !== JSON_ERROR_NONE || !is_array($decoded)) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', __('Invalid JSON file.', 'fiveprayer'), 'translations');
            return;
        }

        if (isset($decoded['translations']) && is_array($decoded['translations'])) {
            $decoded = $decoded['translations'];
        }

        global $wpdb;
        $table = $wpdb->prefix . 'fp_prayer_settings_meta';

        $skipKeys = ['activeLanguage', 'hijralocale'];
        foreach ($decoded as $meta_key => &$value) {
            if (in_array($meta_key, $skipKeys, true)) {
                continue;
            }
            // Cached per meta key: the import walks every key in the file, and
            // each row is dropped again right after it is written below.
            $row_cache_key = 'fiveprayer_meta_row_' . md5($table . '|' . $meta_key);
            $existing_row  = wp_cache_get($row_cache_key, 'fiveprayer');

            if (false === $existing_row) {
                $existing_row = $wpdb->get_row($wpdb->prepare("SELECT id, value FROM %i WHERE `meta-key` = %s", $table, $meta_key), ARRAY_A); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                wp_cache_set($row_cache_key, $existing_row, 'fiveprayer', 300);
            }

            $existing_decoded = null;
            if ($existing_row && isset($existing_row['value'])) {
                $existing_decoded = json_decode($existing_row['value'], true);
            }

            if (is_array($existing_decoded) && is_array($value)) {
                $merged = $this->mergeTranslationArrays($existing_decoded, $value);
                $encoded = wp_json_encode($merged, JSON_UNESCAPED_UNICODE);
            } else {
                $encoded = wp_json_encode($value, JSON_UNESCAPED_UNICODE);
            }

            if ($existing_row && isset($existing_row['id'])) {
                $wpdb->update($table, ['value' => $encoded], ['id' => (int)$existing_row['id']], ['%s'], ['%d']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            } else {
                $wpdb->insert($table, ['meta-key' => $meta_key, 'value' => $encoded], ['%s','%s']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            }

            wp_cache_delete($row_cache_key, 'fiveprayer');
            wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');
        }

        $this->bust_caches();
        $this->redirect_with_notice('fiveprayer-settings', 'updated', __('Translations imported successfully.', 'fiveprayer'), 'translations');
    }

    public function handle_soft_reset(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_reset_defaults_soft');

        $defaults = $this->load_defaults();
        if ($defaults === null) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', __('Could not load default translations.', 'fiveprayer'), 'translations');
            return;
        }

        global $wpdb;
        $table = $wpdb->prefix . 'fp_prayer_settings_meta';
        foreach ($defaults as $meta_key => &$value) {
            $encoded = wp_json_encode($value, JSON_UNESCAPED_UNICODE);
            $row_cache_key = 'fiveprayer_meta_row_id_' . md5($table . '|' . $meta_key);
            $existing_id   = wp_cache_get($row_cache_key, 'fiveprayer');

            if (false === $existing_id) {
                $existing_id = $wpdb->get_var($wpdb->prepare("SELECT id FROM %i WHERE `meta-key` = %s", $table, $meta_key)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                wp_cache_set($row_cache_key, $existing_id, 'fiveprayer', 300);
            }

            if ($existing_id) {
                $wpdb->update($table, ['value' => $encoded], ['id' => $existing_id], ['%s'], ['%d']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            } else {
                $wpdb->insert($table, ['meta-key' => $meta_key, 'value' => $encoded], ['%s','%s']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            }

            wp_cache_delete($row_cache_key, 'fiveprayer');
            wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');
        }
        $this->bust_caches();
        $this->redirect_with_notice('fiveprayer-settings', 'updated', __('Default translations restored. Custom languages kept.', 'fiveprayer'), 'translations');
    }

    public function handle_hard_reset(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_reset_defaults_hard');

        $defaults = $this->load_defaults();
        if ($defaults === null) {
            $this->redirect_with_notice('fiveprayer-settings', 'error', __('Could not load default translations.', 'fiveprayer'), 'translations');
            return;
        }

        global $wpdb;
        $table = $wpdb->prefix . 'fp_prayer_settings_meta';

        foreach ($defaults as $meta_key => &$value) {
            $encoded = wp_json_encode($value, JSON_UNESCAPED_UNICODE);
            $row_cache_key = 'fiveprayer_meta_row_id_' . md5($table . '|' . $meta_key);
            $existing_id   = wp_cache_get($row_cache_key, 'fiveprayer');

            if (false === $existing_id) {
                $existing_id = $wpdb->get_var($wpdb->prepare("SELECT id FROM %i WHERE `meta-key` = %s", $table, $meta_key)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                wp_cache_set($row_cache_key, $existing_id, 'fiveprayer', 300);
            }

            if ($existing_id) {
                $wpdb->update($table, ['value' => $encoded], ['id' => $existing_id], ['%s'], ['%d']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            } else {
                $wpdb->insert($table, ['meta-key' => $meta_key, 'value' => $encoded], ['%s','%s']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            }

            wp_cache_delete($row_cache_key, 'fiveprayer');
            wp_cache_delete('fiveprayer_all_settings_meta', 'fiveprayer');
        }

        // The key list only changes when a row is added or removed; the writes
        // above already dropped this entry, so it is refreshed on demand.
        $key_list_cache_key = 'fiveprayer_meta_key_list';
        $keys               = wp_cache_get($key_list_cache_key, 'fiveprayer');

        if (!is_array($keys)) {
            $keys = $wpdb->get_col($wpdb->prepare("SELECT DISTINCT `meta-key` FROM %i", $table)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
            wp_cache_set($key_list_cache_key, $keys, 'fiveprayer', 300);
        }

        foreach ($keys as &$key) {
            if ($key === 'translations') { continue; }
            if (preg_match('/^[a-z]{2}(-[A-Z]{2})?$/', $key)) {
                $wpdb->delete($table, ['meta-key' => $key], ['%s']); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                wp_cache_delete($key_list_cache_key, 'fiveprayer');
                wp_cache_delete('fiveprayer_meta_row_' . md5($table . '|' . $key), 'fiveprayer');
            }
        }
        $this->bust_caches();
        $this->redirect_with_notice('fiveprayer-settings', 'updated', __('Hard reset completed. Defaults restored and custom translations removed.', 'fiveprayer'), 'translations');
    }

    public function handle_export(): void
    {
        if (!current_user_can('manage_options')) {
            wp_die(esc_html__('Insufficient permissions.', 'fiveprayer'));
        }
        check_admin_referer('fiveprayer_export_translations');

        global $wpdb;
        $table = $wpdb->prefix . 'fp_prayer_settings_meta';
        $keys = ['prayer_names','gregorian_months','gregorian_numbers','hijra_months','hijra_numbers','activeLanguage','hijralocale','timetable_prayer','vertical_daily_prayer','day_names','extra_info'];
        $data = [];
        foreach ($keys as &$k) {
            $value_cache_key = 'fiveprayer_meta_value_' . md5($table . '|' . $k);
            $val             = wp_cache_get($value_cache_key, 'fiveprayer');

            if (false === $val) {
                $val = $wpdb->get_var($wpdb->prepare("SELECT value FROM %i WHERE `meta-key` = %s", $table, $k)); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                wp_cache_set($value_cache_key, $val, 'fiveprayer', 300);
            }

            if ($val !== null) {
                $data[$k] = json_decode($val, true);
            }
        }
        if (empty($data)) {
            $data = $this->load_defaults() ?: [];
        }
        $json = wp_json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

        nocache_headers();
        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename=fiveprayer-translations-' . gmdate('Ymd-His') . '.json');
        echo $json; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
        exit;
    }

    private function load_defaults(): ?array
    {
        if (class_exists(FivePrayer_DatabaseTranslations::class)) {
            $data = FivePrayer_DatabaseTranslations::getTranslations();
            return is_array($data) ? $data : null;
        }
        return null;
    }

    private function mergeTranslationArrays(array $existing, array $incoming): array
    {
        $isList = static function(array $arr): bool {
            if ($arr === []) { return true; }
            return array_keys($arr) === range(0, count($arr) - 1);
        };

        $listLike = $isList($existing) && $isList($incoming);

        if ($listLike) {
            $index = [];
            foreach ($existing as &$item) {
                if (is_array($item) && isset($item['original_text'])) {
                    $lang = isset($item['language_code']) ? (string)$item['language_code'] : '*';
                    $key  = (string)$item['original_text'] . '|' . $lang;
                    $index[$key] = $item;
                } else {
                    $index[spl_object_hash((object)$item)] = $item;
                }
            }
            foreach ($incoming as &$item) {
                if (is_array($item) && isset($item['original_text'])) {
                    $lang = isset($item['language_code']) ? (string)$item['language_code'] : '*';
                    $key  = (string)$item['original_text'] . '|' . $lang;
                    $index[$key] = $item;
                } else {
                    $index[spl_object_hash((object)$item)] = $item;
                }
            }
            return array_values($index);
        }

        if (is_array($existing) && !empty($existing) && !$isList($existing) &&
            is_array($incoming) && !empty($incoming) && !$isList($incoming)) {
            return array_merge($existing, $incoming);
        }

        return $incoming;
    }
}

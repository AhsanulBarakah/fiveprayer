<?php

namespace FivePrayer\Core\Controllers\API\EndPoints;
defined('ABSPATH') || exit;

use Exception;
use WP_REST_Request;
use WP_Error;
use FivePrayer\Core\Controllers\API\RestControllerBase;
use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\Security\SecurityHelper;
// The one place that defines how a border radius is clamped, so the settings
// screen, the REST route and the front-end stylesheet can never disagree.
use FivePrayer\Core\ShortCodes\Managers\StyleManager;

use FivePrayer\Core\Controllers\API\EndPoints\Traits\CachePurgeTrait;
use FivePrayer\Core\Controllers\API\EndPoints\Traits\SettingsValidationTrait;
use FivePrayer\Core\Controllers\API\EndPoints\Traits\SettingsStorageTrait;

class PrayerSettingsMetaController extends RestControllerBase
{
    use CachePurgeTrait;
    use SettingsValidationTrait;
    use SettingsStorageTrait;

    /**
     * Object cache key for the settings-meta table column probe in
     * CachePurgeTrait::detectTableColumnUsesNewName().
     *
     * Declared on the class rather than inside the trait because constants in
     * traits require PHP 8.2, while this plugin supports PHP 7.4.
     */
    private const TABLE_COLUMN_VARIANT_CACHE_KEY = 'fiveprayer_meta_table_column_variant';

    private $table_name;

    public function __construct()
    {
        global $wpdb;
        $this->table_name = $wpdb->prefix . 'fp_prayer_settings_meta';
        add_action('rest_api_init', [$this, 'register_routes']);
        $this->register_hooks();
    }

    public function register_routes(): void
    {
        register_rest_route($this->get_namespace(), '/fp_prayersettings_meta', [
            'methods' => 'POST',
            'callback' => [$this, 'store_settings'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route($this->get_namespace(), '/fp_prayersettings_meta/batch', [
            'methods' => 'POST',
            'callback' => [$this, 'store_settings_batch'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route($this->get_namespace(), '/fp_prayersettings_meta', [
            'methods' => 'GET',
            'callback' => [$this, 'get_meta'],
            'permission_callback' => '__return_true',
        ]);

        register_rest_route($this->get_namespace(), '/fp_get_next_prayer', [
            'methods' => 'GET',
            'callback' => [$this, 'get_next_prayer'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function check_permission()
    {
        return current_user_can('manage_options');
    }

    public function store_settings(WP_REST_Request $request)
    {
        try {
            SecurityHelper::log_security_event('Storing prayer settings', 'info');

            $data = $request->get_json_params();

            if (!isset($data['meta']) || !isset($data['value'])) {
                SecurityHelper::log_security_event('Invalid settings format: missing meta or value', 'error');
                return new WP_Error('invalid_data', 'Missing meta or value in request', ['status' => 400]);
            }

            $meta_key = $data['meta'];
            $value = $data['value'];

            if (is_string($value)) {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $value = $decoded;
                }
            }

            SecurityHelper::validate_input($meta_key);

            if ($meta_key === 'printer') {
                $value = $this->validatePrinterSettings($value);
            } elseif ($meta_key === 'skip_iqamah_midnight') {
                $value = (bool) $value;
            } elseif ($meta_key === 'hide_month_selection') {
                $value = (bool) $value;
            } elseif ($meta_key === 'hide_custom_url_button') {
                $value = (bool) $value;
            } elseif ($meta_key === 'printer_button_url') {
                $value = (string) $value;
            } elseif ($meta_key === 'auto_print_page_url') {
                $value = (string) $value;
            } elseif ($meta_key === 'custom-prayer-time-schedules') {
                $value = $this->validateCustomPrayerTimeSchedules($value);
            } elseif ($meta_key === 'hover_mode') {
                $value = ($value === 'replace') ? 'replace' : 'blend';
            } elseif ($meta_key === 'hover_enabled') {
                $value = (bool) $value;
            } elseif ($meta_key === 'borderradius') {
                // Corner rounding of the timetable: a whole number of pixels,
                // clamped to the range the settings screen offers. Stored as a
                // string like the border width, which the readers expect.
                $value = (string) StyleManager::getBorderRadius($value);
            } elseif ($meta_key === 'vertical_today_layout') {
                $value = $this->validateVerticalTodayLayout($value);
            } elseif ($meta_key === 'day_display') {
                $value = $this->validateDayDisplay($value);
            } elseif ($meta_key === 'extra_prayers') {
                $value = $this->validateExtraPrayers($value);
            } elseif (is_string($value)) {
                $value = SecurityHelper::sanitize_text($value);
            } elseif (is_array($value)) {
                if ($meta_key === 'location_list') {
                    $value = $this->validateLocationList($value);
                }
            }

            $result = $this->upsertSetting($meta_key, $value);

            // The combined ‘Asr choice is picked to print both ‘Asr times, so it
            // raises the Asr 2 column on its own.
            if ('oaac_selected' === $meta_key) {
                $this->enable_asr2_column_for_combined_asr($value);
            }

            return rest_ensure_response($result);
        } catch (Exception $e) {
            SecurityHelper::log_security_event('Error storing setting: ' . $e->getMessage(), 'error');
            return new WP_Error('internal_error', 'Error saving setting: ' . $e->getMessage(), ['status' => 500]);
        }
    }

    public function store_settings_batch(WP_REST_Request $request)
    {
        try {
            SecurityHelper::log_security_event('Batch storing prayer settings', 'info');

            $data = $request->get_json_params();

            if (!isset($data['settings']) || !is_array($data['settings'])) {
                return new WP_Error('invalid_data', 'Missing settings array in request', ['status' => 400]);
            }

            $settings = $data['settings'];
            $saved = [];
            $errors = [];

            foreach ($settings as $meta_key => $value) {
                try {
                    if (is_string($value)) {
                        $decoded = json_decode($value, true);
                        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                            $value = $decoded;
                        }
                    }

                    SecurityHelper::validate_input($meta_key);

                    if ($meta_key === 'printer') {
                        $value = $this->validatePrinterSettings($value);
                    } elseif ($meta_key === 'skip_iqamah_midnight' || $meta_key === 'hide_month_selection' || $meta_key === 'hide_custom_url_button') {
                        $value = (bool) $value;
                    } elseif ($meta_key === 'printer_button_url' || $meta_key === 'auto_print_page_url') {
                        $value = (string) $value;
                    } elseif ($meta_key === 'custom-prayer-time-schedules') {
                        $value = $this->validateCustomPrayerTimeSchedules($value);
                    } elseif ($meta_key === 'hover_mode') {
                        $value = ($value === 'replace') ? 'replace' : 'blend';
                    } elseif ($meta_key === 'hover_enabled') {
                        $value = (bool) $value;
                    } elseif ($meta_key === 'borderradius') {
                        // Same clamp as the single save, so both routes agree.
                        $value = (string) StyleManager::getBorderRadius($value);
                    } elseif ($meta_key === 'vertical_today_layout') {
                        $value = $this->validateVerticalTodayLayout($value);
                    } elseif ($meta_key === 'day_display') {
                        $value = $this->validateDayDisplay($value);
                    } elseif ($meta_key === 'extra_prayers') {
                        $value = $this->validateExtraPrayers($value);
                    } elseif (is_string($value)) {
                        $value = SecurityHelper::sanitize_text($value);
                    } elseif (is_array($value) && $meta_key === 'location_list') {
                        $value = $this->validateLocationList($value);
                    }

                    $result = $this->upsertSetting($meta_key, $value);
                    $saved[] = $meta_key;

                    // Same rule on the batch route: the combined ‘Asr choice
                    // switches the Asr 2 column on.
                    if ('oaac_selected' === $meta_key) {
                        $this->enable_asr2_column_for_combined_asr($value);
                    }
                } catch (Exception $e) {
                    $errors[$meta_key] = $e->getMessage();
                }
            }

            return rest_ensure_response([
                'success' => empty($errors),
                'saved' => $saved,
                'errors' => $errors,
            ]);
        } catch (Exception $e) {
            SecurityHelper::log_security_event('Error in batch save: ' . $e->getMessage(), 'error');
            return new WP_Error('internal_error', 'Error in batch save: ' . $e->getMessage(), ['status' => 500]);
        }
    }

    public function get_meta()
    {
        try {
            SecurityHelper::log_security_event('Fetching prayer settings', 'info');

            $results = PrayerDataCache::getMetaData();

            SecurityHelper::log_security_event("Found " . count($results) . " rows in settings table", 'info');

            if (empty($results)) {
                SecurityHelper::log_security_event('No settings found in database', 'warning');
                return rest_ensure_response([]);
            }

            // phpcs:disable WordPress.DB.SlowDBQuery.slow_db_query_meta_key -- false-positive: schema column names, not unindexed wp_postmeta/wp_usermeta queries.
            $results_array = array_map(function($obj) {
                $arr = (array)$obj;
                if (property_exists($obj, 'meta-key')) {
                    $arr['meta_key'] = $obj->{'meta-key'};
                } elseif (property_exists($obj, 'meta_key')) {
                    $arr['meta_key'] = $obj->{'meta_key'};
                }
                return $arr;
            }, $results);
            // phpcs:enable WordPress.DB.SlowDBQuery.slow_db_query_meta_key

            $wanted_keys = [
                'prayer_names', 'timetable_prayer', 'vertical_daily_prayer', 'day_names', 'gregorian_months',
                'gregorian_numbers', 'hijra_months', 'hijra_numbers', 'location', 'hijralocale',
                'activeLanguage', 'extra_info', 'midnight_calculation_mode', 'Only_affects_Asr_calculation',
                'Higher_Latitudes_Methods', 'Methods_For_Calculation', 'Rounding_Method',
                'rounding_selected', 'rounding_enabled', 'smoothing_selected', 'calendar_type', 'calendar_display', 'feature_toggles', 'feature_off_display', 'location_list', 'mfc_selected',
                'hlm_selected', 'month', 'ramadan', 'oaac_selected', 'mncm_selected', 'IQFajr',
                'IQDhuhr', 'IQAsr', 'IQMaghrib', 'IQIsha', 'Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha',
                'Imsak', 'Sunrise', 'Sunset', 'Midnight', 'printer', 'borderstyle', 'bordersize', 'borderradius',
                'borderclr', 'firstbg', 'firstclr', 'secondbg', 'secondclr', 'evenbg', 'evenclr',
                'oddbg', 'oddclr', 'highlightbg', 'highlightclr', 'hoverbg', 'hoverclr', 'hover_mode', 'hover_enabled', 'skip_iqamah_midnight',
                'hide_printer_button', 'hide_month_selection', 'printer_button_url',
                'hide_custom_url_button', 'auto_print_page_url', 'custom-prayer-time-schedules',
                'timetable_layout', 'next_prayer_countdown', 'vertical_today_layout',
                'day_display',
                'extra_prayers',
            ];

            $filtered_data = array_filter($results_array, function($row) use ($wanted_keys) {
                return in_array($row['meta_key'], $wanted_keys);
            });

            $transformed_data = array_values($filtered_data);

            SecurityHelper::log_security_event('Settings retrieved successfully', 'info');
            return rest_ensure_response($transformed_data);
        } catch (Exception $e) {
            SecurityHelper::log_security_event('Error fetching settings: ' . $e->getMessage(), 'error');
            return new WP_Error('internal_error', 'Error retrieving settings', ['status' => 500]);
        }
    }

    public function register_hooks() {
        add_action('wp_ajax_get_next_prayer', [$this, 'get_next_prayer']);
        add_action('wp_ajax_nopriv_get_next_prayer', [$this, 'get_next_prayer']);
        add_action('wp_ajax_fiveprayer_load_timetable', [$this, 'load_timetable']);
        add_action('wp_ajax_nopriv_fiveprayer_load_timetable', [$this, 'load_timetable']);
    }

    public function load_timetable() {
        $post_nonce = sanitize_text_field(filter_input(INPUT_POST, 'nonce') ?: '');
        $request_nonce = sanitize_text_field(filter_input(INPUT_GET, 'nonce') ?: '');
        $nonce = $post_nonce ?: $request_nonce ?: '';
        if (!wp_verify_nonce($nonce, 'fiveprayer_dynamic_nonce') && !wp_verify_nonce($nonce, 'fiveprayer_month_select_nonce')) {
            wp_send_json_error('Security check failed');
            wp_die();
        }

        $post_month = filter_input(INPUT_POST, 'month', FILTER_VALIDATE_INT);
        $get_month = filter_input(INPUT_GET, 'month', FILTER_VALIDATE_INT);
        $month = $post_month !== false ? $post_month : ($get_month !== false ? $get_month : 0);

        if ($month < 1 || $month > 13) {
            wp_send_json_error('Invalid month');
            wp_die();
        }

        if (!class_exists('\\FivePrayer\\Core\\Calendar\\CalendarGenerator')) {
            require_once plugin_dir_path(__FILE__) . '../../../Calendar/CalendarGenerator.php';
        }

        $calendar_generator = new \FivePrayer\Core\Calendar\CalendarGenerator();

        ob_start();
        $calendar_generator->generate_calendar_content_for_month($month, [], false);
        $output = ob_get_clean();

        wp_send_json_success($output);
    }

    public function get_next_prayer() {
        check_ajax_referer('fiveprayer_nonce', 'nonce');

        try {
            $highlighter = new \FivePrayer\Core\Helpers\FivePrayer_Highlighter();
            $next_prayer_slug = $highlighter->get_next_prayer_slug();

            if (empty($next_prayer_slug)) {
                wp_send_json_error(['message' => 'No prayer time found']);
                return;
            }

            wp_send_json_success([
                'nextPrayer' => $next_prayer_slug
            ]);
        } catch (\Exception $e) {
            wp_send_json_error([
                'message' => 'Error getting prayer time: ' . $e->getMessage()
            ]);
        }
    }
}

<?php
namespace FivePrayer\Core\Calendar;

/**
 * The CalendarGenerator class is responsible for generating the monthly calendar.
 * It handles fetching timetable data, formatting dates, and including the HTML template.
 */
defined('ABSPATH') || exit;

use FivePrayer\Core\Helpers\Validator;
use FivePrayer\Core\Helpers\DateFormatted;
use FivePrayer\Core\Calendar\RamadanMonthCalendar;
use FivePrayer\Core\Helpers\PrayerDataCache;
use FivePrayer\Core\Media\ImageUploader;
use FivePrayer\Core\Daily\Styles\DailyStyleDynamic;
use FivePrayer\Core\Security\SecurityHelper;

if (!class_exists('CalendarGenerator')) {
    
    class CalendarGenerator
    {
        // Function to add dynamic CSS for print
        public $timeTable;
        private $ramadanMonthCalendar;

        function __construct() {
            $this->ramadanMonthCalendar = new RamadanMonthCalendar();

            // Always enqueue print calendar script for page builder compatibility
            add_action('wp_enqueue_scripts', array($this, 'enqueue_print_calendar_js'));

            // Hook into cache clearing action to reset internal cache
            add_action('fiveprayer_clear_calendar_generator_cache', [$this, 'clearInternalCache']);
        }

        /**
         * Clear internal cache properties
         */
        public function clearInternalCache() {
            $this->timeTable = null;
        }
        // Function to retrieve timetable data (all or specific month)
        public function getTimetableData($validatedMonthNumber = null)
        {
            // Determine the current year
            $currentYear = (int) wp_date('Y');

            // Fetch data using the PrayerDataCache, which handles caching internally
            // PrayerDataCache::getTimetableData can handle a null month to fetch the whole year
            return PrayerDataCache::getTimetableData($validatedMonthNumber, $currentYear);
        }


        // Generate the monthly calendar
        //
        // $loadFullTimetable controls whether the whole year is loaded into
        // $this->timeTable. Internal data consumers (which call this with
        // $attributes === null) rely on it; a plain shortcode/block render only
        // needs the requested month, so it passes false to avoid a second, much
        // larger query on every page load.
        //
        // $monthOverride is the month a caller has already resolved (the AJAX
        // month switch). It is passed as an argument, not written into $_POST:
        // every read of request input in this class goes through
        // SecurityHelper, which uses filter_input() and therefore never sees a
        // value written into the superglobal at runtime.
        public function dynamic_generate_calendar($attributes = null, $skipFiltering = false, bool $loadFullTimetable = true, ?int $monthOverride = null) {
            global $wpdb;
            $hijra = new \FivePrayer\Core\Calendar\Hijra();
            $image_uploader = new \FivePrayer\Core\Media\ImageUploader();
 
            $image_url = $image_uploader->getImageUrl();
            $validatorChecker = new Validator();
            $dateFormatted = new DateFormatted();
            $year = wp_date('Y');
            // Optional cache-buster for monthly switching under caches. The
            // request must carry a valid nonce: the AJAX loader sends
            // "nonce" (dynamic content) and the no-JS form fallback sends
            // "fiveprayer_nonce" (month selection).
            $clear_cache_requested = SecurityHelper::has_query_arg('fp_clear_cache')
                || SecurityHelper::has_post_arg('fp_clear_cache');
            $clear_cache_nonce = SecurityHelper::get_sanitized_post_input('nonce');
            if ($clear_cache_nonce === '') {
                $clear_cache_nonce = SecurityHelper::get_sanitized_post_input('fiveprayer_nonce');
            }
            if ($clear_cache_nonce === '') {
                $clear_cache_nonce = SecurityHelper::get_sanitized_get_input('nonce');
            }
            $clear_cache_allowed = $clear_cache_requested && $clear_cache_nonce !== '' && (
                wp_verify_nonce($clear_cache_nonce, 'fiveprayer_dynamic_nonce')
                || wp_verify_nonce($clear_cache_nonce, 'fiveprayer_month_select_nonce')
            );

            if ($clear_cache_allowed) {
                try {
                    PrayerDataCache::invalidateAll();
                } catch (\Throwable $e) {
                    // Log the error but don't break the execution
                    \FivePrayer\Core\Logging\Logger::error('Error invalidating cache: ' . $e->getMessage(), 'CalendarGenerator');
                }
            }
            
            // Load dynamic styles to ensure CSS variables are available for page builders and frontend
            $dailyStyle = new DailyStyleDynamic();
            $dailyStyle->dailyStyleDynamic();
         
            // Fetch ALL meta settings in single optimized call
            $meta_keys = ["printer", "ramadan", "hijralocale", "activeLanguage", "gregorian_months",
                         "gregorian_numbers", "vertical_daily_prayer", "prayer_names", "timetable_prayer", "day_names", "day_display", "feature_toggles", "skip_iqamah_midnight", "timetable_layout"];
            $meta_values = PrayerDataCache::getMultipleMetaValues($meta_keys);
            
            $printer_json = $meta_values["printer"] ?? null;
            $ramadan_json = $meta_values["ramadan"] ?? null;
            $locale_json = $meta_values["hijralocale"] ?? null;
            $activeLanguage_json = $meta_values["activeLanguage"] ?? null;
            $gregorian_months_json = $meta_values["gregorian_months"] ?? null;
            $gregorian_numbers_json = $meta_values["gregorian_numbers"] ?? null;
            $vertical_daily_prayer_json = $meta_values["vertical_daily_prayer"] ?? null;
            $prayer_names_json = $meta_values["prayer_names"] ?? null;
            $timetable_prayer_json = $meta_values["timetable_prayer"] ?? null;
            $day_names_json = $meta_values["day_names"] ?? null;
            $day_display_json = $meta_values["day_display"] ?? null;
            $feature_toggles_json = $meta_values["feature_toggles"] ?? null;
            $skip_iqamah_midnight_json = $meta_values["skip_iqamah_midnight"] ?? null;
            $skip_iqamah_midnight = $skip_iqamah_midnight_json ? json_decode($skip_iqamah_midnight_json) : false;
            $timetable_layout_json = $meta_values["timetable_layout"] ?? null;
            $layout_options = $timetable_layout_json ? json_decode($timetable_layout_json, true) : [];
            
            // Decode JSON strings, providing defaults
            $ramadan_props = $ramadan_json ? json_decode($ramadan_json) : null;
            $printerInfo = $printer_json ? json_decode($printer_json) : null;
            $locale = $locale_json ? json_decode($locale_json, true) : []; // Ensure locale is an array

            $activeLanguage = $activeLanguage_json ? json_decode($activeLanguage_json, true) : [];
            $gregorian_months = $gregorian_months_json ? json_decode($gregorian_months_json, true) : [];
            $gregorian_numbers = $gregorian_numbers_json ? json_decode($gregorian_numbers_json, true) : [];
            $vertical_daily_prayer = $vertical_daily_prayer_json; // Assuming this might not always be JSON, or could be a simple value.
            $prayer_names = $prayer_names_json ? json_decode($prayer_names_json, true) : [];
            $timetable_prayer = $timetable_prayer_json ? json_decode($timetable_prayer_json, true) : [];
            $day_names = $day_names_json ? json_decode($day_names_json, true) : [];
            $day_display = $day_display_json ? json_decode($day_display_json, true) : [];
            $feature_toggles = $feature_toggles_json ? json_decode($feature_toggles_json, true) : [];
            $skip_iqamah_midnight = $skip_iqamah_midnight_json ? json_decode($skip_iqamah_midnight_json) : false;
            
            // Check if Hijra Calendar is active - if NOT active, ALWAYS force English
            $hijraIsActive = isset($locale['isActive']) && $locale['isActive'] === true;
            if (!$hijraIsActive) {
                $activeLanguage = [['language_code' => 'en']];  // Force English regardless of stored value
                $locale['customLan'] = false;
            }
 
            // Determine the month to render and validate it. A caller that
            // already resolved it wins; otherwise the no-JS month form's POST
            // value is used, and today's month is the fallback.
            $monthParam = SecurityHelper::get_sanitized_post_input('newMonth');

            if ($monthOverride !== null && $monthOverride >= 1 && $monthOverride <= 13) {
                $monthNumber = $monthOverride;
            } elseif (is_numeric($monthParam) && (int)$monthParam >= 1 && (int)$monthParam <= 13) {
                $monthNumber = (int)$monthParam;
            } else {
                $monthNumber = (int) wp_date('n');
            }
 
            // Ensure $locale is an array with expected keys
            $locale = $locale ?? ['customLan' => false];
            $activeLanguage = $activeLanguage ?? [['language_code' => 'en']];
            $gregorian_numbers = $gregorian_numbers ?? [];
            $gregorian_months = $gregorian_months ?? [];
 
            // Fetch all data (if no month is specified)
            
            // Fetch specific month's data if validatedMonthNumber is provided
            
            // Handle the case for custom language and date formatting
            if ($locale['customLan'] ?? false) {
                // Skip expensive full-year fetch during AJAX month switches — only the specific month is needed
                if ($loadFullTimetable && !wp_doing_ajax()) {
                    $data = $this->getTimetableData() ?? [];  // All data for current year
                    // Format the entire year data
                    $timeTableMonthly = $dateFormatted->gregorian_format($data, $gregorian_numbers, $gregorian_months, $activeLanguage);
                    $this->timeTable = $timeTableMonthly ?? [];
                }
            }
            
            if (is_numeric($monthNumber)) {
 
                $validatedMonthNumber = $validatorChecker->validate_monthly_number($monthNumber) ?? $monthNumber;
            
                $timeTableMonthly = $monthNumber == 13
                    ? $this->ramadanMonthCalendar->getRamadanMonthCalendar($monthNumber) ?? []
                    : $this->getTimetableData($validatedMonthNumber) ?? [];
                if (!empty($timeTableMonthly) && ($locale['customLan'] ?? false)) {
                    $timeTableMonthly = $dateFormatted->gregorian_format($timeTableMonthly, $gregorian_numbers, $gregorian_months, $activeLanguage) ?? [];
                }
 
                if (!($locale['customLan'] ?? false)) {
                    // Skip expensive full-year fetch during AJAX month switches
                    // and during plain shortcode/block renders.
                    if ($loadFullTimetable && !wp_doing_ajax()) {
                        $this->timeTable = $this->getTimetableData() ?? [];
                    }
                }
                // this is for global timetable data specail the vertical daily prayer need all data with out specific month
            }
            
            // Determine the printer logo
            // Ensure $printerInfo is an object for consistent access, even if printer_json was null/empty
            $printerInfo = $printerInfo ?? (object)['printer_logo' => ''];
            $url_image_printer = (!empty($printer_json) && $printerInfo && isset($printerInfo->printer_logo) && $printerInfo->printer_logo != '')
                ? $printerInfo->printer_logo
                :  esc_url($image_url);
 
            // Include the appropriate template based on layout type
            if ($attributes !== null) {
                if (isset($layout_options['layoutType']) && $layout_options['layoutType'] === 'hijri') {
                    include plugin_dir_path(__FILE__) . 'CalendarTemplateHijri.php';
                } else {
                    include plugin_dir_path(__FILE__) . 'CalendarTemplateDefault.php';
                }
            }
            
            // Filter out midnight and iqamah columns if skip_iqamah_midnight is enabled
            // This affects the data used by PrayerDataCache (React admin interface)
            // Skip filtering if $skipFiltering is true (for single prayer shortcodes)
            // Only apply the legacy flag when timetable_layout does not explicitly
            // define the columns — otherwise the layout options win (matches templates).
            $layoutDefinesColumns = !empty($layout_options)
                && (isset($layout_options['showIqamah']) || isset($layout_options['showMidnight']));
            $effectiveSkipIqamahMidnight = $layoutDefinesColumns ? false : $skip_iqamah_midnight;
            if (!$skipFiltering && $effectiveSkipIqamahMidnight && !empty($this->timeTable)) {
                foreach ($this->timeTable as &$row) {
                    unset($row->midnight);
                    unset($row->fajr_iqamah);
                    unset($row->dhuhr_iqamah);
                    unset($row->asr_iqamah);
                    unset($row->maghrib_iqamah);
                    unset($row->isha_iqamah);
                }
            }
        }

       /**
        * Separate method to generate calendar content that can be called with a specific month
        * This is used by the AJAX handler to generate calendar for a specific month
        */
       public function generate_calendar_content_for_month($monthNumber, $attributes = null, $skipFiltering = false, bool $loadFullTimetable = true) {
           // Hand the month to the generator directly. Writing it into $_POST
           // did not work: the request helpers read the original request with
           // filter_input(), which ignores runtime writes to the superglobal,
           // so the month switch re-rendered the current month.
           $this->dynamic_generate_calendar($attributes, $skipFiltering, $loadFullTimetable, (int) $monthNumber);
       }

       /**
        * Method to get the month parameter for use in templates
        */
       public function getCurrentMonthForTemplate() {
           $monthParam = SecurityHelper::get_sanitized_request_input('newMonth');
           $monthNumber = (is_numeric($monthParam) && (int)$monthParam >= 1 && (int)$monthParam <= 13)
               ? (int)$monthParam
               : (int) wp_date('n');
           return $monthNumber;
       }

       /**
     * Get file modification time for cache busting, fallback to plugin version
     */
   private function getFileVersion(string $relative_path): string
   {
       $file_path = plugin_dir_path(__FILE__) . $relative_path;
       return file_exists($file_path) ? (string)filemtime($file_path) : \FivePrayer\Core\Database\VersionManager::getCurrentPluginVersion();
   }

   // Enqueue print calendar JS
   public function enqueue_print_calendar_js()
   {
       // Use the central function to enqueue combined scripts instead of individual files
       if (function_exists('fiveprayer_enqueue_combined_scripts')) {
           fiveprayer_enqueue_combined_scripts();

           // Localize script with AJAX data for the combined script
           wp_localize_script('fiveprayer-combined-js', 'fiveprayer_ajax', array(
               'ajaxurl' => admin_url('admin-ajax.php'),
               'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce'),
               'auto_print_page_url' => \FivePrayer\Core\Helpers\PrinterHelper::getAutoPrintPageUrl(),
           ));
       } else {
           // Fallback to individual file if central function is not available
           wp_enqueue_script('print-calendar', plugin_dir_url(__FILE__) . 'JS/PrintCalendar.js', array(), $this->getFileVersion('JS/PrintCalendar.js'), true);

           // Localize script with AJAX data to make it available to the JavaScript
           wp_localize_script('print-calendar', 'fiveprayer_ajax', array(
               'ajaxurl' => admin_url('admin-ajax.php'),
               'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce'),
               'auto_print_page_url' => \FivePrayer\Core\Helpers\PrinterHelper::getAutoPrintPageUrl(),
           ));
       }
       }
    }
}

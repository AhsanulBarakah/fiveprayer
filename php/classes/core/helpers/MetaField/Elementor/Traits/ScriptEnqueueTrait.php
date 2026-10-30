<?php

namespace FivePrayer\Core\Helpers\MetaField\Elementor\Traits;

defined('ABSPATH') || exit;

trait ScriptEnqueueTrait
{
    /**
     * Validate post ID for security
     */
    protected function validate_post_id($post_id): bool
    {
        if (empty($post_id) || !is_numeric($post_id)) {
            return false;
        }

        $post_id = intval($post_id);
        if ($post_id <= 0) {
            return false;
        }

        // Check if post exists and is published
        $post = get_post($post_id);
        if (!$post || $post->post_status !== 'publish') {
            return false;
        }

        return true;
    }

    /**
     * Enqueue live time script with security
     */
    protected function enqueue_secure_live_time_script(): void
    {
        try {
            // Use the central function to enqueue combined scripts
            fiveprayer_enqueue_combined_scripts();

            // Get translation data with security validation
            $this->enqueue_secure_live_time_translations();
        } catch (\Exception $e) {
            \FivePrayer\Core\Logging\Logger::error('Error enqueuing live time script: ' . $e->getMessage(), 'BaseDynamicTag');
        }
    }

    /**
     * Enqueue secure live time translations
     */
    protected function enqueue_secure_live_time_translations(): void
    {
        try {
            if (!class_exists('\FivePrayer\Core\Helpers\GetMeta')) {
                // Fallback: use default translations if GetMeta is not available
                return;
            }
            $getMetaFromDB = new \FivePrayer\Core\Helpers\GetMeta();
            $activeLanguage = $getMetaFromDB->get_meta_key("activeLanguage", [['language_code' => 'en']]);
            $customLan = $getMetaFromDB->get_meta_key("hijralocale", []);
            $numbers = $getMetaFromDB->get_meta_key("gregorian_numbers", []);
            
            // Check if Hijra Calendar is active - if NOT active, ALWAYS force English
            $hijraIsActive = isset($customLan['isActive']) && $customLan['isActive'] === true;
            if (!$hijraIsActive) {
                $activeLanguage = [['language_code' => 'en']];  // Force English regardless of stored value
            }

            // Build translation array with English fallback and security validation
            $translations = array_merge(
                array_fill_keys(array_map('strval', range(0, 9)), array_map('strval', range(0, 9))),
                ['AM' => 'AM', 'PM' => 'PM']
            );

            if (is_array($numbers) && !empty($activeLanguage[0]['language_code'])) {
                $targetLang = \FivePrayer\Core\Security\SecurityHelper::sanitize_input($activeLanguage[0]['language_code']);
                $foundAM = false;
                $foundPM = false;

                foreach ($numbers as &$num) {
                    if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                        $num['language_code'] === $targetLang) {

                        $original = \FivePrayer\Core\Security\SecurityHelper::sanitize_input(strtoupper($num['original_text']));
                        $translated = \FivePrayer\Core\Security\SecurityHelper::sanitize_text($num['translated_text']);

                        if (in_array($original, ['0','1','2','3','4','5','6','7','8','9','AM','PM'])) {
                            $translations[$original] = $translated;
                            $translations[strtolower($original)] = strtolower($translated);

                            if ($original === 'AM') $foundAM = true;
                            if ($original === 'PM') $foundPM = true;
                        }
                    }
                }

                // If AM/PM not found, try English fallback
                if (!$foundAM || !$foundPM) {
                    foreach ($numbers as &$num) {
                        if (isset($num['original_text'], $num['translated_text'], $num['language_code']) &&
                            $num['language_code'] === 'en') {

                            $original = \FivePrayer\Core\Security\SecurityHelper::sanitize_input(strtoupper($num['original_text']));
                            $translated = \FivePrayer\Core\Security\SecurityHelper::sanitize_text($num['translated_text']);

                            if (($original === 'AM' && !$foundAM) || ($original === 'PM' && !$foundPM)) {
                                $translations[$original] = $translated;
                                $translations[strtolower($original)] = strtolower($translated);
                            }
                        }
                    }
                }
            }

            // Localize script with translation data and security
            $timeFormat = get_option('time_format', 'h:i A');
            $timeData = [
                'numbers' => \FivePrayer\Core\Security\SecurityHelper::sanitize_input($translations),
                'ampm' => [
                    'AM' => $translations['AM'] ?? 'AM',
                    'PM' => $translations['PM'] ?? 'PM'
                ],
                'initialTime' => date_i18n($timeFormat),
                'timeFormat' => \FivePrayer\Core\Security\SecurityHelper::sanitize_input($timeFormat),
                'timeSelector' => '.fiveprayer-live-time',
                'activeLanguage' => \FivePrayer\Core\Security\SecurityHelper::sanitize_input($activeLanguage[0]['language_code'] ?? 'en'),
                'customLan' => \FivePrayer\Core\Security\SecurityHelper::sanitize_input($customLan['customLan'] ?? false),
            ];

            // Use centralized script localization manager to prevent duplicates
            if (class_exists('\\FivePrayer\Core\Assets\ScriptLocalizationManager')) {
                $localization_manager = \FivePrayer\Core\Assets\ScriptLocalizationManager::getInstance();
                $localization_manager->localizeScript(
                    'fiveprayer-live-time',
                    'fiveprayerTimeData',
                    $timeData
                );
            } else {
                wp_localize_script(
                    'fiveprayer-live-time',
                    'fiveprayerTimeData',
                    $timeData
                );
            }
        } catch (\Exception $e) {
            \FivePrayer\Core\Logging\Logger::error('Error enqueuing live time translations: ' . $e->getMessage(), 'BaseDynamicTag');
        }
    }

    /**
     * Enqueue dynamic content loader script with security
     */
    protected function enqueue_secure_dynamic_content_loader(): void
    {
        try {
            // Use the central function to enqueue combined scripts
            fiveprayer_enqueue_combined_scripts();

            // Localize script with AJAX URL and nonce
            wp_localize_script('fiveprayer-dynamic-content-loader', 'fiveprayer_dynamic', [
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('fiveprayer_dynamic_nonce')
            ]);
        } catch (\Exception $e) {
            \FivePrayer\Core\Logging\Logger::error('Error enqueuing dynamic content loader: ' . $e->getMessage(), 'BaseDynamicTag');
        }
    }
}

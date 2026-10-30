<?php
namespace FivePrayer\Core\Database;

use FivePrayer\Core\Security\SecurityHelper;

if ( ! defined( 'ABSPATH' ) ) {
    exit;
}

if ( ! class_exists( 'Translate' ) ) {
    class Translate {
        /**
         * Object cache group and TTL shared by all translation lookups.
         * Short TTL because translations are editable from the admin UI.
         */
        private const CACHE_GROUP = 'fiveprayer';
        private const CACHE_TTL = 300;

        /**
         * Cache key for the JSON blob holding every custom translation.
         */
        private const TRANSLATIONS_CACHE_KEY = 'fiveprayer_translations_json';

        private static $instance;
        private $table_name;
        private $use_custom_translations;
        private $language_code;

        /**
         * Build the object cache key for a single secure translation lookup.
         */
        private static function secure_translation_cache_key($language_code, $original_text)
        {
            return 'fiveprayer_translation_' . md5($language_code . '|' . $original_text);
        }

        public function __construct( $use_custom_translations = false, $language_code = 'en' ) {
            global $wpdb;
            $this->table_name = $wpdb->prefix . 'fp_prayer_settings_meta'; // Updated table name
            $this->use_custom_translations = $use_custom_translations;
            $this->language_code = $language_code;
        }

        // Singleton pattern to ensure only one instance
        public static function get_instance( $use_custom_translations = false, $language_code = 'en' ) {
            if ( ! isset( self::$instance ) ) {
                self::$instance = new self( $use_custom_translations, $language_code );
            }
            return self::$instance;
        }

        // Get translation (WordPress or Custom)
        public function get_translation( $text, $domain = 'default' ) {
            $text = sanitize_text_field( $text );

            if ( $this->use_custom_translations ) {
                return $this->get_custom_translation( $text );
            } else {
                // translators: dynamic translation fallback, use `get_translation` which passes a sanitized text variable.
                // phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText,WordPress.WP.I18n.NonSingularStringLiteralDomain,WordPress.WP.I18n.LowLevelTranslationFunction
                return esc_html( translate( $text, $domain ) ); // Use WordPress translation
            }
        }

        // Get custom translation from the database
        private function get_custom_translation( $text ) {
            global $wpdb;

            // Fetch the JSON data from the table
            $meta_key = 'translations'; // Unique key for translations

            // Translations are read once per rendered string, so cache the row in
            // the object cache instead of querying it every time.
            $cache_key = self::TRANSLATIONS_CACHE_KEY;
            $result    = wp_cache_get( $cache_key, self::CACHE_GROUP );

            if ( false === $result ) {
                $result = $wpdb->get_var( $wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    "SELECT value FROM %i WHERE `meta-key` = %s",
                    $this->table_name,
                    $meta_key
                ));

                if ( $wpdb->last_error ) {
                    return esc_html( $text );
                }

                wp_cache_set( $cache_key, $result, self::CACHE_GROUP, self::CACHE_TTL );
            }

            if ( $result ) {
                $translations = json_decode( $result, true );

                // Search for the translation in all keys (prayernames, gregorian_months, etc.)
                foreach ( $translations as $key => $translation_array ) {
                    if ( is_array( $translation_array ) ) {
                        foreach ( $translation_array as &$translation ) {
                            if ( isset( $translation['original_text'] ) && $translation['original_text'] === $text && isset( $translation['language_code'] ) && $translation['language_code'] === $this->language_code ) {
                                return esc_html( $translation['translated_text'] );
                            }
                        }
                    }
                }
            }

            // Return the original text if no translation is found
            return esc_html( $text );
        }

        public function get_translation_secure($language_code, $original_text)
        {
            try {
                SecurityHelper::log_security_event('Getting translation', 'info');
                SecurityHelper::validate_input($language_code);
                SecurityHelper::validate_input($original_text);

                global $wpdb;
                $table_name = $wpdb->prefix . 'fp_prayer_settings_meta';

                $cache_key = self::secure_translation_cache_key($language_code, $original_text);
                $cached    = wp_cache_get($cache_key, self::CACHE_GROUP);

                if (false !== $cached) {
                    return $cached;
                }

                $result = $wpdb->get_var( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                    $wpdb->prepare(
                        "SELECT value FROM %i WHERE `meta-key` = %s AND value LIKE %s",
                        $table_name,
                        $language_code,
                        '%' . $wpdb->esc_like($original_text) . '%'
                    )
                );
                if ($wpdb->last_error) {
                    SecurityHelper::log_security_event('Database error: ' . $wpdb->last_error, 'error');
                    return null;
                }

                if ($result) {
                    $decoded = json_decode($result, true);
                    if (is_array($decoded)) {
                        SecurityHelper::validate_input($decoded);
                        wp_cache_set($cache_key, $decoded, self::CACHE_GROUP, self::CACHE_TTL);
                        return $decoded;
                    }
                }

                wp_cache_set($cache_key, null, self::CACHE_GROUP, self::CACHE_TTL);

                SecurityHelper::log_security_event('No translation found', 'info');
                return null;
            } catch (Exception $e) {
                SecurityHelper::log_security_event('Error getting translation: ' . $e->getMessage(), 'error');
                return null;
            }
        }

        public function store_translation_secure($language_code, $original_text, $translated_text)
        {
            try {
                SecurityHelper::log_security_event('Storing translation', 'info');
                SecurityHelper::validate_input($language_code);
                SecurityHelper::validate_input($original_text);
                SecurityHelper::validate_input($translated_text);

                global $wpdb;
                $table_name = $wpdb->prefix . 'fp_prayer_settings_meta';

                $translation = [
                    'language_code' => $language_code,
                    'original_text' => SecurityHelper::sanitize_text($original_text),
                    'translated_text' => SecurityHelper::sanitize_text($translated_text)
                ];

                $id_cache_key = 'fiveprayer_translation_id_' . md5($language_code . '|' . $original_text);
                $existing_id  = wp_cache_get($id_cache_key, self::CACHE_GROUP);

                if (false === $existing_id) {
                    $existing_id = $wpdb->get_var($wpdb->prepare( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                        "SELECT id FROM %i WHERE `meta-key` = %s AND value LIKE %s",
                        $table_name,
                        $language_code,
                        '%' . $wpdb->esc_like($original_text) . '%'
                    ));
                    wp_cache_set($id_cache_key, $existing_id, self::CACHE_GROUP, self::CACHE_TTL);
                }

                if ($existing_id) {
                    $wpdb->update( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                        $table_name,
                        ['value' => wp_json_encode($translation, JSON_UNESCAPED_UNICODE)],
                        ['id' => $existing_id],
                        ['%s'],
                        ['%d']
                    );
                } else {
                    $wpdb->insert( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
                        $table_name,
                        ['meta-key' => $language_code, 'value' => wp_json_encode($translation, JSON_UNESCAPED_UNICODE)],
                        ['%s', '%s']
                    );
                }

                // The row we just wrote is served from the object cache on the next
                // read, so drop every entry derived from it.
                wp_cache_delete(self::secure_translation_cache_key($language_code, $original_text), self::CACHE_GROUP);
                wp_cache_delete($id_cache_key, self::CACHE_GROUP);
                wp_cache_delete(self::TRANSLATIONS_CACHE_KEY, self::CACHE_GROUP);

                SecurityHelper::log_security_event('Translation stored successfully', 'info');
                return true;
            } catch (Exception $e) {
                SecurityHelper::log_security_event('Error storing translation: ' . $e->getMessage(), 'error');
                return false;
            }
        }
    }
    
    // Initialize the class
    Translate::get_instance();
}
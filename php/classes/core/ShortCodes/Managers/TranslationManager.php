<?php
namespace FivePrayer\Core\ShortCodes\Managers;

use FivePrayer\Core\Security\SecurityHelper;

defined('ABSPATH') || exit('May Allah Guide You, Ameen.');

class TranslationManager {
    private array $prayer_names;
    private array $activeLanguage;
    private array $locale;
    private array $vertical_daily_prayer;
    private array $extra_info;

    public function __construct(array $prayer_names, array $activeLanguage, array $locale, array $vertical_daily_prayer, array $extra_info) {
        $this->prayer_names = $prayer_names;
        $this->activeLanguage = $activeLanguage;
        $this->locale = $locale;
        $this->vertical_daily_prayer = $vertical_daily_prayer;
        $this->extra_info = $extra_info;
    }

    /**
     * Returns the translated prayer name strictly from the database-stored
     * translation system. Returns an empty string when the translation is
     * not present - the API exposes only what the translation database has,
     * never a hardcoded English fallback.
     */
    public function getTranslatedPrayerName(string $prayerKey): string {
        try {
            SecurityHelper::validate_prayer_name($prayerKey);
            $prayerKey = $this->normalizeLookupKey($prayerKey);

            if (empty($this->prayer_names) ||
                empty($this->activeLanguage) ||
                !isset($this->locale['customLan']) ||
                $this->locale['customLan'] == false) {
                return esc_html($prayerKey);
            }

            if (!isset($this->activeLanguage[0]['language_code'])) {
                return esc_html($prayerKey);
            }

            $active_lang_code = $this->activeLanguage[0]['language_code'];

            foreach ($this->prayer_names as $prayer_name) {
                if (!isset($prayer_name['language_code']) ||
                    !isset($prayer_name['original_text']) ||
                    !isset($prayer_name['translated_text'])) {
                    continue;
                }

                if ($prayer_name['language_code'] === $active_lang_code) {
                    if (strcasecmp($prayerKey, $prayer_name['original_text']) === 0) {
                        return esc_html($prayer_name['translated_text']);
                    }
                }
            }
            return esc_html($prayerKey);
        } catch (\Throwable $e) {
            SecurityHelper::log_security_event('Error in getTranslatedPrayerName: ' . $e->getMessage(), 'error');
            return '';
        }
    }

    /**
     * Returns the translated label strictly from the database-stored
     * translation system. Returns an empty string when the translation is
     * not present - the API exposes only what the translation database has,
     * never a hardcoded English fallback.
     */
    public function getTranslatedLabel(string $key): string {
        try {
            $key = $this->normalizeLookupKey($key);

            if (empty($this->vertical_daily_prayer) && empty($this->extra_info) ||
                empty($this->activeLanguage) ||
                !isset($this->locale['customLan']) ||
                $this->locale['customLan'] == false) {
                return esc_html($key);
            }

            if (!isset($this->activeLanguage[0]['language_code'])) {
                return esc_html($key);
            }

            $active_lang_code = $this->activeLanguage[0]['language_code'];

            // Try extra_info first
            foreach ($this->extra_info as $item) {
                if (!isset($item['language_code']) ||
                    !isset($item['original_text']) ||
                    !isset($item['translated_text'])) {
                    continue;
                }

                if ($item['language_code'] === $active_lang_code) {
                    if (strcasecmp($key, $item['original_text']) === 0) {
                        return esc_html($item['translated_text']);
                    }
                }
            }

            // If not found in extra_info, try vertical_daily_prayer
            foreach ($this->vertical_daily_prayer as $item) {
                if (!isset($item['language_code']) ||
                    !isset($item['original_text']) ||
                    !isset($item['translated_text'])) {
                    continue;
                }

                if ($item['language_code'] === $active_lang_code) {
                    if (strcasecmp($key, $item['original_text']) === 0) {
                        return esc_html($item['translated_text']);
                    }
                }
            }

            // Check prayer names if not found in other locations
            foreach ($this->prayer_names as $prayer) {
                if (!isset($prayer['language_code']) ||
                    !isset($prayer['original_text']) ||
                    !isset($prayer['translated_text'])) {
                    continue;
                }

                if ($prayer['language_code'] === $active_lang_code) {
                    if (strcasecmp($key, $prayer['original_text']) === 0) {
                        return esc_html($prayer['translated_text']);
                    }
                }
            }

            return esc_html($key);
        } catch (\Throwable $e) {
            SecurityHelper::log_security_event('Error in getTranslatedLabel: ' . $e->getMessage(), 'error');
            return esc_html($key);
        }
    }

    /**
     * Normalise a translation lookup key.
     *
     * The key is only ever *compared* against the stored original text, so it
     * must not be HTML-escaped. SecurityHelper::sanitize_input() rewrites
     * "Jumu'ah 1" to "Jumu&amp;#x27;ah 1", which can never match the plain
     * stored label -- and that mangled string used to reach the front end
     * through the fallback return. Entities are decoded as well so a key that
     * was escaped upstream still matches. The value handed back to callers is
     * esc_html()'d on the way out, so output stays safe.
     */
    private function normalizeLookupKey(string $key): string {
        return html_entity_decode(sanitize_text_field($key), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    }

    public function isCustomLanguageEnabled(): bool {
        return isset($this->locale['customLan']) && $this->locale['customLan'] === true;
    }
}
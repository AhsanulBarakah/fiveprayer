<?php
namespace FivePrayer\Core\Helpers;

defined('ABSPATH') || exit;

/**
 * DayNameFormatter
 *
 * Builds the optional "Day" value rendered by the monthly timetable column, the
 * Vertical Daily Prayer header and the current-date shortcode. The parts and
 * their order are driven by the global `day_display` config (Configure Settings
 * → Day Display), gated by the `Day_Display` master switch in Feature Switches:
 *
 *   - full weekday name  (Friday)
 *   - short weekday name (Fri)
 *   - day-of-month       (27th / السابع والعشرون)
 *   - order              name_first → "Fri 27th", number_first → "27th Fri"
 *
 * Every part is looked up in the `day_names` translation collection for the
 * active language, so English and Arabic ship as defaults and a user-added
 * language is honoured without touching this class. When no translation exists
 * (or the custom language is off) the native English value is used as a safe
 * fallback.
 */
class DayNameFormatter
{
    /** Feature-switch key that gates the whole Day feature. */
    public const FEATURE_KEY = 'Day_Display';

    /** Day name comes first: "Fri 27th". */
    public const ORDER_NAME_FIRST = 'name_first';

    /** Day number comes first: "27th Fri". */
    public const ORDER_NUMBER_FIRST = 'number_first';

    /**
     * Whether the Day feature is switched on in the Feature Switches map.
     *
     * Ships OFF: only an explicit `true` counts, matching the React default.
     *
     * @param mixed $featureToggles Decoded `feature_toggles` meta.
     */
    public static function isEnabled($featureToggles): bool
    {
        if (!is_array($featureToggles)) {
            return false;
        }

        return ($featureToggles[self::FEATURE_KEY] ?? false) === true;
    }

    /**
     * Normalise a stored `day_display` config into the shape the renderers use,
     * honouring the master switch. Returns every flag false (and order
     * name_first) when the feature is switched off.
     *
     * @param mixed $dayDisplay     Decoded `day_display` meta.
     * @param mixed $featureToggles Decoded `feature_toggles` meta.
     * @return array{enabled: bool, showFull: bool, showShort: bool, showNumber: bool, order: string}
     */
    public static function resolve($dayDisplay, $featureToggles): array
    {
        $enabled = self::isEnabled($featureToggles);

        $config = is_array($dayDisplay) ? $dayDisplay : [];
        $order  = ($config['order'] ?? self::ORDER_NAME_FIRST) === self::ORDER_NUMBER_FIRST
            ? self::ORDER_NUMBER_FIRST
            : self::ORDER_NAME_FIRST;

        return [
            'enabled'    => $enabled,
            'showFull'   => $enabled && !empty($config['showFull']),
            'showShort'  => $enabled && !empty($config['showShort']),
            'showNumber' => $enabled && !empty($config['showNumber']),
            'order'      => $order,
        ];
    }

    /**
     * The individual day parts (name and/or number), already translated.
     *
     * @return array{name: string, number: string}
     */
    public static function parts(
        string $date,
        array $dayNames,
        string $lang,
        bool $customLan,
        bool $full,
        bool $short,
        bool $number
    ): array {
        $timestamp = strtotime($date);
        if ($timestamp === false) {
            return ['name' => '', 'number' => ''];
        }

        $nameParts = [];
        if ($full) {
            $nameParts[] = self::translate('l', $timestamp, $dayNames, $lang, $customLan);
        }
        if ($short) {
            $nameParts[] = self::translate('D', $timestamp, $dayNames, $lang, $customLan);
        }

        return [
            'name'   => trim(implode(' ', array_filter($nameParts, static fn($p) => $p !== ''))),
            'number' => $number ? self::translateNumber($timestamp, $dayNames, $lang, $customLan) : '',
        ];
    }

    /**
     * Format a date into the enabled day parts, joined with a single space and
     * ordered by `$order`.
     *
     * @param string $date      Any date string accepted by strtotime().
     * @param array  $dayNames  Decoded `day_names` translation entries.
     * @param string $lang      Active language code (e.g. 'en', 'ar').
     * @param bool   $customLan Whether the custom language system is active.
     * @param bool   $full      Include the full weekday name.
     * @param bool   $short     Include the short weekday name.
     * @param bool   $number    Include the day-of-month ordinal.
     * @param string $order     'name_first' (default) or 'number_first'.
     * @return string Space-joined day parts, or '' when none are enabled.
     */
    public static function format(
        string $date,
        array $dayNames,
        string $lang,
        bool $customLan,
        bool $full,
        bool $short,
        bool $number,
        string $order = self::ORDER_NAME_FIRST
    ): string {
        if (!$full && !$short && !$number) {
            return '';
        }

        $parts = self::parts($date, $dayNames, $lang, $customLan, $full, $short, $number);

        $ordered = $order === self::ORDER_NUMBER_FIRST
            ? [$parts['number'], $parts['name']]
            : [$parts['name'], $parts['number']];

        return trim(implode(' ', array_filter($ordered, static fn($p) => $p !== '')));
    }

    /**
     * The plain day-of-month rendered in the active language's digits (no
     * ordinal suffix/word). Used to locate the day token inside an already
     * translated date string before it is swapped for the ordinal.
     */
    public static function plainDayDigits(
        string $date,
        array $gregorianNumbers,
        string $lang,
        bool $customLan
    ): string {
        $timestamp = strtotime($date);
        if ($timestamp === false) {
            return '';
        }

        $day = (string) (int) gmdate('j', $timestamp);

        if (!$customLan || empty($gregorianNumbers)) {
            return $day;
        }

        $map = [];
        foreach ($gregorianNumbers as $entry) {
            if (isset($entry['language_code'], $entry['original_text'], $entry['translated_text'])
                && $entry['language_code'] === $lang) {
                $map[(string) $entry['original_text']] = (string) $entry['translated_text'];
            }
        }

        if (empty($map)) {
            return $day;
        }

        return implode('', array_map(static fn($ch) => $map[$ch] ?? $ch, str_split($day)));
    }

    /**
     * Compose the day parts *inline at the day position* of an already rendered
     * (translated) date string, replacing the plain day number — the first
     * occurrence, so the year is never touched.
     *
     * The weekday name stays inside the date instead of being appended, so the
     * current-date shortcode reads:
     *
     *   name_first   → "Wed 14th October 2026"
     *   number_first → "14th Wed October 2026"
     *
     * When the Number part is on the plain digits become the ordinal; when only
     * the name is on the plain digits stay beside it. With nothing enabled (or
     * the day token not found) the date string is returned unchanged.
     *
     * @param string $dateString       Rendered/translated date text.
     * @param string $date             Raw date used to derive the day parts.
     * @param array  $dayNames         Decoded `day_names` translation entries.
     * @param array  $gregorianNumbers Decoded `gregorian_numbers` entries.
     * @param string $lang             Active language code.
     * @param bool   $customLan        Whether the custom language system is on.
     * @param bool   $full             Include the full weekday name.
     * @param bool   $short            Include the short weekday name.
     * @param bool   $number           Include the day-of-month ordinal.
     * @param string $order            'name_first' (default) or 'number_first'.
     */
    public static function placeInDate(
        string $dateString,
        string $date,
        array $dayNames,
        array $gregorianNumbers,
        string $lang,
        bool $customLan,
        bool $full,
        bool $short,
        bool $number,
        string $order = self::ORDER_NAME_FIRST
    ): string {
        if (!$full && !$short && !$number) {
            return $dateString;
        }

        $parts    = self::parts($date, $dayNames, $lang, $customLan, $full, $short, $number);
        $name     = $parts['name'];
        $plainDay = self::plainDayDigits($date, $gregorianNumbers, $lang, $customLan);

        if ($plainDay === '') {
            return $dateString;
        }

        $numberFirst = $order === self::ORDER_NUMBER_FIRST;

        if ($number && $parts['number'] !== '') {
            $dayPiece = $name !== ''
                ? ($numberFirst ? $parts['number'] . ' ' . $name : $name . ' ' . $parts['number'])
                : $parts['number'];
        } else {
            $dayPiece = $name !== ''
                ? ($numberFirst ? $plainDay . ' ' . $name : $name . ' ' . $plainDay)
                : $plainDay;
        }

        if ($dayPiece === $plainDay) {
            return $dateString;
        }

        $replaced = preg_replace('/' . preg_quote($plainDay, '/') . '/u', $dayPiece, $dateString, 1);

        return is_string($replaced) ? $replaced : $dateString;
    }

    /**
     * Translate a weekday value ('l' full name or 'D' short name) through the
     * day_names collection. Falls back to the native English name.
     */
    private static function translate(
        string $format,
        int $timestamp,
        array $dayNames,
        string $lang,
        bool $customLan
    ): string {
        $english = gmdate($format, $timestamp);

        if (!$customLan || empty($dayNames)) {
            return $english;
        }

        foreach ($dayNames as $entry) {
            if (!isset($entry['language_code'], $entry['original_text'], $entry['translated_text'])) {
                continue;
            }
            if ($entry['language_code'] === $lang
                && strcasecmp((string) $entry['original_text'], $english) === 0
                && $entry['translated_text'] !== '') {
                return (string) $entry['translated_text'];
            }
        }

        return $english;
    }

    /**
     * Translate the day-of-month ordinal. The lookup key is the plain day
     * number, so it works for any language's ordinal form. Falls back to the
     * English ordinal ('1st', '2nd', …).
     */
    private static function translateNumber(
        int $timestamp,
        array $dayNames,
        string $lang,
        bool $customLan
    ): string {
        $day = (int) gmdate('j', $timestamp);

        if (!$customLan || empty($dayNames)) {
            return gmdate('jS', $timestamp);
        }

        foreach ($dayNames as $entry) {
            if (!isset($entry['language_code'], $entry['original_text'], $entry['translated_text'])) {
                continue;
            }
            if ($entry['language_code'] === $lang
                && (string) $entry['original_text'] === (string) $day
                && $entry['translated_text'] !== '') {
                return (string) $entry['translated_text'];
            }
        }

        return gmdate('jS', $timestamp);
    }
}

# FivePrayer External API Documentation

## Overview

The FivePrayer plugin now includes a powerful external API that allows external applications to access prayer times data securely with API key authentication.

## Features

- **Secure API Key Authentication**: Each application requires a unique API key (except the `/test` endpoint)
- **Second ‘Asr (`asr2`)**: Every prayer-times response includes the optional Hanafi 2 Mithl time on the days that have one, directly after `asr` — no extra parameter needed
- **Comprehensive Endpoints**: Access prayer times, mosque information, and more
- **Per-Key Rate Limiting**: Each API key has a configurable rate limit (default: 1,000 requests per hour)
- **Brute Force Protection**: IPs with too many failed API key attempts are temporarily blocked
- **Usage Tracking**: Monitor API usage and last access times
- **Key Management**: Create, revoke, and delete API keys through the admin interface
- **CORS Support**: Cross-Origin Resource Sharing headers are automatically set for browser-based consumers
- **Modern Admin Interface**: Easy-to-use dashboard for API management

## API Endpoints

### Base URL
```
https://your-site.com/wp-json/fiveprayer/v1/external/
```

### Authentication

All endpoints except `/test` require a valid API key. Include your API key in the request header:
```
X-API-Key: your_api_key_here
```

The `/test` endpoint is publicly accessible and does not require any authentication.

### Cross-Origin (CORS) Support

The API automatically includes CORS headers for browser-based consumers:
```
Access-Control-Allow-Origin: <request-origin> or *
Access-Control-Allow-Methods: GET, OPTIONS
Access-Control-Allow-Headers: X-API-Key, Content-Type, Authorization, Accept
Access-Control-Max-Age: 86400
```

No additional configuration is needed — the headers are set automatically for all external API endpoints.

### Language

All external API endpoints default to English (`en`) when no language is specified. You can override this with the `lang` parameter for a single language, or request multiple languages with the `langs` parameter.

- `lang` (optional): Single language code. Defaults to `en`.
  - Example: `lang=ar`
- `langs` (optional): Comma-separated list of language codes.
  - Example: `langs=ar,en`

When `langs` is used, the response will include a `languages` array with the requested codes. The `lang` parameter still defaults to `en` in that case.

### Available Endpoints

#### 1. Get Today's Prayer Times
```
GET /prayer-times/today
```

**Parameters:**
- `lang` (optional): Language code. Defaults to `en`.
  - Example: `lang=ar`
- `langs` (optional): Comma-separated list of language codes.
  - Example: `langs=ar,en`
- `time_format` (optional): Time format. Defaults to `12h`.
  - Valid Values: `12h`, `24h`
  - Example: `time_format=24h`

**Response:**
```json
{
  "date": "2024-12-25",
  "gregorian_date": {
    "day":        { "en": "25", "ar": "٢٥" },
    "month":      { "en": "12", "ar": "١٢" },
    "year":       { "en": "2024","ar": "٢٠٢٤"},
    "month_name": { "en": "December", "ar": "ديسمبر" },
    "formatted":  { "en": "25 December 2024", "ar": "٢٥ ديسمبر ٢٠٢٤" },
    "date":       { "en": "Date", "ar": "التاريخ" },
    "day_label":  { "en": "Day", "ar": "اليوم" }
  },
  "hijri_info": {
    "hijri_date": {
      "day":        { "en": "1", "ar": "١" },
      "month":      { "en": "9", "ar": "٩" },
      "year":       { "en": "1447", "ar": "١٤٤٧" },
      "month_name": { "en": "Ramadan", "ar": "رمضان" },
      "formatted":  { "en": "1 Ramadan 1447", "ar": "١ رمضان ١٤٤٧" },
      "date":       { "en": "Hijri Date", "ar": "التاريخ الهجري" },
      "day_label":  { "en": "Day", "ar": "اليوم" }
    },
    "is_ramadan": true
  },
  "timezone": "UTC",
  "language": "en",
  "time_format": "12h",
  "prayer_times": {
    "fajr": {
      "name": "Fajr",
      "begins": "5:30 AM",
      "iqamah": "5:45 AM"
    },
    "dhuhr": {
      "name": "Dhuhr",
      "begins": "12:15 PM",
      "iqamah": "12:30 PM"
    },
    "asr": {
      "name": "Asr",
      "begins": "3:00 PM",
      "iqamah": "3:15 PM"
    },
    "asr2": {
      "name": "Hanafi",
      "begins": "4:00 PM"
    },
    "maghrib": {
      "name": "Maghrib",
      "begins": "5:30 PM",
      "iqamah": "5:45 PM"
    },
    "isha": {
      "name": "Isha",
      "begins": "7:00 PM",
      "iqamah": "7:15 PM"
    },
    "sunrise": {
      "name": "Sunrise",
      "time": "6:45 AM"
    },
    "midnight": {
      "name": "Midnight",
      "time": "12:00 AM"
    }
  },
  "mosque_info": {
    "name": "Your Mosque Name",
    "location": "Mosque Location",
    "address": "Mosque Address",
    "phone": "Phone Number",
    "website": "https://mosque-website.com"
  },
  "timestamp": 1703515800
}
```

> **Schema note:** `hijri_info.hijri_date.formatted[lang]` is now the single source for the formatted hijri date string. The earlier duplicate top-level `hijri_info.formatted` field has been removed in favor of the per-language in-data path. Top-level `day_label`, `gregorian_date_label`, and `hijri_date_label` have likewise been removed — reach those labels via `gregorian_date.date[lang]` and `hijri_info.hijri_date.date[lang]` instead.
>
> **New field:** `gregorian_date` and `hijri_info.hijri_date` now also expose `day_label[lang]` (the localized "Day" label, e.g. `{ "en": "Day", "ar": "اليوم" }`). This is additive and does not change any existing field paths.

#### 2. Get Prayer Times for Specific Date
```
GET /prayer-times?date=2024-12-25
```

> **Note:** This endpoint returns prayer times only for dates that exist in the FivePrayer timetable. If you request a date that has not been generated (for example, `2026-12-25` when only 2024 data exists), the API will return a `404 no_data` error. Use `/prayer-times/today` or `/prayer-times/month` for reliable, always-available data.

**Parameters:**
- `date` (required): Date in Y-m-d format
- `lang` (optional): Language code. Defaults to `en`.
  - Example: `lang=ar`
- `langs` (optional): Comma-separated list of language codes.
  - Example: `langs=ar,en`
- `time_format` (optional): Time format. Defaults to `12h`.
  - Valid Values: `12h`, `24h`
  - Example: `time_format=24h`
- `ramadan_start_date` (optional): Custom Ramadan start date in YYYY-MM-DD format (overrides system settings)

**Response shape** is identical to the `/prayer-times/today` response above.

#### 3. Get Prayer Times for a Month
```
GET /prayer-times/month?month=12&year=2024&lang=en
```

**Parameters (Strictly Validated):**
- `month` (required): Month number
  - Type: Integer
  - Valid Range: 1-12
  - Default: Current month
  - Example: `month=4`

- `year` (required): Year
  - Type: Integer
  - Valid Range: 2020-2030
  - Default: Current year
  - Example: `year=2026`

- `lang` (optional): Language code. Defaults to `en`.
  - Type: String
  - Valid Values: Supported language codes from translation system
  - Example: `lang=en` or `lang=ar`

- `langs` (optional): Comma-separated list of language codes.
  - Type: String
  - Example: `langs=en,ar`

- `time_format` (optional): Time format. Defaults to `12h`.
  - Type: String
  - Valid Values: `12h`, `24h`
  - Example: `time_format=24h`

- `ramadan_only` (optional): Filter to show only Ramadan dates.
  - Type: Boolean
  - Valid Values: `true`, `1`, `yes`
  - Example: `ramadan_only=true`

- `ramadan_start_date` (optional): Custom Ramadan start date in YYYY-MM-DD format.
  - Type: String
  - Example: `ramadan_start_date=2026-03-10`

- `include_extras` (optional, deprecated): still accepted on `/prayer-times/month` so existing integrations keep working, but it no longer changes the payload — the second ‘Asr is a standard field now (see `asr2` below).
  - Type: Boolean
  - Valid Values: `true`, `1`, `yes`
  - Example: `include_extras=true`

#### The second ‘Asr (`asr2`)

`asr2` is the optional second ‘Asr (2 Mithl / Hanafi, stored in `asr_second_begins`). It is a **standard field** on `/prayer-times`, `/prayer-times/today` and every day of `/prayer-times/month`, sitting directly after `asr`:

```json
"asr2": { "name": "Hanafi", "begins_label": "Begins", "begins_time": "4:00 PM" }
```

- It is filled by generation: the 2 Mithl ‘Asr computed alongside the time you chose in Configure Settings → Asr Calculation, so it exists without importing a printed chart. An imported chart's second ‘Asr still wins where it has one.
- Timetables generated before the Hanafi column existed have no stored value for it — regenerate to fill them.
- Days with no stored second ‘Asr omit the key entirely, so a timetable imported without one keeps its normal shape. When the main ‘Asr already uses the Hanafi 2 Mithl time, both times are identical and nothing is stored.
- `/next-prayer` is unaffected: its `prayer_schedule` lists the five prayers only.

**Important Note:** Prayer times are generated based on the WordPress timezone setting. Timezone conversion is not supported. The API will return the actual timezone used for generation.

**Security Rules:**
- Only the above parameters are accepted
- Any additional/unauthorized parameters will return 400 error
- All parameter values are strictly validated
- Invalid values return descriptive error messages

#### 4. Get Next Prayer
```
GET /next-prayer
```

**Parameters:**
- `lang` (optional): Language code. Defaults to `en`.
  - Type: String
  - Valid Values: Supported language codes from translation system
  - Example: `lang=en` or `lang=ar`

- `langs` (optional): Comma-separated list of language codes to include
  - Type: String
  - Example: `langs=en,ar`

- `time_format` (optional): Time format
  - Type: String
  - Valid Values: `12h`, `24h`
  - Default: `12h`
  - Example: `time_format=24h`

**Response:**
```json
{
  "date": "2024-12-25",
  "gregorian_date": {
    "day": { "en": "25", "ar": "٢٥" },
    "month": { "en": "12", "ar": "١٢" },
    "year": { "en": "2024", "ar": "٢٠٢٤" },
    "month_name": { "en": "December", "ar": "ديسمبر" },
    "formatted": { "en": "25 December 2024", "ar": "٢٥ ديسمبر ٢٠٢٤" },
    "date": { "en": "Date", "ar": "التاريخ" },
    "day_label": { "en": "Day", "ar": "اليوم" }
  },
  "hijri_info": {
    "hijri_date": {
      "day": { "en": "24", "ar": "٢٤" },
      "month": { "en": "6", "ar": "٦" },
      "year": { "en": "1446", "ar": "١٤٤٦" },
      "month_name": { "en": "Jumada II", "ar": "جمادى الآخرة" },
      "formatted": { "en": "24 Jumada II 1446", "ar": "٢٤ جمادى الآخرة ١٤٤٦" },
      "date": { "en": "Hijri Date", "ar": "التاريخ الهجري" },
      "day_label": { "en": "Day", "ar": "اليوم" }
    },
    "is_ramadan": false
  },
  "next_prayer_label": "Next Prayer",
  "current_prayer_label": "The Current Prayer",
  "next_prayer": "Asr",
  "next_time": "3:15 PM",
  "current_local_time_label": "Current Local Time",
  "current_time": "2:30 PM",
  "begins_label": "Begins",
  "iqamah_label": "Iqamah",
  "prayer_schedule": {
    "fajr": {
      "name": "Fajr",
      "begins_label": "Begins",
      "begins": "5:30 AM",
      "iqamah_label": "Iqamah",
      "iqamah": "5:45 AM"
    },
    "sunrise": {
      "name": "Sunrise",
      "time": "6:45 AM"
    },
    "dhuhr": {
      "name": "Dhuhr",
      "begins_label": "Begins",
      "begins": "12:15 PM",
      "iqamah_label": "Iqamah",
      "iqamah": "12:30 PM"
    },
    "asr": {
      "name": "Asr",
      "begins_label": "Begins",
      "begins": "3:00 PM",
      "iqamah_label": "Iqamah",
      "iqamah": "3:15 PM"
    },
    "asr2": {
      "name": "Hanafi",
      "begins_label": "Begins",
      "begins": "4:00 PM"
    },
    "maghrib": {
      "name": "Maghrib",
      "begins_label": "Begins",
      "begins": "5:30 PM",
      "iqamah_label": "Iqamah",
      "iqamah": "5:45 PM"
    },
    "isha": {
      "name": "Isha",
      "begins_label": "Begins",
      "begins": "7:00 PM",
      "iqamah_label": "Iqamah",
      "iqamah": "7:15 PM"
    }
  },
  "prayer_times_for_today_label": "Prayer Times For Today",
  "mosque_info": {
    "name": "Your Mosque Name",
    "location": "Mosque Location",
    "address": "Mosque Address",
    "phone": "Phone Number",
    "website": "https://mosque-website.com"
  },
  "timezone": "UTC",
  "language": "en",
  "time_format": "12h",
  "timestamp": 1703515800
}
```

> **Note:** The `hijri_info` field was added to the `/next-prayer` response to provide the Hijri date alongside the Gregorian date. The shape matches the `hijri_info` object returned by `/prayer-times` and `/prayer-times/month`.
>
> **Note:** The `next_prayer` field returns the translated name of the next prayer (e.g., `"Asr"`, `"العصر"`), not a slug.

#### 5. Get Mosque Information
```
GET /mosque-info
```

**Parameters:**
- `lang` (optional): Language code. Defaults to `en`.
  - Example: `lang=ar`
- `langs` (optional): Comma-separated list of language codes.
  - Example: `langs=ar,en`

**Response:**
```json
{
  "name": "Your Mosque Name",
  "location": "Mosque Location",
  "address": "Mosque Address ",
  "phone": "Phone Number ",
  "website": "https://mosque-website.com ",
  "extra_prayers": [
    { "index": 1, "name": "Jumu‘ah 1", "time": "13:30", "note": "Khutbah" },
    { "index": 2, "name": "Jumu‘ah 2", "time": "14:30" }
  ],
  "language": "en",
  "timestamp": 1703515800
}
```

> **Note:** The `address`, `phone`, and `website` fields are only present if configured in the plugin settings. The `location` field (the mosque's geographic area label) is always returned. The `timezone` field is at the top level of prayer time responses, not inside `mosque_info`.
>
> **Note — `extra_prayers`:** Up to six optional prayers a mosque prays on top of the five daily prayers (e.g. two Jumu‘ah congregations, or the Eid prayers), configured under FivePrayer → Customizing → Configure Settings → Extra Prayers and rendered on the site by the `[Fp_Extra_Prayer_1]` … `[Fp_Extra_Prayer_6]` shortcodes.
> - The array is only populated while the **Extra Prayers** feature switch is on; it is an empty array when the feature is off or no slots are configured. The key is always present so the response shape stays stable.
> - Each entry is `{ index, name, time, note? }`. `index` is the slot (1–6), `time` is the stored 24-hour `HH:MM` value, and `note` is omitted when empty.
> - `name` and `note` are translated through the site's translation database. With `?langs=en,ar` they become per-language maps (`{ "en": "…", "ar": "…" }`).
> - The same block is included in the `/test` response's `mosque_info`.

#### 6. Test Endpoint (No Authentication Required)
```
GET /test
```

This endpoint does **not** require an API key. It is intended for testing connectivity and exploring available endpoints.

**Parameters:**
- `lang` (optional): Language code. Defaults to `en`.
  - Example: `lang=ar`
- `langs` (optional): Comma-separated list of language codes.
  - Example: `langs=ar,en`

**Response:**
```json
{
  "version": "1.0.0",
  "timestamp": "2024-12-25 12:00:00",
  "requested_language": "en",
  "active_language": "en",
  "mosque_info": {
    "name": "Your Mosque Name",
    "location": "Mosque Location",
    "address": "Mosque Address",
    "phone": "Phone Number",
    "website": "https://mosque-website.com"
  },
  "endpoints": [
    "/external/test",
    "/external/prayer-times",
    "/external/prayer-times/today",
    "/external/prayer-times/month",
    "/external/next-prayer",
    "/external/mosque-info"
  ],
  "available_languages": {
    "en": "English",
    "ar": "Arabic"
  }
}
```

## Error Responses

### Authentication Errors (401)
```json
{
  "code": "missing_api_key",
  "message": "API key is required",
  "data": {
    "status": 401
  }
}
```

### Blocked IP Error (403)
When an IP has been blocked by brute force protection, authenticated endpoints return:
```json
{
  "code": "ip_blocked",
  "message": "Your IP address has been temporarily blocked due to too many failed attempts.",
  "data": {
    "status": 403
  }
}
```

### Validation Errors (400)

#### Date Validation Errors:
```json
{
  "code": "invalid_date",
  "message": "Invalid date format. Use Y-m-d format",
  "data": {
    "status": 400
  }
}
```

#### Month Validation Errors:
```json
{
  "code": "invalid_month",
  "message": "Month must be 1-12",
  "data": {
    "status": 400
  }
}
```

#### Year Validation Errors:
```json
{
  "code": "invalid_year",
  "message": "Year must be 2020-2030",
  "data": {
    "status": 400
  }
}
```

#### Language Validation Errors:
```json
{
  "code": "invalid_lang",
  "message": "Unsupported language",
  "data": {
    "status": 400
  }
}
```

#### Unauthorized Parameters:
```json
{
  "code": "invalid_params",
  "message": "Unauthorized parameters: timezone, test_param",
  "data": {
    "status": 400
  }
}
```

**Note:** The `timezone` parameter is no longer supported. Prayer times are generated based on the WordPress timezone setting.

### Not Found Errors (404)
```json
{
  "code": "no_data",
  "message": "No prayer times found for the specified date",
  "data": {
    "status": 404
  }
}
```

## Admin Interface

### Access
Navigate to **WordPress Admin → FivePrayer → API Management**

### Features
- **Create API Keys**: Generate new API keys with custom names and descriptions
- **Key Management**: View, copy, revoke, and delete existing keys
- **Usage Statistics**: Track usage count and last access time
- **Expiration Dates**: Set optional expiration dates for API keys
- **Rate Limits**: Configure per-key rate limits (default: 1,000 requests/hour)
- **Domain/IP/Endpoint Restrictions**: Restrict which domains, IPs, and endpoints can use each key
- **Security**: All actions require admin privileges and nonce verification

### API Key Properties
- **Name**: Descriptive name for the key (e.g., "Mobile App API")
- **Description**: Optional description of how the key will be used
- **Status**: Active, inactive, or revoked
- **Expiration**: Optional expiration date
- **Rate Limit**: Maximum requests per hour (default: 1,000)
- **Allowed Domains**: Restrict by request origin
- **Allowed IPs**: Restrict by client IP address
- **Allowed Endpoints**: Restrict which endpoints can be accessed
- **Usage Count**: Number of times the key has been used
- **Last Used**: Timestamp of the last API call

## Security Features

- **API Key Authentication**: All endpoints except `/test` require a valid API key
- **Per-Key Rate Limiting**: Each API key has a configurable rate limit (default: 1,000 requests/hour)
- **Brute Force Protection**: IPs with excessive failed API key attempts are temporarily blocked (403 Forbidden)
- **Key Validation**: Keys are checked for status, expiration, and allowed restrictions (domains, IPs, endpoints)
- **Usage Tracking**: Every API call is logged with timestamp
- **Domain/IP/Endpoint Restrictions**: Granular control over where and how each key can be used
- **Custom Key Prefixes**: API keys can use custom prefixes for easy identification
- **WordPress Integration**: Uses WordPress security standards and nonce verification
- **Input Sanitization**: All inputs are properly sanitized and validated
- **Permission Checks**: Admin actions require appropriate capabilities

## Rate Limiting

Each API key has a built-in rate limit (default: 1,000 requests per hour). The rate limit is configured per key in the API Management interface at **WordPress Admin → FivePrayer → API Management**.

When a key exceeds its rate limit, the API returns a `429 Too Many Requests` error.

To adjust the rate limit for a specific key:
1. Go to **WordPress Admin → FivePrayer → API Management**
2. Click the **View Details** button on the key you want to modify
3. Click **Edit** and update the **Rate Limit Per Hour** field
4. Click **Save Changes**

## Example Usage

### PHP Example
```php
$api_base = 'https://your-site.com/wp-json/fiveprayer/v1/external/';
$api_key = 'your_api_key_here';

// Get today's prayer times
$response = wp_remote_get($api_base . 'prayer-times/today', [
    'headers' => [
        'X-API-Key' => $api_key,
        'Content-Type' => 'application/json',
    ],
]);

if (is_wp_error($response)) {
    // Handle error
} else {
    $data = json_decode(wp_remote_retrieve_body($response), true);
    // Process prayer times data
}

// Get monthly prayer times for April 2026 in English
$response = wp_remote_get($api_base . 'prayer-times/month?month=4&year=2026&lang=en', [
    'headers' => [
        'X-API-Key' => $api_key,
        'Content-Type' => 'application/json',
    ],
]);
```

### JavaScript Example
```javascript
const API_BASE = 'https://your-site.com/wp-json/fiveprayer/v1/external/';
const API_KEY = 'your_api_key_here';

async function getTodayPrayerTimes() {
    try {
        const response = await fetch(API_BASE + 'prayer-times/today', {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching prayer times:', error);
    }
}

// Get monthly prayer times
async function getMonthlyPrayerTimes(month, year, language = 'en') {
    try {
        const url = `${API_BASE}prayer-times/month?month=${month}&year=${year}&lang=${language}`;
        const response = await fetch(url, {
            headers: {
                'X-API-Key': API_KEY,
                'Content-Type': 'application/json',
            },
        });
        
        if (!response.ok) {
            throw new Error('API request failed');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching monthly prayer times:', error);
    }
}
```

### cURL Example
```bash
# Get today's prayer times
curl -H "X-API-Key: your_api_key_here" \
     "https://your-site.com/wp-json/fiveprayer/v1/external/prayer-times/today"

# Get monthly prayer times for April 2026 in English
curl -H "X-API-Key: your_api_key_here" \
     "https://your-site.com/wp-json/fiveprayer/v1/external/prayer-times/month?month=4&year=2026&lang=en"

# Get monthly prayer times in Arabic
curl -H "X-API-Key: your_api_key_here" \
     "https://your-site.com/wp-json/fiveprayer/v1/external/prayer-times/month?month=4&year=2026&lang=ar"
```

### React Example

The examples below use the supported external endpoints and match the actual response shapes returned by the API.

#### Today's Prayer Times
```jsx
import React, { useState, useEffect } from 'react';

const API_BASE = 'https://your-site.com/wp-json/fiveprayer/v1/external/';
const API_KEY = 'your_api_key_here';

const TodayPrayerTimes = () => {
    const [prayerTimes, setPrayerTimes] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchTodayPrayerTimes();
    }, []);

    const fetchTodayPrayerTimes = async (language = 'en') => {
        try {
            setLoading(true);
            const url = `${API_BASE}prayer-times/today?lang=${language}`;
            const response = await fetch(url, {
                headers: {
                    'X-API-Key': API_KEY,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setPrayerTimes(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading prayer times...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!prayerTimes) return <div>No prayer times available</div>;

    const prayers = prayerTimes.prayer_times;

    return (
        <div className="prayer-times">
            <h2>Prayer Times - {prayerTimes.date}</h2>
            <p>Timezone: {prayerTimes.timezone}</p>

            <div className="language-switcher">
                <button onClick={() => fetchTodayPrayerTimes('en')}>English</button>
                <button onClick={() => fetchTodayPrayerTimes('ar')}>Arabic</button>
            </div>

            <ul className="today-times">
                <li>Fajr: {prayers.fajr?.begins} (Iqamah: {prayers.fajr?.iqamah})</li>
                <li>Sunrise: {prayers.sunrise?.time}</li>
                <li>Dhuhr: {prayers.dhuhr?.begins} (Iqamah: {prayers.dhuhr?.iqamah})</li>
                <li>Asr: {prayers.asr?.begins} (Iqamah: {prayers.asr?.iqamah})</li>
                <li>Maghrib: {prayers.maghrib?.begins} (Iqamah: {prayers.maghrib?.iqamah})</li>
                <li>Isha: {prayers.isha?.begins} (Iqamah: {prayers.isha?.iqamah})</li>
            </ul>
        </div>
    );
};

export default TodayPrayerTimes;
```

#### Monthly Prayer Times
```jsx
import React, { useState, useEffect } from 'react';

const API_BASE = 'https://your-site.com/wp-json/fiveprayer/v1/external/';
const API_KEY = 'your_api_key_here';

const MonthlyPrayerTimes = () => {
    const [monthData, setMonthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        fetchMonthlyPrayerTimes(currentMonth, currentYear);
    }, []);

    const fetchMonthlyPrayerTimes = async (month, year, language = 'en') => {
        try {
            setLoading(true);
            const url = `${API_BASE}prayer-times/month?month=${month}&year=${year}&lang=${language}`;
            const response = await fetch(url, {
                headers: {
                    'X-API-Key': API_KEY,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setMonthData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading prayer times...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!monthData) return <div>No prayer times available</div>;

    return (
        <div className="monthly-prayer-times">
            <h2>Monthly Prayer Times - {monthData.month}/{monthData.year}</h2>
            <p>Timezone: {monthData.timezone}</p>

            <div className="language-switcher">
                <button onClick={() => fetchMonthlyPrayerTimes(monthData.month, monthData.year, 'en')}>English</button>
                <button onClick={() => fetchMonthlyPrayerTimes(monthData.month, monthData.year, 'ar')}>Arabic</button>
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Fajr</th>
                        <th>Dhuhr</th>
                        <th>Asr</th>
                        <th>Maghrib</th>
                        <th>Isha</th>
                    </tr>
                </thead>
                <tbody>
                    {monthData.data.map((day) => (
                        <tr key={day.date}>
                            <td>{day.date}</td>
                            <td>{day.prayer_times.fajr.time}</td>
                            <td>{day.prayer_times.dhuhr.time}</td>
                            <td>{day.prayer_times.asr.time}</td>
                            <td>{day.prayer_times.maghrib.time}</td>
                            <td>{day.prayer_times.isha.time}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MonthlyPrayerTimes;
```

#### Next Prayer
```jsx
import React, { useState, useEffect } from 'react';

const API_BASE = 'https://your-site.com/wp-json/fiveprayer/v1/external/';
const API_KEY = 'your_api_key_here';

const NextPrayer = () => {
    const [nextPrayer, setNextPrayer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchNextPrayer();
    }, []);

    const fetchNextPrayer = async (language = 'en') => {
        try {
            setLoading(true);
            const url = `${API_BASE}next-prayer?lang=${language}`;
            const response = await fetch(url, {
                headers: {
                    'X-API-Key': API_KEY,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            setNextPrayer(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading next prayer...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!nextPrayer) return <div>No next prayer data available</div>;

    const schedule = nextPrayer.prayer_schedule;

    return (
        <div className="next-prayer">
            <h2>{nextPrayer.next_prayer_label}</h2>
            <p>{nextPrayer.next_prayer}: {nextPrayer.next_time}</p>
            <p>{nextPrayer.current_local_time_label}: {nextPrayer.current_time}</p>

            <div className="language-switcher">
                <button onClick={() => fetchNextPrayer('en')}>English</button>
                <button onClick={() => fetchNextPrayer('ar')}>Arabic</button>
            </div>

            <h3>{nextPrayer.prayer_times_for_today_label}</h3>
            <ul>
                {Object.entries(schedule).map(([key, prayer]) => (
                    <li key={key}>
                        {/* Sunrise uses `time`; the other prayers use `begins` */}
                        {prayer.name}: {prayer.begins || prayer.time}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default NextPrayer;
```

### React Hooks Example
```jsx
import { useState, useEffect, useCallback } from 'react';

// Custom hook for FivePrayer API
const useFivePrayerAPI = (apiKey, baseUrl) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const makeRequest = useCallback(async (endpoint, params = {}) => {
        try {
            setLoading(true);
            setError(null);

            const queryString = new URLSearchParams(params).toString();
            const url = `${baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;

            const response = await fetch(url, {
                headers: {
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            setData(result);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiKey, baseUrl]);

    return { data, loading, error, makeRequest };
};

// Usage example: fetch today's prayer times
const TodayPrayerTimesComponent = () => {
    const API_KEY = 'your_api_key_here';
    const BASE_URL = 'https://your-site.com/wp-json/fiveprayer/v1/external/';

    const { data, loading, error, makeRequest } = useFivePrayerAPI(API_KEY, BASE_URL);

    useEffect(() => {
        makeRequest('prayer-times/today', { lang: 'en' });
    }, [makeRequest]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Today's Prayer Times</h1>
            <div>
                <button onClick={() => makeRequest('prayer-times/today', { lang: 'en' })}>English</button>
                <button onClick={() => makeRequest('prayer-times/today', { lang: 'ar' })}>Arabic</button>
            </div>
            {data && (
                <pre>{JSON.stringify(data, null, 2)}</pre>
            )}
        </div>
    );
};
```

## Testing

A test script is included at `api-test.php` in the plugin directory. Update the configuration variables and run the script to test all API endpoints.

## Support

For issues or questions about the API:
1. Check the WordPress admin for error logs
2. Verify API key status in the API Management interface
3. Test endpoints using the provided test script
4. Check that prayer times data exists in the FivePrayer database

## Version History

- **v1.0**: Initial release with basic API endpoints and key management
- **v1.1**: Added usage tracking and improved security
- **v1.2**: Enhanced admin interface and documentation
- **v2.5.0**: Added brute force protection, per-key rate limiting, domain/IP/endpoint restrictions, custom key prefixes, CORS support, API Key Connections logging, and API Security page

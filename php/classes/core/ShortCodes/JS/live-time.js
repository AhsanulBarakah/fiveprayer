document.addEventListener('DOMContentLoaded', function() {
    // Configuration with safe defaults
    const config = window.fiveprayerTimeData || {
        numbers: {},
        timeFormat: 'h:i:s A',
        ampm: { AM: 'AM', PM: 'PM' },
        customLan: false,
        timeSelector: '.fiveprayer-live-time, .fiveprayer-dynamic-content.fiveprayer-single-current_time',
        initialTime: null,
        activeLanguage: 'en'
    };

    // Look for elements with the specific class for current time
    const timeElements = document.querySelectorAll(config.timeSelector);
    if (timeElements.length === 0) return;

    // The clock is anchored to the server's clock (not the visitor's), so the
    // masjid's local time is shown no matter where the visitor is.
    // `data-servertime` is in the site's local time, exactly like the value
    // returned by current_time('timestamp') on the server.
    let serverTimestamp = null;
    let clientTimestamp = Date.now();

    const firstElement = timeElements[0];
    const elementServerTime = firstElement.getAttribute('data-servertime');
    if (elementServerTime) {
        serverTimestamp = parseInt(elementServerTime, 10) * 1000;
    } else {
        serverTimestamp = Date.now();
    }

    // Get time format from data attribute
    const elementTimeFormat = firstElement.getAttribute('data-timeformat');
    if (elementTimeFormat) {
        config.timeFormat = elementTimeFormat;
    }

    // Cache frequently used values
    const numbers = config.numbers || {};
    const ampm = config.ampm || { AM: 'AM', PM: 'PM' };
    const isCustomLang = config.customLan;
    const timeFormat = config.timeFormat;
    const periodCase = timeFormat.includes('a') ? 'lower' : 'upper';
    const is24hr = timeFormat.includes('H') || timeFormat.includes('G');
    const showSeconds = timeFormat.includes('s');
    const padHours = timeFormat.includes('h') || timeFormat.includes('H');

    // Space between the clock and the AM/PM marker. Keeping it in its own
    // string is deliberate: the plugin's asset combiner
    // (AssetManager::minifyJs) trims whitespace next to braces, so a space
    // written directly in the template literal was silently dropped and the
    // marker ended up glued to the seconds ("1:47pm") while the admin preview
    // showed "1:47 pm".
    const periodSeparator = ' ';

    // Translate a single digit
    function translateDigit(digit) {
        if (!isCustomLang) return digit;

        // Validate that the translation is a single character, not a corrupted string
        const translation = numbers[digit];
        if (translation && typeof translation === 'string' && translation.length >= 1) {
            return translation;
        }

        return digit;
    }

    // Get AM/PM translation based on current period
    function getTranslatedPeriod(period) {
        // Follow the WordPress time format's AM/PM casing even when the custom
        // language system is off: `g:i a` (lowercase) shows "am"/"pm" and
        // `g:i A` (uppercase) shows "AM"/"PM". Without this the hardcoded
        // uppercase literal was always shown, overriding the format.
        if (!isCustomLang) {
            return periodCase === 'lower' ? period.toLowerCase() : period.toUpperCase();
        }

        const upperPeriod = period.toUpperCase();
        const lowerPeriod = period.toLowerCase();

        const translated = ampm[upperPeriod] || ampm[lowerPeriod];
        if (!translated) return period;

        return periodCase === 'lower' ? translated.toLowerCase() : translated.toUpperCase();
    }

    // Format time with proper translation
    function formatTime() {
        const pad = n => n.toString().padStart(2, '0');
        const now = new Date(serverTimestamp + (Date.now() - clientTimestamp));

        let hours = now.getUTCHours();
        const mins = pad(now.getUTCMinutes());
        const secs = showSeconds ? pad(now.getUTCSeconds()) : '';

        if (is24hr) {
            hours = padHours ? pad(hours) : hours;
            // Translate each digit
            let timeStr = `${hours}:${mins}${showSeconds ? `:${secs}` : ''}`;
            if (isCustomLang) {
                timeStr = timeStr.split('').map(c => translateDigit(c)).join('');
            }
            return timeStr;
        } else {
            const period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            hours = padHours ? pad(hours) : hours;

            const translatedPeriod = getTranslatedPeriod(period);

            // Translate each digit
            let timeStr = `${hours}:${mins}${showSeconds ? `:${secs}` : ''}${periodSeparator}${translatedPeriod}`;
            if (isCustomLang) {
                timeStr = timeStr.split('').map(c => translateDigit(c)).join('');
            }
            return timeStr;
        }
    }

    // Update display
    let lastTime = '';

    function updateDisplay() {
        const currentTime = formatTime();

        // Only update if time actually changed (not on first run if we have initialTime)
        if (currentTime !== lastTime && currentTime !== '') {
            lastTime = currentTime;

            requestAnimationFrame(() => {
                timeElements.forEach(el => {
                    el.textContent = currentTime;
                });
            });
        }
    }

    // Use server's initial time - populate immediately to prevent flash
    if (config.initialTime && config.initialTime.trim() !== '' && config.initialTime !== '&nbsp;') {
        timeElements.forEach(el => {
            el.textContent = config.initialTime;
        });
        lastTime = config.initialTime;

        // Start updates immediately with the translated time
        updateDisplay();
    } else {
        // If no initialTime, calculate and display immediately
        updateDisplay();
    }

    // Wait for DOM and scripts to fully load before starting continuous updates
    if (document.readyState === 'complete') {
        setTimeout(function() {
            updateDisplay();
        }, 50);
    } else {
        window.addEventListener('load', function() {
            setTimeout(function() {
                updateDisplay();
            }, 50);
        });
    }

    // Set up interval for ongoing updates
    const timer = setInterval(updateDisplay, 1000);

    /*
     * Cache-proof re-sync
     * -------------------
     * A page cache (or the browser's back-forward cache) can serve markup whose
     * `data-servertime` was generated long ago. Trusting it would leave the
     * clock stuck at that old time on every refresh. To defend against that we
     * ask an uncached AJAX endpoint for the true current server time and
     * re-anchor. If the request fails we simply keep ticking from the value we
     * already have, so the clock still works without AJAX.
     */
    function resolveAjaxUrl() {
        const dynamic = window.fiveprayer_dynamic || {};
        if (dynamic.ajax_url) return dynamic.ajax_url;
        if (window.fiveprayer_ajax && window.fiveprayer_ajax.ajaxurl) return window.fiveprayer_ajax.ajaxurl;
        if (config && config.ajax_url) return config.ajax_url;
        if (window.ajaxurl) return window.ajaxurl;
        return null;
    }

    function applyServerTime(tsSeconds) {
        const ts = parseInt(tsSeconds, 10);
        if (!ts || isNaN(ts)) return;
        serverTimestamp = ts * 1000;
        clientTimestamp = Date.now();
        lastTime = '';
        updateDisplay();
    }

    function syncServerTime() {
        const url = resolveAjaxUrl();
        if (!url) return;

        try {
            const xhr = new XMLHttpRequest();
            const body = new FormData();
            body.append('action', 'fiveprayer_server_time');

            const bust = url + (url.indexOf('?') === -1 ? '?' : '&') + 'fp_t=' + Date.now();
            xhr.open('POST', bust, true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            xhr.setRequestHeader('Pragma', 'no-cache');
            xhr.timeout = 8000;

            xhr.onreadystatechange = function() {
                if (xhr.readyState !== 4 || xhr.status !== 200) return;
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response && response.success && response.data && response.data.timestamp) {
                        applyServerTime(response.data.timestamp);
                    }
                } catch (e) {
                    /* keep ticking from the existing anchor */
                }
            };

            xhr.send(body);
        } catch (e) {
            /* keep ticking from the existing anchor */
        }
    }

    // Correct the (possibly stale) cached value as soon as possible...
    syncServerTime();
    // ...then keep long-lived tabs and heavily cached pages accurate.
    const resyncTimer = setInterval(syncServerTime, 300000);

    // The back-forward cache restores the DOM without re-running this handler,
    // which would otherwise leave the clock frozen. Re-sync whenever the page
    // becomes visible again.
    window.addEventListener('pageshow', syncServerTime);
    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') syncServerTime();
    });

    window.addEventListener('beforeunload', () => {
        clearInterval(timer);
        clearInterval(resyncTimer);
    });
    document.addEventListener('fiveprayer-unmount', () => {
        clearInterval(timer);
        clearInterval(resyncTimer);
    });
});

/**
 * Dynamic Content Loader for FivePrayer Plugin
 * Loads time-sensitive content via AJAX to work with server-side caches
 */

document.addEventListener('DOMContentLoaded', function() {
    // The next-prayer countdown is independent of the dynamic-content elements,
    // so initialize it here — before the early return below. Otherwise a page
    // whose only FivePrayer widget is the countdown never starts ticking.
    const countdownElements = document.querySelectorAll('.fiveprayer-next-prayer-countdown');
    if (countdownElements.length > 0) {
        initNextPrayerCountdowns(countdownElements);
    }

    // Check if we have elements that need dynamic content
    const dynamicElements = document.querySelectorAll('.fiveprayer-dynamic-content[data-content-type]');

    if (dynamicElements.length === 0) {
        return; // No dynamic content needed
    }

    // Prepare AJAX request
    const nonce = window.fiveprayer_dynamic?.nonce || '';

    if (!nonce) {
        console.error('FivePrayer: Missing nonce for AJAX request');
        return;
    }

    // Group elements by content type to minimize AJAX requests
    const contentGroups = {};

    dynamicElements.forEach(element => {
        const contentType = element.getAttribute('data-content-type');
        const field = element.getAttribute('data-field') || '';

        if (!contentGroups[contentType]) {
            contentGroups[contentType] = [];
        }

        contentGroups[contentType].push({
            element: element,
            field: field
        });
    });

    // Make AJAX requests for each content type
    Object.keys(contentGroups).forEach(contentType => {
        const elements = contentGroups[contentType];

        // For single prayer requests, we need to make individual requests per field
        if (contentType === 'single_prayer') {
            elements.forEach(item => {
                loadDynamicContent(contentType, item.element, item.field);
            });
        } else {
            // For other content types, we can batch them
            loadDynamicContent(contentType, elements.map(item => item.element)[0], elements[0]?.field || '');
        }
    });

    // Function to load dynamic content via AJAX
    function loadDynamicContent(contentType, element, field = '') {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();

        formData.append('action', 'fiveprayer_dynamic_content');
        formData.append('nonce', nonce);
        formData.append('content_type', contentType);

        if (field) {
            formData.append('field', field);
        }

        // Add cache-busting parameter to the URL
        const cacheBuster = Date.now() + Math.floor(Math.random() * 10000);
        const ajaxUrl = (window.fiveprayer_dynamic?.ajax_url || '/wp-admin/admin-ajax.php');
        xhr.open('POST', ajaxUrl + (ajaxUrl.indexOf('?') === -1 ? '?' : '&') + 'cb=' + cacheBuster, true);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        xhr.setRequestHeader('X-LiteSpeed-Cache-Control', 'no-cache');
        xhr.setRequestHeader('Pragma', 'no-cache');

        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText);

                        if (response.success && response.data) {
                            // Update all elements of this content type
                            let selector = `.fiveprayer-dynamic-content[data-content-type="${contentType}"]`;
                            if (field) {
                                selector += `[data-field="${field}"]`;
                            }
                            const elementsToUpdate = document.querySelectorAll(selector);

                            elementsToUpdate.forEach(el => {
                                if (contentType === 'current_time' && response.data.time) {
                                    el.textContent = response.data.time;
                                } else if (contentType === 'next_prayer' && response.data.name) {
                                    el.textContent = response.data.name + ' ' + response.data.time;
                                } else if (contentType === 'single_prayer' && response.data.time) {
                                    el.textContent = response.data.time;
                                }

                                // Add class to indicate content has been loaded
                                el.classList.add('fiveprayer-content-loaded');
                            });
                        } else {
                            console.error('FivePrayer AJAX Error:', response.data?.error || 'Unknown error');
                        }
                    } catch (e) {
                        console.error('FivePrayer JSON Parse Error:', e);
                    }
                } else {
                    console.error('FivePrayer AJAX Request Failed:', xhr.status);
                }
            }
        };

        xhr.send(formData);
    }

    // For current time, we also need to update it every second
    const currentTimeElements = document.querySelectorAll('.fiveprayer-dynamic-content[data-content-type="current_time"]');
    if (currentTimeElements.length > 0) {
        // Initially load the time
        loadDynamicContent('current_time', currentTimeElements[0]);

        // Then update every second
        setInterval(() => {
            loadDynamicContent('current_time', currentTimeElements[0]);
        }, 1000);
    }

    // Keep next-prayer content fresh. A page cache can serve a stale next
    // prayer on first paint (the initial pass above corrects it); this also
    // covers pages restored from the browser's back-forward cache and pages
    // left open across a prayer boundary.
    const nextPrayerElements = document.querySelectorAll('.fiveprayer-dynamic-content[data-content-type="next_prayer"]');
    if (nextPrayerElements.length > 0) {
        const refreshNextPrayer = () => {
            nextPrayerElements.forEach(el => {
                loadDynamicContent('next_prayer', el, el.getAttribute('data-field') || '');
            });
        };
        window.addEventListener('pageshow', refreshNextPrayer);
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') refreshNextPrayer();
        });
        setInterval(refreshNextPrayer, 60000);
    }

    /*
     * Next-prayer countdown
     * ---------------------
     * The server renders the initial text plus the data needed to tick it down
     * (target/now on the site's clock scale, rounding unit, format and words).
     * We keep ticking locally every second, re-anchor "now" from the uncached
     * server-time endpoint (page caches serve stale anchors), and refresh the
     * target from the next-prayer endpoint when a prayer has just passed.
     */
    function initNextPrayerCountdowns(elements) {
        // Never attach a second ticker to the same elements (the ESI loader can
        // run alongside this one depending on how the bundle is built).
        if (elements[0].dataset.fpCountdownInit === '1') return;
        elements.forEach((el) => { el.dataset.fpCountdownInit = '1'; });

        const ajaxUrl = window.fiveprayer_dynamic?.ajax_url || null;
        const nonce = window.fiveprayer_dynamic?.nonce || '';

        // "now" anchor on the server's local-time scale.
        let serverNow = parseFloat(elements[0].getAttribute('data-now')) || null;
        let clientBase = Date.now();
        let target = parseFloat(elements[0].getAttribute('data-target')) || 0;

        function currentServerTime() {
            if (serverNow === null) return null;
            return serverNow + (Date.now() - clientBase) / 1000;
        }

        const pad = (n) => (n < 10 ? '0' : '') + n;

        function escapeCountdownHtml(value) {
            return String(value).replace(/[&<>"']/g, (c) => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            }[c]));
        }

        // A localized unit word wrapped so its slot keeps the width of the
        // longer (plural) form ("1 hour" reserves as much room as "2 hours").
        function unitWord(el, value, singularKey, pluralKey) {
            const singular = el.getAttribute('data-word-' + singularKey) || singularKey;
            const plural = el.getAttribute('data-word-' + pluralKey) || pluralKey;
            const word = value === 1 ? singular : plural;

            // Both forms are real elements stacked in the same grid cell so
            // the selector can position them; a bare text node would be an
            // anonymous item that cannot be placed.
            let html = '<span class="fiveprayer-cd-unit"><span>' + escapeCountdownHtml(word) + '</span>';
            if (plural !== word) {
                html += '<span class="fiveprayer-cd-unit-size" aria-hidden="true">' + escapeCountdownHtml(plural) + '</span>';
            }
            html += '</span>';
            return html;
        }

        function formatCountdown(seconds, el) {
            const format = el.getAttribute('data-format') || 'long';
            const showSeconds = el.getAttribute('data-show-seconds') === '1';
            const showNow = el.getAttribute('data-show-now') !== '0';
            const nowText = el.getAttribute('data-now-text') || 'Now';

            let secs = Math.max(0, Math.floor(seconds));

            // When seconds are hidden the value floors to the whole minute (and
            // never below "1 minute" while time remains), so it ticks down
            // visibly once per minute.
            if (!showSeconds && secs > 0) secs = Math.max(60, Math.floor(secs / 60) * 60);

            // The "Now" label is optional; when it is switched off the
            // countdown renders nothing once the prayer has arrived.
            if (secs <= 0) {
                return showNow ? '<span class="fiveprayer-cd-now">' + escapeCountdownHtml(nowText) + '</span>' : '';
            }

            const hours = Math.floor(secs / 3600);
            const minutes = Math.floor((secs % 3600) / 60);
            const remainder = secs % 60;

            let out;
            if (format === 'clock') {
                out = showSeconds
                    ? pad(hours) + ':' + pad(minutes) + ':' + pad(remainder)
                    : pad(hours) + ':' + pad(minutes);
            } else if (format === 'short') {
                const unitHour = el.getAttribute('data-unit-hour') || 'h';
                const unitMinute = el.getAttribute('data-unit-minute') || 'm';
                const unitSecond = el.getAttribute('data-unit-second') || 's';
                const parts = [pad(hours) + unitHour, pad(minutes) + unitMinute];
                if (showSeconds) parts.push(pad(remainder) + unitSecond);
                out = parts.join(' ');
            } else {
                const parts = [
                    pad(hours) + ' ' + unitWord(el, hours, 'hour', 'hours'),
                    pad(minutes) + ' ' + unitWord(el, minutes, 'minute', 'minutes'),
                ];
                if (showSeconds) {
                    parts.push(pad(remainder) + ' ' + unitWord(el, remainder, 'second', 'seconds'));
                }
                out = parts.join(' ');
            }

            out = translateCountdownNumbers(el, out);

            // Always one space between the prefix/suffix and the time; trim
            // any whitespace the user typed so it never doubles up.
            const prefix = (el.getAttribute('data-prefix') || '').replace(/\s+$/, '');
            const suffix = (el.getAttribute('data-suffix') || '').replace(/^\s+/, '');

            return (prefix ? escapeCountdownHtml(prefix) + ' ' : '') + out + (suffix ? ' ' + escapeCountdownHtml(suffix) : '');
        }

        // Translate the digits through the same gregorian_numbers mapping the
        // server uses, so the live tick follows the selected language.
        function translateCountdownNumbers(el, text) {
            const raw = el.getAttribute('data-numbers');
            if (!raw) return text;
            let map;
            try {
                map = JSON.parse(raw);
            } catch (e) {
                return text;
            }
            if (!map) return text;
            return text.replace(/[0-9]/g, (d) => (map[d] !== undefined ? map[d] : d));
        }

        function render() {
            const now = currentServerTime();
            if (now === null) return;

            elements.forEach((el) => {
                const elTarget = parseFloat(el.getAttribute('data-target')) || target;
                if (!elTarget) return;
                const html = formatCountdown(elTarget - now, el);
                if (el.innerHTML !== html) el.innerHTML = html;
            });
        }

        function post(action, extra, onSuccess) {
            if (!ajaxUrl) return;
            const xhr = new XMLHttpRequest();
            const formData = new FormData();
            formData.append('action', action);
            if (nonce) formData.append('nonce', nonce);
            Object.keys(extra || {}).forEach((key) => formData.append(key, extra[key]));

            const bust = ajaxUrl + (ajaxUrl.indexOf('?') === -1 ? '?' : '&') + 'cb=' + Date.now();
            xhr.open('POST', bust, true);
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            xhr.setRequestHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            xhr.onreadystatechange = function () {
                if (xhr.readyState !== 4 || xhr.status !== 200) return;
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response && response.success && response.data) onSuccess(response.data);
                } catch (e) {
                    /* keep ticking with the existing anchor */
                }
            };
            xhr.send(formData);
        }

        function syncServerTime() {
            post('fiveprayer_server_time', null, (data) => {
                const ts = parseFloat(data.timestamp);
                if (!ts || isNaN(ts)) return;
                serverNow = ts;
                clientBase = Date.now();
                render();
            });
        }

        function refreshTarget() {
            post('fiveprayer_dynamic_content', { content_type: 'next_prayer' }, (data) => {
                const ts = parseFloat(data.timestamp);
                if (!ts || isNaN(ts)) return;
                target = ts;
                elements.forEach((el) => el.setAttribute('data-target', String(ts)));
                render();
            });
        }

        render();
        syncServerTime();
        refreshTarget();
        setInterval(render, 1000);
        setInterval(syncServerTime, 300000);
        setInterval(refreshTarget, 60000);

        window.addEventListener('pageshow', () => { syncServerTime(); refreshTarget(); });
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') { syncServerTime(); refreshTarget(); }
        });
    }
});
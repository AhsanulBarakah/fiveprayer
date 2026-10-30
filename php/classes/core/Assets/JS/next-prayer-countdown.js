/**
 * Next-Prayer Countdown
 *
 * Ticks the [Fp_Single_Next_Prayer_Remaining] span (also used by the Vertical
 * Daily Prayer notice) using only the data the server already rendered:
 * target/now on the site's clock scale, the output format, the prefix/suffix,
 * the "Now" text and the localized unit words.
 *
 * The value is rendered at a fixed width — every number is zero-padded and
 * every unit is always shown — so it never reflows while counting down. The
 * unit words are wrapped in a slot sized to the longer (plural) form for the
 * same reason.
 *
 * It is deliberately standalone so it is included in the combined bundle no
 * matter which dynamic-content loader is used (the asset manager swaps the
 * loader for its ESI variant). The server-rendered markup works without JS;
 * this only makes it live.
 */

document.addEventListener('DOMContentLoaded', function () {
    const elements = document.querySelectorAll('.fiveprayer-next-prayer-countdown');
    if (elements.length === 0) {
        return;
    }

    // Never attach a second ticker to the same elements.
    if (elements[0].dataset.fpCountdownInit === '1') {
        return;
    }
    elements.forEach((el) => { el.dataset.fpCountdownInit = '1'; });

    const ajaxUrl = window.fiveprayer_dynamic?.ajax_url || null;
    const nonce = window.fiveprayer_dynamic?.nonce || '';

    // "now" anchor on the server's local-time scale. The rendered value can be
    // stale (page cache), so it is re-synced from the uncached server-time
    // endpoint below.
    let serverNow = parseFloat(elements[0].getAttribute('data-now')) || null;
    let clientBase = Date.now();
    let target = parseFloat(elements[0].getAttribute('data-target')) || 0;

    function currentServerTime() {
        if (serverNow === null) return null;
        return serverNow + (Date.now() - clientBase) / 1000;
    }

    const pad = (n) => (n < 10 ? '0' : '') + n;

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, (c) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        }[c]));
    }

    // Translate the digits through the same gregorian_numbers mapping the
    // server uses, so the live tick follows the selected language. The markup
    // holds no other digits.
    function translateNumbers(el, text) {
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

    // A localized unit word wrapped so its slot keeps the width of the longer
    // (plural) form ("1 hour" reserves as much room as "2 hours").
    function unitWord(el, value, singularKey, pluralKey) {
        const singular = el.getAttribute('data-word-' + singularKey) || singularKey;
        const plural = el.getAttribute('data-word-' + pluralKey) || pluralKey;
        const word = value === 1 ? singular : plural;

        // Both forms are real elements stacked in the same grid cell so the
        // selector can position them; a bare text node would be an anonymous
        // item that cannot be placed.
        let html = '<span class="fiveprayer-cd-unit"><span>' + escapeHtml(word) + '</span>';
        if (plural !== word) {
            html += '<span class="fiveprayer-cd-unit-size" aria-hidden="true">' + escapeHtml(plural) + '</span>';
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
        // never below "1 minute" while time remains), so it ticks down visibly
        // once per minute.
        if (!showSeconds && secs > 0) secs = Math.max(60, Math.floor(secs / 60) * 60);

        // The "Now" label is optional; when it is switched off the countdown
        // renders nothing once the prayer has arrived.
        if (secs <= 0) {
            return showNow ? '<span class="fiveprayer-cd-now">' + escapeHtml(nowText) + '</span>' : '';
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

        out = translateNumbers(el, out);

        // Always one space between the prefix/suffix and the time; trim any
        // whitespace the user typed so it never doubles up.
        const prefix = (el.getAttribute('data-prefix') || '').replace(/\s+$/, '');
        const suffix = (el.getAttribute('data-suffix') || '').replace(/^\s+/, '');

        return (prefix ? escapeHtml(prefix) + ' ' : '') + out + (suffix ? ' ' + escapeHtml(suffix) : '');
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

    window.addEventListener('pageshow', function () { syncServerTime(); refreshTarget(); });
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') { syncServerTime(); refreshTarget(); }
    });
});

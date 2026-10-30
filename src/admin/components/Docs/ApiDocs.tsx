/**
 * ApiDocs
 *
 * Interactive API documentation page with endpoint reference,
 * response examples, code samples, and live sandbox.
 *
 * @module Docs/ApiDocs
 */
import React, { useState } from 'react';
import { toast } from 'sonner';
import ApiDocsLivePreview from './ApiDocsLivePreview';
import { UseEndPoints } from '../../hooks/api/endpoints';
import { __ } from '@wordpress/i18n';

const ApiDocs: React.FC = () => {
  const [copiedItems, setCopiedItems] = useState<Record<string, boolean>>({});
  const [expandedEndpoint, setExpandedEndpoint] = useState<number | null>(null);
  const baseUrl = `wp-json/${UseEndPoints()}`;

  const copyToClipboard = (text: string, key: string) => {
    const isLocalhost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
    if (window.location.protocol !== 'https:' && !isLocalhost) {
      toast.warning(__('Copy works on HTTPS or localhost only.', 'fiveprayer'));
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItems((p) => ({ ...p, [key]: true }));
      toast.success(__('Copied to clipboard!', 'fiveprayer'));
      setTimeout(() => setCopiedItems((p) => ({ ...p, [key]: false })), 2000);
    });
  };

  const endpoints = [
    { method: 'GET', path: '/external/test', desc: __('Health check — no auth required', 'fiveprayer'), params: [
      { name: 'lang', type: 'string', required: false, desc: __('Language code override', 'fiveprayer') },
    ]},
    { method: 'GET', path: '/external/prayer-times', desc: __('Prayer times for a specific date', 'fiveprayer'), params: [
      { name: 'date', type: 'string', required: true, desc: __('YYYY-MM-DD format', 'fiveprayer') },
      { name: 'lang', type: 'string', required: false, desc: __('Language code (en, ar, etc.)', 'fiveprayer') },
      { name: 'langs', type: 'string', required: false, desc: __('Comma-separated languages (en,ar)', 'fiveprayer') },
      { name: 'time_format', type: 'string', required: false, desc: __('12h (default) or 24h', 'fiveprayer') },
      { name: 'ramadan_start_date', type: 'string', required: false, desc: __('Custom Ramadan start YYYY-MM-DD', 'fiveprayer') },
    ]},
    { method: 'GET', path: '/external/prayer-times/today', desc: __('Today\'s prayer times (auto-dated)', 'fiveprayer'), params: [
      { name: 'lang', type: 'string', required: false, desc: __('Language code', 'fiveprayer') },
      { name: 'langs', type: 'string', required: false, desc: __('Comma-separated languages', 'fiveprayer') },
      { name: 'time_format', type: 'string', required: false, desc: __('12h or 24h', 'fiveprayer') },
    ]},
    { method: 'GET', path: '/external/prayer-times/month', desc: __('Full month prayer times', 'fiveprayer'), params: [
      { name: 'year', type: 'integer', required: true, desc: __('Year (2020-2030)', 'fiveprayer') },
      { name: 'month', type: 'integer', required: true, desc: __('Month (1-12)', 'fiveprayer') },
      { name: 'lang', type: 'string', required: false, desc: __('Language code', 'fiveprayer') },
      { name: 'langs', type: 'string', required: false, desc: __('Comma-separated languages', 'fiveprayer') },
      { name: 'ramadan_only', type: 'boolean', required: false, desc: __('Return full Ramadan month', 'fiveprayer') },
      { name: 'ramadan_start_date', type: 'string', required: false, desc: __('Custom Ramadan start YYYY-MM-DD', 'fiveprayer') },
      { name: 'time_format', type: 'string', required: false, desc: __('12h or 24h', 'fiveprayer') },
      { name: 'include_extras', type: 'boolean', required: false, desc: __('Deprecated — still accepted, but asr2 is returned anyway', 'fiveprayer') },
    ]},
    { method: 'GET', path: '/external/next-prayer', desc: __('Next upcoming prayer with schedule', 'fiveprayer'), params: [
      { name: 'lang', type: 'string', required: false, desc: __('Language code', 'fiveprayer') },
      { name: 'langs', type: 'string', required: false, desc: __('Comma-separated languages', 'fiveprayer') },
      { name: 'time_format', type: 'string', required: false, desc: __('12h or 24h', 'fiveprayer') },
    ]},
    { method: 'GET', path: '/external/mosque-info', desc: __('Mosque information, including optional extra prayers', 'fiveprayer'), params: [
      { name: 'lang', type: 'string', required: false, desc: __('Language code', 'fiveprayer') },
      { name: 'langs', type: 'string', required: false, desc: __('Comma-separated languages', 'fiveprayer') },
    ]},
  ];

  const CodeBlock = ({ code, title, copyKey }: { code: string; title?: string; copyKey?: string }) => (
    <div className="rounded-lg overflow-hidden border border-gray-200">
      {title && (
        <div className="bg-gray-100 px-4 py-2 border-b border-gray-200 flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</span>
          {copyKey && (
            <button onClick={() => copyToClipboard(code, copyKey)}
              className={`text-xs px-2 py-1 rounded-sm transition-colors ${copiedItems[copyKey] ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'}`}>
              {copiedItems[copyKey] ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
      )}
      <pre className="bg-gray-950 p-4 overflow-x-auto">
        <code className="text-emerald-400 font-mono text-sm leading-relaxed">{code}</code>
      </pre>
    </div>
  );

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="flex-1 min-w-0 pb-20">

          {/* Header */}
          <div id="quick-start" className="mb-8 scroll-mt-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-xs">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{__('FivePrayer API', 'fiveprayer')}</h1>
              <p className="text-gray-500 text-lg">{__('REST API for prayer times data', 'fiveprayer')}</p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <span className="text-2xl">⚡</span>
                  <p className="font-semibold text-gray-900 mt-2">{__('Quick Setup', 'fiveprayer')}</p>
                  <p className="text-gray-500 text-xs mt-1">{__('Get running in 3 steps', 'fiveprayer')}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <span className="text-2xl">🌍</span>
                  <p className="font-semibold text-gray-900 mt-2">{__('Multi-Language', 'fiveprayer')}</p>
                  <p className="text-gray-500 text-xs mt-1">{__('English, Arabic + more', 'fiveprayer')}</p>
                </div>
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                  <span className="text-2xl">🔒</span>
                  <p className="font-semibold text-gray-900 mt-2">{__('Secure API Keys', 'fiveprayer')}</p>
                  <p className="text-gray-500 text-xs mt-1">{__('Domain + IP restrictions', 'fiveprayer')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Start */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('Quick Start', 'fiveprayer')}</h2>
            <div className="space-y-3">
              {[
                { n: '1', t: 'Create API Key', d: 'Go to Five Prayer → API Management and generate a key.' },
                { n: '2', t: 'Test Connection', d: 'Try the test endpoint first — no auth needed.' },
                { n: '3', t: 'Make Requests', d: 'Include your key in the X-API-Key header.' },
              ].map(({ n, t, d }) => (
                <div key={n} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  <span className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold text-sm shrink-0">{n}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{t}</p>
                    <p className="text-gray-500 text-sm">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('🔑 Authentication', 'fiveprayer')}</h2>
            <p className="text-gray-600 mb-4">{__('All endpoints (except /test) require an API key in the request header:', 'fiveprayer')}</p>
            <CodeBlock title={__('Header', 'fiveprayer')} code="X-API-Key: your_api_key_here" copyKey="auth-header" />
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm font-semibold text-amber-800">{__('⚠️ Start without restrictions', 'fiveprayer')}</p>
              <p className="text-sm text-amber-700 mt-1">{__('Leave Allowed Domains empty during development to avoid permission issues.', 'fiveprayer')}</p>
            </div>
          </section>

          {/* Base URL */}
          <section id="base-url" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('🌐 Base URL', 'fiveprayer')}</h2>
            <CodeBlock code={`${baseUrl}`} copyKey="base-url" />
          </section>

          {/* Endpoints */}
          <section id="endpoints" className="mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('📡 Endpoints', 'fiveprayer')}</h2>
            <div className="space-y-3">
              {endpoints.map((ep, i) => {
                const isOpen = expandedEndpoint === i;
                const methodColor = ep.method === 'GET' ? 'bg-emerald-500' : 'bg-blue-500';
                return (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
                    <button onClick={() => setExpandedEndpoint(isOpen ? null : i)}
                      className="w-full px-6 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left">
                      <span className={`${methodColor} text-white text-xs font-bold px-2.5 py-1 rounded-md`}>{ep.method}</span>
                      <code className="font-mono text-sm text-gray-800 flex-1">{ep.path}</code>
                      <span className="text-gray-400 text-sm hidden sm:block">{ep.desc}</span>
                      <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    {isOpen && (
                      <div className="px-6 pb-4 border-t border-gray-100">
                        <p className="text-gray-500 text-sm mt-3 mb-4">{ep.desc}</p>
                        <CodeBlock title={__('Example', 'fiveprayer')} code={`${baseUrl}${ep.path}${ep.params?.[0] ? '?' + ep.params[0].name + '=' + (ep.params[0].type === 'integer' ? '2026' : 'en') : ''}`}
                          copyKey={`ep-${i}`} />
                        {ep.params && ep.params.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{__('Parameters', 'fiveprayer')}</p>
                            <div className="bg-gray-50 rounded-xl overflow-hidden">
                              {ep.params.map((p, j) => (
                                <div key={j} className={`flex items-center gap-4 px-4 py-2.5 text-sm ${j > 0 ? 'border-t border-gray-100' : ''}`}>
                                  <code className="font-mono text-blue-600 font-medium shrink-0">{p.name}</code>
                                  <span className="text-gray-400 text-xs shrink-0">{p.type}</span>
                                  {p.required && <span className="text-red-500 text-xs font-semibold shrink-0">{__('Required', 'fiveprayer')}</span>}
                                  <span className="text-gray-500 text-xs">{p.desc}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Response — Monthly */}
          <section id="response-monthly" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('📅 Monthly Response', 'fiveprayer')}</h2>
            <p className="text-gray-500 text-sm mb-4">{__('All prayer entries share the same structure: ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('name', 'fiveprayer')}</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('begins_label', 'fiveprayer')}</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('begins_time', 'fiveprayer')}</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('iqamah_label', 'fiveprayer')}</code>, <code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('iqamah_time', 'fiveprayer')}</code>.</p>
            <p className="text-gray-500 text-sm mb-4">{__('Days that carry a second ‘Asr also include an ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('asr2', 'fiveprayer')}</code>{__(' entry directly after ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('asr', 'fiveprayer')}</code>{__(', with ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('name', 'fiveprayer')}</code>{__(', ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('begins_label', 'fiveprayer')}</code>{__(' and ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('begins_time', 'fiveprayer')}</code>{__(' It is a standard field — no parameter needed. Days without a stored value omit the key.', 'fiveprayer')}</p>
            <CodeBlock title={__('Example — /external/prayer-times/month', 'fiveprayer')} copyKey="response-monthly" code={`{
  "month": 3, "year": 2026,
  "timezone": "Europe/London", "languages": ["en","ar"],
  "mosque_info": { "name": { "en": "Masjid", "ar": "المسجد" } },
  "data": [{
    "date": "2026-03-01",
    "gregorian_date": { "formatted": { "en": "1 March 2026", "ar": "١ مارس ٢٠٢٦" } },
    "hijri_info": { "formatted": { "en": "11 Ramadan 1447" }, "is_ramadan": true },
    "prayer_times": {
      "fajr": { "name": "Fajr", "begins_label": "Begins", "begins_time": "3:58 AM", "iqamah_label": "Iqamah", "iqamah_time": "4:00 AM" },
      "sunrise": { "name": "Sunrise", "begins_label": "Begins", "begins_time": "5:47 AM" }
    }
  }]
}`} />
          </section>

          {/* Response — Next Prayer */}
          <section id="response-next-prayer" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('🕐 Next Prayer Response', 'fiveprayer')}</h2>
            <p className="text-gray-500 text-sm mb-4">{__('Returns ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('next_prayer_dynamic', 'fiveprayer')}</code>{__(' and ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('next_time_dynamic', 'fiveprayer')}</code>{__(' plus the full prayer schedule.', 'fiveprayer')}</p>
            <CodeBlock title={__('Example — /external/next-prayer', 'fiveprayer')} copyKey="response-next" code={`{
  "date": "2026-04-23",
  "next_prayer_dynamic": { "en": "Fajr", "ar": "الفجر" },
  "next_time_dynamic": { "en": "3:58 AM", "ar": "٣:٥٨ ص" },
  "prayer_schedule": {
    "fajr": { "name": "Fajr", "begins_label": "Begins", "begins_time": "3:58 AM", "iqamah_label": "Iqamah", "iqamah_time": "4:00 AM" },
    "sunrise": { "name": "Sunrise", "begins_label": "Begins", "begins_time": "5:47 AM" }
  },
  "mosque_info": { "name": "Masjid Name", "location": "London" },
  "timestamp": 1745368680
}`} />
          </section>

          {/* Response — Mosque Info */}
          <section id="response-mosque-info" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('🕌 Mosque Info Response', 'fiveprayer')}</h2>
            <p className="text-gray-500 text-sm mb-4">{__('Returns the mosque name and location, plus any optional address/phone/website. When the ', 'fiveprayer')}<strong>{__('Extra Prayers', 'fiveprayer')}</strong>{__(' feature is enabled (Customizing → Configure Settings → Extra Prayers), it also returns an ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('extra_prayers', 'fiveprayer')}</code>{__(' array — up to six entries such as multiple Jumu‘ah (Friday) or Eid prayers. The array is empty while the feature is off.', 'fiveprayer')}</p>
            <CodeBlock title={__('Example — /external/mosque-info', 'fiveprayer')} copyKey="response-mosque-info" code={`{
  "name": "Your Mosque Name",
  "location": "London",
  "address": "Mosque Address",
  "phone": "Phone Number",
  "website": "https://mosque-website.com",
  "extra_prayers": [
    { "index": 1, "name": "Jumu‘ah 1", "time": "13:30", "note": "Khutbah" },
    { "index": 2, "name": "Jumu‘ah 2", "time": "14:30" }
  ],
  "language": "en",
  "timestamp": 1703515800
}`} />
            <p className="text-gray-500 text-sm mt-4">{__('With ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('?langs=en,ar', 'fiveprayer')}</code>{__(' the ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('name', 'fiveprayer')}</code>{__(' and ', 'fiveprayer')}<code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('note', 'fiveprayer')}</code>{__(' values become per-language maps. Times are returned as stored, in 24-hour HH:MM.', 'fiveprayer')}</p>
          </section>

          {/* Language */}
          <section id="language" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('🌍 Language', 'fiveprayer')}</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('?lang=en', 'fiveprayer')}</code>{__(' — English', 'fiveprayer')}</p>
              <p><code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('?lang=ar', 'fiveprayer')}</code>{__(' — Arabic', 'fiveprayer')}</p>
              <p><code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('?langs=en,ar', 'fiveprayer')}</code>{__(' — Multiple languages', 'fiveprayer')}</p>
            </div>
          </section>

          {/* Time Format */}
          <section id="time-format" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('⏱️ Time Format', 'fiveprayer')}</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <p><code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('?time_format=12h', 'fiveprayer')}</code>{__(' — "6:15 AM" (default)', 'fiveprayer')}</p>
              <p><code className="bg-gray-100 px-1.5 py-0.5 rounded-sm text-xs">{__('?time_format=24h', 'fiveprayer')}</code> — "18:15"</p>
            </div>
          </section>

          {/* Timezone */}
          <section id="timezone" className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{__('⏰ Timezone', 'fiveprayer')}</h2>
            <p className="text-sm text-gray-600">{__('Prayer times use your WordPress timezone setting. No timezone conversion is performed.', 'fiveprayer')}</p>
          </section>

          {/* Errors */}
          <section id="error-responses" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('⚠️ Errors', 'fiveprayer')}</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-200">
                  <th className="py-2 text-left font-semibold text-gray-500">{__('Code', 'fiveprayer')}</th>
                  <th className="py-2 text-left font-semibold text-gray-500">{__('Error', 'fiveprayer')}</th>
                  <th className="py-2 text-left font-semibold text-gray-500 hidden sm:table-cell">{__('Fix', 'fiveprayer')}</th>
                </tr></thead>
                <tbody>
                  {[
                    ['400', 'Invalid month/date', 'Check parameter format'],
                    ['401', 'Missing API key', 'Add X-API-Key header'],
                    ['401', 'Invalid/revoked key', 'Generate a new key'],
                    ['401', 'Key not permitted', 'Check domain/IP restrictions'],
                    ['401', 'Rate limit exceeded', 'Wait or increase limit'],
                    ['404', 'No data found', 'Generate calendar first'],
                  ].map(([code, err, fix], i) => (
                    <tr key={i} className="border-b border-gray-100 last:border-0">
                      <td className="py-2"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-sm text-xs font-mono">{code}</span></td>
                      <td className="py-2 text-gray-700">{err}</td>
                      <td className="py-2 text-gray-500 text-xs hidden sm:table-cell">{fix}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* cURL Reference */}
          <section id="curl-reference" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('💻 cURL Examples', 'fiveprayer')}</h2>
            <div className="space-y-3">
              {[
                { t: 'Test (no auth)', c: `curl '${baseUrl}/external/test'`, k: 'curl-test' },
                { t: "Today's prayer times", c: `curl -H 'X-API-Key: YOUR_KEY' '${baseUrl}/external/prayer-times/today?lang=en'`, k: 'curl-today' },
                { t: 'Next prayer', c: `curl -H 'X-API-Key: YOUR_KEY' '${baseUrl}/external/next-prayer?lang=en'`, k: 'curl-next' },
                { t: 'Monthly (Arabic)', c: `curl -H 'X-API-Key: YOUR_KEY' '${baseUrl}/external/prayer-times/month?year=2026&month=7&lang=ar'`, k: 'curl-month' },
              ].map(({ t, c, k }) => (
                <CodeBlock key={k} title={t} code={c} copyKey={k} />
              ))}
            </div>
          </section>

          {/* Live Sandbox */}
          <section id="live-api-sandbox" className="mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{__('🧪 Live Sandbox', 'fiveprayer')}</h2>
            <ApiDocsLivePreview />
          </section>

          {/* React Examples */}
          <section id="code-examples" className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 mb-6 scroll-mt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{__('💡 Code Examples', 'fiveprayer')}</h2>
            <p className="text-gray-500 text-sm mb-4">{__('Use any programming language. Below are JavaScript examples — adapt to your preferred language.', 'fiveprayer')}</p>
            <CodeBlock title={__('Next Prayer Component', 'fiveprayer')} code={`import { useState, useEffect } from 'react';

function NextPrayer() {
  const [data, setData] = useState(null);
  const apiKey = 'YOUR_API_KEY';
  const baseUrl = '${baseUrl}';

  useEffect(() => {
    const fetchNextPrayer = async () => {
      const res = await fetch(\`\${baseUrl}/external/next-prayer?lang=en\`, {
        headers: { 'X-API-Key': apiKey },
      });
      const result = await res.json();
      setData(result);

      // Auto-refresh at next prayer time
      const delay = (result.timestamp - Math.floor(Date.now() / 1000)) * 1000;
      if (delay > 0) setTimeout(fetchNextPrayer, delay);
    };
    fetchNextPrayer();
  }, []);

  if (!data) return <div>Loading...</div>;
  return (
    <div>
      <h2>{data.next_prayer_label}: {data.next_prayer_dynamic?.en}</h2>
      <p>Time: {data.next_time_dynamic?.en}</p>
      <p>Mosque: {data.mosque_info?.name}</p>
    </div>
  );
}`} copyKey="react-example" />
          </section>

        </div>
    </div>
  );
};

export default ApiDocs;

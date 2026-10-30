import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';

interface LivePreviewState {
  loading: boolean;
  status: number | null;
  response: unknown | null;
  error: string | null;
  fetchedAt: Date | null;
}

const SESSION_STORAGE_KEY = 'fiveprayer_apiDocs_apiKey';

const ApiDocsLivePreview: React.FC = () => {
  const [apiKey, setApiKey] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_STORAGE_KEY) || '';
    } catch {
      return '';
    }
  });
  const [endpoint, setEndpoint] = useState<'today' | 'date' | 'month' | 'next-prayer'>('today');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [lang, setLang] = useState('en');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [state, setState] = useState<LivePreviewState>({
    loading: false,
    status: null,
    response: null,
    error: null,
    fetchedAt: null,
  });

  // Persist the API key across page refreshes within the same session
  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, apiKey);
    } catch {
      // Ignore storage errors (e.g., private mode)
    }
  }, [apiKey]);

  const baseUrl = `${window.location.origin}/wp-json/fiveprayer/v1`;

  const buildCurlCommand = (): string => {
    const key = apiKey.trim() || 'fp_your_key_here';
    return `curl -H "X-API-Key: ${key}" \"${buildUrl()}\"`;
  };

  const copyCurlCommand = () => {
    const command = buildCurlCommand();
    const isLocalhost =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';

    if (window.location.protocol !== 'https:' && !isLocalhost) {
      toast.warning(
        __('Copy function works on HTTPS or localhost only. Please switch to HTTPS or use right-click to copy manually.', 'fiveprayer')
      );
      return;
    }

    navigator.clipboard
      .writeText(command)
      .then(() => toast.success(__('cURL command copied to clipboard!', 'fiveprayer')))
      .catch(() => toast.error(__('Failed to copy cURL command.', 'fiveprayer')));
  };

  const buildUrl = (): string => {
    const params = new URLSearchParams();
    params.append('lang', lang);

    switch (endpoint) {
      case 'today':
        params.append('time_format', timeFormat);
        return `${baseUrl}/external/prayer-times/today?${params.toString()}`;
      case 'date':
        params.append('date', date);
        return `${baseUrl}/external/prayer-times?${params.toString()}`;
      case 'month':
        params.append('year', String(year));
        params.append('month', String(month));
        params.append('time_format', timeFormat);
        return `${baseUrl}/external/prayer-times/month?${params.toString()}`;
      case 'next-prayer':
        params.append('time_format', timeFormat);
        return `${baseUrl}/external/next-prayer?${params.toString()}`;
      default:
        return '';
    }
  };

  const handleRun = async () => {
    if (!apiKey.trim()) {
      toast.error(__('Please enter your API key.', 'fiveprayer'));
      return;
    }

    setState((prev) => ({ ...prev, loading: true, status: null, error: null, fetchedAt: prev.fetchedAt }));

    try {
      const url = buildUrl();
      const res = await fetch(url, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json().catch(() => null);

      setState({
        loading: false,
        status: res.status,
        response: data,
        error: null,
        fetchedAt: res.ok ? new Date() : null,
      });

      if (!res.ok) {
        toast.error(`Request failed with status ${res.status}`);
      } else {
        toast.success(__('Request succeeded', 'fiveprayer'));
      }
    } catch (err) {
      setState((prev) => ({
        loading: false,
        status: null,
        response: null,
        error: err instanceof Error ? err.message : 'Unknown error',
        fetchedAt: prev.fetchedAt,
      }));
      toast.error(__('Request failed', 'fiveprayer'));
    }
  };

  const renderPreview = () => {
    if (!state.response || typeof state.response !== 'object' || state.response === null) {
      return null;
    }

    const data = state.response as Record<string, unknown>;

    if (endpoint === 'next-prayer' && data.next_prayer) {
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">{__('Next Prayer Preview', 'fiveprayer')}</h4>
          <p className="text-gray-700">
            <strong>{data.next_prayer as string}</strong>{__(' at ', 'fiveprayer')}<strong>{data.next_time as string}</strong>
          </p>
          <p className="text-gray-600 text-sm">{__('Current time: ', 'fiveprayer')}{data.current_time as string}</p>
        </div>
      );
    }

    if ((endpoint === 'today' || endpoint === 'date') && data.prayer_times) {
      const prayers = data.prayer_times as Record<string, { begins?: string; time?: string; iqamah?: string }>;
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">{__('Prayer Times Preview', 'fiveprayer')}</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            {Object.entries(prayers).map(([key, value]) => (
              <li key={key}>
                <strong className="capitalize">{key}:</strong>{' '}
                {value.begins ?? value.time ?? '—'}
                {value.iqamah ? ` (Iqamah: ${value.iqamah})` : ''}
              </li>
            ))}
          </ul>
        </div>
      );
    }

    if (endpoint === 'month' && Array.isArray(data.data)) {
      const days = data.data.slice(0, 3);
      return (
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">{__('Monthly Preview (first ', 'fiveprayer')}{days.length}{__(' days)', 'fiveprayer')}</h4>
          <div className="space-y-2">
            {days.map((day: { date: string; prayer_times: Record<string, { time: string }> }) => (
              <div key={day.date} className="text-sm text-gray-700">
                <strong>{day.date}</strong>{__(' — Fajr: ', 'fiveprayer')}{day.prayer_times?.fajr?.time}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div id="live-api-sandbox" className="bg-white p-6 rounded-2xl shadow-md shadow-gray-200 mb-10 scroll-mt-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">{__('Live API Sandbox', 'fiveprayer')}</h2>
      <p className="text-gray-700 mb-4">{__('Test the external API directly from the admin docs. Enter your API key, choose an endpoint, and run the request to see the live response.', 'fiveprayer')}</p>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">{__('API Key', 'fiveprayer')}</label>
          <input
            type="text"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={__('fp_your_key_here', 'fiveprayer')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-gray-500 text-xs mt-1">{__('Your API key is only used for this request and is not stored.', 'fiveprayer')}</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">{__('Endpoint', 'fiveprayer')}</label>
          <select
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value as typeof endpoint)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">{__('/external/prayer-times/today', 'fiveprayer')}</option>
            <option value="date">{__('/external/prayer-times?date=YYYY-MM-DD', 'fiveprayer')}</option>
            <option value="month">{__('/external/prayer-times/month', 'fiveprayer')}</option>
            <option value="next-prayer">{__('/external/next-prayer', 'fiveprayer')}</option>
          </select>
        </div>

        {endpoint === 'date' && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{__('Date', 'fiveprayer')}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {endpoint === 'month' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{__('Year', 'fiveprayer')}</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2020}
                max={2030}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{__('Month', 'fiveprayer')}</label>
              <input
                type="number"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                min={1}
                max={12}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{__('Language', 'fiveprayer')}</label>
            <select
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">{__('English (en)', 'fiveprayer')}</option>
              <option value="ar">{__('Arabic (ar)', 'fiveprayer')}</option>
            </select>
          </div>

          {(endpoint === 'today' || endpoint === 'month' || endpoint === 'next-prayer') && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">{__('Time Format', 'fiveprayer')}</label>
              <select
                value={timeFormat}
                onChange={(e) => setTimeFormat(e.target.value as typeof timeFormat)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="12h">{__('12-hour', 'fiveprayer')}</option>
                <option value="24h">{__('24-hour', 'fiveprayer')}</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">{__('Request URL', 'fiveprayer')}</label>
          <div className="bg-gray-100 p-3 rounded-lg break-all font-mono text-sm text-gray-800">
            {buildUrl()}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-semibold text-gray-700">{__('cURL Command', 'fiveprayer')}</label>
            <button
              onClick={copyCurlCommand}
              type="button"
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >{__('Copy to clipboard', 'fiveprayer')}</button>
          </div>
          <div className="bg-gray-900 p-3 rounded-lg break-all font-mono text-sm text-green-400">
            {buildCurlCommand()}
          </div>
          <p className="text-gray-500 text-xs mt-1">{__('Replace ', 'fiveprayer')}<code className="bg-gray-100 px-1 rounded-sm">{__('fp_your_key_here', 'fiveprayer')}</code>{__(' with your actual API key if you haven\'t entered one above.', 'fiveprayer')}</p>
        </div>

        <button
          onClick={handleRun}
          disabled={state.loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
        >
          {state.loading && (
            <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
          )}
          {state.loading ? 'Running...' : 'Run Request'}
        </button>
      </div>

      {state.loading && (
        <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4 animate-pulse">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" aria-hidden="true" />
            <span className="text-sm font-semibold text-gray-700">{__('Fetching data from the API...', 'fiveprayer')}</span>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded-sm w-3/4" />
            <div className="h-4 bg-gray-200 rounded-sm w-1/2" />
            <div className="h-4 bg-gray-200 rounded-sm w-2/3" />
          </div>
        </div>
      )}

      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-4">
          <strong>{__('Error:', 'fiveprayer')}</strong> {state.error}
        </div>
      )}

      {!state.loading && state.status && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{__('Status: ', 'fiveprayer')}</span>
          <span
            className={`px-2 py-0.5 rounded-sm text-sm font-semibold ${
              state.status >= 200 && state.status < 300
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {state.status}
          </span>
          {state.fetchedAt && (
            <span className="text-xs text-gray-500">{__('(fetched at ', 'fiveprayer')}{state.fetchedAt.toLocaleTimeString()})
            </span>
          )}
        </div>
      )}

      {!state.loading && !!state.response && (
        <div className="space-y-4">
          {renderPreview()}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">{__('Raw JSON Response', 'fiveprayer')}</h4>
            <div className="bg-gray-900 p-4 rounded-lg overflow-x-auto max-h-96 overflow-y-auto">
              <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                {JSON.stringify(state.response, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiDocsLivePreview;

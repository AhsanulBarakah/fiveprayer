/**
 * SettingsManager
 *
 * Manager for selecting calculation methods and parameters.
 *
 * @module prayerSetting/SettingsManager
 */
import React from 'react';
import { usePostMeta } from '../../hooks/usePostMeta';
import { toast } from 'sonner';
import { __ } from '@wordpress/i18n';

interface SettingsItem {
  id: number;
  name: string;
  method: string;
  params?: Record<string, any>;
}

interface SettingsManagerProps {
  settingKey: string;
  storeKey: string;
  settings: SettingsItem[];
  onUpdateStore: (settings: SettingsItem[]) => void;
  placeholders?: { name?: string; method?: string };
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const SettingsManager: React.FC<SettingsManagerProps> = ({ settingKey, storeKey, settings, onUpdateStore, placeholders, title, description, icon }) => {
  const { saveBatch } = usePostMeta();
  const [isEditing, setIsEditing] = React.useState<number | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [formData, setFormData] = React.useState<Omit<SettingsItem, 'id'>>({ name: '', method: '', params: {} });
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => { if (isAdding && nameInputRef.current) setTimeout(() => nameInputRef.current?.focus(), 50); }, [isAdding]);
  React.useEffect(() => { setFormData({ name: '', method: '', params: {} }); setIsEditing(null); setIsAdding(false); }, [storeKey]);

  const hasParams = settingKey === 'Methods_For_Calculation';

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.method.trim()) {
      toast.error(__('Name and Method are required', 'fiveprayer'));
      return;
    }
    const normalizedParams = hasParams ? normalizeParams(formData.params ?? {}) : {};
    const cleanItem: SettingsItem = { id: isEditing !== null ? isEditing : 0, name: formData.name.trim(), method: formData.method.trim() };
    if (Object.keys(normalizedParams).length > 0) cleanItem.params = normalizedParams;

    const updatedSettings = isEditing !== null
      ? settings.map((item) => item.id === isEditing ? { ...item, ...cleanItem } : item)
      : [...settings, { ...cleanItem, id: (settings.reduce((max, item) => Math.max(max, item.id || 0), 0)) + 1 }];

    onUpdateStore(updatedSettings);
    try {
      saveBatch({ [settingKey]: updatedSettings });
      toast.success(isEditing !== null ? __('Updated', 'fiveprayer') : __('Added', 'fiveprayer'));
    } catch (error) {
      toast.error(__('Failed to save', 'fiveprayer'));
    }
    setFormData({ name: '', method: '', params: {} });
    setIsEditing(null);
    setIsAdding(false);
  };

  const handleEdit = (item: SettingsItem) => {
    setFormData({ name: item.name, method: item.method, params: denormalizeParams(item.params || {}) });
    setIsEditing(item.id);
    setIsAdding(true);
  };

  const handleDelete = (id: number) => {
    if (!confirm(__('Delete this item?', 'fiveprayer'))) return;
    const updated = settings.filter((item) => item.id !== id);
    onUpdateStore(updated);
    saveBatch({ [settingKey]: updated });
    toast.success(__('Deleted', 'fiveprayer'));
  };

  const handleParamChange = (key: string, value: string) => {
    setFormData({ ...formData, params: { ...formData.params, [key]: value } });
  };

  const normalizeParams = (params: Record<string, any>) => {
    // Seasonal keys keep the Unified Method's winter/summer profiles intact
    // when the entry is edited here instead of in the Unified Method panel.
    const validKeys = [
      'fajr', 'isha', 'maghrib', 'dhuhr', 'midnight', 'asr', 'highlats', 'iterations',
      'seasonmode', 'summerstart', 'summerend', 'summerfajr', 'summerisha', 'summermaghrib', 'summerhighlats',
      'monthlyfajr', 'monthlyisha',
    ];
    const normalized: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      const cleanKey = key.trim().toLowerCase();
      let cleanValue = typeof value === 'string' ? value.trim() : value;
      if (!cleanKey || !validKeys.includes(cleanKey) || cleanValue === '') return;
      if (typeof cleanValue === 'string' && cleanValue.match(/^\d+(\.\d+)?$/)) cleanValue = parseFloat(cleanValue);
      if (cleanValue !== null && cleanValue !== undefined) normalized[cleanKey] = cleanValue;
    });
    return normalized;
  };

  const denormalizeParams = (params: Record<string, any>) => {
    const keyMap: Record<string, string> = { fajr: 'Fajr', isha: 'Isha', maghrib: 'Maghrib', dhuhr: 'Dhuhr', midnight: 'Midnight', asr: 'Asr', highLats: 'HighLats', iterations: 'Iterations', seasonMode: 'SeasonMode', summerStart: 'SummerStart', summerEnd: 'SummerEnd', summerFajr: 'SummerFajr', summerIsha: 'SummerIsha', summerMaghrib: 'SummerMaghrib', summerHighLats: 'SummerHighLats', monthlyFajr: 'MonthlyFajr', monthlyIsha: 'MonthlyIsha' };
    const denormalized: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
      const displayKey = keyMap[key.toLowerCase()] || key;
      const displayValue = typeof value === 'number' ? String(value) : value;
      if (displayValue !== null && displayValue !== undefined && displayValue !== '') denormalized[displayKey] = displayValue;
    });
    return denormalized;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">
              {icon}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">{description}</p>
            </div>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors focus:outline-hidden"
            >{__('+ Add New', 'fiveprayer')}</button>
          )}
        </div>

        {/* Info Banner */}
        {settingKey === 'Methods_For_Calculation' ? (
          <div className="mx-6 mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
            </svg>
            <div className="text-sm">
              <p className="font-semibold text-blue-800">{__('Main Settings Section', 'fiveprayer')}</p>
              <p className="text-blue-700 mt-0.5">{__('This is the ', 'fiveprayer')}<strong>{__('only place', 'fiveprayer')}</strong>{__(' where you need to add or edit prayer calculation methods (MWL, ISNA, Umm Al-Qura, etc). Other categories are pre-configured — no changes needed.', 'fiveprayer')}</p>
            </div>
          </div>
        ) : (
          <div className="mx-6 mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            <div className="text-sm">
              <p className="font-semibold text-amber-800">{__('Pre-configured — No changes needed', 'fiveprayer')}</p>
              <p className="text-amber-700 mt-0.5">{__('These options are pre-configured with standard values. ', 'fiveprayer')}<strong>{__('No changes required', 'fiveprayer')}</strong>{__(' unless you know exactly what you\'re doing.', 'fiveprayer')}</p>
            </div>
          </div>
        )}

        {/* Add/Edit Form */}
        {isAdding && (
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              {isEditing !== null ? 'Edit Item' : 'Add New Item'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Name', 'fiveprayer')}</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                  placeholder={placeholders?.name || __('Name', 'fiveprayer')}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Method', 'fiveprayer')}</label>
                <input
                  type="text"
                  value={formData.method}
                  onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                  className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                  placeholder={placeholders?.method || __('Method', 'fiveprayer')}
                />
              </div>
            </div>

            {hasParams && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 mb-3">{__('Calculation Parameters', 'fiveprayer')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { key: 'fajr', label: __('Fajr Angle', 'fiveprayer'), placeholder: __('e.g., 18', 'fiveprayer') },
                    { key: 'isha', label: __('Isha Angle', 'fiveprayer'), placeholder: __('e.g., 17 or 90 min', 'fiveprayer') },
                    { key: 'maghrib', label: __('Maghrib', 'fiveprayer'), placeholder: __('e.g., 4 degrees', 'fiveprayer') },
                    { key: 'dhuhr', label: __('Dhuhr', 'fiveprayer'), placeholder: __('e.g., 0 min', 'fiveprayer') },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.params?.[key] || formData.params?.[key.charAt(0).toUpperCase() + key.slice(1)] || ''}
                        onChange={(e) => handleParamChange(key, e.target.value)}
                        className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                        placeholder={placeholder}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Midnight', 'fiveprayer')}</label>
                    <select
                      value={formData.params?.midnight || formData.params?.Midnight || 'Standard'}
                      onChange={(e) => handleParamChange('midnight', e.target.value)}
                      className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                    >
                      <option value="Standard">{__('Standard (Sunset to Sunrise)', 'fiveprayer')}</option>
                      <option value="Jafari">{__('Jafari (Maghrib to Fajr)', 'fiveprayer')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Asr Calculation', 'fiveprayer')}</label>
                    <select
                      value={formData.params?.asr || formData.params?.Asr || 'Standard'}
                      onChange={(e) => handleParamChange('asr', e.target.value)}
                      className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                    >
                      <option value="Standard">{__('Standard (Shafii, Maliki, Jafari and Hanbali)', 'fiveprayer')}</option>
                      <option value="Hanafi">{__('Hanafi', 'fiveprayer')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Higher Latitude', 'fiveprayer')}</label>
                    <select
                      value={formData.params?.highLats || formData.params?.HighLats || 'NightMiddle'}
                      onChange={(e) => handleParamChange('highLats', e.target.value)}
                      className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                    >
                      <option value="NightMiddle">{__('Middle of The Night Method', 'fiveprayer')}</option>
                      <option value="OneSeventh">{__('One Seventh Rule', 'fiveprayer')}</option>
                      <option value="AngleBased">{__('Angel Base Method', 'fiveprayer')}</option>
                      <option value="None">{__('No adjustments', 'fiveprayer')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">{__('Iterations', 'fiveprayer')}</label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={formData.params?.iterations !== undefined ? formData.params?.iterations : 1}
                      onChange={(e) => handleParamChange('iterations', e.target.value)}
                      className="h-10 w-full px-3 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-green-300 focus:ring-1 focus:ring-green-200 focus:outline-hidden transition-all box-border"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <button onClick={handleSave} className="text-sm font-medium px-5 py-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors focus:outline-hidden">
                {isEditing !== null ? 'Update' : 'Add'}
              </button>
              <button onClick={() => { setFormData({ name: '', method: '', params: {} }); setIsEditing(null); setIsAdding(false); }} className="text-sm font-medium px-5 py-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors focus:outline-hidden">{__('Cancel', 'fiveprayer')}</button>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="divide-y divide-gray-100">
          {settings.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-gray-400">{__('No items yet. Click "Add New" to get started.', 'fiveprayer')}</p>
            </div>
          ) : (
            settings.map((item) => (
              <div key={item.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-medium text-gray-400 w-6 text-right">{item.id}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{__('Method: ', 'fiveprayer')}{item.method}</p>
                  </div>
                </div>
                {item.params && Object.keys(item.params).length > 0 && (
                  <div className="hidden lg:flex flex-wrap gap-1.5 mx-4">
                    {Object.entries(item.params).map(([key, value]) => (
                      value && (
                        <span key={key} className="text-[10px] px-1.5 py-0.5 rounded-sm bg-gray-100 text-gray-600">
                          {key}: {String(value)}
                        </span>
                      )
                    ))}
                  </div>
                )}
                <div className="flex gap-1.5 shrink-0">
                  <button onClick={() => handleEdit(item)} className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors focus:outline-hidden">{__('Edit', 'fiveprayer')}</button>
                  <button onClick={() => handleDelete(item.id)} className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors focus:outline-hidden">{__('Delete', 'fiveprayer')}</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsManager;

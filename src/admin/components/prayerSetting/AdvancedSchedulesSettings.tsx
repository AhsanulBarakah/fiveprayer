/**
 * AdvancedSchedulesSettings
 *
 * Panel for the "Advanced Schedules" category in the Configure Settings page
 * (moved here from More Settings, where it was its own page).
 *
 * Renders the custom prayer time schedules manager — date-specific overrides
 * for the timetable such as Ramadan, holidays or term-time timetables — behind
 * the standard category header used by every other Configure Settings card.
 *
 * Availability is controlled by the `Advanced_Schedules` feature switch:
 * turning it off hides/disable this card, and (because the feature is
 * engine-backed) also flips the manager's own "Enable Custom Schedules" master
 * switch so the overrides really stop applying. The saved schedules are never
 * deleted.
 *
 * @module prayerSetting/AdvancedSchedulesSettings
 */
import React from 'react';
import { toast } from 'sonner';
import { useConditional } from '../../state/storeConditional';
import CustomPrayerTimeSchedules from './CustomPrayerTimeSchedules';
import { __ } from '@wordpress/i18n';

interface AdvancedSchedulesSettingsProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

const AdvancedSchedulesSettings: React.FC<AdvancedSchedulesSettingsProps> = ({ title, description, icon }) => {
  const { isReadyGenerator } = useConditional();

  // Track the previous value to detect changes.
  const prevIsReadyGenerator = React.useRef<boolean | null>(null);

  // Remind the admin to regenerate after schedules change (only on a real
  // change — skipped on mount).
  React.useEffect(() => {
    if (prevIsReadyGenerator.current !== null && isReadyGenerator && !prevIsReadyGenerator.current) {
      toast.info(__('Please go and click "Generate Calendar" to effect this change', 'fiveprayer'));
    }
    prevIsReadyGenerator.current = isReadyGenerator;
  }, [isReadyGenerator]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        {/* Category header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">{__('Beta', 'fiveprayer')}</span>
            </div>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        </div>

        <div className="p-6">
          {/* Beta notice */}
          <div className="mb-5 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.8"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374l7.108-12.25c.866-1.5 3.032-1.5 3.898 0l7.108 12.25ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <p className="text-xs leading-relaxed text-amber-800">{__('This feature is in beta. Please share any feedback in our Facebook group.', 'fiveprayer')}</p>
          </div>

          <CustomPrayerTimeSchedules />
        </div>
      </div>
    </div>
  );
};

export default AdvancedSchedulesSettings;

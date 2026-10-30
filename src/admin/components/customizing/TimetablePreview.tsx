/**
 * TimetablePreview
 *
 * Live styled timetable preview using monthly calendar data and color settings.
 *
 * @module customizing/TimetablePreview
 */
import React from 'react';
import { useMonthCalendar } from '../../hooks/useMonthCalendar';
import { useTimetableLayoutStore } from '../../state/storeTimetableLayout';
import { useLocationStore } from '../../state/storeLocation';
import { useTimeTableColor } from '../../state/storeTimeTableColor';
import { useDayTimesSeconds } from '../../hooks/useDayTimesSeconds';
import TimeWithSeconds from './prayerTable/TimeWithSeconds';
import { PrayerTableStyled } from './prayerTable/PrayerTableStyled';
import { __ } from '@wordpress/i18n';

const TimetablePreview = () => {
  const data = useMonthCalendar();
  // Exact per-day times with seconds (recomputed at display time) for the
  // hover tooltips — the stored timetable only keeps minute precision.
  const daySeconds = useDayTimesSeconds();
  const { showDate, showHijriDate, showSunrise, showIqamah, showMidnight } = useTimetableLayoutStore();
  const month = useLocationStore((state) => state.month);
  const colorData = useTimeTableColor();

  if (!data || !data.length) {
    return (
      <div className="p-12 text-center text-gray-400 text-sm">
        <p>{__('No timetable data for ', 'fiveprayer')}<span className="font-medium text-gray-600">{month?.name || 'this month'}</span>.</p>
        <p className="text-xs mt-1">{__('Select a month and generate the calendar first.', 'fiveprayer')}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <PrayerTableStyled
        $rgba_odd_bg={colorData.rgba_odd_bg}
        $rgba_even_bg={colorData.rgba_even_bg}
        $rgba_odd_text={colorData.rgba_odd_text}
        $rgba_even_text={colorData.rgba_even_text}
        $rgba_border_clr={colorData.rgba_border_clr}
        $rgba_border_size={colorData.rgba_border_size}
        $rgba_border_style={colorData.rgba_border_style}
        $rgba_light_bg={colorData.rgba_light_bg}
        $rgba_light_text={colorData.rgba_light_text}
      >
        <table>
          <thead>
            <tr>
              {showDate && <th style={{ textAlign: 'left' }}>{__('Date', 'fiveprayer')}</th>}
              {showHijriDate && <th style={{ textAlign: 'left' }}>{__('Hijri Date', 'fiveprayer')}</th>}
              {!showDate && !showHijriDate && <th></th>}
              <th colSpan={showIqamah ? 3 : 2}>{__('Fajr', 'fiveprayer')}</th>
              {showSunrise && <th>{__('Sunrise', 'fiveprayer')}</th>}
              <th colSpan={showIqamah ? 2 : 1}>{__('Dhuhr', 'fiveprayer')}</th>
              <th colSpan={showIqamah ? 2 : 1}>{__('Asr', 'fiveprayer')}</th>
              <th colSpan={showIqamah ? 2 : 1}>{__('Maghrib', 'fiveprayer')}</th>
              <th colSpan={showIqamah ? 2 : 1}>{__('Isha', 'fiveprayer')}</th>
              {showMidnight && <th>{__('Midnight', 'fiveprayer')}</th>}
            </tr>
            <tr>
              {showDate && <th style={{ textAlign: 'left' }}>{__('Date', 'fiveprayer')}</th>}
              {showHijriDate && <th style={{ textAlign: 'left' }}>{__('Hijri', 'fiveprayer')}</th>}
              {!showDate && !showHijriDate && <th></th>}
              <th>{__('Begins', 'fiveprayer')}</th>
              <th>{__('Iqamah', 'fiveprayer')}</th>
              {showIqamah && <th>{__('Jamaah', 'fiveprayer')}</th>}
              {showSunrise && <th>{__('Time', 'fiveprayer')}</th>}
              <th>{__('Begins', 'fiveprayer')}</th>
              {showIqamah && <th>{__('Iqamah', 'fiveprayer')}</th>}
              <th>{__('Begins', 'fiveprayer')}</th>
              {showIqamah && <th>{__('Iqamah', 'fiveprayer')}</th>}
              <th>{__('Begins', 'fiveprayer')}</th>
              {showIqamah && <th>{__('Iqamah', 'fiveprayer')}</th>}
              <th>{__('Begins', 'fiveprayer')}</th>
              {showIqamah && <th>{__('Iqamah', 'fiveprayer')}</th>}
              {showMidnight && <th>{__('Time', 'fiveprayer')}</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((day: any, i: number) => {
              const dayDate = day.date ? new Date(day.date).toISOString().split('T')[0] : '';
              return (
                <tr key={i}>
                  {showDate && <td style={{ textAlign: 'left' }}>{day.currentDate}</td>}
                  {showHijriDate && <td style={{ textAlign: 'left' }}>{day.hijri_date || ''}</td>}
                  {!showDate && !showHijriDate && <td style={{ textAlign: 'left' }}>{day.currentDate}</td>}
                  <TimeWithSeconds value={day.fajr_begins} exact={daySeconds[dayDate]?.fajr} label={__('Fajr', 'fiveprayer')} />
                  <td>{day.fajr_iqamah}</td>
                  {showIqamah && <td>{day.fajr_masjid_jamaah || '-'}</td>}
                  {showSunrise && <TimeWithSeconds value={day.sunrise} exact={daySeconds[dayDate]?.sunrise} label={__('Sunrise', 'fiveprayer')} />}
                  <TimeWithSeconds value={day.dhuhr_begins} exact={daySeconds[dayDate]?.dhuhr} label={__('Dhuhr', 'fiveprayer')} />
                  {showIqamah && <td>{day.dhuhr_iqamah}</td>}
                  <TimeWithSeconds value={day.asr_begins} exact={daySeconds[dayDate]?.asr} label={__('Asr', 'fiveprayer')} />
                  {showIqamah && <td>{day.asr_iqamah}</td>}
                  <TimeWithSeconds value={day.maghrib_begins} exact={daySeconds[dayDate]?.maghrib} label={__('Maghrib', 'fiveprayer')} />
                  {showIqamah && <td>{day.maghrib_iqamah}</td>}
                  <TimeWithSeconds value={day.isha_begins} exact={daySeconds[dayDate]?.isha} label={__('Isha', 'fiveprayer')} />
                  {showIqamah && <td>{day.isha_iqamah}</td>}
                  {showMidnight && <TimeWithSeconds value={day.midnight} exact={daySeconds[dayDate]?.midnight} label={__('Midnight', 'fiveprayer')} />}
                </tr>
              );
            })}
          </tbody>
        </table>
      </PrayerTableStyled>
    </div>
  );
};

export default TimetablePreview;

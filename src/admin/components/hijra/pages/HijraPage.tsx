/**
 * Hijra Calendar Page
 *
 * Page for configuring hijra calendar settings (language, calendar type,
 * Ramadan activation). Shows options sidebar and live calendar preview.
 *
 * @module hijra/pages/HijraPage
 */
import React from 'react'
import PrayerCalendar from '../../prayerSetting/PrayerCalendar'
import HijraOptions from '../HijraOptions'

const HijraPage = () => {
    const [isWide, setIsWide] = React.useState(window.innerWidth >= 1280);

    React.useEffect(() => {
        const handler = () => setIsWide(window.innerWidth >= 1280);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    return (
        <div className="max-w-[1600px] mx-auto p-4 space-y-6">
            <div className={`grid gap-6 ${isWide ? 'grid-cols-[1fr_3fr]' : 'grid-cols-1'}`}>
                <div className="max-h-[calc(100vh-100px)] overflow-y-auto">
                    <HijraOptions />
                </div>
                <PrayerCalendar show={false} />
            </div>
        </div>
    )
}

export default HijraPage

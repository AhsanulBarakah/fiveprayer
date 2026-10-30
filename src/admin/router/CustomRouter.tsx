import { Navigate, createHashRouter } from 'react-router';
import * as React from 'react';
import ErrorPage from '../../app/ErrorPage';
import Root from '../../app/Root';
import { __ } from '@wordpress/i18n';

// Lazy load all components for optimal bundle size
const CustomizingPage = React.lazy(() => import('../components/customizing/pages/CustomizingPage'));
const CustomizingTimeTable = React.lazy(() => import('../components/customizing/CustomizingTimeTable'));
const Welcome = React.lazy(() => import('../components/welcome/Welcome'));

// Lazy load less frequently used components (no loading spinner)
const PrayerSettingPage = React.lazy(() => import('../components/prayerSetting/pages/PrayerSettingPage'));
const PrinterPage = React.lazy(() => import('../components/customizing/pages/PrinterPage'));
const LocationPage = React.lazy(() => import('../components/customizing/pages/LocationPage'));
const SettingsPage = React.lazy(() => import('../components/customizing/pages/SettingsPage'));
const HijraPage = React.lazy(() => import('../components/hijra/pages/HijraPage'));
const SinglePrayerDoc = React.lazy(() => import('../components/Docs/SinglePrayerDoc'));
const DocPage = React.lazy(() => import('../components/Docs/page/DocPage'));
const TimeTableDoc = React.lazy(() => import('../components/Docs/TimeTableDoc'));
const HomeDocs = React.lazy(() => import('../components/Docs/HomeDocs'));
const CalculationSettingsDoc = React.lazy(() => import('../components/Docs/CalculationSettingsDoc'));
const DisplaySettingsDoc = React.lazy(() => import('../components/Docs/DisplaySettingsDoc'));
const TVDisplayModeDoc = React.lazy(() => import('../components/Docs/TVDisplayModeDoc'));
const MosqueTvDeploymentDoc = React.lazy(() => import('../components/Docs/MosqueTvDeploymentDoc'));
const LocalTestingModeDoc = React.lazy(() => import('../components/Docs/LocalTestingModeDoc'));
const LocalNetworkTroubleshootingDoc = React.lazy(() => import('../components/Docs/LocalNetworkTroubleshootingDoc'));
const CustomTimeSchedulesDoc = React.lazy(() => import('../components/Docs/CustomTimeSchedulesDoc'));
const NextPrayerCountdownDoc = React.lazy(() => import('../components/Docs/NextPrayerCountdownDoc'));
const PrayerHighlightDoc = React.lazy(() => import('../components/Docs/PrayerHighlightDoc'));
const CSSCustomPropertiesDoc = React.lazy(() => import('../components/Docs/CSSCustomPropertiesDoc'));
const ApiDocs = React.lazy(() => import('../components/Docs/ApiDocs'));
const ApiSecurityDocs = React.lazy(() => import('../components/Docs/ApiSecurityDocs'));
const MorePage = React.lazy(() => import('../components/More/page/MorePage'));
const PrayerNamesEditor = React.lazy(() => import('../components/More/translates/PrayerNamesEditor'));
const GregorianMonthsEditor = React.lazy(() => import('../components/More/translates/GregorianMonthsEditor'));
const GregorianNumbersEditor = React.lazy(() => import('../components/More/translates/GregorianNumbersEditor'));
const HijraMonthsEditor = React.lazy(() => import('../components/More/translates/HijraMonthsEditor'));
const HijraNumbersEditor = React.lazy(() => import('../components/More/translates/HijraNumbersEditor'));
const Timetable_Prayer = React.lazy(() => import('../components/More/translates/Timetable_Prayer'));
const Vertical_Daily_Prayer = React.lazy(() => import('../components/More/translates/Vertical_Daily_Prayer'));
const Day_Names = React.lazy(() => import('../components/More/translates/Day_Names'));
const WelcomeSettingsNotice = React.lazy(() => import('../components/More/page/WelcomeSettingsNotice'));
const ExtraInfo = React.lazy(() => import('../components/More/translates/ExtraInfo'));
const TranslateIndexPage = React.lazy(() => import('../components/More/translates/TranslateIndexPage'));
const DisplaySettingsPage = React.lazy(() => import('../components/More/page/DisplaySettingsPage'));
const TimetableLayoutPage = React.lazy(() => import('../components/customizing/pages/TimetableLayoutPage'));

// Simple fallback without spinner
const SimpleFallback = () => <div style={{ minHeight: '200px' }}></div>;
export const CustomRouter = createHashRouter([
  {
    path: '/',
    element: <Root />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <React.Suspense fallback={<SimpleFallback />}><Welcome /></React.Suspense>,
      },
      {
        path: "prayersettings",
        element: <React.Suspense fallback={<SimpleFallback />}><PrayerSettingPage /></React.Suspense>,
      },
      {
        path: 'customizing',
        element: <React.Suspense fallback={<SimpleFallback />}><CustomizingPage /></React.Suspense>,
        children: [
          {
            index: true,
            element: <Navigate to={'timetable'} replace />,
          },
          {
            path: 'timetable',
            element: <React.Suspense fallback={<SimpleFallback />}><CustomizingTimeTable /></React.Suspense>,
          },
          {
            path: 'printerpage',
            element: <React.Suspense fallback={<SimpleFallback />}><PrinterPage /></React.Suspense>,
          },
          {
            path: 'location',
            element: <React.Suspense fallback={<SimpleFallback />}><LocationPage /></React.Suspense>,
          },
          {
            path: 'settings',
            element: <React.Suspense fallback={<SimpleFallback />}><SettingsPage /></React.Suspense>,
          },
          {
            path: 'layout',
            element: <React.Suspense fallback={<SimpleFallback />}><TimetableLayoutPage /></React.Suspense>,
          },
        ],
      },
      {
        path: 'hijra',
        element: <React.Suspense fallback={<SimpleFallback />}><HijraPage /></React.Suspense>,
      },
      {
        path: 'moresettings',
        element: <React.Suspense fallback={<SimpleFallback />}><MorePage /></React.Suspense>,
        children: [
          {
            index: true,
            element: <React.Suspense fallback={<SimpleFallback />}><WelcomeSettingsNotice /></React.Suspense>,
          },
          {
            path: 'displaysettings',
            element: <React.Suspense fallback={<SimpleFallback />}><DisplaySettingsPage /></React.Suspense>
          },
          {
            path: 'translate',
            element: <React.Suspense fallback={<SimpleFallback />}><TranslateIndexPage /></React.Suspense>
          },
          {
            path: 'translate/prayernames',
            element: <React.Suspense fallback={<SimpleFallback />}><PrayerNamesEditor /></React.Suspense>
          },
          {
            path: 'translate/timetableprayer',
            element: <React.Suspense fallback={<SimpleFallback />}><Timetable_Prayer /></React.Suspense>
          },
          {
            path: 'translate/verticaldailyprayer',
            element: <React.Suspense fallback={<SimpleFallback />}><Vertical_Daily_Prayer /></React.Suspense>
          },
          {
            path: 'translate/daynames',
            element: <React.Suspense fallback={<SimpleFallback />}><Day_Names /></React.Suspense>
          },
          {
            path: 'translate/hijramonths',
            element: <React.Suspense fallback={<SimpleFallback />}><HijraMonthsEditor /></React.Suspense>
          },
          {
            path: 'translate/hijranumbers',
            element: <React.Suspense fallback={<SimpleFallback />}><HijraNumbersEditor /></React.Suspense>
          },
          {
            path: 'translate/gregorianmonths',
            element: <React.Suspense fallback={<SimpleFallback />}><GregorianMonthsEditor /></React.Suspense>
          },
          {
            path: 'translate/gregoriannumbers',
            element: <React.Suspense fallback={<SimpleFallback />}><GregorianNumbersEditor /></React.Suspense>
          },
          {
            path: 'translate/extra_info',
            element: <React.Suspense fallback={<SimpleFallback />}><ExtraInfo /></React.Suspense>
          },
          {
            // Advanced Schedules moved into Configure Settings as a feature
            // category — keep the old More URL working for bookmarks.
            path: 'customtimeschedules',
            element: <Navigate to={'/customizing/settings'} replace />,
          },
        ]
      },
      {
        path: 'documentation',
        element: <React.Suspense fallback={<SimpleFallback />}><DocPage /></React.Suspense>,
        children: [
          {
            index: true,
            element: <React.Suspense fallback={<SimpleFallback />}><HomeDocs /></React.Suspense>,
          },
          {
            path: 'singleprayer/shortcodes',
            element: <React.Suspense fallback={<SimpleFallback />}><SinglePrayerDoc /></React.Suspense>
          },
          {
            path: 'singleprayer/blocks',
            element: <h1>{__('blocks component', 'fiveprayer')}</h1>
          },
          {
            path: 'timetable/shortcodes',
            element: <React.Suspense fallback={<SimpleFallback />}><TimeTableDoc /></React.Suspense>
          },
          {
            path: 'calculationsettings',
            element: <React.Suspense fallback={<SimpleFallback />}><CalculationSettingsDoc /></React.Suspense>
          },
          {
            path: 'displaysettings',
            element: <React.Suspense fallback={<SimpleFallback />}><DisplaySettingsDoc /></React.Suspense>
          },
          {
            path: 'tvdisplay',
            element: <React.Suspense fallback={<SimpleFallback />}><TVDisplayModeDoc /></React.Suspense>
          },
          {
            path: 'mosquetv',
            element: <React.Suspense fallback={<SimpleFallback />}><MosqueTvDeploymentDoc /></React.Suspense>
          },
          {
            path: 'localtesting',
            element: <React.Suspense fallback={<SimpleFallback />}><LocalTestingModeDoc /></React.Suspense>
          },
          {
            path: 'localtesting-troubleshooting',
            element: <React.Suspense fallback={<SimpleFallback />}><LocalNetworkTroubleshootingDoc /></React.Suspense>
          },
          {
            path: 'customtimeschedules',
            element: <React.Suspense fallback={<SimpleFallback />}><CustomTimeSchedulesDoc /></React.Suspense>
          },
          {
            path: 'nextprayercountdown',
            element: <React.Suspense fallback={<SimpleFallback />}><NextPrayerCountdownDoc /></React.Suspense>
          },
          {
            path: 'prayerhighlight',
            element: <React.Suspense fallback={<SimpleFallback />}><PrayerHighlightDoc /></React.Suspense>
          },
          {
            path: 'cssvariables',
            element: <React.Suspense fallback={<SimpleFallback />}><CSSCustomPropertiesDoc /></React.Suspense>
          },
          {
            path: 'api',
            element: <React.Suspense fallback={<SimpleFallback />}><ApiDocs /></React.Suspense>
          },
          {
            path: 'apisecurity',
            element: <React.Suspense fallback={<SimpleFallback />}><ApiSecurityDocs /></React.Suspense>
          },
          {
            path: 'timetable/blocks',
            element: <h1>{__('Blocks component', 'fiveprayer')}</h1>
          },
        ],
      },
    ],
  },
]);

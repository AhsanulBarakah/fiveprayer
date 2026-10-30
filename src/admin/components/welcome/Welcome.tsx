/**
 * Welcome
 *
 * Dashboard page showing greeting and quick-start navigation links.
 *
 * @module welcome/Welcome
 */
import React from 'react';
import { NavLink } from 'react-router';
import FacebookCommunityCard from './FacebookCommunityCard';
import { __ } from '@wordpress/i18n';

declare const FivePrayerData: {
    Current_user: string;
    Site_title: string;
    adminUrl?: string;
};

const Welcome = () => {
    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-6">
            {/* Hero Header */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                <div className="px-8 py-10 text-center bg-white">
                    <h1 className="text-3xl font-bold text-gray-900">{__('Welcome to ', 'fiveprayer')}<span className="text-green-600">{__('FivePrayer', 'fiveprayer')}</span>
                    </h1>
                    <p className="text-gray-600 mt-2 max-w-lg mx-auto">{__('Your all-in-one Islamic prayer times solution. Set up prayer calculations, customize your timetable, and keep your community connected.', 'fiveprayer')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Quick Start */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
                                </svg>
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">{__('Quick Start', 'fiveprayer')}</h2>
                        </div>
                    </div>
                    <div className="p-5 space-y-3">
                        <NavLink to="/prayersettings" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                            <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600 group-hover:bg-green-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342" /></svg>
                            </span>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{__('Prayer Settings', 'fiveprayer')}</p>
                                <p className="text-xs text-gray-500">{__('Configure calculation method, location and month', 'fiveprayer')}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-green-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </NavLink>
                        <NavLink to="/hijra" className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-50 transition-colors group">
                            <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 group-hover:bg-amber-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" /></svg>
                            </span>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{__('Hijra Calendar', 'fiveprayer')}</p>
                                <p className="text-xs text-gray-500">{__('Enable Hijra calendar display', 'fiveprayer')}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-amber-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </NavLink>
                        <NavLink to="/customizing" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group">
                            <span className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 group-hover:bg-purple-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a6.776 6.776 0 0 0-3.42-5.765 6.73 6.73 0 0 0-5.765 3.42m2.002 5.765a6.776 6.776 0 0 0 3.42-5.765 6.73 6.73 0 0 0-5.765 3.42m-1.064-5.765a6.776 6.776 0 0 1 3.42-5.765 6.73 6.73 0 0 1 5.765 3.42" /></svg>
                            </span>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{__('Customizing', 'fiveprayer')}</p>
                                <p className="text-xs text-gray-500">{__('Customize timetable, printer, and more', 'fiveprayer')}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-purple-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </NavLink>
                        <NavLink to="/moresettings/translate" className="flex items-center gap-3 p-3 rounded-lg hover:bg-emerald-50 transition-colors group">
                            <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" /></svg>
                            </span>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{__('Translate', 'fiveprayer')}</p>
                                <p className="text-xs text-gray-500">{__('Translate labels, dates and numbers', 'fiveprayer')}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-emerald-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </NavLink>
                    </div>
                </div>

                {/* Calendar Notice */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">{__('Important Notice', 'fiveprayer')}</h2>
                        </div>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-sm font-medium text-amber-800 mb-1">{__('Annual Calendar Regeneration', 'fiveprayer')}</p>
                            <p className="text-xs text-amber-700 leading-relaxed">{__('A new prayer timetable must be generated each year starting in January to keep prayer times accurate.', 'fiveprayer')}</p>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm font-medium text-red-800 mb-1">{__('Upgrade from v2.4 to v3.0.0?', 'fiveprayer')}</p>
                            <p className="text-xs text-red-700 leading-relaxed">{__('After upgrading, please check that everything looks correct. If you notice any data issues, first save your data backup, then click reset — both can be found in the Settings. Otherwise everything should work fine.', 'fiveprayer')}</p>
                            <a href={FivePrayerData?.adminUrl ? `${FivePrayerData.adminUrl}?page=fiveprayer-settings` : '/wp-admin/admin.php?page=fiveprayer-settings'} className="inline-block mt-2 text-xs font-medium text-red-600 hover:text-red-800 underline">{__('Go to Settings Page', 'fiveprayer')}</a>
                        </div>
                    </div>
                </div>

                {/* Community + Docs */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                    <div className="px-5 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.375a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>
                            </div>
                            <h2 className="text-sm font-semibold text-gray-900">{__('Community & Docs', 'fiveprayer')}</h2>
                        </div>
                    </div>
                    <div className="p-5 space-y-3">
                        <FacebookCommunityCard />
                        <NavLink to="/documentation" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group">
                            <span className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-200 transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 3.75m12 0c-.218.162-.43.336-.636.513A8.966 8.966 0 0 1 18 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 12 15.75a8.967 8.967 0 0 0-6-2.212m12 0c.218.162.43.336.636.513A8.966 8.966 0 0 1 18 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 12 15.75a8.967 8.967 0 0 0-6-2.212m12 0c.218.162.43.336.636.513A8.966 8.966 0 0 1 18 3.75c-1.052 0-2.062.18-3 .512v14.25A8.444 8.444 0 0 1 12 15.75m-12 0h18" /></svg>
                            </span>
                            <div>
                                <p className="text-sm font-medium text-gray-900">{__('Documentation', 'fiveprayer')}</p>
                                <p className="text-xs text-gray-500">{__('Setup guides and video tutorials', 'fiveprayer')}</p>
                            </div>
                            <svg className="w-4 h-4 text-gray-300 ml-auto group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Welcome;

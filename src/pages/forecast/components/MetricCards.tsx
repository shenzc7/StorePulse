import React from 'react';
import { formatIndianNumber } from '../../../src/lib/api';

interface MetricCardsProps {
    tomorrowVisits: number;
    tomorrowStaff: number;
    tomorrowRevenue: number;
    avgVisits: number;
    trendPercentage: number;
    riskCount: number;
}

export function MetricCards({
    tomorrowVisits,
    tomorrowStaff,
    tomorrowRevenue,
    avgVisits,
    trendPercentage,
    riskCount
}: MetricCardsProps) {
    const isPositiveTrend = trendPercentage >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Tomorrow's Traffic */}
            <div className="card p-5 border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-ink-500 uppercase tracking-wide">Tomorrow's Footfall</span>
                    <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-ink-900">{formatIndianNumber(Math.round(tomorrowVisits))}</div>
                    <div className="text-sm font-medium text-ink-600">visitors</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="text-xs text-ink-500">vs {formatIndianNumber(Math.round(avgVisits))} avg</div>
                    <div className={`text-xs font-bold ${tomorrowVisits > avgVisits ? 'text-green-600' : 'text-ink-500'}`}>
                        {tomorrowVisits > avgVisits ? 'Above Average' : 'Normal Traffic'}
                    </div>
                </div>
            </div>

            {/* Staff Needed */}
            <div className="card p-5 border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-ink-500 uppercase tracking-wide">Staff Required</span>
                    <svg className="w-5 h-5 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-ink-900">{tomorrowStaff}</div>
                    <div className="text-sm font-medium text-ink-600">members</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-xs text-ink-500">
                        Based on <strong className="text-ink-700">configured capacity</strong> per staff member
                    </p>
                </div>
            </div>

            {/* Revenue Forecast */}
            <div className="card p-5 border border-border bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-ink-500 uppercase tracking-wide">Est. Revenue</span>
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-ink-900">₹{(tomorrowRevenue / 1000).toFixed(1)}k</div>
                    <div className="text-sm font-medium text-ink-600">tomorrow</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs">
                        <svg className={`w-3 h-3 ${isPositiveTrend ? 'text-green-600' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPositiveTrend ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                        </svg>
                        <span className={`font-semibold ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(trendPercentage).toFixed(1)}%
                        </span>
                        <span className="text-ink-500">trend</span>
                    </div>
                </div>
            </div>

            {/* Action Items */}
            <div className={`card p-5 border ${riskCount > 0 ? 'border-red-200 bg-red-50/50' : 'border-border bg-white'} shadow-sm hover:shadow-md transition-shadow`}>
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs font-bold uppercase tracking-wide ${riskCount > 0 ? 'text-red-600' : 'text-ink-500'}`}>
                        Attention Needed
                    </span>
                    <svg className={`w-5 h-5 ${riskCount > 0 ? 'text-red-500' : 'text-ink-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className={`text-3xl font-black ${riskCount > 0 ? 'text-red-700' : 'text-ink-900'}`}>{riskCount}</div>
                    <div className={`text-sm font-medium ${riskCount > 0 ? 'text-red-600' : 'text-ink-600'}`}>alerts</div>
                </div>
                <div className="mt-3 pt-3 border-t border-border/50">
                    <p className={`text-xs ${riskCount > 0 ? 'text-red-700 font-medium' : 'text-ink-500'}`}>
                        {riskCount > 0 ? 'Review inventory risks immediately' : 'Operations looking nominal'}
                    </p>
                </div>
            </div>
        </div>
    );
}

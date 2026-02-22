import { formatIndianNumber } from '../../../src/lib/api';

interface MetricCardsProps {
    tomorrowVisits: number;
    tomorrowStaff: number;
    tomorrowRangeWidth: number;
    avgVisits: number;
    trendPercentage: number;
    riskCount: number;
}

export function MetricCards({
    tomorrowVisits,
    tomorrowStaff,
    tomorrowRangeWidth,
    avgVisits,
    trendPercentage,
    riskCount
}: MetricCardsProps) {
    const isPositiveTrend = trendPercentage >= 0;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-300 rounded-sm shadow-sm md:divide-x divide-y md:divide-y-0 divide-slate-200 mb-8">
            {/* Tomorrow's Traffic */}
            <div className="p-5 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tomorrow Footfall</span>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-slate-800">{formatIndianNumber(Math.round(tomorrowVisits))}</div>
                    <div className="text-xs font-semibold text-slate-500">visitors</div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-slate-500">vs {formatIndianNumber(Math.round(avgVisits))} avg</div>
                    <div className={`text-[10px] font-bold uppercase tracking-wider ${tomorrowVisits > avgVisits ? 'text-green-600' : 'text-slate-500'}`}>
                        {tomorrowVisits > avgVisits ? 'Above Average' : 'Normal Traffic'}
                    </div>
                </div>
            </div>

            {/* Staff Needed */}
            <div className="p-5 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Staff Required</span>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-slate-800">{tomorrowStaff}</div>
                    <div className="text-xs font-semibold text-slate-500">members</div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[10px] text-slate-500 leading-tight">
                        Based on <strong className="text-slate-700">configured capacity</strong> per staff member
                    </p>
                </div>
            </div>

            {/* Forecast Uncertainty */}
            <div className="p-5 hover:bg-slate-50 transition-colors group">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Uncertainty Band</span>
                    <svg className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m6 6V7m-3 10V4m9 13H3" />
                    </svg>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-slate-800">{Math.round(tomorrowRangeWidth)}</div>
                    <div className="text-xs font-semibold text-slate-500">visitors wide</div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider">
                        <svg className={`w-3 h-3 ${isPositiveTrend ? 'text-green-600' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isPositiveTrend ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                        </svg>
                        <span className={`${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                            {Math.abs(trendPercentage).toFixed(1)}%
                        </span>
                        <span className="text-slate-500">trend</span>
                    </div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">P10-P90</span>
                </div>
            </div>

            {/* Action Items */}
            <div className={`p-5 transition-colors ${riskCount > 0 ? 'bg-red-50 hover:bg-red-100/50' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${riskCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>
                        Attention Needed
                    </span>
                    <svg className={`w-4 h-4 ${riskCount > 0 ? 'text-red-500' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className={`text-3xl font-black ${riskCount > 0 ? 'text-red-700' : 'text-slate-800'}`}>{riskCount}</div>
                    <div className={`text-xs font-semibold ${riskCount > 0 ? 'text-red-600' : 'text-slate-500'}`}>alerts</div>
                </div>
                <div className={`mt-3 pt-3 border-t ${riskCount > 0 ? 'border-red-200' : 'border-slate-100'}`}>
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${riskCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                        {riskCount > 0 ? 'Review inventory risks immediately' : 'Operations nominal'}
                    </p>
                </div>
            </div>
        </div>
    );
}

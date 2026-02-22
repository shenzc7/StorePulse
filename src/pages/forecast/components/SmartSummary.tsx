import { Link } from '@tanstack/react-router';

interface SmartSummaryProps {
    tomorrowVisits: number;
    staffRecommendation: string;
    inventoryUrgency: string;
    isHighTraffic: boolean;
    warnings?: string[];
    peakDay?: {
        date: string;
        visits: number;
    };
}

export function SmartSummary({
    tomorrowVisits,
    staffRecommendation,
    inventoryUrgency,
    isHighTraffic,
    warnings,
    peakDay
}: SmartSummaryProps) {
    return (
        <div className="mb-8 space-y-4">
            {/* Primary Decision Banner */}
            <div className={`p-4 rounded-sm border-l-4 flex items-start gap-4 shadow-sm transition-all ${isHighTraffic
                ? 'bg-amber-50 border-amber-500 border-y border-r border-y-amber-200 border-r-amber-200'
                : 'bg-slate-50 border-slate-500 border-y border-r border-y-slate-200 border-r-slate-200'
                }`}>
                <div className={`p-2 rounded-none border ${isHighTraffic ? 'bg-amber-100 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 shadow-sm'}`}>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h2 className={`font-bold text-sm tracking-wide uppercase ${isHighTraffic ? 'text-amber-900' : 'text-slate-800'}`}>
                        Operational Insight for Tomorrow
                    </h2>
                    <p className={`text-sm mt-1 leading-relaxed ${isHighTraffic ? 'text-amber-800' : 'text-slate-700'}`}>
                        Tomorrow is expected to be a <strong className="underline">{isHighTraffic ? 'High Traffic' : 'Normal'}</strong> day
                        with approx. <strong>{Math.round(tomorrowVisits)} visitors</strong>.
                        <span className="ml-1 text-slate-600">{staffRecommendation} {inventoryUrgency}</span>
                    </p>

                    {peakDay && (
                        <div className="mt-3 py-1.5 px-3 bg-white rounded-none border-l-2 border-red-500 shadow-sm flex items-center gap-3">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                            <p className="text-xs font-bold text-slate-800 uppercase tracking-widest">
                                Strategic Alert: <span className="text-slate-600 font-normal normal-case tracking-normal">Weekly peak of <strong className="text-red-700">{Math.round(peakDay.visits)} visits</strong> expected on {new Date(peakDay.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.</span>
                            </p>
                        </div>
                    )}
                </div>
                <Link
                    to="/reports"
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm text-sm font-bold shadow-sm transition-all focus:outline-none"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    View Reports
                </Link>
            </div>

            {/* Model Health / Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {warnings.map((warning, i) => (
                        <div key={i} className="flex items-center gap-2 px-2 py-1 bg-slate-100 border border-slate-300 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 bg-slate-400"></span>
                            {warning}
                        </div>
                    ))}
                    <a href="/train" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 tracking-widest uppercase flex items-center gap-1">
                        Optimize Model Quality <span className="text-lg leading-none">&rsaquo;</span>
                    </a>
                </div>
            )}
        </div>
    );
}

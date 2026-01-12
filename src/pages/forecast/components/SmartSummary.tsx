import React from 'react';

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
            <div className={`p-4 rounded-xl border-2 flex items-start gap-4 shadow-sm transition-all ${isHighTraffic
                ? 'bg-amber-50 border-amber-200 ring-4 ring-amber-500/5'
                : 'bg-primary-50 border-primary-100'
                }`}>
                <div className={`p-3 rounded-lg ${isHighTraffic ? 'bg-amber-100 text-amber-600' : 'bg-primary-100 text-primary-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div className="flex-1">
                    <h2 className={`font-bold text-lg ${isHighTraffic ? 'text-amber-900' : 'text-primary-900'}`}>
                        Operational Insight for Tomorrow
                    </h2>
                    <p className={`text-sm mt-1 leading-relaxed ${isHighTraffic ? 'text-amber-800' : 'text-primary-800'}`}>
                        Tomorrow is expected to be a <strong className="underline">{isHighTraffic ? 'High Traffic' : 'Normal'}</strong> day
                        with approx. <strong>{Math.round(tomorrowVisits)} visitors</strong>.
                        {staffRecommendation} {inventoryUrgency}
                    </p>

                    {peakDay && (
                        <div className="mt-3 py-2 px-3 bg-white/50 rounded-lg border border-primary-200/50 flex items-center gap-3">
                            <span className="flex h-2 w-2 rounded-full bg-accent-500 animate-pulse"></span>
                            <p className="text-xs font-bold text-primary-900">
                                STRATEGIC ALERT: Weekly peak of <span className="text-accent-600 underline decoration-accent-300 decoration-2">{Math.round(peakDay.visits)} visits</span> expected on {new Date(peakDay.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.
                            </p>
                        </div>
                    )}
                </div>
                <button
                    className="hidden md:flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm font-bold text-ink-700 shadow-sm hover:shadow-md active:scale-95 transition-all"
                    onClick={() => {
                        const text = `Forecast for Tomorrow: ${Math.round(tomorrowVisits)} visits. Action: ${staffRecommendation} ${inventoryUrgency}${peakDay ? ` Strategic Alert: Peak visits (${Math.round(peakDay.visits)}) expected on ${peakDay.date}.` : ''}`;
                        navigator.clipboard.writeText(text);
                    }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Share Plan
                </button>
            </div>

            {/* Model Health / Warnings */}
            {warnings && warnings.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {warnings.map((warning, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink-50 border border-border text-[11px] font-bold text-ink-600 uppercase tracking-tight">
                            <span className="w-1.5 h-1.5 rounded-full bg-ink-400"></span>
                            {warning}
                        </div>
                    ))}
                    <a href="/train" className="text-[11px] font-bold text-primary-600 hover:underline px-2 py-1.5">
                        Optimize Model Quality →
                    </a>
                </div>
            )}
        </div>
    );
}

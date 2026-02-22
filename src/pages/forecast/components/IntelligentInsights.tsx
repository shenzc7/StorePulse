interface StaffingRecommendation {
    date: string;
    recommended_staff: number;
    labor_cost_estimate: number;
    role_breakdown: Record<string, number>;
}

interface InventoryAlert {
    date: string;
    estimated_daily_sales: number;
    stockout_risk: string;
    inventory_priorities: Record<string, string>;
    reasoning?: string;
}

interface IntelligentInsightsProps {
    staffing: StaffingRecommendation[];
    inventory: InventoryAlert[];
}

export function IntelligentInsights({ staffing, inventory }: IntelligentInsightsProps) {
    if (!staffing.length && !inventory.length) return null;

    // Find the peak staffing day
    const peakStaffingDay = [...staffing].sort((a, b) => b.recommended_staff - a.recommended_staff)[0];

    // Find highest risk inventory days
    const highRiskInventoryDays = inventory.filter(i => i.stockout_risk === 'high' || i.stockout_risk === 'medium');

    return (
        <div className="border border-slate-300 bg-white mb-8 rounded-sm shadow-sm">
            <div className="px-5 py-3 border-b border-slate-300 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Operational Insights Report</h2>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-2 py-0.5 border border-slate-300">AUTO-GENERATED</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-none bg-green-500"></span>
                    <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Active Monitoring</span>
                </div>
            </div>

            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">

                {/* Staffing Insight Section */}
                <div className="flex-1 p-5 lg:p-6 bg-white">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Labor Demand Analysis</h3>
                    {staffing.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Upcoming Shift Requirements</p>
                            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                {staffing.map((day, idx) => {
                                    const isPeak = day.date === peakStaffingDay.date;
                                    return (
                                        <div key={idx} className={`flex items-center justify-between p-3 border-l-2 bg-slate-50 border-y border-r border-y-slate-200 border-r-slate-200 ${isPeak ? 'border-l-indigo-500' : 'border-l-slate-400'}`}>
                                            <div>
                                                <div className="font-mono text-xs text-slate-800 font-bold">
                                                    {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                </div>
                                                <div className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider font-semibold">
                                                    {isPeak ? <span className="text-indigo-600">Peak Coverage</span> : 'Standard Coverage'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-slate-800 leading-none">{day.recommended_staff}</div>
                                                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-1">Headcount</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic">Insufficient data for labor analysis.</p>
                    )}
                </div>

                {/* Inventory Insight Section */}
                <div className="flex-1 p-5 lg:p-6 bg-white">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">Inventory Risk Assessment</h3>
                    {highRiskInventoryDays.length > 0 ? (
                        <div className="space-y-3">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Flagged Dates (Risk &gt; Normal)</p>
                            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                                {highRiskInventoryDays.map((day, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row sm:items-start p-3 border-l-2 border-slate-800 bg-slate-50 border-y border-r border-y-slate-200 border-r-slate-200 gap-3">
                                        <div className="font-mono text-xs text-slate-800 font-bold whitespace-nowrap pt-0.5">
                                            {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                                        </div>
                                        <div className="text-xs text-slate-600 leading-relaxed" title={day.reasoning || "Prioritize restocking high-velocity items."}>
                                            {day.reasoning || "Prioritize restocking high-velocity items."}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col justify-center pb-4 text-sm text-slate-600">
                            <div className="flex items-center gap-2 mb-2 text-green-700 font-bold">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                No Critical Risks
                            </div>
                            <p>Supply levels are adequately matched against projected demand boundaries for this forecast window.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

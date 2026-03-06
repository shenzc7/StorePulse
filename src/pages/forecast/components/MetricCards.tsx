import { formatIndianNumber } from '../../../src/lib/api';
import { InfoTip } from './InfoTip';

interface StaffingRecommendation {
    date: string;
    predicted_visits: number;
    recommended_staff: number;
    role_breakdown: Record<string, number>;
    labor_cost_estimate: number;
    is_high_traffic: boolean;
    confidence_impact?: string;
    upper_bound_visits?: number;
}

interface InventoryAlert {
    date: string;
    estimated_daily_sales: number;
    upper_sales_potential?: number;
    inventory_priorities: Record<string, string>;
    stockout_risk: string;
}

interface Prediction {
    date: string;
    predicted_visits: number;
    lower_bound: number;
    upper_bound: number;
    day_of_week: string;
    is_weekend: boolean;
    is_holiday: boolean;
    is_payday: boolean;
    confidence_level: string;
}

interface MetricCardsProps {
    predictions: Prediction[];
    staffing: StaffingRecommendation[];
    inventory: InventoryAlert[];
    avgVisits: number;
    trendPercentage: number;
}

export function MetricCards({
    predictions,
    staffing,
    inventory,
    avgVisits,
    trendPercentage,
}: MetricCardsProps) {
    if (!predictions || predictions.length === 0) return null;

    const tomorrow = predictions[0];
    const tomorrowStaff = staffing[0];
    const tomorrowInventory = inventory[0];
    const tomorrowRangeWidth = tomorrow ? Math.max(0, tomorrow.upper_bound - tomorrow.lower_bound) : 0;
    const isPositiveTrend = trendPercentage >= 0;

    // Weekend count in the forecast window
    const weekendCount = predictions.filter(p => p.is_weekend).length;
    const holidayCount = predictions.filter(p => p.is_holiday).length;
    const paydayCount = predictions.filter(p => p.is_payday).length;

    // High/medium risk count
    const riskCount = inventory.filter(a => a.stockout_risk === 'high' || a.stockout_risk === 'medium').length;

    // Highest traffic day
    const peakDay = predictions.reduce((prev, curr) =>
        curr.predicted_visits > prev.predicted_visits ? curr : prev, predictions[0]);

    // Total expected visitors this week
    const totalWeekVisitors = predictions.reduce((sum, p) => sum + p.predicted_visits, 0);

    // Total labor cost
    const totalLaborCost = staffing.reduce((sum, s) => sum + (s.labor_cost_estimate || 0), 0);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-100">
            {/* Tomorrow's Traffic */}
            <div className="p-5 hover:bg-slate-50/70 transition-all group relative">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">Tomorrow's Footfall <InfoTip text="The AI model's best prediction of how many customers will visit your store tomorrow, based on past patterns, day of week, and seasonal factors." /></span>
                    <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{formatIndianNumber(Math.round(tomorrow.predicted_visits))}</div>
                    <div className="text-xs font-bold text-slate-400">visitors</div>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">
                    {tomorrow.day_of_week} • Range: <span className="text-slate-500 tabular-nums">{Math.round(tomorrow.lower_bound)}–{Math.round(tomorrow.upper_bound)}</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-400 tracking-tight">vs {formatIndianNumber(Math.round(avgVisits))} weekly avg</div>
                        <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${tomorrow.predicted_visits > avgVisits ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                            {tomorrow.predicted_visits > avgVisits * 1.15 ? 'Peak' : tomorrow.predicted_visits > avgVisits ? 'Above Avg' : 'Normal'}
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-slate-400">Week Total</span>
                        <span className="font-black text-slate-700 tabular-nums">{formatIndianNumber(Math.round(totalWeekVisitors))}</span>
                    </div>
                    {(weekendCount > 0 || holidayCount > 0) && (
                        <div className="flex gap-1.5 flex-wrap">
                            {weekendCount > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100">{weekendCount} Weekend{weekendCount > 1 ? 's' : ''}</span>}
                            {holidayCount > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">{holidayCount} Holiday{holidayCount > 1 ? 's' : ''}</span>}
                            {paydayCount > 0 && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">{paydayCount} Payday{paydayCount > 1 ? 's' : ''}</span>}
                        </div>
                    )}
                </div>
            </div>

            {/* Staff Needed */}
            <div className="p-5 hover:bg-slate-50/70 transition-all group relative">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">Staff Required <InfoTip text="The recommended number of staff to schedule tomorrow. Calculated by dividing predicted visitors by your configured customers-per-staff ratio, with a safety margin for peak scenarios." /></span>
                    <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{tomorrowStaff?.recommended_staff || 0}</div>
                    <div className="text-xs font-bold text-slate-400">members</div>
                </div>
                {tomorrowStaff && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(tomorrowStaff.role_breakdown || {}).map(([role, count]) => (
                            <span key={role} className="text-[9px] font-bold text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {count} {role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                        ))}
                    </div>
                )}
                <div className="mt-4 pt-3 border-t border-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-400 tracking-tight">Tomorrow's Cost</div>
                        <span className="text-[10px] font-black text-slate-700 tabular-nums">₹{tomorrowStaff?.labor_cost_estimate?.toLocaleString('en-IN') || '—'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-[10px] font-bold text-slate-400 tracking-tight">Weekly Labor Cost</div>
                        <span className="text-[10px] font-black text-indigo-600 tabular-nums">₹{totalLaborCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Confidence</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded ${tomorrowStaff?.confidence_impact === 'high' ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                            {tomorrowStaff?.confidence_impact || 'moderate'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Forecast Uncertainty */}
            <div className="p-5 hover:bg-slate-50/70 transition-all group relative">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] flex items-center gap-1.5">Confidence Band <InfoTip text="The spread between the best-case and worst-case visitor prediction. A smaller number means the AI is more certain. A large number means higher unpredictability — plan for flexibility." /></span>
                    <div className="p-1.5 bg-amber-50 text-amber-500 rounded-lg group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-6m6 6V7m-3 10V4m9 13H3" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">{Math.round(tomorrowRangeWidth)}</div>
                    <div className="text-xs font-bold text-slate-400">variance</div>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">
                    Tomorrow: <span className="text-slate-500">{tomorrow.confidence_level} confidence</span>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">Weekly Trend</span>
                        <div className="flex items-center gap-1">
                            <svg className={`w-3 h-3 ${isPositiveTrend ? 'text-emerald-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isPositiveTrend ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                            </svg>
                            <span className={`text-[10px] font-black tabular-nums ${isPositiveTrend ? 'text-emerald-600' : 'text-red-500'}`}>
                                {isPositiveTrend ? '+' : ''}{trendPercentage.toFixed(1)}%
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400">Peak Day</span>
                        <span className="text-[10px] font-black text-indigo-600">
                            {new Date(peakDay.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })} ({Math.round(peakDay.predicted_visits)})
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Type</span>
                        <span className="text-[9px] font-black text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-wider">P10–P90 Bound</span>
                    </div>
                </div>
            </div>

            {/* Risk Monitor */}
            <div className={`p-5 transition-all group relative ${riskCount > 0 ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50/70'}`}>
                <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] flex items-center gap-1.5 ${riskCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                        Risk Monitor <InfoTip text="Days where inventory may run low due to predicted high visitor traffic. Red = critical stock risk (likely stockout), amber = moderate risk (monitor closely), green = supply is comfortable." />
                    </span>
                    <div className={`p-1.5 rounded-lg group-hover:scale-110 transition-transform ${riskCount > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <div className={`text-3xl font-black tracking-tighter tabular-nums ${riskCount > 0 ? 'text-red-700' : 'text-slate-900'}`}>{riskCount}</div>
                    <div className={`text-xs font-bold ${riskCount > 0 ? 'text-red-500' : 'text-slate-400'}`}>risk days</div>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 mt-1">
                    of {predictions.length} forecast days
                </div>
                <div className="mt-4 pt-3 border-t border-slate-50 space-y-2">
                    {/* Per-day risk dots */}
                    <div className="flex items-center gap-1">
                        {inventory.map((inv, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${new Date(inv.date).toLocaleDateString('en-IN', { weekday: 'short' })}: ${inv.stockout_risk} risk`}>
                                <div className={`w-full h-1.5 rounded-full ${inv.stockout_risk === 'high' ? 'bg-red-500' : inv.stockout_risk === 'medium' ? 'bg-amber-400' : 'bg-emerald-300'}`} />
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                        {inventory.slice(0, Math.min(7, inventory.length)).map((inv, i) => (
                            <span key={i} className="flex-1 text-center">{new Date(inv.date).toLocaleDateString('en-IN', { weekday: 'narrow' })}</span>
                        ))}
                    </div>
                    <div className={`mt-1 ${riskCount > 0 ? 'text-red-700' : 'text-slate-500'}`}>
                        <p className="text-[10px] font-black uppercase tracking-widest">
                            {riskCount > 3 ? 'Immediate Action' : riskCount > 0 ? 'Intervention Required' : 'All Clear'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

import { Link } from '@tanstack/react-router';
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
    reasoning?: string;
    recommended_action?: string;
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
    weather: string;
}

interface SmartSummaryProps {
    predictions: Prediction[];
    staffing: StaffingRecommendation[];
    inventory: InventoryAlert[];
    avgVisits: number;
    trendPercentage: number;
    warnings?: string[];
    metadata?: {
        trained_at?: string;
        data_records?: number;
        model_version?: string;
        data_range?: { min?: string | null; max?: string | null };
        data_freshness?: { is_stale: boolean; reason: string | null };
    };
}

const formatRole = (role: string) => role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const riskColor = (risk: string) => {
    if (risk === 'high') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' };
    if (risk === 'medium') return { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800', dot: 'bg-amber-500' };
    return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' };
};

const priorityLabel = (status: string): { label: string; color: string } => {
    switch (status) {
        case 'urgent_restock': return { label: 'Urgent Restock', color: 'text-red-600' };
        case 'restock': return { label: 'Restock', color: 'text-orange-600' };
        case 'stock_up': return { label: 'Stock Up', color: 'text-amber-600' };
        case 'order_extra': return { label: 'Order Extra', color: 'text-blue-600' };
        case 'shelf_audit': return { label: 'Shelf Audit', color: 'text-purple-600' };
        case 'monitor': return { label: 'Monitor', color: 'text-slate-500' };
        default: return { label: 'Normal', color: 'text-slate-400' };
    }
};

export function SmartSummary({ predictions, staffing, inventory, avgVisits, trendPercentage, warnings, metadata }: SmartSummaryProps) {
    if (!predictions || predictions.length === 0) return null;

    const tomorrow = predictions[0];
    const tomorrowStaff = staffing[0];
    const tomorrowInventory = inventory[0];
    const isHighTraffic = tomorrow.predicted_visits > avgVisits * 1.15;
    const isPositiveTrend = trendPercentage >= 0;

    // Peak day computation
    const peakPrediction = predictions.reduce((prev, curr) =>
        curr.predicted_visits > prev.predicted_visits ? curr : prev, predictions[0]);
    const isPeakDifferent = peakPrediction.date !== tomorrow.date;

    // Total labor cost for the week
    const weeklyLaborCost = staffing.reduce((sum, s) => sum + (s.labor_cost_estimate || 0), 0);
    const highRiskDays = inventory.filter(i => i.stockout_risk === 'high' || i.stockout_risk === 'medium').length;

    // Mini sparkline data
    const maxVisit = Math.max(...predictions.map(p => p.predicted_visits), 1);
    const minVisit = Math.min(...predictions.map(p => p.predicted_visits));
    const sparkRange = maxVisit - minVisit || 1;

    return (
        <div className="space-y-4">
            {/* ── Main Decision Banner ── */}
            <div className={`rounded-2xl border shadow-xl transition-all duration-500 ${isHighTraffic
                ? 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50/30'
                : 'border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/20'
                }`}>

                {/* Top bar with context badges */}
                <div className={`px-6 py-3 flex flex-wrap items-center gap-2 border-b rounded-t-2xl ${isHighTraffic ? 'border-amber-100 bg-amber-50/50' : 'border-slate-100 bg-slate-50/50'}`}>
                    <span className={`text-[10px] font-black tracking-[0.2em] uppercase flex items-center gap-1.5 ${isHighTraffic ? 'text-amber-600' : 'text-slate-500'}`}>
                        AI Strategy Summary
                        <InfoTip text="This is the AI's daily briefing for your store. It combines the NB-INGARCH forecast model, staffing calculations, and inventory risk analysis into one actionable summary." />
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-500">
                        {new Date(tomorrow.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <div className="flex-1" />
                    {tomorrow.is_weekend && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-wider">Weekend</span>
                    )}
                    {tomorrow.is_holiday && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[9px] font-black uppercase tracking-wider">Holiday</span>
                    )}
                    {tomorrow.is_payday && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black uppercase tracking-wider">Payday Period</span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${isHighTraffic
                        ? 'bg-amber-200 text-amber-900'
                        : 'bg-slate-200 text-slate-600'}`}>
                        {isHighTraffic ? '⚡ High Traffic' : 'Normal Volume'}
                    </span>
                </div>

                <div className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        {/* ── Left: Tomorrow's key forecast ── */}
                        <div className="flex-1 space-y-5">
                            <div>
                                <p className={`text-lg font-medium leading-relaxed ${isHighTraffic ? 'text-amber-900' : 'text-slate-800'}`}>
                                    Expect {isHighTraffic
                                        ? <span className="text-amber-600 font-black">Peak Traffic</span>
                                        : <span className="font-black">Normal Volume</span>}
                                    {' '}of approximately{' '}
                                    <strong className="text-3xl tracking-tighter tabular-nums">
                                        {Math.round(tomorrow.predicted_visits)}
                                    </strong>{' '}
                                    visitors tomorrow.
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                    <span className="font-semibold">Confidence: <span className="text-slate-700">{tomorrow.confidence_level}</span></span>
                                    <span className="text-slate-300">|</span>
                                    <span className="font-semibold">Range: <span className="text-slate-700 tabular-nums">{Math.round(tomorrow.lower_bound)} – {Math.round(tomorrow.upper_bound)}</span></span>
                                    <span className="text-slate-300">|</span>
                                    <span className={`font-bold flex items-center gap-1 ${isPositiveTrend ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {isPositiveTrend ? '↗' : '↘'} {Math.abs(trendPercentage).toFixed(1)}% weekly trend
                                    </span>
                                </div>
                            </div>

                            {/* Staffing breakdown */}
                            {tomorrowStaff && (
                                <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                            </div>
                                            <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">Tomorrow's Team <InfoTip text="The optimal staff count and role breakdown for tomorrow. Roles are auto-assigned based on predicted visitor volume — more visitors means more billing counters and assistants." /></span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-slate-900 tabular-nums">{tomorrowStaff.recommended_staff}</span>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">staff</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(tomorrowStaff.role_breakdown || {}).map(([role, count]) => (
                                            <div key={role} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 text-xs font-bold text-slate-700">
                                                <span className={`w-2 h-2 rounded-full ${role.includes('billing') ? 'bg-emerald-500' : role.includes('supervisor') ? 'bg-purple-500' : 'bg-blue-500'}`}></span>
                                                <span className="tabular-nums">{count}</span>
                                                <span className="text-slate-400 font-medium">{formatRole(role)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Est. Labor Cost: <span className="text-slate-600">₹{tomorrowStaff.labor_cost_estimate?.toLocaleString('en-IN')}</span></span>
                                        {tomorrowStaff.confidence_impact && (
                                            <span>Confidence: <span className={tomorrowStaff.confidence_impact === 'high' ? 'text-emerald-600' : 'text-amber-600'}>{tomorrowStaff.confidence_impact}</span></span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Inventory snapshot */}
                            {tomorrowInventory && (
                                <div className={`p-4 rounded-xl border shadow-sm ${riskColor(tomorrowInventory.stockout_risk).bg} ${riskColor(tomorrowInventory.stockout_risk).border}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg ${tomorrowInventory.stockout_risk === 'high' ? 'bg-red-100 text-red-600' : tomorrowInventory.stockout_risk === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                            </div>
                                            <span className={`text-xs font-black uppercase tracking-wider flex items-center gap-1.5 ${riskColor(tomorrowInventory.stockout_risk).text}`}>Inventory Risk <InfoTip text="Shows which product categories may run out of stock tomorrow based on predicted customer demand. 'Urgent Restock' means order more now. 'Monitor' means keep an eye on stock levels." /></span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${riskColor(tomorrowInventory.stockout_risk).badge}`}>
                                            {tomorrowInventory.stockout_risk === 'high' ? 'Critical' : tomorrowInventory.stockout_risk === 'medium' ? 'Moderate' : 'Low'} Risk
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(tomorrowInventory.inventory_priorities || {}).map(([category, status]) => {
                                            const p = priorityLabel(status);
                                            return (
                                                <div key={category} className="flex items-center justify-between p-2 rounded-lg bg-white/70 border border-white text-xs">
                                                    <span className="font-semibold text-slate-600 capitalize">{category.replace(/_/g, ' ')}</span>
                                                    <span className={`font-black uppercase tracking-wide text-[10px] ${p.color}`}>{p.label}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {tomorrowInventory.reasoning && (
                                        <p className="mt-3 text-[11px] text-slate-500 font-medium italic">
                                            ℹ {tomorrowInventory.reasoning}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-200/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Est. Sales: <span className="text-slate-600 tabular-nums">{tomorrowInventory.estimated_daily_sales} units</span></span>
                                        {tomorrowInventory.upper_sales_potential !== undefined && (
                                            <span>Peak Potential: <span className="text-slate-600 tabular-nums">{tomorrowInventory.upper_sales_potential} units</span></span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Right: Week summary + sparkline ── */}
                        <div className="lg:w-72 xl:w-80 space-y-4">
                            {/* 7-day sparkline */}
                            <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center gap-1.5">7-Day Forecast Shape <InfoTip text="A snapshot of predicted visitor traffic over the next 7 days. Taller bars mean more visitors. The darkest bar is the predicted peak day for the week." /></div>
                                <div className="flex items-end gap-[3px]" style={{ height: '64px' }}>
                                    {predictions.map((p, i) => {
                                        const normalized = (p.predicted_visits - minVisit) / sparkRange;
                                        const barPx = Math.round(Math.max(10, normalized * 56 + 8));
                                        const isMax = p.date === peakPrediction.date;
                                        return (
                                            <div key={i} className="flex-1 flex flex-col items-center justify-end" style={{ height: '64px' }} title={`${new Date(p.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}: ${Math.round(p.predicted_visits)} visitors`}>
                                                <div className="text-[8px] font-black text-slate-500 mb-0.5 tabular-nums">{Math.round(p.predicted_visits)}</div>
                                                <div
                                                    className={`w-full rounded-t transition-all duration-300 ${isMax ? 'bg-indigo-500' : p.is_weekend ? 'bg-blue-400' : 'bg-slate-300'}`}
                                                    style={{ height: `${barPx}px` }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between mt-1.5 text-[9px] font-bold text-slate-400 uppercase">
                                    {predictions.map((p, i) => (
                                        <span key={i} className={`flex-1 text-center ${p.date === peakPrediction.date ? 'text-indigo-600 font-black' : ''}`}>
                                            {new Date(p.date).toLocaleDateString('en-IN', { weekday: 'narrow' })}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Weekly stats grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                                    <div className="text-2xl font-black text-slate-900 tabular-nums">{staffing.reduce((s, d) => s + d.recommended_staff, 0)}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">Staff-Days <InfoTip text="The total number of individual staff shifts needed across the full forecast period. For example, 5 staff × 7 days = 35 staff-days." /></div>
                                </div>
                                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                                    <div className="text-2xl font-black text-slate-900 tabular-nums">₹{(weeklyLaborCost / 1000).toFixed(1)}k</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">Weekly Labor <InfoTip text="The estimated total wage cost for all recommended staff across the forecast period. Based on your configured labor cost per staff member." /></div>
                                </div>
                                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                                    <div className={`text-2xl font-black tabular-nums ${highRiskDays > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{highRiskDays}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">Risk Days <InfoTip text="Number of upcoming days with medium or high inventory stockout risk. Zero means your supply levels are comfortable for the forecast period." /></div>
                                </div>
                                <div className="p-3 rounded-xl bg-white border border-slate-100 shadow-sm text-center">
                                    <div className="text-2xl font-black text-slate-900 tabular-nums">{Math.round(avgVisits)}</div>
                                    <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1 flex items-center justify-center gap-1">Weekly Avg <InfoTip text="The average predicted visitors per day over the forecast window. Useful for comparing tomorrow's traffic against what's typical for the week." /></div>
                                </div>
                            </div>

                            {/* Peak alert */}
                            {isPeakDifferent && (
                                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 shadow-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                                        <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider">Weekly Peak Alert</span>
                                    </div>
                                    <p className="text-xs text-indigo-800 font-semibold">
                                        <strong className="tabular-nums">{Math.round(peakPrediction.predicted_visits)}</strong> visitors expected on{' '}
                                        {new Date(peakPrediction.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
                                        {peakPrediction.is_weekend && ' (Weekend)'}
                                        {peakPrediction.is_payday && ' (Payday)'}
                                    </p>
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex flex-col gap-2">
                                <Link
                                    to="/reports"
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-black shadow-lg shadow-slate-200 transition-all active:scale-95"
                                >
                                    <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Full Analysis Report
                                </Link>
                                <Link
                                    to="/lab"
                                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold border border-slate-200 shadow-sm transition-all active:scale-95"
                                >
                                    <svg className="w-4 h-4 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    Run What-If Scenario
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Model Health / Warnings ── */}
            {warnings && warnings.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-1">
                    {warnings.map((warning, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                            {warning}
                        </div>
                    ))}
                    <Link to="/train" className="group text-[9px] font-black text-blue-600 hover:text-blue-800 px-3 py-1.5 tracking-widest uppercase flex items-center gap-1.5">
                        Refine Model <span className="text-sm group-hover:translate-x-1 transition-transform">→</span>
                    </Link>
                </div>
            )}
        </div>
    );
}

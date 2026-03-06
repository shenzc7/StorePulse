import { InfoTip } from './InfoTip';

interface StaffingRecommendation {
    date: string;
    predicted_visits: number;
    recommended_staff: number;
    labor_cost_estimate: number;
    role_breakdown: Record<string, number>;
    is_high_traffic: boolean;
    confidence_impact?: string;
    upper_bound_visits?: number;
}

interface InventoryAlert {
    date: string;
    estimated_daily_sales: number;
    upper_sales_potential?: number;
    stockout_risk: string;
    inventory_priorities: Record<string, string>;
    reasoning?: string;
    recommended_action?: string;
}

interface IntelligentInsightsProps {
    staffing: StaffingRecommendation[];
    inventory: InventoryAlert[];
}

const formatRole = (role: string) => role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const priorityLabel = (status: string): { label: string; color: string; bg: string } => {
    switch (status) {
        case 'urgent_restock': return { label: 'Urgent Restock', color: 'text-red-700', bg: 'bg-red-50 border-red-100' };
        case 'restock': return { label: 'Restock', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' };
        case 'stock_up': return { label: 'Stock Up', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100' };
        case 'order_extra': return { label: 'Order Extra', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-100' };
        case 'shelf_audit': return { label: 'Shelf Audit', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-100' };
        case 'monitor': return { label: 'Monitor', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-200' };
        default: return { label: 'Normal', color: 'text-slate-400', bg: 'bg-white border-slate-100' };
    }
};

export function IntelligentInsights({ staffing, inventory }: IntelligentInsightsProps) {
    if (!staffing.length && !inventory.length) return null;

    // Find the peak staffing day
    const peakStaffingDay = [...staffing].sort((a, b) => b.recommended_staff - a.recommended_staff)[0];

    // Find highest risk inventory days
    const highRiskInventoryDays = inventory.filter(i => i.stockout_risk === 'high' || i.stockout_risk === 'medium');

    // Summary metrics
    const totalLaborCost = staffing.reduce((sum, s) => sum + (s.labor_cost_estimate || 0), 0);
    const avgStaff = staffing.length > 0 ? (staffing.reduce((sum, s) => sum + s.recommended_staff, 0) / staffing.length) : 0;
    const highTrafficDays = staffing.filter(s => s.is_high_traffic).length;

    // Collect all unique categories and their worst status across the horizon
    const categoryStatusMap: Record<string, { worst: string; days: number }> = {};
    inventory.forEach(inv => {
        Object.entries(inv.inventory_priorities || {}).forEach(([cat, status]) => {
            if (!categoryStatusMap[cat]) categoryStatusMap[cat] = { worst: status, days: 0 };
            if (status !== 'normal') categoryStatusMap[cat].days++;
            // Severity ordering
            const severity = ['urgent_restock', 'restock', 'stock_up', 'order_extra', 'shelf_audit', 'monitor', 'normal'];
            if (severity.indexOf(status) < severity.indexOf(categoryStatusMap[cat].worst)) {
                categoryStatusMap[cat].worst = status;
            }
        });
    });

    return (
        <div className="w-full bg-white mb-12 rounded-2xl shadow-xl overflow-hidden border border-slate-100 animate-slide-up">
            <div className="px-6 py-6 border-b border-slate-100 bg-slate-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-400/20">
                        <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold font-display text-white tracking-tight flex items-center gap-2">Operational Insights <InfoTip text="This section shows the AI's detailed day-by-day staffing plan and inventory risk assessment for the entire forecast period. Use this to plan your team schedule and stock orders for the week ahead." /></h2>
                        <p className="text-sm text-slate-400 mt-1 font-medium italic">AI-generated labor and inventory risk assessments based on model variance</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Weekly Cost</span>
                        <span className="text-sm font-black text-white tabular-nums">₹{totalLaborCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-inner">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        <span className="text-xs font-bold text-emerald-400 tracking-widest uppercase">Live Analytics</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col xl:flex-row divide-y xl:divide-y-0 xl:divide-x divide-slate-100">

                {/* Staffing Insight Section */}
                <div className="flex-1 p-6 lg:p-8 bg-white/50">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">Labor Demand Plan <InfoTip text="Shows how many staff members the AI recommends for each day, broken down by role. Based on your store's customers-per-staff ratio and predicted traffic volume." /></h3>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staffing Levels</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-blue-600 bg-blue-50/50 px-3 py-1.5 rounded-lg border border-blue-100 shadow-sm">{staffing.length} Day Horizon</span>
                    </div>

                    {/* Summary row */}
                    {staffing.length > 0 && (
                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 text-center">
                                <div className="text-xl font-black text-blue-700 tabular-nums">{avgStaff.toFixed(1)}</div>
                                <div className="text-[9px] font-black text-blue-500 uppercase tracking-wider mt-0.5">Avg Staff/Day</div>
                            </div>
                            <div className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-100 text-center">
                                <div className="text-xl font-black text-indigo-700 tabular-nums">{highTrafficDays}</div>
                                <div className="text-[9px] font-black text-indigo-500 uppercase tracking-wider mt-0.5">High Traffic Days</div>
                            </div>
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                                <div className="text-xl font-black text-slate-700 tabular-nums">₹{(totalLaborCost / staffing.length).toFixed(0)}</div>
                                <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider mt-0.5">Avg Cost/Day</div>
                            </div>
                        </div>
                    )}

                    {staffing.length > 0 ? (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                            {staffing.map((day, idx) => {
                                const isPeak = day.date === peakStaffingDay.date;
                                return (
                                    <div key={idx} className={`relative flex flex-col p-4 rounded-2xl border transition-all duration-300 ${isPeak ? 'bg-indigo-50/40 border-indigo-200 shadow-lg shadow-indigo-500/5' : 'bg-slate-50/30 border-slate-100 hover:border-slate-200 hover:bg-white hover:shadow-md'}`}>
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <div className="font-display font-black text-slate-900 text-lg tracking-tight">
                                                        {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                                                    </div>
                                                    {isPeak && <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest shadow-md">Peak</span>}
                                                    {day.is_high_traffic && !isPeak && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest">High Traffic</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 font-bold mt-0.5 uppercase tracking-tight">
                                                    Forecast: {Math.round(day.predicted_visits)} visitors
                                                    {day.upper_bound_visits !== undefined && (
                                                        <span className="text-slate-400 ml-1">(up to {Math.round(day.upper_bound_visits)})</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-2xl font-black tracking-tighter tabular-nums ${isPeak ? 'text-indigo-600' : 'text-slate-800'}`}>
                                                    {day.recommended_staff}
                                                </div>
                                                <div className="text-[9px] text-slate-500 uppercase tracking-widest font-black">Headcount</div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                                            <div className="flex flex-wrap gap-1.5">
                                                {Object.entries(day.role_breakdown || {}).map(([role, count]) => (
                                                    <div key={role} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
                                                        <span className={`w-2 h-2 rounded-full ${role.includes('billing') ? 'bg-emerald-500' : role.includes('supervisor') ? 'bg-purple-500' : 'bg-indigo-500'}`}></span>
                                                        <span className="tabular-nums">{count}</span>
                                                        <span className="text-slate-400 font-medium">{formatRole(role)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-400 tabular-nums whitespace-nowrap ml-2">₹{day.labor_cost_estimate.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border border-slate-100 border-dashed">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <p className="text-sm font-bold text-slate-500">Insufficient analytics for labor demand.</p>
                        </div>
                    )}
                </div>

                {/* Inventory Insight Section */}
                <div className="flex-1 p-6 lg:p-8 bg-slate-50/30">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl border border-red-100 shadow-sm">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-1.5">Inventory Supply Risk <InfoTip text="Identifies days when product categories are at risk of running out. The AI uses the upper-bound demand forecast (worst-case scenario) to ensure you're prepared for peak customer volumes." /></h3>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ML Projections</p>
                            </div>
                        </div>
                        {highRiskInventoryDays.length > 0 && (
                            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 shadow-sm">{highRiskInventoryDays.length} Active Risks</span>
                        )}
                    </div>

                    {/* Category risk summary */}
                    {Object.keys(categoryStatusMap).length > 0 && (
                        <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-3 flex items-center gap-1.5">Category Risk Overview (Full Horizon) <InfoTip text="A summary of the highest severity status for each product category across all forecast days. Helps you quickly see which categories need attention." /></div>
                            <div className="grid grid-cols-2 gap-2">
                                {Object.entries(categoryStatusMap).map(([cat, info]) => {
                                    const p = priorityLabel(info.worst);
                                    return (
                                        <div key={cat} className={`flex items-center justify-between p-2.5 rounded-lg border ${p.bg} text-xs`}>
                                            <span className="font-semibold text-slate-600 capitalize">{cat.replace(/_/g, ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                {info.days > 0 && <span className="text-[9px] font-bold text-slate-400 tabular-nums">{info.days}d</span>}
                                                <span className={`font-black uppercase tracking-wide text-[9px] ${p.color}`}>{p.label}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {highRiskInventoryDays.length > 0 ? (
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                            {highRiskInventoryDays.map((day, idx) => {
                                const isHigh = day.stockout_risk === 'high';
                                return (
                                    <div key={idx} className={`relative flex flex-col p-4 rounded-2xl border shadow-lg shadow-slate-200/50 ${isHigh ? 'bg-white border-red-200 border-l-4 border-l-red-500' : 'bg-white border-amber-200 border-l-4 border-l-amber-500'}`}>
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-display font-black text-slate-900 text-lg">
                                                {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${isHigh ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {isHigh ? 'Critical Stock Risk' : 'Elevated Variance'}
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-700 font-bold mb-3 flex items-start gap-2">
                                            <svg className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>{day.reasoning || "Prioritize restocking high-velocity items immediately."}</span>
                                        </p>

                                        {/* Sales projections */}
                                        <div className="flex gap-3 mb-3">
                                            <div className="flex-1 p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                                                <div className="text-lg font-black text-slate-800 tabular-nums">{day.estimated_daily_sales}</div>
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Est. Sales</div>
                                            </div>
                                            {day.upper_sales_potential !== undefined && (
                                                <div className={`flex-1 p-2 rounded-lg border text-center ${isHigh ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                                                    <div className={`text-lg font-black tabular-nums ${isHigh ? 'text-red-700' : 'text-amber-700'}`}>{day.upper_sales_potential}</div>
                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-wider">Peak Demand</div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1.5">
                                            {Object.entries(day.inventory_priorities || {})
                                                .filter(([_, status]) => status !== 'normal')
                                                .map(([category, status]) => {
                                                    const p = priorityLabel(status);
                                                    return (
                                                        <div key={category} className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-bold ${p.bg}`}>
                                                            <span className="text-slate-600 capitalize">{category.replace(/_/g, ' ')}</span>
                                                            <span className={`uppercase tracking-wider text-[10px] ${p.color}`}>{p.label}</span>
                                                        </div>
                                                    );
                                                })}
                                        </div>

                                        {day.recommended_action && (
                                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2">
                                                <div className="mt-0.5 p-1 bg-blue-50 rounded shadow-sm">
                                                    <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                                </div>
                                                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-tight">
                                                    Action: {day.recommended_action}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center p-8 bg-white rounded-2xl border border-emerald-100 shadow-sm text-center">
                            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow-sm">
                                <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h4 className="text-xl font-bold text-emerald-800 mb-2">Supply Optimized</h4>
                            <p className="text-sm text-emerald-600 font-bold max-w-[250px] leading-relaxed">Inventory levels are within 1.5σ of predicted upper-bound demand across all categories.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}

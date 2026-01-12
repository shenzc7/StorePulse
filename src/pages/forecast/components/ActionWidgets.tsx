import React from 'react';
import { formatIndianNumber } from '../../../src/lib/api';

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
}

interface ActionWidgetsProps {
    staffing: StaffingRecommendation[];
    inventory: InventoryAlert[];
}

export function ActionWidgets({ staffing, inventory }: ActionWidgetsProps) {
    const highRiskItems = inventory.filter(i => i.stockout_risk === 'high' || i.stockout_risk === 'medium');

    const formatRole = (role: string) => role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            {/* Staffing Widget */}
            <div className="card border border-border bg-white shadow-sm flex flex-col">
                <div className="p-5 border-b border-border flex items-center justify-between bg-surface-50/30">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                            <h3 className="font-bold text-ink-900">ML Shift Plan</h3>
                            <p className="text-xs text-ink-500 text-uppercase font-black tracking-tighter">Capacity matched to demand bounds</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {staffing.slice(0, 5).map((row: any, i) => (
                        <div key={i} className="p-4 rounded-lg border border-border bg-surface-50/50 hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="text-center w-12 bg-white rounded border border-border p-1 shadow-sm">
                                        <div className="text-[10px] text-ink-500 uppercase font-bold">{new Date(row.date).toLocaleString('en-IN', { month: 'short' })}</div>
                                        <div className="text-lg font-black text-ink-900 leading-none">{new Date(row.date).getDate()}</div>
                                    </div>
                                    <div>
                                        <div className="font-bold text-ink-900">{new Date(row.date).toLocaleDateString('en-IN', { weekday: 'long' })}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] bg-ink-200 text-ink-700 px-1.5 py-0.5 rounded font-bold uppercase">Forecast: {Math.round(row.predicted_visits)}</span>
                                            {row.recommended_staff > row.predicted_visits / 45 && (
                                                <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">+Risk Buffer</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-black text-accent-600">{row.recommended_staff}</div>
                                    <div className="text-[10px] uppercase font-bold text-accent-700 tracking-wide">Staff</div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-3 border-t border-border/50">
                                {Object.entries(row.role_breakdown || {}).map(([role, count]: any) => (
                                    <div key={role} className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-border text-xs text-ink-700 shadow-sm">
                                        <span className={`w-2 h-2 rounded-full ${role.includes('billing') ? 'bg-green-500' :
                                            role.includes('supervisor') ? 'bg-purple-500' : 'bg-blue-500'
                                            }`}></span>
                                        <span className="font-semibold">{count}</span> {formatRole(role)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Inventory Widget */}
            <div className="card border border-border bg-white shadow-sm flex flex-col">
                <div className="p-5 border-b border-border flex items-center justify-between bg-surface-50/30">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                        <div>
                            <h3 className="font-bold text-ink-900">Stockout Risk (ML-Driven)</h3>
                            <p className="text-xs text-ink-500">Based on Upper-Bound Demand Sprints</p>
                        </div>
                    </div>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-3">
                    {highRiskItems.length > 0 ? (
                        highRiskItems.slice(0, 5).map((item: any, i: number) => (
                            <div key={i} className="p-4 rounded-lg bg-red-50/30 border border-red-100 hover:border-red-200 transition-colors">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-bold text-ink-900 capitalize">
                                            {new Date(item.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric' })}
                                        </h4>
                                        <p className="text-[10px] text-ink-500 font-bold uppercase tracking-tight">{item.reasoning}</p>
                                    </div>
                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${item.stockout_risk === 'high'
                                        ? 'bg-red-100 text-red-700 border-red-200 shadow-sm'
                                        : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                        }`}>
                                        {item.stockout_risk} Risk
                                    </span>
                                </div>
                                <div className="space-y-2 mt-3">
                                    {Object.entries(item.inventory_priorities)
                                        .filter(([_, status]) => status !== 'normal' && status !== 'monitor')
                                        .map(([category, status]: any) => (
                                            <div key={category} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-red-100">
                                                <span className="font-medium text-ink-800 capitalize">{category.replace('_', ' ')}</span>
                                                <span className="text-xs font-bold text-red-600 uppercase tracking-wide">{status.replace('_', ' ')}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-60">
                            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mb-3">
                                <svg className="w-8 h-8 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="font-medium text-ink-900">Inventory Limits Secure</p>
                            <p className="text-sm text-ink-500">Normal traffic expected</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

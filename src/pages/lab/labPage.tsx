import { useState, useEffect } from 'react';
import { apiGet, apiPost, type ApiError, formatIndianNumber } from '../../src/lib/api';

// Types for What-If analysis
interface ScenarioConfig {
  name: string;
  description: string;
  promo_boost: number;
  weather_impact: string;
  holiday_effect: boolean;
  payday_shift: boolean;
  price_sensitivity: number;
  competitor_action: string;
}

interface ForecastDelta {
  date: string;
  baseline_visits: number;
  scenario_visits: number;
  delta: number;
  delta_pct: number;
}

interface ImpactSummary {
  avg_visit_delta_pct: number;
  total_visit_delta: number;
  max_daily_impact: number;
  scenario_strength: string;
}

interface ScenarioResult {
  scenario_name: string;
  forecast_delta: ForecastDelta[];
  impact_summary: ImpactSummary;
  staffing_impact: Record<string, number>;
  inventory_impact: Array<{ sku: string; name: string; delta: number }>;
}


export function LabPage() {
  // State
  const [mode] = useState<'pro'>('pro'); // Hardcoded to pro mode per rules
  const [horizonDays, setHorizonDays] = useState(14);
  const [baselineDate, setBaselineDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  // Quick scenarios from API
  const [quickScenarios, setQuickScenarios] = useState<ScenarioConfig[]>([]);

  // Selected scenario
  const [, setSelectedScenario] = useState<ScenarioConfig | null>(null);

  // Analysis results
  const [results, setResults] = useState<ScenarioResult[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quick scenarios on mount
  useEffect(() => {
    fetchQuickScenarios();
  }, []);

  const fetchQuickScenarios = async () => {
    try {
      const data = await apiGet<{ quick_scenarios: ScenarioConfig[] }>('/api/whatif/quick-scenarios');
      setQuickScenarios(data.quick_scenarios);
    } catch (err) {
      console.error('Failed to load quick scenarios:', err);
    }
  };


  const analyzeScenario = async (scenario: ScenarioConfig) => {
    setAnalyzing(true);
    setError(null);
    setResults([]);

    try {
      const payload = {
        baseline_date: baselineDate,
        horizon_days: horizonDays,
        mode,
        scenarios: [scenario],
      };

      const data = await apiPost<{ scenarios: ScenarioResult[] }>('/api/whatif/analyze', payload);
      setResults(data.scenarios);
      setSelectedScenario(scenario);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message || 'Analysis failed. Ensure you have trained a model first.');
    } finally {
      setAnalyzing(false);
    }
  };


  const getStrengthBadge = (strength: string) => {
    switch (strength) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <header className="section-header">
        <div>
          <h1 className="section-title">What-If Planner</h1>
          <p className="section-description">
            Simulate business scenarios to predict their impact on future footfall and operations.
          </p>
        </div>
      </header>

      {/* Configuration Panel */}
      <div className="bg-white rounded-3xl border border-border shadow-sm p-8 flex flex-col md:flex-row gap-10">
        <div className="flex-1">
          <label className="flex items-center gap-2 text-sm font-bold text-ink-900 mb-1">
            <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            Baseline Date
          </label>
          <p className="text-xs text-ink-500 mb-4">The forecasting pivot point</p>
          <input
            type="date"
            value={baselineDate}
            onChange={(e) => setBaselineDate(e.target.value)}
            className="w-full xl:w-2/3 px-4 py-3 bg-surface-50 border border-border rounded-xl shadow-inner text-sm font-medium text-ink-900 transition-all focus:bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none hover:border-ink-300 cursor-pointer"
          />
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between mb-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-bold text-ink-900 mb-1">
                <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                Forecast Horizon
              </label>
              <p className="text-xs text-ink-500">Days to simulate forward</p>
            </div>
            <div className="flex gap-1.5">
              {[7, 14, 30].map(days => (
                <button
                  key={days}
                  onClick={() => setHorizonDays(days)}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${horizonDays === days
                    ? 'bg-ink-900 text-white shadow-sm'
                    : 'bg-surface-100 text-ink-600 hover:bg-surface-200 hover:text-ink-900'
                    }`}
                >
                  {days}D
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 bg-surface-50 p-3.5 border border-border/60 rounded-xl shadow-inner group transition-colors hover:border-ink-300 hover:bg-white">
            <input
              type="range"
              min={7}
              max={30}
              step={1}
              value={horizonDays}
              onChange={(e) => setHorizonDays(parseInt(e.target.value))}
              className="flex-1 h-2 bg-surface-200 rounded-lg appearance-none cursor-pointer accent-ink-900"
            />
            <div className="text-right min-w-[4.5rem]">
              <span className="text-lg font-black text-ink-900 leading-none">{horizonDays}</span>
              <span className="text-xs font-bold text-ink-400 ml-1">Days</span>
            </div>
          </div>
        </div>
      </div>


      {/* Quick Scenarios (Preset) */}
      <h2 className="text-sm font-bold uppercase tracking-wider text-ink-500 mt-10 mb-5 px-1">Scenario Presets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {quickScenarios.map((scenario, index) => (
          <div
            key={index}
            className="group relative bg-white border border-border/80 rounded-2xl p-6 hover:border-ink-300 hover:shadow-xl hover:shadow-ink-900/5 transition-all cursor-pointer overflow-hidden flex flex-col"
            onClick={() => analyzeScenario(scenario)}
          >
            {/* Background accent on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface-50/0 to-surface-50/0 group-hover:from-surface-50 group-hover:to-white transition-colors duration-500" />

            <div className="relative z-10 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-surface-100 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-border/50 flex items-center justify-center transition-all text-ink-600 group-hover:text-ink-900">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-ink-300 group-hover:text-ink-900 group-hover:bg-surface-100 transition-colors">
                  <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-base font-bold text-ink-900 mb-1.5">{scenario.name}</h3>
              <p className="text-xs text-ink-500 leading-relaxed font-medium group-hover:text-ink-600 transition-colors">{scenario.description}</p>
            </div>

            {/* Active effect indicator line */}
            <div className="relative z-10 mt-5 h-1 w-0 group-hover:w-full bg-ink-900 rounded-full transition-all duration-500 ease-out" />
          </div>
        ))}
      </div>


      {/* Error */}
      {error && (
        <div className="card p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-900">Analysis Failed</p>
              <p className="text-sm text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {analyzing && (
        <div className="card p-8 flex flex-col items-center justify-center">
          <div className="spinner mb-4"></div>
          <p className="text-sm text-ink-600">Running scenario analysis...</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && !analyzing && (
        <div className="space-y-6">
          {results.map((result, index) => (
            <div key={index} className="space-y-6">
              {/* Impact Summary */}
              <div className="card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-ink-900">{result.scenario_name}</h2>
                    <p className="text-sm text-ink-600">Impact Analysis Results</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-5 bg-white rounded-2xl border border-border shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Avg Impact</p>
                    <div className="flex items-end gap-2">
                      <p className={`text-3xl font-black tracking-tight ${result.impact_summary.avg_visit_delta_pct >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {result.impact_summary.avg_visit_delta_pct > 0 ? '+' : ''}{result.impact_summary.avg_visit_delta_pct.toFixed(1)}%
                      </p>
                      {result.impact_summary.avg_visit_delta_pct !== 0 && (
                        <svg className={`w-5 h-5 mb-1 ${result.impact_summary.avg_visit_delta_pct > 0 ? 'text-green-500' : 'text-red-500 rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                      )}
                    </div>
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-border shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Total Delta</p>
                    <p className={`text-3xl font-black tracking-tight ${result.impact_summary.total_visit_delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {result.impact_summary.total_visit_delta > 0 ? '+' : ''}{formatIndianNumber(result.impact_summary.total_visit_delta)}
                    </p>
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-border shadow-sm flex flex-col justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Peak Daily Shift</p>
                    <p className="text-3xl font-black tracking-tight text-ink-900">
                      ±{formatIndianNumber(result.impact_summary.max_daily_impact)}
                    </p>
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-border shadow-sm flex flex-col justify-between items-start">
                    <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Confidence Signal</p>
                    <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide shadow-sm ${getStrengthBadge(result.impact_summary.scenario_strength)}`}>
                      {result.impact_summary.scenario_strength.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Calendar Heatmap for Daily Delta */}
              <div className="card p-8 border-transparent shadow-lg bg-white">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-ink-900 tracking-tight">Timeline Heatmap</h3>
                    <p className="text-sm text-ink-500 mt-1">Intensity implies deviation from baseline</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-ink-500 uppercase tracking-wider bg-surface-50 px-3 py-2 rounded-lg">
                    <span>Loss</span>
                    <div className="w-24 h-2 rounded-full bg-gradient-to-r from-red-500 via-surface-200 to-green-500"></div>
                    <span>Gain</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                  {result.forecast_delta.map((day, i) => {
                    const isGain = day.delta >= 0;
                    const intensity = Math.min(Math.abs(day.delta_pct) / 30, 1); // Max intensity at 30% diff

                    // Generate dynamic background based on intensity
                    const bgClass = isGain
                      ? `rgba(34, 197, 94, ${0.1 + (intensity * 0.9)})` // Green scale
                      : `rgba(239, 68, 68, ${0.1 + (intensity * 0.9)})`; // Red scale

                    const textClass = intensity > 0.4 ? 'text-white' : 'text-ink-900';
                    const subtextClass = intensity > 0.4 ? 'text-white/80' : 'text-ink-500';

                    return (
                      <div
                        key={day.date}
                        className="relative p-4 rounded-xl flex flex-col justify-between h-28 transform hover:scale-105 transition-transform cursor-default shadow-sm border border-border/30"
                        style={{ backgroundColor: bgClass }}
                      >
                        <div className="flex justify-between items-start">
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${subtextClass}`}>
                            {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}
                          </span>
                          <span className={`text-[10px] font-bold ${subtextClass}`}>
                            {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                          </span>
                        </div>

                        <div className="mt-auto">
                          <div className={`text-2xl font-black tracking-tighter ${textClass}`}>
                            {isGain ? '+' : ''}{Math.round(day.delta)}
                          </div>
                          <div className={`text-xs font-bold ${subtextClass}`}>
                            ({isGain ? '+' : ''}{day.delta_pct.toFixed(1)}%)
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Actionable Insights */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Staffing */}
                <div className="card p-6 border-transparent shadow-lg bg-gradient-to-br from-white to-blue-50/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-100 rounded-xl">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-ink-900 leading-tight">Staffing Adjustments</h3>
                      <p className="text-xs text-ink-500">Peak shift coverage recommendations</p>
                    </div>
                  </div>

                  {Object.keys(result.staffing_impact).length > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(result.staffing_impact).map(([role, delta]) => (
                        <div key={role} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-border/50 hover:border-blue-200 transition-colors">
                          <span className="text-sm font-bold text-ink-800 capitalize flex items-center gap-2">
                            {role.replace('_', ' ')}
                            {delta > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Needs Cover</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-800">Overscheduled</span>
                            )}
                          </span>
                          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg ${delta >= 0 ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                            <span className="text-sm font-black">{delta > 0 ? '+' : ''}{delta}</span>
                            <span className="text-xs font-semibold opacity-80">Shifts</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-surface-50 rounded-xl border border-dashed border-border text-center">
                      <p className="text-sm text-ink-600 font-medium">No significant staffing changes required.</p>
                      <p className="text-xs text-ink-400 mt-1">Current team can absorb the variance.</p>
                    </div>
                  )}
                </div>

                {/* Inventory */}
                <div className="card p-6 border-transparent shadow-lg bg-gradient-to-br from-white to-amber-50/30">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-amber-100 rounded-xl">
                      <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-ink-900 leading-tight">Inventory Risk Profile</h3>
                      <p className="text-xs text-ink-500">Top SKUs affected by this scenario</p>
                    </div>
                  </div>

                  {result.inventory_impact.length > 0 ? (
                    <div className="space-y-3">
                      {result.inventory_impact.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-border/50 hover:border-amber-200 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-8 rounded-full ${Math.abs(item.delta) > 50 ? 'bg-red-500' : 'bg-amber-400'}`}></div>
                            <div>
                              <p className="text-sm font-bold text-ink-800 line-clamp-1">{item.name || item.sku}</p>
                              {item.delta > 0 ? (
                                <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mt-0.5">High Demand Risk</p>
                              ) : (
                                <p className="text-[10px] font-bold text-ink-500 uppercase tracking-widest mt-0.5">Surplus Warning</p>
                              )}
                            </div>
                          </div>
                          <p className={`text-base font-black ${item.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {item.delta > 0 ? '+' : ''}{item.delta}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 bg-surface-50 rounded-xl border border-dashed border-border text-center">
                      <p className="text-sm text-ink-600 font-medium">Standard inventory levels sufficient.</p>
                      <p className="text-xs text-ink-400 mt-1">Impact falls within normal operating buffers.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

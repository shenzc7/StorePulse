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
  const [mode, setMode] = useState<'lite' | 'pro'>('lite');
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
      <div className="card p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Baseline Date</label>
            <input
              type="date"
              value={baselineDate}
              onChange={(e) => setBaselineDate(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Forecast Horizon</label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={7}
                max={30}
                value={horizonDays}
                onChange={(e) => setHorizonDays(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-ink-900 w-16">{horizonDays} days</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-2">Model Mode</label>
            <div className="flex gap-2">
              {(['lite', 'pro'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${mode === m
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface-100 text-ink-700 hover:bg-surface-200'
                    }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Quick Scenarios (Preset) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickScenarios.map((scenario, index) => (
          <div
            key={index}
            className="card p-5 hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-200"
            onClick={() => analyzeScenario(scenario)}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-ink-900">{scenario.name}</h3>
                <p className="text-xs text-ink-600 mt-1">{scenario.description}</p>
              </div>
            </div>
            <button className="w-full mt-4 btn-secondary text-xs py-2">
              Analyze Impact
            </button>
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
                  <div className="p-4 bg-surface-50 rounded-lg border border-border">
                    <p className="text-xs uppercase text-ink-500 mb-1">Avg Impact</p>
                    <p className={`text-2xl font-black ${result.impact_summary.avg_visit_delta_pct >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {result.impact_summary.avg_visit_delta_pct > 0 ? '+' : ''}{result.impact_summary.avg_visit_delta_pct.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-lg border border-border">
                    <p className="text-xs uppercase text-ink-500 mb-1">Total Delta</p>
                    <p className="text-2xl font-black text-ink-900">
                      {result.impact_summary.total_visit_delta > 0 ? '+' : ''}{formatIndianNumber(result.impact_summary.total_visit_delta)}
                    </p>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-lg border border-border">
                    <p className="text-xs uppercase text-ink-500 mb-1">Max Daily</p>
                    <p className="text-2xl font-black text-ink-900">
                      {formatIndianNumber(result.impact_summary.max_daily_impact)}
                    </p>
                  </div>
                  <div className="p-4 bg-surface-50 rounded-lg border border-border">
                    <p className="text-xs uppercase text-ink-500 mb-1">Strength</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getStrengthBadge(result.impact_summary.scenario_strength)}`}>
                      {result.impact_summary.scenario_strength.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Forecast Delta */}
              <div className="card p-6">
                <h3 className="text-base font-bold text-ink-900 mb-4">Daily Forecast Comparison</h3>
                <div className="space-y-2">
                  {result.forecast_delta.map((day) => {
                    const maxVisits = Math.max(...result.forecast_delta.map(d => Math.max(d.baseline_visits, d.scenario_visits)));
                    const baselineWidth = (day.baseline_visits / maxVisits) * 100;
                    const scenarioWidth = (day.scenario_visits / maxVisits) * 100;

                    return (
                      <div key={day.date} className="grid grid-cols-12 gap-3 items-center">
                        <div className="col-span-2 text-sm text-ink-700">
                          {new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="col-span-8 space-y-1">
                          <div className="relative h-4 bg-surface-100 rounded">
                            <div
                              className="absolute top-0 left-0 h-full bg-ink-300 rounded"
                              style={{ width: `${baselineWidth}%` }}
                            />
                          </div>
                          <div className="relative h-4 bg-surface-100 rounded">
                            <div
                              className={`absolute top-0 left-0 h-full rounded ${day.delta >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${scenarioWidth}%` }}
                            />
                          </div>
                        </div>
                        <div className="col-span-2 text-right">
                          <span className={`text-sm font-semibold ${day.delta_pct >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {day.delta_pct > 0 ? '+' : ''}{day.delta_pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 pt-4 border-t flex items-center justify-center gap-6 text-xs text-ink-600">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-ink-300 rounded"></div>
                    <span>Baseline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Scenario (Gain)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Scenario (Loss)</span>
                  </div>
                </div>
              </div>

              {/* Staffing & Inventory Impact */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.keys(result.staffing_impact).length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-base font-bold text-ink-900 mb-4">Staffing Impact</h3>
                    <div className="space-y-3">
                      {Object.entries(result.staffing_impact).map(([role, delta]) => (
                        <div key={role} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                          <span className="text-sm font-medium text-ink-700 capitalize">{role.replace('_', ' ')}</span>
                          <span className={`text-sm font-bold ${delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {delta > 0 ? '+' : ''}{delta} staff
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.inventory_impact.length > 0 && (
                  <div className="card p-6">
                    <h3 className="text-base font-bold text-ink-900 mb-4">Inventory Impact</h3>
                    <div className="space-y-3">
                      {result.inventory_impact.slice(0, 5).map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                          <span className="text-sm font-medium text-ink-700">{item.name || item.sku}</span>
                          <span className={`text-sm font-bold ${item.delta >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                            {item.delta > 0 ? '+' : ''}{item.delta} units
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

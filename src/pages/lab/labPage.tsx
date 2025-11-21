import { useState, useEffect } from 'react';
import { apiGet, apiPost, formatIndianNumber } from '../../src/lib/api';

// --- Types matching Backend ---

interface ScenarioConfig {
  name: string;
  description?: string;
  promo_boost?: number;      // 0.0 to 1.0
  weather_impact?: 'normal' | 'rainy' | 'sunny';
  holiday_effect?: boolean;
  payday_shift?: boolean;
  price_sensitivity?: number; // -0.5 to 0.5
  competitor_action?: 'none' | 'promo' | 'new_store';
}

interface ScenarioResult {
  scenario_name: string;
  forecast_delta: Array<{
    date: string;
    baseline_visits: number;
    scenario_visits: number;
    delta: number;
    delta_pct: number;
  }>;
  impact_summary: {
    avg_visit_delta_pct: number;
    total_visit_delta: number;
    max_daily_impact: number;
    scenario_strength: string;
  };
  staffing_impact: Record<string, number>;
  inventory_impact: Array<{
    sku: string;
    name: string;
    delta: number;
  }>;
}

interface QuickScenarioResponse {
  quick_scenarios: ScenarioConfig[];
}

interface AnalysisResponse {
  scenarios: ScenarioResult[];
}

// --- Components ---

export function LabPage() {
  // State
  const [activeScenarios, setActiveScenarios] = useState<ScenarioConfig[]>([]);
  const [quickScenarios, setQuickScenarios] = useState<ScenarioConfig[]>([]);
  const [results, setResults] = useState<ScenarioResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Form State
  const [baselineDate, setBaselineDate] = useState(new Date().toISOString().split('T')[0]);
  const [horizonDays, setHorizonDays] = useState<7 | 14>(14);

  // Load Quick Scenarios on Mount
  useEffect(() => {
    loadQuickScenarios();
  }, []);

  const loadQuickScenarios = async () => {
    try {
      setLoading(true);
      const data = await apiGet<QuickScenarioResponse>('/api/whatif/quick-scenarios');
      if (data && data.quick_scenarios) {
        setQuickScenarios(data.quick_scenarios);
      }
    } catch (err) {
      console.error("Failed to load quick scenarios", err);
    } finally {
      setLoading(false);
    }
  };

  const addScenario = (scenario: ScenarioConfig) => {
    // Ensure unique name
    let name = scenario.name;
    let counter = 1;
    while (activeScenarios.some(s => s.name === name)) {
      name = `${scenario.name} (${counter++})`;
    }
    setActiveScenarios([...activeScenarios, { ...scenario, name }]);
    setResults(null); // Clear old results when config changes
  };

  const removeScenario = (index: number) => {
    const newScenarios = [...activeScenarios];
    newScenarios.splice(index, 1);
    setActiveScenarios(newScenarios);
    setResults(null);
  };

  const runAnalysis = async () => {
    if (activeScenarios.length === 0) return;

    try {
      setAnalyzing(true);
      const response = await apiPost<AnalysisResponse>('/api/whatif/analyze', {
        baseline_date: baselineDate,
        horizon_days: horizonDays,
        mode: 'pro', // Default to pro for best accuracy
        scenarios: activeScenarios
      });
      
      if (response && response.scenarios) {
        setResults(response.scenarios);
      }
    } catch (err) {
      console.error("Analysis failed", err);
      alert("Failed to run analysis. Please check backend.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <header className="section-header">
        <h1 className="section-title">What-If Planner</h1>
        <p className="section-description">
          Simulate business scenarios to predict their impact on future footfall and operations.
        </p>
      </header>

      {/* Configuration Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Scenario Builder */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Settings */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink-900 mb-4 uppercase tracking-wide">Analysis Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={baselineDate}
                  onChange={(e) => setBaselineDate(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Forecast Horizon</label>
                <div className="flex bg-surface-100 p-1 rounded-lg border border-border">
                  <button 
                    onClick={() => setHorizonDays(7)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded ${horizonDays === 7 ? 'bg-white shadow-sm text-primary-700' : 'text-ink-500'}`}
                  >
                    7 Days
                  </button>
                  <button 
                    onClick={() => setHorizonDays(14)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded ${horizonDays === 14 ? 'bg-white shadow-sm text-primary-700' : 'text-ink-500'}`}
                  >
                    14 Days
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Templates */}
          <div className="card p-5">
            <h3 className="text-sm font-bold text-ink-900 mb-4 uppercase tracking-wide">Quick Scenarios</h3>
            {loading ? (
              <div className="text-center py-4 text-ink-400 text-xs">Loading templates...</div>
            ) : (
              <div className="space-y-2">
                {quickScenarios.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => addScenario(template)}
                    className="w-full text-left p-3 rounded-lg border border-border hover:border-primary-300 hover:bg-primary-50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink-700 group-hover:text-primary-700">{template.name}</span>
                      <svg className="w-4 h-4 text-ink-400 group-hover:text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">{template.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Custom Builder (Simplified) */}
          <div className="card p-5 bg-surface-50 border-dashed">
            <div className="text-center">
              <p className="text-sm font-medium text-ink-600 mb-2">Custom Scenario?</p>
              <p className="text-xs text-ink-500 mb-4">Combine weather, price, and promo factors.</p>
              <button 
                className="btn-secondary w-full text-xs"
                onClick={() => addScenario({
                  name: "Custom Experiment",
                  description: "User defined scenario",
                  promo_boost: 0.1,
                  weather_impact: 'normal'
                })}
              >
                Create Custom
              </button>
            </div>
          </div>

        </div>

        {/* Right: Active Scenarios & Results */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active List */}
          <div className="card p-6 min-h-[200px]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-ink-900">Active Experiments</h2>
              <button 
                onClick={runAnalysis}
                disabled={activeScenarios.length === 0 || analyzing}
                className={`btn-primary ${analyzing ? 'opacity-75 cursor-wait' : ''}`}
              >
                {analyzing ? (
                  <>
                    <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Running Simulation...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Simulation
                  </>
                )}
              </button>
            </div>

            {activeScenarios.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg bg-surface-50">
                <svg className="w-12 h-12 mx-auto text-ink-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <p className="text-ink-500 font-medium">No scenarios added yet</p>
                <p className="text-xs text-ink-400 mt-1">Select a Quick Scenario template from the left to get started.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeScenarios.map((scenario, idx) => (
                  <div key={idx} className="relative p-4 bg-white border border-border rounded-lg shadow-sm group hover:border-primary-200 transition-all">
                    <button 
                      onClick={() => removeScenario(idx)}
                      className="absolute top-2 right-2 text-ink-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                        S{idx + 1}
                      </div>
                      <h3 className="font-bold text-ink-900">{scenario.name}</h3>
                    </div>
                    <div className="space-y-1">
                      {scenario.promo_boost && scenario.promo_boost > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mr-2">
                          Promo +{(scenario.promo_boost * 100).toFixed(0)}%
                        </span>
                      )}
                      {scenario.weather_impact && scenario.weather_impact !== 'normal' && (
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mr-2 ${
                          scenario.weather_impact === 'sunny' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {scenario.weather_impact === 'sunny' ? '☀️ Sunny' : '🌧️ Rainy'}
                        </span>
                      )}
                      {scenario.competitor_action === 'new_store' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 mr-2">
                          Competitor Entry
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Results View */}
          {results && (
            <div className="space-y-6 animate-fade-in">
              
              {/* Impact Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {results.map((res, idx) => {
                   const isPositive = res.impact_summary.avg_visit_delta_pct >= 0;
                   return (
                    <div key={idx} className={`card p-5 border-l-4 ${isPositive ? 'border-l-green-500' : 'border-l-red-500'}`}>
                      <div className="text-xs uppercase font-bold text-ink-500 mb-1">
                        Scenario {idx + 1}: {res.scenario_name}
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className={`text-2xl font-black ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
                          {isPositive ? '+' : ''}{res.impact_summary.avg_visit_delta_pct}%
                        </span>
                        <span className="text-sm text-ink-600">traffic impact</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-border text-xs text-ink-600 space-y-1">
                        <div className="flex justify-between">
                          <span>Total Visitor Delta:</span>
                          <span className="font-semibold">{isPositive ? '+' : ''}{formatIndianNumber(Math.round(res.impact_summary.total_visit_delta))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Est. Revenue Impact:</span>
                          <span className="font-semibold">₹{formatIndianNumber(Math.round(res.impact_summary.total_visit_delta * 150))}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Comparison Visualizer (Simple CSS Chart) */}
              <div className="card p-6">
                <h3 className="text-sm font-bold text-ink-900 mb-6">Forecast Comparison</h3>
                
                <div className="relative h-64 w-full flex items-end gap-2">
                  {/* Y-Axis Lines */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[100, 75, 50, 25, 0].map((pct) => (
                      <div key={pct} className="w-full border-t border-dashed border-gray-200 h-0 relative">
                        <span className="absolute -top-2.5 -left-8 text-xs text-ink-400 w-6 text-right">{pct}%</span>
                      </div>
                    ))}
                  </div>

                  {/* Plotting Bars (Simplified - ideally this would be SVG Lines) */}
                  {/* Since we don't have a charting lib, we'll visualize the DELTAS as bars relative to baseline */}
                  {results[0].forecast_delta.map((day, dayIdx) => {
                    // Find max visits to normalize height
                    const maxVisits = Math.max(
                      day.baseline_visits, 
                      ...results.map(r => r.forecast_delta[dayIdx].scenario_visits)
                    ) * 1.2; // 20% buffer

                    return (
                      <div key={dayIdx} className="flex-1 flex flex-col justify-end h-full relative group">
                        {/* Hover Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-48 bg-ink-900 text-white text-xs p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                          <div className="font-bold mb-1">{new Date(day.date).toLocaleDateString('en-IN', {weekday:'short', day:'numeric'})}</div>
                          <div>Baseline: {Math.round(day.baseline_visits)}</div>
                          {results.map((r, i) => (
                            <div key={i} className={i === 0 ? 'text-blue-300' : 'text-orange-300'}>
                              {r.scenario_name}: {Math.round(r.forecast_delta[dayIdx].scenario_visits)} ({r.forecast_delta[dayIdx].delta_pct > 0 ? '+' : ''}{r.forecast_delta[dayIdx].delta_pct}%)
                            </div>
                          ))}
                        </div>

                        {/* Bars */}
                        <div className="relative w-full flex items-end justify-center gap-1 h-full px-0.5">
                          {/* Baseline (Grey) */}
                          <div 
                            className="w-1.5 bg-gray-300 rounded-t opacity-50"
                            style={{ height: `${(day.baseline_visits / maxVisits) * 100}%` }}
                          ></div>
                          
                          {/* Scenarios */}
                          {results.map((r, rIdx) => (
                            <div 
                              key={rIdx}
                              className={`w-1.5 rounded-t transition-all ${rIdx === 0 ? 'bg-blue-500' : 'bg-orange-500'}`}
                              style={{ height: `${(r.forecast_delta[dayIdx].scenario_visits / maxVisits) * 100}%` }}
                            ></div>
                          ))}
                        </div>
                        
                        {/* X-Axis Label */}
                        <div className="mt-2 text-[10px] text-ink-500 text-center truncate w-full">
                          {new Date(day.date).getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-center mt-4 gap-6 text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                    <span className="text-ink-600">Baseline</span>
                  </div>
                  {results.map((r, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded ${i === 0 ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                      <span className="text-ink-600">{r.scenario_name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operational Impact Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Staffing Changes */}
                <div className="card p-5">
                   <h4 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
                     <svg className="w-4 h-4 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                     </svg>
                     Staffing Adjustments
                   </h4>
                   <div className="space-y-3">
                     {results.map((r, i) => (
                       <div key={i} className="bg-surface-50 p-3 rounded border border-border">
                         <div className="font-medium text-sm text-ink-900 mb-2">{r.scenario_name}</div>
                         {Object.keys(r.staffing_impact).length > 0 ? (
                           <div className="space-y-1">
                             {Object.entries(r.staffing_impact).map(([role, delta]) => (
                               <div key={role} className="flex justify-between text-xs">
                                 <span className="capitalize text-ink-600">{role.replace('_', ' ')}</span>
                                 <span className={`font-bold ${delta > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                   {delta > 0 ? '+' : ''}{delta} staff
                                 </span>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="text-xs text-ink-500 italic">No significant staffing changes required.</div>
                         )}
                       </div>
                     ))}
                   </div>
                </div>

                {/* Inventory Impact */}
                <div className="card p-5">
                   <h4 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
                     <svg className="w-4 h-4 text-ink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                     </svg>
                     Inventory Implications
                   </h4>
                   <div className="space-y-3">
                     {results.map((r, i) => (
                       <div key={i} className="bg-surface-50 p-3 rounded border border-border">
                         <div className="font-medium text-sm text-ink-900 mb-2">{r.scenario_name}</div>
                         {r.inventory_impact && r.inventory_impact.length > 0 ? (
                           <div className="space-y-1">
                             {r.inventory_impact.map((item, idx) => (
                               <div key={idx} className="flex justify-between text-xs">
                                 <span className="text-ink-600 truncate pr-4" title={item.name}>{item.name}</span>
                                 <span className={`font-bold whitespace-nowrap ${item.delta > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                   {item.delta > 0 ? '+' : ''}{item.delta} units
                                 </span>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <div className="text-xs text-ink-500 italic">No major inventory shifts.</div>
                         )}
                       </div>
                     ))}
                   </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

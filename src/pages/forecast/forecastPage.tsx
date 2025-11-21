import { useState, useEffect } from 'react';
import { apiGet, type ApiError, formatIndianNumber } from '../../src/lib/api';

interface Prediction {
  date: string;
  predicted_visits: number;
  lower_bound: number;
  upper_bound: number;
  day_of_week: string;
  is_weekend: boolean;
  is_holiday: boolean;
  is_payday: boolean;
  weather: string;
  promo_type: string;
  confidence_level: string;
}

interface StaffingRecommendation {
  date: string;
  predicted_visits: number;
  recommended_staff: number;
  role_breakdown: Record<string, number>;
  labor_cost_estimate: number;
  is_high_traffic: boolean;
}

interface InventoryAlert {
  date: string;
  estimated_daily_sales: number;
  inventory_priorities: Record<string, string>;
  stockout_risk: string;
  recommended_action: string;
}

interface ForecastMetadata {
  trained_at?: string;
  trained_records?: number;
  data_records?: number;
  data_range?: {
    min?: string | null;
    max?: string | null;
  };
  warnings?: string[];
  data_freshness?: {
    is_stale?: boolean;
    reason?: string | null;
  };
}

interface ForecastResponse {
  status: string;
  model_type?: string;
  forecast_horizon_days?: number;
  predictions?: Prediction[];
  staffing_recommendations?: StaffingRecommendation[];
  inventory_alerts?: InventoryAlert[];
  generated_at: string;
  message?: string;
  mode_requested?: string;
  mode_used?: string;
  metadata?: ForecastMetadata;
  cache_hit?: boolean;
  recommendations?: {
    staffing: string;
    inventory: string;
    next_steps: string[];
  };
}

interface TrendInsight {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  impact: string;
  action: string;
}

export function ForecastPage() {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedView, setSelectedView] = useState<'overview' | 'daily' | 'insights'>('overview');
  const [mode, setMode] = useState<'lite' | 'pro'>('lite');

  useEffect(() => {
    fetchForecasts(mode);
    const refreshInterval = setInterval(() => {
      fetchForecasts(mode);
    }, 2 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [mode]);

  const fetchForecasts = async (requestedMode: 'lite' | 'pro' = mode) => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<ForecastResponse>(`/api/forecast/?mode=${requestedMode}`);
      setForecastData(data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching forecasts:', err);
      const apiError = err as ApiError;
      setError(apiError.message || 'Unable to load forecasts');
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = (nextMode: 'lite' | 'pro') => {
    if (nextMode !== mode) {
      setMode(nextMode);
    }
  };

  if (loading && !forecastData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="section-header">
          <h1 className="section-title">Demand Forecasts</h1>
          <p className="section-description">Analyzing your data with NB-INGARCH model...</p>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="spinner mb-4"></div>
          <p className="text-sm text-ink-600">Computing predictions from your uploaded data...</p>
        </div>
      </div>
    );
  }

  if (error || !forecastData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="section-header">
          <h1 className="section-title">Demand Forecasts</h1>
          <p className="section-description">Predictions from NB-INGARCH model</p>
        </div>
        <div className="card p-6 border-danger-200 bg-danger-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-danger-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-danger-900">Unable to Load Predictions</p>
              <p className="text-sm text-danger-700 mt-0.5">{error || 'An error occurred while loading forecasts.'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (forecastData.status === 'no_models' || forecastData.status === 'no_model') {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="section-header">
          <h1 className="section-title">Demand Forecasts</h1>
          <p className="section-description">Statistical forecasting ready to deploy</p>
        </div>
        <div className="card p-6 border-blue-200 bg-blue-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">No Trained Model Available</p>
              <p className="text-sm text-blue-700 mt-2">
                {forecastData.message || 'Train the NB-INGARCH model to generate forecasts.'}
              </p>
              <div className="mt-4 space-y-2">
                <p className="text-xs font-semibold text-blue-900 uppercase tracking-wide">Required Steps:</p>
                {forecastData.recommendations?.next_steps?.map((step, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm text-blue-800">
                    <div className="w-1 h-1 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
              <a href="/train" className="btn-primary inline-flex mt-4">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Setup Forecasting
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const predictions = forecastData.predictions || [];
  
  // Calculate real insights from NB-INGARCH predictions
  const calculateInsights = (): TrendInsight[] => {
    const insights: TrendInsight[] = [];
    
    if (predictions.length === 0) return insights;

    const firstHalf = predictions.slice(0, Math.floor(predictions.length / 2));
    const secondHalf = predictions.slice(Math.floor(predictions.length / 2));
    const firstAvg = firstHalf.reduce((sum, p) => sum + p.predicted_visits, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, p) => sum + p.predicted_visits, 0) / secondHalf.length;
    const trendChange = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (Math.abs(trendChange) > 10) {
      insights.push({
        type: trendChange > 0 ? 'positive' : 'negative',
        title: trendChange > 0 ? 'Traffic Growth Detected' : 'Traffic Declining',
        description: `Expected ${trendChange > 0 ? 'increase' : 'decrease'} of ${Math.abs(trendChange).toFixed(1)}% over forecast period`,
        impact: trendChange > 0 ? 'Higher revenue potential' : 'Revenue at risk',
        action: trendChange > 0 ? 'Scale up inventory and staffing' : 'Consider promotional campaigns'
      });
    }

    const avgConfidence = predictions.reduce((sum, p) => sum + parseInt(p.confidence_level), 0) / predictions.length;
    if (avgConfidence < 75) {
      insights.push({
        type: 'warning',
        title: 'High Uncertainty Period',
        description: `Model confidence at ${avgConfidence.toFixed(0)}% - higher variation expected`,
        impact: 'Staffing mismatches more likely',
        action: 'Maintain flexible scheduling and buffer stock'
      });
    }

    const peakDay = predictions.reduce((max, p) => p.predicted_visits > max.predicted_visits ? p : max);
    const avgVisits = predictions.reduce((sum, p) => sum + p.predicted_visits, 0) / predictions.length;
    if (peakDay.predicted_visits > avgVisits * 1.3) {
      insights.push({
        type: 'positive',
        title: 'Major Peak Day Identified',
        description: `${peakDay.day_of_week} (${new Date(peakDay.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}) forecasted at ${formatIndianNumber(Math.round(peakDay.predicted_visits))} visitors`,
        impact: `${Math.round((peakDay.predicted_visits - avgVisits) / avgVisits * 100)}% above average traffic`,
        action: 'Ensure maximum staff and full inventory for this day'
      });
    }

    const paydayCount = predictions.filter(p => p.is_payday).length;
    if (paydayCount > 0) {
      const paydayPredictions = predictions.filter(p => p.is_payday);
      const paydayAvg = paydayPredictions.reduce((sum, p) => sum + p.predicted_visits, 0) / paydayPredictions.length;
      insights.push({
        type: 'positive',
        title: 'Month-End Surge Expected',
        description: `${paydayCount} payday period${paydayCount > 1 ? 's' : ''} with avg ${formatIndianNumber(Math.round(paydayAvg))} visitors`,
        impact: 'Higher transaction values expected',
        action: 'Stock premium items and prepare for increased spending'
      });
    }

    const weekendPredictions = predictions.filter(p => p.is_weekend);
    if (weekendPredictions.length > 0) {
      const weekendAvg = weekendPredictions.reduce((sum, p) => sum + p.predicted_visits, 0) / weekendPredictions.length;
      const weekdayPredictions = predictions.filter(p => !p.is_weekend);
      const weekdayAvg = weekdayPredictions.length > 0 
        ? weekdayPredictions.reduce((sum, p) => sum + p.predicted_visits, 0) / weekdayPredictions.length
        : avgVisits;
      const weekendLift = ((weekendAvg - weekdayAvg) / weekdayAvg) * 100;
      
      if (Math.abs(weekendLift) > 15) {
        insights.push({
          type: 'neutral',
          title: weekendLift > 0 ? 'Strong Weekend Pattern' : 'Weekend Traffic Lower',
          description: `Weekend traffic ${Math.abs(weekendLift).toFixed(0)}% ${weekendLift > 0 ? 'higher' : 'lower'} than weekdays`,
          impact: `${weekendLift > 0 ? 'Increased' : 'Reduced'} weekend operations needed`,
          action: `Adjust weekend staffing to ${formatIndianNumber(Math.round(weekendAvg))} visitor capacity`
        });
      }
    }

    return insights.slice(0, 4);
  };

  const insights = calculateInsights();
  const avgVisits = predictions.length > 0 
    ? predictions.reduce((sum, p) => sum + p.predicted_visits, 0) / predictions.length
    : 0;
  const totalRevenue = predictions.reduce((sum, p) => sum + (p.predicted_visits * 150), 0);
  const totalProfit = Math.round(totalRevenue * 0.25);
  const peakDay = predictions.length > 0 
    ? predictions.reduce((max, p) => p.predicted_visits > max.predicted_visits ? p : max, predictions[0])
    : null;
  
  const recentAvg = predictions.slice(0, 3).reduce((sum, p) => sum + p.predicted_visits, 0) / 3;
  const laterAvg = predictions.slice(-3).reduce((sum, p) => sum + p.predicted_visits, 0) / 3;
  const trendPercentage = ((laterAvg - recentAvg) / recentAvg) * 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Clean Header */}
      <header className="section-header">
        <div>
          <h1 className="section-title text-ink-900">Demand Forecasts</h1>
          <p className="section-description">
            Real predictions from <span className="font-semibold text-ink-800">NB-INGARCH model</span> trained on your uploaded data • 
            Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="flex items-center gap-2 mt-3">
            {(['lite', 'pro'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleModeChange(option)}
                className={`${mode === option ? 'btn-primary' : 'btn-secondary'} text-xs px-3 py-1`}
              >
                {option === 'lite' ? 'Lite Mode' : 'Pro Mode'}
              </button>
            ))}
            {forecastData?.cache_hit && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                Cached Result
              </span>
            )}
          </div>
        </div>
        <button 
          onClick={() => fetchForecasts(mode)} 
          className="btn-secondary"
          disabled={loading}
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </header>

      {forecastData?.metadata && (
        <section className="card p-4 border border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs uppercase text-ink-500">Model Mode</p>
              <p className="text-sm font-semibold text-ink-900">{forecastData.mode_used?.toUpperCase() || mode.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-500">Trained On</p>
              <p className="text-sm text-ink-900">
                {forecastData.metadata.trained_at
                  ? new Date(forecastData.metadata.trained_at).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-500">Data Range</p>
              <p className="text-sm text-ink-900">
                {forecastData.metadata.data_range?.min && forecastData.metadata.data_range?.max
                  ? `${forecastData.metadata.data_range.min} → ${forecastData.metadata.data_range.max}`
                  : 'Not available'}
              </p>
            </div>
          </div>
          {forecastData.metadata.data_freshness?.is_stale && (
            <div className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
              {forecastData.metadata.data_freshness.reason || 'Newer data detected — consider retraining soon.'}
            </div>
          )}
          {forecastData.metadata.warnings && forecastData.metadata.warnings.length > 0 && (
            <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">Data Warnings</p>
              <ul className="text-sm text-amber-900 space-y-1">
                {forecastData.metadata.warnings.map((warning, index) => (
                  <li key={index} className="flex gap-2">
                    <span>•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Data Source Indicator */}
      <div className="card p-4 border-green-200 bg-green-50">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-900">
              Using YOUR Real Data
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Predictions computed from YOUR uploaded CSV • Model learns from your patterns • Updates as you add data
            </p>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-2 p-1 bg-surface-100 rounded-lg border border-border">
        <button
          onClick={() => setSelectedView('overview')}
          className={`flex-1 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
            selectedView === 'overview'
              ? 'bg-white shadow-sm text-accent-600 border border-border'
              : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedView('daily')}
          className={`flex-1 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
            selectedView === 'daily'
              ? 'bg-white shadow-sm text-accent-600 border border-border'
              : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Daily Breakdown
        </button>
        <button
          onClick={() => setSelectedView('insights')}
          className={`flex-1 px-4 py-2.5 rounded-md font-medium text-sm transition-all ${
            selectedView === 'insights'
              ? 'bg-white shadow-sm text-accent-600 border border-border'
              : 'text-ink-600 hover:text-ink-900'
          }`}
        >
          Insights
        </button>
      </div>

      {/* Overview View */}
      {selectedView === 'overview' && (
        <>
          {/* Key Metrics - Subtle */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Avg Daily Traffic</span>
                <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="text-3xl font-black text-ink-900 mb-2">{formatIndianNumber(Math.round(avgVisits))}</div>
              <p className="text-xs text-ink-600">visitors per day</p>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1 text-xs text-ink-600">
                  <svg className={`w-3 h-3 ${trendPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={trendPercentage >= 0 ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"} />
                  </svg>
                  <span className="font-semibold">{Math.abs(trendPercentage).toFixed(1)}%</span>
                  <span>{trendPercentage >= 0 ? 'growth' : 'decline'}</span>
                </div>
              </div>
            </div>

            <div className="card p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Revenue Forecast</span>
                <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-black text-ink-900 mb-2">₹{(totalRevenue / 1000).toFixed(0)}k</div>
              <p className="text-xs text-ink-600">next {predictions.length} days</p>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-ink-600">
                  Profit: <span className="font-semibold text-ink-900">₹{(totalProfit / 1000).toFixed(1)}k</span>
                </div>
              </div>
            </div>

            <div className="card p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Peak Day</span>
                <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div className="text-3xl font-black text-ink-900 mb-2">{peakDay?.day_of_week.slice(0, 3)}</div>
              <p className="text-xs text-ink-600">{formatIndianNumber(Math.round(peakDay?.predicted_visits || 0))} visitors</p>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-ink-600">
                  {new Date(peakDay?.date || '').toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} • 
                  <span className="font-semibold text-ink-900"> +{Math.round((peakDay?.predicted_visits || 0) / avgVisits * 100 - 100)}%</span>
                </div>
              </div>
            </div>

            <div className="card p-5 border border-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Model Confidence</span>
                <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-3xl font-black text-ink-900 mb-2">
                {Math.round(predictions.reduce((sum, p) => sum + parseInt(p.confidence_level), 0) / predictions.length)}%
              </div>
              <p className="text-xs text-ink-600">average certainty</p>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-xs text-ink-600">
                  <span className="font-semibold text-ink-900">NB-INGARCH</span> active
                </div>
              </div>
            </div>
          </div>

          {/* How To Use */}
          <div className="card p-4 border-blue-200 bg-blue-50">
            <h3 className="text-sm font-semibold text-blue-900 mb-3">How To Use These Predictions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-blue-700 font-bold">1.</span>
                <div>
                  <p className="font-semibold text-blue-900">Staff Planning</p>
                  <p className="text-blue-700 text-xs">See predicted traffic → Schedule right staff → Save costs</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-700 font-bold">2.</span>
                <div>
                  <p className="font-semibold text-blue-900">Inventory Control</p>
                  <p className="text-blue-700 text-xs">Know busy days → Stock up → Avoid stockouts</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-700 font-bold">3.</span>
                <div>
                  <p className="font-semibold text-blue-900">Revenue Planning</p>
                  <p className="text-blue-700 text-xs">See forecast → Plan promotions → Maximize sales</p>
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Chart */}
          <div className="card p-6">
            <div className="mb-6">
              <h2 className="text-base font-bold text-ink-900 mb-1">7-Day Forecast Visualization</h2>
              <p className="text-sm text-ink-600">Each bar shows predicted visitors with uncertainty range (gray band)</p>
            </div>
            <div className="space-y-3">
              {predictions.map((pred) => {
                const maxVisits = Math.max(...predictions.map(p => p.upper_bound));
                const barWidth = (pred.predicted_visits / maxVisits) * 100;
                const upperWidth = (pred.upper_bound / maxVisits) * 100;
                const isHigh = pred.predicted_visits > avgVisits * 1.2;
                
                return (
                  <div key={pred.date} className="group">
                    <div className="flex items-center gap-3">
                      <div className="w-24 flex-shrink-0">
                        <div className={`text-sm font-semibold ${pred.is_weekend ? 'text-accent-600' : 'text-ink-900'}`}>
                          {new Date(pred.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                        </div>
                        <div className="text-xs text-ink-500">{pred.day_of_week.slice(0, 3)}</div>
                      </div>
                      
                      <div className="flex-1 relative h-10">
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 h-6 bg-surface-200 rounded"
                          style={{ width: `${upperWidth}%` }}
                        ></div>
                        
                        <div 
                          className={`absolute top-1/2 -translate-y-1/2 h-8 rounded border ${
                            isHigh 
                              ? 'bg-orange-100 border-orange-300' 
                              : pred.is_weekend
                              ? 'bg-accent-100 border-accent-300'
                              : 'bg-surface-100 border-border'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        >
                          <div className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-900 text-xs font-bold">
                            {formatIndianNumber(Math.round(pred.predicted_visits))}
                          </div>
                        </div>
                        
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-border"
                          style={{ left: `${(avgVisits / maxVisits) * 100}%` }}
                        ></div>
                      </div>
                      
                      <div className="w-16 flex-shrink-0 flex items-center justify-end gap-1 text-xs">
                        {isHigh && <span className="font-bold text-orange-600">HIGH</span>}
                        {pred.is_payday && <span>💰</span>}
                      </div>
                    </div>
                    
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-xs text-ink-600 ml-28">
                      Range: {formatIndianNumber(Math.round(pred.lower_bound))}-{formatIndianNumber(Math.round(pred.upper_bound))} • 
                      Confidence: {pred.confidence_level}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 pt-4 border-t flex items-center justify-center gap-6 text-xs text-ink-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-surface-200 rounded"></div>
                <span>Uncertainty</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-surface-100 border border-border rounded"></div>
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-100 border border-accent-300 rounded"></div>
                <span>Weekend</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-0.5 h-4 bg-border"></div>
                <span>Average</span>
              </div>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <h3 className="text-sm font-bold text-ink-900">Staffing Recommendations</h3>
              </div>
              <div className="space-y-2">
                {forecastData.staffing_recommendations?.slice(0, 5).map((staffing, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-50 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-ink-900">
                        {new Date(staffing.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-sm font-bold text-ink-900">{staffing.recommended_staff} staff</span>
                    </div>
                    <div className="text-xs text-ink-600">
                      Cost: ₹{staffing.labor_cost_estimate.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">Total labor cost:</span>
                  <span className="font-bold text-ink-900">
                    ₹{(forecastData.staffing_recommendations?.reduce((sum, s) => sum + s.labor_cost_estimate, 0) || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <svg className="w-5 h-5 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <h3 className="text-sm font-bold text-ink-900">Stock Alerts</h3>
              </div>
              <div className="space-y-2">
                {forecastData.inventory_alerts?.slice(0, 5).map((alert, i) => (
                  <div key={i} className="p-3 rounded-lg bg-surface-50 border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-ink-900">
                        {new Date(alert.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                        alert.stockout_risk === 'high' ? 'bg-red-100 text-red-800' :
                        alert.stockout_risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {alert.stockout_risk}
                      </span>
                    </div>
                    <div className="text-xs text-ink-600">
                      Est. sales: {alert.estimated_daily_sales} units
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-sm text-ink-600">
                  <span className="font-bold text-red-600">{forecastData.inventory_alerts?.filter(a => a.stockout_risk === 'high').length || 0}</span> high-priority alerts
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Daily View */}
      {selectedView === 'daily' && (
        <div className="space-y-4">
          {predictions.map((pred, index) => {
            const revenue = Math.round(pred.predicted_visits * 150);
            const profit = Math.round(revenue * 0.25);
            const staffing = forecastData.staffing_recommendations?.[index];
            const inventory = forecastData.inventory_alerts?.[index];
            const isHighTraffic = pred.predicted_visits > avgVisits * 1.2;
            
            return (
              <div 
                key={pred.date}
                className="card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink-900 mb-2">
                      {new Date(pred.date).toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex items-center gap-2">
                      {pred.is_weekend && (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-accent-100 text-accent-700 border border-accent-200">
                          Weekend
                        </span>
                      )}
                      {pred.is_payday && (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-green-100 text-green-700 border border-green-200">
                          Payday
                        </span>
                      )}
                      {isHighTraffic && (
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-orange-100 text-orange-700 border border-orange-200">
                          HIGH TRAFFIC
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-4xl font-black text-ink-900">{formatIndianNumber(Math.round(pred.predicted_visits))}</div>
                    <div className="text-sm text-ink-600">expected visitors</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-surface-50 rounded border border-border">
                    <div className="text-xs text-ink-500 uppercase mb-1">Confidence</div>
                    <div className="text-lg font-bold text-ink-900">{pred.confidence_level}</div>
                    <div className="text-xs text-ink-600 mt-1">{formatIndianNumber(Math.round(pred.lower_bound))}-{formatIndianNumber(Math.round(pred.upper_bound))}</div>
                  </div>
                  
                  <div className="p-3 bg-surface-50 rounded border border-border">
                    <div className="text-xs text-ink-500 uppercase mb-1">Revenue</div>
                    <div className="text-lg font-bold text-ink-900">₹{revenue.toLocaleString('en-IN')}</div>
                    <div className="text-xs text-ink-600 mt-1">₹{profit.toLocaleString('en-IN')} profit</div>
                  </div>
                  
                  <div className="p-3 bg-surface-50 rounded border border-border">
                    <div className="text-xs text-ink-500 uppercase mb-1">Staff</div>
                    <div className="text-lg font-bold text-ink-900">{staffing?.recommended_staff || 2}</div>
                    <div className="text-xs text-ink-600 mt-1">₹{staffing?.labor_cost_estimate.toLocaleString('en-IN')}</div>
                  </div>
                  
                  <div className="p-3 bg-surface-50 rounded border border-border">
                    <div className="text-xs text-ink-500 uppercase mb-1">Stock Risk</div>
                    <div className={`text-lg font-bold ${
                      inventory?.stockout_risk === 'high' ? 'text-red-700' :
                      inventory?.stockout_risk === 'medium' ? 'text-yellow-700' :
                      'text-green-700'
                    }`}>
                      {inventory?.stockout_risk?.toUpperCase() || 'LOW'}
                    </div>
                    <div className="text-xs text-ink-600 mt-1">{inventory?.estimated_daily_sales || 0} sales</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Insights View */}
      {selectedView === 'insights' && (
        <div className="space-y-6">
          {insights.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.map((insight, index) => (
                <div key={index} className="card p-6 border border-border">
                  <h3 className="text-base font-bold text-ink-900 mb-3">{insight.title}</h3>
                  <p className="text-sm text-ink-700 mb-4">{insight.description}</p>
                  <div className="space-y-2 text-sm text-ink-600">
                    <div>
                      <strong>Impact:</strong> {insight.impact}
                    </div>
                    <div>
                      <strong>Action:</strong> {insight.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-ink-600">No significant insights detected for current forecast period.</p>
            </div>
          )}

          <div className="card p-6">
            <h3 className="text-base font-bold text-ink-900 mb-3">About NB-INGARCH Model</h3>
            <p className="text-sm text-ink-700 mb-4">
              These predictions use a <strong>Negative Binomial INGARCH</strong> model, 
              specifically designed for count-based time series like retail footfall. The model captures:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-ink-700">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-ink-600 mt-2 flex-shrink-0"></div>
                <span>Autoregressive patterns from your history</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-ink-600 mt-2 flex-shrink-0"></div>
                <span>Volatility clustering (weekends vs weekdays)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-ink-600 mt-2 flex-shrink-0"></div>
                <span>External factors (holidays, paydays)</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-ink-600 mt-2 flex-shrink-0"></div>
                <span>Overdispersion in count data</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

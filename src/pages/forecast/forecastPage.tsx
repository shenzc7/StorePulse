import { useState, useEffect } from 'react';
import { apiGet, type ApiError } from '../../src/lib/api';
import { ForecastHeader } from './components/ForecastHeader';
import { MetricCards } from './components/MetricCards';
import { ForecastChart } from './components/ForecastChart';
import { ActionWidgets } from './components/ActionWidgets';
import { SmartSummary } from './components/SmartSummary';

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
    is_stale: boolean;
    reason: string | null;
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

export function ForecastPage() {
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [mode, setMode] = useState<'lite' | 'pro' | 'auto'>('auto');

  useEffect(() => {
    fetchForecasts(mode);
    const refreshInterval = setInterval(() => {
      fetchForecasts(mode);
    }, 2 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [mode]);

  const fetchForecasts = async (requestedMode: 'lite' | 'pro' | 'auto' = mode) => {
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
      <div className="space-y-6 animate-fade-in p-6">
        <div className="section-header">
          <h1 className="section-title">Demand Forecasts</h1>
          <p className="section-description">Loading intelligent predictions...</p>
        </div>
        <div className="flex flex-col items-center justify-center py-32 rounded-lg border border-border bg-surface-50/50">
          <div className="spinner mb-4 border-primary-600 border-t-transparent w-8 h-8"></div>
          <p className="text-sm font-medium text-ink-600">Computing forecast model...</p>
        </div>
      </div>
    );
  }

  if (error || !forecastData) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
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
              <button onClick={() => fetchForecasts(mode)} className="btn-secondary mt-3 text-xs bg-white">Retry Connection</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (forecastData.status === 'no_models' || forecastData.status === 'no_model') {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <ForecastHeader
          lastUpdated={lastUpdated}
          mode={mode}
          onModeChange={handleModeChange}
          loading={loading}
          onRefresh={() => fetchForecasts(mode)}
          isCached={forecastData.cache_hit}
        />
        <div className="card p-8 border-blue-200 bg-blue-50 text-center">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-blue-900 mb-2">Model Not Trained Yet</h2>
          <p className="text-blue-700 max-w-md mx-auto mb-6">
            {forecastData.message || 'Train the NB-INGARCH model to start generating intelligent demand forecasts for your store.'}
          </p>
          <a href="/train" className="btn-primary inline-flex items-center gap-2 shadow-sm">
            Setup Forecasting Engine
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </div>
    );
  }

  const predictions = forecastData.predictions || [];

  // Computed Metrics
  const tomorrow = predictions[0];
  const avgVisits = predictions.reduce((sum, p) => sum + p.predicted_visits, 0) / (predictions.length || 1);
  const recentAvg = predictions.slice(0, 3).reduce((sum, p) => sum + p.predicted_visits, 0) / 3;
  const laterAvg = predictions.slice(-3).reduce((sum, p) => sum + p.predicted_visits, 0) / 3;
  const trendPercentage = ((laterAvg - recentAvg) / recentAvg) * 100;

  const tomorrowStaff = forecastData.staffing_recommendations?.[0]?.recommended_staff || 0;
  // Fallback revenue calculation if data missing
  const tomorrowRevenue = tomorrow ? tomorrow.predicted_visits * 150 : 0;

  const riskCount = (forecastData.inventory_alerts || []).filter(
    a => a.stockout_risk === 'high' || a.stockout_risk === 'medium'
  ).length;

  const inventoryAlert = forecastData.inventory_alerts?.[0];
  const inventorySummary = inventoryAlert?.stockout_risk === 'high'
    ? "Immediate restocking of high-risk items is CRITICAL."
    : inventoryAlert?.stockout_risk === 'medium'
      ? "Monitor stock levels closely for upcoming demand."
      : "Inventory levels appear stable for tomorrow.";

  const peakPrediction = predictions.reduce((prev, curr) =>
    (curr.predicted_visits > prev.predicted_visits) ? curr : prev
    , predictions[0]);

  const isPeakComing = peakPrediction && peakPrediction.date !== tomorrow?.date;

  return (
    <div className="animate-fade-in p-6 max-w-7xl mx-auto">
      <ForecastHeader
        lastUpdated={lastUpdated}
        mode={mode}
        onModeChange={handleModeChange}
        loading={loading}
        onRefresh={() => fetchForecasts(mode)}
        isCached={forecastData.cache_hit}
        metadata={forecastData.metadata}
      />

      <SmartSummary
        tomorrowVisits={tomorrow?.predicted_visits || 0}
        isHighTraffic={tomorrow?.predicted_visits > (avgVisits * 1.15)}
        staffRecommendation={`Deploy ${tomorrowStaff} staff members across recommended roles.`}
        inventoryUrgency={inventorySummary}
        warnings={forecastData.metadata?.warnings}
        peakDay={isPeakComing ? {
          date: peakPrediction.date,
          visits: peakPrediction.predicted_visits
        } : undefined}
      />

      <MetricCards
        tomorrowVisits={tomorrow?.predicted_visits || 0}
        tomorrowStaff={tomorrowStaff}
        tomorrowRevenue={tomorrowRevenue}
        avgVisits={avgVisits}
        trendPercentage={trendPercentage}
        riskCount={riskCount}
      />

      <ForecastChart
        predictions={predictions}
        height={320}
      />

      <ActionWidgets
        staffing={forecastData.staffing_recommendations || []}
        inventory={forecastData.inventory_alerts || []}
      />
    </div>
  );
}

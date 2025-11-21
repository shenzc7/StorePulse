import { useState, useEffect } from 'react';
import { apiGet, type ApiError } from '../../src/lib/api';
interface ModelMetrics {
  lite_lift: number;
  pro_weekend_gain: number;
  coverage: number;
  time_to_first_forecast: string;
  model_status: {
    lite_model_available: boolean;
    pro_model_available: boolean;
  };
}
export function HomePage() {
  const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchModelMetrics();
  }, []);
  const fetchModelMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiGet<ModelMetrics & { error?: string }>('/api/metrics/');
      setMetrics(data);
      // If there's an error field but we still got data, show it as a warning but don't fail
      if (data.error) {
        console.warn('Model metrics warning:', data.error);
        // Don't set error state for model loading issues - they're expected when no models are trained
      }
    } catch (err) {
      console.error('Error fetching model metrics:', err);
      const apiError = err as ApiError;
      setError(apiError.message || 'Unable to load metrics. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <header className="section-header">
        <h1 className="section-title">Dashboard</h1>
        <p className="section-description">
          Monitor your visitor prediction system and forecast readiness
        </p>
      </header>
      {/* Forecast System Overview */}
      <section>
        <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide mb-3">Forecast System Status</h2>
      {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="h-4 bg-surface-200 rounded w-20 mb-3"></div>
                <div className="h-6 bg-surface-200 rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-5 border-danger-200 bg-danger-50">
            <div className="flex items-center gap-2 text-danger-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      ) : metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Forecast Card */}
            <div className="stat-card group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Quick Forecast</span>
                <div className={`w-2 h-2 rounded-full ${metrics.model_status.lite_model_available ? 'bg-accent-500' : 'bg-ink-300'}`}></div>
              </div>
              <div className="text-2xl font-semibold text-ink-900 mb-1">
                {metrics.model_status.lite_model_available ? 'Ready' : 'Not Set Up'}
              </div>
              {metrics.model_status.lite_model_available && (
                <div className="text-xs text-accent-600 font-medium">
                  {metrics.lite_lift.toFixed(1)}% more accurate
                </div>
              )}
            </div>
            {/* Advanced Forecast Card */}
            <div className="stat-card group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Advanced Forecast</span>
                <div className={`w-2 h-2 rounded-full ${metrics.model_status.pro_model_available ? 'bg-accent-500' : 'bg-ink-300'}`}></div>
              </div>
              <div className="text-2xl font-semibold text-ink-900 mb-1">
                {metrics.model_status.pro_model_available ? 'Ready' : 'Not Set Up'}
              </div>
              {metrics.model_status.pro_model_available && (
                <div className="text-xs text-accent-600 font-medium">
                  {metrics.pro_weekend_gain.toFixed(1)}% better on weekends
        </div>
      )}
            </div>
            {/* Accuracy Card */}
            <div className="stat-card group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Accuracy Rate</span>
                <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-semibold text-ink-900 mb-1">
                {metrics.coverage.toFixed(1)}%
              </div>
              <div className="text-xs text-ink-600">
                Predictions within range
              </div>
            </div>
            {/* Setup Time Card */}
            <div className="stat-card group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Setup Time</span>
                <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-2xl font-semibold text-ink-900 mb-1">
                {metrics.time_to_first_forecast}
              </div>
              <div className="text-xs text-ink-600">
                To get predictions
              </div>
            </div>
          </div>
        ) : null}
      </section>
      {/* Quick Actions */}
      <section>
        <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Setup Forecasting Action */}
          <a href="/train" className="card card-hover p-6 group block">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-ink-900 mb-1 group-hover:text-primary-600 transition-colors">
                  Setup Forecasting
                </h3>
                <p className="text-sm text-ink-600 leading-relaxed">
                  Upload your sales data and get started
                </p>
              </div>
              <svg className="w-5 h-5 text-ink-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
          {/* View Predictions Action */}
          <a href="/forecast" className="card card-hover p-6 group block">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-100 flex items-center justify-center group-hover:bg-accent-200 transition-colors">
                <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-ink-900 mb-1 group-hover:text-accent-600 transition-colors">
                  View Predictions
                </h3>
                <p className="text-sm text-ink-600 leading-relaxed">
                  See your 2-week visitor forecast
                </p>
              </div>
              <svg className="w-5 h-5 text-ink-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
          {/* Store Data Action */}
          <a href="/data" className="card card-hover p-6 group block">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-secondary-200 flex items-center justify-center group-hover:bg-secondary-300 transition-colors">
                <svg className="w-6 h-6 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-ink-900 mb-1 group-hover:text-secondary-700 transition-colors">
                  Store Data
                </h3>
                <p className="text-sm text-ink-600 leading-relaxed">
                  View and upload your sales history
                </p>
              </div>
              <svg className="w-5 h-5 text-ink-400 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
      </section>
      {/* System Information */}
      {metrics && (
        <section>
          <h2 className="text-sm font-semibold text-ink-700 uppercase tracking-wide mb-3">System Information</h2>
          <div className="card p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-ink-900 mb-3">Forecast Systems</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">Quick Forecast</span>
                    <span className={`badge ${metrics.model_status.lite_model_available ? 'badge-success' : 'badge-neutral'}`}>
                      {metrics.model_status.lite_model_available ? 'Ready' : 'Not set up'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">Pro Forecast</span>
                    <span className={`badge ${metrics.model_status.pro_model_available ? 'badge-success' : 'badge-neutral'}`}>
                      {metrics.model_status.pro_model_available ? 'Ready' : 'Not set up'}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-ink-900 mb-3">Performance Summary</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">Quick Forecast Accuracy</span>
                    <span className="font-medium text-ink-900">{metrics.lite_lift.toFixed(1)}% better</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">Weekend Accuracy Boost</span>
                    <span className="font-medium text-ink-900">{metrics.pro_weekend_gain.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-600">Overall Accuracy Rate</span>
                    <span className="font-medium text-ink-900">{metrics.coverage.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
      </div>
        </section>
      )}
    </div>
  );
}

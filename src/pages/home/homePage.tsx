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
      if (data.error) {
        console.warn('Model metrics warning:', data.error);
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
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink mb-1">Dashboard</h1>
        <p className="text-sm text-ink-muted">
          System status and performance overview
        </p>
      </header>

      {/* Forecast System Overview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-medium text-ink-faint uppercase tracking-wider">System Status</h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card p-5 animate-pulse bg-surface-hover/50 border-border/50">
                <div className="h-3 bg-surface-active rounded w-20 mb-3"></div>
                <div className="h-5 bg-surface-active rounded w-24"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="card p-4 border-danger/20 bg-danger/5">
            <div className="flex items-center gap-2 text-danger">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">{error}</span>
            </div>
          </div>
        ) : metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Quick Forecast Card */}
            <div className="card p-5 group hover:border-border-strong transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-ink-muted">Quick Forecast</span>
                <div className={`w-1.5 h-1.5 rounded-full ${metrics.model_status.lite_model_available ? 'bg-success' : 'bg-ink-faint'}`}></div>
              </div>
              <div className="text-xl font-semibold text-ink mb-1">
                {metrics.model_status.lite_model_available ? 'Active' : 'Inactive'}
              </div>
              {metrics.model_status.lite_model_available && (
                <div className="text-xs text-success font-medium">
                  +{metrics.lite_lift.toFixed(1)}% accuracy
                </div>
              )}
            </div>

            {/* Advanced Forecast Card */}
            <div className="card p-5 group hover:border-border-strong transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-ink-muted">Pro Forecast</span>
                <div className={`w-1.5 h-1.5 rounded-full ${metrics.model_status.pro_model_available ? 'bg-accent' : 'bg-ink-faint'}`}></div>
              </div>
              <div className="text-xl font-semibold text-ink mb-1">
                {metrics.model_status.pro_model_available ? 'Active' : 'Inactive'}
              </div>
              {metrics.model_status.pro_model_available && (
                <div className="text-xs text-accent font-medium">
                  +{metrics.pro_weekend_gain.toFixed(1)}% weekend lift
                </div>
              )}
            </div>

            {/* Accuracy Card */}
            <div className="card p-5 group hover:border-border-strong transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-ink-muted">Coverage</span>
                <svg className="w-4 h-4 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xl font-semibold text-ink mb-1">
                {metrics.coverage.toFixed(1)}%
              </div>
              <div className="text-xs text-ink-faint">
                Within confidence bounds
              </div>
            </div>

            {/* Setup Time Card */}
            <div className="card p-5 group hover:border-border-strong transition-colors">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-ink-muted">Latency</span>
                <svg className="w-4 h-4 text-ink-faint" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-xl font-semibold text-ink mb-1">
                {metrics.time_to_first_forecast}
              </div>
              <div className="text-xs text-ink-faint">
                Cold start time
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-xs font-medium text-ink-faint uppercase tracking-wider mb-4">Actions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Setup Forecasting Action */}
          <a href="/train" className="card p-5 group block hover:bg-surface-hover transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-active flex items-center justify-center group-hover:bg-surface-active/80 transition-colors border border-border">
                <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-ink mb-1 group-hover:text-ink-bright transition-colors">
                  Train Model
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Upload data and configure parameters
                </p>
              </div>
              <svg className="w-4 h-4 text-ink-faint group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* View Predictions Action */}
          <a href="/forecast" className="card p-5 group block hover:bg-surface-hover transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-active flex items-center justify-center group-hover:bg-surface-active/80 transition-colors border border-border">
                <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-ink mb-1 group-hover:text-ink-bright transition-colors">
                  Forecasts
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  View 14-day visitor predictions
                </p>
              </div>
              <svg className="w-4 h-4 text-ink-faint group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          {/* Store Data Action */}
          <a href="/data" className="card p-5 group block hover:bg-surface-hover transition-all">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface-active flex items-center justify-center group-hover:bg-surface-active/80 transition-colors border border-border">
                <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-ink mb-1 group-hover:text-ink-bright transition-colors">
                  Data Management
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed">
                  Import and validate sales history
                </p>
              </div>
              <svg className="w-4 h-4 text-ink-faint group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        </div>
      </section>
    </div>
  );
}

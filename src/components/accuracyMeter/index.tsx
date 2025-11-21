interface AccuracyMeterProps {
  liteLift: number; 
  proWeekendGain: number; 
  coverage: number; 
  timeToFirstForecast: string; 
}
export function AccuracyMeter({ liteLift, proWeekendGain, coverage, timeToFirstForecast }: AccuracyMeterProps) {
  return (
    <section className="card p-6">
      {/* "Header block explains what the stats mean." */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-ink-900 mb-1">Model Performance</h2>
        <p className="text-sm text-ink-600">Key metrics from your trained forecasting models</p>
      </div>
      {/* "Show the four high-level KPIs in a responsive grid." */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* "Lite Model Lift metric." */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Lite Model Lift</span>
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-3xl font-semibold text-ink-900 mb-1">{liteLift.toFixed(1)}%</div>
          <div className="text-xs text-ink-600">Better than baseline</div>
        </div>
        {/* "Pro model weekend gain metric." */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Weekend Boost</span>
            <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-3xl font-semibold text-ink-900 mb-1">{proWeekendGain.toFixed(1)}%</div>
          <div className="text-xs text-ink-600">Extra weekend accuracy</div>
        </div>
        {/* "Coverage percentage metric." */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Coverage</span>
            <svg className="w-4 h-4 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-3xl font-semibold text-ink-900 mb-1">{coverage.toFixed(1)}%</div>
          <div className="text-xs text-ink-600">Within confidence bands</div>
        </div>
        {/* "Cold start timing metric." */}
        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-ink-600 uppercase tracking-wide">Cold Start</span>
            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-2xl font-semibold text-ink-900 mb-1">{timeToFirstForecast}</div>
          <div className="text-xs text-ink-600">To first prediction</div>
        </div>
      </div>
      {/* "Offer context so operators know how to interpret the scores." */}
      <div className="mt-6 p-4 rounded-xl bg-surface-100 border border-border">
        <h3 className="text-sm font-semibold text-ink-900 mb-3">Performance Benchmarks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-ink-900">Lite Lift:</span>
              <span className="text-ink-600 ml-1">15%+ is good, 25%+ is excellent</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-ink-900">Weekend Boost:</span>
              <span className="text-ink-600 ml-1">5%+ is solid, 10%+ is great</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-500 mt-1.5 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-ink-900">Coverage:</span>
              <span className="text-ink-600 ml-1">80%+ is good, 90%+ is excellent</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-1.5 flex-shrink-0"></div>
            <div>
              <span className="font-medium text-ink-900">Cold Start:</span>
              <span className="text-ink-600 ml-1">Lower is better for quick decisions</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

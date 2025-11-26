export function LabPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <header className="section-header">
        <h1 className="section-title">What-If Planner</h1>
        <p className="section-description">
          Simulate business scenarios to predict their impact on future footfall and operations.
        </p>
      </header>

      {/* Coming Soon Message */}
      <div className="card p-12">
        <div className="text-center max-w-2xl mx-auto">
          <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-ink-900 mb-3">Coming Soon</h2>
          <p className="text-base text-ink-600 mb-6">
            The What-If Planner feature is currently under development. This powerful tool will allow you to:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 mb-1">Test Promotional Scenarios</p>
                <p className="text-xs text-ink-600">See how sales and promotions impact visitor forecasts</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 mb-1">Weather Impact Analysis</p>
                <p className="text-xs text-ink-600">Understand how weather conditions affect footfall</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 mb-1">Staffing Recommendations</p>
                <p className="text-xs text-ink-600">Get automated staffing adjustments based on scenarios</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900 mb-1">Inventory Planning</p>
                <p className="text-xs text-ink-600">Forecast inventory needs for different scenarios</p>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-border">
            <p className="text-sm text-ink-500">
              Stay tuned for updates. This feature will be available in a future release.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

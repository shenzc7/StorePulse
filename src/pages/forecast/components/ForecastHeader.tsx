import React from 'react';

interface ForecastHeaderProps {
    lastUpdated: Date;
    mode: 'lite' | 'pro' | 'auto';
    onModeChange: (mode: 'lite' | 'pro') => void;
    loading: boolean;
    onRefresh: () => void;
    isCached?: boolean;
    metadata?: {
        trained_at?: string;
        data_freshness?: {
            is_stale: boolean;
            reason: string | null;
        };
    };
}

export function ForecastHeader({
    lastUpdated,
    mode,
    onModeChange,
    loading,
    onRefresh,
    isCached,
    metadata
}: ForecastHeaderProps) {
    const isStale = metadata?.data_freshness?.is_stale;

    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-ink-900 tracking-tight">Demand Forecasts</h1>
                    {metadata && (
                        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-black uppercase tracking-wider ${isStale ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-green-50 text-green-600 border-green-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isStale ? 'bg-amber-500' : 'bg-green-500'}`}></span>
                            {isStale ? 'Rel. Moderate' : 'Rel. High'}
                        </div>
                    )}
                </div>
                <p className="text-sm text-ink-600 mt-1">
                    Predictions from <span className="font-semibold text-ink-800">NB-INGARCH model</span> •
                    Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </p>

                <div className="flex items-center gap-2 mt-3">
                    {(['lite', 'pro'] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => onModeChange(option)}
                            className={`
                text-xs px-3 py-1.5 rounded-full font-medium transition-colors border
                ${mode === option
                                    ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                                    : 'bg-white text-ink-600 border-border hover:border-primary-200 hover:text-primary-700'
                                }
              `}
                        >
                            {option === 'lite' ? 'Lite Mode' : 'Pro Mode'}
                        </button>
                    ))}
                    {isCached ? (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Cached
                        </span>
                    ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent-50 text-accent-700 border border-accent-200">
                            <svg className="w-3 h-3 text-accent-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Live Compute
                        </span>
                    )}
                </div>
            </div>

            <button
                onClick={onRefresh}
                className="btn-secondary flex items-center gap-2"
                disabled={loading}
            >
                <svg
                    className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Updating...' : 'Refresh Data'}
            </button>
        </header>
    );
}

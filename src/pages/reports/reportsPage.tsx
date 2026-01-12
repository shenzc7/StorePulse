import { useState, useEffect } from 'react';
import { apiGet, apiPost, type ApiError } from '../../src/lib/api';

interface Report {
  id: string;
  name: string;
  filename: string;
  path: string;
  category: string;
  category_title: string;
  category_icon: string;
  category_color: string;
  type: string;
  size_formatted: string;
  modified: string;
  description: string;
  is_downloadable: boolean;
}

interface ReportsResponse {
  reports: Report[];
  categories: Record<string, any>;
  total_count: number;
}

export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await apiGet<ReportsResponse>('/api/reports/list');
      setReports(data.reports);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to load reports list');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      setGenerating(true);
      await apiPost('/api/reports/generate', {
        title: 'Strategic Demand Forecast',
        days: 14,
        mode: 'pro' // Default to Pro for best quality
      });
      // Refresh list to show new report
      await fetchReports();
    } catch (err) {
      const apiError = err as ApiError;
      alert(`Failed to generate report: ${apiError.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (report: Report) => {
    // Direct download link
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:9005'}/api/reports/download/${report.category}/${report.filename}`;
  };

  const filteredReports = filter === 'all'
    ? reports
    : reports.filter(r => r.category === filter);

  const categories = Array.from(new Set(reports.map(r => r.category)));

  if (loading && reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="spinner mb-4"></div>
        <p className="text-ink-500">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <header className="section-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Reports & Exports</h1>
          <p className="section-description">
            Download generated forecasts, backtests, and business insights.
          </p>
        </div>
        <button
          onClick={generateReport}
          disabled={generating}
          className="btn-primary flex items-center gap-2"
        >
          {generating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Generate New Report</span>
            </>
          )}
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all'
              ? 'bg-ink-900 text-white'
              : 'bg-surface-100 text-ink-600 hover:bg-surface-200'
            }`}
        >
          All Reports
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap capitalize transition-colors ${filter === cat
                ? 'bg-ink-900 text-white'
                : 'bg-surface-100 text-ink-600 hover:bg-surface-200'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Reports List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredReports.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-ink-900">No reports found</h3>
            <p className="text-ink-500 mt-1">Generate a new report to get started.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div key={report.id} className="card p-4 hover:border-primary-200 transition-colors group">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${report.category === 'exports' ? 'bg-purple-100 text-purple-600' :
                    report.category === 'forecasts' ? 'bg-green-100 text-green-600' :
                      'bg-blue-100 text-blue-600'
                  }`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-ink-900 truncate pr-4">
                        {report.name}
                      </h3>
                      <p className="text-sm text-ink-500 mt-0.5">
                        {report.description} • {report.size_formatted}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDownload(report)}
                      className="btn-secondary text-sm px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Download
                    </button>
                  </div>
                  <div className="flex items-center gap-3 mt-3 text-xs text-ink-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {report.modified}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-surface-100 uppercase tracking-wide font-medium">
                      {report.type}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

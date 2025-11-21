import { useState, useEffect } from 'react';
interface Report {
  id: string;
  name: string;
  filename: string;
  path: string;
  category: string;
  category_title: string;
  category_description: string;
  category_icon: string;
  category_color: string;
  type: string;
  size: number;
  size_formatted: string;
  modified: string;
  description: string;
  is_downloadable: boolean;
}
interface ReportCategory {
  title: string;
  description: string;
  icon: string;
  color: string;
}

interface BacktestInsight {
  avgSmape: number;
  avgMase: number;
  rows: Array<{
    fold: number;
    smape: number;
    mase: number;
  }>;
}
export function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [categories, setCategories] = useState<Record<string, ReportCategory>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [backtestInsights, setBacktestInsights] = useState<BacktestInsight | null>(null);
  const [loadingBacktest, setLoadingBacktest] = useState(false);
  const sparklinePoints = backtestInsights && backtestInsights.rows.length > 1
    ? backtestInsights.rows.map((row, index) => {
        const min = Math.min(...backtestInsights.rows.map((r) => r.smape));
        const max = Math.max(...backtestInsights.rows.map((r) => r.smape));
        const normalized = max === min ? 0.5 : (row.smape - min) / (max - min);
        const x = (index / (backtestInsights.rows.length - 1)) * 100;
        const y = 40 - normalized * 30;
        return `${x},${y}`;
      }).join(' ')
    : '';
  useEffect(() => {
    loadReports();
  }, []);

  const loadBacktestInsights = async (reportList: Report[]) => {
    const candidate = reportList.find((report) => report.category === 'backtests');
    if (!candidate) {
      setBacktestInsights(null);
      return;
    }
    try {
      setLoadingBacktest(true);
      const response = await fetch(`/api/reports/download/${candidate.category}/${candidate.filename}`);
      if (!response.ok) {
        throw new Error('Failed to fetch backtest data');
      }
      const csv = await response.text();
      const lines = csv.trim().split('\n');
      const dataRows = lines.slice(1).map((line) => {
        const [fold, smape, mase] = line.split(',');
        return {
          fold: Number(fold),
          smape: Number(smape),
          mase: Number(mase),
        };
      }).filter((row) => !Number.isNaN(row.smape) && !Number.isNaN(row.mase));

      if (dataRows.length === 0) {
        setBacktestInsights(null);
        return;
      }

      const avgSmape = dataRows.reduce((sum, row) => sum + row.smape, 0) / dataRows.length;
      const avgMase = dataRows.reduce((sum, row) => sum + row.mase, 0) / dataRows.length;

      setBacktestInsights({
        avgSmape,
        avgMase,
        rows: dataRows,
      });
    } catch (error) {
      console.error('Failed to load backtest insights:', error);
      setBacktestInsights(null);
    } finally {
      setLoadingBacktest(false);
    }
  };

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/reports/list');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setCategories(data.categories);
        loadBacktestInsights(data.reports || []);
      } else {
        throw new Error('Failed to load reports');
      }
    } catch (err) {
      setError('Failed to load reports. Please ensure the backend is running.');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };
  const handleDownloadReport = async (report: Report) => {
    try {
      if (!report.is_downloadable) {
        alert(`This ${report.type} file cannot be downloaded directly. Contact support for access.`);
        return;
      }
      const link = document.createElement('a');
      link.href = `/api/reports/download/${report.category}/${report.filename}`;
      link.download = report.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report');
    }
  };
  // Filter reports based on category and search term
  const filteredReports = reports.filter(report => {
    const matchesCategory = selectedCategory === 'all' || report.category === selectedCategory;
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  // Group reports by category for display
  const reportsByCategory = filteredReports.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, Report[]>);
  const getCategoryIcon = (iconName: string) => {
    const icons = {
      'chart-bar': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      'trending-up': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      'document': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      'shield-check': (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    };
    return icons[iconName as keyof typeof icons] || icons['document'];
  };
  const getCategoryColor = (color: string) => {
    const colors = {
      'blue': 'bg-blue-100 text-blue-700 border-blue-200',
      'green': 'bg-green-100 text-green-700 border-green-200',
      'purple': 'bg-purple-100 text-purple-700 border-purple-200',
      'orange': 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors['blue'];
  };
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <header className="section-header">
          <h1 className="section-title">Analytics & Reports</h1>
          <p className="section-description">Loading your model performance reports and analysis documents...</p>
        </header>
        <div className="flex flex-col items-center justify-center py-16">
          <div className="spinner mb-4"></div>
          <p className="text-sm text-ink-600">Discovering available reports...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <header className="section-header">
        <h1 className="section-title">Analytics & Reports</h1>
        <p className="section-description">
          Comprehensive model performance analysis and business intelligence reports
        </p>
      </header>
      <section className="card p-4 border border-border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink-900">Backtest Insights</p>
            <p className="text-xs text-ink-600">
              {loadingBacktest
                ? 'Loading backtest metrics...'
                : backtestInsights
                  ? 'Average model accuracy across recent validation folds'
                  : 'No backtest data available yet'}
            </p>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-xs uppercase text-ink-500">Avg SMAPE</p>
              <p className="text-xl font-semibold text-ink-900">
                {backtestInsights ? `${backtestInsights.avgSmape.toFixed(1)}%` : '--'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase text-ink-500">Avg MASE</p>
              <p className="text-xl font-semibold text-ink-900">
                {backtestInsights ? backtestInsights.avgMase.toFixed(2) : '--'}
              </p>
            </div>
          </div>
        </div>
        {backtestInsights && sparklinePoints && (
          <svg viewBox="0 0 100 40" className="w-full h-20 mt-4 text-primary-500">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              points={sparklinePoints}
            />
          </svg>
        )}
      </section>
      {error && (
        <div className="card p-4 border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      {/* Search and Filter Bar */}
      {reports.length > 0 && (
        <div className="card p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search reports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            {/* Category Filter */}
            <div className="sm:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input w-full"
              >
                <option value="all">All Categories</option>
                {Object.entries(categories).map(([key, category]) => (
                  <option key={key} value={key}>
                    {category.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      {/* Reports Summary */}
      {reports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-600">Total Reports</p>
                <p className="text-2xl font-bold text-ink-900">{filteredReports.length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-600">Categories</p>
                <p className="text-2xl font-bold text-ink-900">{Object.keys(categories).length}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-ink-600">Total Size</p>
                <p className="text-2xl font-bold text-ink-900">
                  {format_total_size(filteredReports.reduce((total, report) => total + report.size, 0))}
                </p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Reports by Category */}
      {filteredReports.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(reportsByCategory).map(([categoryKey, categoryReports]) => {
            const category = categories[categoryKey];
            if (!category) return null;
            return (
              <div key={categoryKey} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${getCategoryColor(category.color)} flex items-center justify-center`}>
                    {getCategoryIcon(category.icon)}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-ink-900">{category.title}</h2>
                    <p className="text-sm text-ink-600">{category.description}</p>
                  </div>
                  <div className="ml-auto">
                    <span className={`badge ${getCategoryColor(category.color)}`}>
                      {categoryReports.length} report{categoryReports.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {categoryReports.map((report) => (
                    <div key={report.id} className="card p-6 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={`w-8 h-8 rounded-lg ${getCategoryColor(category.color)} flex items-center justify-center flex-shrink-0`}>
                            {getCategoryIcon(category.icon)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-ink-900 mb-1">{report.name}</h3>
                            <p className="text-xs text-ink-600 mb-2">{report.description}</p>
                            <div className="flex items-center gap-4 text-xs text-ink-500">
                              <span className={`px-2 py-1 rounded-full bg-surface-100 border ${getCategoryColor(category.color)}`}>
                                {report.type}
                              </span>
                              <span>{report.size_formatted}</span>
                              <span>{new Date(report.modified).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-ink-500">
                          Modified: {new Date(report.modified).toLocaleDateString()}
                        </div>
                        <button
                          onClick={() => handleDownloadReport(report)}
                          disabled={!report.is_downloadable}
                          className={`btn-sm ${report.is_downloadable ? 'btn-primary' : 'btn-secondary opacity-50 cursor-not-allowed'}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{report.is_downloadable ? 'Download' : 'Preview'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : reports.length > 0 ? (
        <div className="card p-8">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-ink-900 mb-2">No Reports Match Your Search</h3>
            <p className="text-sm text-ink-600 mb-4">
              Try adjusting your search terms or category filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-8">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-ink-900 mb-2">No Reports Available</h3>
            <p className="text-sm text-ink-600 mb-6">
              Reports are generated automatically when you train models and run forecasts.
              Start by uploading data and training your first model.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/data" className="btn-primary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Data
              </a>
              <a href="/train" className="btn-secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Train Model
              </a>
            </div>
          </div>
        </div>
      )}
      {/* Info Notice */}
      {reports.length > 0 && (
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-blue-900">
              <strong className="font-semibold">Real Analytics:</strong> All reports are generated from your actual data and model training.
              Reports are automatically updated when you run new forecasts or backtests.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function format_total_size(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

import { useState, useEffect } from 'react';
import { formatIndianNumber } from '../../src/lib/api';
interface DataInsights {
  total_records: number;
  date_range: string;
  avg_daily_visits: number;
  data_quality_score: number;
  trends: {
    weekly_pattern: string[];
    monthly_growth: number;
    seasonal_peaks: string[];
  };
  gaps: string[];
  recommendations: string[];
}
interface RecentEntry {
  id: number;
  event_date: string;
  visits: number;
  created_at?: string;
}

interface ExportPreview {
  total_records: number;
  date_range: {
    start: string | null;
    end: string | null;
  };
  sample: RecentEntry[];
}
export function DataPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dataInsights, setDataInsights] = useState<DataInsights | null>(null);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [recentEntries, setRecentEntries] = useState<RecentEntry[]>([]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [entryMode, setEntryMode] = useState<'lite' | 'pro'>('lite');
  const [isProSubmitting, setIsProSubmitting] = useState(false);
  const [exportPreview, setExportPreview] = useState<ExportPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  useEffect(() => {
    loadDataInsights();
    loadRecentEntries();
    loadExportPreview();
  }, []);
  
  const loadDataInsights = async () => {
    setIsLoadingInsights(true);
    try {
      const response = await fetch('/api/data/insights');
      if (response.ok) {
        const insights = await response.json();
        setDataInsights(insights);
      }
    } catch (error) {
      console.error('Failed to load data insights:', error);
    } finally {
      setIsLoadingInsights(false);
    }
  };
  
  const loadRecentEntries = async () => {
    setIsLoadingRecent(true);
    try {
      const response = await fetch('/api/data/latest?limit=5');
      if (response.ok) {
        const data = await response.json();
        setRecentEntries(data.records || []);
      }
    } catch (error) {
      console.error('Failed to load recent entries:', error);
    } finally {
      setIsLoadingRecent(false);
    }
  };

  const loadExportPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const response = await fetch('/api/data/export/preview');
      if (response.ok) {
        const data = await response.json();
        setExportPreview({
          total_records: data.total_records || 0,
          date_range: data.date_range || { start: null, end: null },
          sample: data.sample || [],
        });
      }
    } catch (error) {
      console.error('Failed to load export preview:', error);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };
  
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };
  
  const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.json'))) {
      setSelectedFile(file);
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        setUploadProgress(100);
        setTimeout(() => {
          setIsUploading(false);
          setSelectedFile(null);
          setUploadProgress(0);
          showSuccessMessage('File uploaded successfully!');
          loadDataInsights();
          loadRecentEntries();
        }, 1000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };
  
  const handleQuickEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const dateValue = formData.get('date') as string;
    const visitsValue = formData.get('visits') as string;

    if (!dateValue || dateValue.trim() === '') {
      alert('Please select a date');
      setIsSubmitting(false);
      return;
    }
    if (!visitsValue || isNaN(parseInt(visitsValue, 10)) || parseInt(visitsValue, 10) < 0) {
      alert('Please enter a valid number of visitors (0 or greater)');
      setIsSubmitting(false);
      return;
    }
    const visitsNum = parseInt(visitsValue, 10);
    if (visitsNum > 99999) {
      alert('Please enter a number of visitors less than 100,000');
      setIsSubmitting(false);
      return;
    }
    const data = {
      event_date: dateValue,
      visits: visitsNum,
    };
    
    try {
      const response = await fetch('/api/data/add_today', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        e.currentTarget.reset();
        showSuccessMessage(`Successfully added ${data.visits} visitors for ${data.event_date}`);
        loadDataInsights();
        loadRecentEntries();
        loadExportPreview();
      } else {
        const error = await response.text();
        try {
          const errorData = JSON.parse(error);
          if (errorData.detail && Array.isArray(errorData.detail)) {
            const firstError = errorData.detail[0];
            if (firstError.loc && firstError.msg) {
              alert(`Invalid ${firstError.loc.join(' → ')}: ${firstError.msg}`);
            } else {
              alert(`Error: ${errorData.detail || 'Unknown validation error'}`);
            }
          } else {
            alert(`Error: ${errorData.detail || 'Unknown error occurred'}`);
          }
        } catch {
          alert(`Error: ${error}`);
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit data. Please ensure the backend is running.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProEntry = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsProSubmitting(true);
    const formData = new FormData(e.currentTarget);

    const dateValue = formData.get('pro_date') as string;
    const visitsValue = formData.get('pro_visits') as string;

    if (!dateValue) {
      alert('Please select a date');
      setIsProSubmitting(false);
      return;
    }

    const visitsNum = parseInt(visitsValue, 10);
    if (Number.isNaN(visitsNum) || visitsNum < 0) {
      alert('Please enter a valid number of visitors (0 or greater)');
      setIsProSubmitting(false);
      return;
    }

    const parseNumber = (value: FormDataEntryValue | null, scale = 1) => {
      if (value === null || value === '') return null;
      const parsed = parseFloat(value as string);
      return Number.isNaN(parsed) ? null : parsed * scale;
    };

    const payload = {
      event_date: dateValue,
      visits: visitsNum,
      sales: parseNumber(formData.get('sales')),
      conversion: parseNumber(formData.get('conversion'), 0.01),
      promo_type: (formData.get('promo_type') as string) || null,
      price_change: parseNumber(formData.get('price_change'), 0.01),
      weather: (formData.get('weather') as string) || null,
      paydays: formData.get('paydays') === 'on',
      school_breaks: formData.get('school_breaks') === 'on',
      local_events: (formData.get('local_events') as string) || null,
      open_hours: parseNumber(formData.get('open_hours')),
    };

    try {
      const response = await fetch('/api/data/add_today_pro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        e.currentTarget.reset();
        showSuccessMessage(`Successfully added Pro data for ${payload.event_date}`);
        loadDataInsights();
        loadRecentEntries();
        loadExportPreview();
      } else {
        const error = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        alert(`Pro data submission failed: ${error.detail || 'Unknown error occurred'}`);
      }
    } catch (error) {
      console.error('Pro submission error:', error);
      alert('Failed to submit Pro data. Please ensure the backend is running.');
    } finally {
      setIsProSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <header className="section-header">
        <h1 className="section-title text-ink-900">Store Data Management</h1>
        <p className="section-description">
          Monitor data quality, add entries, and upload historical data for accurate forecasting
        </p>
      </header>
      
      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-semibold text-green-800">{successMessage}</span>
          </div>
        </div>
      )}
      
      {/* Data Quality Overview */}
      <div className="card p-4 border-blue-200 bg-blue-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-blue-900">Data Status</h3>
              <p className="text-xs text-blue-700">
                {dataInsights?.total_records || 0} records • Score based on completeness (need 90+ days for 100%)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-20 h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-500 rounded-full"
                style={{ width: `${dataInsights?.data_quality_score || 0}%` }}
              ></div>
            </div>
            <span className="text-sm font-bold text-blue-700">
              {dataInsights?.data_quality_score || 0}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Total Records</p>
            <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-3xl font-black text-ink-900">
            {isLoadingInsights ? '...' : dataInsights?.total_records || 0}
          </p>
        </div>

        <div className="card p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Avg Daily Visitors</p>
            <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <p className="text-3xl font-black text-ink-900">
            {isLoadingInsights ? '...' : formatIndianNumber(Math.round(dataInsights?.avg_daily_visits || 0))}
          </p>
        </div>

        <div className="card p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Data Completeness</p>
            <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-black text-ink-900">
            {isLoadingInsights ? '...' : `${dataInsights?.data_quality_score || 0}%`}
          </p>
          <div className="mt-3">
            <div className="w-full bg-surface-200 rounded-full h-2">
              <div
                className="bg-ink-900 h-2 rounded-full transition-all duration-300"
                style={{ width: `${dataInsights?.data_quality_score || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="card p-5 border border-border">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-ink-600 uppercase tracking-wide">Monthly Growth</p>
            <svg className="w-6 h-6 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className={`text-3xl font-black ${(dataInsights?.trends?.monthly_growth ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {isLoadingInsights ? '...' : `${(dataInsights?.trends?.monthly_growth ?? 0) >= 0 ? '+' : ''}${dataInsights?.trends?.monthly_growth || 0}%`}
          </p>
        </div>
      </div>
      
      {/* Recommendations and Gaps */}
      {dataInsights && (dataInsights.recommendations.length > 0 || dataInsights.gaps.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {dataInsights.recommendations.length > 0 && (
            <div className="card p-6 border border-border">
              <h3 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Recommendations
              </h3>
              <div className="space-y-2">
                {dataInsights.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1 h-1 rounded-full bg-ink-600 mt-2 flex-shrink-0"></div>
                    <span className="text-ink-700">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {dataInsights.gaps.length > 0 && (
            <div className="card p-6 border border-border">
              <h3 className="text-sm font-bold text-ink-900 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Areas for Improvement
              </h3>
              <div className="space-y-2">
                {dataInsights.gaps.map((gap, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1 h-1 rounded-full bg-ink-600 mt-2 flex-shrink-0"></div>
                    <span className="text-ink-700">{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Recent Data Preview */}
      {recentEntries.length > 0 && (
        <div className="card p-6">
          <h2 className="text-sm font-bold text-ink-900 mb-4">Recent Entries</h2>
          <div className="overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Date</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Visitors</th>
                  <th className="text-right py-2 px-3 text-xs font-semibold text-ink-600 uppercase tracking-wide">Added</th>
                </tr>
              </thead>
              <tbody>
                {recentEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border hover:bg-surface-50">
                    <td className="py-3 px-3 text-sm text-ink-900 font-medium">
                      {new Date(entry.event_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3 text-sm text-ink-900 text-right font-bold">
                      {entry.visits.toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-sm text-ink-600 text-right">
                      {entry.created_at ? new Date(entry.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Entry Card */}
        <section className="card p-6">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-ink-900 mb-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Daily Data Entry
            </h2>
            <p className="text-sm text-ink-600">Add visitor counts for specific dates</p>
          </div>
          <div className="flex items-center gap-2 mb-4">
            {(['lite', 'pro'] as const).map((modeOption) => (
              <button
                key={modeOption}
                type="button"
                onClick={() => setEntryMode(modeOption)}
                className={`${entryMode === modeOption ? 'btn-primary' : 'btn-secondary'} text-xs px-4 py-2`}
              >
                {modeOption === 'lite' ? 'Lite Entry' : 'Pro Entry'}
              </button>
            ))}
          </div>
          {entryMode === 'lite' ? (
            <form onSubmit={handleQuickEntry} noValidate className="space-y-4">
              <div>
                <label htmlFor="date" className="block text-sm font-semibold text-ink-900 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  className="input"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  min="1900-01-01"
                  max="2100-12-31"
                  required
                />
                <p className="mt-1 text-xs text-ink-500">Select the date for this visitor count</p>
              </div>
              <div>
                <label htmlFor="visits" className="block text-sm font-semibold text-ink-900 mb-2">
                  Number of Visitors *
                </label>
                <input
                  type="number"
                  id="visits"
                  name="visits"
                  className="input"
                  placeholder="e.g. 450"
                  min="0"
                  max="99999"
                  required
                />
                <p className="mt-1.5 text-xs text-ink-500">
                  Total unique customers who visited your store (foot traffic count)
                </p>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary w-full"
              >
                {isSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    <span>Adding Entry...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Data Point</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleProEntry} noValidate className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="pro_date" className="block text-sm font-semibold text-ink-900 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    id="pro_date"
                    name="pro_date"
                    className="input"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                    max="2100-12-31"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="pro_visits" className="block text-sm font-semibold text-ink-900 mb-2">
                    Visitors *
                  </label>
                  <input
                    type="number"
                    id="pro_visits"
                    name="pro_visits"
                    className="input"
                    min="0"
                    max="99999"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="sales" className="block text-sm font-semibold text-ink-900 mb-2">
                    Sales (₹)
                  </label>
                  <input
                    type="number"
                    id="sales"
                    name="sales"
                    className="input"
                    placeholder="Total revenue"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label htmlFor="conversion" className="block text-sm font-semibold text-ink-900 mb-2">
                    Conversion (%)
                  </label>
                  <input
                    type="number"
                    id="conversion"
                    name="conversion"
                    className="input"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="e.g. 18"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="promo_type" className="block text-sm font-semibold text-ink-900 mb-2">
                    Promotion Type
                  </label>
                  <select id="promo_type" name="promo_type" className="input">
                    <option value="">None</option>
                    <option value="flash">Flash Sale</option>
                    <option value="percent_off">Percent Off</option>
                    <option value="bundle">Bundle Offer</option>
                    <option value="bogo">Buy One Get One</option>
                    <option value="other">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="price_change" className="block text-sm font-semibold text-ink-900 mb-2">
                    Price Change (%)
                  </label>
                  <input
                    type="number"
                    id="price_change"
                    name="price_change"
                    className="input"
                    min="-100"
                    max="100"
                    step="0.5"
                    placeholder="e.g. -5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="weather" className="block text-sm font-semibold text-ink-900 mb-2">
                    Weather Impact
                  </label>
                  <select id="weather" name="weather" className="input">
                    <option value="">Normal</option>
                    <option value="sunny">Sunny</option>
                    <option value="cloudy">Cloudy</option>
                    <option value="rainy">Rainy</option>
                    <option value="storm">Storm</option>
                    <option value="humid">Humid</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="open_hours" className="block text-sm font-semibold text-ink-900 mb-2">
                    Open Hours
                  </label>
                  <input
                    type="number"
                    id="open_hours"
                    name="open_hours"
                    className="input"
                    min="0"
                    max="24"
                    step="0.5"
                    placeholder="e.g. 12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-2 text-sm font-medium text-ink-800">
                  <input type="checkbox" name="paydays" className="form-checkbox" />
                  Payday Effect
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-ink-800">
                  <input type="checkbox" name="school_breaks" className="form-checkbox" />
                  School Breaks / Holidays
                </label>
              </div>
              <div>
                <label htmlFor="local_events" className="block text-sm font-semibold text-ink-900 mb-2">
                  Local Events
                </label>
                <textarea
                  id="local_events"
                  name="local_events"
                  className="input min-h-[80px]"
                  placeholder="Festivals, store events, nearby activities..."
                />
              </div>
              <button
                type="submit"
                disabled={isProSubmitting}
                className="btn-primary w-full"
              >
                {isProSubmitting ? (
                  <>
                    <span className="spinner"></span>
                    <span>Saving Pro Entry...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add Pro Data</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>
        
        {/* File Upload Card */}
        <section className="card p-6">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-ink-900 mb-1 flex items-center gap-2">
              <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Bulk Import
            </h2>
            <p className="text-sm text-ink-600">Upload historical data from CSV or JSON files</p>
          </div>
          <div className="space-y-4">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              className="relative"
            >
              <input
                type="file"
                id="file-upload"
                accept=".csv,.json,.xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />
              <label
                htmlFor="file-upload"
                className="block cursor-pointer rounded-xl border-2 border-dashed border-border hover:border-primary-300 hover:bg-surface-50 transition-all p-8 text-center"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-surface-100 flex items-center justify-center">
                    <svg className="w-6 h-6 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-900">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-ink-500 mt-1">CSV or JSON files only</p>
                  </div>
                </div>
              </label>
            </div>
            
            {isUploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-600">Uploading...</span>
                  <span className="font-semibold text-ink-900">{uploadProgress}%</span>
                </div>
                <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-600 transition-all duration-300 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            {selectedFile && !isUploading && (
              <button
                onClick={handleUpload}
                className="btn-primary w-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>Upload File</span>
              </button>
            )}
            
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-xs text-blue-900">
                  <strong className="font-bold">File format:</strong> Your file should have a date column and a visitor count column. You can also include weather or promotions if you track those.
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
      
      {/* Export Preview */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-ink-900 mb-1">Data Export</h2>
            <p className="text-sm text-ink-600">
              Download your dataset in CSV, JSON, or Excel with a quick preview of the latest records
            </p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary text-xs" onClick={() => loadExportPreview()}>
              Refresh
            </button>
          </div>
        </div>
        {isLoadingPreview ? (
          <div className="flex items-center gap-2 text-sm text-ink-600">
            <span className="spinner"></span>
            <span>Loading export preview...</span>
          </div>
        ) : exportPreview ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-xs uppercase text-ink-500">Total Records</p>
                <p className="text-xl font-semibold text-ink-900">{exportPreview.total_records}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-ink-500">Date Range</p>
                <p className="text-sm text-ink-900">
                  {exportPreview.date_range.start && exportPreview.date_range.end
                    ? `${exportPreview.date_range.start} → ${exportPreview.date_range.end}`
                    : 'No data yet'}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase text-ink-500">Sample Rows</p>
                <p className="text-sm text-ink-900">{exportPreview.sample.length}</p>
              </div>
            </div>
            {exportPreview.sample.length > 0 && (
              <div className="overflow-hidden border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-surface-100">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-ink-600">Date</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-ink-600">Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportPreview.sample.map((row) => (
                      <tr key={`${row.event_date}-${row.id}`} className="border-t border-border">
                        <td className="px-3 py-2 text-ink-900">{new Date(row.event_date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 text-right text-ink-900 font-medium">{row.visits.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap gap-3 mt-4">
              {['csv', 'json', 'xlsx'].map((format) => (
                <button
                  key={format}
                  type="button"
                  className="btn-secondary text-sm"
                  onClick={() => window.open(`/api/data/export?format=${format}`, '_blank')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Download {format.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-600">No data available to export yet.</p>
        )}
      </section>
      
      {/* Data Guidelines */}
      <section className="card p-6">
        <h2 className="text-sm font-bold text-ink-900 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Data Guidelines
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Date Format</h3>
                <p className="text-xs text-ink-600">Required</p>
              </div>
            </div>
            <p className="text-sm text-ink-700">Use <code className="bg-surface-200 px-1.5 py-0.5 rounded text-ink-800 font-mono text-xs">YYYY-MM-DD</code> format</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Data Volume</h3>
                <p className="text-xs text-ink-600">Recommended</p>
              </div>
            </div>
            <p className="text-sm text-ink-700">At least 90 days for best forecasting (3 months)</p>
          </div>
          <div className="p-4 rounded-xl bg-surface-100 border border-border">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-ink-900">Privacy</h3>
                <p className="text-xs text-ink-600">100% Local</p>
              </div>
            </div>
            <p className="text-sm text-ink-700">All data stored locally - never transmitted online</p>
          </div>
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-sm">
              <p className="font-bold text-amber-900 mb-1">Pro Tips:</p>
              <ul className="text-amber-800 space-y-1">
                <li>• Include weather data, promotions, or events for better forecasting</li>
                <li>• Regular daily entries improve model accuracy over time</li>
                <li>• Download templates from Setup Forecasting page for easy formatting</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

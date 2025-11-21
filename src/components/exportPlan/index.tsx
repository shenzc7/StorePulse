import { useState } from 'react';
interface StaffingShift {
  role: string;
  current: number;
  suggested: number;
  delta: number;
}
interface StockDelta {
  sku: string;
  name: string;
  current: number;
  suggested: number;
  delta: number;
}
interface ExportPlanProps {
  storeName: string;
  dateRange: string;
  p50Forecast: number;
  p10P90Note: string;
  staffingShifts?: StaffingShift[];
  stockDeltas?: StockDelta[];
  whatIfNotes?: string;
  onSuccess?: (filename: string) => void;
  onError?: (error: string) => void;
}
type ExportState = 'idle' | 'loading' | 'success' | 'error';
export function ExportPlan({
  storeName,
  dateRange,
  p50Forecast,
  p10P90Note,
  staffingShifts = [],
  stockDeltas = [],
  whatIfNotes,
  onSuccess,
  onError,
}: ExportPlanProps) {
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const handleExport = async () => {
    setExportState('loading');
    setErrorMessage('');
    try {
      const response = await fetch('/api/export/plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          store_name: storeName,
          date_range: dateRange,
          p50_forecast: p50Forecast,
          p10_p90_note: p10P90Note,
          staffing_shifts: staffingShifts,
          stock_deltas: stockDeltas,
          whatif_notes: whatIfNotes,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate PDF');
      }
      const result = await response.json();
      setDownloadUrl(`/api${result.download_url}`);
      setExportState('success');
      onSuccess?.(result.filename);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      setErrorMessage(errorMsg);
      setExportState('error');
      onError?.(errorMsg);
    }
  };
  const handleDownload = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
    }
  };
  const renderButton = () => {
    switch (exportState) {
      case 'loading':
        return (
          <button
            type="button"
            disabled
            className="btn-primary"
          >
            <span className="spinner"></span>
            <span>Generating PDF...</span>
          </button>
        );
      case 'success':
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-accent-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">PDF Generated</span>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="btn-primary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Download</span>
            </button>
          </div>
        );
      case 'error':
        return (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-danger-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium">Export Failed</span>
            </div>
            <p className="text-xs text-danger-600">{errorMessage}</p>
            <button
              type="button"
              onClick={handleExport}
              className="btn-secondary"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Try Again</span>
            </button>
          </div>
        );
      default:
        return (
          <button
            type="button"
            onClick={handleExport}
            className="btn-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-4-4m4 4l4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Export Plan (PDF)</span>
          </button>
        );
    }
  };
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-ink-900 mb-1">Store Operations Plan</h3>
          <p className="text-sm text-ink-600">
            Generate PDF with staffing and inventory recommendations
          </p>
        </div>
      </div>
      <div className="space-y-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-600">Store:</span>
          <span className="font-medium text-ink-900">{storeName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-600">Period:</span>
          <span className="font-medium text-ink-900">{dateRange}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-ink-600">Expected Visits:</span>
          <span className="font-semibold text-primary-600">{p50Forecast.toLocaleString()}</span>
        </div>
      </div>
      {whatIfNotes && (
        <div className="p-3 rounded-xl bg-primary-50 border border-primary-200 mb-4">
          <p className="text-sm text-primary-900">
            <span className="font-semibold">Scenario:</span> {whatIfNotes}
          </p>
        </div>
      )}
      {(staffingShifts.length > 0 || stockDeltas.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-4 border-b border-border">
          {staffingShifts.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-ink-900 mb-2">Staffing Changes</h4>
              <div className="space-y-1.5">
                {staffingShifts.slice(0, 3).map((shift) => (
                  <div key={shift.role} className="flex justify-between items-center text-sm">
                    <span className="text-ink-600">{shift.role}</span>
                    <span className={`font-medium ${
                      shift.delta > 0 ? 'text-accent-600' :
                      shift.delta < 0 ? 'text-danger-600' : 'text-ink-600'
                    }`}>
                      {shift.delta > 0 ? '+' : ''}{shift.delta}
                    </span>
                  </div>
                ))}
                {staffingShifts.length > 3 && (
                  <p className="text-xs text-ink-500">
                    +{staffingShifts.length - 3} more in PDF
                  </p>
                )}
              </div>
            </div>
          )}
          {stockDeltas.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-ink-900 mb-2">Top Stock Changes</h4>
              <div className="space-y-1.5">
                {stockDeltas.slice(0, 3).map((stock) => (
                  <div key={stock.sku} className="flex justify-between items-center text-sm">
                    <span className="text-ink-600 truncate">{stock.name}</span>
                    <span className={`font-medium ${
                      stock.delta > 0 ? 'text-accent-600' :
                      stock.delta < 0 ? 'text-danger-600' : 'text-ink-600'
                    }`}>
                      {stock.delta > 0 ? '+' : ''}{stock.delta}
                    </span>
                  </div>
                ))}
                {stockDeltas.length > 3 && (
                  <p className="text-xs text-ink-500">
                    +{stockDeltas.length - 3} more in PDF
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end">
        {renderButton()}
      </div>
    </div>
  );
}

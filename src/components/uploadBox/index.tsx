import { useCallback, useState } from 'react';
interface UploadBoxProps {
  onDrop: (file: File) => void;
  accept?: string;
}
export function UploadBox({ onDrop, accept = '.csv' }: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLLabelElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (file) {
        onDrop(file);
      }
    },
    [onDrop]
  );
  const handleSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onDrop(file);
      }
    },
    [onDrop]
  );
  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200 ${
        isDragging 
          ? 'border-primary-300 bg-primary-50' 
          : 'border-border hover:border-primary-300 hover:bg-primary-50'
      }`}
    >
      <input type="file" accept={accept} onChange={handleSelect} className="hidden" />
      <div className="w-12 h-12 rounded-xl bg-surface-200 flex items-center justify-center mb-3">
        <svg className="w-6 h-6 text-ink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-900 mb-1">Click to upload or drag and drop</p>
      <p className="text-xs text-ink-500">All data stays local and secure</p>
    </label>
  );
}

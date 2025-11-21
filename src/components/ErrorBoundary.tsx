import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface-50 p-6">
          <div className="max-w-md w-full bg-white border border-border rounded-2xl p-6 text-center shadow-xl">
            <h1 className="text-lg font-semibold text-danger-600 mb-2">Something went wrong</h1>
            <p className="text-sm text-ink-700 mb-4">
              {this.state.message || 'The interface encountered an unexpected error.'}
            </p>
            <button
              className="btn-primary"
              onClick={() => this.setState({ hasError: false, message: undefined })}
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

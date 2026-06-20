import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, retryKey: this.state.retryKey + 1 });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center bg-[#f3f3f3] p-8">
          <div className="text-center max-w-md">
            <div className="p-6 bg-[#FEE2E2] rounded-3xl inline-block mb-6">
              <AlertTriangle className="h-14 w-14 text-[#DC2626]" strokeWidth={1.5} />
            </div>
            <h2 className="text-2xl font-bold text-[#111827] mb-3">
              Щось пішло не так
            </h2>
            <p className="text-[#6B7280] mb-6 leading-relaxed">
              Сталася помилка при завантаженні сторінки. Спробуйте оновити додаток.
            </p>
            {this.state.error && (
              <p className="text-xs text-[#9CA3AF] mb-6 p-3 bg-[#F9FAFB] rounded-xl font-mono break-all">
                {this.state.error.message}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleRetry}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#447afc] hover:bg-[#3568d4] text-white text-base font-semibold transition-colors"
            >
              <RefreshCw className="h-4 w-4" strokeWidth={2} />
              Оновити
            </button>
          </div>
        </div>
      );
    }

    return <div key={this.state.retryKey}>{this.props.children}</div>;
  }
}

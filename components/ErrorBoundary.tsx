import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  showErrorDetails?: boolean;
  onReport?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // If onReport is provided, call it with error details
    if (this.props.onReport) {
      this.props.onReport(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReport = () => {
    if (this.props.onReport && this.state.error && this.state.errorInfo) {
      this.props.onReport(this.state.error, this.state.errorInfo);
    }
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-6 m-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Something went wrong
              </h2>
              <p className="text-red-600 dark:text-red-300 mb-4">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              
              {this.props.showErrorDetails && this.state.errorInfo && (
                <div className="mb-4">
                  <details className="text-sm">
                    <summary className="text-red-700 dark:text-red-300 cursor-pointer hover:underline mb-2">
                      Show error details
                    </summary>
                    <pre className="whitespace-pre-wrap font-mono text-xs bg-red-100 dark:bg-red-900/40 p-3 rounded-md overflow-auto max-h-48">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3">
                <button
                  className="inline-flex items-center px-4 py-2 bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 rounded hover:bg-red-200 dark:hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                  onClick={this.handleRetry}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
                </button>
                
                {this.props.onReport && (
                  <button
                    className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded hover:bg-red-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                    onClick={this.handleReport}
                  >
                    <Bug className="w-4 h-4 mr-2" />
                    Report issue
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 
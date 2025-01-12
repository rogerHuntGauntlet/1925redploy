import { ErrorInfo } from 'react';

interface ErrorReport {
  error: Error;
  errorInfo: ErrorInfo;
  timestamp: string;
  userAgent: string;
  url: string;
}

class ErrorReporting {
  private static instance: ErrorReporting;
  private errorQueue: ErrorReport[] = [];
  private isProcessing = false;

  private constructor() {
    // Private constructor to enforce singleton
    window.addEventListener('unload', () => this.flushErrors());
  }

  public static getInstance(): ErrorReporting {
    if (!ErrorReporting.instance) {
      ErrorReporting.instance = new ErrorReporting();
    }
    return ErrorReporting.instance;
  }

  public async reportError(error: Error, errorInfo: ErrorInfo): Promise<void> {
    const errorReport: ErrorReport = {
      error,
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.errorQueue.push(errorReport);
    await this.processErrorQueue();
  }

  private async processErrorQueue(): Promise<void> {
    if (this.isProcessing || this.errorQueue.length === 0) return;

    this.isProcessing = true;

    try {
      while (this.errorQueue.length > 0) {
        const report = this.errorQueue[0];
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
          console.group('Error Report');
          console.error(report.error);
          console.error('Component Stack:', report.errorInfo.componentStack);
          console.log('Timestamp:', report.timestamp);
          console.log('URL:', report.url);
          console.groupEnd();
        }

        // In production, you would send this to your error reporting service
        // Example with a hypothetical API endpoint:
        if (process.env.NODE_ENV === 'production') {
          try {
            await fetch('/api/error-reporting', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: report.error.message,
                stack: report.error.stack,
                componentStack: report.errorInfo.componentStack,
                timestamp: report.timestamp,
                userAgent: report.userAgent,
                url: report.url,
              }),
            });
          } catch (e) {
            console.error('Failed to send error report:', e);
          }
        }

        // Remove the processed error from the queue
        this.errorQueue.shift();
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async flushErrors(): Promise<void> {
    if (this.errorQueue.length > 0) {
      await this.processErrorQueue();
    }
  }
}

export const errorReporting = ErrorReporting.getInstance();

export const reportError = (error: Error, errorInfo: ErrorInfo): void => {
  errorReporting.reportError(error, errorInfo).catch(console.error);
}; 
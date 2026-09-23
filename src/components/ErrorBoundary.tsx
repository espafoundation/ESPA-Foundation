import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleClearDraftsAndReload = () => {
    try {
      localStorage.removeItem('espa_volunteer_form_draft');
      localStorage.removeItem('espa_ambassador_form_draft');
      localStorage.removeItem('espa_partner_form_draft');
      sessionStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      const isChunkLoadError = 
        this.state.error?.message?.includes('dynamically imported module') ||
        this.state.error?.message?.includes('Failed to fetch') ||
        this.state.error?.name === 'ChunkLoadError';

      return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 shadow-lg p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">
              {isChunkLoadError ? 'Updating Components' : 'Something went wrong'}
            </h2>
            <p className="text-stone-600 text-sm mb-4 leading-relaxed">
              {isChunkLoadError
                ? 'A newer version of the page was published or the connection briefly refreshed. Please reload to view the latest version.'
                : 'An unexpected display error occurred while rendering this page.'}
            </p>
            {this.state.error?.message && !isChunkLoadError && (
              <div className="mb-5 p-3 bg-red-50 border border-red-100 rounded-xl text-left text-xs font-mono text-red-700 break-words max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#003828] text-white px-6 py-2.5 rounded-full font-semibold text-sm border border-[#003828] hover:bg-white hover:text-[#003828] hover:border-[#003828] transition-colors cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                Reload Page
              </button>
              {!isChunkLoadError && (
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-stone-200 text-stone-700 px-5 py-2.5 rounded-full font-semibold text-sm hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Try Again
                </button>
              )}
            </div>
            {!isChunkLoadError && (
              <div className="mt-4 pt-4 border-t border-stone-100">
                <button
                  type="button"
                  onClick={this.handleClearDraftsAndReload}
                  className="text-xs text-stone-500 hover:text-red-700 hover:underline transition-colors cursor-pointer"
                >
                  Clear Saved Form Draft & Reload
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

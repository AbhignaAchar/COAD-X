import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[500px] flex items-center justify-center p-6">
          <div className="bg-white p-8 max-w-xl w-full border border-red-200 text-center space-y-4 rounded-2xl shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center mx-auto shadow-sm">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-[#0F2747] mb-1">
                Forensic Module Execution Interrupted
              </h3>
              <p className="text-xs text-slate-500">
                An unexpected exception occurred during evidence processing. The sandbox protected the core pipeline state.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-red-50/50 border border-red-200 text-left font-mono text-xs text-red-700 overflow-x-auto max-h-40">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="px-4 py-2 rounded-lg bg-[#0F8FB3] hover:bg-[#0d7ea0] text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Module</span>
              </button>
              {this.props.onNavigateDashboard && (
                <button
                  onClick={this.props.onNavigateDashboard}
                  className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-[#0F2747] border border-slate-200 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
                >
                  <Home className="w-4 h-4" />
                  <span>Return to Dashboard</span>
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

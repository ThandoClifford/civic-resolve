import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Page render error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-wrap">
          <div className="error-card">
            <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
            <p className="mb-4">{this.state.error?.message || 'An unexpected error occurred while rendering this page.'}</p>
            <button className="btn btn-primary" onClick={this.handleReset}>Try Again</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

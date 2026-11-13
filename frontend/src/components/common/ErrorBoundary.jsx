// Catches a crash anywhere inside it and shows a message instead of a blank white page.
// Catches a page's code failing to download, which happens if a new version was deployed while the tab was open.
import { Component } from 'react';
import { ErrorState } from './States';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  // Log the details for developers; the user only sees the friendly message
  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorState
          message="Something went wrong showing this page. Reloading usually fixes it."
          onRetry={() => window.location.reload()}
        />
      );
    }
    return this.props.children;
  }
}

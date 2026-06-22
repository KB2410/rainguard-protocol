import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    fetch('http://localhost:3001/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName: 'frontend_crash', error: error.message })
    }).catch(console.warn);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
          <h2>Oops, there was an error!</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Please refresh the app and try again.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

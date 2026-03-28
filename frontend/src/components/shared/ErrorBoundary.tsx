import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8 bg-background">
          <div className="max-w-lg w-full space-y-4">
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <span className="text-destructive text-xl">!</span>
            </div>
            <h1 className="text-2xl font-bold text-destructive">
              Something went wrong
            </h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error.message}
            </p>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-48 text-muted-foreground whitespace-pre-wrap">
              {this.state.error.stack}
            </pre>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={() => {
                this.setState({ error: null });
                window.location.href = "/";
              }}
            >
              Go back to home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
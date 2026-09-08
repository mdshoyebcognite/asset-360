import { Alert, AlertDescription } from '@cognite/aura/components/alert';
import { Button } from '@cognite/aura/components/button';
import { Component, type ErrorInfo, type ReactNode } from 'react';

type PanelErrorBoundaryProps = {
  children: ReactNode;
  panelName: string;
  onRetry?: () => void;
};

type PanelErrorBoundaryState = {
  hasError: boolean;
};

export class PanelErrorBoundary extends Component<
  PanelErrorBoundaryProps,
  PanelErrorBoundaryState
> {
  state: PanelErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): PanelErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`Panel error (${this.props.panelName}):`, error, info);
  }

  componentDidUpdate(prevProps: PanelErrorBoundaryProps): void {
    if (prevProps.children !== this.props.children && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Alert>
          <AlertDescription>
            Failed to render the {this.props.panelName} panel.
          </AlertDescription>
          <Button className="mt-3" variant="secondary" onClick={this.handleRetry}>
            Retry
          </Button>
        </Alert>
      );
    }

    return this.props.children;
  }
}

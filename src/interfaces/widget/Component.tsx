'use client';

import React, { useState, useCallback } from 'react';
import type { WidgetConfig, BubbleUser } from './types';

interface WidgetComponentProps {
  config: WidgetConfig;
  onEmit: (event: string, payload?: Record<string, unknown>) => void;
}

interface ActionState {
  loading: boolean;
  error: string | null;
  response: Record<string, unknown> | null;
}

export function Widget({ config, onEmit }: WidgetComponentProps) {
  const { props, services, isAuthenticated, debug } = config;
  const user: BubbleUser | undefined = props.user;
  const theme = props.theme ?? 'light';
  const mode = props.mode ?? 'embedded';

  const [actionState, setActionState] = useState<ActionState>({
    loading: false,
    error: null,
    response: null,
  });

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) {
        console.log('[Widget]', ...args);
      }
    },
    [debug]
  );

  const handleCallWorkflow = useCallback(async () => {
    setActionState({ loading: true, error: null, response: null });
    log('Calling Bubble workflow: example_workflow');

    try {
      const result = await services.callBubbleWorkflow('example_workflow', {
        timestamp: Date.now(),
        source: 'next-widget',
      });
      log('Workflow response:', result);
      setActionState({
        loading: false,
        error: null,
        response: result as Record<string, unknown>,
      });
      onEmit('workflow-complete', {
        workflow: 'example_workflow',
        result: result as Record<string, unknown>,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Workflow failed';
      log('Workflow error:', message);
      setActionState({ loading: false, error: message, response: null });
      onEmit('error', { type: 'workflow', message });
    }
  }, [services, log, onEmit]);

  const handleCallNextApi = useCallback(async () => {
    setActionState({ loading: true, error: null, response: null });
    log('Calling Next.js API');

    try {
      const result = await services.callNextApi('/api/health', {
        method: 'GET',
      });
      log('API response:', result);
      setActionState({
        loading: false,
        error: null,
        response: result as Record<string, unknown>,
      });
      onEmit('api-call-complete', {
        endpoint: '/api/health',
        result: result as Record<string, unknown>,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'API call failed';
      log('API error:', message);
      setActionState({ loading: false, error: message, response: null });
      onEmit('error', { type: 'api', message });
    }
  }, [services, log, onEmit]);

  const handleEmitAction = useCallback(() => {
    const payload = {
      action: 'button-clicked',
      timestamp: Date.now(),
      user: user?.id,
    };
    log('Emitting event to Bubble', payload);
    services.emitEvent('action', payload);
  }, [log, services, user]);

  const getUserInitials = (name?: string, email?: string): string => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return '?';
  };

  const cardClasses = ['widget-card', mode, theme].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      <div className="widget-header">
        <h3 className="widget-title">Next.js Widget</h3>
        <div className="widget-status">
          <span
            className={`status-dot ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`}
          />
          <span>{isAuthenticated ? 'Connected' : 'Guest'}</span>
        </div>
      </div>

      {user !== undefined && (
        <div className="user-info">
          <div className="user-avatar">
            {user.avatar !== undefined ? (
              <img
                src={user.avatar}
                alt={user.name !== undefined ? user.name : 'User'}
              />
            ) : (
              <span>{getUserInitials(user.name, user.email)}</span>
            )}
          </div>
          <div className="user-details">
            <p className="user-name">
              {user.name !== undefined ? user.name : 'User'}
            </p>
            <p className="user-email">
              {user.email !== undefined ? user.email : user.id}
            </p>
          </div>
        </div>
      )}

      {actionState.loading && (
        <div className="widget-loading">
          <div className="spinner" />
          <p className="loading-text">Processing...</p>
        </div>
      )}

      {actionState.error !== null && !actionState.loading && (
        <div className="widget-error">
          <p className="error-title">Error</p>
          <p className="error-message">{actionState.error}</p>
        </div>
      )}

      {actionState.response !== null && !actionState.loading && (
        <div className="response-display">
          <p className="response-label">Response</p>
          <pre className="response-content">
            {JSON.stringify(actionState.response, null, 2)}
          </pre>
        </div>
      )}

      {!actionState.loading && (
        <div className="widget-actions mt-4">
          <button
            className="widget-button primary"
            onClick={handleCallWorkflow}
            disabled={actionState.loading}
          >
            Call Bubble Workflow
          </button>

          <button
            className="widget-button secondary"
            onClick={handleCallNextApi}
            disabled={actionState.loading}
          >
            Call Next.js API
          </button>

          <button
            className="widget-button secondary"
            onClick={handleEmitAction}
            disabled={actionState.loading}
          >
            Emit Event to Bubble
          </button>
        </div>
      )}

      {debug && (
        <div className="response-display mt-4">
          <p className="response-label">Debug Info</p>
          <pre className="response-content">
            {JSON.stringify(
              {
                isAuthenticated,
                hasToken: services.getNextToken() !== null,
                bubbleBaseUrl: config.bubbleBaseUrl,
                propsKeys: Object.keys(props),
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; onError?: (error: Error) => void },
  ErrorBoundaryState
> {
  constructor(props: {
    children: React.ReactNode;
    onError?: (error: Error) => void;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Widget Error]', error, errorInfo);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="widget-card">
          <div className="widget-error">
            <p className="error-title">Widget Error</p>
            <p className="error-message">
              {this.state.error?.message ?? 'Something went wrong'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default Widget;

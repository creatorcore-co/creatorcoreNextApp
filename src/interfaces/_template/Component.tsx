'use client';

import React, { useState, useCallback } from 'react';
import type { {{INTERFACE_NAME}}Config } from './types';

interface {{INTERFACE_NAME}}ComponentProps {
  config: {{INTERFACE_NAME}}Config;
  onEmit: (event: string, payload?: Record<string, unknown>) => void;
}

/**
 * {{INTERFACE_NAME}} Component
 * Main UI component for the {{INTERFACE_NAME}} interface
 */
export function {{INTERFACE_NAME}}Component({
  config,
  onEmit,
}: {{INTERFACE_NAME}}ComponentProps) {
  const { props, services, isAuthenticated, debug } = config;
  const theme = props.theme ?? 'light';
  const mode = props.mode ?? 'embedded';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) console.log('[{{INTERFACE_NAME}}]', ...args);
    },
    [debug]
  );

  const handleAction = async () => {
    setLoading(true);
    setError(null);

    try {
      log('Calling Next.js API...');
      const result = await services.callNextApi('/api/health');
      log('API response:', result);
      onEmit('action', { type: 'api-call', result });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onEmit('error', { message });
    } finally {
      setLoading(false);
    }
  };

  const cardClasses = ['{{INTERFACE_NAME_KEBAB}}-card', mode, theme]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses}>
      <div className="{{INTERFACE_NAME_KEBAB}}-header">
        <h3 className="{{INTERFACE_NAME_KEBAB}}-title">{{INTERFACE_NAME}}</h3>
        <div className="{{INTERFACE_NAME_KEBAB}}-status">
          <span
            className={`status-dot ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`}
          />
          <span>{isAuthenticated ? 'Connected' : 'Guest'}</span>
        </div>
      </div>

      <div className="{{INTERFACE_NAME_KEBAB}}-content">
        {props.user && (
          <div className="{{INTERFACE_NAME_KEBAB}}-user">
            <p>Welcome, {props.user.name || props.user.email || 'User'}!</p>
          </div>
        )}

        <button
          className="{{INTERFACE_NAME_KEBAB}}-button"
          onClick={handleAction}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Test Action'}
        </button>

        {error && <div className="{{INTERFACE_NAME_KEBAB}}-error">{error}</div>}
      </div>
    </div>
  );
}

export default {{INTERFACE_NAME}}Component;

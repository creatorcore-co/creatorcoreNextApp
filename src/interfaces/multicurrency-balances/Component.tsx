'use client';

import React, { useState, useCallback } from 'react';
import type { MulticurrencyBalancesConfig } from './types';

interface MulticurrencyBalancesComponentProps {
  config: MulticurrencyBalancesConfig;
  onEmit: (event: string, payload?: Record<string, unknown>) => void;
}

/**
 * MulticurrencyBalances Component
 * Main UI component for the MulticurrencyBalances interface
 */
export function MulticurrencyBalancesComponent({
  config,
  onEmit,
}: MulticurrencyBalancesComponentProps) {
  const { props, services, isAuthenticated, debug } = config;
  const theme = props.theme ?? 'light';
  const mode = props.mode ?? 'embedded';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) console.log('[MulticurrencyBalances]', ...args);
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

  const cardClasses = ['multicurrency-balances-card', mode, theme]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses}>
      <div className="multicurrency-balances-header">
        <h3 className="multicurrency-balances-title">MulticurrencyBalances</h3>
        <div className="multicurrency-balances-status">
          <span
            className={`status-dot ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`}
          />
          <span>{isAuthenticated ? 'Connected' : 'Guest'}</span>
        </div>
      </div>

      <div className="multicurrency-balances-content">
        {props.user && (
          <div className="multicurrency-balances-user">
            <p>Welcome, {props.user.name || props.user.email || 'User'}!</p>
          </div>
        )}

        <button
          className="multicurrency-balances-button"
          onClick={handleAction}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Test Action'}
        </button>

        {error && <div className="multicurrency-balances-error">{error}</div>}
      </div>
    </div>
  );
}

export default MulticurrencyBalancesComponent;

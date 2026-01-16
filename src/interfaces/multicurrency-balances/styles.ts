/**
 * MulticurrencyBalances Styles
 * CSS-in-JS styles for the MulticurrencyBalances interface
 * Generated: 2026-01-16
 */

export const MulticurrencyBalancesStyles = `
/* MulticurrencyBalances Container Styles */

.multicurrency-balances-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  box-sizing: border-box;
}

.multicurrency-balances-container *,
.multicurrency-balances-container *::before,
.multicurrency-balances-container *::after {
  box-sizing: inherit;
}

/* Card */
.multicurrency-balances-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

/* Header */
.multicurrency-balances-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.multicurrency-balances-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* Status */
.multicurrency-balances-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.status-dot.authenticated {
  background-color: #10b981;
}

.status-dot.unauthenticated {
  background-color: #f59e0b;
}

/* Content */
.multicurrency-balances-content {
  padding: 12px 0;
}

.multicurrency-balances-user {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.multicurrency-balances-user p {
  margin: 0;
  color: #374151;
}

/* Button */
.multicurrency-balances-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.multicurrency-balances-button:hover:not(:disabled) {
  opacity: 0.9;
}

.multicurrency-balances-button:active:not(:disabled) {
  transform: scale(0.98);
}

.multicurrency-balances-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Error */
.multicurrency-balances-error {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

/* Dark Theme */
.multicurrency-balances-card.dark {
  background: #1f2937;
  color: #f9fafb;
}

.multicurrency-balances-card.dark .multicurrency-balances-header {
  border-bottom-color: #374151;
}

.multicurrency-balances-card.dark .multicurrency-balances-title {
  color: #f9fafb;
}

.multicurrency-balances-card.dark .multicurrency-balances-status {
  color: #9ca3af;
}

.multicurrency-balances-card.dark .multicurrency-balances-user {
  background: #374151;
}

.multicurrency-balances-card.dark .multicurrency-balances-user p {
  color: #e5e7eb;
}

.multicurrency-balances-card.dark .multicurrency-balances-error {
  background: #450a0a;
  border-color: #991b1b;
  color: #fca5a5;
}

/* Mode Variants */
.multicurrency-balances-card.compact {
  padding: 12px;
  max-width: 300px;
}

.multicurrency-balances-card.compact .multicurrency-balances-title {
  font-size: 14px;
}

.multicurrency-balances-card.full {
  max-width: 100%;
}
`;

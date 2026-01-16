/**
 * Widget Styles
 * CSS styles injected into the widget container (or shadow DOM)
 * These are bundled with the widget for style isolation
 */
export const WidgetStyles = `
/* Base styles for the widget container */
.next-widget-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  box-sizing: border-box;
}

.next-widget-container *,
.next-widget-container *::before,
.next-widget-container *::after {
  box-sizing: inherit;
}

/* Widget card */
.widget-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

.widget-card.compact {
  padding: 12px;
  max-width: 300px;
}

.widget-card.full {
  max-width: none;
  border-radius: 0;
}

/* Header */
.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.widget-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.widget-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
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

/* User info */
.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 500;
  color: #111827;
  margin: 0 0 2px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-email {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Actions */
.widget-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.widget-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.widget-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.widget-button.primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
}

.widget-button.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.widget-button.secondary {
  background: #f3f4f6;
  color: #374151;
}

.widget-button.secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

/* Loading state */
.widget-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  color: #6b7280;
  font-size: 14px;
}

/* Error state */
.widget-error {
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #991b1b;
}

.error-title {
  font-weight: 600;
  margin: 0 0 4px 0;
}

.error-message {
  font-size: 13px;
  margin: 0;
  color: #b91c1c;
}

/* Response display */
.response-display {
  margin-top: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.response-label {
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 8px 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.response-content {
  font-family: 'SF Mono', Monaco, 'Courier New', monospace;
  font-size: 12px;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

/* Dark theme */
.widget-card.dark {
  background: #1f2937;
  color: #f9fafb;
}

.widget-card.dark .widget-header {
  border-bottom-color: #374151;
}

.widget-card.dark .widget-title {
  color: #f9fafb;
}

.widget-card.dark .user-info {
  background: #374151;
}

.widget-card.dark .user-name {
  color: #f9fafb;
}

.widget-card.dark .user-email {
  color: #9ca3af;
}

.widget-card.dark .widget-button.secondary {
  background: #374151;
  color: #f9fafb;
}

.widget-card.dark .widget-button.secondary:hover:not(:disabled) {
  background: #4b5563;
}

.widget-card.dark .response-display {
  background: #374151;
  border-color: #4b5563;
}

.widget-card.dark .response-content {
  color: #e5e7eb;
}

/* Utility classes */
.text-muted {
  color: #6b7280;
}

.text-center {
  text-align: center;
}

.mt-2 {
  margin-top: 8px;
}

.mt-4 {
  margin-top: 16px;
}
`;

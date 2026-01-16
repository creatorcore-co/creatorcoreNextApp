/**
 * {{INTERFACE_NAME}} Styles
 * CSS-in-JS styles for the {{INTERFACE_NAME}} interface
 * Generated: {{DATE}}
 */

export const {{INTERFACE_NAME}}Styles = `
/* {{INTERFACE_NAME}} Container Styles */

.{{INTERFACE_NAME_KEBAB}}-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  box-sizing: border-box;
}

.{{INTERFACE_NAME_KEBAB}}-container *,
.{{INTERFACE_NAME_KEBAB}}-container *::before,
.{{INTERFACE_NAME_KEBAB}}-container *::after {
  box-sizing: inherit;
}

/* Card */
.{{INTERFACE_NAME_KEBAB}}-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

/* Header */
.{{INTERFACE_NAME_KEBAB}}-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.{{INTERFACE_NAME_KEBAB}}-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* Status */
.{{INTERFACE_NAME_KEBAB}}-status {
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
.{{INTERFACE_NAME_KEBAB}}-content {
  padding: 12px 0;
}

.{{INTERFACE_NAME_KEBAB}}-user {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.{{INTERFACE_NAME_KEBAB}}-user p {
  margin: 0;
  color: #374151;
}

/* Button */
.{{INTERFACE_NAME_KEBAB}}-button {
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

.{{INTERFACE_NAME_KEBAB}}-button:hover:not(:disabled) {
  opacity: 0.9;
}

.{{INTERFACE_NAME_KEBAB}}-button:active:not(:disabled) {
  transform: scale(0.98);
}

.{{INTERFACE_NAME_KEBAB}}-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Error */
.{{INTERFACE_NAME_KEBAB}}-error {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

/* Dark Theme */
.{{INTERFACE_NAME_KEBAB}}-card.dark {
  background: #1f2937;
  color: #f9fafb;
}

.{{INTERFACE_NAME_KEBAB}}-card.dark .{{INTERFACE_NAME_KEBAB}}-header {
  border-bottom-color: #374151;
}

.{{INTERFACE_NAME_KEBAB}}-card.dark .{{INTERFACE_NAME_KEBAB}}-title {
  color: #f9fafb;
}

.{{INTERFACE_NAME_KEBAB}}-card.dark .{{INTERFACE_NAME_KEBAB}}-status {
  color: #9ca3af;
}

.{{INTERFACE_NAME_KEBAB}}-card.dark .{{INTERFACE_NAME_KEBAB}}-user {
  background: #374151;
}

.{{INTERFACE_NAME_KEBAB}}-card.dark .{{INTERFACE_NAME_KEBAB}}-user p {
  color: #e5e7eb;
}

.{{INTERFACE_NAME_KEBAB}}-card.dark .{{INTERFACE_NAME_KEBAB}}-error {
  background: #450a0a;
  border-color: #991b1b;
  color: #fca5a5;
}

/* Mode Variants */
.{{INTERFACE_NAME_KEBAB}}-card.compact {
  padding: 12px;
  max-width: 300px;
}

.{{INTERFACE_NAME_KEBAB}}-card.compact .{{INTERFACE_NAME_KEBAB}}-title {
  font-size: 14px;
}

.{{INTERFACE_NAME_KEBAB}}-card.full {
  max-width: 100%;
}
`;

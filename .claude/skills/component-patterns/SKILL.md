---
name: component-patterns
description: |
  Use this skill when building UI components within interfaces. Covers
  styling patterns, state management, Tailwind usage, and reusable
  component creation.
---

# Component Patterns

This skill covers UI component development within CreatorCore interfaces, including CSS-in-JS patterns for Shadow DOM, state management, and building reusable components.

## Shadow DOM and Styling

### Why CSS-in-JS?

Interfaces render inside a Shadow DOM for style isolation. This means:
- External CSS files won't reach the interface
- Global styles won't affect the interface
- Interface styles won't leak to the host page

**Solution:** All styles must be defined in `styles.ts` and injected into the Shadow DOM.

### The Styles File Structure

```typescript
// src/interfaces/my-widget/styles.ts
export const MyWidgetStyles = `
/* All CSS goes in this template literal */
.my-widget-container {
  /* styles */
}
`;
```

### Style Injection (Handled by index.tsx)

The template's `index.tsx` injects styles into the Shadow DOM:

```typescript
// This happens automatically in index.tsx - don't modify
const styleElement = document.createElement('style');
styleElement.textContent = MyWidgetStyles;
shadowRoot.appendChild(styleElement);
```

## CSS-in-JS Patterns

### Container Reset

Always reset box-sizing for Shadow DOM:

```css
.my-widget-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  box-sizing: border-box;
}

.my-widget-container *,
.my-widget-container *::before,
.my-widget-container *::after {
  box-sizing: inherit;
}
```

### Class Naming Convention

**All classes MUST be prefixed with your interface name (kebab-case):**

```css
/* Good */
.my-widget-card { }
.my-widget-header { }
.my-widget-button { }
.my-widget-list-item { }

/* Bad - will cause conflicts */
.card { }
.header { }
.button { }
.list-item { }
```

### Theme Support

Always include both light and dark theme variants:

```css
/* Light theme (default) */
.my-widget-card {
  background: #ffffff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
}

/* Dark theme */
.my-widget-card.dark {
  background: #1f2937;
  color: #f9fafb;
  border-color: #374151;
}

/* Nested elements in dark theme */
.my-widget-card.dark .my-widget-title {
  color: #f9fafb;
}

.my-widget-card.dark .my-widget-subtitle {
  color: #9ca3af;
}
```

### Mode Variants

Support different display modes:

```css
/* Compact mode */
.my-widget-card.compact {
  padding: 12px;
  max-width: 300px;
}

.my-widget-card.compact .my-widget-title {
  font-size: 14px;
}

/* Full width mode */
.my-widget-card.full {
  max-width: 100%;
}

/* Embedded mode (no shadow) */
.my-widget-card.embedded {
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

.my-widget-card.dark.embedded {
  border-color: #374151;
}
```

### Applying Theme and Mode in Component

```typescript
export function MyWidgetComponent({ config }: Props) {
  const { props } = config;
  const theme = props.theme ?? 'light';
  const mode = props.mode ?? 'embedded';

  // Build class string
  const cardClasses = ['my-widget-card', theme, mode]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses}>
      {/* Content */}
    </div>
  );
}
```

## Common UI Components

### Buttons

```css
/* Primary button */
.my-widget-button {
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

.my-widget-button:hover:not(:disabled) {
  opacity: 0.9;
}

.my-widget-button:active:not(:disabled) {
  transform: scale(0.98);
}

.my-widget-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Secondary button */
.my-widget-button.secondary {
  background: #f3f4f6;
  color: #374151;
}

.my-widget-button.secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

/* Dark theme buttons */
.my-widget-card.dark .my-widget-button.secondary {
  background: #374151;
  color: #e5e7eb;
}

/* Size variants */
.my-widget-button.small {
  padding: 6px 12px;
  font-size: 12px;
}

.my-widget-button.large {
  padding: 14px 24px;
  font-size: 16px;
}
```

### Inputs

```css
.my-widget-input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  color: #1f2937;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.my-widget-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.my-widget-input::placeholder {
  color: #9ca3af;
}

.my-widget-input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
}

/* Error state */
.my-widget-input.error {
  border-color: #ef4444;
}

.my-widget-input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Dark theme */
.my-widget-card.dark .my-widget-input {
  background: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

.my-widget-card.dark .my-widget-input::placeholder {
  color: #6b7280;
}
```

### Cards and Lists

```css
/* List container */
.my-widget-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

/* List item */
.my-widget-list-item {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  cursor: pointer;
  transition: background 0.15s;
}

.my-widget-list-item:last-child {
  border-bottom: none;
}

.my-widget-list-item:hover {
  background: #f9fafb;
}

.my-widget-list-item.selected {
  background: #eef2ff;
  border-left: 3px solid #6366f1;
}

/* Dark theme */
.my-widget-card.dark .my-widget-list-item {
  border-bottom-color: #374151;
}

.my-widget-card.dark .my-widget-list-item:hover {
  background: #374151;
}

.my-widget-card.dark .my-widget-list-item.selected {
  background: #312e81;
}
```

### Status Indicators

```css
.my-widget-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.my-widget-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.my-widget-status-dot.success {
  background-color: #10b981;
}

.my-widget-status-dot.warning {
  background-color: #f59e0b;
}

.my-widget-status-dot.error {
  background-color: #ef4444;
}

.my-widget-status-dot.info {
  background-color: #3b82f6;
}

/* Animated pulse for active states */
.my-widget-status-dot.active {
  animation: my-widget-pulse 2s infinite;
}

@keyframes my-widget-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

### Loading States

```css
.my-widget-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6b7280;
}

.my-widget-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid #e5e7eb;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: my-widget-spin 0.8s linear infinite;
}

@keyframes my-widget-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Skeleton loading */
.my-widget-skeleton {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: my-widget-shimmer 1.5s infinite;
  border-radius: 4px;
}

@keyframes my-widget-shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* Dark theme */
.my-widget-card.dark .my-widget-loading {
  color: #9ca3af;
}

.my-widget-card.dark .my-widget-skeleton {
  background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
  background-size: 200% 100%;
}
```

### Error Display

```css
.my-widget-error {
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

.my-widget-error-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.my-widget-error-message {
  color: #b91c1c;
}

/* Dark theme */
.my-widget-card.dark .my-widget-error {
  background: #450a0a;
  border-color: #991b1b;
  color: #fca5a5;
}

.my-widget-card.dark .my-widget-error-message {
  color: #fecaca;
}
```

## React State Management

### Local State with useState

```typescript
const [items, setItems] = useState<Item[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

### Derived State

```typescript
const selectedItem = items.find(item => item.id === selectedId);
const hasItems = items.length > 0;
const filteredItems = items.filter(item => item.status === 'active');
```

### Loading/Error Pattern

```typescript
const [state, setState] = useState<{
  data: DataType | null;
  loading: boolean;
  error: string | null;
}>({
  data: null,
  loading: true,
  error: null,
});

const fetchData = async () => {
  setState(prev => ({ ...prev, loading: true, error: null }));

  try {
    const result = await services.callBubbleWorkflow('get_data');
    setState({ data: result, loading: false, error: null });
    onEmit('data-loaded', { success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load';
    setState(prev => ({ ...prev, loading: false, error: message }));
    onEmit('error', { message });
  }
};
```

### Form State

```typescript
interface FormData {
  name: string;
  email: string;
  message: string;
}

const [formData, setFormData] = useState<FormData>({
  name: '',
  email: '',
  message: '',
});

const [errors, setErrors] = useState<Partial<FormData>>({});

const handleChange = (field: keyof FormData) => (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  setFormData(prev => ({ ...prev, [field]: e.target.value }));
  // Clear error when user types
  setErrors(prev => ({ ...prev, [field]: undefined }));
};

const validate = (): boolean => {
  const newErrors: Partial<FormData> = {};

  if (!formData.name.trim()) newErrors.name = 'Name is required';
  if (!formData.email.trim()) newErrors.email = 'Email is required';
  else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';

  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!validate()) return;

  setSubmitting(true);
  try {
    await services.callBubbleWorkflow('submit_form', formData);
    onEmit('form-submitted', { formData });
    setFormData({ name: '', email: '', message: '' });
  } catch (err) {
    onEmit('error', { message: (err as Error).message });
  } finally {
    setSubmitting(false);
  }
};
```

## Effects and Side Effects

### Data Fetching on Mount

```typescript
useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const data = await services.callBubbleWorkflow('get_data');
      setData(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [services]); // Include services in deps
```

### Reacting to Prop Changes

```typescript
// Reload when user changes
useEffect(() => {
  if (props.user?.id) {
    loadUserData(props.user.id);
  }
}, [props.user?.id]);

// Update theme on prop change
useEffect(() => {
  document.documentElement.setAttribute('data-theme', props.theme ?? 'light');
}, [props.theme]);
```

### Cleanup

```typescript
useEffect(() => {
  const intervalId = setInterval(() => {
    refreshData();
  }, 30000);

  // Cleanup on unmount
  return () => clearInterval(intervalId);
}, []);
```

## Accessibility

### Focus Management

```css
/* Visible focus ring */
.my-widget-button:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}

.my-widget-input:focus-visible {
  outline: none; /* Using border instead */
  border-color: #6366f1;
}

/* Skip link for keyboard users */
.my-widget-skip-link {
  position: absolute;
  left: -9999px;
}

.my-widget-skip-link:focus {
  left: 0;
  top: 0;
  z-index: 100;
}
```

### ARIA Labels

```typescript
<button
  className="my-widget-button"
  aria-label="Save changes"
  aria-busy={loading}
  disabled={loading}
>
  {loading ? 'Saving...' : 'Save'}
</button>

<div
  role="alert"
  aria-live="polite"
  className="my-widget-error"
>
  {error}
</div>

<ul
  role="listbox"
  aria-label="Select an item"
>
  {items.map(item => (
    <li
      key={item.id}
      role="option"
      aria-selected={selectedId === item.id}
      onClick={() => handleSelect(item)}
    >
      {item.name}
    </li>
  ))}
</ul>
```

### Screen Reader Text

```css
.my-widget-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

```typescript
<span className="my-widget-sr-only">
  {loading ? 'Loading content' : 'Content loaded'}
</span>
```

## Responsive Design

```css
/* Mobile-first approach */
.my-widget-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}

/* Tablet and up */
@media (min-width: 640px) {
  .my-widget-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .my-widget-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Container queries (if supported) */
@container (min-width: 400px) {
  .my-widget-card {
    flex-direction: row;
  }
}
```

## Component Composition

### Reusable Sub-Components

```typescript
// Within your Component.tsx file

interface LoadingStateProps {
  message?: string;
}

function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="my-widget-loading">
      <div className="my-widget-spinner" />
      <span>{message}</span>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="my-widget-error">
      <div className="my-widget-error-title">Error</div>
      <div className="my-widget-error-message">{message}</div>
      {onRetry && (
        <button className="my-widget-button small" onClick={onRetry}>
          Try Again
        </button>
      )}
    </div>
  );
}

// Main component uses these
export function MyWidgetComponent({ config, onEmit }: Props) {
  const { loading, error, data } = state;

  if (loading) return <LoadingState message="Loading data..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <div className="my-widget-card">
      {/* Render data */}
    </div>
  );
}
```

### Render Props Pattern

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  emptyMessage?: string;
}

function List<T extends { id: string }>({
  items,
  renderItem,
  emptyMessage = 'No items',
}: ListProps<T>) {
  if (items.length === 0) {
    return <div className="my-widget-empty">{emptyMessage}</div>;
  }

  return (
    <ul className="my-widget-list">
      {items.map((item, index) => (
        <li key={item.id} className="my-widget-list-item">
          {renderItem(item, index)}
        </li>
      ))}
    </ul>
  );
}

// Usage
<List
  items={users}
  renderItem={(user) => (
    <div>
      <strong>{user.name}</strong>
      <span>{user.email}</span>
    </div>
  )}
  emptyMessage="No users found"
/>
```

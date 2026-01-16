# AI Agent Guide: Building Bubble.io Interfaces

This is a standalone guide for AI coding agents to build new interfaces in this Next.js repository. Each interface becomes an embeddable widget that integrates with Bubble.io through a custom plugin connector.

---

## Architecture Overview

This repository creates **embeddable React widgets** bundled as standalone JavaScript files. Each interface:

- Bundles into a single IIFE file (e.g., `my-feature.js`)
- Exposes a global object (e.g., `window.MyFeature`) with a `mount()` function
- Renders inside a Shadow DOM for complete style isolation
- Communicates with Bubble via DOM CustomEvents
- Receives services from Bubble to call APIs and workflows

### How It Works

```
Bubble.io Page
├── Loads: https://your-app.vercel.app/bundles/my-feature.js
├── Calls: window.MyFeature.mount(container, config)
├── Listens: document.addEventListener('my-feature:event-name', ...)
└── Provides: services object with API methods
```

---

## Directory Structure

```
src/
├── interfaces/                    # All widget interfaces
│   ├── _template/                 # Template (DO NOT MODIFY)
│   │   ├── index.tsx              # Mount logic
│   │   ├── Component.tsx          # UI template
│   │   ├── types.ts               # Type definitions
│   │   └── styles.ts              # CSS styles
│   │
│   └── {your-interface}/          # Your new interface
│       ├── index.tsx              # DO NOT MODIFY - handles mounting
│       ├── Component.tsx          # BUILD YOUR UI HERE
│       ├── types.ts               # Add custom types here
│       └── styles.ts              # Add custom styles here
│
├── shared/bubble/                 # Shared utilities (import from @/shared/bubble)
│   ├── types.ts                   # BubbleServices, BubbleUser, etc.
│   ├── logger.ts                  # Debug logging
│   └── event-emitter.ts           # Event dispatching
│
└── app/api/                       # Next.js API routes
    ├── auth/bubble-exchange/      # Token exchange endpoint
    └── health/                    # Health check
```

---

## Creating a New Interface

### Step 1: Scaffold the Interface

```bash
npm run create-interface my-feature
```

This creates `src/interfaces/my-feature/` with all required files.

**Naming conventions** (automatic):
- Input: `my-feature` or `MyFeature`
- Directory: `my-feature` (kebab-case)
- Component: `MyFeatureComponent` (PascalCase)
- Global: `window.MyFeature` (PascalCase)
- Events: `my-feature:event-name` (kebab-case prefix)
- CSS classes: `.my-feature-*` (kebab-case prefix)

### Step 2: Build Your UI in Component.tsx

**CRITICAL RULES:**
1. Build ALL your UI in `Component.tsx`
2. DO NOT modify `index.tsx` - it contains the mount logic
3. Use `services` for ALL API calls (never use fetch directly)
4. Emit events via `onEmit()` to communicate with Bubble
5. Prefix ALL CSS classes with your interface name (kebab-case)

---

## Component.tsx Template

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import type { MyFeatureConfig } from './types';

interface MyFeatureComponentProps {
  config: MyFeatureConfig;
  onEmit: (event: string, payload?: Record<string, unknown>) => void;
}

export function MyFeatureComponent({
  config,
  onEmit,
}: MyFeatureComponentProps) {
  // Destructure config
  const { props, services, isAuthenticated, debug } = config;
  const theme = props.theme ?? 'light';
  const mode = props.mode ?? 'embedded';

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug logger
  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) console.log('[MyFeature]', ...args);
    },
    [debug]
  );

  // Example action handler
  const handleAction = async () => {
    setLoading(true);
    setError(null);

    try {
      log('Calling API...');

      // Use services.callNextApi for Next.js endpoints
      const result = await services.callNextApi('/api/my-endpoint', {
        method: 'POST',
        body: JSON.stringify({ userId: props.user?.id })
      });

      log('API response:', result);

      // Emit event to Bubble
      onEmit('action-complete', { result });

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      onEmit('error', { message });
    } finally {
      setLoading(false);
    }
  };

  // Build class names with theme and mode
  const cardClasses = ['my-feature-card', mode, theme]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses}>
      <div className="my-feature-header">
        <h3 className="my-feature-title">My Feature</h3>
        <div className="my-feature-status">
          <span className={`status-dot ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`} />
          <span>{isAuthenticated ? 'Connected' : 'Guest'}</span>
        </div>
      </div>

      <div className="my-feature-content">
        {props.user && (
          <div className="my-feature-user">
            <p>Welcome, {props.user.name || props.user.email || 'User'}!</p>
          </div>
        )}

        <button
          className="my-feature-button"
          onClick={handleAction}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Take Action'}
        </button>

        {error && <div className="my-feature-error">{error}</div>}
      </div>
    </div>
  );
}

export default MyFeatureComponent;
```

---

## Types Definition (types.ts)

Your interface receives a config object with this structure:

```typescript
import type { BubbleServices, BubbleUser } from '@/shared/bubble';

// Configuration passed during mount
export interface MyFeatureConfig {
  props: MyFeatureProps;           // Data from Bubble
  services: BubbleServices;         // API methods
  nextApiBase: string;              // e.g., "https://your-app.vercel.app"
  bubbleAppName: string;            // e.g., "myapp"
  isAuthenticated: boolean;         // Auth state
  debug?: boolean;                  // Enable console logging
}

// Props from Bubble
export interface MyFeatureProps {
  user?: BubbleUser;                // User info
  theme?: 'light' | 'dark' | 'system';
  mode?: 'compact' | 'full' | 'embedded';
  customData?: Record<string, unknown>;  // Any additional data
}

// API returned from mount()
export interface MyFeatureAPI {
  update: (newProps: Partial<MyFeatureProps>) => void;
  unmount: () => void;
  emit: (eventName: string, payload?: Record<string, unknown>) => void;
}
```

### BubbleUser Type

```typescript
interface BubbleUser {
  id: string;
  email?: string;
  name?: string;
  avatar?: string;
  extraFields?: Record<string, unknown>;
}
```

---

## Services API Reference

The `services` object provides these methods:

### services.callNextApi(endpoint, options)
Call Next.js API routes. Auth token is included automatically.

```typescript
// GET request
const data = await services.callNextApi('/api/users');

// POST request
const result = await services.callNextApi('/api/save', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' })
});

// With custom headers
const result = await services.callNextApi('/api/upload', {
  method: 'POST',
  headers: { 'X-Custom-Header': 'value' },
  body: formData
});
```

### services.callBubbleWorkflow(name, params)
Trigger a Bubble backend workflow.

```typescript
// Call workflow with parameters
const result = await services.callBubbleWorkflow('process_order', {
  orderId: '123',
  action: 'confirm'
});

// Call workflow without parameters
const result = await services.callBubbleWorkflow('refresh_data');
```

### services.callBubbleDataApi(endpoint, options)
Call Bubble's Data API directly.

```typescript
// Get a list of items
const users = await services.callBubbleDataApi('/obj/user', {
  method: 'GET'
});

// Create an item
const newItem = await services.callBubbleDataApi('/obj/order', {
  method: 'POST',
  body: JSON.stringify({ status: 'pending' })
});

// Update an item
await services.callBubbleDataApi('/obj/order/123', {
  method: 'PATCH',
  body: JSON.stringify({ status: 'completed' })
});
```

### services.emitEvent(name, payload)
Emit event to Bubble (also available via `onEmit` prop).

```typescript
services.emitEvent('item-selected', { itemId: '123', itemName: 'Product' });
```

### services.isAuthenticated()
Check if user has valid auth token.

```typescript
if (services.isAuthenticated()) {
  // Show authenticated UI
} else {
  // Show login prompt
}
```

### services.getNextToken()
Get the current access token (rarely needed directly).

```typescript
const token = services.getNextToken();
```

---

## Event System

### Emitting Events to Bubble

Use the `onEmit` prop to notify Bubble of state changes:

```typescript
// Ready event (emitted automatically by index.tsx)
onEmit('ready', { mounted: true });

// Action events
onEmit('action', { type: 'button-click', data: { buttonId: 'submit' } });
onEmit('item-selected', { itemId: '123', itemData: { name: 'Product' } });
onEmit('form-submitted', { formData: { email: 'user@example.com' } });

// Error events
onEmit('error', { message: 'Failed to load data', code: 'LOAD_ERROR' });

// State change events
onEmit('state-changed', { loading: false, hasData: true });
```

### Event Name Format

Events are dispatched as DOM CustomEvents with the format:
```
{interface-name-kebab}:{event-name}
```

Examples:
- `my-feature:ready`
- `my-feature:action`
- `my-feature:item-selected`
- `my-feature:error`

### Listening in Bubble

Bubble listens for these events:
```javascript
document.addEventListener('my-feature:item-selected', (e) => {
  console.log('Item selected:', e.detail.payload);
  // e.detail = { event: 'item-selected', payload: {...}, timestamp: '...' }
});
```

---

## Styles (styles.ts)

**CRITICAL RULES:**
1. ALL classes MUST be prefixed with your interface name (kebab-case)
2. Styles are injected into Shadow DOM - no external CSS works
3. Include both light and dark theme variants
4. Include mode variants (compact, full, embedded)

```typescript
export const MyFeatureStyles = `
/* Container - reset box-sizing */
.my-feature-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  box-sizing: border-box;
}

.my-feature-container *,
.my-feature-container *::before,
.my-feature-container *::after {
  box-sizing: inherit;
}

/* Main Card */
.my-feature-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

/* Header */
.my-feature-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.my-feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* Status indicator */
.my-feature-status {
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

/* Content area */
.my-feature-content {
  padding: 12px 0;
}

/* User info */
.my-feature-user {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.my-feature-user p {
  margin: 0;
  color: #374151;
}

/* Buttons */
.my-feature-button {
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

.my-feature-button:hover:not(:disabled) {
  opacity: 0.9;
}

.my-feature-button:active:not(:disabled) {
  transform: scale(0.98);
}

.my-feature-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Secondary button variant */
.my-feature-button.secondary {
  background: #f3f4f6;
  color: #374151;
}

.my-feature-button.secondary:hover:not(:disabled) {
  background: #e5e7eb;
}

/* Error display */
.my-feature-error {
  margin-top: 12px;
  padding: 12px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 13px;
}

/* ================================
   DARK THEME
   ================================ */
.my-feature-card.dark {
  background: #1f2937;
  color: #f9fafb;
}

.my-feature-card.dark .my-feature-header {
  border-bottom-color: #374151;
}

.my-feature-card.dark .my-feature-title {
  color: #f9fafb;
}

.my-feature-card.dark .my-feature-status {
  color: #9ca3af;
}

.my-feature-card.dark .my-feature-user {
  background: #374151;
}

.my-feature-card.dark .my-feature-user p {
  color: #e5e7eb;
}

.my-feature-card.dark .my-feature-error {
  background: #450a0a;
  border-color: #991b1b;
  color: #fca5a5;
}

.my-feature-card.dark .my-feature-button.secondary {
  background: #374151;
  color: #e5e7eb;
}

/* ================================
   MODE VARIANTS
   ================================ */
.my-feature-card.compact {
  padding: 12px;
  max-width: 300px;
}

.my-feature-card.compact .my-feature-title {
  font-size: 14px;
}

.my-feature-card.full {
  max-width: 100%;
}

.my-feature-card.embedded {
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

.my-feature-card.dark.embedded {
  border-color: #374151;
}
`;
```

---

## Common Patterns

### Loading State with Error Handling

```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [data, setData] = useState<DataType | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);

  try {
    const result = await services.callNextApi('/api/data');
    setData(result);
    onEmit('data-loaded', { count: result.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load';
    setError(message);
    onEmit('error', { message, operation: 'fetch-data' });
  } finally {
    setLoading(false);
  }
};
```

### Form Submission

```typescript
const [formData, setFormData] = useState({ name: '', email: '' });
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);

  onEmit('form-submitting', { formId: 'user-form' });

  try {
    const result = await services.callNextApi('/api/submit', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    onEmit('form-submitted', { result });

    // Optionally trigger Bubble workflow
    await services.callBubbleWorkflow('process_submission', {
      submissionId: result.id
    });

  } catch (err) {
    onEmit('form-error', { message: (err as Error).message });
  } finally {
    setSubmitting(false);
  }
};
```

### Conditional Rendering by Auth State

```typescript
if (!isAuthenticated) {
  return (
    <div className="my-feature-card">
      <p>Please log in to continue</p>
      <button onClick={() => onEmit('login-required', {})}>
        Log In
      </button>
    </div>
  );
}

// Authenticated UI
return (
  <div className="my-feature-card">
    <p>Welcome back, {props.user?.name}!</p>
    {/* ... */}
  </div>
);
```

### List with Selection

```typescript
const [items, setItems] = useState<Item[]>([]);
const [selectedId, setSelectedId] = useState<string | null>(null);

const handleSelect = (item: Item) => {
  setSelectedId(item.id);
  onEmit('item-selected', {
    itemId: item.id,
    itemData: item
  });
};

return (
  <ul className="my-feature-list">
    {items.map(item => (
      <li
        key={item.id}
        className={`my-feature-list-item ${selectedId === item.id ? 'selected' : ''}`}
        onClick={() => handleSelect(item)}
      >
        {item.name}
      </li>
    ))}
  </ul>
);
```

### Theme-Aware Styling

```typescript
const { theme = 'light' } = props;

// Apply theme class
const cardClasses = `my-feature-card ${theme}`;

// Or conditional styling
const backgroundColor = theme === 'dark' ? '#1f2937' : '#ffffff';
```

---

## Build and Deploy

### Build Commands

```bash
# Build all interfaces to public/bundles/
npm run build:interfaces

# Build Next.js app + all interfaces
npm run build:all

# Development server (test locally)
npm run dev

# Lint check
npm run lint
```

### Output

After `npm run build:interfaces`:
```
public/
└── bundles/
    ├── widget.js        # Original widget
    └── my-feature.js    # Your new interface
```

### Vercel Deployment

1. Push to GitHub
2. Vercel auto-deploys (or run `vercel --prod`)
3. Interface available at: `https://your-app.vercel.app/bundles/my-feature.js`

---

## Bubble Plugin Integration

### Loading the Interface

In Bubble HTML element:
```html
<div id="my-feature-container"></div>
<script src="https://your-app.vercel.app/bundles/my-feature.js"></script>
<script>
  const feature = window.MyFeature.mount(
    document.getElementById('my-feature-container'),
    {
      props: {
        user: {
          id: 'BUBBLE_USER_ID',
          name: 'BUBBLE_USER_NAME',
          email: 'BUBBLE_USER_EMAIL'
        },
        theme: 'light',
        mode: 'embedded',
        customData: {
          // Any data from Bubble
        }
      },
      services: {
        callBubbleWorkflow: async (name, params) => {
          return fetch(`https://YOUR_APP.bubbleapps.io/api/1.1/wf/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
          }).then(r => r.json());
        },
        callBubbleDataApi: async (endpoint, options) => {
          return fetch(`https://YOUR_APP.bubbleapps.io/api/1.1${endpoint}`, options)
            .then(r => r.json());
        },
        callNextApi: async (endpoint, options) => {
          const token = localStorage.getItem('nextAccessToken');
          return fetch(`https://your-app.vercel.app${endpoint}`, {
            ...options,
            headers: {
              ...options?.headers,
              'Authorization': token ? `Bearer ${token}` : '',
              'Content-Type': 'application/json'
            }
          }).then(r => r.json());
        },
        emitEvent: (name, payload) => {
          // Bubble's custom event handler
          bubble_fn_emitEvent(name, payload);
        },
        getNextToken: () => localStorage.getItem('nextAccessToken'),
        isAuthenticated: () => !!localStorage.getItem('nextAccessToken')
      },
      nextApiBase: 'https://your-app.vercel.app',
      bubbleAppName: 'your-bubble-app',
      isAuthenticated: !!localStorage.getItem('nextAccessToken'),
      debug: true
    }
  );

  // Store reference for updates
  window.myFeatureInstance = feature;
</script>
```

### Listening for Events in Bubble

```javascript
// Listen for interface events
document.addEventListener('my-feature:ready', (e) => {
  console.log('Interface ready:', e.detail);
});

document.addEventListener('my-feature:action', (e) => {
  console.log('Action:', e.detail.payload);
  // Trigger Bubble workflow based on action
});

document.addEventListener('my-feature:error', (e) => {
  console.error('Error:', e.detail.payload.message);
  // Show error in Bubble UI
});

document.addEventListener('my-feature:item-selected', (e) => {
  const { itemId, itemData } = e.detail.payload;
  // Update Bubble state with selected item
});
```

### Updating the Interface from Bubble

```javascript
// Update props
window.myFeatureInstance.update({
  theme: 'dark',
  customData: { newKey: 'newValue' }
});

// Emit event programmatically
window.myFeatureInstance.emit('refresh-requested', {});

// Unmount when done
window.myFeatureInstance.unmount();
```

---

## Best Practices

### DO:
- Build all UI in `Component.tsx`
- Use `services` for ALL API calls
- Emit events for ALL state changes Bubble needs to know about
- Prefix ALL CSS classes with interface name
- Include both light and dark theme styles
- Handle loading and error states
- Use TypeScript strictly
- Test locally before building

### DON'T:
- Modify `index.tsx`
- Use `fetch()` directly (use `services.callNextApi()`)
- Store sensitive data in component state
- Use external stylesheets or CSS imports
- Use unprefixed CSS class names
- Skip error handling
- Emit events without payloads when data is available

---

## Troubleshooting

### Build Errors
- Check all imports use `@/` alias
- Ensure types.ts exports match Component.tsx imports
- Run `npm run lint` for TypeScript errors

### Styles Not Working
- Verify all classes are prefixed with interface name
- Check styles are in `styles.ts` (not external CSS)
- Ensure Shadow DOM container class is applied

### Events Not Reaching Bubble
- Check browser console for event dispatch logs
- Verify event name format: `{interface-name}:{event}`
- Ensure Bubble listener uses exact event name

### API Calls Failing
- Use `services.callNextApi()` (not fetch)
- Check API route exists and handles CORS
- Verify auth token (may be expired)
- Check debug logs with `debug: true`

### Interface Not Mounting
- Verify container element exists
- Check script URL is correct
- Look for JavaScript errors in console
- Ensure config object has all required fields

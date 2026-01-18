---
name: create-interface
description: |
  Use this skill when asked to create a new embeddable interface/widget for
  Bubble.io integration. Covers scaffolding, component structure, styling,
  typing, and event communication.
---

# Creating Interfaces

This skill covers the complete process of creating a new embeddable interface (widget) for Bubble.io integration in the CreatorCore system.

## Overview

Each interface in CreatorCore:
- Lives in `src/interfaces/{name}/`
- Compiles to `public/bundles/{name}.js` as an IIFE bundle
- Exposes `window.{InterfaceName}` with a `mount()` function
- Uses Shadow DOM for style isolation
- Communicates with Bubble via DOM CustomEvents

## Step 1: Scaffold the Interface

Run the create-interface script:

```bash
npm run create-interface <interface-name>
```

Example:
```bash
npm run create-interface user-dashboard
```

This creates:
```
src/interfaces/user-dashboard/
├── index.tsx       # Mount logic (DO NOT MODIFY)
├── Component.tsx   # Your UI component (BUILD HERE)
├── types.ts        # TypeScript definitions (EXTEND AS NEEDED)
├── styles.ts       # CSS-in-JS styles (BUILD HERE)
├── package.json    # Interface metadata
└── README.md       # Interface documentation
```

### Naming Convention

The script converts your input to:
- **Directory**: `user-dashboard` (kebab-case)
- **Component**: `UserDashboardComponent` (PascalCase)
- **Global**: `window.UserDashboard` (PascalCase)
- **Events**: `user-dashboard:event-name` (kebab-case prefix)
- **CSS classes**: `.user-dashboard-*` (kebab-case prefix)

## Step 2: Understand the File Structure

### index.tsx (DO NOT MODIFY)

This file handles:
- Creating Shadow DOM for style isolation
- Injecting styles into the shadow root
- Creating React root and rendering the component
- Setting up the event emitter
- Exposing the public API (update, unmount, emit)

The file is auto-generated from the template. Never modify it.

### Component.tsx (BUILD YOUR UI HERE)

This is where you implement your interface's UI. Here's the template structure:

```tsx
'use client';

import React, { useState, useCallback } from 'react';
import type { UserDashboardConfig } from './types';

interface UserDashboardComponentProps {
  config: UserDashboardConfig;
  onEmit: (event: string, payload?: Record<string, unknown>) => void;
}

export function UserDashboardComponent({
  config,
  onEmit,
}: UserDashboardComponentProps) {
  // Destructure config
  const { props, services, isAuthenticated, debug } = config;
  const theme = props.theme ?? 'light';
  const mode = props.mode ?? 'embedded';

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<YourDataType | null>(null);

  // Debug logger
  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) console.log('[UserDashboard]', ...args);
    },
    [debug]
  );

  // Load data on mount
  React.useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        log('Loading dashboard data...');
        const result = await services.callBubbleWorkflow('get_dashboard_data', {
          userId: props.user?.id,
        });

        setData(result);
        onEmit('data-loaded', { itemCount: result.items?.length ?? 0 });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load';
        setError(message);
        onEmit('error', { message, operation: 'load-data' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [services, props.user?.id, log, onEmit]);

  // Event handler
  const handleItemClick = (item: ItemType) => {
    onEmit('item-selected', { itemId: item.id, itemData: item });
  };

  // Build class names
  const cardClasses = ['user-dashboard-card', mode, theme]
    .filter(Boolean)
    .join(' ');

  // Render loading state
  if (loading) {
    return (
      <div className={cardClasses}>
        <div className="user-dashboard-loading">Loading...</div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={cardClasses}>
        <div className="user-dashboard-error">{error}</div>
      </div>
    );
  }

  // Render main UI
  return (
    <div className={cardClasses}>
      <div className="user-dashboard-header">
        <h3 className="user-dashboard-title">Dashboard</h3>
        <div className="user-dashboard-status">
          <span className={`status-dot ${isAuthenticated ? 'authenticated' : 'unauthenticated'}`} />
          <span>{isAuthenticated ? 'Connected' : 'Guest'}</span>
        </div>
      </div>

      <div className="user-dashboard-content">
        {props.user && (
          <div className="user-dashboard-user">
            <p>Welcome, {props.user.name || props.user.email || 'User'}!</p>
          </div>
        )}

        {/* Your UI content here */}
      </div>
    </div>
  );
}

export default UserDashboardComponent;
```

### types.ts (TYPE DEFINITIONS)

Define your interface's types here:

```typescript
import type { BubbleServices, BubbleUser } from '@/shared/bubble';

// Configuration passed during mount
export interface UserDashboardConfig {
  /** Props passed from Bubble */
  props: UserDashboardProps;

  /** Service functions for API calls and events */
  services: BubbleServices;

  /** Base URL for Next.js API calls */
  nextApiBase: string;

  /** Bubble app name */
  bubbleAppName: string;

  /** Whether the user is authenticated */
  isAuthenticated: boolean;

  /** Enable debug logging */
  debug?: boolean;
}

// Props from Bubble - customize these for your interface
export interface UserDashboardProps {
  /** User information from Bubble */
  user?: BubbleUser;

  /** Current theme */
  theme?: 'light' | 'dark' | 'system';

  /** Display mode */
  mode?: 'compact' | 'full' | 'embedded';

  /** Custom data from Bubble - add specific fields */
  customData?: {
    organizationId?: string;
    permissions?: string[];
    settings?: Record<string, unknown>;
  };
}

// API returned from mount() - usually don't modify
export interface UserDashboardAPI {
  update: (newProps: Partial<UserDashboardProps>) => void;
  unmount: () => void;
  emit: (eventName: string, payload?: Record<string, unknown>) => void;
}

// Add your custom types below
export interface DashboardItem {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'pending' | 'completed';
  createdAt: string;
}

export interface DashboardStats {
  totalItems: number;
  activeItems: number;
  completedItems: number;
}
```

### styles.ts (CSS-IN-JS STYLES)

**Critical Rules:**
1. ALL classes MUST be prefixed with your interface name (kebab-case)
2. Include BOTH light and dark theme variants
3. Include mode variants (compact, full, embedded)
4. Reset box-sizing for Shadow DOM isolation

```typescript
export const UserDashboardStyles = `
/* Container - reset box-sizing for Shadow DOM */
.user-dashboard-container {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #1f2937;
  box-sizing: border-box;
}

.user-dashboard-container *,
.user-dashboard-container *::before,
.user-dashboard-container *::after {
  box-sizing: inherit;
}

/* Main Card */
.user-dashboard-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 20px;
  max-width: 400px;
  margin: 0 auto;
}

/* Header */
.user-dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e7eb;
}

.user-dashboard-title {
  font-size: 16px;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

/* Status indicator */
.user-dashboard-status {
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
.user-dashboard-content {
  padding: 12px 0;
}

/* User info */
.user-dashboard-user {
  margin-bottom: 16px;
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
}

.user-dashboard-user p {
  margin: 0;
  color: #374151;
}

/* Buttons */
.user-dashboard-button {
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

.user-dashboard-button:hover:not(:disabled) {
  opacity: 0.9;
}

.user-dashboard-button:active:not(:disabled) {
  transform: scale(0.98);
}

.user-dashboard-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Loading state */
.user-dashboard-loading {
  padding: 40px;
  text-align: center;
  color: #6b7280;
}

/* Error display */
.user-dashboard-error {
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
.user-dashboard-card.dark {
  background: #1f2937;
  color: #f9fafb;
}

.user-dashboard-card.dark .user-dashboard-header {
  border-bottom-color: #374151;
}

.user-dashboard-card.dark .user-dashboard-title {
  color: #f9fafb;
}

.user-dashboard-card.dark .user-dashboard-status {
  color: #9ca3af;
}

.user-dashboard-card.dark .user-dashboard-user {
  background: #374151;
}

.user-dashboard-card.dark .user-dashboard-user p {
  color: #e5e7eb;
}

.user-dashboard-card.dark .user-dashboard-loading {
  color: #9ca3af;
}

.user-dashboard-card.dark .user-dashboard-error {
  background: #450a0a;
  border-color: #991b1b;
  color: #fca5a5;
}

/* ================================
   MODE VARIANTS
   ================================ */
.user-dashboard-card.compact {
  padding: 12px;
  max-width: 300px;
}

.user-dashboard-card.compact .user-dashboard-title {
  font-size: 14px;
}

.user-dashboard-card.full {
  max-width: 100%;
}

.user-dashboard-card.embedded {
  box-shadow: none;
  border: 1px solid #e5e7eb;
}

.user-dashboard-card.dark.embedded {
  border-color: #374151;
}
`;
```

## Step 3: Prepare Backend Workflows

Before building your interface, ensure the Bubble backend workflows are ready:

### Option A: User Provides Workflow Specifications

If the user has already created workflows in Bubble, use the workflow-discovery tool to get the exact response format:

```bash
npm run discover-workflow get_dashboard_data --body='{"user_id":"123"}'
```

### Option B: Design Workflows for User

If the user hasn't set up backend workflows yet, design the specifications for them:

1. Analyze the interface requirements to identify data and actions needed
2. Design workflow specs with parameters and response formats
3. Present the specs to the user to create in Bubble
4. Once created, use workflow-discovery to verify they work

See the [workflow-design skill](../workflow-design/SKILL.md) for detailed workflow design patterns.

## Step 4: Using the Services Object

The `services` object is provided by Bubble at mount time. Use it for ALL API calls:

```typescript
// Call a Bubble workflow
const result = await services.callBubbleWorkflow('workflow_name', {
  param1: 'value1',
  param2: 'value2',
});

// Call Bubble Data API
const items = await services.callBubbleDataApi('/obj/items', {
  method: 'GET',
});

// Call Next.js API (token included automatically)
const data = await services.callNextApi('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
});

// Check authentication status
if (services.isAuthenticated()) {
  // User is authenticated
}

// Get the access token (rarely needed directly)
const token = services.getNextToken();
```

See the [bubble-integration skill](../bubble-integration/SKILL.md) for complete API reference.

## Step 5: Emitting Events

Use `onEmit` to notify Bubble of state changes:

```typescript
// Data loaded
onEmit('data-loaded', { count: items.length, timestamp: Date.now() });

// User action
onEmit('item-selected', { itemId: '123', itemData: item });
onEmit('button-clicked', { buttonId: 'submit', action: 'save' });

// Form submission
onEmit('form-submitted', { formData: { name, email } });

// Errors
onEmit('error', { message: 'Failed to save', code: 'SAVE_ERROR' });

// State changes
onEmit('loading-changed', { loading: true });
onEmit('auth-required', { reason: 'session-expired' });
```

Events are dispatched as DOM CustomEvents with format: `{interface-name}:{event-name}`

Example: `user-dashboard:item-selected`

## Step 6: Build and Test

### Build the interface

```bash
# Build all interfaces
npm run build:interfaces

# Build only this interface (if using selective builds)
npm run build:interfaces -- --only=user-dashboard
```

### Test locally

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000` (the demo page)
3. Or create a test HTML file that loads your bundle

### Verify the bundle

```bash
ls -la public/bundles/user-dashboard.js
```

## Common Patterns

### Loading Data on Mount

```typescript
React.useEffect(() => {
  const loadData = async () => {
    setLoading(true);
    try {
      const result = await services.callBubbleWorkflow('get_data');
      setData(result);
      onEmit('data-loaded', { success: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      onEmit('error', { message: 'Load failed' });
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [services, onEmit]);
```

### Form Handling

```typescript
const [formData, setFormData] = useState({ name: '', email: '' });

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setSubmitting(true);
  onEmit('form-submitting', {});

  try {
    const result = await services.callBubbleWorkflow('submit_form', formData);
    onEmit('form-submitted', { result });
    setFormData({ name: '', email: '' }); // Reset
  } catch (err) {
    onEmit('form-error', { message: (err as Error).message });
  } finally {
    setSubmitting(false);
  }
};
```

### Conditional Auth UI

```typescript
if (!isAuthenticated) {
  return (
    <div className="user-dashboard-card">
      <p>Please log in to continue</p>
      <button onClick={() => onEmit('login-required', {})}>
        Log In
      </button>
    </div>
  );
}

// Authenticated content...
```

## Common Pitfalls

### 1. Modifying index.tsx
Never modify `index.tsx`. It's auto-generated and handles critical mounting logic.

### 2. Using fetch() directly
Always use `services.callNextApi()` or `services.callBubbleWorkflow()`. Direct fetch won't include auth tokens.

### 3. Unprefixed CSS classes
CSS classes without the interface prefix will leak styles or be overwritten. Always prefix.

### 4. Forgetting dark theme styles
Always include both `.card` and `.card.dark` variants.

### 5. Not handling loading/error states
Always show loading and error states. Users need feedback.

### 6. Emitting events without payloads
Include relevant data in event payloads. Bubble workflows need this data.

## Checklist

- [ ] Interface scaffolded with `npm run create-interface`
- [ ] Component.tsx implements all required UI
- [ ] types.ts has custom types for your data
- [ ] styles.ts has all CSS with interface prefix
- [ ] Light and dark themes both work
- [ ] All API calls use services object
- [ ] Events emit with appropriate payloads
- [ ] Loading and error states handled
- [ ] Build succeeds: `npm run build:interfaces`
- [ ] Bundle file exists in `public/bundles/`

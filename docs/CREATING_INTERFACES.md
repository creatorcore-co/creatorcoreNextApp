# Creating New Interfaces

This guide walks you through creating new interfaces step-by-step, prompting AI agents to build them, and deploying to Vercel.

## Overview

Each interface in this repo is a self-contained React widget that:
- Bundles into a standalone JavaScript file
- Mounts into any webpage via a global `window.{InterfaceName}` object
- Communicates with Bubble.io through events and API services
- Uses Shadow DOM for complete style isolation

---

## Step 1: Create the Interface Boilerplate

Run the create-interface script with your interface name (use kebab-case):

```bash
npm run create-interface my-dashboard
```

This scaffolds a new interface in `src/interfaces/my-dashboard/` with these files:

| File | Purpose |
|------|---------|
| `index.tsx` | Entry point - handles mounting, Shadow DOM, event system (don't modify) |
| `Component.tsx` | Your main UI component (build your interface here) |
| `styles.ts` | CSS styles injected into Shadow DOM |
| `types.ts` | TypeScript type definitions |
| `package.json` | Interface metadata |

---

## Step 2: Build Your Interface UI

Edit `src/interfaces/my-dashboard/Component.tsx`:

```tsx
'use client';

import { useState } from 'react';
import type { MyDashboardConfig } from './types';

interface MyDashboardComponentProps {
  config: MyDashboardConfig;
  onEmit: (event: string, payload?: Record<string, unknown>) => void;
}

export function MyDashboardComponent({ config, onEmit }: MyDashboardComponentProps) {
  const { props, services, isAuthenticated, debug } = config;
  const [loading, setLoading] = useState(false);

  const handleAction = async () => {
    setLoading(true);
    try {
      const result = await services.callNextApi('/api/my-endpoint', {
        method: 'POST',
        body: JSON.stringify({ userId: props.user?.id })
      });
      onEmit('action-complete', { result });
    } catch (error) {
      onEmit('error', { message: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`my-dashboard-container ${props.theme || 'light'}`}>
      <h2>Welcome, {props.user?.name}</h2>
      <button onClick={handleAction} disabled={loading}>
        {loading ? 'Loading...' : 'Take Action'}
      </button>
    </div>
  );
}
```

---

## Step 3: Add Custom Styles

Edit `src/interfaces/my-dashboard/styles.ts`:

```ts
export const MyDashboardStyles = `
/* Container */
.my-dashboard-container {
  padding: 24px;
  border-radius: 12px;
  font-family: system-ui, -apple-system, sans-serif;
}

/* Light theme (default) */
.my-dashboard-container.light {
  background: #ffffff;
  color: #1f2937;
}

/* Dark theme */
.my-dashboard-container.dark {
  background: #1f2937;
  color: #f9fafb;
}

/* Typography */
.my-dashboard-container h2 {
  margin: 0 0 16px 0;
  font-size: 1.5rem;
}

/* Buttons */
.my-dashboard-container button {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: #3b82f6;
  color: white;
  cursor: pointer;
  transition: background 0.2s;
}

.my-dashboard-container button:hover {
  background: #2563eb;
}

.my-dashboard-container button:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}
`;
```

---

## Step 4: Build the Interface Bundle

Build all interfaces:

```bash
npm run build:interfaces
```

This generates `public/bundles/my-dashboard.js`.

To build everything (Next.js app + all interfaces):

```bash
npm run build:all
```

---

## Step 5: Deploy to Vercel

1. **Commit and push your changes:**
   ```bash
   git add .
   git commit -m "Add my-dashboard interface"
   git push
   ```

2. **Vercel auto-deploys** from your main branch (if connected), or manually deploy:
   ```bash
   vercel --prod
   ```

3. **Access your interface at:**
   ```
   https://your-app.vercel.app/bundles/my-dashboard.js
   ```

---

## Step 6: Use in Bubble.io

Load and mount your interface in Bubble:

```html
<div id="my-dashboard-container"></div>
<script src="https://your-app.vercel.app/bundles/my-dashboard.js"></script>
<script>
  const dashboard = window.MyDashboard.mount(
    document.getElementById('my-dashboard-container'),
    {
      props: {
        user: { id: 'user123', name: 'John', email: 'john@example.com' },
        theme: 'light',
        mode: 'embedded'
      },
      services: {
        callBubbleWorkflow: async (name, params) => { /* ... */ },
        callBubbleDataApi: async (endpoint, options) => { /* ... */ },
        callNextApi: async (endpoint, options) => { /* ... */ },
        emitEvent: (name, payload) => { /* ... */ },
        getNextToken: () => localStorage.getItem('nextAccessToken'),
        isAuthenticated: () => !!localStorage.getItem('nextAccessToken')
      },
      nextApiBase: 'https://your-app.vercel.app',
      bubbleAppName: 'your-bubble-app',
      isAuthenticated: true,
      debug: false
    }
  );

  // Listen for events
  document.addEventListener('my-dashboard:action-complete', (e) => {
    console.log('Action completed:', e.detail);
  });
</script>
```

---

## Prompting an AI Agent to Build Interfaces

When working with an AI coding agent (like Claude Code), use these prompts:

### Creating a New Interface

```
Create a new interface called "user-profile" that displays user information
and allows editing. It should:
- Show user avatar, name, and email
- Have an edit mode with form inputs
- Support light and dark themes
- Emit 'profile-updated' event when saved
- Call /api/profile endpoint to save changes
```

### Key Details to Include in Your Prompt

1. **Interface name** (kebab-case): `user-profile`, `payment-form`, `data-table`

2. **UI requirements:**
   - What components to display
   - Layout and styling needs
   - Theme support (light/dark)
   - Responsive behavior

3. **Data interactions:**
   - Which API endpoints to call
   - What data to send/receive
   - Loading and error states

4. **Events to emit:**
   - What events Bubble should listen for
   - Event payload structure

5. **Props expected from Bubble:**
   - User info
   - Custom data
   - Configuration options

### Example Prompts

**Simple display widget:**
```
Create a "notification-bell" interface that:
- Shows a bell icon with unread count badge
- Fetches notifications from /api/notifications
- Displays dropdown list when clicked
- Emits 'notification-clicked' with notification ID
- Supports compact and full modes
```

**Complex form interface:**
```
Create a "checkout-form" interface with:
- Multi-step form (shipping, payment, review)
- Form validation with error messages
- Integration with /api/validate-address and /api/process-payment
- Progress indicator showing current step
- Emit events: 'step-changed', 'order-submitted', 'payment-error'
- Support for saved payment methods from props.customData.savedCards
```

**Data table interface:**
```
Create a "data-grid" interface that:
- Displays tabular data with sortable columns
- Supports pagination (10, 25, 50 per page)
- Has search/filter functionality
- Allows row selection (single and multi)
- Emits 'row-selected', 'sort-changed', 'filter-applied'
- Gets data schema from props.customData.columns
```

### Tips for Better AI Results

1. **Be specific about styling:**
   ```
   Use a modern card-based design with subtle shadows,
   rounded corners (12px), and smooth transitions
   ```

2. **Define the data structure:**
   ```
   The user object has: id, name, email, avatar (url), role, createdAt
   ```

3. **Specify error handling:**
   ```
   Show inline error messages below form fields,
   display toast for API errors
   ```

4. **Mention accessibility:**
   ```
   Include proper ARIA labels, keyboard navigation,
   and focus indicators
   ```

---

## Services API Reference

Every interface receives these service methods:

```typescript
// Call a Bubble backend workflow
await services.callBubbleWorkflow('workflow-name', {
  param1: 'value1'
});

// Call Bubble Data API
await services.callBubbleDataApi('/obj/user/123', {
  method: 'GET'
});

// Call Next.js API (auto-includes auth token)
await services.callNextApi('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});

// Emit event to Bubble
services.emitEvent('event-name', { payload: 'data' });
// Dispatches: 'my-dashboard:event-name' CustomEvent

// Check authentication
const isAuth = services.isAuthenticated();
const token = services.getNextToken();
```

---

## Common Patterns

### Loading States
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  setLoading(true);
  setError(null);
  try {
    const result = await services.callNextApi('/api/data');
    // handle result
  } catch (err) {
    setError((err as Error).message);
    onEmit('error', { message: (err as Error).message });
  } finally {
    setLoading(false);
  }
};
```

### Theme Support
```tsx
const { theme = 'light' } = props;

return (
  <div className={`container ${theme}`}>
    {/* content */}
  </div>
);
```

```css
.container { background: white; color: black; }
.container.dark { background: #1f2937; color: white; }
```

### Mode Variants
```tsx
const { mode = 'full' } = props;

return (
  <div className={`container ${mode}`}>
    {mode === 'compact' ? <CompactView /> : <FullView />}
  </div>
);
```

---

## Build Commands Summary

| Command | Description |
|---------|-------------|
| `npm run create-interface <name>` | Scaffold new interface from template |
| `npm run dev` | Start Next.js dev server for testing |
| `npm run build:interfaces` | Build all interfaces to `public/bundles/` |
| `npm run build:all` | Build Next.js app + all interfaces |
| `npm run lint` | Check for TypeScript/ESLint errors |

---

## Deployment Checklist

- [ ] Interface builds without errors (`npm run build:interfaces`)
- [ ] Types are correct (`npm run lint`)
- [ ] Tested locally with `npm run dev`
- [ ] Styles work in both light and dark themes
- [ ] Events emit correctly (check browser console)
- [ ] API calls include proper error handling
- [ ] Committed and pushed to repo
- [ ] Vercel deployment successful
- [ ] Bundle accessible at `/bundles/{name}.js`

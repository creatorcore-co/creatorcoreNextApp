---
name: bubble-integration
description: |
  Use this skill when implementing Bubble.io integrations, calling Bubble
  workflows, using the Data API, or handling Bubble-specific data patterns.
---

# Bubble.io Integration

This skill covers how interfaces communicate with Bubble.io, including calling workflows, using the Data API, and handling Bubble-specific data patterns.

## Overview

Interfaces don't call Bubble APIs directly. Instead, Bubble provides a `services` object at mount time that handles:
- API authentication
- Base URL configuration
- Response handling

This architecture allows the same interface bundle to work with different Bubble apps.

## The Services Object

The `services` object is passed to your interface via `config.services`:

```typescript
interface BubbleServices {
  /** Call a Bubble workflow by name */
  callBubbleWorkflow: (name: string, params?: Record<string, unknown>) => Promise<unknown>;

  /** Call the Bubble Data API */
  callBubbleDataApi: (endpoint: string, options?: RequestInit) => Promise<unknown>;

  /** Call a Next.js API route */
  callNextApi: (endpoint: string, options?: RequestInit) => Promise<unknown>;

  /** Emit an event back to Bubble */
  emitEvent: (name: string, payload?: Record<string, unknown>) => void;

  /** Get the current Next.js access token */
  getNextToken: () => string | null;

  /** Check if the user is authenticated */
  isAuthenticated: () => boolean;
}
```

## Calling Bubble Workflows

### Basic Workflow Call

```typescript
const result = await services.callBubbleWorkflow('get_user_profile', {
  user_id: props.user?.id,
});
```

### Workflow with Parameters

```typescript
const result = await services.callBubbleWorkflow('process_order', {
  order_id: orderId,
  action: 'confirm',
  notes: 'Customer confirmed via widget',
});
```

### Workflow Response Handling

Bubble workflows typically return:

```typescript
interface BubbleWorkflowResponse {
  status: 'success' | 'error';
  response?: {
    // Your workflow's return data
    user: { id: string; name: string; email: string };
    orders: Array<{ id: string; total: number }>;
  };
  error?: string;
}
```

Example handling:

```typescript
const handleFetchData = async () => {
  try {
    const result = await services.callBubbleWorkflow('get_dashboard_data');

    // Type the response (use workflow-discovery to generate types)
    const data = result as {
      status: string;
      response: {
        stats: { views: number; orders: number };
        items: Array<{ id: string; name: string }>;
      };
    };

    if (data.status === 'success') {
      setStats(data.response.stats);
      setItems(data.response.items);
      onEmit('data-loaded', { itemCount: data.response.items.length });
    } else {
      throw new Error('Workflow returned error status');
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
    onEmit('error', { message, operation: 'fetch-data' });
  }
};
```

## Calling the Bubble Data API

The Data API provides CRUD operations on Bubble data types.

### GET - Fetch Records

```typescript
// Get all items
const response = await services.callBubbleDataApi('/obj/item');

// Get with constraints
const response = await services.callBubbleDataApi(
  '/obj/item?constraints=[{"key":"status","constraint_type":"equals","value":"active"}]'
);

// Get a single record by ID
const response = await services.callBubbleDataApi('/obj/item/1234567890');
```

### POST - Create Record

```typescript
const response = await services.callBubbleDataApi('/obj/item', {
  method: 'POST',
  body: JSON.stringify({
    name: 'New Item',
    status: 'pending',
    created_by: props.user?.id,
  }),
});
```

### PATCH - Update Record

```typescript
await services.callBubbleDataApi('/obj/item/1234567890', {
  method: 'PATCH',
  body: JSON.stringify({
    status: 'completed',
    completed_at: new Date().toISOString(),
  }),
});
```

### DELETE - Remove Record

```typescript
await services.callBubbleDataApi('/obj/item/1234567890', {
  method: 'DELETE',
});
```

### Data API Response Format

```typescript
interface BubbleDataResponse<T> {
  response: {
    cursor: number;      // Pagination cursor
    results: T[];        // Array of records
    count: number;       // Number returned
    remaining: number;   // Records remaining (for pagination)
  };
}
```

Example:

```typescript
const response = await services.callBubbleDataApi('/obj/item') as BubbleDataResponse<Item>;
const items = response.response.results;
const hasMore = response.response.remaining > 0;
```

## Calling Next.js APIs

For server-side operations that need to stay in Next.js:

```typescript
// GET request
const data = await services.callNextApi('/api/health');

// POST request with body
const result = await services.callNextApi('/api/process', {
  method: 'POST',
  body: JSON.stringify({
    action: 'analyze',
    data: itemData,
  }),
});

// The auth token is included automatically if the user is authenticated
```

## Event Communication

### Emitting Events

Use `onEmit` (from Component props) to send events to Bubble:

```typescript
// Generic event
onEmit('action', { type: 'button-click', buttonId: 'save' });

// Data events
onEmit('item-selected', { itemId: item.id, itemData: item });
onEmit('items-loaded', { count: items.length, hasMore });

// Form events
onEmit('form-submitted', { formData });
onEmit('form-validated', { isValid: true, errors: [] });

// State events
onEmit('loading-changed', { loading: true });
onEmit('auth-required', { reason: 'token-expired' });

// Error events
onEmit('error', { message: 'Failed to save', code: 'SAVE_ERROR', details: err });
```

### Event Format

Events are dispatched as DOM CustomEvents:

```javascript
// Event name format: {interface-name}:{event-name}
document.dispatchEvent(new CustomEvent('my-interface:item-selected', {
  detail: {
    event: 'item-selected',
    payload: { itemId: '123', itemData: {...} },
    timestamp: 1705312800000
  },
  bubbles: true,
  cancelable: false
}));
```

### Listening in Bubble

In Bubble's HTML element, listen for these events:

```javascript
document.addEventListener('my-interface:item-selected', (e) => {
  const { itemId, itemData } = e.detail.payload;
  // Update Bubble state, trigger workflows, etc.
  bubble_fn_setSelectedItem(itemId, itemData);
});

document.addEventListener('my-interface:error', (e) => {
  const { message, code } = e.detail.payload;
  // Show error in Bubble UI
  bubble_fn_showError(message);
});
```

## Using the Workflow Discovery Tool

Before building your interface, discover the exact response format of Bubble workflows:

```bash
# Discover a workflow's response schema
npm run discover-workflow get_user_profile --body='{"user_id":"123"}'

# Generate TypeScript types
npm run discover-workflow get_user_profile --output=src/interfaces/my-widget/api-types.ts

# Add to workflow registry
npm run discover-workflow get_user_profile --save-registry
```

See the [workflow-discovery skill](../workflow-discovery/SKILL.md) for detailed usage.

## Data Transformation Patterns

### Sanitizing Bubble Data

Bubble data may contain HTML. Sanitize before rendering:

```typescript
import { sanitizeBubbleData } from '@/lib/bubble';

const cleanData = sanitizeBubbleData(rawData);
```

The sanitizer:
- Removes `<script>` tags
- Removes event handlers (`onclick`, etc.)
- Cleans dangerous characters from object keys

### Transforming Date Fields

Bubble dates are ISO strings:

```typescript
const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
```

### Handling Bubble's Unique IDs

Bubble IDs are long strings. Keep them as strings:

```typescript
interface BubbleItem {
  _id: string;  // Bubble's internal ID
  // ... other fields
}
```

## Error Handling Best Practices

### Wrap All API Calls

```typescript
const fetchData = async () => {
  setLoading(true);
  setError(null);

  try {
    const result = await services.callBubbleWorkflow('get_data');
    setData(result);
    onEmit('data-loaded', { success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An error occurred';
    setError(message);
    onEmit('error', { message, operation: 'fetch-data' });

    // Log for debugging
    if (debug) {
      console.error('[MyInterface] Fetch error:', err);
    }
  } finally {
    setLoading(false);
  }
};
```

### Handle Network Errors

```typescript
try {
  const result = await services.callBubbleWorkflow('save_data', data);
} catch (err) {
  if (err instanceof TypeError && err.message.includes('fetch')) {
    // Network error
    setError('Network error. Please check your connection.');
  } else if (err instanceof Error && err.message.includes('401')) {
    // Auth error
    onEmit('auth-required', { reason: 'unauthorized' });
  } else {
    setError('An unexpected error occurred.');
  }
}
```

### Validate Responses

```typescript
const result = await services.callBubbleWorkflow('get_items');

// Validate response structure
if (!result || typeof result !== 'object') {
  throw new Error('Invalid response format');
}

if (!Array.isArray(result.items)) {
  throw new Error('Expected items array in response');
}
```

## Authentication Status

### Check Auth Before API Calls

```typescript
const handleProtectedAction = async () => {
  if (!services.isAuthenticated()) {
    onEmit('auth-required', { action: 'protected-action' });
    return;
  }

  // Proceed with API call
  const result = await services.callNextApi('/api/protected');
};
```

### Update Auth State

When authentication changes, Bubble updates the interface:

```typescript
// Bubble calls this when auth state changes
widget.update({ isAuthenticated: true });
```

Your component receives the new `isAuthenticated` value via `config.isAuthenticated`.

## Common Pitfalls

### 1. Using fetch() Directly

**Wrong:**
```typescript
// Don't call Bubble APIs directly - use services instead
const data = await fetch('https://your-app/api/1.1/wf/get_data');
```

**Right:**
```typescript
const data = await services.callBubbleWorkflow('get_data');
```

### 2. Not Handling Loading States

**Wrong:**
```typescript
const data = await services.callBubbleWorkflow('get_data');
setData(data);
```

**Right:**
```typescript
setLoading(true);
try {
  const data = await services.callBubbleWorkflow('get_data');
  setData(data);
} finally {
  setLoading(false);
}
```

### 3. Emitting Events Without Payloads

**Wrong:**
```typescript
onEmit('item-selected');
```

**Right:**
```typescript
onEmit('item-selected', { itemId: item.id, itemName: item.name });
```

### 4. Not Typing API Responses

**Wrong:**
```typescript
const data = await services.callBubbleWorkflow('get_data');
setItems(data.items); // TypeScript error or runtime error
```

**Right:**
```typescript
interface GetDataResponse {
  status: string;
  response: {
    items: Array<{ id: string; name: string }>;
  };
}

const data = await services.callBubbleWorkflow('get_data') as GetDataResponse;
setItems(data.response.items);
```

## Example: Complete Data Flow

```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import type { MyWidgetConfig, Item } from './types';

interface MyWidgetComponentProps {
  config: MyWidgetConfig;
  onEmit: (event: string, payload?: Record<string, unknown>) => void;
}

export function MyWidgetComponent({ config, onEmit }: MyWidgetComponentProps) {
  const { props, services, isAuthenticated, debug } = config;

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const log = useCallback(
    (...args: unknown[]) => {
      if (debug) console.log('[MyWidget]', ...args);
    },
    [debug]
  );

  // Load data on mount
  useEffect(() => {
    const loadItems = async () => {
      setLoading(true);
      setError(null);

      try {
        log('Loading items...');
        const result = await services.callBubbleWorkflow('get_items', {
          user_id: props.user?.id,
          limit: 10,
        });

        const data = result as { response: { items: Item[] } };
        setItems(data.response.items);

        log('Loaded', data.response.items.length, 'items');
        onEmit('items-loaded', { count: data.response.items.length });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load items';
        log('Error loading items:', err);
        setError(message);
        onEmit('error', { message, operation: 'load-items' });
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [services, props.user?.id, log, onEmit]);

  // Handle item selection
  const handleSelect = (item: Item) => {
    log('Item selected:', item.id);
    onEmit('item-selected', { itemId: item.id, itemName: item.name });
  };

  // Handle item action (requires auth)
  const handleAction = async (item: Item) => {
    if (!isAuthenticated) {
      onEmit('auth-required', { action: 'item-action', itemId: item.id });
      return;
    }

    try {
      log('Processing action for item:', item.id);
      await services.callBubbleWorkflow('process_item', { item_id: item.id });
      onEmit('action-completed', { itemId: item.id });
    } catch (err) {
      onEmit('error', { message: 'Action failed', itemId: item.id });
    }
  };

  // Render...
}
```

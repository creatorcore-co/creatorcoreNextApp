# {{INTERFACE_NAME}} Interface

**Created**: {{DATE}}
**Bundle**: `/bundles/{{INTERFACE_NAME_KEBAB}}.js`
**Global Object**: `window.{{INTERFACE_NAME}}`

## Purpose

[Describe what this interface does]

## Bubble.io Integration

### Loading in Bubble

```html
<script src="https://creatorcore-next-app.vercel.app/bundles/{{INTERFACE_NAME_KEBAB}}.js"></script>
```

### Mounting the Interface

```javascript
const interface = window.{{INTERFACE_NAME}}.mount(
  document.getElementById('container'),
  {
    props: {
      user: { id: '123', name: 'John' },
      theme: 'light',
      mode: 'embedded',
      customData: {}
    },
    services: bubbleServices, // Provided by Bubble plugin
    vercelBaseUrl: 'https://creatorcore-next-app.vercel.app',
    bubbleBaseUrl: 'https://your-app.bubbleapps.io',
    isAuthenticated: true,
    debug: false
  }
);

// Update props
interface.update({ theme: 'dark' });

// Emit custom event
interface.emit('custom-event', { data: 'value' });

// Unmount when done
interface.unmount();
```

## Pre-Baked Bubble Integration

This interface includes:

- **Authentication**: JWT token exchange via `/api/auth/bubble-exchange`
- **Event Emitter**: Send events to Bubble using `onEmit()`
- **Services Layer**: Access to Bubble workflows
- **Shadow DOM**: Style isolation from Bubble's CSS
- **Props Updates**: Reactive updates from Bubble via `interface.update()`

## Services Available

```typescript
services.callBubbleWorkflow(name, params) // Call Bubble workflows
services.callNextApi(endpoint, options) // Call Next.js API (with auth)
services.emitEvent(name, payload) // Emit events to Bubble
services.getNextToken() // Get current access token
services.isAuthenticated() // Check auth status
```

## Events Emitted

| Event | Payload | Description |
|-------|---------|-------------|
| `{{INTERFACE_NAME_KEBAB}}:ready` | `{ mounted: true }` | Interface mounted |
| `{{INTERFACE_NAME_KEBAB}}:unmount` | `{ timestamp: number }` | Interface unmounted |
| `{{INTERFACE_NAME_KEBAB}}:action` | `{ type: string, ... }` | User action |
| `{{INTERFACE_NAME_KEBAB}}:error` | `{ message: string }` | Error occurred |

## Listening in Bubble

```javascript
document.addEventListener('{{INTERFACE_NAME_KEBAB}}:action', (e) => {
  console.log('Action:', e.detail.payload);
});
```

## Development

### Build Commands

```bash
npm run dev              # Start Next.js dev server
npm run build:interfaces # Build all interface bundles
npm run build:all        # Build Next.js app + all interfaces
```

### Adding Features

1. **Add UI components** in `Component.tsx`
2. **Add styles** in `styles.ts`
3. **Add types** in `types.ts` for TypeScript safety
4. **Emit events** using `onEmit()` to notify Bubble
5. **Call APIs** using the `services` object

### Example: Adding a Feature

```typescript
// In Component.tsx
const handleSubmitForm = async (formData: FormData) => {
  try {
    // 1. Call Next.js API
    const result = await services.callNextApi('/api/my-endpoint', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    // 2. Emit success event to Bubble
    onEmit('form-submitted', { result });

    // 3. Optionally trigger Bubble workflow
    await services.callBubbleWorkflow('process-submission', { result });

  } catch (error) {
    // 4. Emit error event
    onEmit('error', { message: error.message });
  }
};
```

## AI Agent Instructions

If you're an AI agent building features for this interface:

1. **Read this README first** to understand the Bubble integration
2. **All Bubble communication** happens through:
   - `services` object (calling APIs/workflows)
   - `onEmit()` function (sending events to Bubble)
3. **Authentication is automatic** - access token is in headers when using `services.callNextApi()`
4. **Never modify** the `index.tsx` entry point (Bubble integration is pre-configured)
5. **Focus on** building features in `Component.tsx` and adding new components
6. **Use TypeScript** and define types in `types.ts`
7. **Test thoroughly** before building the bundle

## Deployment

When deployed to Vercel:

- **Bundle URL**: `https://creatorcore-next-app.vercel.app/bundles/{{INTERFACE_NAME_KEBAB}}.js`
- **API Base**: `https://creatorcore-next-app.vercel.app`
- **Auth Endpoint**: `https://creatorcore-next-app.vercel.app/api/auth/bubble-exchange`

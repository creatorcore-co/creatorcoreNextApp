# NextWidget Interface

**Bundle**: `/bundles/widget.js`
**Global Object**: `window.NextWidget`

## Purpose

The original Next.js widget for Bubble.io integration. Provides a demo interface showing how to call Bubble workflows, Next.js APIs, and emit events back to the parent application.

## Bubble.io Integration

### Loading in Bubble

```html
<script src="https://creatorcore-next-app.vercel.app/bundles/widget.js"></script>
```

### Mounting the Widget

```javascript
const widget = window.NextWidget.mount(
  document.getElementById('container'),
  {
    props: {
      user: { id: '123', name: 'John', email: 'john@example.com' },
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
widget.update({ theme: 'dark' });

// Emit custom event
widget.emit('custom-event', { data: 'value' });

// Unmount when done
widget.unmount();
```

## Features

- **User Info Display**: Shows user avatar, name, and email
- **Call Bubble Workflow**: Demonstrates calling Bubble workflows
- **Call Next.js API**: Demonstrates calling Next.js API endpoints
- **Emit Events**: Demonstrates emitting events back to Bubble
- **Theme Support**: Light and dark themes
- **Debug Mode**: Shows configuration details when enabled

## Events Emitted

| Event | Payload | Description |
|-------|---------|-------------|
| `nextwidget:ready` | `{ mounted: true }` | Widget mounted |
| `nextwidget:unmount` | `{ timestamp: number }` | Widget unmounted |
| `nextwidget:workflow-complete` | `{ workflow: string, result: object }` | Bubble workflow completed |
| `nextwidget:api-call-complete` | `{ endpoint: string, result: object }` | API call completed |
| `nextwidget:error` | `{ type: string, message: string }` | Error occurred |

## Listening in Bubble

```javascript
document.addEventListener('nextwidget:workflow-complete', (e) => {
  console.log('Workflow result:', e.detail.payload);
});
```

## Development

```bash
npm run dev              # Start Next.js dev server
npm run build:interfaces # Build all interface bundles
```

## Services Available

```typescript
services.callBubbleWorkflow(name, params) // Call Bubble workflows
services.callNextApi(endpoint, options) // Call Next.js API (with auth)
services.emitEvent(name, payload) // Emit events to Bubble
services.getNextToken() // Get current access token
services.isAuthenticated() // Check auth status
```

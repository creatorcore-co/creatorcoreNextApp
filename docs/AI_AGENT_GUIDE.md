# AI Agent Guide: Building Interfaces for Bubble.io

This guide helps AI agents understand how to build new interfaces in this Next.js repository that integrate with Bubble.io.

## Quick Start

1. **Create a new interface:**
   ```bash
   npm run create-interface my-feature
   ```

2. **Read the interface README:**
   ```bash
   cat src/interfaces/my-feature/README.md
   ```

3. **Build features in:**
   - `src/interfaces/my-feature/Component.tsx` (main UI)
   - `src/interfaces/my-feature/styles.ts` (custom styles)
   - `src/interfaces/my-feature/types.ts` (custom types)

4. **Test and build:**
   ```bash
   npm run dev              # Test in Next.js
   npm run build:interfaces # Build bundle
   ```

## Architecture Overview

This repository builds **embeddable React widgets** for Bubble.io applications. Each interface:

- Is bundled as a standalone IIFE JavaScript file
- Exposes a global object (e.g., `window.MyFeature`) with a `mount()` function
- Uses Shadow DOM for style isolation
- Communicates with Bubble via DOM CustomEvents
- Can call Next.js API routes and Bubble workflows

### Directory Structure

```
src/
├── interfaces/           # All widget interfaces
│   ├── _template/        # Template for new interfaces (don't modify)
│   ├── widget/           # Original widget
│   └── [your-interface]/ # New interfaces
├── shared/
│   └── bubble/           # Shared utilities (logger, event-emitter, types)
├── lib/                  # Server-side utilities (auth, Bubble API)
└── app/
    └── api/              # Next.js API routes

public/
└── bundles/              # Built interface bundles
```

## Creating a New Interface

### Step 1: Scaffold the Interface

```bash
npm run create-interface user-dashboard
```

This creates `src/interfaces/user-dashboard/` with:
- `index.tsx` - Entry point (pre-configured, don't modify)
- `Component.tsx` - Main UI component (build here)
- `styles.ts` - CSS styles
- `types.ts` - TypeScript definitions
- `README.md` - Documentation
- `package.json` - Metadata

### Step 2: Build the UI

Edit `Component.tsx`:

```typescript
export function UserDashboardComponent({ config, onEmit }: UserDashboardComponentProps) {
  const { props, services, isAuthenticated } = config;

  const handleSaveSettings = async () => {
    try {
      // Call Next.js API
      const result = await services.callNextApi('/api/save-settings', {
        method: 'POST',
        body: JSON.stringify({ userId: props.user?.id })
      });

      // Notify Bubble of success
      onEmit('settings-saved', { result });

    } catch (error) {
      onEmit('error', { message: error.message });
    }
  };

  return (
    <div className="user-dashboard-card">
      <h2>Welcome, {props.user?.name}</h2>
      <button onClick={handleSaveSettings}>Save Settings</button>
    </div>
  );
}
```

### Step 3: Add Styles

Edit `styles.ts`:

```typescript
export const UserDashboardStyles = `
.user-dashboard-card {
  background: white;
  padding: 20px;
  border-radius: 12px;
}

.user-dashboard-card h2 {
  margin: 0 0 16px 0;
}
`;
```

### Step 4: Build the Bundle

```bash
npm run build:interfaces
```

Output: `public/bundles/user-dashboard.js`

## Services Available

Every interface receives a `services` object with these methods:

```typescript
// Call a Bubble workflow
await services.callBubbleWorkflow('workflow-name', { param: 'value' });

// Call Bubble Data API
await services.callBubbleDataApi('/obj/user', { method: 'GET' });

// Call Next.js API (includes auth token automatically)
await services.callNextApi('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});

// Emit event to Bubble (also dispatches DOM event)
services.emitEvent('event-name', { payload: 'data' });

// Get current access token
const token = services.getNextToken();

// Check authentication status
const isAuth = services.isAuthenticated();
```

## Event Communication

### Emitting Events to Bubble

Use the `onEmit` prop:

```typescript
// Emit ready event
onEmit('ready', { mounted: true });

// Emit action event
onEmit('action', { type: 'button-click', data: { ... } });

// Emit error
onEmit('error', { message: 'Something went wrong' });
```

Events are dispatched as DOM CustomEvents with format: `{interface-name}:{event}`

### Listening in Bubble

```javascript
// In Bubble
document.addEventListener('user-dashboard:action', (e) => {
  console.log('Payload:', e.detail.payload);
});
```

## Authentication Flow

1. Bubble generates a JWT with user info
2. Widget calls `/api/auth/bubble-exchange` to exchange for access token
3. Access token is stored and included in `services.callNextApi()` requests
4. Next.js API routes verify the token using `authenticateRequest()`

## Best Practices

### DO:
- Build all UI in `Component.tsx`
- Use `services` for all API calls (handles auth automatically)
- Emit events to keep Bubble informed of state changes
- Use TypeScript and define types in `types.ts`
- Test locally before building bundles

### DON'T:
- Modify `index.tsx` - it contains pre-configured Bubble integration
- Make direct fetch calls (use `services.callNextApi()`)
- Store sensitive data in the widget state
- Rely on external stylesheets (use CSS-in-JS in `styles.ts`)

## Common Patterns

### Loading State

```typescript
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    const result = await services.callNextApi('/api/action');
    onEmit('action-complete', { result });
  } catch (error) {
    onEmit('error', { message: error.message });
  } finally {
    setLoading(false);
  }
};
```

### Form Submission

```typescript
const handleSubmit = async (formData: FormData) => {
  onEmit('form-submitting', {});

  try {
    const result = await services.callNextApi('/api/submit', {
      method: 'POST',
      body: JSON.stringify(Object.fromEntries(formData))
    });

    onEmit('form-submitted', { result });

    // Optionally trigger Bubble workflow
    await services.callBubbleWorkflow('process-submission', { result });

  } catch (error) {
    onEmit('form-error', { message: error.message });
  }
};
```

### Theme Support

```typescript
const { theme = 'light' } = props;
const cardClass = `my-card ${theme}`;

return <div className={cardClass}>...</div>;
```

```css
.my-card { background: white; color: black; }
.my-card.dark { background: #1f2937; color: white; }
```

## Troubleshooting

### Build Errors

- Check that all imports use `@/` alias correctly
- Ensure `types.ts` exports match what `Component.tsx` imports
- Run `npm run lint` to find TypeScript errors

### Events Not Reaching Bubble

- Check browser console for event dispatch
- Verify event name format: `{interface-name}:{event}`
- Ensure Bubble listener uses the exact event name

### Styles Not Applying

- Styles in `styles.ts` are injected into Shadow DOM
- Use specific class prefixes to avoid conflicts
- Don't rely on global CSS - everything must be in `styles.ts`

### API Calls Failing

- Check that `services.callNextApi()` is used (not direct fetch)
- Verify the API route exists and handles CORS
- Check authentication - access token may be expired

## Development Commands

```bash
npm run dev               # Start Next.js dev server
npm run build:interfaces  # Build all interface bundles
npm run build:widget      # Build legacy widget.js only
npm run build:all         # Build Next.js app + all interfaces
npm run create-interface  # Create new interface from template
npm run lint              # Run ESLint
```

## Deployment

When deployed to Vercel:

1. Interface bundles are at `https://your-app.vercel.app/bundles/{name}.js`
2. API routes are at `https://your-app.vercel.app/api/...`
3. Auth endpoint is at `https://your-app.vercel.app/api/auth/bubble-exchange`

### Bubble Integration

```html
<!-- Load the interface -->
<script src="https://your-app.vercel.app/bundles/user-dashboard.js"></script>

<!-- Mount it -->
<script>
  const widget = window.UserDashboard.mount(
    document.getElementById('container'),
    {
      props: { user: currentUser, theme: 'light' },
      services: bubbleServices,
      nextApiBase: 'https://your-app.vercel.app',
      bubbleAppName: 'your-bubble-app',
      isAuthenticated: true,
      debug: false
    }
  );
</script>
```

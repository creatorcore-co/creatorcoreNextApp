# CreatorCore Next.js

A multi-interface Next.js application for building embeddable widgets for Bubble.io. Create isolated, production-ready React interfaces that integrate seamlessly with Bubble's workflow and data APIs.

## Key Features

- **Multi-Interface Architecture**: Build multiple independent widgets from a single codebase
- **Template-Based Scaffolding**: Create new interfaces with a single command
- **Shadow DOM Isolation**: Each interface has isolated styles that won't conflict with host pages
- **Secure Authentication**: JWT-based token exchange between Bubble and Next.js
- **Event System**: Bidirectional communication via DOM CustomEvents
- **TypeScript**: Full type safety throughout
- **Tailwind CSS**: Modern utility-first styling

---

## Repository Architecture

```
src/
├── interfaces/                    # All embeddable interfaces
│   ├── _template/                 # Template for scaffolding (don't modify)
│   │   ├── index.tsx              # Entry point template
│   │   ├── Component.tsx          # UI component template
│   │   ├── types.ts               # Type definitions template
│   │   └── styles.ts              # CSS-in-JS template
│   │
│   └── widget/                    # Example: Original widget interface
│       ├── index.tsx              # Mount entry (window.NextWidget)
│       ├── Component.tsx          # Main UI component
│       ├── types.ts               # Interface-specific types
│       └── styles.ts              # Interface-specific styles
│
├── shared/                        # Shared utilities (used by all interfaces)
│   └── bubble/
│       ├── index.ts               # Exports: logger, event-emitter, types
│       ├── types.ts               # Shared TypeScript types
│       ├── logger.ts              # Debug logging utility
│       └── event-emitter.ts       # DOM event dispatching
│
├── lib/                           # Server-side utilities
│   ├── auth.ts                    # JWT verification & token exchange
│   └── bubble.ts                  # Bubble API helpers
│
└── app/                           # Next.js App Router
    ├── page.tsx                   # Standalone demo page
    ├── layout.tsx                 # Root layout
    ├── globals.css                # Global styles
    └── api/
        ├── auth/
        │   └── bubble-exchange/   # Token exchange endpoint
        └── health/                # Health check endpoint

public/
└── bundles/                       # Built interface bundles
    └── *.js                       # Each interface compiles here

scripts/
├── create-interface.js            # Scaffolds new interfaces
└── build-interfaces.js            # Builds all interfaces to bundles
```

---

## Shared Resources

### Shared Utilities (`src/shared/bubble/`)

All interfaces import from `@/shared/bubble`:

```typescript
import { createLogger, BubbleEventEmitter } from '@/shared/bubble';
import type { BubbleServices, BubbleUser } from '@/shared/bubble';
```

| Export | Purpose |
|--------|---------|
| `createLogger(options)` | Prefixed console logging with debug flag |
| `BubbleEventEmitter` | Dispatches DOM CustomEvents for Bubble communication |
| `BubbleServices` | TypeScript interface for service methods |
| `BubbleUser` | User object type definition |
| `ApiResponse<T>` | Standard API response wrapper type |

### Server-Side Utilities (`src/lib/`)

For API routes and server-side operations:

```typescript
import { authenticateRequest, exchangeToken } from '@/lib/auth';
import { callBubbleWorkflow, callBubbleDataApi } from '@/lib/bubble';
```

| Module | Purpose |
|--------|---------|
| `auth.ts` | JWT verification, token creation, request authentication |
| `bubble.ts` | Server-side Bubble API calls, data sanitization |

---

## How Interfaces Work

Each interface in `src/interfaces/` bundles into a standalone IIFE JavaScript file:

1. **Global Object**: Exposes `window.{InterfaceName}` (e.g., `window.UserDashboard`)
2. **Mount Function**: `window.UserDashboard.mount(container, config)` renders the interface
3. **Shadow DOM**: Styles are injected into an isolated Shadow DOM
4. **Event Dispatch**: Uses `{interface-name}:{event}` format for CustomEvents
5. **Service Proxy**: All API calls route through the `services` object passed at mount

### Interface File Structure

| File | Purpose | Modify? |
|------|---------|---------|
| `index.tsx` | Mount logic, Shadow DOM, event wiring | No |
| `Component.tsx` | Your UI component | Yes |
| `styles.ts` | CSS-in-JS styles | Yes |
| `types.ts` | TypeScript definitions | Yes |

---

## Quick Start

### Installation

```bash
git clone <repo-url>
cd creatorcoreNextApp
npm install
cp .env.example .env.local
```

Configure `.env.local`:
```env
JWT_SECRET=your-secret-key-minimum-32-characters (Ask Jack for this)
NEXT_PUBLIC_BUBBLE_APP_NAME=creatorcore
ACCESS_TOKEN_EXPIRY=3600
NEXT_PUBLIC_APP_URL=https://creatorcore-next-app.vercel.app
```

### Creating a New Interface

```bash
npm run create-interface my-feature
```

Edit your interface in `src/interfaces/my-feature/Component.tsx`.

See [docs/CREATING_INTERFACES.md](docs/CREATING_INTERFACES.md) for detailed instructions.

### Development

```bash
npm run dev              # Start Next.js dev server
npm run build:interfaces # Build all interface bundles
npm run build:all        # Build Next.js app + interfaces
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

After deployment:
- **Standalone app**: `https://creatorcore-next-app.vercel.app`
- **Interface bundles**: `https://creatorcore-next-app.vercel.app/bundles/{name}.js`
- **API routes**: `https://creatorcore-next-app.vercel.app/api/...`

---

## Bubble.io Integration

### Load and Mount an Interface

```html
<div id="widget-container"></div>
<script src="https://creatorcore-next-app.vercel.app/bundles/widget.js"></script>
<script>
  const widget = window.NextWidget.mount(
    document.getElementById('widget-container'),
    {
      props: {
        user: { id: 'user123', name: 'John', email: 'john@example.com' },
        theme: 'light',
        mode: 'embedded',
        customData: {}
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
          return fetch(`https://creatorcore-next-app.vercel.app${endpoint}`, {
            ...options,
            headers: { ...options?.headers, Authorization: token ? `Bearer ${token}` : '' }
          }).then(r => r.json());
        },
        emitEvent: (name, payload) => bubble_fn_emitEvent(name, payload),
        getNextToken: () => localStorage.getItem('nextAccessToken'),
        isAuthenticated: () => !!localStorage.getItem('nextAccessToken')
      },
      nextApiBase: 'https://creatorcore-next-app.vercel.app',
      bubbleAppName: 'your-bubble-app',
      isAuthenticated: false,
      debug: true
    }
  );
</script>
```

### Listen for Events

```javascript
document.addEventListener('widget:ready', (e) => console.log('Ready:', e.detail));
document.addEventListener('widget:action', (e) => console.log('Action:', e.detail));
document.addEventListener('widget:error', (e) => console.error('Error:', e.detail));
```

### Authentication Flow

1. Bubble generates a short-lived JWT (5 min) with user info
2. Call `/api/auth/bubble-exchange` to exchange for a Next.js access token
3. Store the access token and include in subsequent API calls
4. Update interface: `widget.update({ isAuthenticated: true })`

---

## API Reference

### POST `/api/auth/bubble-exchange`

Exchange Bubble JWT for Next.js access token.

**Request:**
```json
{ "token": "eyJhbGciOiJIUzI1NiIs..." }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": { "id": "user-123", "email": "user@example.com" }
  }
}
```

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{ "status": "ok", "timestamp": "2024-01-15T12:00:00.000Z", "version": "1.0.0" }
```

---

## Interface API

### `window.{InterfaceName}.mount(container, config)`

Mounts the interface to a DOM element.

**Returns:** API object with:
- `update(newConfig)` - Update interface configuration
- `unmount()` - Remove interface from DOM
- `emit(event, payload)` - Manually emit an event

### Config Object

```typescript
interface Config {
  props: {
    user?: { id: string; email?: string; name?: string; avatar?: string };
    theme?: 'light' | 'dark' | 'system';
    mode?: 'compact' | 'full' | 'embedded';
    customData?: Record<string, unknown>;
  };
  services: {
    callBubbleWorkflow: (name: string, params?: object) => Promise<any>;
    callBubbleDataApi: (endpoint: string, options?: RequestInit) => Promise<any>;
    callNextApi: (endpoint: string, options?: RequestInit) => Promise<any>;
    emitEvent: (name: string, payload?: object) => void;
    getNextToken: () => string | null;
    isAuthenticated: () => boolean;
  };
  nextApiBase: string;
  bubbleAppName: string;
  isAuthenticated: boolean;
  debug?: boolean;
}
```

---

## Documentation

- [Creating Interfaces](docs/CREATING_INTERFACES.md) - Step-by-step guide for building new interfaces
- [AI Agent Guide](docs/AI_AGENT_GUIDE.md) - Reference for AI coding agents

---

## Security

- **JWT Secret**: Use 32+ character random string, sync between Bubble and Next.js
- **Token Expiration**: Bubble tokens 5 min (exchange only), Next.js tokens 1 hour
- **CORS**: Default allows all origins; restrict in production
- **Sanitization**: All Bubble data is sanitized to prevent XSS
- **HTTPS**: Always use HTTPS in production

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build Next.js app |
| `npm run build:interfaces` | Build all interface bundles |
| `npm run build:all` | Build app + interfaces |
| `npm run create-interface <name>` | Scaffold new interface |
| `npm run lint` | Run ESLint |

---

## License

MIT

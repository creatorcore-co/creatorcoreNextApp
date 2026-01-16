# CreatorCore Next.js Widget

A Next.js application that can be embedded as a widget inside Bubble.io applications. Supports both standalone mode and embeddable widget mode with secure JWT-based authentication.

## Features

- **Dual Mode Operation**: Works as a standalone Next.js app and as an embeddable widget
- **Secure Authentication**: JWT-based token exchange between Bubble and Next.js
- **Shadow DOM Isolation**: Widget styles are isolated from the host page
- **Event System**: Bidirectional communication between widget and Bubble
- **TypeScript**: Full type safety throughout the codebase
- **Tailwind CSS**: Modern styling with utility-first CSS

## Project Structure

```
src/
├── app/                      # Next.js App Router pages (standalone mode)
│   ├── layout.tsx
│   ├── page.tsx             # Demo/standalone page
│   ├── globals.css
│   └── api/
│       ├── auth/
│       │   └── bubble-exchange/
│       │       └── route.ts  # Token exchange endpoint
│       └── health/
│           └── route.ts      # Health check endpoint
├── components/               # Shared React components
│   ├── Widget.tsx           # Main widget component
│   └── WidgetStyles.ts      # Widget CSS styles
├── widget/                   # Widget-specific code
│   ├── entry.tsx            # Widget entry point (window.NextWidget)
│   └── types.ts             # Widget TypeScript types
└── lib/
    ├── auth.ts              # Auth utilities (JWT verification)
    └── bubble.ts            # Bubble API helpers
```

## Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd creatorcore-next-widget
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the environment file and configure:
   ```bash
   cp .env.example .env.local
   ```

4. Edit `.env.local` with your configuration:
   ```env
   JWT_SECRET=your-super-secret-key-min-32-characters-long
   NEXT_PUBLIC_BUBBLE_APP_NAME=your-bubble-app-name
   ACCESS_TOKEN_EXPIRY=3600
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

## Development

```bash
# Run Next.js development server
npm run dev

# Build widget bundle only
npm run build:widget

# Build everything (Next.js + widget)
npm run build:all
```

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

After deployment, your widget will be available at:
- Standalone app: `https://your-app.vercel.app`
- Widget script: `https://your-app.vercel.app/widget.js`

## Bubble.io Integration

### Step 1: Create a Bubble Plugin or Use HTML Element

In your Bubble app, you can either:

**Option A: Use an HTML element**
```html
<div id="next-widget-container"></div>
<script src="https://your-app.vercel.app/widget.js"></script>
<script>
  // Mount the widget after the script loads
  document.addEventListener('DOMContentLoaded', function() {
    initNextWidget();
  });
</script>
```

**Option B: Create a Bubble Plugin**
Create a custom plugin that loads and initializes the widget.

### Step 2: Initialize the Widget

```javascript
function initNextWidget() {
  const container = document.getElementById('next-widget-container');

  const widget = window.NextWidget.mount(container, {
    props: {
      user: {
        id: 'BUBBLE_USER_ID',
        name: 'BUBBLE_USER_NAME',
        email: 'BUBBLE_USER_EMAIL'
      },
      theme: 'light', // or 'dark'
      mode: 'embedded', // or 'compact', 'full'
      customData: {
        // Any additional data from Bubble
      }
    },
    services: {
      callBubbleWorkflow: async (name, params) => {
        // Call Bubble backend workflow
        const response = await fetch(
          `https://YOUR_APP.bubbleapps.io/api/1.1/wf/${name}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
          }
        );
        return response.json();
      },

      callBubbleDataApi: async (endpoint, options) => {
        const response = await fetch(
          `https://YOUR_APP.bubbleapps.io/api/1.1${endpoint}`,
          options
        );
        return response.json();
      },

      callNextApi: async (endpoint, options) => {
        const token = localStorage.getItem('nextAccessToken');
        const response = await fetch(
          `https://your-app.vercel.app${endpoint}`,
          {
            ...options,
            headers: {
              ...options?.headers,
              'Authorization': token ? `Bearer ${token}` : ''
            }
          }
        );
        return response.json();
      },

      emitEvent: (name, payload) => {
        // Trigger Bubble custom event
        bubble_fn_emitEvent(name, payload);
      },

      getNextToken: () => localStorage.getItem('nextAccessToken'),

      isAuthenticated: () => !!localStorage.getItem('nextAccessToken')
    },
    nextApiBase: 'https://your-app.vercel.app',
    bubbleAppName: 'your-bubble-app',
    isAuthenticated: false,
    debug: true
  });

  // Store widget reference for updates
  window.nextWidgetInstance = widget;
}
```

### Step 3: Configure JWT Authentication in Bubble

1. In your Bubble app, create a backend workflow that generates a JWT:
   ```
   Workflow: generate_next_token

   Step 1: Run JavaScript
   - Code: Generate JWT with user data
   - Sign with JWT_SECRET (same as Next.js)
   - Set expiration to 5 minutes
   ```

2. When user logs in, call the token exchange:
   ```javascript
   async function authenticateWithNext(bubbleToken) {
     const response = await fetch(
       'https://your-app.vercel.app/api/auth/bubble-exchange',
       {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ token: bubbleToken })
       }
     );

     const data = await response.json();

     if (data.success) {
       localStorage.setItem('nextAccessToken', data.data.accessToken);
       // Update widget auth state
       window.nextWidgetInstance?.update({ isAuthenticated: true });
     }
   }
   ```

### Step 4: Listen for Widget Events

```javascript
// Listen for widget events
document.addEventListener('nextwidget:action', (event) => {
  console.log('Widget action:', event.detail);
  // Trigger Bubble workflow or update state
});

document.addEventListener('nextwidget:workflow-complete', (event) => {
  console.log('Workflow complete:', event.detail);
});

document.addEventListener('nextwidget:error', (event) => {
  console.error('Widget error:', event.detail);
});

document.addEventListener('nextwidget:ready', (event) => {
  console.log('Widget ready:', event.detail);
});
```

## Widget API Reference

### `window.NextWidget.mount(container, config)`

Mounts the widget to a DOM element.

**Parameters:**
- `container`: HTMLElement - The DOM element to mount the widget into
- `config`: WidgetConfig - Configuration object

**Returns:** WidgetAPI object

### WidgetConfig

```typescript
interface WidgetConfig {
  props: {
    user?: {
      id: string;
      email?: string;
      name?: string;
      avatar?: string;
    };
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

### WidgetAPI

```typescript
interface WidgetAPI {
  update: (newProps: Partial<WidgetProps>) => void;
  unmount: () => void;
  emit: (eventName: string, payload?: object) => void;
}
```

## API Endpoints

### POST `/api/auth/bubble-exchange`

Exchange a Bubble JWT for a Next.js access token.

**Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "user": {
      "id": "user-123",
      "email": "user@example.com",
      "bubbleUserId": "bubble-user-456"
    }
  }
}
```

### GET `/api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Security Considerations

1. **JWT Secret**: Use a strong, random secret of at least 32 characters. Keep it synchronized between Bubble and Next.js.

2. **Token Expiration**:
   - Bubble tokens: 5 minutes (short-lived for exchange)
   - Next.js access tokens: 1 hour (configurable via `ACCESS_TOKEN_EXPIRY`)

3. **CORS**: The default configuration allows all origins. In production, restrict to your specific Bubble domains.

4. **Data Sanitization**: All data from Bubble is sanitized to prevent XSS attacks.

5. **HTTPS**: Always use HTTPS in production for both the widget script and API calls.

## Customization

### Styling

Edit `src/components/WidgetStyles.ts` to customize the widget appearance. Styles are injected into the Shadow DOM for isolation.

### Adding New Features

1. Add new components in `src/components/`
2. Import and use them in `src/components/Widget.tsx`
3. Add new service methods as needed
4. Rebuild the widget: `npm run build:widget`

### Adding API Routes

Create new routes in `src/app/api/`. Remember to:
1. Add proper CORS headers
2. Use the `authenticateRequest` helper for protected routes
3. Return consistent response formats

## Troubleshooting

### Widget not loading
- Check browser console for errors
- Verify the script URL is correct and accessible
- Ensure CORS is configured correctly

### Authentication failing
- Verify JWT_SECRET matches in both Bubble and Next.js
- Check token expiration times
- Ensure the token format is correct (3 parts separated by dots)

### Styles not applying
- Check if Shadow DOM is supported in the browser
- Verify styles are included in the widget bundle

## License

MIT

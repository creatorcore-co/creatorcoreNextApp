# Multi-Interface Architecture Setup Prompt

**Provide this prompt to an AI agent to transform this repo into a multi-interface container system.**

---

## Current System Overview

This Next.js repository currently builds a **single widget** that integrates with Bubble.io:

- **Entry Point**: `src/widget/entry.tsx` exports `window.NextWidget`
- **Build**: Vite compiles to `public/widget.js` (IIFE bundle)
- **Build Command**: `npm run build:widget`
- **Integration**: Bubble.io loads the bundle and mounts the widget using `window.NextWidget.mount()`
- **Authentication**: JWT token exchange via `/api/auth/bubble-exchange`
- **Communication**: Custom DOM events (widget → Bubble) and props updates (Bubble → widget)

## Desired Multi-Interface System

Transform this repo into a **container for multiple independent interfaces**, where:

1. **Each interface** is a separate bundled widget that can be rendered in different Bubble.io plugins
2. **Scaffolding system** allows team members to quickly create new interfaces from a boilerplate
3. **Pre-baked Bubble integration** in every interface (auth, events, services)
4. **AI-friendly documentation** for each interface explaining how to build features
5. **Multiple bundle outputs** - each interface builds to its own `.js` file
6. **CLI command** to generate new interfaces from templates

---

## Required Architecture

### 1. File Structure

Create this new structure:

```
src/
├── interfaces/                    # All widget interfaces live here
│   ├── widget/                    # Existing widget (rename/move current code)
│   │   ├── index.tsx              # Entry point (exports window.NextWidget)
│   │   ├── Component.tsx          # Main UI component
│   │   ├── types.ts               # Interface-specific types
│   │   ├── README.md              # AI agent documentation
│   │   └── package.json           # Interface metadata (name, description)
│   │
│   ├── _template/                 # Boilerplate template for new interfaces
│   │   ├── index.tsx              # Template entry with Bubble integration
│   │   ├── Component.tsx          # Basic component template
│   │   ├── types.ts               # Type definitions template
│   │   ├── README.md              # AI documentation template
│   │   └── package.json           # Metadata template
│   │
│   └── [new-interface]/           # Future interfaces created from template
│
├── shared/                        # Shared utilities across all interfaces
│   ├── bubble/                    # Bubble.io integration utilities
│   │   ├── entry-helpers.ts       # Shared mount/unmount logic
│   │   ├── event-emitter.ts       # Event emitter class
│   │   ├── logger.ts              # Debug logger
│   │   ├── types.ts               # Shared TypeScript types
│   │   └── services.ts            # Service layer types/helpers
│   │
│   ├── components/                # Shared React components
│   │   └── [reusable UI components]
│   │
│   └── styles/                    # Shared styles
│       └── base.ts                # Base widget styles
│
├── app/                           # Next.js app routes (unchanged)
│   ├── api/                       # API routes
│   └── page.tsx                   # Demo page
│
└── lib/                           # Utility libraries (auth, bubble helpers)

public/
└── bundles/                       # Built widget bundles
    ├── widget.js                  # Original widget
    ├── [interface-name].js        # Additional interfaces
    └── [interface-name].js.map    # Source maps

scripts/
└── create-interface.js            # CLI scaffolding script
```

### 2. CLI Scaffolding Tool

Create a script at `scripts/create-interface.js` that:

**Command**: `npm run create-interface <interface-name>`

**Behavior**:
1. Prompts for interface name (kebab-case)
2. Creates new folder in `src/interfaces/<interface-name>/`
3. Copies all files from `src/interfaces/_template/`
4. Replaces template placeholders:
   - `{{INTERFACE_NAME}}` → interface name (PascalCase)
   - `{{INTERFACE_NAME_KEBAB}}` → interface name (kebab-case)
   - `{{INTERFACE_NAME_CAMEL}}` → interface name (camelCase)
   - `{{DATE}}` → current date
5. Updates `vite.interfaces.config.ts` to include new interface in build
6. Logs success message with next steps

**Add npm script** to `package.json`:
```json
{
  "scripts": {
    "create-interface": "node scripts/create-interface.js"
  }
}
```

### 3. Template Files Content

#### `src/interfaces/_template/index.tsx`
```typescript
import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import {
  WidgetConfig,
  WidgetAPI,
  WidgetProps,
  LogLevel,
} from '@/shared/bubble/types';
import { createLogger } from '@/shared/bubble/logger';
import { WidgetEventEmitter } from '@/shared/bubble/event-emitter';
import { {{INTERFACE_NAME}}Component } from './Component';
import { {{INTERFACE_NAME}}Styles } from './styles';

function mount(container: HTMLElement, config: WidgetConfig): WidgetAPI {
  const debug = config.debug ?? false;
  const logger = createLogger(debug, '{{INTERFACE_NAME}}');
  const eventEmitter = new WidgetEventEmitter(debug, '{{INTERFACE_NAME}}');

  logger.info('Mounting {{INTERFACE_NAME}} interface');

  // Shadow DOM setup (shared logic)
  let mountPoint: HTMLElement | ShadowRoot = container;
  let shadowRoot: ShadowRoot | null = null;

  if (container.attachShadow) {
    try {
      shadowRoot = container.attachShadow({ mode: 'open' });
      mountPoint = shadowRoot;
    } catch {
      logger.debug('Shadow DOM not available');
    }
  }

  const innerContainer = document.createElement('div');
  innerContainer.id = '{{INTERFACE_NAME_KEBAB}}-root';
  mountPoint.appendChild(innerContainer);

  // Inject styles
  const styleElement = document.createElement('style');
  styleElement.textContent = {{INTERFACE_NAME}}Styles;
  if (shadowRoot) {
    shadowRoot.appendChild(styleElement);
  } else {
    if (!document.getElementById('{{INTERFACE_NAME_KEBAB}}-styles')) {
      styleElement.id = '{{INTERFACE_NAME_KEBAB}}-styles';
      document.head.appendChild(styleElement);
    }
  }

  let currentProps: WidgetProps = { ...config.props };
  let root: Root | null = createRoot(innerContainer);

  const render = () => {
    if (!root) return;
    root.render(
      <React.StrictMode>
        <{{INTERFACE_NAME}}Component
          config={{ ...config, props: currentProps }}
          onEmit={(event, payload) => eventEmitter.emit(event, payload)}
        />
      </React.StrictMode>
    );
  };

  render();

  setTimeout(() => {
    eventEmitter.emit('ready', { mounted: true });
  }, 0);

  // Return API for Bubble to interact with
  return {
    update: (newProps: Partial<WidgetProps>) => {
      currentProps = { ...currentProps, ...newProps };
      render();
    },
    unmount: () => {
      eventEmitter.emit('unmount', { timestamp: Date.now() });
      if (root) {
        root.unmount();
        root = null;
      }
      if (shadowRoot) {
        while (shadowRoot.firstChild) {
          shadowRoot.removeChild(shadowRoot.firstChild);
        }
      } else {
        innerContainer.remove();
      }
    },
    emit: (eventName: string, payload?: Record<string, unknown>) => {
      eventEmitter.emit(eventName, payload);
    },
  };
}

// Global interface object
const {{INTERFACE_NAME_CAMEL}}Global = { mount };

if (typeof window !== 'undefined') {
  window.{{INTERFACE_NAME_CAMEL}} = {{INTERFACE_NAME_CAMEL}}Global;
}

export { {{INTERFACE_NAME_CAMEL}}Global as {{INTERFACE_NAME}} };
export default {{INTERFACE_NAME_CAMEL}}Global;
```

#### `src/interfaces/_template/Component.tsx`
```typescript
import React from 'react';
import type { WidgetConfig } from '@/shared/bubble/types';

interface {{INTERFACE_NAME}}ComponentProps {
  config: WidgetConfig;
  onEmit: (event: string, payload?: Record<string, unknown>) => void;
}

export function {{INTERFACE_NAME}}Component({ config, onEmit }: {{INTERFACE_NAME}}ComponentProps) {
  const { props, services } = config;

  const handleAction = async () => {
    // Example: Call Next.js API
    try {
      const result = await services.callNextApi('/api/health');
      onEmit('action', { type: 'api-call', result });
    } catch (error) {
      onEmit('error', { message: error.message });
    }
  };

  return (
    <div className="{{INTERFACE_NAME_KEBAB}}-container">
      <h2>{{INTERFACE_NAME}} Interface</h2>
      <p>User: {props.user?.name || 'Guest'}</p>
      <button onClick={handleAction}>Test Action</button>
    </div>
  );
}
```

#### `src/interfaces/_template/README.md`
```markdown
# {{INTERFACE_NAME}} Interface

**Created**: {{DATE}}
**Bundle**: `/bundles/{{INTERFACE_NAME_KEBAB}}.js`
**Global Object**: `window.{{INTERFACE_NAME_CAMEL}}`

## Purpose
[Describe what this interface does]

## Bubble.io Integration

### Loading in Bubble
```html
<script src="https://your-app.vercel.app/bundles/{{INTERFACE_NAME_KEBAB}}.js"></script>
```

### Mounting the Interface
```javascript
const widget = window.{{INTERFACE_NAME_CAMEL}}.mount(
  document.getElementById('container'),
  {
    props: {
      user: { id: '123', name: 'John' },
      theme: 'light',
      // Add your custom props here
    },
    services: bubbleServices, // Provided by Bubble
    nextApiBase: 'https://your-app.vercel.app',
    bubbleAppName: 'your-bubble-app',
    isAuthenticated: true,
    debug: false
  }
);
```

## Pre-Baked Bubble Integration

This interface includes:

✅ **Authentication**: JWT token exchange via `/api/auth/bubble-exchange`
✅ **Event Emitter**: Send events to Bubble using `onEmit()`
✅ **Services Layer**: Access to Bubble workflows and APIs
✅ **Shadow DOM**: Style isolation from Bubble's CSS
✅ **Props Updates**: Reactive updates from Bubble via `widget.update()`

## Services Available

```typescript
services.callBubbleWorkflow(name, params) // Call Bubble workflows
services.callBubbleDataApi(endpoint, options) // Call Bubble Data API
services.callNextApi(endpoint, options) // Call Next.js API (with auth)
services.emitEvent(name, payload) // Emit events to Bubble
services.getNextToken() // Get current access token
services.isAuthenticated() // Check auth status
```

## Events Emitted

This interface emits these events to Bubble:

- `{{INTERFACE_NAME_KEBAB}}:ready` - Interface mounted successfully
- `{{INTERFACE_NAME_KEBAB}}:action` - User performed an action
- `{{INTERFACE_NAME_KEBAB}}:error` - Error occurred
- Custom events defined in Component.tsx

## Listening in Bubble

```javascript
document.addEventListener('{{INTERFACE_NAME_KEBAB}}:action', (e) => {
  console.log('Action:', e.detail.payload);
});
```

## Building New Features

When building features for this interface:

1. **Add UI components** to `Component.tsx`
2. **Call services** using the `services` object from config
3. **Emit events** using `onEmit()` to notify Bubble
4. **Use shared components** from `src/shared/components/`
5. **Add types** to `types.ts` for TypeScript safety
6. **Test locally** using `npm run dev` (Next.js dev server)
7. **Build bundle** using `npm run build:interfaces`

## Development Workflow

```bash
# Start Next.js dev server (for testing interface standalone)
npm run dev

# Build this interface bundle
npm run build:interfaces

# Build all interfaces + Next.js app
npm run build:all
```

## Example: Adding a Feature

```typescript
// In Component.tsx
const handleSubmitForm = async (formData) => {
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
- Bundle URL: `https://your-app.vercel.app/bundles/{{INTERFACE_NAME_KEBAB}}.js`
- API base: `https://your-app.vercel.app`
- Authentication endpoint: `https://your-app.vercel.app/api/auth/bubble-exchange`
```

#### `src/interfaces/_template/package.json`
```json
{
  "name": "{{INTERFACE_NAME_KEBAB}}",
  "description": "{{INTERFACE_NAME}} interface for Bubble.io integration",
  "version": "1.0.0",
  "private": true,
  "createdDate": "{{DATE}}"
}
```

### 4. Shared Utilities

Move common code to `src/shared/bubble/`:

#### `src/shared/bubble/logger.ts`
```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export function createLogger(debug: boolean, interfaceName: string) {
  const log = (level: LogLevel, ...args: unknown[]) => {
    if (!debug && level === 'debug') return;
    const prefix = `[${interfaceName}:${level.toUpperCase()}]`;
    switch (level) {
      case 'error': console.error(prefix, ...args); break;
      case 'warn': console.warn(prefix, ...args); break;
      case 'info': console.info(prefix, ...args); break;
      default: console.log(prefix, ...args);
    }
  };

  return {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args),
  };
}
```

#### `src/shared/bubble/event-emitter.ts`
```typescript
export class WidgetEventEmitter {
  private listeners: Map<string, Set<(payload?: Record<string, unknown>) => void>> = new Map();
  private logger: ReturnType<typeof import('./logger').createLogger>;
  private namespace: string;

  constructor(debug: boolean, namespace: string) {
    this.logger = require('./logger').createLogger(debug, namespace);
    this.namespace = namespace;
  }

  emit(event: string, payload?: Record<string, unknown>) {
    this.logger.debug('Emitting event:', event, payload);

    const customEvent = new CustomEvent(`${this.namespace}:${event}`, {
      detail: { event, payload, timestamp: Date.now() },
      bubbles: true,
      cancelable: false,
    });
    document.dispatchEvent(customEvent);

    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        this.logger.error('Error in event listener:', error);
      }
    });
  }
}
```

#### `src/shared/bubble/types.ts`
```typescript
// Move all shared types here from src/widget/types.ts
export interface WidgetUser {
  id: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

export interface WidgetProps {
  user?: WidgetUser;
  theme?: 'light' | 'dark';
  mode?: 'development' | 'production';
  customData?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WidgetServices {
  callBubbleWorkflow: (name: string, params?: Record<string, unknown>) => Promise<unknown>;
  callBubbleDataApi: (endpoint: string, options?: RequestInit) => Promise<unknown>;
  callNextApi: (endpoint: string, options?: RequestInit) => Promise<unknown>;
  emitEvent: (name: string, payload?: Record<string, unknown>) => void;
  getNextToken: () => string | null;
  isAuthenticated: () => boolean;
}

export interface WidgetConfig {
  props: WidgetProps;
  services: WidgetServices;
  nextApiBase: string;
  bubbleAppName: string;
  isAuthenticated: boolean;
  debug?: boolean;
}

export interface WidgetAPI {
  update: (newProps: Partial<WidgetProps>) => void;
  unmount: () => void;
  emit: (eventName: string, payload?: Record<string, unknown>) => void;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
```

### 5. Build Configuration

Create `vite.interfaces.config.ts` that builds **all interfaces**:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';
import path from 'path';

// Dynamically find all interfaces
const interfacesDir = resolve(__dirname, 'src/interfaces');
const interfaces = fs
  .readdirSync(interfacesDir)
  .filter(name => {
    const fullPath = path.join(interfacesDir, name);
    return fs.statSync(fullPath).isDirectory() &&
           name !== '_template' &&
           fs.existsSync(path.join(fullPath, 'index.tsx'));
  });

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    rollupOptions: {
      input: interfaces.reduce((acc, name) => {
        acc[name] = resolve(__dirname, `src/interfaces/${name}/index.tsx`);
        return acc;
      }, {} as Record<string, string>),
      output: {
        dir: 'public/bundles',
        entryFileNames: '[name].js',
        format: 'iife',
        inlineDynamicImports: false,
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
```

**Update package.json scripts**:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:widget": "vite build --config vite.widget.config.ts",
    "build:interfaces": "vite build --config vite.interfaces.config.ts",
    "build:all": "npm run build && npm run build:interfaces",
    "create-interface": "node scripts/create-interface.js",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 6. Documentation

Create `docs/AI_AGENT_GUIDE.md` with comprehensive instructions:

```markdown
# AI Agent Guide: Building Interfaces for Bubble.io

This guide helps AI agents understand how to build new interfaces in this Next.js repository that integrate with Bubble.io.

## Quick Start

1. **Create a new interface**:
   ```bash
   npm run create-interface my-feature
   ```

2. **Read the interface README**:
   ```bash
   cat src/interfaces/my-feature/README.md
   ```

3. **Build features in**:
   - `src/interfaces/my-feature/Component.tsx` (main UI)
   - `src/interfaces/my-feature/types.ts` (custom types)

4. **Test and build**:
   ```bash
   npm run dev # Test in Next.js
   npm run build:interfaces # Build bundle
   ```

## Architecture Overview

[Include the architecture explanation from earlier - multi-interface system, Bubble integration, etc.]

## Authentication Flow

[Detailed explanation of JWT exchange, access tokens, etc.]

## Event Communication

[How events work, DOM events, props updates, etc.]

## Best Practices

1. **Never modify `index.tsx`** in an interface - it's the pre-configured Bubble integration
2. **Always use `services` for API calls** - it handles auth automatically
3. **Emit events generously** - keep Bubble informed of state changes
4. **Use TypeScript** - type safety prevents bugs
5. **Test before building** - use the Next.js dev server

## Common Patterns

### Calling Next.js API
```typescript
const result = await services.callNextApi('/api/endpoint', {
  method: 'POST',
  body: JSON.stringify(data)
});
```

### Calling Bubble Workflow
```typescript
await services.callBubbleWorkflow('workflow-name', { param: 'value' });
```

### Emitting Events
```typescript
onEmit('event-name', { data: 'value' });
```

### Handling User Actions
```typescript
const handleClick = async () => {
  onEmit('action', { type: 'button-click' });
  const result = await services.callNextApi('/api/action');
  onEmit('action-complete', { result });
};
```

## Troubleshooting

[Common issues and solutions]
```

### 7. Migration Steps

To transform the existing codebase:

1. **Create new directory structure**
2. **Move current widget** to `src/interfaces/widget/`
3. **Extract shared code** to `src/shared/bubble/`
4. **Create template** at `src/interfaces/_template/`
5. **Create CLI script** at `scripts/create-interface.js`
6. **Update Vite config** to `vite.interfaces.config.ts`
7. **Update package.json** scripts
8. **Create documentation** at `docs/AI_AGENT_GUIDE.md`
9. **Test everything** works

---

## Implementation Checklist

- [ ] Create `src/interfaces/` directory structure
- [ ] Create `src/shared/bubble/` utilities
- [ ] Move existing widget to `src/interfaces/widget/`
- [ ] Create `src/interfaces/_template/` with boilerplate
- [ ] Create `scripts/create-interface.js` CLI tool
- [ ] Create `vite.interfaces.config.ts` build config
- [ ] Update `package.json` scripts
- [ ] Create `docs/AI_AGENT_GUIDE.md`
- [ ] Create README for each interface
- [ ] Test creating a new interface with CLI
- [ ] Test building multiple interfaces
- [ ] Verify bundles work in Bubble.io
- [ ] Update main README.md with new architecture

---

## Expected End Result

After implementation, a team member should be able to:

1. Run `npm run create-interface my-dashboard`
2. See a new folder at `src/interfaces/my-dashboard/`
3. Read `src/interfaces/my-dashboard/README.md` for instructions
4. Build UI in `Component.tsx` using pre-baked Bubble services
5. Run `npm run build:interfaces`
6. Load `https://app.vercel.app/bundles/my-dashboard.js` in Bubble.io
7. Mount using `window.myDashboard.mount(container, config)`
8. Have full auth, events, and API integration working automatically

## Example Usage After Setup

```bash
# Developer creates a new interface
$ npm run create-interface user-profile

✅ Created interface: user-profile
📁 Location: src/interfaces/user-profile/
📖 Documentation: src/interfaces/user-profile/README.md
🔨 Next steps:
   1. Read the README for integration details
   2. Build features in Component.tsx
   3. Run 'npm run build:interfaces' to create bundle
   4. Deploy and use bundle URL in Bubble.io

# Developer or AI agent builds features
$ code src/interfaces/user-profile/Component.tsx
[... builds UI, uses services, emits events ...]

# Build all interfaces
$ npm run build:all

✅ Built 3 interfaces:
   - widget.js (45 KB)
   - user-profile.js (38 KB)
   - my-dashboard.js (52 KB)

# Deploy to Vercel
$ git push

# Use in Bubble.io
<script src="https://app.vercel.app/bundles/user-profile.js"></script>
<script>
  window.userProfile.mount(document.getElementById('container'), config);
</script>
```

---
name: creatorcore-nextjs
description: |
  Master skill for CreatorCore Next.js - a multi-interface system for building
  embeddable React widgets that integrate with Bubble.io. Use this skill when
  working on any part of the CreatorCore system. It provides an index to
  specialized skills for specific tasks.
---

# CreatorCore Next.js

CreatorCore is a multi-interface Next.js application for building embeddable React widgets that integrate with Bubble.io. Each interface compiles to a standalone IIFE JavaScript bundle that can be loaded into any webpage and communicates with Bubble through events and API services.

## System Architecture

### How It Works

```
Bubble.io Page
├── Loads: https://creatorcore-next-app.vercel.app/bundles/{interface}.js
├── Calls: window.{InterfaceName}.mount(container, config)
├── Listens: document.addEventListener('{interface-name}:{event}', ...)
└── Provides: services object with API methods
```

### Key Concepts

1. **Interfaces**: Self-contained React widgets in `src/interfaces/`. Each bundles to `public/bundles/{name}.js`
2. **Shadow DOM**: Style isolation - each interface renders in its own shadow root
3. **Services Object**: Bubble provides API methods to the interface at mount time
4. **Event System**: Interfaces emit DOM CustomEvents for Bubble to listen to
5. **JWT Authentication**: Secure token exchange between Bubble and Next.js

## Directory Structure

```
creatorcoreNextApp/
├── .claude/
│   └── skills/              # AI agent skills (you are here)
│
├── src/
│   ├── interfaces/          # All embeddable interfaces
│   │   ├── _template/       # Template for scaffolding (DO NOT MODIFY)
│   │   └── {name}/          # Each interface has: index.tsx, Component.tsx, types.ts, styles.ts
│   │
│   ├── shared/bubble/       # Shared utilities for all interfaces
│   │   ├── types.ts         # BubbleServices, BubbleUser, API response types
│   │   ├── logger.ts        # Debug logging utility
│   │   └── event-emitter.ts # DOM event dispatching
│   │
│   ├── lib/                 # Server-side utilities
│   │   ├── auth.ts          # JWT verification & token exchange
│   │   ├── bubble.ts        # Bubble API helpers
│   │   └── schema-inference.ts  # Schema inference for workflow discovery
│   │
│   ├── config/              # Configuration files
│   │   └── bubble-workflows.ts  # Registry of known Bubble workflows
│   │
│   └── app/                 # Next.js App Router
│       ├── api/
│       │   ├── auth/bubble-exchange/  # Token exchange endpoint
│       │   ├── bubble/discover/       # Workflow discovery endpoint
│       │   └── health/                # Health check
│       └── page.tsx
│
├── public/bundles/          # Built interface bundles (*.js)
│
├── scripts/
│   ├── create-interface.js       # Scaffolds new interfaces
│   ├── build-interfaces.js       # Builds interfaces (supports selective builds)
│   ├── detect-changed-interfaces.js  # Detects changed interfaces
│   ├── generate-bundle-manifest.js   # Generates bundle manifest
│   └── discover-workflow.js      # CLI for workflow discovery
│
├── docs/
│   ├── AI_AGENT_GUIDE.md    # Overview guide for AI agents
│   └── CREATING_INTERFACES.md  # Step-by-step interface creation guide
│
├── vite.widget.config.ts    # Vite build configuration
└── package.json
```

## Quick Reference: Which Skill to Use

| Task | Skill | Key Command |
|------|-------|-------------|
| Create a new interface/widget | [create-interface](./create-interface/SKILL.md) | `npm run create-interface <name>` |
| Design Bubble backend workflows | [workflow-design](./workflow-design/SKILL.md) | Suggest workflow specs |
| Call Bubble APIs from interface | [bubble-integration](./bubble-integration/SKILL.md) | Use `services` object |
| Discover Bubble workflow schemas | [workflow-discovery](./workflow-discovery/SKILL.md) | `npm run discover-workflow <name>` |
| Implement authentication | [authentication](./authentication/SKILL.md) | `/api/auth/bubble-exchange` |
| Build UI components | [component-patterns](./component-patterns/SKILL.md) | Edit `Component.tsx` |
| Build and deploy | [deployment](./deployment/SKILL.md) | `npm run build:interfaces` |

## Key Conventions

### Naming Conventions

| Element | Format | Example |
|---------|--------|---------|
| Interface directory | kebab-case | `user-dashboard` |
| Component name | PascalCase | `UserDashboardComponent` |
| Global window object | PascalCase | `window.UserDashboard` |
| Events | kebab-case with prefix | `user-dashboard:item-selected` |
| CSS classes | kebab-case with prefix | `.user-dashboard-card` |

### File Responsibilities

| File | Purpose | Modify? |
|------|---------|---------|
| `index.tsx` | Mount logic, Shadow DOM, event wiring | Never |
| `Component.tsx` | UI implementation | Yes |
| `styles.ts` | CSS-in-JS styles | Yes |
| `types.ts` | TypeScript definitions | Yes |

### Critical Rules

1. **Never modify `index.tsx`** - It's generated from template and handles mounting
2. **Use `services` for all API calls** - Never use `fetch()` directly
3. **Prefix all CSS classes** - Use interface name prefix (e.g., `.my-feature-card`)
4. **Emit events for state changes** - Bubble listens for these events
5. **Support light and dark themes** - Include both in `styles.ts`

## Environment Setup

### Required Environment Variables

```env
# JWT Configuration (sync with Bubble)
JWT_SECRET=your-secret-key-minimum-32-characters

# Bubble App Configuration
BUBBLE_BASE_URL=https://app.creatorcore.co/version-test
BUBBLE_API_KEY=your_bubble_api_key  # Required for workflow discovery

# Token Configuration
ACCESS_TOKEN_EXPIRY=3600

# App URL
NEXT_PUBLIC_APP_URL=https://creatorcore-next-app.vercel.app
```

### Development Setup

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev

# Build interfaces
npm run build:interfaces
```

## Common Tasks

### Creating a New Interface

1. Scaffold: `npm run create-interface my-widget`
2. Discover API schemas: `npm run discover-workflow get_widget_data`
3. Build UI in `src/interfaces/my-widget/Component.tsx`
4. Add styles in `src/interfaces/my-widget/styles.ts`
5. Build: `npm run build:interfaces`
6. Push to deploy

See [create-interface skill](./create-interface/SKILL.md) for detailed instructions.

### Calling Bubble APIs

```typescript
// In your Component.tsx
const data = await services.callBubbleWorkflow('workflow_name', { param: 'value' });
const items = await services.callBubbleDataApi('/obj/items');
const result = await services.callNextApi('/api/endpoint');
```

See [bubble-integration skill](./bubble-integration/SKILL.md) for full API reference.

### Emitting Events

```typescript
// In your Component.tsx
onEmit('item-selected', { itemId: '123', itemData: item });
onEmit('error', { message: 'Failed to load', code: 'LOAD_ERROR' });
```

Events are dispatched as `{interface-name}:{event-name}` CustomEvents.

## Specialized Skills

### [create-interface](./create-interface/SKILL.md)
Creating new embeddable interfaces from scratch. Covers scaffolding, component structure, styling patterns, and event communication.

### [bubble-integration](./bubble-integration/SKILL.md)
Working with Bubble.io APIs including workflow calls, Data API, and the services object interface.

### [authentication](./authentication/SKILL.md)
JWT token exchange flow between Bubble and Next.js, securing API endpoints, and managing auth state.

### [component-patterns](./component-patterns/SKILL.md)
Building UI components with CSS-in-JS, Shadow DOM styling, state management, and accessibility.

### [deployment](./deployment/SKILL.md)
Build process, Vite configuration, Vercel deployment, and troubleshooting.

### [workflow-design](./workflow-design/SKILL.md)
Designing Bubble backend workflow specifications when users haven't provided them. Covers endpoint settings, parameters, response formats, pagination strategies, and presenting designs for user implementation.

### [workflow-discovery](./workflow-discovery/SKILL.md)
Using the workflow discovery tool to inspect Bubble API response schemas and generate TypeScript types.

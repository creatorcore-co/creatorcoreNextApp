---
name: deployment
description: |
  Use this skill when deploying interfaces, understanding the build process,
  or troubleshooting deployment issues.
---

# Deployment

This skill covers the build process for interfaces, Vite configuration, Vercel deployment, and troubleshooting common deployment issues.

## Build Process Overview

Each interface in `src/interfaces/` is built to a standalone IIFE (Immediately Invoked Function Expression) JavaScript bundle:

```
src/interfaces/my-widget/          public/bundles/my-widget.js
├── index.tsx           ──────►    (single minified file)
├── Component.tsx
├── types.ts
└── styles.ts
```

The build process:
1. **Discovers** all interface directories (excluding `_template`)
2. **Compiles** each with Vite + React plugin
3. **Bundles** all dependencies inline (React, etc.)
4. **Minifies** with Terser
5. **Outputs** to `public/bundles/{name}.js`

## Build Commands

```bash
# Build all interfaces
npm run build:interfaces

# Build only changed interfaces (uses change detection)
npm run build:interfaces:changed

# Build specific interfaces
npm run build:interfaces -- --only=widget,dashboard

# Force rebuild all (ignores change detection)
npm run build:interfaces:force

# Build Next.js app only
npm run build

# Build everything (Next.js + all interfaces)
npm run build:all
```

## Selective Builds

The selective build system improves development speed by only rebuilding interfaces that have changed.

### How It Works

1. **Change Detection** (`scripts/detect-changed-interfaces.js`)
   - Hashes all files in each interface directory
   - Hashes shared dependencies (`src/shared/`, `vite.widget.config.ts`)
   - Compares against `public/bundles/manifest.json`
   - Returns list of changed interfaces

2. **Manifest Tracking** (`public/bundles/manifest.json`)
   - Records source hash for each interface
   - Tracks bundle file size and build timestamp
   - Shared hash for detecting shared dependency changes

3. **Build Logic**
   - If shared files changed → rebuild ALL interfaces
   - If only specific interfaces changed → rebuild only those
   - After build → regenerate manifest

### Using Selective Builds

```bash
# Check what would be rebuilt
npm run detect-changes

# Build only changed interfaces
npm run build:interfaces:changed

# Force rebuild all (also regenerates manifest)
npm run build:interfaces:force
```

### Manifest Format

```json
{
  "version": "1.0.0",
  "generatedAt": "2024-01-15T12:00:00.000Z",
  "sharedHash": "abc123def456...",
  "bundles": {
    "widget": {
      "sourceHash": "789xyz...",
      "bundleFile": "widget.js",
      "bundleSize": 45678,
      "builtAt": "2024-01-15T12:00:00.000Z"
    },
    "dashboard": {
      "sourceHash": "456abc...",
      "bundleFile": "dashboard.js",
      "bundleSize": 52341,
      "builtAt": "2024-01-15T12:00:00.000Z"
    }
  }
}
```

### Committing the Manifest

The manifest should be committed to git:
- Tracks bundle versions in version control
- Enables change detection across machines
- Shows what changed between commits

```bash
# After building, commit the manifest
git add public/bundles/manifest.json
git commit -m "Update bundle manifest"
```

## Vite Configuration

The build configuration is in `vite.widget.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: 'src/interfaces/widget/index.tsx',
      name: 'NextWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    outDir: 'public/bundles',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        extend: true,
        exports: 'named',
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: false },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
```

### Key Configuration Points

| Setting | Value | Purpose |
|---------|-------|---------|
| `formats: ['iife']` | IIFE bundle | Works in browsers without module system |
| `inlineDynamicImports` | true | Single file with all deps |
| `drop_console: false` | Keep console | Enables debug logging |
| `alias: '@'` | `./src` | Allows `@/shared/bubble` imports |

## Bundle Output Format

Each bundle exposes a global object:

```javascript
// public/bundles/my-widget.js
window.MyWidget = {
  mount: function(container, config) {
    // Mounts the interface
    // Returns API object
  }
};
```

### Global Name Generation

| Interface Directory | Global Name |
|---------------------|-------------|
| `widget` | `NextWidget` (special case) |
| `user-dashboard` | `UserDashboard` |
| `payment-form` | `PaymentForm` |
| `my-cool-widget` | `MyCoolWidget` |

The build script converts kebab-case to PascalCase.

## Vercel Deployment

### Auto-Deployment

This repo uses Vercel's automatic deployment:
1. Push to GitHub
2. Vercel detects changes
3. Runs `npm run build`
4. Deploys to production

No custom GitHub Actions or build scripts needed.

### URLs After Deployment

| Resource | URL |
|----------|-----|
| **Main App** | `https://creatorcore-next-app.vercel.app` |
| **Bundles** | `https://creatorcore-next-app.vercel.app/bundles/{name}.js` |
| **API Routes** | `https://creatorcore-next-app.vercel.app/api/{route}` |

### Environment Variables

Configure in Vercel Dashboard → Project → Settings → Environment Variables:

```
JWT_SECRET=your-production-secret-32-chars-min
BUBBLE_BASE_URL=https://app.creatorcore.co/version-test
ACCESS_TOKEN_EXPIRY=3600
NEXT_PUBLIC_APP_URL=https://creatorcore-next-app.vercel.app
BUBBLE_API_KEY=your-bubble-api-key
```

**Important:**
- `NEXT_PUBLIC_*` variables are exposed to the browser
- Other variables are server-side only
- Set different values for Preview vs Production if needed

## Testing Before Deployment

### Local Build Test

```bash
# Build interfaces
npm run build:interfaces

# Build Next.js
npm run build

# Start production server
npm run start
```

### Verify Bundles

```bash
# Check bundle exists
ls -la public/bundles/

# Check bundle size (should be reasonable)
du -h public/bundles/*.js
```

### Test Bundle Loading

Create a simple HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Bundle Test</title>
</head>
<body>
  <div id="widget-container"></div>

  <script src="http://localhost:3000/bundles/my-widget.js"></script>
  <script>
    const widget = window.MyWidget.mount(
      document.getElementById('widget-container'),
      {
        props: { theme: 'light', mode: 'embedded' },
        services: {
          callBubbleWorkflow: async () => ({ status: 'success', response: {} }),
          callBubbleDataApi: async () => ({ response: { results: [] } }),
          callNextApi: async () => ({}),
          emitEvent: () => {},
          getNextToken: () => null,
          isAuthenticated: () => false,
        },
        vercelBaseUrl: 'http://localhost:3000',
        bubbleBaseUrl: 'https://test.bubbleapps.io',
        isAuthenticated: false,
        debug: true,
      }
    );

    // Listen for events
    document.addEventListener('my-widget:ready', (e) => {
      console.log('Widget ready:', e.detail);
    });
  </script>
</body>
</html>
```

## Troubleshooting

### Build Errors

#### "Cannot find module '@/shared/bubble'"

The path alias isn't resolving. Check:
1. `vite.widget.config.ts` has the alias configured
2. `tsconfig.json` has matching paths config

```typescript
// vite.widget.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, 'src'),
  },
}
```

#### "Type error in Component.tsx"

```bash
# Check types before building
npm run lint
```

Fix TypeScript errors before building.

#### "Interface not found: xyz"

The interface directory doesn't exist or lacks `index.tsx`:
```bash
ls src/interfaces/xyz/index.tsx
```

### Bundle Issues

#### Bundle Too Large

Check what's being bundled:

```bash
# Install analyzer
npm install -D rollup-plugin-visualizer

# Add to vite config temporarily
plugins: [
  react(),
  visualizer({ open: true })
]

# Build and analyze
npm run build:interfaces
```

Common causes:
- Importing large libraries unnecessarily
- Bundling dev-only code
- Not tree-shaking properly

#### "window.MyWidget is undefined"

1. Check the script loaded: Browser Network tab
2. Check for JavaScript errors: Browser Console
3. Verify the bundle exists: `ls public/bundles/my-widget.js`
4. Check the global name in build output

#### Styles Not Working

1. Verify styles are in `styles.ts` (not external CSS)
2. Check all classes are prefixed with interface name
3. Verify the styles are being injected (inspect Shadow DOM)
4. Check for CSS syntax errors

### Deployment Issues

#### "404 Not Found" for Bundle

1. Verify file exists: `ls public/bundles/`
2. Check file name matches (case-sensitive)
3. Verify Vercel deployment included `public/bundles/`
4. Check Vercel build logs for errors

#### "CORS Error" on API Calls

The API route needs CORS headers:

```typescript
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
```

#### "Environment Variable Not Set"

1. Check Vercel dashboard for env vars
2. Verify variable name matches code exactly
3. Redeploy after adding env vars (don't hot reload)
4. For `NEXT_PUBLIC_*`, verify it's used correctly

### Cache Issues

#### Bubble Loading Old Bundle

Bundles have 1-hour cache. Force refresh:

```javascript
// Add cache buster
const bundleUrl = `https://creatorcore-next-app.vercel.app/bundles/widget.js?v=${Date.now()}`;
```

Or update Next.js config for different cache headers.

#### Browser Caching Old Version

1. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
2. Clear browser cache
3. Test in incognito window

## Deployment Checklist

### Before Deploying

- [ ] All interfaces build successfully: `npm run build:interfaces`
- [ ] No TypeScript errors: `npm run lint`
- [ ] Tested locally with `npm run dev`
- [ ] Bundle sizes are reasonable (< 200KB each)
- [ ] All environment variables set in Vercel

### After Deploying

- [ ] Verify bundles load: `https://creatorcore-next-app.vercel.app/bundles/{name}.js`
- [ ] Verify API routes work: `https://creatorcore-next-app.vercel.app/api/health`
- [ ] Test in Bubble with the new bundle
- [ ] Check browser console for errors
- [ ] Verify events emit correctly

### Rollback if Needed

1. Go to Vercel Dashboard → Deployments
2. Find the previous working deployment
3. Click "..." → "Promote to Production"

Or revert in git:
```bash
git revert HEAD
git push
```

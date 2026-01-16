# Creating New Interfaces

This guide walks you through creating new interfaces step-by-step, using AI agents to build them, and deploying to Vercel.

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
| `Component.tsx` | Your main UI component (AI agent builds this) |
| `styles.ts` | CSS styles injected into Shadow DOM (AI agent builds this) |
| `types.ts` | TypeScript type definitions (AI agent can extend this) |
| `package.json` | Interface metadata |

---

## Step 2: Prompt AI Agent to Build the Interface

### Files to Edit

The AI agent will work on these files:
- **`src/interfaces/my-dashboard/Component.tsx`** - Main UI component
- **`src/interfaces/my-dashboard/styles.ts`** - CSS-in-JS styles

### Before You Prompt: Prepare Your Requirements

#### 1. Design the UI
- Create a Figma design, wireframe, or detailed UI description
- If using Figma, ensure your agent has access to Figma MCP for automatic design conversion
- Specify theme requirements (light/dark mode support)
- Define responsive behavior and mode variants (compact/full/embedded)

#### 2. Set Up Data Sources in Bubble

For each group of data your interface needs, create a **Bubble backend workflow**:

**Example workflow setup:**
- **Workflow name**: `get_user_dashboard_data`
- **Purpose**: Fetch user stats, recent activity, notifications
- **Response format**:
  ```json
  {
    "stats": {
      "totalViews": 1234,
      "totalPosts": 56,
      "followers": 789
    },
    "recentActivity": [
      { "id": "1", "type": "post", "title": "...", "date": "2024-01-15" }
    ],
    "notifications": { "unread": 5 }
  }
  ```

**Document each workflow:**
- Workflow name (exact match)
- What data it returns
- Expected parameters (if any)
- Response structure

#### 3. Identify Event Requirements

List all events your interface should emit to Bubble:
- When should they fire?
- What payload data should they include?
- How will Bubble respond to these events?

### Prompting the AI Agent

#### 1. Open Your AI Agent

Open your AI coding agent (Claude Code, Cursor, etc.)

#### 2. Provide the AI Agent Guide

Share the AI Agent Guide with your agent:
```
Please read @docs/AI_AGENT_GUIDE.md - this contains all the architectural
patterns and requirements for building interfaces in this repository.
```

#### 3. Structure Your Prompt

Include these elements in your prompt:

**A. Interface Purpose**
```
Build a user dashboard interface called "my-dashboard" that displays:
- User stats (views, posts, followers)
- Recent activity feed
- Notification count
```

**B. UI Design**
```
Design requirements:
- Modern card-based layout with subtle shadows
- Header with user avatar and name
- 3-column stats grid
- Activity feed with infinite scroll
- Notification bell icon in header
- Support light and dark themes
- Responsive: stack columns on mobile

[Attach Figma file or design screenshot]
```

**C. Data Sources**
```
Backend workflows in Bubble:
1. get_user_dashboard_data
   - Returns: { stats: {...}, recentActivity: [...], notifications: {...} }
   - Called on mount

2. load_more_activity
   - Parameters: { offset: number }
   - Returns: { activities: [...], hasMore: boolean }
   - Called on scroll
```

**D. Events to Emit**
```
Events:
- 'dashboard-loaded' - when data is fetched (payload: { stats })
- 'activity-clicked' - when user clicks activity item (payload: { activityId })
- 'refresh-requested' - when user clicks refresh button (payload: {})
- 'error' - on any error (payload: { message, operation })
```

**E. Styling Requirements**
```
Style guidelines:
- Use gradient accent colors: #6366f1 to #8b5cf6
- Card border-radius: 12px
- Smooth transitions on hover (200ms)
- Status indicators: green for active, yellow for pending
- Dark mode: #1f2937 background, #374151 cards
```

### Full Example Prompt

```
Read @docs/AI_AGENT_GUIDE.md for the architecture and patterns.

Create a "user-dashboard" interface with these requirements:

UI DESIGN:
- Modern card-based dashboard layout
- Header with user avatar, name, and notification bell
- 3-column stats grid (total views, posts, followers)
- Activity feed with infinite scroll
- Support light/dark themes and compact/full modes
[Attached: dashboard-design.fig]

DATA SOURCES:
1. Bubble workflow: get_user_dashboard_data
   Response: {
     stats: { totalViews: number, totalPosts: number, followers: number },
     recentActivity: Array<{ id: string, type: string, title: string, date: string }>,
     notifications: { unread: number }
   }
   Call on component mount

2. Bubble workflow: load_more_activity
   Parameters: { offset: number }
   Response: { activities: Array<...>, hasMore: boolean }
   Call on scroll to bottom

EVENTS TO EMIT:
- 'dashboard-loaded' with { stats } - after data loads
- 'activity-clicked' with { activityId, activityType } - on activity click
- 'notification-bell-clicked' with { unreadCount } - on bell click
- 'refresh-requested' with {} - on refresh button click
- 'error' with { message, operation } - on any error

STYLING:
- Gradient buttons: #6366f1 to #8b5cf6
- Border radius: 12px
- Smooth hover transitions (200ms)
- Dark mode: #1f2937 bg, #374151 cards, #f9fafb text
- Light mode: #ffffff bg, #f9fafb cards, #1f2937 text

The interface should handle loading states, empty states, and error states gracefully.
```

---

## Step 3: Build the Interface Bundle

Once the AI agent has completed the interface, build all interfaces:

```bash
npm run build:interfaces
```

This generates `public/bundles/my-dashboard.js`.

To build everything (Next.js app + all interfaces):

```bash
npm run build:all
```

---

## Step 4: Deploy to Vercel

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
   https://creatorcore-next-app.vercel.app/bundles/my-dashboard.js
   ```

---

## Step 5: Use in Bubble.io

Add your interface to Bubble using the plugin element. Configure with these values:

### Plugin Configuration

| Field | Value | Description |
|-------|-------|-------------|
| **bundle_url** | `https://creatorcore-next-app.vercel.app/bundles/my-dashboard.js` | URL to your interface bundle |
| **next_api_base** | `https://creatorcore-next-app.vercel.app` | Base URL for Next.js API routes |
| **bubble_app_name** | `creatorcore` | Your Bubble app name |
| **props_json** | `{"user": {"id": "...", "name": "..."}, "theme": "light", "mode": "embedded"}` | Props to pass to the interface (JSON string) |

### Example props_json Values

**Minimal:**
```json
{
  "theme": "light",
  "mode": "embedded"
}
```

**With user data:**
```json
{
  "user": {
    "id": "user123",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "theme": "dark",
  "mode": "full"
}
```

**With custom data:**
```json
{
  "user": {"id": "user123", "name": "John"},
  "theme": "light",
  "mode": "embedded",
  "customData": {
    "organizationId": "org456",
    "permissions": ["read", "write"],
    "settings": {"notifications": true}
  }
}
```

### Listening for Events in Bubble

The interface will emit events that you can listen for in Bubble workflows. Event names follow the format: `{interface-name}:{event-name}`

**Examples for my-dashboard:**
- `my-dashboard:dashboard-loaded`
- `my-dashboard:activity-clicked`
- `my-dashboard:refresh-requested`
- `my-dashboard:error`

---

## Additional Prompting Examples

### Simple Display Widget

```
Read @docs/AI_AGENT_GUIDE.md

Create a "notification-bell" interface:

UI:
- Bell icon with unread count badge
- Dropdown list of notifications on click
- Compact mode (icon only) and full mode (with label)

DATA:
Bubble workflow: get_user_notifications
Response: { notifications: Array<{ id, title, message, read, date }>, unreadCount: number }

EVENTS:
- 'notification-clicked' with { notificationId }
- 'mark-as-read' with { notificationId }

STYLING:
- Bell icon: 24px, subtle animation on new notification
- Badge: red circle with white number
- Dropdown: white card with shadow, max 5 visible items
```

### Complex Form Interface

```
Read @docs/AI_AGENT_GUIDE.md

Create a "checkout-form" interface:

UI:
- Multi-step form (shipping, payment, review)
- Progress indicator showing current step
- Form validation with inline errors
- Support for saved payment methods

DATA:
1. Bubble workflow: get_saved_addresses
   Response: { addresses: Array<{ id, street, city, state, zip }> }

2. Bubble workflow: validate_address
   Parameters: { street, city, state, zip }
   Response: { valid: boolean, suggestions?: Array<...> }

3. Bubble workflow: process_payment
   Parameters: { amount, paymentMethod, shippingAddress }
   Response: { success: boolean, orderId?: string, error?: string }

EVENTS:
- 'step-changed' with { step: number, totalSteps: number }
- 'order-submitted' with { orderId, amount }
- 'payment-error' with { message }

[Attached: checkout-flow.fig]
```

---

## Tips for Better AI Results

1. **Be specific about styling:**
   - Provide exact colors, spacing, border-radius values
   - Specify animations and transitions
   - Include both light and dark mode requirements

2. **Document data structures completely:**
   - Show exact JSON response formats
   - Include all fields with their types
   - Note optional vs required fields

3. **Define error handling:**
   - What should happen on API failures?
   - Empty state handling
   - Loading state requirements

4. **Include accessibility requirements:**
   - ARIA labels needed
   - Keyboard navigation support
   - Focus indicators

5. **Reference similar patterns:**
   - "Similar to the widget interface's loading pattern"
   - "Use the same error handling as the auth flow"

---

## Workflow Naming Best Practices

Name your Bubble workflows descriptively:

| Good | Bad |
|------|-----|
| `get_user_dashboard_data` | `getData` |
| `update_user_profile` | `update` |
| `send_notification_email` | `sendEmail` |
| `validate_payment_method` | `validate` |

Use snake_case (Bubble convention) and include:
- Action verb (get, update, send, validate)
- Entity (user, notification, payment)
- Context (dashboard, profile, method)

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

- [ ] AI agent completed Component.tsx and styles.ts
- [ ] Interface builds without errors (`npm run build:interfaces`)
- [ ] Types are correct (`npm run lint`)
- [ ] Tested locally with `npm run dev`
- [ ] Styles work in both light and dark themes
- [ ] Events emit correctly (check browser console)
- [ ] API calls to Bubble workflows work
- [ ] Error handling tested
- [ ] Loading and empty states look correct
- [ ] Committed and pushed to repo
- [ ] Vercel deployment successful
- [ ] Bundle accessible at `https://creatorcore-next-app.vercel.app/bundles/{name}.js`

# AI Agent Guide: CreatorCore Next.js

This guide helps AI coding agents understand the CreatorCore system and navigate to the appropriate resources for specific tasks.

## Skills System

**Detailed implementation instructions are in `.claude/skills/`.** This guide provides an overview; refer to individual skills for step-by-step instructions.

### Available Skills

| Skill | Location | Use When... |
|-------|----------|-------------|
| **creatorcore-nextjs** | `.claude/skills/SKILL.md` | Starting any task, need system overview |
| **create-interface** | `.claude/skills/create-interface/SKILL.md` | Creating a new widget/interface |
| **bubble-integration** | `.claude/skills/bubble-integration/SKILL.md` | Calling Bubble APIs, using services object |
| **authentication** | `.claude/skills/authentication/SKILL.md` | Implementing JWT auth, securing endpoints |
| **component-patterns** | `.claude/skills/component-patterns/SKILL.md` | Building UI components, styling |
| **deployment** | `.claude/skills/deployment/SKILL.md` | Building, deploying, troubleshooting |
| **workflow-discovery** | `.claude/skills/workflow-discovery/SKILL.md` | Discovering Bubble API schemas |

---

## Quick Reference

### Task Decision Tree

**"I need to create a new interface/widget"**
→ Use skill: `create-interface`
→ Command: `npm run create-interface <name>`

**"I need to call a Bubble workflow or API"**
→ Use skill: `bubble-integration`
→ Use `services.callBubbleWorkflow()` or `services.callBubbleDataApi()`

**"I need to know the response format of a Bubble workflow"**
→ Use skill: `workflow-discovery`
→ Command: `npm run discover-workflow <workflow_name>`

**"I need to implement authentication"**
→ Use skill: `authentication`
→ Key endpoint: `/api/auth/bubble-exchange`

**"I need to build UI components with styling"**
→ Use skill: `component-patterns`
→ Edit `Component.tsx` and `styles.ts`

**"I need to build and deploy"**
→ Use skill: `deployment`
→ Command: `npm run build:interfaces`

---

## System Overview

CreatorCore builds **embeddable React widgets** for Bubble.io:

```
src/interfaces/{name}/    →    public/bundles/{name}.js
     ├── index.tsx              (single IIFE bundle)
     ├── Component.tsx          exposes window.{Name}.mount()
     ├── types.ts
     └── styles.ts
```

### Key Concepts

1. **Interfaces** render in Shadow DOM for style isolation
2. **Services object** is provided by Bubble for API calls
3. **Events** communicate back to Bubble via CustomEvents
4. **JWT tokens** authenticate users between Bubble and Next.js

---

## Development Workflow

### Creating a New Interface

1. **Scaffold the interface:**
   ```bash
   npm run create-interface my-widget
   ```

2. **Discover API schemas (if calling Bubble workflows):**
   ```bash
   npm run discover-workflow get_widget_data --body='{"widget_id":"123"}'
   ```

3. **Build the UI:**
   - Edit `src/interfaces/my-widget/Component.tsx`
   - Add styles to `styles.ts`
   - Add types to `types.ts`

4. **Build and test:**
   ```bash
   npm run build:interfaces
   npm run dev  # Test locally
   ```

5. **Deploy:**
   ```bash
   git add .
   git commit -m "Add my-widget interface"
   git push  # Vercel auto-deploys
   ```

### Using the Workflow Discovery Tool

Before building interfaces, discover the exact response format of Bubble workflows:

```bash
# Discover and see the response
npm run discover-workflow get_user_profile --body='{"user_id":"123"}'

# Save TypeScript types to a file
npm run discover-workflow get_user_profile --output=src/interfaces/my-widget/api-types.ts
```

The tool:
- Calls the Bubble workflow
- Shows the actual response
- Infers JSON Schema from the response
- Generates TypeScript interfaces
- Generates Zod schemas for validation

---

## Common Patterns

### Calling Bubble APIs

```typescript
// In Component.tsx
const { services } = config;

// Call a Bubble workflow
const result = await services.callBubbleWorkflow('get_data', { user_id: '123' });

// Call Bubble Data API
const items = await services.callBubbleDataApi('/obj/items');

// Call Next.js API
const data = await services.callNextApi('/api/endpoint');
```

### Emitting Events

```typescript
// Notify Bubble of state changes
onEmit('data-loaded', { count: items.length });
onEmit('item-selected', { itemId: item.id });
onEmit('error', { message: 'Failed to load' });
```

### Handling Loading/Error States

```typescript
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      const result = await services.callBubbleWorkflow('get_data');
      setData(result);
      onEmit('data-loaded', { success: true });
    } catch (err) {
      setError((err as Error).message);
      onEmit('error', { message: (err as Error).message });
    } finally {
      setLoading(false);
    }
  };
  loadData();
}, [services, onEmit]);
```

---

## Critical Rules

1. **Never modify `index.tsx`** - it's auto-generated and handles mounting
2. **Use `services` for ALL API calls** - never use `fetch()` directly
3. **Prefix ALL CSS classes** with interface name (e.g., `.my-widget-card`)
4. **Support both light and dark themes** in `styles.ts`
5. **Emit events for state changes** that Bubble needs to know about
6. **Handle loading and error states** - always show feedback to users

---

## File Locations

| What | Where |
|------|-------|
| Interface source | `src/interfaces/{name}/` |
| Built bundles | `public/bundles/{name}.js` |
| Shared utilities | `src/shared/bubble/` |
| Server utilities | `src/lib/` |
| API routes | `src/app/api/` |
| Skills documentation | `.claude/skills/` |
| Bundle manifest | `public/bundles/manifest.json` |
| Workflow registry | `src/config/bubble-workflows.ts` |

---

## Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run create-interface <name>` | Scaffold new interface |
| `npm run build:interfaces` | Build all interfaces |
| `npm run build:interfaces:changed` | Build only changed |
| `npm run discover-workflow <name>` | Discover Bubble API schema |
| `npm run dev` | Start dev server |
| `npm run lint` | Check for errors |

---

## Getting Help

- **System overview**: `.claude/skills/SKILL.md`
- **Creating interfaces**: `.claude/skills/create-interface/SKILL.md`
- **Bubble integration**: `.claude/skills/bubble-integration/SKILL.md`
- **Full documentation**: `docs/CREATING_INTERFACES.md`

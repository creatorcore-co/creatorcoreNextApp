---
name: workflow-discovery
description: |
  Use this skill when you need to discover Bubble workflow response schemas
  during interface development. This tool lets you call Bubble endpoints and
  see exact response formats to build interfaces with correct types.
---

# Workflow Discovery

This skill covers using the workflow discovery tool to inspect Bubble API response schemas and generate TypeScript types during interface development.

## Purpose

When building interfaces, you need to know the exact structure of Bubble workflow responses to:
- Create accurate TypeScript types
- Handle response data correctly
- Avoid runtime errors from wrong assumptions

The workflow discovery tool:
1. Calls a Bubble workflow with your parameters
2. Returns the actual response
3. Infers a JSON Schema from the response
4. Generates TypeScript interfaces
5. Generates Zod schemas for runtime validation

## Prerequisites

### Environment Setup

Add to your `.env.local`:

```env
# Required for workflow discovery
BUBBLE_API_KEY=your_bubble_api_key_here
BUBBLE_BASE_URL=https://app.creatorcore.co/version-test
```

Get your API key from: Bubble Editor → Settings → API

### Start Development Server

The CLI tool calls the local API endpoint, so start the dev server:

```bash
npm run dev
```

## Using the CLI Tool

### Basic Usage

```bash
npm run discover-workflow <workflow_name>
```

Example:
```bash
npm run discover-workflow get_user_profile
```

### With Request Body (POST)

```bash
npm run discover-workflow get_user_profile --body='{"user_id":"123"}'
```

### With Query Parameters (GET)

```bash
npm run discover-workflow list_items --method=GET --params='{"limit":"10","status":"active"}'
```

### Save TypeScript Types

```bash
npm run discover-workflow get_user_profile --output=src/interfaces/my-widget/api-types.ts
```

### Add to Workflow Registry

```bash
npm run discover-workflow get_user_profile --save-registry
```

### Quiet Mode (Types Only)

```bash
npm run discover-workflow get_user_profile --quiet
```

Useful for piping to files or other tools.

### Direct Bubble Call (No Dev Server)

If the dev server isn't running:

```bash
npm run discover-workflow get_user_profile --direct
```

## CLI Options Reference

| Option | Description |
|--------|-------------|
| `--method=GET\|POST` | HTTP method (default: POST) |
| `--body='{"key":"val"}'` | Request body as JSON string (for POST) |
| `--params='{"k":"v"}'` | Query params as JSON string (for GET) |
| `--output=<file>` | Write TypeScript types to file |
| `--save-registry` | Add/update workflow in registry file |
| `--quiet` | Only output TypeScript types |
| `--direct` | Call Bubble directly (skip local API) |

## Using the API Endpoint

### POST `/api/bubble/discover`

You can also call the discovery endpoint directly:

```bash
curl -X POST http://localhost:3000/api/bubble/discover \
  -H "Content-Type: application/json" \
  -d '{
    "workflow": "get_user_profile",
    "method": "POST",
    "body": { "user_id": "123" }
  }'
```

### Request Format

```typescript
interface DiscoverRequest {
  workflow: string;           // Required: Bubble workflow name
  method?: 'GET' | 'POST';    // Optional: HTTP method (default: POST)
  body?: Record<string, unknown>;    // Optional: Request body for POST
  params?: Record<string, string>;   // Optional: Query params for GET
}
```

### Response Format

```typescript
interface DiscoverResponse {
  success: true;
  workflow: string;
  method: string;
  bubbleUrl: string;
  requestBody?: object;
  response: unknown;           // Raw Bubble response
  inferredSchema: JsonSchema;  // Inferred JSON Schema
  typescript: string;          // Generated TypeScript interface
  zodSchema: string;           // Generated Zod schema
}
```

## Understanding the Output

### Example Discovery

```bash
npm run discover-workflow get_dashboard_data --body='{"user_id":"123"}'
```

### Sample Output

```
Discovering workflow: get_dashboard_data
Method: POST
URL: https://app.creatorcore.co/version-test/api/1.1/wf/get_dashboard_data

Request Body:
{
  "user_id": "123"
}

Response (200 OK):
{
  "status": "success",
  "response": {
    "stats": {
      "total_views": 1234,
      "total_posts": 56,
      "followers": 789
    },
    "recent_items": [
      {
        "_id": "1234567890",
        "title": "First Item",
        "status": "active",
        "created_date": "2024-01-15T10:30:00.000Z"
      }
    ],
    "user": {
      "_id": "user123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
}

=== Inferred JSON Schema ===
{
  "type": "object",
  "properties": {
    "status": { "type": "string" },
    "response": {
      "type": "object",
      "properties": {
        "stats": {
          "type": "object",
          "properties": {
            "total_views": { "type": "number" },
            "total_posts": { "type": "number" },
            "followers": { "type": "number" }
          }
        },
        "recent_items": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "_id": { "type": "string" },
              "title": { "type": "string" },
              "status": { "type": "string" },
              "created_date": { "type": "string", "format": "date-time" }
            }
          }
        },
        "user": {
          "type": "object",
          "properties": {
            "_id": { "type": "string" },
            "email": { "type": "string", "format": "email" },
            "name": { "type": "string" }
          }
        }
      }
    }
  }
}

=== Generated TypeScript ===
export interface GetDashboardDataResponse {
  status: string;
  response: {
    stats: {
      total_views: number;
      total_posts: number;
      followers: number;
    };
    recent_items: Array<{
      _id: string;
      title: string;
      status: string;
      created_date: string;
    }>;
    user: {
      _id: string;
      email: string;
      name: string;
    };
  };
}

=== Generated Zod Schema ===
export const GetDashboardDataResponseSchema = z.object({
  status: z.string(),
  response: z.object({
    stats: z.object({
      total_views: z.number(),
      total_posts: z.number(),
      followers: z.number(),
    }),
    recent_items: z.array(z.object({
      _id: z.string(),
      title: z.string(),
      status: z.string(),
      created_date: z.string(),
    })),
    user: z.object({
      _id: z.string(),
      email: z.string(),
      name: z.string(),
    }),
  }),
});
```

## Using Generated Types

### In Your Interface

After saving types to a file:

```bash
npm run discover-workflow get_dashboard_data --output=src/interfaces/dashboard/api-types.ts
```

Use them in your component:

```typescript
// src/interfaces/dashboard/Component.tsx
import type { GetDashboardDataResponse } from './api-types';

export function DashboardComponent({ config, onEmit }: Props) {
  const [data, setData] = useState<GetDashboardDataResponse | null>(null);

  const loadData = async () => {
    const result = await services.callBubbleWorkflow('get_dashboard_data', {
      user_id: props.user?.id,
    }) as GetDashboardDataResponse;

    setData(result);
    setStats(result.response.stats); // Type-safe!
    setItems(result.response.recent_items); // Type-safe!
  };
}
```

### Using the Workflow Registry

After adding to registry:

```bash
npm run discover-workflow get_dashboard_data --save-registry
```

Use the registry in your code:

```typescript
import { BUBBLE_WORKFLOWS, type WorkflowResponse } from '@/config/bubble-workflows';

// Type-safe workflow call
const result = await services.callBubbleWorkflow(
  BUBBLE_WORKFLOWS.getDashboardData.name,
  { user_id: userId }
) as WorkflowResponse<'getDashboardData'>;

// Runtime validation (optional)
const validated = BUBBLE_WORKFLOWS.getDashboardData.responseSchema.parse(result);
```

## The Workflow Registry

Located at: `src/config/bubble-workflows.ts`

### Registry Structure

```typescript
import { z } from 'zod';

export const BUBBLE_WORKFLOWS = {
  getDashboardData: {
    name: 'get_dashboard_data',
    method: 'POST' as const,
    description: 'Fetches user dashboard stats and recent items',
    paramsSchema: z.object({
      user_id: z.string(),
    }),
    responseSchema: z.object({
      status: z.string(),
      response: z.object({
        stats: z.object({
          total_views: z.number(),
          total_posts: z.number(),
          followers: z.number(),
        }),
        recent_items: z.array(z.object({
          _id: z.string(),
          title: z.string(),
          status: z.string(),
          created_date: z.string(),
        })),
      }),
    }),
  },
  // More workflows...
} as const;

// Type exports
export type BubbleWorkflows = typeof BUBBLE_WORKFLOWS;
export type WorkflowName = keyof BubbleWorkflows;
export type WorkflowResponse<T extends WorkflowName> = z.infer<
  BubbleWorkflows[T]['responseSchema']
>;
```

### Benefits of the Registry

1. **Centralized Documentation**: All workflows in one place
2. **Type Safety**: TypeScript knows the exact response types
3. **Runtime Validation**: Zod schemas can validate responses
4. **Discoverability**: Easy to see what workflows are available

## Development Workflow

### When Building a New Interface

1. **Identify Required Workflows**
   - What data does the interface need?
   - What actions does it need to perform?

2. **Discover Each Workflow**
   ```bash
   npm run discover-workflow get_widget_data --body='{"widget_id":"123"}'
   npm run discover-workflow update_widget --body='{"widget_id":"123","status":"active"}'
   ```

3. **Save Types**
   ```bash
   npm run discover-workflow get_widget_data --output=src/interfaces/my-widget/api-types.ts
   ```

4. **Add to Registry (Optional)**
   ```bash
   npm run discover-workflow get_widget_data --save-registry
   ```

5. **Build Interface with Types**
   ```typescript
   import type { GetWidgetDataResponse } from './api-types';

   const data = await services.callBubbleWorkflow('get_widget_data', {
     widget_id: widgetId
   }) as GetWidgetDataResponse;
   ```

## Schema Inference Details

### Detected Patterns

The schema inference detects:

| Pattern | Example | JSON Schema |
|---------|---------|-------------|
| UUID | `"550e8400-e29b-41d4-a716-446655440000"` | `{ "type": "string", "format": "uuid" }` |
| Email | `"user@example.com"` | `{ "type": "string", "format": "email" }` |
| URL | `"https://example.com/path"` | `{ "type": "string", "format": "uri" }` |
| ISO Date | `"2024-01-15T10:30:00.000Z"` | `{ "type": "string", "format": "date-time" }` |
| Number | `123`, `45.67` | `{ "type": "number" }` |
| Boolean | `true`, `false` | `{ "type": "boolean" }` |
| Null | `null` | `{ "type": "null" }` |
| Array | `[1, 2, 3]` | `{ "type": "array", "items": {...} }` |
| Object | `{ "key": "value" }` | `{ "type": "object", "properties": {...} }` |

### Limitations

1. **Single Sample**: Inference is based on one response. Optional fields might be missed.
2. **Array Types**: Infers from first element. Mixed-type arrays may not be accurate.
3. **Null vs Optional**: Can't distinguish between nullable and optional fields from one sample.

### Best Practices

1. **Use Realistic Data**: Call with real user/item IDs to get representative responses
2. **Check Edge Cases**: Call again with different params to verify optional fields
3. **Review Generated Types**: Manual adjustment may be needed
4. **Add JSDoc Comments**: Document what each field means

## Error Handling

### Common Errors

#### "BUBBLE_API_KEY not configured"

```bash
# Add to .env.local
BUBBLE_API_KEY=your_api_key_here
```

#### "Workflow not found"

Check the workflow name matches exactly (case-sensitive).

#### "Network Error"

1. Verify Bubble app is running (not in maintenance mode)
2. Check internet connection
3. Verify Bubble app name is correct

#### "Unauthorized"

The BUBBLE_API_KEY doesn't have access to the workflow:
1. Check API key is correct
2. Verify workflow is exposed to API
3. Check workflow privacy settings in Bubble

## Troubleshooting

### Dev Server Not Running

```bash
# Start the dev server first
npm run dev

# Then run discovery
npm run discover-workflow my_workflow
```

Or use direct mode:
```bash
npm run discover-workflow my_workflow --direct
```

### Invalid JSON in --body

Ensure proper JSON formatting:
```bash
# Good
--body='{"user_id":"123","active":true}'

# Bad (no quotes around keys)
--body='{user_id:"123"}'

# Bad (single quotes for strings)
--body="{'user_id':'123'}"
```

### Response Not Matching Expected

1. Call the workflow manually in Bubble to verify
2. Check if workflow has conditional returns
3. Verify you're passing correct parameters
4. Check Bubble logs for workflow errors

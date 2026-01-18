---
name: workflow-design
description: |
  Use this skill when you need to design Bubble.io backend workflows for an
  interface. This covers suggesting workflow specifications when the user
  hasn't provided them, including endpoint configuration, parameters,
  authentication settings, and response formats.
---

# Workflow Design Skill

This skill helps you design Bubble.io backend workflows when building interfaces. Use it when:
- The user hasn't provided specific backend workflow specifications
- You need to suggest workflows based on UI/data requirements
- You want to help the user understand what workflows they need to create in Bubble

---

## Overview

When building interfaces, you have two paths for backend workflows:

1. **User-provided workflows**: The user has already created workflows in Bubble and provides their specifications
2. **Agent-designed workflows**: You design the workflow specifications for the user to create in Bubble

This skill covers the second path - designing workflows that the user will then implement in Bubble.

---

## Workflow Design Process

### Step 1: Identify Data Requirements

Analyze the interface requirements to determine:
- What data needs to be loaded (lists, single items, computed values)
- What actions the user can perform (create, update, delete)
- What computed statistics or aggregations are needed
- Whether pagination/lazy loading is required

### Step 2: Request Data Schemas (If Needed)

If you need to understand the Bubble data structure, ask the user to provide the data schema using the Bubble Plugin Tools extension in Cursor:

```
I need to understand the data structure for the following Bubble data types to design the workflows:
- [data type 1]
- [data type 2]

Please use the "Bubble Plugin Tools" extension in Cursor to search for and copy the schema for these data types.

To get the schemas:
1. Open the Cursor command palette
2. Search for "Bubble Plugin Tools"
3. Search for each data type name
4. Copy and paste the schema here
```

#### Understanding Bubble Data Schemas

The schema format uses a naming convention that encodes field name and type:

| Pattern | Meaning | Example |
|---------|---------|---------|
| `fieldname_text` | Text field | `title_text` → text field "title" |
| `fieldname_number` | Number field | `budget_number` → number field "budget" |
| `fieldname_boolean` | Boolean field | `archive_boolean` → boolean field "archive" |
| `fieldname_date` | Date field | `created_date` → date field "created" |
| `fieldname_image` | Image field | `thumbnail_image` → image field "thumbnail" |
| `fieldname_custom_typename` | Reference to custom type | `client_custom_client` → reference to "client" type |
| `fieldname_list_custom_typename` | List of custom type | `views_list_custom_view` → list of "view" type |
| `fieldname_list_text` | List of text | `tags_list_text` → list of text |
| `fieldname_option_optionname` | Option set value | `status_option_campaign_status` → option from "campaign_status" |
| `fieldname_list_option_optionname` | List of option values | `metatags_list_option_metatag` → list of options |

Example schema:
```json
{
  "name": "campaign",
  "fields": [
    { "name": "title_text", "rawType": "text" },
    { "name": "budget_number", "rawType": "number" },
    { "name": "client_custom_client", "rawType": "custom.client" },
    { "name": "status_option_campaign_status", "rawType": "option.campaign_status" },
    { "name": "team_members_list_user", "rawType": "list.user" }
  ]
}
```

### Step 3: Design the Workflow Specification

For each required workflow, create a complete specification document.

---

## Workflow Specification Format

When designing a workflow, provide ALL of the following details:

### 1. Workflow Header

```yaml
Workflow Name: get_campaign_dashboard_data
Method: GET | POST
Purpose: [Brief description of what this workflow does]
```

### 2. Endpoint Settings

| Setting | Value | Description |
|---------|-------|-------------|
| **Expose as public API** | Yes/No | Whether the endpoint is publicly accessible |
| **Require authentication** | Yes/No | Whether the user must be logged in |
| **Ignore privacy rules** | Yes/No | Whether to bypass data privacy rules (use cautiously) |

**Guidelines:**
- **Expose as public API**: Always "Yes" for workflows called from external interfaces
- **Require authentication**: Usually "Yes" - set to "No" only for truly public data
- **Ignore privacy rules**: Usually "No" - only use when you need admin-level access

### 3. Parameters

List all parameters with their types and whether they're required:

```yaml
Parameters:
  - name: organization_id
    type: text
    required: yes
    description: The ID of the organization to fetch data for

  - name: limit
    type: number
    required: no
    default: 50
    description: Maximum number of items to return

  - name: cursor
    type: text
    required: no
    description: Pagination cursor for fetching next page
```

### 4. Response Format

Define the exact JSON structure the workflow should return:

```json
{
  "success": true,
  "data": {
    "campaigns": [
      {
        "id": "unique_id",
        "title": "Campaign Name",
        "status": "active",
        "budget": 10000,
        "client": {
          "id": "client_id",
          "name": "Client Name"
        },
        "createdDate": "2024-01-15T10:30:00.000Z"
      }
    ],
    "stats": {
      "totalCampaigns": 25,
      "activeCampaigns": 12,
      "totalBudget": 500000
    }
  },
  "pagination": {
    "nextCursor": "2024-01-14T09:00:00.000Z|abc123",
    "hasMore": true
  }
}
```

### 5. Implementation Notes

Provide guidance for Bubble implementation:

```yaml
Implementation Notes:
  - Search for Campaigns where Organization = organization_id
  - Sort by Created Date descending
  - Apply cursor-based pagination filter if cursor provided
  - Return only fields needed for the list view (not full objects)
  - Calculate stats using aggregation on the full dataset
```

---

## Workflow Design Templates

### Template 1: List Data with Pagination

Use for infinite scroll lists, data tables, or any paginated data.

```yaml
Workflow Name: get_[entity]_list
Method: GET
Purpose: Fetch paginated list of [entities] for display

Settings:
  - Expose as public API: Yes
  - Require authentication: Yes
  - Ignore privacy rules: No

Parameters:
  - name: [parent_entity]_id
    type: text
    required: yes
    description: Filter by parent entity

  - name: limit
    type: number
    required: no
    default: 50
    description: Items per page (max 100)

  - name: cursor
    type: text
    required: no
    description: Pagination cursor (format: "ISO_DATE|UNIQUE_ID")

  - name: sort_field
    type: text
    required: no
    default: created_date
    description: Field to sort by

  - name: sort_direction
    type: text
    required: no
    default: desc
    description: Sort direction (asc/desc)

  - name: status
    type: text
    required: no
    description: Optional status filter

Response Format:
{
  "items": [
    {
      "id": "unique_id",
      "field1": "value",
      "field2": 123,
      "createdDate": "2024-01-15T10:30:00.000Z"
    }
  ],
  "nextCursor": "2024-01-14T09:00:00.000Z|abc123",
  "hasMore": true,
  "total": 150
}

Implementation Notes:
  - Use cursor-based pagination for stable results
  - Cursor format: "<sort_field_value>|<unique_id>"
  - Fetch limit + 1 to determine hasMore
  - Only return fields needed for list display
  - Calculate total count separately if needed
```

### Template 2: Single Item Details

Use for detail views or editing forms.

```yaml
Workflow Name: get_[entity]_details
Method: GET
Purpose: Fetch complete details for a single [entity]

Settings:
  - Expose as public API: Yes
  - Require authentication: Yes
  - Ignore privacy rules: No

Parameters:
  - name: [entity]_id
    type: text
    required: yes
    description: The ID of the entity to fetch

Response Format:
{
  "success": true,
  "data": {
    "id": "unique_id",
    "field1": "value",
    "field2": 123,
    "relatedItems": [...],
    "metadata": {...},
    "createdDate": "2024-01-15T10:30:00.000Z",
    "modifiedDate": "2024-01-16T08:00:00.000Z"
  }
}

Implementation Notes:
  - Verify user has access to this entity
  - Include all fields needed for the detail view
  - Include related data that will be displayed
  - Return 404-style error if not found
```

### Template 3: Computed Statistics/Dashboard

Use for dashboard widgets, summary cards, or analytics.

```yaml
Workflow Name: get_[entity]_stats
Method: GET
Purpose: Fetch computed statistics for [entity/dashboard]

Settings:
  - Expose as public API: Yes
  - Require authentication: Yes
  - Ignore privacy rules: No

Parameters:
  - name: [scope]_id
    type: text
    required: yes
    description: Scope for the statistics

  - name: date_from
    type: text
    required: no
    description: Start date for time-based stats (ISO format)

  - name: date_to
    type: text
    required: no
    description: End date for time-based stats (ISO format)

Response Format:
{
  "stats": {
    "totalCount": 150,
    "activeCount": 45,
    "completedCount": 100,
    "pendingCount": 5,
    "totalValue": 500000,
    "averageValue": 3333.33
  },
  "trends": {
    "thisMonth": 25,
    "lastMonth": 20,
    "percentChange": 25.0
  },
  "breakdown": {
    "byStatus": [
      { "status": "active", "count": 45 },
      { "status": "completed", "count": 100 }
    ]
  }
}

Implementation Notes:
  - Use Bubble's aggregation functions (count, sum, average)
  - Apply date filters if provided
  - Cache results if computation is expensive
  - Consider background calculation for large datasets
```

### Template 4: Create/Update Entity (Mutation)

Use for form submissions, inline editing, or any data modifications.

```yaml
Workflow Name: update_[entity]
Method: POST
Purpose: Create or update a [entity]

Settings:
  - Expose as public API: Yes
  - Require authentication: Yes
  - Ignore privacy rules: No

Parameters:
  - name: [entity]_id
    type: text
    required: no
    description: ID for update (omit for create)

  - name: data
    type: text (JSON)
    required: yes
    description: JSON object with fields to update

Response Format:
{
  "success": true,
  "data": {
    "id": "unique_id",
    "field1": "updated_value",
    "modifiedDate": "2024-01-16T08:00:00.000Z"
  },
  "message": "Successfully updated"
}

Error Response:
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid field value",
    "field": "email"
  }
}

Implementation Notes:
  - Validate all input data
  - Check user permissions before modifying
  - Return the updated entity data
  - Include meaningful error messages
  - Use transactions if updating multiple things
```

### Template 5: Action Workflow

Use for triggering actions that don't return data (send email, trigger process, etc.).

```yaml
Workflow Name: trigger_[action]
Method: POST
Purpose: Trigger [action description]

Settings:
  - Expose as public API: Yes
  - Require authentication: Yes
  - Ignore privacy rules: No

Parameters:
  - name: [entity]_id
    type: text
    required: yes
    description: The entity to perform action on

  - name: [action_params]
    type: text/number/etc
    required: varies
    description: Additional parameters for the action

Response Format:
{
  "success": true,
  "message": "Action completed successfully",
  "result": {
    "actionId": "tracking_id",
    "status": "queued"
  }
}

Implementation Notes:
  - Validate user can perform this action
  - For long-running actions, return immediately with tracking ID
  - Log action for audit trail
  - Handle idempotency if action shouldn't repeat
```

---

## Cursor-Based Pagination Deep Dive

For list workflows with lazy loading, use cursor-based pagination:

### Why Cursors Over Page Numbers

- **Stable results**: New items don't shift pages
- **No duplicate items**: When scrolling through changing data
- **Better performance**: No COUNT queries or offset skipping

### Cursor Format

```
cursor = "<sort_field_value>|<unique_id>"
```

Examples:
- Date sort: `"2024-01-15T10:30:00.000Z|abc123def456"`
- Number sort: `"150|abc123def456"`
- Text sort: `"Alpha Company|abc123def456"`

### Pagination Logic

```
IF cursor is empty:
  Return first {limit} items sorted by {sort_field} {sort_direction}
ELSE:
  Parse cursor into: cursorValue, cursorId
  Return items WHERE:
    (sort_field < cursorValue) OR
    (sort_field = cursorValue AND unique_id < cursorId)
  Sorted by {sort_field} {sort_direction}
  Limited to {limit}
```

### Building the Next Cursor

```javascript
// After fetching items
const lastItem = items[items.length - 1];
const nextCursor = `${lastItem.sortFieldValue}|${lastItem.id}`;
const hasMore = items.length === limit; // or fetch limit+1
```

---

## Testing Designed Workflows

After the user creates the workflow in Bubble, use the workflow discovery tool to test it:

```bash
# Test a GET workflow
npm run discover-workflow get_campaign_list --params='{"organization_id":"test123","limit":"10"}'

# Test a POST workflow
npm run discover-workflow update_campaign --body='{"campaign_id":"abc","data":"{\"title\":\"New Title\"}"}'
```

This verifies:
- The workflow is accessible
- Parameters are received correctly
- Response format matches the design
- Authentication is working

If the response differs from the design, update either the Bubble workflow or the interface code accordingly.

---

## Complete Workflow Design Example

Here's a complete example for a campaign dashboard interface:

### Interface Requirements
- Display list of campaigns with infinite scroll
- Show campaign statistics summary
- Allow updating campaign status
- Support filtering by status

### Designed Workflows

#### Workflow 1: Get Campaign List

```yaml
Workflow Name: get_campaign_list
Method: GET
Purpose: Fetch paginated list of campaigns for the dashboard

Settings:
  - Expose as public API: Yes
  - Require authentication: Yes
  - Ignore privacy rules: No

Parameters:
  - name: organization_id
    type: text
    required: yes
    description: Organization to fetch campaigns for

  - name: limit
    type: number
    required: no
    default: 25
    description: Number of campaigns per page

  - name: cursor
    type: text
    required: no
    description: Pagination cursor

  - name: status
    type: text
    required: no
    description: Filter by status (active, completed, draft)

Response Format:
{
  "items": [
    {
      "id": "campaign_123",
      "title": "Summer Campaign 2024",
      "status": "active",
      "budget": 50000,
      "clientName": "Acme Corp",
      "thumbnailUrl": "https://...",
      "createdDate": "2024-01-15T10:30:00.000Z",
      "stats": {
        "totalActivations": 25,
        "completedActivations": 12
      }
    }
  ],
  "nextCursor": "2024-01-14T09:00:00.000Z|campaign_122",
  "hasMore": true
}

Required Bubble Data Types:
  - campaign (get schema from Bubble Plugin Tools)
  - client (for clientName)
  - activation (for stats counts)

Implementation Notes:
  - Search campaigns where organization = organization_id
  - If status provided, add status constraint
  - Sort by created_date desc, unique_id desc
  - Apply cursor filter: created_date < cursor_date OR (created_date = cursor_date AND unique_id < cursor_id)
  - For each campaign, count related activations
  - Return only fields shown above (not full campaign object)
```

#### Workflow 2: Get Campaign Stats

```yaml
Workflow Name: get_campaign_stats
Method: GET
Purpose: Fetch aggregate statistics for the dashboard header

Settings:
  - Expose as public API: Yes
  - Require authentication: Yes
  - Ignore privacy rules: No

Parameters:
  - name: organization_id
    type: text
    required: yes
    description: Organization to calculate stats for

Response Format:
{
  "totalCampaigns": 150,
  "activeCampaigns": 45,
  "completedCampaigns": 100,
  "draftCampaigns": 5,
  "totalBudget": 2500000,
  "totalActivations": 1250,
  "averageBudget": 16666.67
}

Implementation Notes:
  - Count campaigns by status for this organization
  - Sum budget across all campaigns
  - Count all activations across all campaigns
  - Calculate average budget
```

#### Workflow 3: Update Campaign Status

```yaml
Workflow Name: update_campaign_status
Method: POST
Purpose: Update the status of a campaign

Settings:
  - Expose as public API: Yes
  - Require authentication: Yes
  - Ignore privacy rules: No

Parameters:
  - name: campaign_id
    type: text
    required: yes
    description: Campaign to update

  - name: status
    type: text
    required: yes
    description: New status value (active, completed, draft, archived)

Response Format:
{
  "success": true,
  "data": {
    "id": "campaign_123",
    "status": "completed",
    "modifiedDate": "2024-01-16T08:00:00.000Z"
  }
}

Error Response:
{
  "success": false,
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "You do not have permission to update this campaign"
  }
}

Implementation Notes:
  - Verify current user is team member of campaign's organization
  - Validate status is one of allowed values
  - Update campaign's status field
  - Return updated campaign data
```

---

## Presenting Workflow Designs to Users

When presenting workflow designs, use this format:

```markdown
## Suggested Backend Workflows

Based on the interface requirements, here are the Bubble backend workflows you'll need to create:

### 1. `get_campaign_list` (GET)

**Purpose**: Fetch paginated list of campaigns

**Settings**:
| Setting | Value |
|---------|-------|
| Expose as public API | Yes |
| Require authentication | Yes |
| Ignore privacy rules | No |

**Parameters**:
| Name | Type | Required | Description |
|------|------|----------|-------------|
| organization_id | text | Yes | Organization to fetch for |
| limit | number | No | Items per page (default: 25) |
| cursor | text | No | Pagination cursor |

**Expected Response**:
```json
{
  "items": [...],
  "nextCursor": "...",
  "hasMore": true
}
```

---

Once you've created these workflows in Bubble, let me know and I can test them using the workflow discovery tool to verify they're working correctly.
```

---

## Integration with Other Skills

### workflow-discovery
After users create workflows, use the discovery tool to:
- Verify the workflow is accessible
- Confirm response format matches design
- Generate TypeScript types for the interface

### bubble-integration
Reference bubble-integration skill for:
- How to call the designed workflows from the interface
- Error handling patterns
- Data transformation

### create-interface
Workflow design happens during the planning phase of interface creation, before writing Component.tsx code.

---

## Common Workflow Patterns

### Search/Filter Workflow

```yaml
Parameters:
  - search_query: text (optional) - Full text search
  - filters: text (JSON) - Structured filters
  - sort_field: text - Field to sort by
  - sort_direction: text - asc/desc
```

### Bulk Action Workflow

```yaml
Parameters:
  - ids: text (JSON array) - List of entity IDs
  - action: text - Action to perform
  - action_data: text (JSON) - Action-specific data
```

### File Upload Workflow

```yaml
Parameters:
  - entity_id: text - Entity to attach file to
  - file_url: text - URL of uploaded file (upload separately)
  - file_name: text - Original filename
  - file_type: text - MIME type
```

---

## Checklist for Workflow Design

- [ ] Identified all data requirements from interface spec
- [ ] Requested Bubble data schemas if needed
- [ ] Designed workflow for each data/action requirement
- [ ] Specified all parameters with types and defaults
- [ ] Defined complete response format with examples
- [ ] Included error response format for mutations
- [ ] Added implementation notes for Bubble setup
- [ ] Considered pagination for list endpoints
- [ ] Specified authentication requirements
- [ ] Presented designs clearly to user
- [ ] Ready to test with workflow-discovery after creation

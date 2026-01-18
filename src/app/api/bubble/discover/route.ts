/**
 * Bubble Workflow Discovery API
 *
 * Calls a Bubble workflow and returns the response along with an inferred schema.
 * Used during development to help AI agents understand workflow response formats.
 *
 * SECURITY: This endpoint is for development use only. In production, consider
 * disabling or adding authentication.
 *
 * POST /api/bubble/discover
 *
 * Request Body:
 * {
 *   "workflow": "workflow_name",        // Required: Bubble workflow name
 *   "method": "GET" | "POST",           // Optional: HTTP method (default: POST)
 *   "body": { ... },                    // Optional: Request body for POST requests
 *   "params": { ... }                   // Optional: Query params for GET requests
 * }
 *
 * Response (Success):
 * {
 *   "success": true,
 *   "workflow": "workflow_name",
 *   "method": "POST",
 *   "bubbleUrl": "https://app.creatorcore.co/version-test/api/1.1/wf/workflow_name",
 *   "requestBody": { ... },
 *   "response": { ... },                // Raw Bubble response
 *   "inferredSchema": { ... },          // JSON Schema
 *   "typescript": "interface ...",      // Generated TypeScript
 *   "zodSchema": "z.object({ ... })"    // Generated Zod schema
 * }
 *
 * Response (Error):
 * {
 *   "success": false,
 *   "error": "Error message",
 *   "details": { ... }
 * }
 */

import { NextResponse } from 'next/server';
import {
  inferJsonSchema,
  generateTypescriptInterface,
  jsonSchemaToZod,
  workflowToInterfaceName,
  workflowToSchemaName,
} from '@/lib/schema-inference';

interface DiscoverRequest {
  workflow: string;
  method?: 'GET' | 'POST';
  body?: Record<string, unknown>;
  params?: Record<string, string>;
}

function getBubbleApiKey(): string | null {
  return process.env.BUBBLE_API_KEY || null;
}

function getBubbleBaseUrl(): string | null {
  return process.env.BUBBLE_BASE_URL || null;
}

function getBubbleWorkflowUrl(baseUrl: string, workflowName: string): string {
  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/api/1.1/wf/${workflowName}`;
}

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = (await request.json()) as DiscoverRequest;

    // Validate workflow name
    if (!body.workflow || typeof body.workflow !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing or invalid workflow name',
          details: { field: 'workflow' },
        },
        { status: 400 }
      );
    }

    // Get API key
    const apiKey = getBubbleApiKey();
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'BUBBLE_API_KEY not configured',
          details: {
            hint: 'Add BUBBLE_API_KEY to your .env.local file',
          },
        },
        { status: 500 }
      );
    }

    // Get Bubble base URL
    const baseUrl = getBubbleBaseUrl();
    if (!baseUrl) {
      return NextResponse.json(
        {
          success: false,
          error: 'BUBBLE_BASE_URL not configured',
          details: {
            hint: 'Add BUBBLE_BASE_URL to your .env.local file (e.g., https://app.creatorcore.co/version-test)',
          },
        },
        { status: 500 }
      );
    }

    const method = body.method || 'POST';
    const workflowUrl = getBubbleWorkflowUrl(baseUrl, body.workflow);

    // Build URL with query params for GET requests
    let finalUrl = workflowUrl;
    if (method === 'GET' && body.params) {
      const searchParams = new URLSearchParams(body.params);
      finalUrl = `${workflowUrl}?${searchParams.toString()}`;
    }

    // Prepare request options
    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    };

    // Add body for POST requests
    if (method === 'POST' && body.body) {
      fetchOptions.body = JSON.stringify(body.body);
    }

    // Call Bubble workflow
    const bubbleResponse = await fetch(finalUrl, fetchOptions);

    // Parse response
    let responseData: unknown;
    const contentType = bubbleResponse.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      responseData = await bubbleResponse.json();
    } else {
      responseData = await bubbleResponse.text();
    }

    // Handle Bubble error responses
    if (!bubbleResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Bubble API error: ${bubbleResponse.status} ${bubbleResponse.statusText}`,
          details: {
            status: bubbleResponse.status,
            statusText: bubbleResponse.statusText,
            response: responseData,
            bubbleUrl: finalUrl,
          },
        },
        { status: bubbleResponse.status }
      );
    }

    // Infer schema from response
    const inferredSchema = inferJsonSchema(responseData);

    // Generate TypeScript interface
    const interfaceName = workflowToInterfaceName(body.workflow);
    const typescript = generateTypescriptInterface(inferredSchema, interfaceName);

    // Generate Zod schema
    const schemaName = workflowToSchemaName(body.workflow);
    const zodSchema = jsonSchemaToZod(inferredSchema, schemaName);

    return NextResponse.json({
      success: true,
      workflow: body.workflow,
      method,
      bubbleUrl: finalUrl,
      requestBody: method === 'POST' ? body.body : undefined,
      requestParams: method === 'GET' ? body.params : undefined,
      response: responseData,
      inferredSchema,
      typescript,
      zodSchema,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to discover workflow',
        details: { message },
      },
      { status: 500 }
    );
  }
}

// CORS support
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

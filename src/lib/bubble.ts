import type { BubbleWorkflowResponse, BubbleDataResponse } from '@/shared/bubble';

/**
 * Configuration for Bubble API calls
 */
export interface BubbleApiConfig {
  /** Full Bubble base URL (e.g., "https://app.creatorcore.co/version-04c") */
  baseUrl: string;
  apiToken?: string;
}

/**
 * Get the Bubble API URL from base URL
 * @param baseUrl - Full Bubble base URL (e.g., "https://app.creatorcore.co/version-04c")
 */
export function getBubbleApiUrl(baseUrl: string): string {
  // Remove trailing slash if present
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}/api/1.1`;
}

/**
 * Get the Bubble workflow URL
 * @param baseUrl - Full Bubble base URL (e.g., "https://app.creatorcore.co/version-04c")
 * @param workflowName - Name of the workflow
 */
export function getBubbleWorkflowUrl(baseUrl: string, workflowName: string): string {
  return `${getBubbleApiUrl(baseUrl)}/wf/${workflowName}`;
}

/**
 * Call a Bubble workflow
 * Note: This is primarily used server-side. Client-side calls should use the services provided to the widget.
 */
export async function callBubbleWorkflow(
  config: BubbleApiConfig,
  workflowName: string,
  params?: Record<string, unknown>
): Promise<BubbleWorkflowResponse> {
  const url = getBubbleWorkflowUrl(config.baseUrl, workflowName);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`;
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(params || {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        status: 'error',
        error: `Workflow failed: ${response.status} - ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      status: 'success',
      response: data,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Call the Bubble Data API
 * Note: This is primarily used server-side. Client-side calls should use the services provided to the widget.
 */
export async function callBubbleDataApi<T = unknown>(
  config: BubbleApiConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<BubbleDataResponse<T>> {
  const apiBaseUrl = getBubbleApiUrl(config.baseUrl);
  const url = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (config.apiToken) {
    headers['Authorization'] = `Bearer ${config.apiToken}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Bubble API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Sanitize data received from Bubble
 * Removes potentially dangerous content from strings
 */
export function sanitizeBubbleData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    // Basic XSS prevention - remove script tags and event handlers
    let sanitized = data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=/gi, 'data-removed=');
    return sanitized as T;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeBubbleData) as T;
  }

  if (typeof data === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip keys that look like they could be injection attempts
      const sanitizedKey = key.replace(/[<>"'&]/g, '');
      sanitized[sanitizedKey] = sanitizeBubbleData(value);
    }
    return sanitized as T;
  }

  return data;
}

/**
 * Validate that a string is a valid Bubble base URL
 */
export function isValidBubbleBaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

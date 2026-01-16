/**
 * Shared Bubble.io Integration Types
 * Types used across all interfaces for Bubble communication
 */

// ============================================================================
// Core Services
// ============================================================================

/**
 * Services provided by Bubble for API communication
 */
export interface BubbleServices {
  /**
   * Call a Bubble workflow by name
   * @param name - The workflow name (e.g., "process_payment")
   * @param params - Optional parameters to pass to the workflow
   */
  callBubbleWorkflow: (
    name: string,
    params?: Record<string, unknown>
  ) => Promise<unknown>;

  /**
   * Call the Bubble Data API
   * @param endpoint - The API endpoint (e.g., "/obj/user")
   * @param options - Fetch options
   */
  callBubbleDataApi: (
    endpoint: string,
    options?: RequestInit
  ) => Promise<unknown>;

  /**
   * Call a Next.js API route
   * @param endpoint - The API endpoint (e.g., "/api/users")
   * @param options - Fetch options
   */
  callNextApi: (endpoint: string, options?: RequestInit) => Promise<unknown>;

  /**
   * Emit an event back to Bubble
   * @param name - Event name
   * @param payload - Optional event payload
   */
  emitEvent: (name: string, payload?: Record<string, unknown>) => void;

  /**
   * Get the current Next.js access token
   */
  getNextToken: () => string | null;

  /**
   * Check if the user is authenticated
   */
  isAuthenticated: () => boolean;
}

// ============================================================================
// User Types
// ============================================================================

/**
 * User information from Bubble
 */
export interface BubbleUser {
  /** Bubble user ID */
  id: string;

  /** User email */
  email?: string;

  /** Display name */
  name?: string;

  /** Profile image URL */
  avatar?: string;

  /** Additional user fields */
  extraFields?: Record<string, unknown>;
}

// ============================================================================
// API Response Types
// ============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Bubble workflow response
 */
export interface BubbleWorkflowResponse {
  status: 'success' | 'error';
  response?: unknown;
  error?: string;
}

/**
 * Bubble Data API response
 */
export interface BubbleDataResponse<T = unknown> {
  response: {
    cursor: number;
    results: T[];
    count: number;
    remaining: number;
  };
}

// ============================================================================
// Auth Types
// ============================================================================

/**
 * Token exchange request body
 */
export interface TokenExchangeRequest {
  /** JWT token from Bubble */
  token: string;
}

/**
 * Token exchange response
 */
export interface TokenExchangeResponse {
  /** Access token for Next.js API calls */
  accessToken: string;

  /** Token expiration in seconds */
  expiresIn: number;

  /** User information (optional) */
  user?: {
    id: string;
    email: string;
    bubbleUserId: string;
  };
}

/**
 * JWT payload structure from Bubble
 */
export interface BubbleJWTPayload {
  /** Subject (user ID) */
  sub: string;

  /** User email */
  email?: string;

  /** Issued at timestamp */
  iat: number;

  /** Expiration timestamp */
  exp: number;

  /** Bubble app name */
  app?: string;

  /** Additional claims */
  [key: string]: unknown;
}

// ============================================================================
// Re-export LogLevel from logger
// ============================================================================

export type { LogLevel } from './logger';

/**
 * Widget Types
 * Comprehensive TypeScript definitions for the embeddable widget system
 */

// ============================================================================
// Core Widget Configuration
// ============================================================================

/**
 * Services provided to the widget for communicating with Bubble and Next.js
 */
export interface WidgetServices {
  /**
   * Call a Bubble workflow by name
   * @param name - The workflow name (e.g., "process_payment")
   * @param params - Optional parameters to pass to the workflow
   */
  callBubbleWorkflow: (name: string, params?: Record<string, unknown>) => Promise<unknown>;

  /**
   * Call the Bubble Data API
   * @param endpoint - The API endpoint (e.g., "/obj/user")
   * @param options - Fetch options
   */
  callBubbleDataApi: (endpoint: string, options?: RequestInit) => Promise<unknown>;

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

/**
 * Configuration passed to the widget during mount
 */
export interface WidgetConfig {
  /** Props passed from Bubble */
  props: WidgetProps;

  /** Service functions for API calls and events */
  services: WidgetServices;

  /** Base URL for Next.js API calls */
  nextApiBase: string;

  /** Bubble app name (e.g., "myapp" for myapp.bubbleapps.io) */
  bubbleAppName: string;

  /** Whether the user is authenticated */
  isAuthenticated: boolean;

  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Props that can be passed from Bubble to the widget
 */
export interface WidgetProps {
  /** User information from Bubble */
  user?: BubbleUser;

  /** Current theme */
  theme?: 'light' | 'dark' | 'system';

  /** Widget display mode */
  mode?: 'compact' | 'full' | 'embedded';

  /** Custom data from Bubble */
  customData?: Record<string, unknown>;
}

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
// Widget API (returned from mount)
// ============================================================================

/**
 * API returned when mounting the widget
 */
export interface WidgetAPI {
  /**
   * Update widget props
   * @param newProps - New props to merge with existing props
   */
  update: (newProps: Partial<WidgetProps>) => void;

  /**
   * Unmount and cleanup the widget
   */
  unmount: () => void;

  /**
   * Emit an event from the widget
   * @param eventName - Event name
   * @param payload - Optional event payload
   */
  emit: (eventName: string, payload?: Record<string, unknown>) => void;
}

// ============================================================================
// Global Window Interface
// ============================================================================

/**
 * The NextWidget global object exposed on window
 */
export interface NextWidgetGlobal {
  /**
   * Mount the widget to a container element
   * @param container - HTML element to mount the widget into
   * @param config - Widget configuration
   */
  mount: (container: HTMLElement, config: WidgetConfig) => WidgetAPI;
}

// Extend the Window interface
declare global {
  interface Window {
    NextWidget: NextWidgetGlobal;
  }
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Events that the widget can emit to Bubble
 */
export type WidgetEventName =
  | 'ready'
  | 'error'
  | 'action'
  | 'navigation'
  | 'data-update'
  | 'auth-required'
  | 'auth-success'
  | 'auth-logout'
  | string; // Allow custom events

/**
 * Base event payload structure
 */
export interface WidgetEventPayload {
  /** Event timestamp */
  timestamp?: number;

  /** Event source/origin */
  source?: string;

  /** Additional event data */
  [key: string]: unknown;
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
// Internal Types
// ============================================================================

/**
 * Internal widget state
 */
export interface WidgetState {
  isLoading: boolean;
  error: Error | null;
  isAuthenticated: boolean;
  props: WidgetProps;
}

/**
 * Debug log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export {};

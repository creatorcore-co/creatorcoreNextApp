/**
 * Widget Types
 * Interface-specific TypeScript definitions for the NextWidget
 */

import type { BubbleServices, BubbleUser } from '@/shared/bubble';

// ============================================================================
// Core Widget Configuration
// ============================================================================

/**
 * Configuration passed to the widget during mount
 */
export interface WidgetConfig {
  /** Props passed from Bubble */
  props: WidgetProps;

  /** Service functions for API calls and events */
  services: BubbleServices;

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
  | 'workflow-complete'
  | 'api-call-complete'
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

// Re-export BubbleUser for convenience
export type { BubbleUser } from '@/shared/bubble';

export {};

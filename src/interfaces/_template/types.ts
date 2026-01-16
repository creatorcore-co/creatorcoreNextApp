/**
 * {{INTERFACE_NAME}} Types
 * Interface-specific TypeScript definitions
 * Generated: {{DATE}}
 */

import type { BubbleServices, BubbleUser } from '@/shared/bubble';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration passed to the interface during mount
 */
export interface {{INTERFACE_NAME}}Config {
  /** Props passed from Bubble */
  props: {{INTERFACE_NAME}}Props;

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
 * Props that can be passed from Bubble to the interface
 */
export interface {{INTERFACE_NAME}}Props {
  /** User information from Bubble */
  user?: BubbleUser;

  /** Current theme */
  theme?: 'light' | 'dark' | 'system';

  /** Display mode */
  mode?: 'compact' | 'full' | 'embedded';

  /** Custom data from Bubble */
  customData?: Record<string, unknown>;
}

// ============================================================================
// API (returned from mount)
// ============================================================================

/**
 * API returned when mounting the interface
 */
export interface {{INTERFACE_NAME}}API {
  /**
   * Update interface props
   * @param newProps - New props to merge with existing props
   */
  update: (newProps: Partial<{{INTERFACE_NAME}}Props>) => void;

  /**
   * Unmount and cleanup the interface
   */
  unmount: () => void;

  /**
   * Emit an event from the interface
   * @param eventName - Event name
   * @param payload - Optional event payload
   */
  emit: (eventName: string, payload?: Record<string, unknown>) => void;
}

// ============================================================================
// Global Window Interface
// ============================================================================

declare global {
  interface Window {
    {{INTERFACE_NAME}}: {
      mount: (
        container: HTMLElement,
        config: {{INTERFACE_NAME}}Config
      ) => {{INTERFACE_NAME}}API;
    };
  }
}

export {};

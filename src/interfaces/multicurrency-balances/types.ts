/**
 * MulticurrencyBalances Types
 * Interface-specific TypeScript definitions
 * Generated: 2026-01-16
 */

import type { BubbleServices, BubbleUser } from '@/shared/bubble';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration passed to the interface during mount
 */
export interface MulticurrencyBalancesConfig {
  /** Props passed from Bubble */
  props: MulticurrencyBalancesProps;

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
export interface MulticurrencyBalancesProps {
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
export interface MulticurrencyBalancesAPI {
  /**
   * Update interface props
   * @param newProps - New props to merge with existing props
   */
  update: (newProps: Partial<MulticurrencyBalancesProps>) => void;

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
    MulticurrencyBalances: {
      mount: (
        container: HTMLElement,
        config: MulticurrencyBalancesConfig
      ) => MulticurrencyBalancesAPI;
    };
  }
}

export {};

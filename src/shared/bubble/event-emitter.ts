/**
 * Shared Event Emitter
 * Handles widget-to-parent communication via DOM CustomEvents
 */

import { createLogger, type Logger, type LoggerOptions } from './logger';

export interface EventEmitterOptions extends LoggerOptions {
  /** Prefix for DOM event names (e.g., "nextwidget" -> "nextwidget:ready") */
  eventPrefix?: string;
}

/**
 * Event emitter for Bubble.io integration
 * Dispatches CustomEvents on the document for parent applications to listen to
 */
export class BubbleEventEmitter {
  private listeners: Map<
    string,
    Set<(payload?: Record<string, unknown>) => void>
  > = new Map();
  private logger: Logger;
  private eventPrefix: string;

  constructor(options: EventEmitterOptions = {}) {
    this.logger = createLogger(options);
    this.eventPrefix = options.eventPrefix ?? 'interface';
  }

  /**
   * Register an event listener
   * @returns Unsubscribe function
   */
  on(
    event: string,
    callback: (payload?: Record<string, unknown>) => void
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  /**
   * Remove an event listener
   */
  off(
    event: string,
    callback: (payload?: Record<string, unknown>) => void
  ): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit an event to both DOM (for Bubble) and registered listeners
   */
  emit(event: string, payload?: Record<string, unknown>): void {
    this.logger.debug('Emitting event:', event, payload);

    // Dispatch custom event on the document for Bubble to listen to
    const customEvent = new CustomEvent(`${this.eventPrefix}:${event}`, {
      detail: { event, payload, timestamp: Date.now() },
      bubbles: true,
      cancelable: false,
    });
    document.dispatchEvent(customEvent);

    // Also call any registered listeners
    this.listeners.get(event)?.forEach((callback) => {
      try {
        callback(payload);
      } catch (error) {
        this.logger.error('Error in event listener:', error);
      }
    });
  }
}

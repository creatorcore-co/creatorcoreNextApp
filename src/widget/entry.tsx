import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import type {
  WidgetConfig,
  WidgetAPI,
  WidgetProps,
  NextWidgetGlobal,
  LogLevel,
} from './types';
import { Widget } from '@/components/Widget';
import { WidgetStyles } from '@/components/WidgetStyles';

/**
 * Debug logger that respects the debug flag
 */
function createLogger(debug: boolean) {
  const log = (level: LogLevel, ...args: unknown[]) => {
    if (!debug && level === 'debug') return;
    const prefix = `[NextWidget:${level.toUpperCase()}]`;
    switch (level) {
      case 'error':
        console.error(prefix, ...args);
        break;
      case 'warn':
        console.warn(prefix, ...args);
        break;
      case 'info':
        console.info(prefix, ...args);
        break;
      default:
        console.log(prefix, ...args);
    }
  };

  return {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args),
  };
}

/**
 * Event emitter for widget-to-parent communication
 */
class WidgetEventEmitter {
  private listeners: Map<string, Set<(payload?: Record<string, unknown>) => void>> = new Map();
  private logger: ReturnType<typeof createLogger>;

  constructor(debug: boolean) {
    this.logger = createLogger(debug);
  }

  on(event: string, callback: (payload?: Record<string, unknown>) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.off(event, callback);
  }

  off(event: string, callback: (payload?: Record<string, unknown>) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, payload?: Record<string, unknown>) {
    this.logger.debug('Emitting event:', event, payload);

    // Dispatch custom event on the document for Bubble to listen to
    const customEvent = new CustomEvent(`nextwidget:${event}`, {
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

/**
 * Mount the widget to a container element
 */
function mount(container: HTMLElement, config: WidgetConfig): WidgetAPI {
  const debug = config.debug ?? false;
  const logger = createLogger(debug);
  const eventEmitter = new WidgetEventEmitter(debug);

  logger.info('Mounting widget with config:', {
    nextApiBase: config.nextApiBase,
    bubbleAppName: config.bubbleAppName,
    isAuthenticated: config.isAuthenticated,
    propsKeys: Object.keys(config.props),
  });

  // Create a shadow root for style isolation (optional)
  let mountPoint: HTMLElement | ShadowRoot = container;
  let shadowRoot: ShadowRoot | null = null;

  // Use shadow DOM for style isolation if supported
  if (container.attachShadow) {
    try {
      shadowRoot = container.attachShadow({ mode: 'open' });
      mountPoint = shadowRoot;
      logger.debug('Using Shadow DOM for style isolation');
    } catch {
      logger.debug('Shadow DOM not available, mounting directly');
    }
  }

  // Create the inner container
  const innerContainer = document.createElement('div');
  innerContainer.id = 'next-widget-root';
  innerContainer.className = 'next-widget-container';
  mountPoint.appendChild(innerContainer);

  // Inject styles
  const styleElement = document.createElement('style');
  styleElement.textContent = WidgetStyles;
  if (shadowRoot) {
    shadowRoot.appendChild(styleElement);
  } else {
    // Inject styles into the document head if not using shadow DOM
    if (!document.getElementById('next-widget-styles')) {
      styleElement.id = 'next-widget-styles';
      document.head.appendChild(styleElement);
    }
  }

  // Current props state
  let currentProps: WidgetProps = { ...config.props };

  // Create React root
  let root: Root | null = createRoot(innerContainer);

  // Render function
  const render = () => {
    if (!root) return;

    root.render(
      <React.StrictMode>
        <Widget
          config={{
            ...config,
            props: currentProps,
          }}
          onEmit={(event, payload) => eventEmitter.emit(event, payload)}
        />
      </React.StrictMode>
    );
  };

  // Initial render
  render();

  // Emit ready event
  setTimeout(() => {
    eventEmitter.emit('ready', { mounted: true });
  }, 0);

  // Return the widget API
  const api: WidgetAPI = {
    update: (newProps: Partial<WidgetProps>) => {
      logger.debug('Updating props:', newProps);
      currentProps = { ...currentProps, ...newProps };
      render();
    },

    unmount: () => {
      logger.info('Unmounting widget');
      eventEmitter.emit('unmount', { timestamp: Date.now() });

      if (root) {
        root.unmount();
        root = null;
      }

      // Clean up DOM
      if (shadowRoot) {
        while (shadowRoot.firstChild) {
          shadowRoot.removeChild(shadowRoot.firstChild);
        }
      } else {
        innerContainer.remove();
      }

      logger.debug('Widget unmounted');
    },

    emit: (eventName: string, payload?: Record<string, unknown>) => {
      eventEmitter.emit(eventName, payload);
    },
  };

  return api;
}

// Create the global NextWidget object
const NextWidget: NextWidgetGlobal = {
  mount,
};

// Expose to window
if (typeof window !== 'undefined') {
  window.NextWidget = NextWidget;
}

export { NextWidget };
export default NextWidget;

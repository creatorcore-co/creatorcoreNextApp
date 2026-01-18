import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { createLogger, BubbleEventEmitter } from '@/shared/bubble';
import type { WidgetConfig, WidgetAPI, WidgetProps } from './types';
import { Widget } from './Component';
import { WidgetStyles } from './styles';

/**
 * Mount the widget to a container element
 */
function mount(container: HTMLElement, config: WidgetConfig): WidgetAPI {
  const debug = config.debug ?? false;
  const logger = createLogger({ debug, prefix: 'NextWidget' });
  const eventEmitter = new BubbleEventEmitter({
    debug,
    prefix: 'NextWidget',
    eventPrefix: 'nextwidget',
  });

  logger.info('Mounting widget with config:', {
    vercelBaseUrl: config.vercelBaseUrl,
    bubbleBaseUrl: config.bubbleBaseUrl,
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
const NextWidget: { mount: typeof mount } = {
  mount,
};

// Expose to window
if (typeof window !== 'undefined') {
  (window as unknown as { NextWidget: typeof NextWidget }).NextWidget =
    NextWidget;
}

export { NextWidget };
export default NextWidget;

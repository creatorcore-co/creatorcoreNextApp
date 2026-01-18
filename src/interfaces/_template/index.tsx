import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { createLogger, BubbleEventEmitter } from '@/shared/bubble';
import type {
  {{INTERFACE_NAME}}Config,
  {{INTERFACE_NAME}}API,
  {{INTERFACE_NAME}}Props,
} from './types';
import { {{INTERFACE_NAME}}Component } from './Component';
import { {{INTERFACE_NAME}}Styles } from './styles';

/**
 * Mount the {{INTERFACE_NAME}} interface to a container element
 */
function mount(
  container: HTMLElement,
  config: {{INTERFACE_NAME}}Config
): {{INTERFACE_NAME}}API {
  const debug = config.debug ?? false;
  const logger = createLogger({ debug, prefix: '{{INTERFACE_NAME}}' });
  const eventEmitter = new BubbleEventEmitter({
    debug,
    prefix: '{{INTERFACE_NAME}}',
    eventPrefix: '{{INTERFACE_NAME_KEBAB}}',
  });

  logger.info('Mounting {{INTERFACE_NAME}} with config:', {
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
  innerContainer.id = '{{INTERFACE_NAME_KEBAB}}-root';
  innerContainer.className = '{{INTERFACE_NAME_KEBAB}}-container';
  mountPoint.appendChild(innerContainer);

  // Inject styles
  const styleElement = document.createElement('style');
  styleElement.textContent = {{INTERFACE_NAME}}Styles;
  if (shadowRoot) {
    shadowRoot.appendChild(styleElement);
  } else {
    // Inject styles into the document head if not using shadow DOM
    if (!document.getElementById('{{INTERFACE_NAME_KEBAB}}-styles')) {
      styleElement.id = '{{INTERFACE_NAME_KEBAB}}-styles';
      document.head.appendChild(styleElement);
    }
  }

  // Current props state
  let currentProps: {{INTERFACE_NAME}}Props = { ...config.props };

  // Create React root
  let root: Root | null = createRoot(innerContainer);

  // Render function
  const render = () => {
    if (!root) return;

    root.render(
      <React.StrictMode>
        <{{INTERFACE_NAME}}Component
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

  // Return the interface API
  const api: {{INTERFACE_NAME}}API = {
    update: (newProps: Partial<{{INTERFACE_NAME}}Props>) => {
      logger.debug('Updating props:', newProps);
      currentProps = { ...currentProps, ...newProps };
      render();
    },

    unmount: () => {
      logger.info('Unmounting {{INTERFACE_NAME}}');
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

      logger.debug('{{INTERFACE_NAME}} unmounted');
    },

    emit: (eventName: string, payload?: Record<string, unknown>) => {
      eventEmitter.emit(eventName, payload);
    },
  };

  return api;
}

// Create the global {{INTERFACE_NAME}} object
const {{INTERFACE_NAME}}: { mount: typeof mount } = {
  mount,
};

// Expose to window
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).{{INTERFACE_NAME}} =
    {{INTERFACE_NAME}};
}

export { {{INTERFACE_NAME}} };
export default {{INTERFACE_NAME}};

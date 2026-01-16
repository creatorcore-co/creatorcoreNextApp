import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { createLogger, BubbleEventEmitter } from '@/shared/bubble';
import type {
  MulticurrencyBalancesConfig,
  MulticurrencyBalancesAPI,
  MulticurrencyBalancesProps,
} from './types';
import { MulticurrencyBalancesComponent } from './Component';
import { MulticurrencyBalancesStyles } from './styles';

/**
 * Mount the MulticurrencyBalances interface to a container element
 */
function mount(
  container: HTMLElement,
  config: MulticurrencyBalancesConfig
): MulticurrencyBalancesAPI {
  const debug = config.debug ?? false;
  const logger = createLogger({ debug, prefix: 'MulticurrencyBalances' });
  const eventEmitter = new BubbleEventEmitter({
    debug,
    prefix: 'MulticurrencyBalances',
    eventPrefix: 'multicurrency-balances',
  });

  logger.info('Mounting MulticurrencyBalances with config:', {
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
  innerContainer.id = 'multicurrency-balances-root';
  innerContainer.className = 'multicurrency-balances-container';
  mountPoint.appendChild(innerContainer);

  // Inject styles
  const styleElement = document.createElement('style');
  styleElement.textContent = MulticurrencyBalancesStyles;
  if (shadowRoot) {
    shadowRoot.appendChild(styleElement);
  } else {
    // Inject styles into the document head if not using shadow DOM
    if (!document.getElementById('multicurrency-balances-styles')) {
      styleElement.id = 'multicurrency-balances-styles';
      document.head.appendChild(styleElement);
    }
  }

  // Current props state
  let currentProps: MulticurrencyBalancesProps = { ...config.props };

  // Create React root
  let root: Root | null = createRoot(innerContainer);

  // Render function
  const render = () => {
    if (!root) return;

    root.render(
      <React.StrictMode>
        <MulticurrencyBalancesComponent
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
  const api: MulticurrencyBalancesAPI = {
    update: (newProps: Partial<MulticurrencyBalancesProps>) => {
      logger.debug('Updating props:', newProps);
      currentProps = { ...currentProps, ...newProps };
      render();
    },

    unmount: () => {
      logger.info('Unmounting MulticurrencyBalances');
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

      logger.debug('MulticurrencyBalances unmounted');
    },

    emit: (eventName: string, payload?: Record<string, unknown>) => {
      eventEmitter.emit(eventName, payload);
    },
  };

  return api;
}

// Create the global MulticurrencyBalances object
const MulticurrencyBalances: { mount: typeof mount } = {
  mount,
};

// Expose to window
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).MulticurrencyBalances =
    MulticurrencyBalances;
}

export { MulticurrencyBalances };
export default MulticurrencyBalances;

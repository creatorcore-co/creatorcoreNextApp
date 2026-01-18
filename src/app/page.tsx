'use client';

import { useState, useCallback } from 'react';
import { Widget } from '@/interfaces/widget/Component';
import type { WidgetConfig, WidgetProps } from '@/interfaces/widget/types';

/**
 * Standalone Mode - Demo Page
 * This page demonstrates the widget running in standalone mode
 * outside of the Bubble environment
 */
export default function HomePage() {
  const [events, setEvents] = useState<Array<{ event: string; payload?: Record<string, unknown>; time: string }>>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Mock services for standalone mode
  const mockServices = {
    callBubbleWorkflow: async (name: string, params?: Record<string, unknown>) => {
      console.log('Mock: callBubbleWorkflow', name, params);
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true, workflow: name, params };
    },

    callNextApi: async (endpoint: string, options?: RequestInit) => {
      console.log('Mock: callNextApi', endpoint, options);
      // Make actual call to Next.js API in standalone mode
      try {
        const response = await fetch(endpoint, options);
        return response.json();
      } catch {
        return { error: 'API not available in demo mode' };
      }
    },

    emitEvent: (name: string, payload?: Record<string, unknown>) => {
      console.log('Mock: emitEvent', name, payload);
    },

    getNextToken: () => null,

    isAuthenticated: () => false,
  };

  // Demo props
  const demoProps: WidgetProps = {
    user: {
      id: 'demo-user-123',
      name: 'Demo User',
      email: 'demo@example.com',
    },
    theme,
    mode: 'embedded',
  };

  // Demo config
  const demoConfig: WidgetConfig = {
    props: demoProps,
    services: mockServices,
    vercelBaseUrl: '',
    bubbleBaseUrl: 'https://demo-app.bubbleapps.io',
    isAuthenticated: false,
    debug: true,
  };

  // Handle events from widget
  const handleEmit = useCallback((event: string, payload?: Record<string, unknown>) => {
    const time = new Date().toLocaleTimeString();
    setEvents((prev) => [{ event, payload, time }, ...prev.slice(0, 9)]);
  }, []);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">CreatorCore Next.js Widget</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            An embeddable React widget for Bubble.io applications. This page demonstrates
            the widget running in standalone mode.
          </p>
        </header>

        {/* Theme Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark'
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
          >
            Toggle {theme === 'light' ? 'Dark' : 'Light'} Mode
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Widget Demo */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Widget Preview</h2>
            <div className={`p-6 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
              <Widget config={{ ...demoConfig, props: { ...demoProps, theme } }} onEmit={handleEmit} />
            </div>
          </div>

          {/* Event Log */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Event Log</h2>
            <div
              className={`p-4 rounded-xl ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              } shadow-lg h-96 overflow-y-auto`}
            >
              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Events will appear here when you interact with the widget
                </p>
              ) : (
                <div className="space-y-2">
                  {events.map((e, i) => (
                    <div
                      key={i}
                      className={`p-3 rounded-lg text-sm ${
                        theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-indigo-500">{e.event}</span>
                        <span className="text-xs text-gray-500">{e.time}</span>
                      </div>
                      {e.payload && (
                        <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                          {JSON.stringify(e.payload, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integration Guide */}
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6">Integration Guide</h2>

          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className="text-lg font-semibold mb-4">1. Load the Widget Script</h3>
            <pre
              className={`p-4 rounded-lg text-sm overflow-x-auto ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              {`<script src="https://creatorcore-next-app.vercel.app/bundles/widget.js"></script>`}
            </pre>

            <h3 className="text-lg font-semibold mb-4 mt-8">2. Mount the Widget</h3>
            <pre
              className={`p-4 rounded-lg text-sm overflow-x-auto ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              {`const widget = window.NextWidget.mount(
  document.getElementById('widget-container'),
  {
    props: {
      user: { id: '123', name: 'John', email: 'john@example.com' },
      theme: 'light',
      mode: 'embedded'
    },
    services: {
      callBubbleWorkflow: async (name, params) => { /* ... */ },
      callNextApi: async (endpoint, options) => { /* ... */ },
      emitEvent: (name, payload) => { /* ... */ },
      getNextToken: () => localStorage.getItem('nextToken'),
      isAuthenticated: () => !!localStorage.getItem('nextToken')
    },
    vercelBaseUrl: 'https://creatorcore-next-app.vercel.app',
    bubbleBaseUrl: 'https://your-app.bubbleapps.io',
    isAuthenticated: true,
    debug: false
  }
);`}
            </pre>

            <h3 className="text-lg font-semibold mb-4 mt-8">3. Listen for Events</h3>
            <pre
              className={`p-4 rounded-lg text-sm overflow-x-auto ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              {`document.addEventListener('nextwidget:action', (event) => {
  console.log('Widget action:', event.detail);
});

document.addEventListener('nextwidget:workflow-complete', (event) => {
  console.log('Workflow complete:', event.detail);
});`}
            </pre>

            <h3 className="text-lg font-semibold mb-4 mt-8">4. Update Props Dynamically</h3>
            <pre
              className={`p-4 rounded-lg text-sm overflow-x-auto ${
                theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'
              }`}
            >
              {`// Update widget props
widget.update({ theme: 'dark' });

// Unmount when done
widget.unmount();`}
            </pre>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-500 text-sm">
          <p>CreatorCore Next.js Widget &copy; {new Date().getFullYear()}</p>
        </footer>
      </div>
    </div>
  );
}

/**
 * Shared Logger Utility
 * Provides consistent debug logging across all interfaces
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

export interface LoggerOptions {
  /** Enable debug logging */
  debug?: boolean;
  /** Prefix for log messages (e.g., "NextWidget", "MyDashboard") */
  prefix?: string;
}

/**
 * Create a logger instance with configurable prefix and debug mode
 */
export function createLogger(options: LoggerOptions = {}): Logger {
  const { debug: debugEnabled = false, prefix = 'Interface' } = options;

  const log = (level: LogLevel, ...args: unknown[]) => {
    if (!debugEnabled && level === 'debug') return;
    const tag = `[${prefix}:${level.toUpperCase()}]`;
    switch (level) {
      case 'error':
        console.error(tag, ...args);
        break;
      case 'warn':
        console.warn(tag, ...args);
        break;
      case 'info':
        console.info(tag, ...args);
        break;
      default:
        console.log(tag, ...args);
    }
  };

  return {
    debug: (...args: unknown[]) => log('debug', ...args),
    info: (...args: unknown[]) => log('info', ...args),
    warn: (...args: unknown[]) => log('warn', ...args),
    error: (...args: unknown[]) => log('error', ...args),
  };
}

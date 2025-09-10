/**
 * Environment-based logging utility
 * 
 * Logging levels:
 * - production: Only error and warn
 * - development: All levels (debug, log, warn, error)
 * - test: Only error
 */

type LogLevel = 'debug' | 'log' | 'warn' | 'error';

interface LoggerConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  logLevel: string;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    const env = typeof process !== 'undefined' ? (process.env?.NODE_ENV || 'development') : 'development';
    const customLogLevel = typeof process !== 'undefined' ? process.env?.LOG_LEVEL?.toLowerCase() : undefined;
    
    this.config = {
      isDevelopment: env === 'development',
      isProduction: env === 'production',
      isTest: env === 'test',
      logLevel: customLogLevel || env
    };
  }

  private shouldLog(level: LogLevel): boolean {
    // Custom log level override
    if (this.config.logLevel) {
      const levels: LogLevel[] = ['debug', 'log', 'warn', 'error'];
      const customLevelIndex = levels.indexOf(this.config.logLevel as LogLevel);
      const currentLevelIndex = levels.indexOf(level);
      
      if (customLevelIndex !== -1) {
        return currentLevelIndex >= customLevelIndex;
      }
    }

    // Environment-based defaults
    if (this.config.isProduction) {
      return level === 'error' || level === 'warn';
    }
    
    if (this.config.isTest) {
      return level === 'error';
    }
    
    // Development - log everything
    return true;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): void {
    if (!this.shouldLog(level)) return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    switch (level) {
      case 'debug':
        console.debug(prefix, message, ...args);
        break;
      case 'log':
        console.log(prefix, message, ...args);
        break;
      case 'warn':
        console.warn(prefix, message, ...args);
        break;
      case 'error':
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]): void {
    this.formatMessage('debug', message, ...args);
  }

  log(message: string, ...args: any[]): void {
    this.formatMessage('log', message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.formatMessage('log', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.formatMessage('warn', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.formatMessage('error', message, ...args);
  }

  // Group methods for better organization in console
  group(label: string): void {
    if (this.shouldLog('log')) {
      console.group(label);
    }
  }

  groupCollapsed(label: string): void {
    if (this.shouldLog('log')) {
      console.groupCollapsed(label);
    }
  }

  groupEnd(): void {
    if (this.shouldLog('log')) {
      console.groupEnd();
    }
  }

  // Table method for structured data
  table(data: any): void {
    if (this.shouldLog('log')) {
      console.table(data);
    }
  }

  // Time methods for performance monitoring
  time(label: string): void {
    if (this.shouldLog('debug')) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog('debug')) {
      console.timeEnd(label);
    }
  }
}

// Singleton instance
const logger = new Logger();

// Export both the logger instance and the Logger class
export { logger, Logger };
export default logger;
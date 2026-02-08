import { LoggerConfig } from './types'

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  level: 'warn',
  enableConsole: true,
  enableFile: false,
  enableStructured: false,
  colors: {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
  },
}

export function getLoggerConfig(): LoggerConfig {
  // Only use environment variables on server-side
  if (typeof window !== 'undefined') {
    return {
      ...DEFAULT_LOGGER_CONFIG,
      level: 'info',
      enableConsole: true,
      enableFile: false,
    }
  }

  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    ...DEFAULT_LOGGER_CONFIG,
    level: (process.env.LOG_LEVEL as LoggerConfig['level']) ||
           (isDevelopment ? 'info' : 'warn'),
    enableConsole: isDevelopment,
    enableFile: process.env.ENABLE_FILE_LOGGING === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  }
}
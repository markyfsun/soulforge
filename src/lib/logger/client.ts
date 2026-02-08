export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  metadata?: {
    component?: string
    userId?: string
    sessionId?: string
    traceId?: string
    [key: string]: any
  }
}

export interface LoggerConfig {
  level: LogLevel
  enableConsole: boolean
  enableReporting: boolean
  endpoint?: string
  colors: {
    debug: string
    info: string
    warn: string
    error: string
  }
}

export class ClientLogger {
  private config: LoggerConfig
  private context: Record<string, any> = {}
  private sessionId: string

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: 'debug',
      enableConsole: true,
      enableReporting: false,
      colors: {
        debug: '#06b6d4', // Cyan
        info: '#10b981',  // Green
        warn: '#f59e0b',  // Yellow
        error: '#ef4444', // Red
      },
      ...config,
    }

    this.sessionId = this.generateSessionId()
    this.context = {
      sessionId: this.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    }
  }

  private generateSessionId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  setContext(context: Record<string, any>): void {
    this.context = { ...this.context, ...context }
  }

  getContext(): Record<string, any> {
    return { ...this.context }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context)
  }

  error(message: string, error?: Error | Record<string, any>, context?: Record<string, any>): void {
    const errorContext = error instanceof Error ? {
      error: error.message,
      stack: error.stack,
      ...context
    } : { ...error, ...context }

    this.log('error', message, errorContext)
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (this.shouldLog(level)) {
      const logEntry = this.createLogEntry(level, message, context)

      if (this.config.enableConsole) {
        this.logToConsole(logEntry)
      }

      if (this.config.enableReporting && this.config.endpoint) {
        this.reportToServer(logEntry)
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    }

    return levels[level] >= levels[this.config.level]
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      metadata: {
        ...this.context,
        ...(context ? {
          input: context,
          ...Object.fromEntries(
            Object.entries(context).filter(([_, v]) => v !== undefined && v !== null)
          )
        } : {}),
      },
    }
  }

  private logToConsole(entry: LogEntry): void {
    const color = this.config.colors[entry.level]
    const style = `color: ${color}; font-weight: bold;`

    const baseMessage = `%c[${entry.level.toUpperCase()}] ${entry.timestamp}`
    const componentMsg = entry.metadata?.component ? ` [${entry.metadata.component}]` : ''
    const message = `${baseMessage}${componentMsg}: ${entry.message}`

    if (entry.context) {
      console.log(message, style, JSON.stringify(entry.context, null, 2))
    } else {
      console.log(message, style)
    }

    if (entry.level === 'error' && entry.metadata?.error && entry.metadata?.stack) {
      console.log(`%cStack:`, style, entry.metadata.stack)
    }
  }

  private async reportToServer(entry: LogEntry): Promise<void> {
    try {
      const response = await fetch(this.config.endpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      })

      if (!response.ok) {
        console.error('Failed to report log to server:', response.statusText)
      }
    } catch (error) {
      console.error('Failed to report log to server:', error)
    }
  }

  // User action tracking
  trackUserAction(action: string, details?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      action,
      timestamp: new Date().toISOString(),
      ...details,
    })
  }

  // API call tracking
  trackApiCall(method: string, url: string, statusCode?: number, duration?: number): void {
    this.info(`API ${method} ${url}`, {
      method,
      url,
      statusCode,
      duration,
    })
  }

  // Error tracking
  trackError(error: Error, component?: string, context?: Record<string, any>): void {
    this.error(error.message, error, {
      component,
      ...context,
    })
  }
}

// Create a global client logger instance
export const clientLogger = new ClientLogger({
  level: (process.env.NEXT_PUBLIC_LOG_LEVEL as LogLevel) || 'info',
  enableConsole: process.env.NODE_ENV === 'development',
})

// Create React hook for easy usage
export function useLogger(component?: string) {
  if (component) {
    clientLogger.setContext({ component })
  }

  return {
    debug: (message: string, context?: Record<string, any>) => clientLogger.debug(message, context),
    info: (message: string, context?: Record<string, any>) => clientLogger.info(message, context),
    warn: (message: string, context?: Record<string, any>) => clientLogger.warn(message, context),
    error: (message: string, error?: Error | Record<string, any>, context?: Record<string, any>) =>
      clientLogger.error(message, error, context),
    trackUserAction: (action: string, details?: Record<string, any>) =>
      clientLogger.trackUserAction(action, details),
    trackApiCall: (method: string, url: string, statusCode?: number, duration?: number) =>
      clientLogger.trackApiCall(method, url, statusCode, duration),
    trackError: (error: Error, context?: Record<string, any>) =>
      clientLogger.trackError(error, component, context),
    setContext: (context: Record<string, any>) => clientLogger.setContext(context),
    getContext: () => clientLogger.getContext(),
  }
}
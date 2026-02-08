import { LogEntry, LoggerConfig, LoggerContext, LogLevel } from './types'
import { getLoggerConfig } from './config'

export class Logger {
  private config: LoggerConfig
  private context: LoggerContext = {}

  constructor(config?: Partial<LoggerConfig>) {
    this.config = { ...getLoggerConfig(), ...config }
  }

  setContext(context: Partial<LoggerContext>): void {
    this.context = { ...this.context, ...context }
  }

  getContext(): LoggerContext {
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

      if (this.config.enableFile) {
        this.logToFile(logEntry)
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
    const reset = '\x1b[0m'

    const baseMessage = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp}`
    const componentMsg = entry.metadata?.component ? ` [${entry.metadata.component}]` : ''
    const message = `${baseMessage}${componentMsg}: ${entry.message}`

    if (this.config.enableStructured && entry.context) {
      console.log(message, JSON.stringify(entry.context, null, 2))
    } else {
      console.log(message)

      if (entry.metadata) {
        console.log('Metadata:', JSON.stringify({
          component: entry.metadata.component,
          userId: entry.metadata.userId,
          sessionId: entry.metadata.sessionId,
          traceId: entry.metadata.traceId,
          ...entry.metadata,
        }, null, 2))
      }
    }

    if (entry.level === 'error' && entry.metadata?.error && entry.metadata?.stack) {
      console.log(`${color}Stack:${reset}`, entry.metadata.stack)
    }
  }

  private async logToFile(entry: LogEntry): Promise<void> {
    // Only log to file on server-side
    if (typeof window !== 'undefined') {
      return
    }

    try {
      const fs = await import('fs')
      const path = await import('path')

      const logDirectory = path.dirname(this.config.filePath!)

      if (!fs.existsSync(logDirectory)) {
        fs.mkdirSync(logDirectory, { recursive: true })
      }

      const logLine = JSON.stringify(entry) + '\n'

      await fs.promises.appendFile(this.config.filePath!, logLine)
    } catch (error) {
      console.error('Failed to write to log file:', error)
    }
  }

  // Helper methods for common patterns
  logApiCall(method: string, path: string, statusCode?: number, duration?: number): void {
    this.info(`API ${method} ${path}`, {
      method,
      path,
      statusCode,
      duration,
    })
  }

  logDatabaseOperation(operation: string, table: string, duration?: number): void {
    this.debug(`Database ${operation} ${table}`, { operation, table, duration })
  }

  logAiOperation(operation: string, model: string, duration?: number): void {
    this.info(`AI ${operation} ${model}`, { operation, model, duration })
  }

  logUserAction(action: string, userId?: string, details?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      action,
      userId,
      ...details,
    })
  }

  // Performance tracking
  time<T>(label: string, fn: () => Promise<T>): Promise<T>
  time<T>(label: string, fn: () => T): T
  time<T>(label: string, fn: (() => Promise<T>) | (() => T)): Promise<T> | T {
    const start = performance.now()

    if (fn.constructor.name === 'AsyncFunction') {
      return (fn as () => Promise<T>)().then(result => {
        const duration = performance.now() - start
        this.debug(`Timer ${label}`, { duration: Math.round(duration) })
        return result
      })
    } else {
      const result = (fn as () => T)()
      const duration = performance.now() - start
      this.debug(`Timer ${label}`, { duration: Math.round(duration) })
      return result
    }
  }
}

// Create a global logger instance
export const logger = new Logger()

// Create specialized loggers for different components
const apiLoggerInstance = new Logger()
apiLoggerInstance.setContext({ component: 'API' })
export const apiLogger = apiLoggerInstance

const dbLoggerInstance = new Logger()
dbLoggerInstance.setContext({ component: 'Database' })
export const dbLogger = dbLoggerInstance

const aiLoggerInstance = new Logger()
aiLoggerInstance.setContext({ component: 'AI' })
export const aiLogger = aiLoggerInstance

const authLoggerInstance = new Logger()
authLoggerInstance.setContext({ component: 'Auth' })
export const authLogger = authLoggerInstance

const forumLoggerInstance = new Logger()
forumLoggerInstance.setContext({ component: 'Forum' })
export const forumLogger = forumLoggerInstance

const chatLoggerInstance = new Logger()
chatLoggerInstance.setContext({ component: 'Chat' })
export const chatLogger = chatLoggerInstance
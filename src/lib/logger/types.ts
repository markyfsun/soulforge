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
  enableFile: boolean
  filePath?: string
  enableStructured: boolean
  colors: {
    debug: string
    info: string
    warn: string
    error: string
  }
}

export interface LoggerContext {
  component?: string
  userId?: string
  sessionId?: string
  traceId?: string
  [key: string]: any
}
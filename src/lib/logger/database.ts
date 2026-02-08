import { dbLogger } from './logger'

export class DatabaseLogger {
  private operation: string
  private table: string
  private startTime: number

  constructor(operation: string, table: string) {
    this.operation = operation
    this.table = table
    this.startTime = performance.now()
    dbLogger.debug(`Database ${operation} started`, { table })
  }

  success(metadata?: Record<string, any>): void {
    const duration = performance.now() - this.startTime
    dbLogger.info(`Database ${this.operation} completed`, {
      table: this.table,
      duration: Math.round(duration),
      metadata,
    })
  }

  error(error: Error, metadata?: Record<string, any>): void {
    const duration = performance.now() - this.startTime
    dbLogger.error(`Database ${this.operation} failed`, error, {
      table: this.table,
      duration: Math.round(duration),
      metadata,
    })
  }

  withMetadata(metadata: Record<string, any>): DatabaseLogger {
    dbLogger.debug(`Database ${this.operation} metadata`, {
      table: this.table,
      metadata,
    })
    return this
  }
}

export function logDatabaseOperation(operation: string, table: string, metadata?: Record<string, any>) {
  return new DatabaseLogger(operation, table).withMetadata(metadata || {})
}

// Wrapper for Supabase operations
export async function withDatabaseLogging<T>(
  operation: string,
  table: string,
  promise: Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const logger = logDatabaseOperation(operation, table, metadata)

  try {
    const result = await promise
    logger.success({ records: Array.isArray(result) ? result.length : 1 })
    return result
  } catch (error) {
    logger.error(error as Error)
    throw error
  }
}
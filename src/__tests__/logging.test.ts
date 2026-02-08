import { logger, apiLogger, dbLogger, aiLogger } from '@/lib/logger'

describe('Logging System', () => {
  beforeEach(() => {
    // Clear any previous context
    logger.setContext({})
  })

  describe('Core Logger', () => {
    it('should log different levels correctly', () => {
      const debugSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      logger.debug('Debug message', { detail: 'debug info' })
      logger.info('Info message', { detail: 'info info' })
      logger.warn('Warning message', { detail: 'warning info' })
      logger.error('Error message', new Error('Test error'), { detail: 'error info' })

      expect(debugSpy).toHaveBeenCalledWith(expect.stringContaining('DEBUG'))
      expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining('INFO'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('WARN'))
      expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('ERROR'))

      debugSpy.mockRestore()
      infoSpy.mockRestore()
      warnSpy.mockRestore()
      errorSpy.mockRestore()
    })

    it('should include context in logs', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.setContext({
        userId: 'test-user',
        sessionId: 'test-session'
      })

      logger.info('Test message')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('test-user'),
        expect.objectContaining({
          userId: 'test-user',
          sessionId: 'test-session'
        })
      )

      consoleSpy.mockRestore()
    })

    it('should use performance timing', () => {
      const result = logger.time('test-timer', () => {
        return 'test-result'
      })

      expect(result).toBe('test-result')
    })

    it('should track API calls', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      apiLogger.logApiCall('POST', '/api/test', 200, 150)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('API POST /api/test'),
        expect.objectContaining({
          method: 'POST',
          path: '/api/test',
          statusCode: 200,
          duration: 150
        })
      )

      consoleSpy.mockRestore()
    })

    it('should track AI operations', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      aiLogger.logAiOperation('generate', 'claude-3-5-sonnet', 500)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('AI generate claude-3-5-sonnet'),
        expect.objectContaining({
          operation: 'generate',
          model: 'claude-3-5-sonnet',
          duration: 500
        })
      )

      consoleSpy.mockRestore()
    })

    it('should track database operations', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      dbLogger.logDatabaseOperation('insert', 'ocs', { count: 1 })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database insert ocs'),
        expect.objectContaining({
          operation: 'insert',
          table: 'ocs',
          count: 1
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Client Logger', () => {
    it('should handle frontend logging', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const { debug, info, warn, error } = logger

      debug('Frontend debug', { component: 'TestComponent' })
      info('Frontend info', { action: 'click' })
      warn('Frontend warning', { issue: 'timeout' })
      error('Frontend error', new Error('Frontend error'), { component: 'TestComponent' })

      expect(consoleSpy).toHaveBeenCalledTimes(4)

      consoleSpy.mockRestore()
    })

    it('should track user actions', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      logger.logUserAction('button_click', 'user123', { buttonId: 'submit' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('User action: button_click'),
        expect.objectContaining({
          action: 'button_click',
          userId: 'user123',
          buttonId: 'submit'
        })
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Error Handling', () => {
    it('should log errors with stack traces', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const testError = new Error('Test error')
      testError.stack = 'Error: Test error\n    at test (test.js:1:1)'

      logger.error('Test error occurred', testError, { context: 'test' })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Stack:'),
        expect.stringContaining('Error: Test error')
      )

      consoleSpy.mockRestore()
    })
  })
})
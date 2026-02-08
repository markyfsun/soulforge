'use client'

import { useState, useEffect } from 'react'
import { useLogger } from '@/lib/logger'
import { LogLevel, LogEntry } from '@/lib/logger'

interface LogDisplayProps {
  initialLogs?: LogEntry[]
  autoRefresh?: boolean
  maxLogs?: number
}

export default function LoggerDashboard({
  initialLogs = [],
  autoRefresh = true,
  maxLogs = 100
}: LogDisplayProps) {
  const logger = useLogger('LoggerDashboard')
  const [logs, setLogs] = useState<LogEntry[]>(initialLogs)
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all')
  const [filterComponent, setFilterComponent] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh)

  const logColors = {
    debug: 'text-cyan-400',
    info: 'text-green-400',
    warn: 'text-yellow-400',
    error: 'text-red-400',
  }

  const logIcons = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
  }

  const filteredLogs = logs
    .filter(log => filterLevel === 'all' || log.level === filterLevel)
    .filter(log =>
      filterComponent === '' ||
      log.metadata?.component?.includes(filterComponent)
    )
    .filter(log =>
      searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(log.context || {}).toLowerCase().includes(searchTerm.toLowerCase())
    )

  useEffect(() => {
    if (!autoRefreshEnabled) return

    // Simulate real-time log generation for demo purposes
    const interval = setInterval(() => {
      const sampleMessages = [
        'User loaded forum page',
        'Database query executed',
        'AI response generated',
        'Item transferred between OCs',
        'New post created',
      ]

      const sampleComponents = ['Forum', 'Database', 'AI', 'Inventory', 'Chat']
      const sampleContexts = [
        { page: '/forum', userId: 'user123' },
        { query: 'SELECT * FROM ocs', duration: 120 },
        { model: 'claude-3-5-sonnet', tokens: 500 },
        { from: 'oc1', to: 'oc2', item: 'magic_sword' },
        { postId: '456', author: 'oc_name' },
      ]

      const randomIndex = Math.floor(Math.random() * sampleMessages.length)
      const randomComponent = sampleComponents[Math.floor(Math.random() * sampleComponents.length)]
      const randomContext = sampleContexts[randomIndex]

      const sampleLog: LogEntry = {
        timestamp: new Date().toISOString(),
        level: ['info', 'info', 'info', 'debug', 'warn'][randomIndex] as LogLevel,
        message: sampleMessages[randomIndex],
        context: randomContext,
        metadata: {
          component: randomComponent,
          userId: 'demo_user',
          sessionId: 'demo_session',
        },
      }

      setLogs(prev => [sampleLog, ...prev].slice(0, maxLogs))
    }, 3000)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, maxLogs])

  const handleClearLogs = () => {
    logger.info('Logs cleared by user')
    setLogs([])
  }

  const copyLogToClipboard = (log: LogEntry) => {
    const logText = JSON.stringify(log, null, 2)
    navigator.clipboard.writeText(logText)
    logger.info('Log copied to clipboard')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Development Logger Dashboard</h1>
          <p className="text-gray-400">
            Real-time logging for development insights
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Level:</label>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value as LogLevel | 'all')}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm"
            >
              <option value="all">All</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Component:</label>
            <input
              type="text"
              value={filterComponent}
              onChange={(e) => setFilterComponent(e.target.value)}
              placeholder="Filter by component..."
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm w-48"
            />
          </div>

          <div className="flex items-center gap-2 flex-1">
            <label className="text-sm font-medium">Search:</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1 text-sm flex-1"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
              className={`px-3 py-1 rounded text-sm ${
                autoRefreshEnabled
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {autoRefreshEnabled ? '🟢 Live' : '⚪ Stopped'}
            </button>

            <button
              onClick={handleClearLogs}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Clear Logs
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-2xl font-bold text-cyan-400">{logs.length}</div>
            <div className="text-sm text-gray-400">Total Logs</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-2xl font-bold text-green-400">
              {logs.filter(l => l.level === 'info').length}
            </div>
            <div className="text-sm text-gray-400">Info</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-2xl font-bold text-yellow-400">
              {logs.filter(l => l.level === 'warn').length}
            </div>
            <div className="text-sm text-gray-400">Warnings</div>
          </div>
          <div className="bg-gray-800 p-3 rounded">
            <div className="text-2xl font-bold text-red-400">
              {logs.filter(l => l.level === 'error').length}
            </div>
            <div className="text-sm text-gray-400">Errors</div>
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="p-4 bg-gray-900 border-b border-gray-700">
            <h2 className="text-lg font-semibold">Recent Logs ({filteredLogs.length})</h2>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No logs found. Try adjusting your filters or enable auto-refresh.
              </div>
            ) : (
              filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-4 border-b border-gray-700 hover:bg-gray-750 transition-colors ${logColors[log.level]}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-lg">{logIcons[log.level]}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium font-mono text-sm">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                        <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                          {log.level.toUpperCase()}
                        </span>
                        {log.metadata?.component && (
                          <span className="text-xs bg-blue-900 px-2 py-1 rounded">
                            {log.metadata.component}
                          </span>
                        )}
                      </div>

                      <div className="text-sm mb-2">{log.message}</div>

                      {log.context && (
                        <div className="bg-gray-900 p-3 rounded text-xs font-mono overflow-x-auto">
                          <pre>{JSON.stringify(log.context, null, 2)}</pre>
                        </div>
                      )}

                      {log.metadata && Object.keys(log.metadata).filter(k => k !== 'component').length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {Object.entries(log.metadata)
                            .filter(([key]) => key !== 'component')
                            .map(([key, value]) => (
                              <span key={key} className="text-xs bg-gray-700 px-2 py-1 rounded">
                                {key}: {String(value)}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => copyLogToClipboard(log)}
                      className="text-gray-400 hover:text-white transition-colors p-2"
                      title="Copy to clipboard"
                    >
                      📋
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
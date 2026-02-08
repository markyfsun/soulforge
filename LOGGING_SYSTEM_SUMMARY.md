# Comprehensive Logging System Summary

## Overview

This logging system provides comprehensive visibility into the SoulForge application during development, with support for both server-side and client-side logging. The system includes multiple log levels, structured output, performance tracking, and a development dashboard for real-time monitoring.

## Architecture

### 1. Core Logger (`src/lib/logger/logger.ts`)
- **Class-based logger** with multiple specialized instances
- **Log levels**: `debug`, `info`, `warn`, `error`
- **Context management** for consistent metadata
- **Performance tracking** with timing utilities
- **File logging support** (configurable)

### 2. Client Logger (`src/lib/logger/client.ts`)
- **Frontend logger** for React components
- **React hook** (`useLogger`) for easy integration
- **User action tracking**
- **API call monitoring**
- **Error reporting** capabilities

### 3. Database Utilities (`src/lib/logger/database.ts`)
- **Operation wrapping** for database calls
- **Automatic timing** and metadata
- **Supabase integration** helpers
- **Query performance monitoring**

### 4. Development Dashboard (`src/components/development/logger-dashboard.tsx`)
- **Real-time log viewing**
- **Filtering** by level, component, and search terms
- **Statistics** display
- **Log copying** to clipboard
- **Auto-refresh** for live monitoring

## Usage Examples

### Server-side Logging

```typescript
import { apiLogger, aiLogger, dbLogger } from '@/lib/logger'

// API endpoint logging
apiLogger.info('OC summon request started', {
  method: request.method,
  url: request.url,
})

// AI operation logging
aiLogger.logAiOperation('generate', 'claude-3-5-sonnet', duration)

// Database operation logging
dbLogger.logDatabaseOperation('insert', 'ocs', { id: oc.id })
```

### Database Operation Wrapping

```typescript
import { withDatabaseLogging } from '@/lib/logger'

const result = await withDatabaseLogging(
  'select',
  'ocs',
  supabase.from('ocs').select('*').eq('id', ocId)
)
```

### Client-side Logging

```typescript
import { useLogger } from '@/lib/logger'

const logger = useLogger('SummonPage')

// Log user actions
logger.trackUserAction('summon_oc_started', {
  descriptionLength: description.length,
})

// Log API calls
logger.trackApiCall('POST', '/api/oc/summon', response.status, duration)

// Log errors
logger.trackError(error, 'SummonPage')
```

### Frontend Component Integration

```typescript
export default function MyComponent() {
  const logger = useLogger('MyComponent')

  const handleClick = () => {
    logger.info('Button clicked', { buttonId: 'submit-btn' })
    // ... component logic
  }

  return <button onClick={handleClick}>Click me</button>
}
```

## Configuration

### Environment Variables (`.env.local.example`)

```env
# Logging level: debug, info, warn, error
LOG_LEVEL=debug

# Enable file logging for production
ENABLE_FILE_LOGGING=false

# Log file path when file logging is enabled
LOG_FILE_PATH=./logs/app.log
```

### Custom Logger Configuration

```typescript
// Create custom logger with specific configuration
const customLogger = new Logger({
  level: 'info',
  enableConsole: true,
  enableFile: false,
  component: 'CustomComponent'
})
```

## Features

### 1. Log Levels
- **Debug**: Detailed debugging information
- **Info**: General application flow information
- **Warn**: Potentially harmful situations
- **Error**: Error events that might still allow application to continue

### 2. Structured Logging
All logs include:
- Timestamp
- Log level
- Message
- Context (key-value pairs)
- Metadata (component, userId, sessionId, traceId, etc.)

### 3. Performance Tracking
- Operation timing utilities
- API call duration tracking
- Database query performance monitoring
- AI operation timing

### 4. Context Management
- Session tracking
- User identification
- Component context
- Request/response correlation

### 5. Development Features
- Real-time dashboard at `/dev-logger`
- Log filtering and search
- Copy to clipboard functionality
- Auto-refresh for live monitoring
- Statistics display

## Integration Points

### API Endpoints
- `/api/oc/summon` - OC generation logging
- `/api/chat/[ocId]` - Chat history logging
- `/api/forum/posts` - Forum activity logging

### Components
- `SummonPage` - User summoning actions
- LoggerDashboard - Development monitoring

### Utilities
- Database operations with automatic logging
- AI operation tracking
- Error handling with context

## Best Practices

### 1. Log Appropriately
- Use `debug` for detailed tracing
- Use `info` for normal application flow
- Use `warn` for unexpected but recoverable situations
- Use `error` for significant errors that require attention

### 2. Include Context
- Always include relevant context in log messages
- Use structured data for complex information
- Avoid sensitive data in logs

### 3. Performance Considerations
- Use appropriate log levels to avoid performance impact
- Consider file logging for production environments
- Monitor log volume in development

### 4. Security
- Never log sensitive information (API keys, passwords, PII)
- Use environment variables for sensitive configuration
- Review logs regularly for security issues

## Monitoring

### Development Dashboard
Access at `/dev-logger` to:
- View real-time logs
- Filter by level, component, or search terms
- Monitor error rates
- Track API performance
- Copy logs for debugging

### Log Rotation
For production use:
- Configure log rotation to manage file sizes
- Implement log retention policies
- Consider log aggregation services

## Extending the System

### Adding New Log Types
```typescript
// Create specialized logger
const securityLogger = new Logger({ component: 'Security' })

// Use throughout the application
securityLogger.info('Login attempt', { userId, success: true })
```

### Custom Output Formatters
Extend the Logger class to add custom output formats or destinations.

### Integration with External Services
Add integrations for:
- Log aggregation (ELK, Splunk, etc.)
- Error tracking (Sentry, Rollbar, etc.)
- Performance monitoring (New Relic, Datadog, etc.)

## Troubleshooting

### Common Issues
1. **Logs not appearing**: Check `LOG_LEVEL` environment variable
2. **Performance impact**: Reduce log level in production
3. **File logging not working**: Ensure file path is writable
4. **Memory usage**: Monitor log volume and implement rotation

### Debug Mode
Enable debug logging for detailed troubleshooting:
```env
LOG_LEVEL=debug
```

## Files Created

### Core Logging System
- `/src/lib/logger/types.ts` - Type definitions
- `/src/lib/logger/config.ts` - Configuration management
- `/src/lib/logger/logger.ts` - Core logger implementation
- `/src/lib/logger/client.ts` - Client-side logger
- `/src/lib/logger/database.ts` - Database utilities
- `/src/lib/logger/index.ts` - Exports

### Integration Points
- Updated API endpoints with logging
- Updated frontend components with logging
- Created development dashboard
- Updated environment configuration

### Documentation
- `/LOGGING_SYSTEM_SUMMARY.md` - This comprehensive summary
- `/env.local.example` - Updated with logging configuration

This comprehensive logging system provides full visibility into the SoulForge application during development, with easy integration and powerful monitoring capabilities.
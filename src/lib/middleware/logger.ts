import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { apiLogger } from '../logger'

export async function loggingMiddleware(request: NextRequest): Promise<NextResponse | void> {
  const startTime = performance.now()

  // Log incoming request
  apiLogger.info('Incoming request', {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    contentType: request.headers.get('content-type'),
  })

  // Capture response and continue to next middleware/route handler
  const response = NextResponse.next()

  // Log when the response is sent
  response.headers.set('x-response-time', `${performance.now() - startTime}ms`)

  // Log response completion
  apiLogger.info('Request completed', {
    method: request.method,
    url: request.url,
    statusCode: response.status,
    duration: `${Math.round(performance.now() - startTime)}ms`,
  })

  return response
}

// Error handling middleware
export async function errorLoggingMiddleware(error: Error): Promise<NextResponse> {
  apiLogger.error('Unhandled error', error, {
    errorType: error.constructor.name,
    message: error.message,
  })

  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred'
    },
    { status: 500 }
  )
}
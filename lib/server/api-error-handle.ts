import { logErrorToSlack } from '@/lib/slack'
import type { Context } from 'hono'

// Error types with appropriate HTTP status codes
export enum ErrorType {
  BadRequest = 400,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  Conflict = 409,
  ValidationError = 422,
  InternalServerError = 500,
  ServiceUnavailable = 503,
}

// Custom API error class
export class ApiError extends Error {
  status: number
  code: string
  details?: Record<string, any>

  constructor(message: string, status = 500, code = 'internal_server_error', details?: Record<string, any>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }

  static badRequest(message: string, code = 'bad_request', details?: Record<string, any>) {
    return new ApiError(message, ErrorType.BadRequest, code, details)
  }

  static unauthorized(message = 'Authentication required', code = 'unauthorized', details?: Record<string, any>) {
    return new ApiError(message, ErrorType.Unauthorized, code, details)
  }

  static forbidden(message = 'Access denied', code = 'forbidden', details?: Record<string, any>) {
    return new ApiError(message, ErrorType.Forbidden, code, details)
  }

  static notFound(message = 'Resource not found', code = 'not_found', details?: Record<string, any>) {
    return new ApiError(message, ErrorType.NotFound, code, details)
  }

  static conflict(message: string, code = 'conflict', details?: Record<string, any>) {
    return new ApiError(message, ErrorType.Conflict, code, details)
  }

  static validation(message: string, details?: Record<string, any>) {
    return new ApiError(message, ErrorType.ValidationError, 'validation_error', details)
  }

  static internal(message = 'Internal server error', details?: Record<string, any>) {
    return new ApiError(message, ErrorType.InternalServerError, 'internal_server_error', details)
  }
}

interface ApiErrorContext {
  endpoint: string
  method: string
  requestId: string
  user?: { id: string; email?: string }
  additionalContext?: Record<string, any>
}

export async function handleApiError(
  error: unknown,
  c: Context,
  context?: Partial<ApiErrorContext>,
): Promise<Response> {
  const requestId = c.get('requestId') || 'unknown'
  const session = c.get('session')

  // Build context information
  const errorContext: ApiErrorContext = {
    endpoint: c.req.path,
    method: c.req.method,
    requestId,
    user: session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
        }
      : undefined,
    ...context,
  }

  // Set default response values
  let status = 500
  const responseBody: any = {
    success: false,
    error: {
      message: 'Internal Server Error',
      code: 'internal_server_error',
      requestId,
    },
  }

  // Process different error types
  if (error instanceof ApiError) {
    status = error.status
    responseBody.error = {
      message: error.message,
      code: error.code,
      requestId,
    }

    // Include error details for non-500 errors if available
    if (error.details && status !== 500) {
      responseBody.error.details = error.details
    }

    // Only log 5xx errors to Slack
    if (status >= 500) {
      await logErrorToSlack(`API Error: ${error.message}`, {
        errorType: error.code,
        status: status.toString(),
        requestId,
        endpoint: errorContext.endpoint,
        method: errorContext.method,
        userId: errorContext.user?.id,
        userEmail: errorContext.user?.email,
        ...error.details,
        ...errorContext.additionalContext,
      })
    }
  } else if (error instanceof Error) {
    // For standard Error objects
    console.error(`[${requestId}] Unhandled API error:`, error)

    // Log all unhandled errors to Slack
    await logErrorToSlack(`Unhandled API Error: ${error.message}`, {
      errorType: 'unhandled_error',
      status: status.toString(),
      stack: error.stack,
      requestId,
      endpoint: errorContext.endpoint,
      method: errorContext.method,
      userId: errorContext.user?.id,
      userEmail: errorContext.user?.email,
      ...errorContext.additionalContext,
    })
  } else {
    // For unknown error types
    console.error(`[${requestId}] Unknown API error:`, error)

    await logErrorToSlack('Unknown API Error', {
      errorType: 'unknown_error',
      status: status.toString(),
      requestId,
      errorObject: JSON.stringify(error),
      endpoint: errorContext.endpoint,
      method: errorContext.method,
      userId: errorContext.user?.id,
      userEmail: errorContext.user?.email,
      ...errorContext.additionalContext,
    })
  }

  // Return JSON response with appropriate status code
  return c.json(responseBody, status as any)
}

import type { Context } from 'hono'
import { ZodError } from 'zod'

const isDevelopment = process.env.NODE_ENV === 'development'

export const createDefaultHook = () => {
  return (result: { success: boolean; error?: unknown }, c: Context) => {
    if (result.success) {
      return
    }

    const requestId = c.get('requestId') || 'unknown'
    const method = c.req.method
    const path = c.req.path
    const url = c.req.url

    console.error('🚨 VALIDATION ERROR DETAILS:')
    console.error(`Request ID: ${requestId}`)
    console.error(`Method: ${method}`)
    console.error(`Path: ${path}`)
    console.error(`Full URL: ${url}`)

    // Log the Zod validation error in detail
    if (result.error instanceof ZodError) {
      console.error('📝 Zod Validation Errors:')
      result.error.issues.forEach((issue, index) => {
        console.error(`  ${index + 1}. Path: [${issue.path.join(' → ')}]`)
        console.error(`     Code: ${issue.code}`)
        console.error(`     Message: ${issue.message}`)
        console.error('     ---')
      })
    } else {
      console.error('❌ Error object:', result.error)
    }

    if (isDevelopment) {
      try {
        c.req
          .json()
          .then((body) => {
            console.error('📦 Request Body:')
            console.error(JSON.stringify(body, null, 2))
          })
          .catch(() => {
            console.error('📦 Request Body: Unable to parse as JSON')
          })
      } catch (e) {
        console.error('📦 Request Body: Not available or already consumed', e)
      }
    }

    console.error('🔚 END VALIDATION ERROR DETAILS\n')

    // Return a detailed error response - include debug details only in development
    const errorResponse = {
      success: false,
      error: 'Validation failed',
      requestId,
      details:
        result.error instanceof ZodError
          ? {
              issues: result.error.issues.map((issue) => ({
                path: issue.path,
                message: issue.message,
                code: issue.code,
              })),
            }
          : {
              message: String(result.error),
            },
      ...(isDevelopment && {
        debug: {
          method,
          path,
          timestamp: new Date().toISOString(),
        },
      }),
    }

    return c.json(errorResponse, 400)
  }
}

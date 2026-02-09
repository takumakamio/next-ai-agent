import type { Context } from 'hono'
import { logger } from 'hono/logger'

const isDevelopment = process.env.NODE_ENV === 'development'

const customPrintFunc = (str: string, ...rest: string[]) => {
  const [method, path, ...otherInfo] = str.split(' ')
  if (method === '<--') {
    console.log(`📥 Incoming ${path} ${otherInfo.join(' ')}`)
  } else if (method === '-->') {
    const statusCode = otherInfo.find((info) => /^\d{3}$/.test(info))
    const isError = statusCode && parseInt(statusCode) >= 400
    const emoji = isError ? '🚨' : '📤'
    console.log(`${emoji} Outgoing ${path} ${otherInfo.join(' ')}`)

    // Extra logging for 400 errors - only in development
    if (isDevelopment && statusCode === '400') {
      console.log(`🔍 400 ERROR DETECTED on ${path}`)
    }
  } else {
    console.log(str, ...rest)
  }
}

export const customLoggerMiddleware = async (c: Context, next: () => Promise<void>) => {
  const requestId = crypto.randomUUID()
  c.set('requestId', requestId)

  const method = c.req.method
  const path = c.req.path
  const startTime = Date.now()

  console.log(`🔄 [${requestId}] ${method} ${path} - Started`)

  // Log request details for debugging - only in development
  if (isDevelopment && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    const contentType = c.req.header('content-type')
    console.log(`📝 [${requestId}] Content-Type: ${contentType || 'not set'}`)

    // Clone request to read body without consuming it
    try {
      const clonedRequest = c.req.raw.clone()
      const body = await clonedRequest.text()
      console.log(`📦 [${requestId}] Request Body Preview:`, body.substring(0, 500))
    } catch (e) {
      console.log(`📦 [${requestId}] Could not read request body`, e)
    }
  }

  await next()

  const endTime = Date.now()
  const duration = endTime - startTime
  const status = c.res.status

  const emoji = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅'
  console.log(`${emoji} [${requestId}] ${method} ${path} - ${status} (${duration}ms)`)

  // Extra logging for errors - only in development
  if (isDevelopment && status >= 400) {
    console.log(`🔍 [${requestId}] Error Response Status: ${status}`)
    try {
      const responseClone = c.res.clone()
      const responseText = await responseClone.text()
      console.log(`🔍 [${requestId}] Error Response Body:`, responseText.substring(0, 1000))
    } catch (e) {
      console.log(`🔍 [${requestId}] Could not read error response body`, e)
    }
  }
}

export const printLogger = logger(customPrintFunc)

import { rootHomeRoutes } from '@/features/root/home/routes'
import { rootQaLogRoutes } from '@/features/root/qa-logs/routes'
import { rootQaRoutes } from '@/features/root/qas/routes'
import { APP_TITLE, DEFAULT_LOCALE, ROOT_URL } from '@/lib/constants'
import { handleApiError } from '@/lib/server/api-error-handle'
import { customLoggerMiddleware, printLogger } from '@/lib/server/middleware/logger'
import { createDefaultHook } from '@/lib/server/middleware/validation-hook'
import type { Bindings } from '@/type'
import { OpenAPIHono } from '@hono/zod-openapi'
import { apiReference } from '@scalar/hono-api-reference'
import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'
import { cors } from 'hono/cors'
import { csrf } from 'hono/csrf'
import { handle } from 'hono/vercel'
import type { Locale } from 'next-intl'

const isDevelopment = process.env.NODE_ENV === 'development'

const app = new OpenAPIHono<{ Variables: Bindings }>({
  defaultHook: createDefaultHook(),
})

// Middleware
app.use(printLogger)
app.use(customLoggerMiddleware)
app.use(csrf({ origin: ROOT_URL }))

app.onError(async (err: unknown, c: Context) => {
  const requestId = c.get('requestId') || 'unknown'
  const method = c.req.method
  const path = c.req.path

  console.error(`💥 UNHANDLED ERROR [${requestId}] ${method} ${path}:`)
  console.error('Error details:', err)

  if (err instanceof Error) {
    console.error('Error name:', err.name)
    console.error('Error message:', err.message)

    // Stack trace only in development
    if (isDevelopment) {
      console.error('Error stack:', err.stack)
    }
  }

  console.error('Request URL:', c.req.url)

  return handleApiError(err, c)
})

app.use(
  cors({
    origin: [ROOT_URL],
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests', 'Content-Type', 'Authorization'],
    allowMethods: [],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  }),
)

app.use(async (c, next) => {
  const locale = getCookie(c, 'NEXT_LOCALE') || DEFAULT_LOCALE
  if (locale) {
    c.set('locale', locale as Locale)
  }
  return next()
})

// OpenAPI documentation
app.doc31('/api/swagger.json', {
  openapi: '3.1.0',
  info: {
    title: APP_TITLE,
    version: '1.0.0',
    description: isDevelopment ? 'API with enhanced debugging for 400 errors' : 'Production API',
  },
})

app.get(
  '/api/scalar',
  apiReference({
    spec: {
      url: '/api/swagger.json',
    },
  }),
)

// Route registration
const rootRouter = app.route('/', rootHomeRoutes).route('/', rootQaRoutes).route('/', rootQaLogRoutes)

export const GET = handle(app)
export const POST = handle(app)
export const PATCH = handle(app)
export const DELETE = handle(app)

export type RootType = typeof rootRouter

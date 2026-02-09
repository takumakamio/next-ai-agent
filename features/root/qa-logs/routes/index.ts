import { OpenAPIHono } from '@hono/zod-openapi'
import type { Bindings } from 'hono/types'
import { getList } from './get-list'

export const rootQaLogRoutes = new OpenAPIHono<{
  Variables: Bindings
}>().route('/', getList)

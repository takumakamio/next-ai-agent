import { OpenAPIHono } from '@hono/zod-openapi'
import type { Bindings } from 'hono/types'
import { create } from './create'
import { deleteRoute } from './delete'
import { getId } from './get-id'
import { getList } from './get-list'
export const qaRoutes = new OpenAPIHono<{
  Variables: Bindings
}>()
  .route('/', getList)
  .route('/', getId)
  .route('/', create)
  .route('/', deleteRoute)

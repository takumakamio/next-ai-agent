import { OpenAPIHono } from '@hono/zod-openapi'
import type { Bindings } from 'hono/types'
import { conversationRoute } from './conversation'
import { sttRoute } from './stt'
import { ttsRoute } from './tts'

export const homeRoutes = new OpenAPIHono<{
  Variables: Bindings
}>()
  .route('/', conversationRoute)
  .route('/', sttRoute)
  .route('/', ttsRoute)

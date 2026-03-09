import { getQaLogsList } from '@/features/qa-logs/repositories'
import { selectQaLogSchema } from '@/features/qa-logs/schema'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(100),
  search: z.string().optional(),
})

const paginatedResponseSchema = z.object({
  data: selectQaLogSchema.array(),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export const getList = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'get',
    path: '/api/qa-logs',
    tags: ['Manage QaLog'],
    summary: 'Get qaLogs list with pagination and search',
    request: {
      query: querySchema,
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Not found',
      },
    },
  }),
  async (c) => {
    const locale = c.get('locale')
    const { page, limit, search } = c.req.valid('query')

    const result = await getQaLogsList({ locale, page, limit, search })

    return c.json(result, 200)
  },
)

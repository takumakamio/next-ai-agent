import { getQasList } from '@/features/qas/repositories'
import { selectQaSchema } from '@/features/qas/schema'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(100),
  search: z.string().optional(),
})

const paginatedResponseSchema = z.object({
  data: selectQaSchema.array(),
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
    path: '/api/qas',
    tags: ['Q&A 管理'],
    summary: 'Q&A 一覧取得（ページネーション・検索対応）',
    request: {
      query: querySchema,
    },
    responses: {
      200: {
        description: '取得成功',
        content: {
          'application/json': {
            schema: paginatedResponseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
      },
      404: {
        description: '見つかりません',
      },
    },
  }),
  async (c) => {
    const locale = c.get('locale')
    const { page, limit, search } = c.req.valid('query')

    const result = await getQasList({ locale, page, limit, search })

    return c.json(result, 200)
  },
)

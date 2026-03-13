import { deleteQa } from '@/features/qas/repositories'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export const deleteRoute = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'delete',
    path: '/api/qas/{id}',
    tags: ['Q&A 管理'],
    summary: 'Q&A の削除',
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'Q&A の削除に成功',
        content: {
          'application/json': {
            schema: responseSchema,
          },
        },
      },
      401: {
        description: '認証エラー',
      },
      404: {
        description: '見つかりません',
      },
      500: {
        description: 'サーバー内部エラー',
      },
    },
  }),
  async (c) => {
    try {
      const { id } = c.req.valid('param')
      const result = await deleteQa({ id })

      if (!result.success) {
        return c.json({ success: false, message: 'Q&A not found' }, 404)
      }

      return c.json({ success: true, message: 'Q&A deleted' })
    } catch (error) {
      console.error('Error deleting QA:', error)
      return c.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete Q&A',
        },
        500,
      )
    }
  },
)

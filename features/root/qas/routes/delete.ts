import { deleteQa } from '@/features/root/qas/repositories'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
})

export const deleteRoute = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'delete',
    path: '/api/root/qas/{id}',
    tags: ['Manage QA'],
    summary: 'Delete a Q&A',
    request: {
      params: z.object({
        id: z.string(),
      }),
    },
    responses: {
      200: {
        description: 'QA deleted successfully',
        content: {
          'application/json': {
            schema: responseSchema,
          },
        },
      },
      401: {
        description: 'Unauthorized',
      },
      404: {
        description: 'Not Found',
      },
      500: {
        description: 'Internal Server Error',
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

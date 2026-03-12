import { getQaById } from '@/features/qas/repositories'
import { selectQaSchema } from '@/features/qas/schema'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

export const getId = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'get',
    path: '/api/qas/{id}',
    tags: ['Manage qa'],
    summary: 'Get a single qa',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
      required: ['id'],
    },
    responses: {
      200: {
        description: 'Success',
        content: {
          'application/json': {
            schema: selectQaSchema,
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
    const { id } = c.req.param()
    const locale = c.get('locale')

    const data = await getQaById(id, locale)

    if (!data) {
      return c.json({ error: 'Not found' }, 404)
    }

    return c.json(data, 200)
  },
)

import { createQa, updateQa } from '@/features/root/qas/repositories'
import { insertQaSchema } from '@/features/root/qas/schema'
import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi'

const responseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  id: z.string().optional(),
  isNew: z.boolean().optional(),
})

export const create = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'post',
    path: '/api/root/qas',
    tags: ['Manage QA'],
    summary: 'Create or update a Q&A',
    request: {
      body: {
        content: {
          'application/json': {
            schema: insertQaSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'QA created/updated successfully',
        content: {
          'application/json': {
            schema: responseSchema,
          },
        },
      },
      400: {
        description: 'Bad Request',
      },
      401: {
        description: 'Unauthorized',
      },
      500: {
        description: 'Internal Server Error',
      },
    },
  }),
  async (c) => {
    try {
      const data = c.req.valid('json')

      if (data.id) {
        const result = await updateQa(data as Parameters<typeof updateQa>[0])
        return c.json({
          success: true,
          message: 'Q&A updated successfully',
          id: result.id,
          isNew: false,
        })
      } else {
        const result = await createQa(data as Parameters<typeof createQa>[0])
        return c.json({
          success: true,
          message: 'Q&A created successfully',
          id: result.id,
          isNew: true,
        })
      }
    } catch (error) {
      console.error('Error saving QA:', error)
      return c.json(
        {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to save Q&A',
        },
        500,
      )
    }
  },
)

import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

import type { TTSResult } from '@/lib/tts'
import { generateGeminiTTS } from '@/lib/tts'
import { z } from 'zod'

const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  avatar: z.string().optional().default('Tsumugi'),
})

const errorResponseSchema = z.object({
  error: z.string(),
})

function ttsResultToResponse(result: TTSResult): Response {
  return new Response(result.audioBuffer as unknown as BodyInit, {
    headers: {
      'Content-Type': result.contentType,
      'Content-Disposition': `inline; filename=${result.filename}`,
      'Content-Length': result.audioBuffer.length.toString(),
      'Cache-Control': 'no-cache',
      'X-TTS-Provider': result.provider,
      Visemes: JSON.stringify([]),
    },
  })
}

export const ttsRoute = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'get',
    path: '/api/home/tts',
    tags: ['AI 音声'],
    summary: 'テキストを音声に変換（TTS）',
    description: 'Gemini TTS を使ってテキストから音声を生成',
    request: {
      query: ttsRequestSchema,
    },
    responses: {
      200: {
        description: '音声の生成に成功',
        content: {
          'audio/mpeg': {
            schema: {
              type: 'string',
              format: 'binary',
            },
          },
        },
        headers: z.object({
          'Content-Type': z.string().default('audio/mpeg'),
          'Content-Disposition': z.string(),
          'Content-Length': z.string(),
          'Cache-Control': z.string().default('no-cache'),
          'X-TTS-Provider': z.string(),
          Visemes: z.string(),
        }),
      },
      500: {
        description: 'サーバーエラー',
        content: {
          'application/json': {
            schema: errorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { text, avatar } = c.req.valid('query')

    try {
      const result = await generateGeminiTTS(process.env, text, avatar)
      console.log('Successfully generated audio using Gemini')
      return ttsResultToResponse(result)
    } catch (error) {
      console.error('Gemini TTS failed:', error)
      return c.json({ error: 'Gemini TTS failed.' }, 500)
    }
  },
)

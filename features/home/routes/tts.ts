import type { Bindings } from '@/type'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

import type { TTSResult } from '@/lib/tts'
import { generateGeminiTTS, generateVoicevoxTTS } from '@/lib/tts'
import { z } from 'zod'

const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text is required'),
  avatar: z.string().optional().default('Tsumugi'),
  language: z.enum(['japanese', 'korean', 'chinese', 'english', 'spanish']).optional().default('japanese'),
  engine: z.enum(['auto', 'gemini', 'voicevox']).optional().default('auto'),
  speakerId: z.coerce.number().optional(),
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
    tags: ['AI Speech'],
    summary: 'Convert text to speech',
    description: 'Generate audio from text using Gemini or VOICEVOX TTS',
    request: {
      query: ttsRequestSchema,
    },
    responses: {
      200: {
        description: 'Successfully generated audio',
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
        description: 'Server error',
        content: {
          'application/json': {
            schema: errorResponseSchema,
          },
        },
      },
    },
  }),
  async (c) => {
    const { text, avatar, engine, speakerId } = c.req.valid('query')

    if (engine === 'voicevox') {
      try {
        const result = await generateVoicevoxTTS(text, speakerId)
        console.log('Successfully generated audio using VOICEVOX')
        return ttsResultToResponse(result)
      } catch (error) {
        console.error('VOICEVOX TTS failed:', error)
        return c.json({ error: 'VOICEVOX TTS failed. Is the engine running?' }, 500)
      }
    }

    if (engine === 'gemini') {
      try {
        const result = await generateGeminiTTS(process.env, text, avatar)
        console.log('Successfully generated audio using Gemini')
        return ttsResultToResponse(result)
      } catch (error) {
        console.error('Gemini TTS failed:', error)
        return c.json({ error: 'Gemini TTS failed.' }, 500)
      }
    }

    // engine === 'auto': Gemini → VOICEVOX fallback
    try {
      const result = await generateGeminiTTS(process.env, text, avatar)
      console.log('Successfully generated audio using Gemini')
      return ttsResultToResponse(result)
    } catch (error) {
      console.warn('Gemini TTS failed, falling back to VOICEVOX:', error)
    }

    try {
      const result = await generateVoicevoxTTS(text, speakerId)
      console.log('Successfully generated audio using VOICEVOX (fallback)')
      return ttsResultToResponse(result)
    } catch (error) {
      console.error('Both TTS providers failed:', error)
      return c.json(
        {
          error: 'Both TTS providers failed. Please try again later.',
        },
        500,
      )
    }
  },
)

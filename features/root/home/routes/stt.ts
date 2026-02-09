import type { Bindings } from '@/type'
import { GoogleGenAI } from '@google/genai'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

import { z } from 'zod'

const sttResponseSchema = z.object({
  text: z.string(),
})

const errorResponseSchema = z.object({
  error: z.string(),
})

export const sttRoute = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'post',
    path: '/api/root/home/stt',
    tags: ['AI Speech'],
    summary: 'Convert speech to text',
    description: 'Transcribe audio files to text using Gemini AI',
    request: {
      body: {
        content: {
          'multipart/form-data': {
            schema: z.object({
              audio: z.instanceof(File),
            }),
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successfully transcribed audio',
        content: {
          'application/json': {
            schema: sttResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request - no audio file provided',
        content: {
          'application/json': {
            schema: errorResponseSchema,
          },
        },
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
    try {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY === '') {
        return c.json({ error: 'Missing GOOGLE_GENERATIVE_AI_API_KEY' }, 500)
      }

      // Get the audio data from the request
      const formData = await c.req.formData()
      const audioFile = formData.get('audio') as File

      if (!audioFile) {
        return c.json({ error: 'No audio file provided' }, 400)
      }

      // Convert the file to base64
      const buffer = Buffer.from(await audioFile.arrayBuffer())
      const base64Audio = buffer.toString('base64')

      // Determine MIME type based on file type
      let mimeType = audioFile.type
      if (!mimeType || mimeType === 'application/octet-stream') {
        // Default to webm if type is not specified
        mimeType = 'audio/webm'
      }

      // Import and initialize Google Generative AI using @google/genai
      const ai = new GoogleGenAI({
        apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
      })

      console.log('Sending audio to Gemini for transcription...')

      // Generate content with audio using the new API
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Generate a transcript of the speech. Provide only the transcribed text without any additional commentary or formatting.',
              },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Audio,
                },
              },
            ],
          },
        ],
        config: {
          temperature: 0.1, // Lower temperature for more accurate transcription
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
      })

      const transcription = response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

      if (!transcription) {
        throw new Error('No transcription received from Gemini')
      }

      console.log('Successfully transcribed audio:', transcription)

      return c.json({ text: transcription }, 200)
    } catch (error) {
      console.error('Error transcribing audio with Gemini:', error)
      return c.json(
        {
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        },
        500,
      )
    }
  },
)

import { getDB } from '@/db'
import { qaLogs, qas } from '@/db/schema/_index'
import { generateEmbedding } from '@/lib/google-ai'
import type { Bindings } from '@/type'
import { GoogleGenAI } from '@google/genai'
import { OpenAPIHono, createRoute } from '@hono/zod-openapi'

import { desc, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'

const conversationExchangeSchema = z.object({
  user: z.string(),
  assistant: z.string(),
  timestamp: z.string().optional(),
})

const conversationRequestSchema = z.object({
  question: z.string().optional().default(''),
  history: z.array(conversationExchangeSchema).max(5).optional().default([]),
  locale: z.string().optional().default('ja'),
  chatSessionId: z.string().optional(),
  aiModel: z.enum(['gemini-2.5-flash', 'gemini-2.5-pro']).optional().default('gemini-2.5-flash'),
})

const qaSearchResultSchema = z.object({
  id: z.string(),
  question: z.string(),
  answer: z.string(),
  similarity: z.number(),
  category: z.string().nullable(),
  websiteLink: z.string().nullable().optional(),
})

const conversationResponseSchema = z.object({
  response: z.string(),
  title: z.string().optional(),
  description: z.string().optional(),
  relatedQAs: z
    .array(
      z.object({
        id: z.string(),
        question: z.string(),
        answer: z.string(),
        similarity: z.number(),
        category: z.string().nullable(),
        websiteLink: z.string().nullable().optional(),
      }),
    )
    .optional(),
  websiteLink: z.string().nullable().optional(),
  logId: z.string().optional(),
})

const errorResponseSchema = z.object({
  error: z.string(),
})

type ConversationExchange = z.infer<typeof conversationExchangeSchema>
type QASearchResult = z.infer<typeof qaSearchResultSchema>

export const conversationRoute = new OpenAPIHono<{ Variables: Bindings }>().openapi(
  createRoute({
    method: 'post',
    path: '/api/root/home/conversation',
    tags: ['AI Chat'],
    summary: 'Enhanced conversation with QA search',
    description: 'Natural conversations with QA search using vector embeddings',
    request: {
      body: {
        content: {
          'application/json': {
            schema: conversationRequestSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Successfully generated conversational response',
        content: {
          'application/json': {
            schema: conversationResponseSchema,
          },
        },
      },
      400: {
        description: 'Bad request',
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
    const startTime = Date.now()

    try {
      if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY === '') {
        return c.json(
          {
            error: 'Sorry, the service is currently unavailable.',
          },
          500,
        )
      }

      const { question, history, chatSessionId, aiModel } = c.req.valid('json')
      const requestLocale = c.get('locale')
      const limitedHistory = history.slice(-5)
      const relevantQAs = await searchRelevantQAs(question, requestLocale, 3)
      const languageName = '日本語'
      const baseSystemPrompt = `You are Tsumugi, a friendly engineering mentor AI. Focus on maintaining continuous conversation and provide natural, helpful responses based on previous conversation history.
Important instructions:
- Respond in ${languageName} language
- Refer to conversation history to provide consistent suggestions
- **CRITICAL: When QA reference information is provided, you MUST use the answer text from the QA as-is. Do NOT paraphrase, summarize, or interpret the QA answer. Copy the QA answer content directly into your response.**
- If the QA answer contains specific facts, code examples, commands, or technical details, include them exactly as written
- You may add a brief friendly greeting or closing, but the main content MUST come directly from the QA answer
- Do NOT add information that is not in the QA answer
- Do NOT omit important information from the QA answer
- Use a natural and friendly conversational tone
- Respond in plain text (do not use JSON or markdown formatting)
- Keep responses concise, within 300 characters
- If previous conversations mentioned certain topics, consider them in your response`

      const historyContext = limitedHistory.length > 0 ? buildConversationContext(limitedHistory) : ''
      const qaContext = relevantQAs.length > 0 ? buildQAContext(relevantQAs) : ''

      const userMessage = `Latest user question: "${question}"\n\n${qaContext ? 'IMPORTANT: Copy the QA answer text exactly as provided above. Add only a brief friendly greeting if appropriate. Do NOT change the answer content. ' : ''}Provide friendly and helpful engineering advice considering the previous conversation context.`

      const fullPrompt = `${baseSystemPrompt}${historyContext}${qaContext}\n\n${userMessage}`

      const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY })

      const response = await ai.models.generateContent({
        model: aiModel,
        contents: fullPrompt,
      })

      const text = response?.text?.trim()
      const responseTime = Date.now() - startTime

      if (!text) {
        return c.json({ error: 'Sorry, the service is currently unavailable.' }, 500)
      }

      // Log the QA interaction
      let logId: string | undefined
      try {
        logId = await logQAInteraction({
          chatSessionId: chatSessionId || '',
          userQuestion: question,
          aiAnswer: text,
          relevantQAs,
          requestLocale,
          responseTime,
        })
      } catch (logError) {
        console.error('Failed to log QA interaction:', logError)
      }

      const jsonResponse = {
        response: text,
        title: 'Answer',
        description: text,
        relatedQAs: relevantQAs.map((qa) => ({
          id: qa.id,
          question: qa.question,
          answer: qa.answer,
          similarity: Math.round(qa.similarity * 100) / 100,
          category: qa.category,
          websiteLink: qa.websiteLink,
        })),
        websiteLink: relevantQAs[0]?.websiteLink || null,
        logId,
      }

      console.log('Response generated:', {
        historyConsidered: limitedHistory.length > 0,
        qaResultsFound: relevantQAs.length,
        responseLength: text?.length,
        locale: requestLocale,
        responseTime,
        logId,
      })

      return c.json(jsonResponse, 200)
    } catch (error) {
      console.error('Error with enhanced conversation API:', error)

      const errorMessage = "I'm sorry, I'm having trouble responding right now. Please try again in a moment."

      return c.json({ error: errorMessage }, 500)
    }
  },
)

// Enhanced search function with QA vector search
async function searchRelevantQAs(question: string, locale: string, limit = 5): Promise<QASearchResult[]> {
  try {
    const db = getDB()

    const questionEmbedding = await generateEmbedding(question)

    if (questionEmbedding.length === 0) {
      console.log('Failed to generate embedding for question')
      return []
    }

    console.log(`Generated embedding for question: "${question}", length: ${questionEmbedding.length}`)

    const embeddingString = `[${questionEmbedding.join(',')}]`

    console.log('🔍 Executing vector search query...')

    let qaResults: Array<{
      id: string
      question: string | null
      answer: string | null
      category: string | null
      similarity: number
      websiteLink: string | null
    }>

    try {
      // Create a timeout promise that rejects after 30 seconds
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Vector search timeout after 30s')), 10000)
      })

      // Create the database query promise
      const queryPromise = db
        .select({
          id: qas.id,
          question: qas.question,
          answer: qas.answer,
          category: qas.category,
          similarity: sql<number>`1 - (${qas.embedding} <=> ${embeddingString}::vector)`,
          websiteLink: qas.websiteLink,
        })
        .from(qas)
        .where(sql`${qas.embedding} IS NOT NULL`)
        .orderBy(desc(sql<number>`1 - (${qas.embedding} <=> ${embeddingString}::vector)`))
        .limit(limit)

      // Race between query and timeout
      qaResults = await Promise.race([queryPromise, timeoutPromise])

      console.log(
        `✅ Vector search completed. Found ${qaResults.length} QAs for question: "${question}" qa results: ${JSON.stringify(qaResults)}`,
      )
    } catch (error) {
      console.error('❌ Vector search query failed:', error)

      // Log detailed error information
      if (error instanceof Error) {
        console.error('   Error name:', error.name)
        console.error('   Error message:', error.message)
        if (error.stack) {
          console.error('   Error stack:', error.stack.substring(0, 500))
        }
      }

      // Check if it's a database connection error
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
        console.error('⏰ Database query timeout detected')
      } else if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connection')) {
        console.error('🔌 Database connection error detected')
      } else if (errorMessage.includes('vector')) {
        console.error('📊 Vector extension error detected')
      }

      console.log('⚠️ Falling back to empty QA results - AI will respond without context')
      return []
    }

    const filteredQAs = qaResults.filter((qa) => qa.similarity > 0.65)

    if (filteredQAs.length === 0) {
      console.log('No QAs passed similarity threshold')
      return []
    }

    const results: QASearchResult[] = filteredQAs.map((qaResult) => ({
      id: qaResult.id,
      question: qaResult.question || '',
      answer: qaResult.answer || '',
      similarity: qaResult.similarity,
      category: qaResult.category,
      websiteLink: qaResult.websiteLink,
    }))

    results.forEach((qa, index) => {
      console.log(
        `QA ${index + 1}: similarity=${qa.similarity.toFixed(3)}, question="${qa.question?.substring(0, 50)}..."`,
      )
    })

    console.log(`After filtering (>0.65 similarity): ${results.length} QAs`)

    return results
  } catch (error) {
    console.error('Error searching QAs:', error)
    return []
  }
}

async function logQAInteraction({
  chatSessionId,
  userQuestion,
  aiAnswer,
  relevantQAs,
  requestLocale,
  responseTime,
}: {
  chatSessionId: string
  userQuestion: string
  aiAnswer: string
  relevantQAs: QASearchResult[]
  requestLocale: string
  responseTime: number
}): Promise<string> {
  const db = getDB()

  try {
    const questionEmbedding = await generateEmbedding(userQuestion)

    const bestQA = relevantQAs.length > 0 ? relevantQAs[0] : null

    const logData = {
      id: nanoid(),
      chatSessionId,
      userQuestion,
      userQuestionEmbedding: questionEmbedding.length > 0 ? questionEmbedding : null,
      aiAnswer,
      similarityScore: bestQA?.similarity || null,
      responseTime,
      embeddingModel: 'gemini-embedding-001',
      qaId: bestQA?.id || null,
    }

    const [insertedLog] = await db.insert(qaLogs).values(logData).returning({ id: qaLogs.id })

    console.log(`QA interaction logged with ID: ${insertedLog.id}`)
    return insertedLog.id
  } catch (error) {
    console.error('Error logging QA interaction:', error)
    throw error
  }
}

function buildConversationContext(history: ConversationExchange[]): string {
  if (history.length === 0) return ''

  const contextHeader = '\n\n🗣️ **Conversation History (for reference):**\n'

  const contextLines = history
    .map((exchange, index) => {
      return `${index + 1}. User: ${exchange.user.substring(0, 100)}${exchange.user.length > 100 ? '...' : ''}\n   Assistant: ${exchange.assistant.substring(0, 100)}${exchange.assistant.length > 100 ? '...' : ''}`
    })
    .join('\n\n')

  return contextHeader + contextLines
}

function buildQAContext(qas: QASearchResult[]): string {
  if (qas.length === 0) return ''

  const contextHeader = '\n\n📚 **MANDATORY: Use the following QA answer verbatim in your response:**\n'

  const contextLines = qas
    .map((qa, index) => {
      return `【QA ${index + 1} - Similarity: ${Math.round(qa.similarity * 100)}%】\nUser Question: ${qa.question}\n**USE THIS ANSWER EXACTLY**: ${qa.answer}\nCategory: ${qa.category || 'Other'}\n`
    })
    .join('\n')

  return (
    contextHeader +
    contextLines +
    '\n**⚠️ IMPORTANT: Your response MUST include the exact text from the "USE THIS ANSWER EXACTLY" section above. Do not paraphrase or summarize. You may add a brief greeting but the core answer must be copied verbatim.**'
  )
}

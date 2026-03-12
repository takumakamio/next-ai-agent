import { count, desc, getDB, ilike, or } from '@/db'
import { qaLogs, qas } from '@/db/schema/_index'
import { eq } from 'drizzle-orm'

export type GetQaLogsListOptions = {
  locale: string
  page: number
  limit: number
  search?: string
}

export type GetQaLogsListResult = {
  data: any[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function getQaLogsList(options: GetQaLogsListOptions): Promise<GetQaLogsListResult> {
  const db = getDB()
  const { locale, page, limit, search } = options
  const offset = (page - 1) * limit

  let total = 0
  let data: {
    id: string
    chatSessionId: string | null
    userQuestion: string
    aiAnswer: string | null
    similarityScore: number | null
    userRating: number | null
    responseTime: number | null
    qaId: string | null
    createdAt: Date
    updatedAt: Date | null
    qaQuestion: string | null
  }[] = []

  if (search) {
    const searchPattern = `%${search}%`

    const whereConditions = or(
      ilike(qaLogs.id, searchPattern),
      ilike(qaLogs.userQuestion, searchPattern),
      ilike(qaLogs.aiAnswer, searchPattern),
      ilike(qas.question, searchPattern),
    )

    const [countResult] = await db
      .select({ total: count() })
      .from(qaLogs)
      .leftJoin(qas, eq(qas.id, qaLogs.qaId))
      .where(whereConditions)
    total = countResult.total

    data = await db
      .select({
        id: qaLogs.id,
        chatSessionId: qaLogs.chatSessionId,
        userQuestion: qaLogs.userQuestion,
        aiAnswer: qaLogs.aiAnswer,
        similarityScore: qaLogs.similarityScore,
        userRating: qaLogs.userRating,
        responseTime: qaLogs.responseTime,
        qaId: qaLogs.qaId,
        createdAt: qaLogs.createdAt,
        updatedAt: qaLogs.updatedAt,
        qaQuestion: qas.question,
      })
      .from(qaLogs)
      .leftJoin(qas, eq(qas.id, qaLogs.qaId))
      .where(whereConditions)
      .orderBy(desc(qaLogs.createdAt))
      .limit(limit)
      .offset(offset)
  } else {
    const [countResult] = await db.select({ total: count() }).from(qaLogs)
    total = countResult.total

    data = await db
      .select({
        id: qaLogs.id,
        chatSessionId: qaLogs.chatSessionId,
        userQuestion: qaLogs.userQuestion,
        aiAnswer: qaLogs.aiAnswer,
        similarityScore: qaLogs.similarityScore,
        userRating: qaLogs.userRating,
        responseTime: qaLogs.responseTime,
        qaId: qaLogs.qaId,
        createdAt: qaLogs.createdAt,
        updatedAt: qaLogs.updatedAt,
        qaQuestion: qas.question,
      })
      .from(qaLogs)
      .leftJoin(qas, eq(qas.id, qaLogs.qaId))
      .orderBy(desc(qaLogs.createdAt))
      .limit(limit)
      .offset(offset)
  }

  const transformedData = data.map((qaLog) => {
    return {
      ...qaLog,
      deletedAt: null,
      userQuestionEmbedding: null,
      embeddingModel: null,
      qaQuestion: qaLog.qaQuestion || '',
    }
  })

  const totalPages = Math.ceil(total / limit)

  return {
    data: transformedData,
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
  }
}

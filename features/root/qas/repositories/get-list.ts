import { count, desc, getDB, ilike, or } from '@/db'
import { languages, qaTranslations, qas } from '@/db/schema/_index'
import { and, eq, inArray } from 'drizzle-orm'

export type GetQasListOptions = {
  locale: string
  page: number
  limit: number
  search?: string
}

export type GetQasListResult = {
  data: any[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export async function getQasList(options: GetQasListOptions): Promise<GetQasListResult> {
  const db = getDB()
  const { locale, page, limit, search } = options
  const offset = (page - 1) * limit

  const language = await db.query.languages.findFirst({
    where: eq(languages.code, locale),
  })

  if (!language) {
    return { data: [], meta: { page, limit, total: 0, totalPages: 0 } }
  }

  let total = 0
  let qasData: {
    id: string
    contentType: string
    category: string | null
    priority: number | null
    viewCount: number | null
    isActive: boolean | null
    createdAt: Date
    updatedAt: Date | null
    question: string | null
    answer: string | null
  }[] = []

  if (search) {
    const searchPattern = `%${search}%`

    const matchingQaIds = await db
      .selectDistinct({ qaId: qaTranslations.qaId })
      .from(qaTranslations)
      .where(or(ilike(qaTranslations.question, searchPattern), ilike(qaTranslations.answer, searchPattern)))

    const qaIdsFromTranslations = matchingQaIds.map((row) => row.qaId)

    const whereConditions =
      qaIdsFromTranslations.length > 0
        ? or(ilike(qas.id, searchPattern), inArray(qas.id, qaIdsFromTranslations))
        : ilike(qas.id, searchPattern)

    const [countResult] = await db.select({ total: count() }).from(qas).where(whereConditions)
    total = countResult.total

    qasData = await db
      .select({
        id: qas.id,
        contentType: qas.contentType,
        category: qas.category,
        priority: qas.priority,
        viewCount: qas.viewCount,
        isActive: qas.isActive,
        createdAt: qas.createdAt,
        updatedAt: qas.updatedAt,
        question: qaTranslations.question,
        answer: qaTranslations.answer,
      })
      .from(qas)
      .leftJoin(qaTranslations, and(eq(qaTranslations.qaId, qas.id), eq(qaTranslations.languageId, language.id)))
      .where(whereConditions)
      .orderBy(desc(qas.createdAt))
      .limit(limit)
      .offset(offset)
  } else {
    const [countResult] = await db.select({ total: count() }).from(qas)
    total = countResult.total

    qasData = await db
      .select({
        id: qas.id,
        contentType: qas.contentType,
        category: qas.category,
        priority: qas.priority,
        viewCount: qas.viewCount,
        isActive: qas.isActive,
        createdAt: qas.createdAt,
        updatedAt: qas.updatedAt,
        question: qaTranslations.question,
        answer: qaTranslations.answer,
      })
      .from(qas)
      .leftJoin(qaTranslations, and(eq(qaTranslations.qaId, qas.id), eq(qaTranslations.languageId, language.id)))
      .orderBy(desc(qas.createdAt))
      .limit(limit)
      .offset(offset)
  }

  const transformedData = qasData.map((qa) => ({
    ...qa,
    deletedAt: null,
    question: qa.question || '',
    answer: qa.answer || '',
  }))

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

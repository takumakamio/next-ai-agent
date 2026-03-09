import { count, desc, getDB, ilike, or } from '@/db'
import { qas } from '@/db/schema/_index'

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

  let total = 0
  let qasData: {
    id: string
    category: string | null
    createdAt: Date
    updatedAt: Date | null
    question: string | null
    answer: string | null
  }[] = []

  if (search) {
    const searchPattern = `%${search}%`

    const whereConditions = or(
      ilike(qas.id, searchPattern),
      ilike(qas.question, searchPattern),
      ilike(qas.answer, searchPattern),
    )

    const [countResult] = await db.select({ total: count() }).from(qas).where(whereConditions)
    total = countResult.total

    qasData = await db
      .select({
        id: qas.id,
        category: qas.category,
        createdAt: qas.createdAt,
        updatedAt: qas.updatedAt,
        question: qas.question,
        answer: qas.answer,
      })
      .from(qas)
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
        category: qas.category,
        createdAt: qas.createdAt,
        updatedAt: qas.updatedAt,
        question: qas.question,
        answer: qas.answer,
      })
      .from(qas)
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

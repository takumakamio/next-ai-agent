import { eq, getDB } from '@/db'
import { qas } from '@/db/schema/_index'

export async function getQaById(id: string, locale: string) {
  const db = getDB()

  const data = await db.query.qas.findFirst({
    where: eq(qas.id, id),
  })

  if (!data) {
    return null
  }

  return {
    ...data,
    question: data.question || '',
    answer: data.answer || '',
  }
}

import { asTranslations, eq, getDB, getTranslation } from '@/db'
import { qas } from '@/db/schema/_index'

export async function getQaById(id: string, locale: string) {
  const db = getDB()

  const data = await db.query.qas.findFirst({
    where: eq(qas.id, id),
    with: {
      ...asTranslations,
    },
  })

  if (!data) {
    return null
  }

  const qaTranslation = getTranslation(data)

  return {
    ...data,
    question: qaTranslation?.question || '',
    answer: qaTranslation?.answer || '',
  }
}

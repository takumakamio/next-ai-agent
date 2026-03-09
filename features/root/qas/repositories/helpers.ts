import { eq, getDB } from '@/db'
import { qaTranslations } from '@/db/schema/_index'
import type { InsertQa } from '@/features/root/qas/schema'
import { EMBEDDING_MODEL, generateEmbedding } from '@/lib/google-ai'

export async function handleQaTranslationsForCreate(qaId: string, qa: InsertQa): Promise<void> {
  const db = getDB()

  try {
    const embeddingText = `${qa.question} ${qa.answer}`
    const embedding = await generateEmbedding(embeddingText)

    await db.insert(qaTranslations).values({
      qaId,
      question: qa.question,
      answer: qa.answer,
      embedding,
      embeddingModel: EMBEDDING_MODEL,
    })

    console.log(`Translation created for QA ${qaId}`)
  } catch (error) {
    console.error('Error handling QA translations:', error)
    throw error
  }
}

export async function handleQaTranslationsForUpdate(
  qaId: string,
  qa: InsertQa,
  shouldTranslate: boolean,
): Promise<void> {
  const db = getDB()

  try {
    const existingTranslation = await db.query.qaTranslations.findFirst({
      where: (qt, { eq }) => eq(qt.qaId, qaId),
    })

    const embeddingText = `${qa.question} ${qa.answer}`
    const embedding = await generateEmbedding(embeddingText)

    if (existingTranslation) {
      await db
        .update(qaTranslations)
        .set({
          question: qa.question,
          answer: qa.answer,
          embedding,
          embeddingModel: EMBEDDING_MODEL,
        })
        .where(eq(qaTranslations.id, existingTranslation.id))
    } else {
      await db.insert(qaTranslations).values({
        qaId,
        question: qa.question,
        answer: qa.answer,
        embedding,
        embeddingModel: EMBEDDING_MODEL,
      })
    }

    console.log(`Translation updated for QA ${qaId}`)
  } catch (error) {
    console.error('Error handling QA translations:', error)
    throw error
  }
}

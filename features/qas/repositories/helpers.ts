import { eq, getDB } from '@/db'
import { qas } from '@/db/schema/_index'
import type { InsertQa } from '@/features/qas/schema'
import { EMBEDDING_MODEL, generateEmbedding } from '@/lib/google-ai'

export async function handleQaEmbeddingForCreate(qaId: string, qa: InsertQa): Promise<void> {
  const db = getDB()

  try {
    const embeddingText = `${qa.question} ${qa.answer}`
    const embedding = await generateEmbedding(embeddingText)

    await db
      .update(qas)
      .set({
        embedding,
        embeddingModel: EMBEDDING_MODEL,
      })
      .where(eq(qas.id, qaId))

    console.log(`Embedding created for QA ${qaId}`)
  } catch (error) {
    console.error('Error handling QA embedding:', error)
    throw error
  }
}

export async function handleQaEmbeddingForUpdate(qaId: string, qa: InsertQa): Promise<void> {
  const db = getDB()

  try {
    const embeddingText = `${qa.question} ${qa.answer}`
    const embedding = await generateEmbedding(embeddingText)

    await db
      .update(qas)
      .set({
        embedding,
        embeddingModel: EMBEDDING_MODEL,
      })
      .where(eq(qas.id, qaId))

    console.log(`Embedding updated for QA ${qaId}`)
  } catch (error) {
    console.error('Error handling QA embedding:', error)
    throw error
  }
}

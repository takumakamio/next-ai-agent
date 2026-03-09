import { eq, getDB } from '@/db'
import { qas } from '@/db/schema/_index'
import type { InsertQa } from '@/features/root/qas/schema'
import { handleRecordError } from '@/lib/server/handle-record-error'
import { handleQaEmbeddingForUpdate } from './helpers'

export type UpdateQaData = InsertQa & { id: string }

export type UpdateQaResult = {
  success: true
  id: string
}

export async function updateQa(qa: UpdateQaData): Promise<UpdateQaResult> {
  const db = getDB()

  const qaData = {
    category: qa.category || null,
    websiteLink: qa.websiteLink || null,
    question: qa.question,
    answer: qa.answer,
  }

  try {
    await db.update(qas).set(qaData).where(eq(qas.id, qa.id))

    await handleQaEmbeddingForUpdate(qa.id, qa)

    return {
      success: true,
      id: qa.id,
    }
  } catch (error) {
    await handleRecordError(error, {
      recordId: qa.id,
      uniqueId: qa.id,
      recordName: qa.question,
      recordType: 'qa',
      action: 'Update',
      additionalContext: {
        category: qa.category,
      },
    })
    throw error
  }
}

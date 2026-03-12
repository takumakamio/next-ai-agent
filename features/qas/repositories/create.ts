import { getDB } from '@/db'
import { qas } from '@/db/schema/_index'
import type { InsertQa } from '@/features/qas/schema'
import { handleRecordError } from '@/lib/server/handle-record-error'
import { nanoid } from 'nanoid'
import { handleQaEmbeddingForCreate } from './helpers'

export type CreateQaData = Omit<InsertQa, 'id'> & { id?: never }

export type CreateQaResult = {
  success: true
  id: string
}

export async function createQa(qa: CreateQaData): Promise<CreateQaResult> {
  const db = getDB()
  const uniqueId = nanoid()

  const qaData = {
    category: qa.category || null,
    websiteLink: qa.websiteLink || null,
    question: qa.question,
    answer: qa.answer,
  }

  try {
    const [newQa] = await db
      .insert(qas)
      .values({
        id: uniqueId,
        ...qaData,
      })
      .returning({ id: qas.id })

    await handleQaEmbeddingForCreate(newQa.id, qa)

    return {
      success: true,
      id: newQa.id,
    }
  } catch (error) {
    await handleRecordError(error, {
      recordId: uniqueId,
      uniqueId,
      recordName: qa.question,
      recordType: 'qa',
      action: 'Insert',
      additionalContext: {
        category: qa.category,
      },
    })
    throw error
  }
}

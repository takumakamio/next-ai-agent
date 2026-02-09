import { eq, getDB } from '@/db'
import { qas } from '@/db/schema/_index'
import type { InsertQa } from '@/features/root/qas/schema'
import { handleRecordError } from '@/lib/server/handle-record-error'
import { handleQaTranslationsForUpdate } from './helpers'

export type UpdateQaData = InsertQa & { id: string }

export type UpdateQaResult = {
  success: true
  id: string
}

export async function updateQa(qa: UpdateQaData): Promise<UpdateQaResult> {
  const db = getDB()

  const qaData = {
    contentType: qa.contentType,
    category: qa.category || null,
    priority: qa.priority || 1,
    isActive: qa.isActive ?? true,
    websiteLink: qa.websiteLink || null,
  }

  try {
    await db.update(qas).set(qaData).where(eq(qas.id, qa.id))

    const shouldTranslate = qa.shouldTranslate ?? false
    await handleQaTranslationsForUpdate(qa.id, qa, shouldTranslate)

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
        contentType: qa.contentType,
        category: qa.category,
      },
    })
    throw error
  }
}

import { eq, getDB } from '@/db'
import { qas } from '@/db/schema/_index'

export type DeleteQaOptions = {
  id: string
}

export type DeleteQaResult = { success: true } | { success: false; error: 'not_found' }

export async function qaExists(id: string): Promise<boolean> {
  const db = getDB()

  const qa = await db.query.qas.findFirst({
    where: eq(qas.id, id),
  })

  return !!qa
}

export async function deleteQa(options: DeleteQaOptions): Promise<DeleteQaResult> {
  const { id } = options
  const db = getDB()

  const exists = await qaExists(id)

  if (!exists) {
    return { success: false, error: 'not_found' }
  }

  await db.delete(qas).where(eq(qas.id, id))

  return { success: true }
}

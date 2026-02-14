import { type PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { cache } from 'react'
import * as schema from './schema/_index'

/**
 * 環境変数から DB 接続文字列を取得（遅延評価）
 */
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('Database URL is not set. Check DATABASE_URL environment variable.')
  }
  return url
}

/**
 * 通常のクエリ用 DB クライアント
 */
export const getDB = cache(() => {
  const client = postgres(getDatabaseUrl())
  return drizzle(client, { schema })
})

/**
 * トランザクションが必要な処理用
 *
 * @example
 * ```ts
 * const result = await withTransaction(async (tx) => {
 *   const [user] = await tx.insert(users).values({ name: 'Alice' }).returning()
 *   await tx.insert(orders).values({ userId: user.id, total: 100 })
 *   return user
 * })
 * ```
 */
export async function withTransaction<T>(callback: (tx: PostgresJsDatabase<typeof schema>) => Promise<T>): Promise<T> {
  const client = postgres(getDatabaseUrl(), { max: 1 })
  const db = drizzle(client, { schema })

  try {
    return await db.transaction(async (tx) => {
      return await callback(tx as unknown as PostgresJsDatabase<typeof schema>)
    })
  } finally {
    await client.end()
  }
}

export const asTranslations = {
  translations: {
    with: {
      language: true,
    },
  },
} as const

export const withTranslations = {
  with: {
    translations: {
      with: {
        language: true,
      },
    },
  },
} as const

export const getTranslation = <T extends { translations: Array<{ language: { code: string } } & Record<string, any>> }>(
  entity: T,
  locale: string,
): T['translations'][0] | null => {
  return entity.translations.find((t) => t.language.code === locale) || null
}

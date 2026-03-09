import { relations } from 'drizzle-orm'
import { index, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { timestamps } from '../utils'
import { qaLogs } from './qa-logs'

export const qas = pgTable(
  'qas',
  {
    id: varchar('id')
      .primaryKey()
      .notNull()
      .$defaultFn(() => nanoid())
      .unique(),

    category: varchar('category', { length: 100 }),
    // 'programming', 'architecture', 'devops', 'debugging', 'security', 'general'

    websiteLink: varchar('website_link', { length: 500 }),

    question: text('question'),
    answer: text('answer'),
    embedding: vector('embedding', { dimensions: 2000 }),
    embeddingModel: varchar('embedding_model', { length: 100 }).default('gemini-embedding-001'),

    ...timestamps,
  },
  (table) => [index('qas_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops'))],
)

export const qasRelations = relations(qas, ({ many }) => ({
  logs: many(qaLogs),
}))

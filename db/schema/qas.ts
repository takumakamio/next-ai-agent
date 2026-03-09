import { relations } from 'drizzle-orm'
import { boolean, index, integer, pgTable, serial, text, varchar, vector } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { timestamps } from '../utils'
import { qaLogs } from './qa-logs'

export const qas = pgTable('qas', {
  id: varchar('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid())
    .unique(),

  contentType: varchar('content_type', { length: 50 }).notNull(),
  // 'general', 'spot', 'plan'
  category: varchar('category', { length: 100 }),
  // 'programming', 'architecture', 'devops', 'debugging', 'security', 'general'

  priority: integer('priority').default(1),
  viewCount: integer('view_count').default(0),
  isActive: boolean('is_active').default(true),
  websiteLink: varchar('website_link', { length: 500 }),

  ...timestamps,
})

export const qasRelations = relations(qas, ({ many }) => ({
  logs: many(qaLogs),
  translations: many(qaTranslations),
}))

export const qaTranslations = pgTable(
  'qa_translations',
  {
    id: serial('id').primaryKey().notNull(),
    qaId: varchar('qa_id')
      .notNull()
      .references(() => qas.id, { onDelete: 'cascade' }),
    question: text('question'),
    answer: text('answer'),

    embedding: vector('embedding', { dimensions: 2000 }),
    embeddingModel: varchar('embedding_model', { length: 100 }).default('gemini-embedding-001'),

    ...timestamps,
  },
  (table) => [
    index('qa_translations_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
  ],
)

export const qaTranslationsRelations = relations(qaTranslations, ({ one }) => ({
  qa: one(qas, {
    fields: [qaTranslations.qaId],
    references: [qas.id],
  }),
}))

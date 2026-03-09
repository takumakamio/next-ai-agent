import { relations } from 'drizzle-orm'
import { doublePrecision, integer, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { timestamps } from '../utils'
import { qaTranslations, qas } from './qas'

export const qaLogs = pgTable('qa_logs', {
  id: varchar('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid())
    .unique(),

  chatSessionId: varchar('chat_session_id'),
  userQuestion: text('user_question').notNull(),
  userQuestionEmbedding: vector('user_question_embedding', { dimensions: 2000 }),
  aiAnswer: text('ai_answer'),
  similarityScore: doublePrecision('similarity_score'),

  userRating: integer('user_rating'),
  userFeedback: text('user_feedback'),

  responseTime: integer('response_time'),
  embeddingModel: varchar('embedding_model', { length: 100 }).default('gemini-embedding-001'),

  qaId: varchar('qa_id').references(() => qas.id, { onDelete: 'set null' }),
  qaTranslationId: integer('qa_translation_id').references(() => qaTranslations.id, { onDelete: 'set null' }),
  ...timestamps,
})

export const qaLogsRelations = relations(qaLogs, ({ one }) => ({
  qa: one(qas, {
    fields: [qaLogs.qaId],
    references: [qas.id],
  }),
  qaTranslation: one(qaTranslations, {
    fields: [qaLogs.qaTranslationId],
    references: [qaTranslations.id],
  }),
}))

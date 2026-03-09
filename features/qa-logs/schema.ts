// ============================================================================
// DATABASE SCHEMA REFERENCE
//
// This file uses the following database schemas. Column details below:
// ============================================================================

// QALOGS TABLE (qa_logs)
//
// id                   | varchar | required
// chatSessionId        | varchar | nullable
// userQuestion         | text | required
// userQuestionEmbedding | vector | nullable
// aiAnswer             | text | nullable
// similarityScore      | doublePrecision | nullable
// userRating           | integer | nullable
// userFeedback         | text | nullable
// responseTime         | integer | nullable
// embeddingModel       | varchar | nullable | default: 'gemini-embedding-001'
// qaId                 | varchar | nullable | references qas.id
//
// ============================================================================

import { qaLogs } from '@/db/schema/_index'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

// Date fields come as strings from JSON serialization
const dateSchema = z.union([z.date(), z.string()])

export const selectQaLogSchema = createSelectSchema(qaLogs).extend({
  createdAt: dateSchema,
  updatedAt: dateSchema.nullable(),
  deletedAt: dateSchema.nullable(),
  qaQuestion: z.string().optional(),
  qaId: z.string().nullable(),
})

export type SelectQaLog = z.infer<typeof selectQaLogSchema>

export const insertQaLogSchema = createInsertSchema(qaLogs)
export type InsertQaLog = z.infer<typeof insertQaLogSchema>

export const qaLogFeedbackSchema = z.object({
  logId: z.string().min(1, 'Log ID is required'),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  feedback: z.string().max(1000, 'Feedback must be 1000 characters or less').optional(),
})

export type QaLogFeedback = z.infer<typeof qaLogFeedbackSchema>

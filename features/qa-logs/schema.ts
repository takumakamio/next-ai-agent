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


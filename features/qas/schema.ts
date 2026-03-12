// ============================================================================
// DATABASE SCHEMA REFERENCE
//
// This file uses the following database schemas. Column details below:
// ============================================================================

// QAS TABLE (qas)
//
// id                   | varchar | required
// category             | varchar | nullable
// websiteLink          | varchar | nullable
// question             | text | nullable
// answer               | text | nullable
// embedding            | vector | nullable
// embeddingModel       | varchar | nullable | default: 'gemini-embedding-001'
//
//
// Relations:
// logs                 | has many qaLogs
//
// ============================================================================

import { qas } from '@/db/schema/_index'
import type { rpc } from '@/lib/rpc'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { InferResponseType } from 'hono/client'
import { z } from 'zod'

// Date fields come as strings from JSON serialization
const dateSchema = z.union([z.date(), z.string()])

const categories = ['programming', 'architecture', 'devops', 'debugging', 'security', 'general'] as const
const categoriesWithAll = ['all', ...categories] as const

export const selectQaSchema = createSelectSchema(qas).extend({
  createdAt: dateSchema,
  updatedAt: dateSchema.nullable(),
  deletedAt: dateSchema.nullable(),
  category: z.enum(categories),
  question: z.string().optional(),
  answer: z.string().optional(),
  embedding: z.array(z.number()).nullable().optional(),
  embeddingModel: z.string().nullable().optional(),
})

export const insertQaSchema = createInsertSchema(qas, {
  category: z.enum(categories),
}).extend({
  question: z.string({ required_error: 'Question is required' }).min(1).max(1000),
  answer: z.string({ required_error: 'Answer is required' }).min(1),
  locale: z.string(),
  websiteLink: z.string().url().optional().or(z.literal('')),
})

export type SelectQa = z.infer<typeof selectQaSchema>
export type InsertQa = z.infer<typeof insertQaSchema>

// RPC response type (JSON serialized - Date fields become string)
export type ApiQa = InferResponseType<typeof rpc.api.qas.$get, 200>['data'][number]

// Category metadata
export interface QaCategory {
  id: (typeof categoriesWithAll)[number]
  name: string
  color: string
}

export const QA_CATEGORIES: QaCategory[] = [
  { id: 'all', name: 'すべて', color: 'bg-gray-500' },
  { id: 'programming', name: 'プログラミング', color: 'bg-blue-500' },
  { id: 'architecture', name: 'アーキテクチャ', color: 'bg-green-500' },
  { id: 'devops', name: 'DevOps', color: 'bg-purple-500' },
  { id: 'debugging', name: 'デバッグ', color: 'bg-orange-500' },
  { id: 'security', name: 'セキュリティ', color: 'bg-pink-500' },
  { id: 'general', name: '一般情報', color: 'bg-indigo-500' },
]

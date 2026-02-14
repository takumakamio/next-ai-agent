// ============================================================================
// DATABASE SCHEMA REFERENCE
//
// This file uses the following database schemas. Column details below:
// ============================================================================

// QAS TABLE (qas)
//
// id                   | varchar | required
// contentType          | varchar | required
// category             | varchar | nullable
// priority             | integer | nullable | default: 1
// viewCount            | integer | nullable | default: 0
// isActive             | boolean | nullable | default: true
// websiteLink          | varchar | nullable
// question             | text | nullable | translatable
// answer               | text | nullable | translatable
// embedding            | vector | nullable | translatable
// embeddingModel       | varchar | nullable | translatable | default: 'gemini-embedding-001'
//
//
// Relations:
// logs                 | has many qaLogs
// impressions          | has many qasImpressions
//
// ============================================================================

import { qas } from '@/db/schema/_index'
import type { rpc } from '@/lib/rpc'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import type { InferResponseType } from 'hono/client'
import { z } from 'zod'

// Date fields come as strings from JSON serialization
const dateSchema = z.union([z.date(), z.string()])

const contentTypes = ['general'] as const
const categories = ['programming', 'architecture', 'devops', 'debugging', 'security', 'general'] as const
const categoriesWithAll = ['all', ...categories] as const

export const selectQaSchema = createSelectSchema(qas).extend({
  createdAt: dateSchema,
  updatedAt: dateSchema.nullable(),
  deletedAt: dateSchema.nullable(),
  contentType: z.enum(contentTypes),
  category: z.enum(categories),
  question: z.string().optional(),
  answer: z.string().optional(),
})

export const insertQaSchema = createInsertSchema(qas, {
  contentType: z.enum(contentTypes),
  category: z.enum(categories),
}).extend({
  question: z.string({ required_error: 'Question is required' }).min(1).max(1000),
  answer: z.string({ required_error: 'Answer is required' }).min(1),
  locale: z.string(),
  websiteLink: z.string().url().optional().or(z.literal('')),

  // Translation control - when true, translate to other languages on save
  shouldTranslate: z.boolean().optional(),
})

export type SelectQa = z.infer<typeof selectQaSchema>
export type InsertQa = z.infer<typeof insertQaSchema>

// RPC response type (JSON serialized - Date fields become string)
export type RootQa = InferResponseType<typeof rpc.api.root.qas.$get, 200>['data'][number]

// Category / ContentType metadata
export interface QaCategory {
  id: (typeof categoriesWithAll)[number]
  nameKey: string
  color: string
}

export interface QaContentType {
  id: (typeof contentTypes)[number]
  nameKey: string
}

export const QA_CATEGORIES: QaCategory[] = [
  { id: 'all', nameKey: 'All', color: 'bg-gray-500' },
  { id: 'programming', nameKey: 'Programming', color: 'bg-blue-500' },
  { id: 'architecture', nameKey: 'Architecture', color: 'bg-green-500' },
  { id: 'devops', nameKey: 'DevOps', color: 'bg-purple-500' },
  { id: 'debugging', nameKey: 'Debugging', color: 'bg-orange-500' },
  { id: 'security', nameKey: 'Security', color: 'bg-pink-500' },
  { id: 'general', nameKey: 'GeneralInfo', color: 'bg-indigo-500' },
]

export const QA_CONTENT_TYPES: QaContentType[] = [{ id: 'general', nameKey: 'General' }]

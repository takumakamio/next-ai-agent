import { relations } from 'drizzle-orm'
import { integer, pgTable, serial, text, uniqueIndex, varchar } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { timestamps } from '../utils'
import { languages } from './languages'

export const tags = pgTable('tags', {
  id: varchar('id')
    .primaryKey()
    .notNull()
    .$defaultFn(() => nanoid())
    .unique(),
  ...timestamps,
})

export const tagsRelations = relations(tags, ({ many }) => ({
  translations: many(tagTranslations),
}))

export const tagTranslations = pgTable(
  'tag_translations',
  {
    id: serial('id').primaryKey().notNull(),
    tagId: varchar('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
    languageId: integer('language_id')
      .notNull()
      .references(() => languages.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('tag_language_unique_idx').on(table.tagId, table.languageId)],
)

export const tagTranslationsRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, {
    fields: [tagTranslations.tagId],
    references: [tags.id],
  }),
  language: one(languages, {
    fields: [tagTranslations.languageId],
    references: [languages.id],
  }),
}))

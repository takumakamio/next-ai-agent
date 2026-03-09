import { relations } from 'drizzle-orm'
import { pgTable, serial, text, varchar } from 'drizzle-orm/pg-core'
import { nanoid } from 'nanoid'
import { timestamps } from '../utils'

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
    name: text('name').notNull(),
    ...timestamps,
  },
)

export const tagTranslationsRelations = relations(tagTranslations, ({ one }) => ({
  tag: one(tags, {
    fields: [tagTranslations.tagId],
    references: [tags.id],
  }),
}))

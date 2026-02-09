import { boolean, pgTable, serial, varchar } from 'drizzle-orm/pg-core'
import { timestamps } from '../utils'

export const languages = pgTable('languages', {
  id: serial('id').primaryKey().notNull(),
  code: varchar('code', { length: 10 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  isDefault: boolean('is_default').default(false),
  ...timestamps,
})

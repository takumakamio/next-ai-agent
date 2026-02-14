import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/_index'
import { seedLanguagesData } from './seeds/language'
import { seedQasData } from './seeds/qa'

config({ path: '.dev.vars' })

const databaseUrl = process.env.DATABASE_URL!

async function seed() {
  const client = postgres(databaseUrl)
  const db = drizzle(client, { schema })

  try {
    // 1. Seed languages
    console.log('Seeding languages...')
    const languageIds = await seedLanguagesData(db)
    console.log('Seeded languages')

    // 2. Seed Q&As with translations and embeddings
    console.log('Seeding Q&As with translations and embeddings...')
    await seedQasData(db, languageIds)
    console.log('Seeded Q&As with translations and embeddings')
  } catch (error) {
    console.error('❌ Seed process failed:', error)
    throw error
  } finally {
    await client.end()
  }
}

seed().catch((err) => {
  console.error('❌ Seed failed')
  console.error(err)
  process.exit(1)
})

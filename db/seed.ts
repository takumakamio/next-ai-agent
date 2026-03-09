import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/_index'
import { seedQasData } from './seeds/qa'

config({ path: '.dev.vars' })

const databaseUrl = process.env.DATABASE_URL!

async function seed() {
  const client = postgres(databaseUrl)
  const db = drizzle(client, { schema })

  try {
    console.log('Seeding Q&As with translations and embeddings...')
    await seedQasData(db)
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

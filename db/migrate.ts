import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

config({ path: '.dev.vars' })

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set')
}

async function runMigrate() {
  const sql = postgres(databaseUrl!, { max: 1 })

  // vector拡張がない場合は作成
  console.log('Ensuring vector extension exists...')
  await sql`CREATE EXTENSION IF NOT EXISTS vector`
  console.log('Vector extension is ready')

  const db = drizzle(sql)

  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: './db/migrations/dev' })
  console.log('Migrations completed successfully')

  await sql.end()
}

runMigrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})

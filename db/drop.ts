import fs from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

async function cleanupDatabase() {
  const databaseUrl = process.env.DATABASE_URL!
  const sql = postgres(databaseUrl)

  try {
    console.log('Connected to database, beginning comprehensive cleanup process...')

    // Step 1: Drop all tables
    const tables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `

    if (tables.length > 0) {
      const tableList = tables.map((t) => `"${t.tablename}"`).join(', ')
      await sql.unsafe(`DROP TABLE IF EXISTS ${tableList} CASCADE`)
      console.log(`Dropped ${tables.length} tables successfully`)
    } else {
      console.log('No tables found to drop in public schema')
    }

    // Step 2: Drop Drizzle migration tables specifically
    await sql.unsafe(`DROP TABLE IF EXISTS "_drizzle_migrations" CASCADE`)
    await sql.unsafe(`DROP TABLE IF EXISTS "__drizzle_migrations" CASCADE`)
    console.log('Dropped Drizzle migrations tables if they existed')

    // Step 3: Drop the drizzle schema if it exists
    await sql.unsafe(`DROP SCHEMA IF EXISTS "drizzle" CASCADE`)
    console.log('Dropped drizzle schema if it existed')

    // Step 4: Get and drop all custom types (like enums)
    const types = await sql`
      SELECT typname FROM pg_type t 
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public' 
      AND t.typtype = 'e'
    `

    if (types.length > 0) {
      for (const type of types) {
        await sql.unsafe(`DROP TYPE IF EXISTS "${type.typname}" CASCADE`)
      }
      console.log(`Dropped ${types.length} custom types successfully`)
    } else {
      console.log('No custom types found to drop')
    }

    // Final verification
    const remainingTables = await sql`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
    `

    const remainingTypes = await sql`
      SELECT typname FROM pg_type t 
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE n.nspname = 'public' 
      AND t.typtype = 'e'
    `

    const remainingSchemas = await sql`
      SELECT nspname FROM pg_catalog.pg_namespace 
      WHERE nspname = 'drizzle'
    `

    if (remainingSchemas.length > 0) {
      console.log('Warning: The drizzle schema still exists')
    }

    if (remainingTables.length === 0 && remainingTypes.length === 0 && remainingSchemas.length === 0) {
      console.log('Verification successful: All database objects have been removed')
    }

    console.log('Database cleanup completed successfully')
  } catch (error) {
    console.error('Error during database cleanup:', error)
  } finally {
    await sql.end()
    console.log('Database connection closed')
  }
}

async function deleteDrizzleFiles() {
  try {
    // Migration output directory matching drizzle.config.ts: out: './db/migrations/dev'
    const migrationsDir = path.join(process.cwd(), 'db', 'migrations', 'dev')

    if (fs.existsSync(migrationsDir)) {
      fs.rmSync(migrationsDir, { recursive: true, force: true })
      console.log('Deleted migration files from:', migrationsDir)
    } else {
      console.log('No migration files found at:', migrationsDir)
    }
  } catch (error) {
    console.error('Error deleting Drizzle files:', error)
  }
}

// Run both cleanup functions
async function runCleanup() {
  console.log('Starting complete database cleanup...')

  await cleanupDatabase()
  await deleteDrizzleFiles()

  console.log('Complete cleanup finished')
}

runCleanup()

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

    // Step 5: Revoke all privileges from public role
    await sql.unsafe(`
      DO $$
      BEGIN
        EXECUTE 'REVOKE ALL PRIVILEGES ON DATABASE ' || current_database() || ' FROM public';
        EXECUTE 'REVOKE ALL PRIVILEGES ON SCHEMA public FROM public';
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM public';
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM public';
        EXECUTE 'REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public FROM public';
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Error revoking privileges: %', SQLERRM;
      END $$;
    `)
    console.log('Revoked all privileges from public role')

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
    // Path to your drizzle directory - adjust this to your project structure
    const drizzleMigrationsDir = path.join(process.cwd(), 'drizzle')

    // Path to dev migrations directory from your error message
    const devMigrationsDir = path.join(process.cwd(), 'db', 'dev', 'drizzle')

    if (fs.existsSync(drizzleMigrationsDir)) {
      // Remove the entire drizzle directory
      fs.rmSync(drizzleMigrationsDir, { recursive: true, force: true })
      console.log('Deleted Drizzle migration files from:', drizzleMigrationsDir)
    } else {
      console.log('No Drizzle migration files found at:', drizzleMigrationsDir)
    }

    if (fs.existsSync(devMigrationsDir)) {
      // Remove the dev migrations directory
      fs.rmSync(devMigrationsDir, { recursive: true, force: true })
      console.log('Deleted Drizzle migration files from:', devMigrationsDir)
    } else {
      console.log('No Drizzle migration files found at:', devMigrationsDir)
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

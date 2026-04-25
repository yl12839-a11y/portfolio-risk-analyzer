import { neon } from '@neondatabase/serverless'

export const sql = neon(process.env.DATABASE_URL)

let schemaPromise = null

export function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0`
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS workouts INTEGER NOT NULL DEFAULT 0`
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0`
    })().catch((err) => {
      schemaPromise = null
      throw err
    })
  }
  return schemaPromise
}

import { neon } from '@neondatabase/serverless'

let cachedClient = null

function getClient() {
  if (cachedClient) return cachedClient
  const url = process.env.DATABASE_URL
  if (!url) {
    const candidateKeys = Object.keys(process.env)
      .filter((k) => /DATABASE|NEON|POSTGRES|PG|URL/i.test(k))
      .sort()
    throw new Error(
      `DATABASE_URL is not set on this deployment. Vercel env (${process.env.VERCEL_ENV || 'unknown'}) sees these candidate keys: [${candidateKeys.join(', ') || 'none'}]`
    )
  }
  try {
    cachedClient = neon(url)
  } catch (err) {
    throw new Error(`Failed to initialize database client: ${err.message}`)
  }
  return cachedClient
}

export const sql = new Proxy(function () {}, {
  apply(_target, _thisArg, args) {
    return getClient()(...args)
  },
  get(_target, prop) {
    const client = getClient()
    const value = client[prop]
    return typeof value === 'function' ? value.bind(client) : value
  },
})

let schemaPromise = null

export function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          )
        `
      } catch (err) {
        console.warn('ensureSchema CREATE TABLE skipped:', err.message)
      }
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0`
      } catch (err) {
        console.warn('ensureSchema ALTER points skipped:', err.message)
      }
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS workouts INTEGER NOT NULL DEFAULT 0`
      } catch (err) {
        console.warn('ensureSchema ALTER workouts skipped:', err.message)
      }
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS streak INTEGER NOT NULL DEFAULT 0`
      } catch (err) {
        console.warn('ensureSchema ALTER streak skipped:', err.message)
      }
    })()
  }
  return schemaPromise
}

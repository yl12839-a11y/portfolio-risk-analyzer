import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  const { name, username, password } = await request.json()

  // Basic validation
  if (!name || !username || !password) {
    return Response.json({ error: 'Please fill in all fields.' }, { status: 400 })
  }

  if (username.length < 3) {
    return Response.json({ error: 'Username must be at least 3 characters.' }, { status: 400 })
  }

  if (password.length < 6) {
    return Response.json({ error: 'Password must be at least 6 characters.' }, { status: 400 })
  }

  // Check if username is already taken
  const { rows: existing } = await sql`
    SELECT id FROM users WHERE username = ${username} LIMIT 1
  `

  if (existing.length > 0) {
    return Response.json({ error: 'Username already taken.' }, { status: 409 })
  }

  // Hash the password before saving — never store plain text passwords
  const passwordHash = await bcrypt.hash(password, 10)

  // Insert new user into the database with default stats
  await sql`
    INSERT INTO users (name, username, password_hash, points, level, streak, workouts)
    VALUES (${name}, ${username}, ${passwordHash}, 0, 1, 0, 0)
  `

  return Response.json({ success: true }, { status: 201 })
}
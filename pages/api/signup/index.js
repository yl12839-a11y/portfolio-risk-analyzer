import bcrypt from 'bcryptjs'
import { sql, ensureSchema } from '@/lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const { name, username, password } = req.body

  if (!name || !username || !password) {
    return res.status(400).json({ error: 'Please fill in all fields.' })
  }

  if (username.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' })
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  try {
    await ensureSchema()

    const existing = await sql`
      SELECT id FROM users WHERE username = ${username} LIMIT 1
    `

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Username already taken.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    await sql`
      INSERT INTO users (name, username, password_hash)
      VALUES (${name}, ${username}, ${passwordHash})
    `

    return res.status(201).json({ success: true })
  } catch (err) {
    console.error('signup error:', err)
    return res.status(500).json({ error: err.message || 'Server error.' })
  }
}
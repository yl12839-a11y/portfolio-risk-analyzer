import { neon } from '@neondatabase/serverless'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const session = await getServerSession(req, res, authOptions)

  if (!session) {
    return res.status(401).json({ error: 'Not logged in.' })
  }

  try {
    const rows = await sql`
      SELECT name, username, points, workouts, streak, created_at
      FROM users
      WHERE username = ${session.user.username}
      LIMIT 1
    `

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }

    return res.status(200).json(rows[0])
  } catch (err) {
    console.error('profile error:', err)
    return res.status(500).json({ error: err.message || 'Server error.' })
  }
}
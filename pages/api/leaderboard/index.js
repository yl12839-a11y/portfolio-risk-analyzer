import { neon } from '@neondatabase/serverless'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const sql = neon(process.env.DATABASE_URL)

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  try {
    const top = await sql`
      SELECT username, name, points, workouts,
        RANK() OVER (ORDER BY points DESC, username ASC) AS rank
      FROM users
      ORDER BY points DESC, username ASC
      LIMIT 25
    `

    let me = null
    const session = await getServerSession(req, res, authOptions)
    if (session?.user?.username) {
      const meRows = await sql`
        SELECT username, name, points, workouts,
          (SELECT COUNT(*) + 1 FROM users u2 WHERE u2.points > u1.points) AS rank
        FROM users u1
        WHERE username = ${session.user.username}
        LIMIT 1
      `
      me = meRows[0] || null
    }

    return res.status(200).json({ top, me })
  } catch (err) {
    console.error('leaderboard error:', err)
    return res.status(500).json({ error: err.message || 'Server error.' })
  }
}

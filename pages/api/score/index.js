import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql, ensureSchema } from '@/lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user?.username) {
    return res.status(401).json({ error: 'Not logged in.' })
  }

  const score = Number(req.body?.score)
  if (!Number.isFinite(score) || score < 0) {
    return res.status(400).json({ error: 'Invalid score.' })
  }

  const points = Math.floor(score)

  try {
    await ensureSchema()
    const rows = await sql`
      UPDATE users
      SET points = points + ${points},
          workouts = workouts + 1
      WHERE username = ${session.user.username}
      RETURNING points, workouts
    `
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' })
    }
    return res.status(200).json(rows[0])
  } catch (err) {
    console.error('score error:', err)
    return res.status(500).json({ error: err.message || 'Server error.' })
  }
}

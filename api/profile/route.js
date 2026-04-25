import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sql } from '@vercel/postgres'

export async function GET() {
  // Get the current logged-in user from the session
  const session = await getServerSession(authOptions)

  if (!session) {
    return Response.json({ error: 'Not logged in.' }, { status: 401 })
  }

  // Fetch that user's data from the database
  const { rows } = await sql`
    SELECT name, username, points, workouts, streak, created_at
    FROM users
    WHERE username = ${session.user.username}
    LIMIT 1
  `

  if (rows.length === 0) {
    return Response.json({ error: 'User not found.' }, { status: 404 })
  }

  return Response.json(rows[0])
}
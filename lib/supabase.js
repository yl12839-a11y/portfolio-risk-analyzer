import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { sql } from '@vercel/postgres'
import bcrypt from 'bcryptjs'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        // Look up user in Vercel Postgres by username
        const { rows } = await sql`
          SELECT * FROM users
          WHERE username = ${credentials.username}
          LIMIT 1
        `

        const user = rows[0]
        if (!user) return null

        // Compare the submitted password against the hashed one in the database
        const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash)
        if (!passwordMatch) return null

        return {
          id: user.id,
          username: user.username,
          name: user.name,
        }
      },
    }),
  ],

  callbacks: {
    // Add username to the session so any page can access it
    async session({ session, token }) {
      session.user.id = token.id
      session.user.username = token.username
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = user.username
      }
      return token
    },
  },

  pages: {
    signIn: '/login',   // redirect here if not logged in
  },

  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
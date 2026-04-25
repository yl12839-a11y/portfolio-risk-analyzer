import CredentialsProviderImport from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { sql, ensureSchema } from '@/lib/db'

// next-auth ships providers as CJS with `exports.default = ...`; some Next/webpack
// builds hand back the whole module namespace instead of unwrapping `.default`,
// causing "is not a function" on the call below. Unwrap defensively.
const CredentialsProvider = CredentialsProviderImport.default ?? CredentialsProviderImport

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

        try {
          await ensureSchema()
          const rows = await sql`
            SELECT * FROM users
            WHERE username = ${credentials.username}
            LIMIT 1
          `

          const user = rows[0]
          if (!user || !user.password_hash) return null

          const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash)
          if (!passwordMatch) return null

          return { id: user.id, username: user.username, name: user.name }
        } catch (err) {
          console.error('authorize error:', err)
          return null
        }
      },
    }),
  ],
  callbacks: {
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
    signIn: '/base_profile/login/login_page',
  },
  secret: process.env.NEXTAUTH_SECRET,
}
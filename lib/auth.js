import CredentialsProviderImport from 'next-auth/providers/credentials'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

// next-auth ships providers as CJS with `exports.default = ...`; some Next/webpack
// builds hand back the whole module namespace instead of unwrapping `.default`,
// causing "is not a function" on the call below. Unwrap defensively.
const CredentialsProvider = CredentialsProviderImport.default ?? CredentialsProviderImport

const sql = neon(process.env.DATABASE_URL)

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

        const rows = await sql`
          SELECT * FROM users
          WHERE username = ${credentials.username}
          LIMIT 1
        `

        const user = rows[0]
        if (!user) return null

        const passwordMatch = await bcrypt.compare(credentials.password, user.password_hash)
        if (!passwordMatch) return null

        return { id: user.id, username: user.username, name: user.name }
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
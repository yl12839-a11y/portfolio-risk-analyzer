import NextAuthImport from 'next-auth'
import { authOptions } from '@/lib/auth'

const NextAuth = NextAuthImport.default ?? NextAuthImport

export default NextAuth(authOptions)

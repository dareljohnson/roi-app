import { PrismaAdapter } from '@next-auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import type { NextAuthOptions } from 'next-auth'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import type { NextApiRequest } from 'next'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })

        if (!user?.hashedPassword) return null
        if (user.active === false) {
          // User is deactivated, do not allow login
          // NextAuth expects an Error to be thrown for custom error messages
          const err: any = new Error('Your account has been deactivated. Please contact support if you believe this is a mistake.')
          err.code = 'deactivated';
          throw err;
        }
        const valid = await bcrypt.compare(credentials.password, user.hashedPassword)
        if (!valid) return null

        // Get IP address from request headers (works for both API and edge)
        let ip = null
        if (req && req.headers) {
          const forwarded = req.headers['x-forwarded-for']
          const realIp = req.headers['x-real-ip']
          if (typeof forwarded === 'string') {
            ip = forwarded.split(',')[0]
          } else if (Array.isArray(forwarded)) {
            ip = forwarded[0]
          } else if (typeof realIp === 'string') {
            ip = realIp
          }
        }
        await prisma.user.update({
          where: { id: user.id },
          data: {
            lastLogin: new Date(),
            lastIp: ip ?? null,
          },
        })
        return { id: user.id, name: user.name ?? null, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.role = (user as any).role || 'USER'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
}

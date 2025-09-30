import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { randomBytes } from 'crypto'
import { sendPasswordResetEmail } from '@/lib/mailer'
import { recordApiCall } from '@/lib/adminInsights'

export async function POST(req: NextRequest) {
  const start = Date.now()
  let status = 200
  try {
    const { email } = await req.json()
    if (!email) {
      status = 400
      return NextResponse.json({ success: false, error: 'Email is required' }, { status })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    // To prevent user enumeration, always respond success, but only create token if user exists
    if (user) {
      // Basic rate limit per email: reuse last unexpired token if recently requested (< 60s ago)
      const now = new Date()
      const recent = await prisma.verificationToken.findFirst({
        where: { identifier: email, expires: { gt: now } },
        orderBy: { expires: 'desc' },
      })
      // Issue a fresh token unless we just issued one in the last 60 seconds
      const lastIssuedWithinSeconds = 60
      let token: string
      let expires: Date
      const ttlMinutes = parseInt(process.env.PASSWORD_RESET_TTL_MIN || '60', 10)
      const ttlMs = ttlMinutes * 60 * 1000
      if (recent && Date.now() + ttlMs - recent.expires.getTime() < (ttlMs - lastIssuedWithinSeconds * 1000)) {
        token = recent.token
        expires = recent.expires
      } else {
        token = randomBytes(32).toString('hex')
        expires = new Date(Date.now() + ttlMs)
        await prisma.verificationToken.create({ data: { identifier: email, token, expires } })
      }
      // Store token
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      })

      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`
      try {
        await sendPasswordResetEmail({ to: email, resetUrl })
      } catch (e) {
        // Fallback to console log in dev
        console.log('Password reset link:', resetUrl)
      }
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    status = 500
    console.error('Forgot password error', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status })
  } finally {
    recordApiCall(req, status, Date.now() - start)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import { recordApiCall } from '@/lib/adminInsights'

export async function POST(req: NextRequest) {
  const start = Date.now()
  let status = 200
  try {
    const { token, email, newPassword } = await req.json()
    if (!token || !email || !newPassword) {
      status = 400
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status })
    }
    if (newPassword.length < 8) {
      status = 400
      return NextResponse.json({ success: false, error: 'Password too short' }, { status })
    }
    const record = await prisma.verificationToken.findUnique({ where: { token } })
    if (!record || record.identifier !== email || record.expires < new Date()) {
      status = 400
      return NextResponse.json({ success: false, error: 'Invalid or expired token' }, { status })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      status = 404
      return NextResponse.json({ success: false, error: 'User not found' }, { status })
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } })
    // Clean up token(s) for this identifier
    await prisma.verificationToken.deleteMany({ where: { identifier: email } })
    return NextResponse.json({ success: true })
  } catch (e) {
    status = 500
    console.error('Reset password error', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status })
  } finally {
    recordApiCall(req, status, Date.now() - start)
  }
}

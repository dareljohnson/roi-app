import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import { recordApiCall } from '@/lib/adminInsights'

export async function POST(req: NextRequest) {
  const start = Date.now()
  let status = 200
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      status = 401
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status })
    }
    const { currentPassword, newPassword } = await req.json()
    if (!currentPassword || !newPassword) {
      status = 400
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status })
    }
    const user = await prisma.user.findUnique({ where: { id: (session.user as any).id } })
    if (!user) {
      status = 404
      return NextResponse.json({ success: false, error: 'User not found' }, { status })
    }
    const valid = await bcrypt.compare(currentPassword, user.hashedPassword)
    if (!valid) {
      status = 400
      return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status })
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { hashedPassword } })
    return NextResponse.json({ success: true })
  } catch (e) {
    status = 500
    console.error('Change password error', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status })
  } finally {
    recordApiCall(req, status, Date.now() - start)
  }
}

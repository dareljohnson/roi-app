import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import bcrypt from 'bcryptjs'
import { recordApiCall } from '@/lib/adminInsights'

export async function POST(req: NextRequest) {
  const start = Date.now();
  let status = 200;
  try {
    const body = await req.json()
    const { name, email, password } = body
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'Email already registered' }, { status: 409 })
    }
    const hashedPassword = await bcrypt.hash(password, 10)
  const role = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL ? 'ADMIN' : 'USER'
  const user = await prisma.user.create({ data: { name, email, hashedPassword, role } })
    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (e) {
    status = 500;
    console.error('Register error', e)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  } finally {
    recordApiCall(req, status, Date.now() - start);
  }
}

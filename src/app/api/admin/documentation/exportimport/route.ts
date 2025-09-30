import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: NextRequest) {
  // Export all documentation entries as JSON
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const docs = await prisma.documentationEntry.findMany();
  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  // Import documentation entries from JSON
  const session = await getServerSession(authOptions);
  if (!session || !session.user || (session.user as any).role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const data = await req.json();
  if (!Array.isArray(data)) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }
  // Optionally: clear all existing entries first
  await prisma.documentationEntry.deleteMany();
  // Bulk create
  await prisma.documentationEntry.createMany({ data });
  return NextResponse.json({ success: true });
}

import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: List all documentation entries
export async function GET() {
  const entries = await prisma.documentationEntry.findMany({
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
  return NextResponse.json(entries);
}

// POST: Create a new documentation entry
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || !user || user.role !== 'ADMIN' || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { title, content, tags } = await req.json();
  const entry = await prisma.documentationEntry.create({
    data: {
      title,
      content,
      tags,
      author: { connect: { email: user.email } },
    },
  });
  return NextResponse.json(entry);
}

// PATCH: Edit a documentation entry
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || !user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { id, title, content, tags } = await req.json();
  // Convert tags array to comma-separated string if needed
  let tagsString = tags;
  if (Array.isArray(tags)) {
    tagsString = tags.join(',');
  }
  const entry = await prisma.documentationEntry.update({
    where: { id },
    data: { title, content, tags: tagsString },
  });
  // Return tags as array for frontend consistency
  const result = {
    ...entry,
    tags: typeof entry.tags === 'string' ? entry.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
  };
  return NextResponse.json(result);
}

// DELETE: Delete a documentation entry
import type { NextRequest } from 'next/server';
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || !user || user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const id = params?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });
  }
  try {
    await prisma.documentationEntry.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 500 });
  }
}

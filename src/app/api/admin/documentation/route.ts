import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET: List all documentation entries

// GET: List documentation entries with pagination
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let limit = parseInt(searchParams.get('limit') || '10', 10);
  let offset = parseInt(searchParams.get('offset') || '0', 10);
  if (!Number.isFinite(limit) || limit < 1) limit = 10;
  if (!Number.isFinite(offset) || offset < 0) offset = 0;

  const tag = searchParams.get('tag');
  // Filtering condition for tag
  let where = {};
  if (tag) {
    // tags is a comma-separated string, so use contains with commas or at start/end
    where = {
      OR: [
        { tags: { equals: tag } },
        { tags: { startsWith: tag + ',' } },
        { tags: { endsWith: ',' + tag } },
        { tags: { contains: ',' + tag + ',' } },
      ],
    };
  }

  // Get total count for pagination (with filter)
  const total = await prisma.documentationEntry.count({ where });
  const entriesRaw = await prisma.documentationEntry.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { id: true, name: true, email: true } } },
    skip: offset,
    take: limit,
  });
  // Always return tags as array
  const entries = entriesRaw.map((e: any) => ({
    ...e,
    tags: typeof e.tags === 'string' ? e.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
  }));
  return NextResponse.json({
    entries,
    total,
    limit,
    offset,
  });
}

// POST: Create a new documentation entry
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || !user || user.role !== 'ADMIN' || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { title, content, tags } = await req.json();
  // Store tags as comma-separated string
  const entry = await prisma.documentationEntry.create({
    data: {
      title,
      content,
      tags: Array.isArray(tags) ? tags.join(',') : (tags || ''),
      author: { connect: { email: user.email } },
    },
  });
  // Return tags as array
  const result = {
    ...entry,
    tags: typeof entry.tags === 'string' ? entry.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
  };
  return NextResponse.json(result);
}

// PATCH and DELETE are handled in /api/admin/documentation/[id]/route.ts

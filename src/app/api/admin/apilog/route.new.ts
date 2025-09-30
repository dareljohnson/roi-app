import { NextResponse } from "next/server";
import { prisma } from "@/lib/database";

// Fetch API call logs from the database, with optional filtering
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || undefined;
  const since = searchParams.get("since") ? Number(searchParams.get("since")) : undefined;

  // Build Prisma query
  const where: any = {};
  if (endpoint) where.endpoint = endpoint;
  if (since) where.ts = { gte: since };

  const log = await prisma.apiCallLog.findMany({
    where,
    orderBy: { ts: "desc" },
    take: 500, // limit for dashboard
  });

  return NextResponse.json({ log });
}

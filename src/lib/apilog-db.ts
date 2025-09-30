import { prisma } from "@/lib/database";

// Helper for fetching API call logs from the database (testable)
export async function fetchApiCallLog({ endpoint, since }: { endpoint?: string; since?: number } = {}) {
  const where: any = {};
  if (endpoint) where.endpoint = endpoint;
  if (since) where.ts = { gte: since };
  return prisma.apiCallLog.findMany({
    where,
    orderBy: { ts: "desc" },
    take: 500,
  });
}

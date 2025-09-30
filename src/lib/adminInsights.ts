import { NextRequest } from "next/server";
import { prisma } from "@/lib/database";

// In-memory stats (for demo; use persistent store in production)
let apiStats = {
  total: 0,
  errors: 0,
  last24h: 0,
  calls: [] as { ts: number; error: boolean }[],
};



export async function middleware(req: NextRequest) {
  // Only track API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    apiStats.total++;
    const now = Date.now();
    // Remove calls older than 24h
    apiStats.calls = apiStats.calls.filter((c) => now - c.ts < 24 * 60 * 60 * 1000);
    // Add new call (assume error if response status >= 400)
    // We'll update error count in the API handler
    apiStats.calls.push({ ts: now, error: false });
    apiStats.last24h = apiStats.calls.length;
  }
}

export function recordApiError() {
  apiStats.errors++;
  if (apiStats.calls.length > 0) {
    apiStats.calls[apiStats.calls.length - 1].error = true;
  }
}


export function recordApiCall(req: any, resStatus: number = 200, responseTime: number = 0) {
  const now = new Date();
  apiStats.total++;
  apiStats.calls = apiStats.calls.filter((c) => now.getTime() - c.ts < 24 * 60 * 60 * 1000);
  apiStats.calls.push({ ts: now.getTime(), error: resStatus >= 400 });
  apiStats.last24h = apiStats.calls.length;
  // Persistent log: write to database if model exists
  if (prisma && typeof prisma.apiCallLog?.create === 'function') {
    prisma.apiCallLog.create({
      data: {
        ts: now,
        endpoint: req?.nextUrl?.pathname || req?.url || '',
        method: req?.method || '',
        status: resStatus,
        responseTime,
        error: resStatus >= 400,
      },
    }).catch((e: any) => {
      // eslint-disable-next-line no-console
      console.error('Failed to persist API call log:', e);
    });
  }
}


// Persistent version: aggregate from ApiCallLog table
export async function getApiStats() {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [total, errors, last24h] = await Promise.all([
    prisma.apiCallLog.count(),
    prisma.apiCallLog.count({ where: { error: true } }),
    prisma.apiCallLog.count({ where: { ts: { gte: since } } }),
  ]);
  return { total, errors, last24h };
}

// Persistent version: aggregate from ApiCallLog table
export async function getApiTimeSeries(intervalMinutes = 60, points = 24) {
  const now = Date.now();
  const msPerInterval = intervalMinutes * 60 * 1000;
  const since = new Date(now - points * msPerInterval);
  // Fetch all logs in the window
  const logs = await prisma.apiCallLog.findMany({
    where: { ts: { gte: since } },
    orderBy: { ts: "asc" },
  });
  // Bucketize
  const buckets = Array(points)
    .fill(0)
    .map((_, i) => ({
      time: new Date(now - (points - 1 - i) * msPerInterval),
      total: 0,
      errors: 0,
    }));
  logs.forEach((log: { ts: Date | string; error: boolean }) => {
    const ts = typeof log.ts === "string" ? new Date(log.ts).getTime() : log.ts.getTime();
    const bucketIndex = Math.floor((now - ts) / msPerInterval);
    if (bucketIndex >= 0 && bucketIndex < points) {
      buckets[points - 1 - bucketIndex].total++;
      if (log.error) buckets[points - 1 - bucketIndex].errors++;
    }
  });
  return buckets;
}

// Deprecated: in-memory log removed. Use persistent log via database.
// export function getApiCallLog({ endpoint, since }: { endpoint?: string; since?: number } = {}) {
//   return apiCallLog.filter(log =>
//     (!endpoint || log.endpoint === endpoint) &&
//     (!since || log.ts >= since)
//   );
// }

import { NextResponse } from "next/server";
import { getApiStats, getApiTimeSeries, recordApiCall } from "@/lib/adminInsights";
import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  recordApiCall(request);
  // Only allow admin (in production, check session/role)
  const [stats, timeSeries] = await Promise.all([
    getApiStats(),
    getApiTimeSeries(60, 24),
  ]);
  return NextResponse.json({
    ...stats,
    timeSeries,
  });
}

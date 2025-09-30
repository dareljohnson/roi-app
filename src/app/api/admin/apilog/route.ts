
import { NextResponse } from "next/server";


import { fetchApiCallLog } from "@/lib/apilog-db";
import { recordApiCall } from "@/lib/adminInsights";

// Next.js API route handler (should not be imported in tests)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get("endpoint") || undefined;
  const since = searchParams.get("since") ? Number(searchParams.get("since")) : undefined;
  const log = await fetchApiCallLog({ endpoint, since });
  // Log this API call for audit/debugging (status 200, no responseTime measured)
  recordApiCall(request, 200);
  return NextResponse.json({ log });
}

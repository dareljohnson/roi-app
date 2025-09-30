import { NextResponse } from "next/server";

// In-memory log (for demo; use persistent store in production)
let logs: string[] = [];

// Internal helper (cannot be exported in a route module because Next.js only allows HTTP method exports & select config)
function logToConsole(line: string) {
  logs.push(`[${new Date().toISOString()}] ${line}`);
  if (logs.length > 200) logs.shift();
}

export async function GET() {
  // Only allow admin (in production, check session/role)
  return NextResponse.json({ logs });
}

// (Optional) Future: implement POST to append new log lines externally
// export async function POST(req: Request) {
//   const { line } = await req.json();
//   if (typeof line === 'string' && line.trim()) logToConsole(line.trim());
//   return NextResponse.json({ ok: true });
// }

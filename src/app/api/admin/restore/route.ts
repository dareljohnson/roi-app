import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/database';
import { recordApiCall } from '@/lib/adminInsights';

// Simple CSV parser: assumes first row is header, comma separator, no quoted commas
function parseCSV(csv: string): any[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj: any = {};
    headers.forEach((h, i) => {
      let v = values[i]?.trim();
      // Try to parse JSON values (numbers, null, booleans)
      try { v = JSON.parse(v); } catch {}
      obj[h] = v;
    });
    return obj;
  });
}

// Helper: Restore from CSV export
async function restoreFromCsv(csvExport: Record<string, string>) {
  if (csvExport.users) await prisma.user.createMany({ data: parseCSV(csvExport.users) });
  if (csvExport.properties) await prisma.property.createMany({ data: parseCSV(csvExport.properties) });
  if (csvExport.analyses) await prisma.analysis.createMany({ data: parseCSV(csvExport.analyses) });
  if (csvExport.accounts) await prisma.account.createMany({ data: parseCSV(csvExport.accounts) });
  if (csvExport.sessions) await prisma.session.createMany({ data: parseCSV(csvExport.sessions) });
  if (csvExport.verification_tokens) await prisma.verificationToken.createMany({ data: parseCSV(csvExport.verification_tokens) });
}

// Helper: Clear all tables (order matters for FKs)
async function clearAllTables() {
  await prisma.verificationToken.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.account.deleteMany({});
  await prisma.analysis.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.user.deleteMany({});
}

// Helper: Restore from JSON export
async function restoreFromJson(jsonExport: Record<string, any[]>) {
  // Insert in order: users, properties, analyses, accounts, sessions, verification_tokens
  if (jsonExport.users) await prisma.user.createMany({ data: jsonExport.users });
  if (jsonExport.properties) await prisma.property.createMany({ data: jsonExport.properties });
  if (jsonExport.analyses) await prisma.analysis.createMany({ data: jsonExport.analyses });
  if (jsonExport.accounts) await prisma.account.createMany({ data: jsonExport.accounts });
  if (jsonExport.sessions) await prisma.session.createMany({ data: jsonExport.sessions });
  if (jsonExport.verification_tokens) await prisma.verificationToken.createMany({ data: jsonExport.verification_tokens });
}

export async function POST(req: NextRequest) {
  const start = Date.now();
  let status = 200;
  let session = null;
  try {
    session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== 'ADMIN') {
      status = 401;
      return NextResponse.json({ error: 'Unauthorized' }, { status });
    }

    const contentType = req.headers.get('content-type') || '';
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
    }

    // Accept either jsonExport or csvExport
    if (body.jsonExport && typeof body.jsonExport === 'object') {
      await clearAllTables();
      await restoreFromJson(body.jsonExport);
      return NextResponse.json({ ok: true, mode: 'json' });
    } else if (body.csvExport && typeof body.csvExport === 'object') {
      await clearAllTables();
      await restoreFromCsv(body.csvExport);
      return NextResponse.json({ ok: true, mode: 'csv' });
    } else {
      return NextResponse.json({ error: 'Missing jsonExport or csvExport in body.' }, { status: 400 });
    }
  } catch (e) {
    status = 500;
    return NextResponse.json({ error: 'Internal server error' }, { status });
  } finally {
    recordApiCall(req, status, Date.now() - start);
  }
}

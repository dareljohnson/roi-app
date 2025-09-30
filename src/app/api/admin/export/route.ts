import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/database'
import fs from 'fs/promises'
import path from 'path'
import { recordApiCall } from '@/lib/adminInsights'

function toCSV(rows: any[]): string {
  if (!rows.length) return ''
  const keys = Object.keys(rows[0])
  const header = keys.join(',')
  const data = rows.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','))
  return [header, ...data].join('\n')
}

export async function GET(req: NextRequest) {
  const start = Date.now();
  let status = 200;
  let session = null;
  try {
    session = await getServerSession(authOptions)
  } catch (err) {
    status = 401;
    return NextResponse.json({ error: 'Unauthorized' }, { status })
  }
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    status = 401;
    return NextResponse.json({ error: 'Unauthorized' }, { status })
  }
  try {
    // Read schema.prisma
    const schemaPath = path.join(process.cwd(), 'prisma', 'schema.prisma')
    let schema = ''
    try {
      schema = await fs.readFile(schemaPath, 'utf8')
    } catch (e) {
      schema = 'Could not read schema.prisma.'
    }
    // Export all tables as JSON and CSV
    const tables = [
      { name: 'users', data: await prisma.user.findMany() },
      { name: 'properties', data: await prisma.property.findMany() },
      { name: 'analyses', data: await prisma.analysis.findMany() },
      { name: 'walkThroughNotes', data: await prisma.walkThroughNote.findMany() },
      { name: 'documentationEntries', data: await prisma.documentationEntry.findMany() },
      { name: 'apiCallLogs', data: await prisma.apiCallLog.findMany() },
      { name: 'accounts', data: await prisma.account.findMany() },
      { name: 'sessions', data: await prisma.session.findMany() },
      { name: 'verification_tokens', data: await prisma.verificationToken.findMany() },
    ]
    const jsonExport: Record<string, any[]> = {}
    const csvExport: Record<string, string> = {}
    for (const t of tables) {
      jsonExport[t.name] = t.data
      csvExport[t.name] = toCSV(t.data)
    }
    return NextResponse.json({
      schema,
      jsonExport,
      csvExport,
    })
  } catch (e) {
    status = 500;
    console.error('Admin export error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status })
  } finally {
    recordApiCall(req, status, Date.now() - start);
  }
}
